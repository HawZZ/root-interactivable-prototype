const PRODUCT_ID = '2075767415740338177';
const PRODUCT_NAME = 'W1 Lite';
const APPROVAL_DATE = '20261022';

const CURRENT_ONLINE_STATUSES = new Set(['上架中', '已上架']);
const ACTIVE_APPROVAL_STATUSES = new Set(['待审批', '未生效']);
const REVIEW_ROLES = new Set(['审批员', '系统管理员']);
const VALID_OUTCOMES = new Set(['success', 'failure', 'partial', 'unknown']);
const OUTCOME_TEXT = Object.freeze({
  success: '应用成功',
  failure: '应用失败',
  partial: '部分应用待核实',
  unknown: '应用结果未知',
});

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function deepEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right || left === null || right === null) return false;
  if (typeof left !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left)) {
    return left.length === right.length && left.every((value, index) => deepEqual(value, right[index]));
  }
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key]));
}

function regionSetEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  const leftValues = new Set(left);
  const rightValues = new Set(right);
  return leftValues.size === rightValues.size
    && [...leftValues].every((value) => rightValues.has(value));
}

function valuesEqual(key, left, right) {
  if (key === 'regions') return regionSetEqual(left, right);
  return deepEqual(left, right);
}

export const clone = (value) => structuredClone(value);

const nowIso = () => new Date().toISOString();

export const USERS = deepFreeze({
  pm: { id: 'chen.xiao', name: '陈晓', role: '普通用户' },
  approver: { id: 'li.na', name: '李娜', role: '审批员' },
  admin: { id: 'wang.min', name: '王敏', role: '系统管理员' },
});

export const FIELDS = deepFreeze([
  { key: 'name', label: '产品名称', type: 'text', editable: true, online: true, required: true, options: undefined },
  { key: 'serviceModel', label: '客服型号', type: 'text', editable: true, online: true, required: false, options: undefined },
  { key: 'platform', label: '所属平台', type: 'select', editable: true, online: true, options: ['ROOT云', '涂鸦云'] },
  { key: 'model', label: '产品型号', type: 'text', editable: false, online: false },
  { key: 'communication', label: '通讯方式', type: 'text', editable: false, online: false },
  { key: 'app', label: '所属App', type: 'text', editable: false, online: false },
  { key: 'regions', label: '发布区域', type: 'multi-select', editable: true, online: true, required: true, options: ['北美', '欧洲', '亚太', '中国'] },
  { key: 'listingMode', label: '上架方式', type: 'select', editable: true, online: true, options: ['部分放开', '全面放开'] },
  { key: 'scopeMode', label: '范围模式', type: 'select', editable: true, online: true, options: ['国家 / 地区', '数据中心'] },
  { key: 'effectiveMode', label: '生效时间', type: 'select', editable: true, online: true, options: ['立即生效', '定时生效'] },
  { key: 'sharing', label: '产品共享', type: 'boolean', editable: true, online: true },
  { key: 'minVersion', label: '最低支持版本', type: 'semver', editable: true, online: true },
]);

