import test from 'node:test';
import assert from 'node:assert/strict';

import { ApprovalDemo, FIELDS, USERS, clone, diff } from '../app/model.js';

const submitOptions = (demo, overrides = {}) => ({
  actor: USERS.pm,
  baseRevision: demo.product.revision,
  baseSnapshotId: demo.product.snapshot?.id ?? null,
  ...overrides,
});

const assertCode = (fn, code) => {
  assert.throws(fn, (error) => error && error.code === code);
};

test('exports the documented users and exact default configuration keys', () => {
  assert.deepEqual(USERS, {
    pm: { id: 'chen.xiao', name: '陈晓', role: '普通用户' },
    approver: { id: 'li.na', name: '李娜', role: '审批员' },
    admin: { id: 'wang.min', name: '王敏', role: '系统管理员' },
  });
  assert.deepEqual(new ApprovalDemo('listed').getDraft(), {
    name: 'W1 Lite',
    serviceModel: 'W1L-NA',
    platform: 'ROOT云',
    model: 'W1Lite',
    communication: 'BLE',
    app: 'momcozy',
    regions: ['北美'],
    listingMode: '部分放开',
    scopeMode: '国家 / 地区',
    effectiveMode: '立即生效',
    sharing: true,
    minVersion: '3.0.0',
  });
  assert.equal(FIELDS.length, 12);
  assert.deepEqual(
    Object.fromEntries(FIELDS.map(({ key, label }) => [key, label])),
    {
      name: '产品名称',
      serviceModel: '客服型号',
      platform: '所属平台',
      model: '产品型号',
      communication: '通讯方式',
      app: '所属App',
      regions: '发布区域',
      listingMode: '上架方式',
      scopeMode: '范围模式',
      effectiveMode: '生效时间',
      sharing: '产品共享',
      minVersion: '最低支持版本',
    },
  );
  assert.deepEqual(
    FIELDS.filter((field) => field.editable).map((field) => field.key),
    ['name', 'serviceModel', 'platform', 'regions', 'listingMode', 'scopeMode', 'effectiveMode', 'sharing', 'minVersion'],
  );
  assert.deepEqual(
    FIELDS.filter((field) => field.online).map((field) => field.key),
    ['name', 'serviceModel', 'platform', 'regions', 'listingMode', 'scopeMode', 'effectiveMode', 'sharing', 'minVersion'],
  );
});

test('null baseline lists all fields and regions compare as unordered sets', () => {
  const demo = new ApprovalDemo('listed');
  const target = demo.getDraft();
  const full = diff(null, target);
  assert.equal(full.length, FIELDS.length);
  assert.ok(full.every((row) => row.before === null));

  target.regions = ['欧洲', '北美'];
  const changed = diff(demo.product.snapshot.config, target);
  assert.equal(changed.length, 1);
  assert.equal(changed[0].key, 'regions');
  assert.deepEqual(changed[0].before, ['北美']);
  assert.deepEqual(changed[0].after, ['欧洲', '北美']);

  target.regions = ['北美'];
  target.serviceModel = '';
  assert.deepEqual(diff(demo.product.snapshot.config, target).map((row) => row.key), ['serviceModel']);

  assert.equal(diff({ regions: ['北美', '欧洲'] }, { regions: ['欧洲', '北美'] }).length, 0);
  assert.equal(diff({ regions: ['北美', '北美'] }, { regions: ['北美', '欧洲'] }).length, 1);
});

test('legacy initialization only fills a missing online snapshot and never overwrites it', () => {
  const legacy = new ApprovalDemo('legacy-listed');
  const initialized = legacy.product.snapshot;
  assert.equal(initialized.id, 'S001');
  assert.equal(initialized.source, '存量初始化');
  assert.deepEqual(initialized.config, legacy.product.config);
  assert.equal(legacy.initializeSnapshot(), initialized);
  assert.equal(legacy.product.snapshots.length, 1);

  const offline = new ApprovalDemo('legacy-offline');
  assert.equal(offline.initializeSnapshot(), null);
  assert.equal(offline.product.snapshot, null);

  const development = new ApprovalDemo('development');
  assert.equal(development.initializeSnapshot(), null);
  assert.equal(development.product.snapshot, null);
});