const DEFAULT_CONFIG = deepFreeze({
  name: PRODUCT_NAME,
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

const CONFIG_KEYS = new Set(FIELDS.map((field) => field.key));
const READONLY_FIELDS = FIELDS.filter((field) => !field.editable);

function businessError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function resolveActor(actor) {
  if (!actor || typeof actor !== 'object' || typeof actor.id !== 'string') {
    throw businessError('FORBIDDEN', '当前用户无有效身份');
  }
  const user = Object.values(USERS).find((candidate) => candidate.id === actor.id);
  if (!user) throw businessError('FORBIDDEN', '当前用户无有效身份');
  return user;
}

function hasReviewRole(actor) {
  return REVIEW_ROLES.has(actor.role);
}

function assertNoSelfReview(application, actor) {
  if (!hasReviewRole(actor)) {
    throw businessError('FORBIDDEN', '仅审批员或系统管理员可执行审批操作');
  }
  if (actor.id === application.applicantId) {
    throw businessError('SELF_APPROVAL', '提交人不可审批自己的申请');
  }
}

function validateTarget(target, reference) {
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    throw businessError('INVALID_TARGET', '目标配置必须是完整对象');
  }

  const keys = Object.keys(target);
  const unknown = keys.filter((key) => !CONFIG_KEYS.has(key));
  if (unknown.length) {
    throw businessError('UNKNOWN_FIELD', `存在未定义字段：${unknown.join('、')}`);
  }
  const missing = FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(target, field.key));
  if (missing.length) {
    throw businessError('INCOMPLETE_CONFIG', `目标配置缺少字段：${missing.map((field) => field.label).join('、')}`);
  }

  if (typeof target.name !== 'string' || !target.name.trim() || target.name.length > 50) {
    throw businessError('INVALID_FIELD', '产品名称必填且不超过 50 个字符');
  }
  if (typeof target.serviceModel !== 'string' || target.serviceModel.length > 50) {
    throw businessError('INVALID_FIELD', '客服型号不能超过 50 个字符');
  }
  if (!Array.isArray(target.regions) || target.regions.length < 1) {
    throw businessError('INVALID_FIELD', '发布区域至少选择 1 项');
  }
  const allowedRegions = new Set(FIELDS.find((field) => field.key === 'regions').options);
  if (target.regions.some((region) => typeof region !== 'string' || !allowedRegions.has(region))) {
    throw businessError('INVALID_FIELD', '发布区域包含无效选项');
  }
  if (new Set(target.regions).size !== target.regions.length) {
    throw businessError('INVALID_FIELD', '发布区域不能重复');
  }
  if (typeof target.sharing !== 'boolean') {
    throw businessError('INVALID_FIELD', '产品共享需选择开启或关闭');
  }
  if (typeof target.minVersion !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(target.minVersion)) {
    throw businessError('INVALID_FIELD', '最低支持版本需按 x.y.z 格式填写，例如 3.0.0');
  }
  for (const key of ['platform', 'model', 'communication', 'app']) {
    if (typeof target[key] !== 'string' || !target[key].trim()) {
      const field = FIELDS.find((candidate) => candidate.key === key);
      throw businessError('INVALID_FIELD', `${field.label}不能为空`);
    }
  }

  for (const field of FIELDS.filter(field => field.type === 'select')) {
    if (!field.options.includes(target[field.key])) throw businessError('INVALID_FIELD', field.label + '包含无效选项');
  }
  for (const field of READONLY_FIELDS) {
    if (!valuesEqual(field.key, reference[field.key], target[field.key])) {
      throw businessError('IMMUTABLE_FIELD', `${field.label}为不可修改字段`);
    }
  }

  return clone(target);
}

function isCurrentOnline(status) {
  return CURRENT_ONLINE_STATUSES.has(status);
}

export function diff(before, target) {
  const rows = [];
  for (const field of FIELDS) {
    const beforeValue = before === null ? null : before?.[field.key];
    const afterValue = target?.[field.key];
    if (before === null || !valuesEqual(field.key, beforeValue, afterValue)) {
      rows.push({
        key: field.key,
        label: field.label,
        before: clone(beforeValue),
        after: clone(afterValue),
      });
    }
  }
  return rows;
}

function configsEqual(left, right) {
  return diff(left, right).length === 0;
}

function createFrozenDiff(before, target) {
  return deepFreeze(diff(before, target));
}

export class ApprovalDemo {
  constructor(scenario = 'listed') {
    this.scenario = scenario;
    this.product = {
      id: PRODUCT_ID,
      status: '开发中',
      revision: 1,
      config: deepFreeze(clone(DEFAULT_CONFIG)),
      snapshot: null,
      snapshots: [],
    };
    this.applications = [];
    this.audit = [];
    this.snapshotSequence = 0;
    this.approvalSequence = 0;

    switch (scenario) {
      case 'listed':
      case 'empty':
        this.product.status = '已上架';
        this._createSnapshot(this.product.config, '上架审批');
        break;
      case 'delisted':
        this.product.status = '已下架';
        this._createSnapshot(this.product.config, '上架审批');
        break;
      case 'development':
        this.product.status = '开发中';
        break;
      case 'legacy-listed':
        this.product.status = '已上架';
        this.initializeSnapshot();
        break;
      case 'legacy-offline':
        this.product.status = '已下架';
        break;
      case 'pending':
      case 'unapplied':
      case 'partial': {
        this.product.status = '已上架';
        this._createSnapshot(this.product.config, '上架审批');
        const target = clone(DEFAULT_CONFIG);
        target.name = `${PRODUCT_NAME} Plus`;
        const result = this.submit('详情变更', target, {
          actor: USERS.pm,
          baseRevision: this.product.revision,
          baseSnapshotId: this.product.snapshot.id,
        });
        if (scenario !== 'pending') {
          this.decide(result.application.id, 'approve', {
            actor: USERS.approver,
            outcome: scenario === 'partial' ? 'partial' : 'failure',
            reason: scenario === 'partial' ? '部分应用待核对' : '应用失败待重试',
          });
        }
        break;
      }
      case 'drift': {
        this.product.status = '已上架';
        this._createSnapshot(this.product.config, '上架审批');
        const drifted = clone(this.product.config);
        drifted.name = `${PRODUCT_NAME} · 外部不一致`;
        this.product.config = deepFreeze(drifted);
        this.product.revision += 1;
        break;
      }
      default:
        throw businessError('INVALID_SCENARIO', `未知场景：${scenario}`);
    }
  }