test('development saves repeatedly without creating a snapshot', () => {
  const demo = new ApprovalDemo('development');
  const first = demo.getDraft();
  first.name = '开发名称 1';
  assert.deepEqual(demo.saveOffline(first, submitOptions(demo)), { kind: 'saved' });
  assert.equal(demo.product.revision, 2);
  assert.equal(demo.product.snapshot, null);

  const second = demo.getDraft();
  second.name = '开发名称 2';
  assert.deepEqual(demo.saveOffline(second, submitOptions(demo)), { kind: 'saved' });
  assert.equal(demo.product.revision, 3);
  assert.equal(demo.product.snapshots.length, 0);
  assert.deepEqual(demo.audit, []);
  assert.equal(demo.applications.length, 0);
});

test('delisted saves add no records and keep S1 while re-listing compares the final offline state', () => {
  const demo = new ApprovalDemo('listed');
  const down = demo.submit('下架', demo.getDraft(), submitOptions(demo)).application;
  demo.decide(down.id, 'approve', { actor: USERS.approver });
  const existingAudit = clone(demo.audit);
  const existingHistory = clone(down.history);
  const originalS1 = demo.product.snapshot;
  const first = demo.getDraft();
  first.name = 'W1 Lite 离线一版';
  assert.equal(demo.saveOffline(first, submitOptions(demo)).kind, 'saved');

  const finalTarget = demo.getDraft();
  finalTarget.name = 'W1 Lite 离线终版';
  finalTarget.serviceModel = '';
  assert.equal(demo.saveOffline(finalTarget, submitOptions(demo)).kind, 'saved');
  assert.equal(demo.product.snapshot, originalS1);
  assert.equal(demo.product.snapshots.length, 1);
  assert.deepEqual(demo.audit, existingAudit);
  assert.deepEqual(down.history, existingHistory);
  assert.equal(demo.applications.length, 1);

  const submitted = demo.submit('上架', finalTarget, submitOptions(demo));
  assert.equal(submitted.kind, 'approval');
  assert.equal(submitted.application.diff.length, 2);
  assert.deepEqual(
    submitted.application.diff.map(({ key, before, after }) => ({ key, before, after })),
    [
      { key: 'name', before: 'W1 Lite', after: 'W1 Lite 离线终版' },
      { key: 'serviceModel', before: 'W1L-NA', after: '' },
    ],
  );
  assert.equal(submitted.application.baseSnapshot.id, 'S001');
});

test('an online detail submission with no real delta returns noop', () => {
  const demo = new ApprovalDemo('listed');
  const before = clone(demo.product);
  const result = demo.submit('详情变更', demo.getDraft(), submitOptions(demo));
  assert.deepEqual(result, { kind: 'noop' });
  assert.equal(demo.applications.length, 0);
  assert.deepEqual(demo.product, before);
});

test('up and down actions create approvals even when details equal the baseline', () => {
  const up = new ApprovalDemo('development');
  const upResult = up.submit('上架', up.getDraft(), submitOptions(up));
  assert.equal(upResult.kind, 'approval');
  assert.equal(upResult.application.action, '上架');
  assert.equal(upResult.application.targetStatus, '上架中');
  assert.equal(upResult.application.diff.length, FIELDS.length);

  const down = new ApprovalDemo('listed');
  const downResult = down.submit('下架', down.getDraft(), submitOptions(down));
  assert.equal(downResult.kind, 'approval');
  assert.equal(downResult.application.action, '下架');
  assert.equal(downResult.application.targetStatus, '已下架');
  assert.equal(downResult.application.diff.length, 0);
});

test('a down-shelf approval rejects any unapproved detail change', () => {
  const demo = new ApprovalDemo('listed');
  const target = demo.getDraft();
  target.name = '夹带修改';
  assertCode(
    () => demo.submit('下架', target, submitOptions(demo)),
    'DOWN_SHELF_DETAIL_CHANGE',
  );
  assert.equal(demo.applications.length, 0);
});

test('submitted base snapshots, targets and diffs are frozen and detached from inputs', () => {
  const demo = new ApprovalDemo('listed');
  const source = demo.getDraft();
  source.name = '冻结目标';
  const result = demo.submit('详情变更', source, submitOptions(demo));
  const { application } = result;
  source.name = '提交后继续修改';

  assert.equal(application.targetConfig.name, '冻结目标');
  assert.equal(application.baseSnapshot.id, 'S001');
  assert.ok(Object.isFrozen(application.targetConfig));
  assert.ok(Object.isFrozen(application.baseSnapshot.config));
  assert.equal(application.baseConfig.name, 'W1 Lite');
  assert.ok(Object.isFrozen(application.baseConfig));
  assert.ok(Object.isFrozen(application.diff));
  assert.throws(() => {
    application.targetConfig.name = '篡改目标';
  }, TypeError);
  assert.throws(() => {
    application.baseConfig.name = '篡改提交前值';
  }, TypeError);
  assert.throws(() => {
    application.diff.push({ key: 'fake' });
  }, TypeError);
});

test('successful online approvals roll S1 to S2 and compare a later revert against S2', () => {
  const demo = new ApprovalDemo('listed');
  const toB = demo.getDraft();
  toB.name = 'W1 Lite B';
  const first = demo.submit('详情变更', toB, submitOptions(demo)).application;
  assert.equal(first.baseSnapshot.id, 'S001');

  demo.decide(first.id, 'approve', { actor: USERS.approver });
  assert.equal(demo.product.snapshot.id, 'S002');
  assert.equal(demo.product.snapshot.config.name, 'W1 Lite B');
  assert.equal(demo.product.snapshot.source, '详情变更审批');
  assert.equal(first.appliedAt === null, false);

  const toA = demo.getDraft();
  toA.name = 'W1 Lite';
  const second = demo.submit('详情变更', toA, submitOptions(demo)).application;
  assert.equal(second.baseSnapshot.id, 'S002');
  assert.deepEqual(
    second.diff.map(({ key, before, after }) => ({ key, before, after })),
    [{ key: 'name', before: 'W1 Lite B', after: 'W1 Lite' }],
  );
  assert.equal(first.targetConfig.name, 'W1 Lite B');
  assert.equal(first.baseSnapshot.config.name, 'W1 Lite');

  demo.decide(second.id, 'approve', { actor: USERS.admin });
  assert.equal(demo.product.snapshot.id, 'S003');
  assert.equal(first.diff[0].before, 'W1 Lite');
});

test('a first listing without a snapshot exposes a full target with null before values', () => {
  const demo = new ApprovalDemo('development');
  const target = demo.getDraft();
  target.name = '首次上架产品';
  const result = demo.submit('上架', target, submitOptions(demo));
  assert.equal(result.application.baseSnapshot, null);
  assert.ok(result.application.diff.every((row) => row.before === null));
  assert.equal(result.application.diff.find((row) => row.key === 'name').after, '首次上架产品');

  demo.decide(result.application.id, 'approve', { actor: USERS.approver });
  assert.equal(demo.product.status, '上架中');
  assert.equal(demo.product.snapshot.id, 'S001');
  assert.equal(demo.product.snapshot.source, '上架审批');
});

test('failure, partial and unknown outcomes stay unapplied, locked, and keep S1', () => {
  for (const outcome of ['failure', 'partial', 'unknown']) {
    const demo = new ApprovalDemo('pending');
    const originalConfig = clone(demo.product.config);
    const originalSnapshot = demo.product.snapshot;
    const application = demo.getActive();
    demo.decide(application.id, 'approve', {
      actor: USERS.approver,
      outcome,
      reason: `${outcome} 模拟`,
    });

    assert.equal(application.status, '未生效');
    assert.ok(application.approvedAt);
    assert.equal(application.appliedAt, null);
    assert.deepEqual(demo.product.config, originalConfig);
    assert.equal(demo.product.snapshot, originalSnapshot);
    assert.equal(demo.getActive(), application);
    const expectedActions = {
      failure: '审批通过，应用失败',
      partial: '审批通过，部分应用待核实',
      unknown: '审批通过，应用结果未知',
    };
    assert.equal(application.history[application.history.length - 1].action, expectedActions[outcome]);
    assert.equal(demo.audit[demo.audit.length - 1].action, expectedActions[outcome]);
    assert.doesNotMatch(application.history[application.history.length - 1].action, /failure|partial|unknown/);
    assertCode(() => demo.saveOffline(demo.getDraft(), submitOptions(demo)), 'ACTIVE_APPROVAL');
  }
});