  getActive() {
    return this.applications.find((application) => ACTIVE_APPROVAL_STATUSES.has(application.status)) ?? null;
  }

  initializeSnapshot() {
    if (this.getActive()) return null;
    if (!isCurrentOnline(this.product.status)) return null;
    if (this.product.snapshot) return this.product.snapshot;

    const snapshot = this._createSnapshot(this.product.config, '存量初始化');
    this._recordAudit('系统', '初始化为存量快照', this.product.status);
    return snapshot;
  }

  getDraft() {
    return clone(this.product.config);
  }

  preview(target) {
    const validated = validateTarget(target, this.product.config);
    return diff(this.product.snapshot?.config ?? null, validated);
  }

  saveOffline(target, { actor, baseRevision, baseSnapshotId } = {}) {
    resolveActor(actor);
    this._assertNoActive();
    if (!['开发中', '已下架'].includes(this.product.status)) {
      throw businessError('INVALID_STATUS', '仅开发中或已下架产品可直接保存');
    }
    this._assertBase(baseRevision, baseSnapshotId);

    const validated = validateTarget(target, this.product.config);
    if (configsEqual(this.product.config, validated)) return { kind: 'noop' };

    this.product.config = deepFreeze(validated);
    this.product.revision += 1;
    return { kind: 'saved' };
  }

  submit(action, target, { actor, baseRevision, baseSnapshotId } = {}) {
    const user = resolveActor(actor);
    this._assertNoActive();
    if (!['详情变更', '上架', '下架'].includes(action)) {
      throw businessError('INVALID_ACTION', '未知的审批动作');
    }
    this._assertBase(baseRevision, baseSnapshotId);

    const validated = validateTarget(target, this.product.config);

    if (action === '详情变更' && !isCurrentOnline(this.product.status)) {
      throw businessError('INVALID_STATUS', '仅上架中或已上架产品可提交详情变更');
    }
    if (action === '上架' && !['开发中', '已下架'].includes(this.product.status)) {
      throw businessError('INVALID_STATUS', '仅开发中或已下架产品可提交上架');
    }
    if (action === '下架' && !isCurrentOnline(this.product.status)) {
      throw businessError('INVALID_STATUS', '仅上架中或已上架产品可提交下架');
    }

    if (isCurrentOnline(this.product.status)) {
      if (!this.product.snapshot) this.initializeSnapshot();
      if (!this.product.snapshot) {
        throw businessError('SNAPSHOT_REQUIRED', '上架产品缺少有效快照');
      }
      if (!configsEqual(this.product.snapshot.config, this.product.config)) {
        throw businessError('SNAPSHOT_DRIFT', '正式配置与有效快照不一致，请停止提交并核实');
      }
    }

    if (action === '下架' && !configsEqual(this.product.config, validated)) {
      throw businessError('DOWN_SHELF_DETAIL_CHANGE', '下架申请不能夹带详情修改，请先完成所需审批');
    }

    const baseSnapshot = this.product.snapshot;
    const comparisonBase = baseSnapshot?.config ?? null;
    const frozenDiff = createFrozenDiff(comparisonBase, validated);
    if (action === '详情变更' && frozenDiff.length === 0) return { kind: 'noop' };

    const submittedAt = nowIso();
    const application = {
      id: this._nextApprovalId(),
      productId: this.product.id,
      productName: this.product.config.name,
      action,
      status: '待审批',
      applicantId: user.id,
      applicantName: user.name,
      submittedAt,
      baseSnapshot: baseSnapshot ? deepFreeze(clone(baseSnapshot)) : null,
      baseConfig: deepFreeze(clone(this.product.config)),
      targetConfig: deepFreeze(clone(validated)),
      diff: frozenDiff,
      baseRevision: this.product.revision,
      baseStatus: this.product.status,
      targetStatus: action === '上架' ? '上架中' : action === '下架' ? '已下架' : this.product.status,
      history: [{ operator: user.name, at: submittedAt, action: '提交审批', status: '待审批' }],
      approvedAt: null,
      appliedAt: null,
    };

    this.applications.push(application);
    this._recordAudit(user.name, `提交${action}审批`, '待审批');
    return { kind: 'approval', application };
  }