test('every approval result rechecks revision, snapshot and status before recording', () => {
  const cases = [
    ['success', 'REVISION_CONFLICT', (demo) => { demo.product.revision += 1; }],
    ['failure', 'REVISION_CONFLICT', (demo) => { demo.product.revision += 1; }],
    ['partial', 'REVISION_CONFLICT', (demo) => { demo.product.revision += 1; }],
    ['unknown', 'REVISION_CONFLICT', (demo) => { demo.product.revision += 1; }],
    ['unknown', 'SNAPSHOT_CONFLICT', (demo) => { demo.product.snapshot = null; }],
    ['failure', 'STATUS_CONFLICT', (demo) => { demo.product.status = '已下架'; }],
  ];

  for (const [outcome, code, corrupt] of cases) {
    const demo = new ApprovalDemo('pending');
    const application = demo.getActive();
    corrupt(demo);
    assertCode(
      () => demo.decide(application.id, 'approve', { actor: USERS.approver, outcome }),
      code,
    );
    assert.equal(application.status, '待审批');
    assert.equal(application.approvedAt, null);
    assert.equal(demo.getActive(), application);
  }
});

test('retry applies the frozen target once and later retries do not add snapshots', () => {
  const demo = new ApprovalDemo('unapplied');
  const application = demo.getActive();
  assert.equal(application.status, '未生效');
  assert.equal(demo.product.snapshot.id, 'S001');

  const retried = demo.retry(application.id, { actor: USERS.admin, outcome: 'success' });
  assert.equal(retried.status, '已生效');
  assert.equal(demo.product.config.name, 'W1 Lite Plus');
  assert.equal(demo.product.snapshot.id, 'S002');
  assert.equal(demo.product.snapshots.length, 2);

  const retriedAgain = demo.retry(application.id, { actor: USERS.admin, outcome: 'success' });
  assert.equal(retriedAgain, application);
  assert.equal(demo.product.snapshots.length, 2);
  assert.equal(demo.product.revision, 2);
});

test('failed retries use Chinese history and keep the application locked', () => {
  const expectedActions = {
    failure: '重试应用失败',
    partial: '重试部分应用待核实',
    unknown: '重试应用结果未知',
  };

  for (const outcome of ['failure', 'partial', 'unknown']) {
    const demo = new ApprovalDemo('unapplied');
    const application = demo.getActive();
    const revision = demo.product.revision;
    const snapshot = demo.product.snapshot;
    demo.retry(application.id, { actor: USERS.approver, outcome });

    assert.equal(application.status, '未生效');
    assert.equal(application.history[application.history.length - 1].action, expectedActions[outcome]);
    assert.equal(demo.audit[demo.audit.length - 1].action, expectedActions[outcome]);
    assert.equal(demo.product.revision, revision);
    assert.equal(demo.product.snapshot, snapshot);
    assert.equal(demo.getActive(), application);
  }
});

test('cancel requires explicit verification and never applies or advances the snapshot', () => {
  const demo = new ApprovalDemo('partial');
  const application = demo.getActive();
  const config = clone(demo.product.config);
  const snapshot = demo.product.snapshot;

  assertCode(
    () => demo.cancel(application.id, { actor: USERS.approver, verified: false }),
    'CANCEL_UNVERIFIED',
  );
  assert.equal(demo.getActive(), application);
  assert.deepEqual(demo.product.config, config);
  assert.equal(demo.product.snapshot, snapshot);

  demo.cancel(application.id, { actor: USERS.approver, verified: true });
  assert.equal(application.status, '已驳回');
  assert.equal(demo.getActive(), null);
  assert.deepEqual(demo.product.config, config);
  assert.equal(demo.product.snapshot, snapshot);
});

test('verified cancellation stops when formal data or its version has drifted', () => {
  const cases = [
    ['CANCEL_CONFIG_CONFLICT', (demo) => {
      const drifted = clone(demo.product.config);
      drifted.name = '外部偏离';
      demo.product.config = drifted;
    }],
    ['REVISION_CONFLICT', (demo) => { demo.product.revision += 1; }],
    ['SNAPSHOT_CONFLICT', (demo) => { demo.product.snapshot = null; }],
    ['STATUS_CONFLICT', (demo) => { demo.product.status = '已下架'; }],
  ];

  for (const [code, corrupt] of cases) {
    const demo = new ApprovalDemo('partial');
    const application = demo.getActive();
    corrupt(demo);
    assertCode(
      () => demo.cancel(application.id, { actor: USERS.approver, verified: true }),
      code,
    );
    assert.equal(application.status, '未生效');
    assert.equal(demo.getActive(), application);
  }
});

test('reject requires a reason, keeps the target unapplied, and unlocks the product', () => {
  const demo = new ApprovalDemo('pending');
  const application = demo.getActive();
  assertCode(() => demo.decide(application.id, 'reject', { actor: USERS.approver, reason: '  ' }), 'REASON_REQUIRED');

  demo.decide(application.id, 'reject', { actor: USERS.approver, reason: '参数不合规' });
  assert.equal(application.status, '已驳回');
  assert.equal(application.reason, '参数不合规');
  assert.equal(demo.product.config.name, 'W1 Lite');
  assert.equal(demo.getActive(), null);
  assert.equal(demo.product.snapshot.id, 'S001');
});

test('role isolation, self-review prevention, and visibility follow the active actor', () => {
  const pending = new ApprovalDemo('pending');
  assert.equal(pending.visibleApplications(USERS.pm, 'initiated').length, 1);
  assert.equal(pending.visibleApplications(USERS.pm, 'review').length, 1);
  assert.equal(pending.visibleApplications(USERS.approver, 'review').length, 1);
  assert.equal(pending.visibleApplications(USERS.admin, 'review').length, 1);
  assert.equal(pending.visibleApplications(USERS.approver, 'initiated').length, 0);
  assertCode(
    () => pending.decide(pending.getActive().id, 'approve', { actor: USERS.pm }),
    'FORBIDDEN',
  );

  const selfReview = new ApprovalDemo('listed');
  const target = selfReview.getDraft();
  target.name = '审批员提交';
  const ownApplication = selfReview.submit('详情变更', target, submitOptions(selfReview, { actor: USERS.approver })).application;
  assertCode(
    () => selfReview.decide(ownApplication.id, 'approve', { actor: USERS.approver }),
    'SELF_APPROVAL',
  );
});

test('withdraw is limited to the applicant while pending and never advances the snapshot', () => {
  const demo = new ApprovalDemo('pending');
  const application = demo.getActive();
  const snapshot = demo.product.snapshot;
  assertCode(() => demo.withdraw(application.id, { actor: USERS.admin }), 'FORBIDDEN');
  demo.withdraw(application.id, { actor: USERS.pm });
  assert.equal(application.status, '已撤销');
  assert.equal(demo.getActive(), null);
  assert.equal(demo.product.snapshot, snapshot);
});

test('an external change rejects stale revision and stale snapshot drafts', () => {
  const demo = new ApprovalDemo('listed');
  const staleRevision = demo.product.revision;
  demo.simulateExternalChange();
  assert.equal(demo.product.revision, staleRevision + 1);
  assert.equal(demo.product.snapshot.id, 'S002');
  assert.equal(demo.product.config.name, 'W1 Lite · 已更新');

  const target = demo.getDraft();
  target.name = '旧草稿提交';
  assertCode(
    () => demo.submit('详情变更', target, submitOptions(demo, { baseRevision: staleRevision })),
    'REVISION_CONFLICT',
  );
  assertCode(
    () => demo.submit('详情变更', target, submitOptions(demo, { baseSnapshotId: 'S001' })),
    'SNAPSHOT_CONFLICT',
  );
  assert.equal(demo.applications.length, 0);
});