  decide(id, decision, { actor, outcome = 'success', reason = '' } = {}) {
    const user = resolveActor(actor);
    const application = this._findApplication(id);
    assertNoSelfReview(application, user);
    if (application.status !== '待审批') {
      throw businessError('INVALID_TRANSITION', '仅待审批申请可执行审批决定');
    }
    if (!['approve', 'reject'].includes(decision)) {
      throw businessError('INVALID_DECISION', '审批决定必须为 approve 或 reject');
    }

    if (decision === 'reject') {
      if (typeof reason !== 'string' || !reason.trim()) {
        throw businessError('REASON_REQUIRED', '驳回时必须填写原因');
      }
      application.status = '已驳回';
      application.reason = reason.trim();
      application.result = { outcome: 'rejected' };
      application.history.push({
        operator: user.name,
        at: nowIso(),
        action: '驳回',
        status: application.status,
      });
      this._recordAudit(user.name, '驳回申请', application.status);
      return application;
    }

    if (!VALID_OUTCOMES.has(outcome)) {
      throw businessError('INVALID_OUTCOME', '未知的应用结果');
    }

    this._assertApplyPrecondition(application);

    if (outcome !== 'success') {
      const decidedAt = nowIso();
      const action = `审批通过，${OUTCOME_TEXT[outcome]}`;
      application.approvedAt = decidedAt;
      application.status = '未生效';
      application.result = { outcome, reason: reason.trim() || undefined };
      application.history.push({
        operator: user.name,
        at: decidedAt,
        action,
        status: application.status,
      });
      this._recordAudit(user.name, action, application.status);
      return application;
    }

    application.approvedAt = nowIso();
    this._applyApplication(application, user);
    return application;
  }

  retry(id, { actor, outcome = 'success' } = {}) {
    const user = resolveActor(actor);
    const application = this._findApplication(id);
    assertNoSelfReview(application, user);
    if (application.status === '已生效') return application;
    if (application.status !== '未生效') {
      throw businessError('INVALID_TRANSITION', '仅未生效申请可重试');
    }
    if (!VALID_OUTCOMES.has(outcome)) {
      throw businessError('INVALID_OUTCOME', '未知的应用结果');
    }

    this._assertApplyPrecondition(application);
    if (outcome === 'success') {
      this._applyApplication(application, user);
      return application;
    }

    const action = `重试${OUTCOME_TEXT[outcome]}`;
    application.result = { outcome };
    application.history.push({
      operator: user.name,
      at: nowIso(),
      action,
      status: '未生效',
    });
    this._recordAudit(user.name, action, '未生效');
    return application;
  }

  cancel(id, { actor, verified = false } = {}) {
    const user = resolveActor(actor);
    const application = this._findApplication(id);
    assertNoSelfReview(application, user);
    if (application.status !== '未生效') {
      throw businessError('INVALID_TRANSITION', '仅未生效申请可核对后取消');
    }
    if (verified !== true) {
      throw businessError('CANCEL_UNVERIFIED', '必须确认目标未生效或正式数据已恢复后才能取消');
    }
    this._assertApplyPrecondition(application);
    if (!application.baseConfig || !configsEqual(this.product.config, application.baseConfig)) {
      throw businessError('CANCEL_CONFIG_CONFLICT', '正式产品配置已偏离提交前值，不能取消申请，请重新核实');
    }

    application.status = '已驳回';
    application.result = { outcome: 'cancelled' };
    application.history.push({
      operator: user.name,
      at: nowIso(),
      action: '核对后取消',
      status: application.status,
    });
    this._recordAudit(user.name, '核对未生效后取消', application.status);
    return application;
  }