test('snapshot drift stops online submission for verification', () => {
  const demo = new ApprovalDemo('drift');
  assert.notDeepEqual(demo.product.config, demo.product.snapshot.config);
  assertCode(
    () => demo.submit('详情变更', demo.getDraft(), submitOptions(demo)),
    'SNAPSHOT_DRIFT',
  );
  assertCode(
    () => demo.submit('下架', demo.getDraft(), submitOptions(demo)),
    'SNAPSHOT_DRIFT',
  );
  assert.equal(demo.applications.length, 0);
});

test('undefined, immutable, invalid and version-format fields are rejected', () => {
  const demo = new ApprovalDemo('listed');
  const withUnknown = demo.getDraft();
  withUnknown.offlineOnly = true;
  assertCode(() => demo.preview(withUnknown), 'UNKNOWN_FIELD');

  const immutable = demo.getDraft();
  immutable.communication = 'Wi-Fi';
  assertCode(() => demo.preview(immutable), 'IMMUTABLE_FIELD');

  const blankName = demo.getDraft();
  blankName.name = ' ';
  assertCode(() => demo.preview(blankName), 'INVALID_FIELD');

  const noRegions = demo.getDraft();
  noRegions.regions = [];
  assertCode(() => demo.preview(noRegions), 'INVALID_FIELD');

  const badVersion = demo.getDraft();
  badVersion.minVersion = 'v3.0';
  assertCode(() => demo.preview(badVersion), 'INVALID_FIELD');

  const emptyServiceModel = demo.getDraft();
  emptyServiceModel.serviceModel = '';
  assert.equal(demo.preview(emptyServiceModel).length, 1);
});

test('user-facing field errors use product-page wording without implementation terms', () => {
  const demo = new ApprovalDemo('listed');

  const invalidSharing = demo.getDraft();
  invalidSharing.sharing = 'true';
  assert.throws(() => demo.preview(invalidSharing), (error) => {
    assert.equal(error.code, 'INVALID_FIELD');
    assert.match(error.message, /产品共享/);
    assert.doesNotMatch(error.message, /布尔值|boolean/i);
    return true;
  });

  const invalidVersion = demo.getDraft();
  invalidVersion.minVersion = 'v3';
  assert.throws(() => demo.preview(invalidVersion), (error) => {
    assert.equal(error.code, 'INVALID_FIELD');
    assert.match(error.message, /最低支持版本/);
    assert.doesNotMatch(error.message, /semver/i);
    return true;
  });
});

test('a successful down-shelf approval changes status and revision but retains S1', () => {
  const demo = new ApprovalDemo('listed');
  const s1 = demo.product.snapshot;
  const application = demo.submit('下架', demo.getDraft(), submitOptions(demo)).application;
  demo.decide(application.id, 'approve', { actor: USERS.approver });

  assert.equal(demo.product.status, '已下架');
  assert.equal(demo.product.revision, 2);
  assert.equal(demo.product.snapshot, s1);
  assert.equal(demo.product.snapshots.length, 1);
  assert.equal(application.appliedAt === null, false);
});

test('the active approval lock blocks offline edits and additional submissions', () => {
  const demo = new ApprovalDemo('pending');
  const target = demo.getDraft();
  target.name = '后到提交';
  assertCode(
    () => demo.submit('详情变更', target, submitOptions(demo)),
    'ACTIVE_APPROVAL',
  );
  assertCode(
    () => demo.saveOffline(target, submitOptions(demo)),
    'ACTIVE_APPROVAL',
  );
  assert.equal(demo.applications.length, 1);
  assert.equal(demo.product.config.name, 'W1 Lite');
});

test('the status matrix rejects actions at the wrong product status', () => {
  const development = new ApprovalDemo('development');
  assertCode(
    () => development.submit('详情变更', development.getDraft(), submitOptions(development)),
    'INVALID_STATUS',
  );
  assertCode(
    () => development.submit('下架', development.getDraft(), submitOptions(development)),
    'INVALID_STATUS',
  );

  const listed = new ApprovalDemo('listed');
  assertCode(
    () => listed.submit('上架', listed.getDraft(), submitOptions(listed)),
    'INVALID_STATUS',
  );
  assertCode(
    () => listed.saveOffline(listed.getDraft(), submitOptions(listed)),
    'INVALID_STATUS',
  );
});