  withdraw(id, { actor } = {}) {
    const user = resolveActor(actor);
    const application = this._findApplication(id);
    if (application.status !== '待审批') {
      throw businessError('INVALID_TRANSITION', '仅待审批申请可撤销');
    }
    if (application.applicantId !== user.id) {
      throw businessError('FORBIDDEN', '仅提交人可撤销申请');
    }

    application.status = '已撤销';
    application.result = { outcome: 'withdrawn' };
    application.history.push({
      operator: user.name,
      at: nowIso(),
      action: '撤销申请',
      status: application.status,
    });
    this._recordAudit(user.name, '撤销申请', application.status);
    return application;
  }

  visibleApplications(actor, tab = 'initiated') {
    const user = resolveActor(actor);
    if (!['initiated', 'review'].includes(tab)) {
      throw businessError('INVALID_TAB', '未知的审批列表分类');
    }
    if (hasReviewRole(user) && tab === 'review') return [...this.applications];
    return this.applications.filter((application) => application.applicantId === user.id);
  }

  simulateExternalChange() {
    this._assertNoActive();
    const changed = clone(this.product.config);
    changed.name = `${changed.name} · 已更新`;
    this.product.config = deepFreeze(changed);
    this.product.revision += 1;
    if (isCurrentOnline(this.product.status)) {
      this._createSnapshot(this.product.config, '外部审批生效');
    }
    this._recordAudit('外部系统', '模拟外部审批生效', this.product.status);
    return this.product.snapshot;
  }

  _assertNoActive() {
    if (this.getActive()) {
      throw businessError('ACTIVE_APPROVAL', '当前产品已有待审批或未生效申请');
    }
  }

  _assertBase(baseRevision, baseSnapshotId) {
    if (baseRevision !== this.product.revision) {
      throw businessError('REVISION_CONFLICT', '草稿版本已过期，请重新加载');
    }
    const currentSnapshotId = this.product.snapshot?.id ?? null;
    if ((baseSnapshotId ?? null) !== currentSnapshotId) {
      throw businessError('SNAPSHOT_CONFLICT', '有效快照已变化，请重新加载');
    }
  }

  _assertApplyPrecondition(application) {
    if (this.product.revision !== application.baseRevision) {
      throw businessError('REVISION_CONFLICT', '正式配置版本已变化，不能确认审批结果');
    }
    const currentSnapshotId = this.product.snapshot?.id ?? null;
    const frozenSnapshotId = application.baseSnapshot?.id ?? null;
    if (currentSnapshotId !== frozenSnapshotId) {
      throw businessError('SNAPSHOT_CONFLICT', '有效快照已变化，不能确认审批结果');
    }
    if (this.product.status !== application.baseStatus) {
      throw businessError('STATUS_CONFLICT', '产品状态已变化，不能确认审批结果');
    }
  }

  _applyApplication(application, actor) {
    const appliedAt = nowIso();
    this.product.config = deepFreeze(clone(application.targetConfig));
    this.product.status = application.targetStatus;
    this.product.revision += 1;

    if (application.action !== '下架') {
      const source = application.action === '上架' ? '上架审批' : '详情变更审批';
      this._createSnapshot(this.product.config, source);
    }

    application.status = '已生效';
    application.appliedAt = appliedAt;
    application.result = { outcome: 'success' };
    application.history.push({
      operator: actor.name,
      at: appliedAt,
      action: '通过并生效',
      status: application.status,
    });
    this._recordAudit(actor.name, '审批通过并生效', application.status);
  }

  _findApplication(id) {
    const application = this.applications.find((candidate) => candidate.id === id);
    if (!application) throw businessError('NOT_FOUND', '未找到对应申请');
    return application;
  }

  _nextApprovalId() {
    this.approvalSequence += 1;
    return `AP-${APPROVAL_DATE}-${String(this.approvalSequence).padStart(3, '0')}`;
  }

  _createSnapshot(config, source) {
    this.snapshotSequence += 1;
    const snapshot = deepFreeze({
      id: `S${String(this.snapshotSequence).padStart(3, '0')}`,
      version: this.product.revision,
      config: deepFreeze(clone(config)),
      source,
      createdAt: nowIso(),
    });
    this.product.snapshots.push(snapshot);
    this.product.snapshot = snapshot;
    return snapshot;
  }

  _recordAudit(operator, action, status) {
    const entry = { operator, at: nowIso(), action };
    if (status !== undefined) entry.status = status;
    this.audit.push(entry);
  }
}
