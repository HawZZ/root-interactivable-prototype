/* Firmware scope management shares the existing product page and fixed package references. */
(() => {
  const labels = { company: "公司用户", mac: "指定 MAC", whitelist: "外部授权白名单", public: "所有用户" };
  const clone = value => structuredClone(value);
  const heldDevices = new Map();
  const archive = [];
  const day = 86400000;
  let draft = null;
  let importRows = [];
  let importSelections = new Set();
  let failure = "";

  function mode(target) {
    return target.scopeMode || (target.status === "测试中" ? (trialOccupied(target.id) ? "mac" : target.whitelistOpenedAt ? "whitelist" : "company") : ["发布中", "已发布"].includes(target.status) ? "public" : "company");
  }
  function publicRegions() {
    const product = products[state.product];
    if (product.status !== "已上架") return [];
    return currentProductListingRangeOptions().filter(region => !(["测试中", "已通过"].includes(state.gateStatus) && region === regionalGate.region));
  }
  function coverage(target, now = Date.now()) {
    const config = target.releaseConfig;
    if (!config) return 0;
    if (target.status === "已发布") return 100;
    if (target.releasePaused) return config.coverage || 0;
    if (config.mode === "全面发布") return 100;
    const elapsed = Math.max(0, Math.floor((now - config.startedAt) / day));
    return Math.min(100, Math.max(config.coverage || 0, Math.ceil((elapsed + 1) * 100 / Number(config.batchDays))));
  }
  function reconcile() {
    const allowed = publicRegions();
    let changed = false;
    allFirmwareTargets().filter(target => mode(target) === "public" && target.releaseConfig).forEach(target => {
      const removed = target.releaseConfig.range.filter(region => !allowed.includes(region));
      if (removed.length) {
        target.revokedRegions = [...new Set([...(target.revokedRegions || []), ...removed])];
        target.releaseConfig.range = target.releaseConfig.range.filter(region => allowed.includes(region));
        target.scopeRevision++;
        changed = true;
      }
    });
    return changed;
  }
  function fingerprint(target) {
    return JSON.stringify({ target, trial: trialFor(target.id) });
  }
  function canRoute(target, route) {
    if (!Object.keys(labels).includes(route)) return false;
    return ["开发中", "测试中"].includes(target.status) ? true : ["发布中", "已发布"].includes(target.status) ? route === "public" : false;
  }
  function eligibleExternalUsers() {
    return whitelistUsers.filter(user => user.type === "外部用户" && user.products.includes(products[state.product].name));
  }
  function callerUser(request) {
    const identity = request.userId || request.user || request.account;
    return identity ? whitelistUsers.find(user => [user.id, user.email, user.phone].includes(identity)) : null;
  }
  function makeDraft(target) {
    const route = target.status === "开发中" && scheduledReleasePending(target) ? "public" : mode(target);
    const legacyTags = target.whitelistFilter === "tags";
    const userIds = legacyTags ? eligibleExternalUsers().filter(user => user.tags.some(tag => (target.whitelistTags || []).includes(tag))).map(user => user.id) : target.whitelistUserIds || [];
    return { id: target.id, route, original: fingerprint(target), trial: clone(trialFor(target.id) || { label: target.version, apps: [], status: "运行中", devices: [] }), filter: legacyTags ? "specified" : target.whitelistFilter || "all", userIds: clone(userIds), userTag: "", userSearch: "", migrations: [], release: clone(target.releaseConfig || { mode: "自动发布", range: [], batchDays: "5", upgradeMode: "提示升级", effectiveAt: "立即生效", time: "" }) };
  }
  function errorFor(target, next) {
    if (!target || !canRoute(target, next.route)) return "当前生命周期不允许该范围。";
    if (fingerprint(target) !== next.original) return "版本或定向配置已变化，请重新打开设置范围。";
    if (scheduledReleasePending(target)) return "请先取消定时发布，再修改生效范围。";
    if (target.referenceReview) return "虚拟版本包引用待核对，不能扩大投放。";
    if (next.route === "mac") {
      if (next.trial.apps.some(app => !/^\d+(?:\.\d+)*$/.test(app) || !experienceAppMatchesFirmware(app, target))) return "填写具体 APP 版本号，且必须全部符合固件兼容版本范围。";
      const seen = new Set();
      for (const device of next.trial.devices) {
        if (seen.has(device.mac)) return "MAC 名单重复，整批不生效。";
        seen.add(device.mac);
        const occupied = activeDirectedIds().find(id => id !== target.id && trialFor(id).devices.some(row => row.mac === device.mac));
        const migration = next.migrations.find(row => row.mac === device.mac);
        if (occupied && (!migration || migration.source !== occupied)) return "MAC 被其他目标占用，须明确确认迁移。";
        if (migration) {
          const source = targetById(migration.source);
          if (!source || fingerprint(source) !== migration.original || scheduledReleasePending(source)) return "原目标已变化或待定时发布，整批迁移未写入。";
          const old = trialFor(source.id)?.devices.find(row => row.mac === device.mac);
          const asset = directedAssetInventory[device.mac];
          const current = assetVersionForTarget(asset, target);
          if (!old || old.authorization === "已失效" || !assetFitsTarget(asset, target) || !current || compareVersion(current, target.version) > 0) return "迁移资格、路径或版本校验失败，整批未写入。";
        }
        if (device.authorization !== "已失效" && device.current && compareVersion(device.current, target.version) > 0) return "当前版本高于目标，禁止降级。";
      }
    }
    if (next.route === "whitelist") {
      if (!["all", "specified"].includes(next.filter)) return "请选择全部或指定已授权外部用户。";
      if (next.filter === "specified") {
        if (!next.userIds.length) return "请勾选至少一名已授权当前产品的外部用户。";
        const eligible = new Set(eligibleExternalUsers().map(user => user.id));
        if (next.userIds.some(id => !eligible.has(id))) return "已选用户的当前产品授权或用户类型已变化，请清除无效选择后重新提交。";
      }
    }
    if (next.route === "public") {
      if (!next.release.range.length || next.release.range.some(region => !publicRegions().includes(region))) return "正式范围须为当前产品公开上架范围的非空子集。";
      if (next.release.mode === "自动发布" && !/^[1-9]\d*$/.test(next.release.batchDays)) return "自动发布天数须为正整数。";
      if (target.status === "已发布" && next.release.mode !== "全面发布") return "已发布不能改为自动发布而回退。";
      if (["发布中", "已发布"].includes(target.status) && (next.release.batchDays !== target.releaseConfig.batchDays || next.release.effectiveAt !== target.releaseConfig.effectiveAt || next.release.time !== target.releaseConfig.time)) return "发布开始后不重设总天数或生效时间。";
      if (next.release.effectiveAt === "定时生效" && (!next.release.time || !Number.isFinite(Date.parse(next.release.time)))) return "请选择有效的定时发布时间。";
      if (["开发中", "测试中"].includes(target.status) && next.release.effectiveAt === "定时生效" && Date.parse(next.release.time) <= Date.now()) return "定时发布时间必须晚于当前时间。";
    }
    return "";
  }
  function retainInstalled(target) {
    (trialFor(target.id)?.devices || []).forEach(device => {
      if (!heldDevices.get(device.mac)?.authorizationFrozen) heldDevices.set(device.mac, frozenDevice(target, device));
    });
  }
  function frozenDevice(target, device) {
    return { ...clone(device), targetId: target.id, frozenApps: clone(device.frozenApps || trialFor(target.id)?.apps || []), baseline: { appRule: target.appRule, appVersion: target.appVersion }, authorizationFrozen: device.authorization === "已失效" };
  }
  function apply(target, next) {
    const error = errorFor(target, next);
    if (error) return error;
    if (failure === "submit") { failure = ""; return "模拟提交失败；旧范围、状态和 MAC 锁完整保留。"; }
    if (target.id.startsWith("vv") && target.status === "开发中") {
      try { freezeVirtual(target); } catch (err) { return err.message; }
    }
    const timed = next.route === "public" && ["开发中", "测试中"].includes(target.status) && next.release.effectiveAt === "定时生效" && Date.parse(next.release.time) > Date.now();
    if (timed) {
      target.releaseConfig = clone(next.release);
      delete target.scheduleError;
      target.scopeRevision++;
      recordDirected(target.status === "开发中" ? "设置定时发布，开发中保持未投放" : "设置定时发布，原测试范围和锁保持", [target.id]);
      return "";
    }
    if (mode(target) === "mac" && next.route !== "mac") {
      retainInstalled(target);
      closeDirected(target, `范围切换到${labels[next.route]}`);
    }
    if (next.route === "mac") {
      const keep = new Set(next.trial.devices.map(device => device.mac));
      (trialFor(target.id)?.devices || []).filter(device => !keep.has(device.mac)).forEach(device => {
        if (!heldDevices.get(device.mac)?.authorizationFrozen) heldDevices.set(device.mac, frozenDevice(target, device));
      });
      next.migrations.forEach(migration => {
        const source = targetById(migration.source);
        directedTrials[source.id].devices = directedTrials[source.id].devices.filter(device => device.mac !== migration.mac);
        source.scopeRevision++;
      });
      directedTrials[target.id] = clone(next.trial);
    } else delete directedTrials[target.id];
    target.scopeMode = next.route;
    target.whitelistOpenedAt = null;
    if (next.route === "whitelist") {
      target.whitelistFilter = next.filter;
      target.whitelistUserIds = next.filter === "specified" ? [...new Set(next.userIds)] : [];
      delete target.whitelistTags;
    }
    if (next.route === "public") {
      const wasPublic = ["发布中", "已发布"].includes(target.status);
      const oldCoverage = wasPublic ? coverage(target) : 0;
      const release = clone(next.release);
      release.startedAt = wasPublic ? target.releaseConfig.startedAt : Date.now();
      release.coverage = release.mode === "全面发布" && !target.releasePaused ? 100 : oldCoverage || Math.ceil(100 / Number(release.batchDays));
      release.effectiveAt = wasPublic ? target.releaseConfig.effectiveAt : "已生效";
      target.releaseConfig = release;
      target.status = target.status === "已发布" || (release.mode === "全面发布" && !target.releasePaused) ? "已发布" : "发布中";
      target.revokedRegions = (target.revokedRegions || []).filter(region => !release.range.includes(region));
    } else if (target.status === "开发中") target.status = "测试中";
    target.scopeRevision++;
    recordDirected(`设置范围：${labels[next.route]}`, [target.id]);
    return "";
  }
  function legacyHtml(target) {
    return target.legacyTargeting ? `<div class="notice warning" id="scope-legacy" data-note-anchor="scope-legacy">存量指定对象限制仍有效：${escapeHtml(targetModeLabel(target.targetMode))} · ${escapeHtml((target.targetValues || []).join("、") || "不限")}。全面开放仍受此限制。<button class="btn" id="scopeEditLegacy">编辑原有限制</button></div>` : "";
  }
  function testBody(target) {
    if (draft.route === "company") return `<div id="scope-fields" class="notice">公司用户内部测试。${target.status === "开发中" ? "确认生效后进入测试中。" : "仅公司用户获得该版本的新 OTA 候选。"}</div>`;
    if (draft.route === "whitelist") {
      const tags = [...new Set(eligibleExternalUsers().flatMap(user => user.tags))];
      return `<div id="scope-fields"><div class="field"><label>外部授权用户范围</label><select id="scopeWhitelistFilter"><option value="all" ${draft.filter === "all" ? "selected" : ""}>全部已授权外部用户</option><option value="specified" ${draft.filter === "specified" ? "selected" : ""}>指定已授权外部用户</option></select></div>${draft.filter === "specified" ? `<div class="form-grid"><div class="field"><label>白名单标签组</label><select id="scopeUserTag"><option value="">全部标签组</option>${tags.map(tag => `<option value="${escapeAttr(tag)}" ${draft.userTag === tag ? "selected" : ""}>${escapeHtml(tag)}</option>`).join("")}</select></div><div class="field"><label>账号搜索</label><input id="scopeUserSearch" value="${escapeAttr(draft.userSearch)}" placeholder="搜索邮箱或手机号"></div></div><div id="scopeUserList"></div>` : ""}<div class="hint">仅当前产品已授权的白名单外部用户；标签组和搜索只筛选勾选列表，生效范围按已选用户保存。</div></div>`;
    }
    const trial = draft.trial;
    return `<div id="scope-fields"><div class="form-grid"><div class="field"><label>体验标识</label><input id="scopeLabel" value="${escapeAttr(trial.label)}"></div><div class="field"><label>APP 版本范围（选填）</label><input id="scopeApps" value="${escapeAttr(trial.apps.join(", "))}" placeholder="${escapeAttr(`${target.appRule} ${target.appVersion}`)}"><span class="hint">留空沿用兼容基线；多个版本用半角逗号分隔，填写版本必须符合 ${escapeHtml(target.appRule)} ${escapeHtml(target.appVersion)}。</span></div></div><div class="subsection-head"><h3>定向设备（${trial.devices.length}）</h3><div class="trial-inline-actions"><button class="btn" id="scopeImport">批量导入 MAC</button><button class="btn" id="scopePauseMac" ${!trial.devices.length ? "disabled" : ""}>${trial.status === "已暂停" ? "继续定向" : "暂停定向"}</button></div></div><div class="trial-device-table"><table><thead><tr><th>MAC / 用户</th><th>操作</th></tr></thead><tbody>${trial.devices.map(device => `<tr><td>${device.mac}<span class="sub">${escapeHtml(device.user || "未绑定（寄出前）")}</span></td><td class="table-actions"><button class="btn danger" data-scope-remove="${device.mac}">移出</button></td></tr>`).join("") || `<tr><td colspan="2">暂无定向设备，MAC 范围保持，不自动回到公司用户。</td></tr>`}</tbody></table></div></div>`;
  }
  function releaseBody(target) {
    const release = draft.release;
    const published = ["发布中", "已发布"].includes(target.status);
    return `<div id="scope-fields">${target.revokedRegions?.length ? `<div class="notice warning">已撤销区域：${escapeHtml(target.revokedRegions.join("、"))}。重新上架后仍需显式选择。</div>` : ""}<div class="field"><label><span class="required">*</span>正式发布范围</label><div class="check-row">${publicRegions().map(region => `<label><input type="checkbox" data-scope-region="${escapeAttr(region)}" ${release.range.includes(region) ? "checked" : ""}> ${escapeHtml(region)}</label>`).join("") || "产品当前没有公开上架区域"}</div><span class="hint">可选择产品公开上架范围的子集；待内测区域不可选。</span></div><div class="form-grid"><div class="field"><label>发布方式</label><select id="scopeReleaseMode"><option ${release.mode === "自动发布" ? "selected" : ""} ${target.status === "已发布" ? "disabled" : ""}>自动发布</option><option ${release.mode === "全面发布" ? "selected" : ""}>全面发布</option></select></div><div class="field"><label>自动发布总天数</label><input id="scopeDays" type="number" min="1" value="${release.batchDays}" ${published || release.mode === "全面发布" ? "disabled" : ""}></div><div class="field"><label>升级方式</label><select id="scopeUpgrade"><option ${release.upgradeMode === "提示升级" ? "selected" : ""}>提示升级</option><option ${release.upgradeMode === "强制升级" ? "selected" : ""}>强制升级</option></select></div><div class="field"><label>生效时间</label><select id="scopeEffective" ${published ? "disabled" : ""}><option ${release.effectiveAt !== "定时生效" ? "selected" : ""}>立即生效</option><option ${release.effectiveAt === "定时生效" ? "selected" : ""}>定时生效</option></select></div>${release.effectiveAt === "定时生效" && !published ? `<div class="field"><label>定时发布时间</label><input id="scopeTime" type="datetime-local" value="${escapeAttr(release.time || "")}"></div>` : ""}</div>${published ? `<div class="notice">开放覆盖：${coverage(target)}% · ${target.releasePaused ? "已暂停，不返回新候选" : "投放中"}。新增区域${target.status === "已发布" ? "全面开放" : "沿用当前进度"}。</div>` : ""}${target.status === "发布中" ? `<button class="btn" id="scopePauseRelease">${target.releasePaused ? "继续发布" : "暂停发布"}</button>` : ""}${legacyHtml(target)}</div>`;
  }
  function readFields() {
    if (!draft) return;
    if (draft.route === "mac") {
      draft.trial.label = $("#scopeLabel")?.value || draft.trial.label;
      if ($("#scopeApps")) draft.trial.apps = $("#scopeApps").value.split(",").map(app => app.trim()).filter(Boolean);
    } else if (draft.route === "whitelist") {
      draft.filter = $("#scopeWhitelistFilter")?.value || draft.filter;
    } else if (draft.route === "public") {
      if ($("#scopeReleaseMode")) draft.release.mode = $("#scopeReleaseMode").value;
      if ($("#scopeDays")) draft.release.batchDays = $("#scopeDays").value;
      if ($("#scopeUpgrade")) draft.release.upgradeMode = $("#scopeUpgrade").value;
      if ($("#scopeEffective") && !["发布中", "已发布"].includes(targetById(draft.id).status)) draft.release.effectiveAt = $("#scopeEffective").value;
      if ($("#scopeTime")) draft.release.time = $("#scopeTime").value;
      draft.release.range = $$('[data-scope-region]:checked').map(input => input.dataset.scopeRegion);
    }
  }
  function open(id) {
    reconcile();
    const target = targetById(id);
    if (!target || target.status === "已停止") return;
    draft = makeDraft(target);
    state.directedTargetId = id;
    draw();
  }
  function draw() {
    const target = targetById(draft.id);
    const pending = scheduledReleasePending(target);
    const body = `<div id="scope-summary" data-note-anchor="scope-summary"><strong>${escapeHtml(trialLabel(target))}</strong> <span class="tag ${firmwareStatusClass(target.status)}">${target.status}</span><span class="sub">当前生效范围：${target.status === "开发中" ? "尚未投放" : labels[mode(target)]}${target.releasePaused ? " · 已暂停" : ""}</span></div>${pending ? `<div class="notice warning" id="scope-scheduled">待定时发布：${escapeHtml(target.releaseConfig.time)} · ${escapeHtml(target.releaseConfig.range.join("、"))}。${target.status === "开发中" ? "开发中尚未投放，到点校验后才正式生效。" : "原测试范围、暂停标记及锁保持。"}<button class="btn" id="scopeCancelSchedule">取消定时发布</button></div>` : ""}<div class="field" id="scope-route" data-note-anchor="scope-route"><label>可见范围</label><div class="check-row">${Object.entries(labels).map(([route, label]) => `<label><input type="radio" name="scopeRoute" value="${route}" ${draft.route === route ? "checked" : ""} ${!canRoute(target, route) || pending ? "disabled" : ""}> ${label}</label>`).join("")}</div><span class="hint">${target.status === "开发中" ? "可任选测试或正式范围；提交成功后按所选范围推进状态。" : ["发布中", "已发布"].includes(target.status) ? "正式发布后不可回到测试范围。" : "测试范围互斥，可互相切换；保存前不影响当前范围。"}</span></div>${draft.route === "public" ? releaseBody(target) : testBody(target)}<div class="notice error hide" id="scopeError" role="alert"></div>`;
    showDirectedShell("scopeConfig", "设置范围", "范围配置生效后推进生命周期；测试中只生效一种范围。", body, pending ? "计划待生效" : "确认生效");
    $("#drawerSave").disabled = pending;
    $("#drawerSave").onclick = save;
    $$('[name="scopeRoute"]').forEach(input => input.onchange = () => {
      readFields();
      draft.route = input.value;
      if (draft.route === "mac" && mode(target) !== "mac") draft.trial = { label: target.version, apps: [], status: "运行中", devices: [] };
      draft.migrations = draft.route === "mac" ? draft.migrations : [];
      draw();
    });
    $("#scopeWhitelistFilter")?.addEventListener("change", () => { readFields(); draw(); });
    $("#scopeUserTag")?.addEventListener("change", event => { draft.userTag = event.target.value; renderWhitelistUsers(); });
    $("#scopeUserSearch")?.addEventListener("input", event => { draft.userSearch = event.target.value; renderWhitelistUsers(); });
    renderWhitelistUsers();
    ["scopeReleaseMode", "scopeEffective"].forEach(id => $(`#${id}`)?.addEventListener("change", () => { readFields(); draw(); }));
    $("#scopeImport")?.addEventListener("click", () => { readFields(); openImport(); });
    $("#scopePauseMac")?.addEventListener("click", () => { readFields(); draft.trial.status = draft.trial.status === "已暂停" ? "运行中" : "已暂停"; draw(); });
    $$('[data-scope-remove]').forEach(button => button.onclick = () => { readFields(); draft.trial.devices = draft.trial.devices.filter(device => device.mac !== button.dataset.scopeRemove); draft.migrations = draft.migrations.filter(row => row.mac !== button.dataset.scopeRemove); draw(); });
    $("#scopePauseRelease")?.addEventListener("click", () => pauseRelease(target));
    $("#scopeCancelSchedule")?.addEventListener("click", () => cancelSchedule(target));
    $("#scopeEditLegacy")?.addEventListener("click", async () => {
      const before = fingerprint(target);
      const raw = await showPrompt("编辑存量指定对象", "仅维护原有限制，不修改范围或冻结包；多个值用半角逗号分隔。", target.targetValues.join(","));
      if (raw === null) return;
      const parsed = parseTargetValues(target.targetMode, raw);
      if (parsed.error || fingerprint(target) !== before) { showToast(parsed.error || "记录已变化，本次未写入。"); return; }
      target.targetValues = parsed.values; target.scopeRevision++; open(target.id); renderFirmware();
    });
  }
  function showError(message) {
    renderWhitelistUsers();
    const node = $("#scopeError");
    if (node) { node.textContent = message; node.classList.remove("hide"); }
    showToast(message);
  }
  function renderWhitelistUsers() {
    const container = $("#scopeUserList");
    if (!container || !draft || draft.route !== "whitelist" || draft.filter !== "specified") return;
    const eligible = eligibleExternalUsers();
    const eligibleIds = new Set(eligible.map(user => user.id));
    const query = draft.userSearch.trim().toLowerCase();
    const visible = eligible.filter(user => (!draft.userTag || user.tags.includes(draft.userTag)) && (!query || [user.email, user.phone].some(value => value && value.toLowerCase().includes(query))));
    const selected = new Set(draft.userIds);
    const invalid = draft.userIds.filter(id => !eligibleIds.has(id));
    container.innerHTML = `<div class="subsection-head"><span>已选 ${selected.size} 人 · 当前筛选 ${visible.length} 人</span></div>${invalid.length ? `<div class="notice warning">${invalid.length} 名已选用户已不具备当前产品授权或外部身份。<button class="btn" id="scopeClearInvalidUsers">清除无效选择</button></div>` : ""}<div class="scope-user-table"><table><thead><tr><th><input type="checkbox" id="scopeSelectFiltered" aria-label="全选当前筛选结果" ${!visible.length ? "disabled" : ""}></th><th>用户账号</th><th>标签组</th><th>数据中心</th></tr></thead><tbody>${visible.map(user => `<tr><td><input type="checkbox" data-scope-user="${escapeAttr(user.id)}" aria-label="选择 ${escapeAttr(user.email || user.phone)}" ${selected.has(user.id) ? "checked" : ""}></td><td>${escapeHtml(user.email || user.phone)}</td><td>${escapeHtml(user.tags.join("、") || "--")}</td><td>${escapeHtml(user.dc)}</td></tr>`).join("") || `<tr><td colspan="4">暂无符合筛选条件的已授权外部用户</td></tr>`}</tbody></table></div>`;
    const all = $("#scopeSelectFiltered");
    const picked = visible.filter(user => selected.has(user.id)).length;
    all.checked = visible.length > 0 && picked === visible.length;
    all.indeterminate = picked > 0 && picked < visible.length;
    const selectionUpdated = () => { draft.userIds = [...selected]; $("#scopeError")?.classList.add("hide"); renderWhitelistUsers(); };
    all.onchange = () => {
      visible.forEach(user => all.checked ? selected.add(user.id) : selected.delete(user.id));
      selectionUpdated();
    };
    $$('[data-scope-user]').forEach(input => input.onchange = () => {
      input.checked ? selected.add(input.dataset.scopeUser) : selected.delete(input.dataset.scopeUser);
      selectionUpdated();
    });
    $("#scopeClearInvalidUsers")?.addEventListener("click", () => { invalid.forEach(id => selected.delete(id)); selectionUpdated(); });
  }
  async function save() {
    readFields();
    const next = clone(draft);
    const target = targetById(next.id);
    const error = errorFor(target, next);
    if (error) { showError(error); return; }
    const rangeLabel = route => labels[route].replace("指定 MAC", "指定MAC");
    const previous = target.status === "开发中" ? "尚未投放" : rangeLabel(mode(target));
    const subject = target.id.startsWith("vv") ? "虚拟版本" : "固件";
    const ok = await showConfirm("确认范围变更", `${subject}生效范围从${previous}改为${rangeLabel(next.route)}。`, "确认生效");
    if (!ok) return;
    const result = apply(targetById(next.id), next);
    if (result) { showError(result); return; }
    state.firmwareMessage = `${trialLabel(target)} 范围配置已提交；${scheduledReleasePending(target) ? target.status === "开发中" ? "定时等待期间保持开发中未投放" : "定时等待期间原测试范围仍有效" : `${labels[mode(target)]} 已生效，状态为${target.status}` }。`;
    closeDrawer(); draft = null; render();
  }
  function validateImport(text) {
    state.directedImportMigrations = importSelections;
    const target = targetById(draft.id);
    return validateDirectedRows(parseDirectedRows(text), target).map(row => ({ ...row, errors: [...row.errors, ...(draft.trial.devices.some(device => device.mac === row.mac) ? ["已在本次配置名单，无需重复导入"] : [])] }));
  }
  function openImport() {
    importRows = [];
    importSelections = new Set();
    showDirectedShell("scopeImport", "批量导入 MAC", `固定目标：${trialLabel(targetById(draft.id))}。导入先加入待提交配置，不立即改变生效范围。`, `<div id="scope-import" data-note-anchor="scope-import"><div class="field"><label>上传 CSV</label><input id="scopeFile" type="file" accept=".csv,.txt"></div><div class="field"><label>MAC 清单</label><textarea id="scopeCsv" rows="6" placeholder="MAC&#10;A45E60123503"></textarea><span class="hint">仅 MAC 一列，一行一台；发货前无需用户账号。</span></div><div class="trial-toolbar"><button class="btn" id="scopeTemplate">下载模板</button><button class="btn primary" id="scopeValidate">校验全部</button></div><div id="scopePreview"></div><div class="notice error hide" id="scopeError" role="alert"></div></div>`, "加入待提交名单");
    $("#scope-import").insertAdjacentHTML("afterbegin", '<button class="btn" id="scopeBack">返回范围配置</button>');
    $("#scopeBack").onclick = draw;
    $("#drawerSave").disabled = true;
    const invalidate = () => { importRows = []; importSelections.clear(); $("#scopePreview").innerHTML = ""; $("#drawerSave").disabled = true; };
    $("#scopeCsv").oninput = invalidate;
    $("#scopeFile").onchange = async event => { if (event.target.files[0]) { $("#scopeCsv").value = await event.target.files[0].text(); invalidate(); } };
    $("#scopeTemplate").onclick = () => {
      const url = URL.createObjectURL(new Blob(["MAC\nA45E60123503\n"], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = "firmware-mac-template.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
    };
    const preview = () => {
      $("#scopePreview").innerHTML = directedImportPreviewHtml(importRows);
      $("#drawerSave").disabled = !importRows.length || importRows.some(row => row.errors.length || (row.migratable && !importSelections.has(row.mac)));
      $$('[data-directed-migration]').forEach(input => input.onchange = () => { input.checked ? importSelections.add(input.dataset.directedMigration) : importSelections.delete(input.dataset.directedMigration); importRows = validateImport($("#scopeCsv").value); preview(); });
      $$('[data-directed-migration-all]').forEach(button => button.onclick = () => { importRows.filter(row => row.migratable).forEach(row => importSelections.add(row.mac)); importRows = validateImport($("#scopeCsv").value); preview(); });
      $$('[data-directed-migration-clear]').forEach(button => button.onclick = () => { importSelections.clear(); importRows = validateImport($("#scopeCsv").value); preview(); });
    };
    $("#scopeValidate").onclick = () => { importSelections.clear(); importRows = validateImport($("#scopeCsv").value); preview(); };
    $("#drawerSave").onclick = () => {
      importRows = validateImport($("#scopeCsv").value);
      if (!importRows.length || importRows.some(row => row.errors.length || (row.migratable && !importSelections.has(row.mac)))) { preview(); showError("校验失败或迁移未确认，整批未加入配置。"); return; }
      importRows.forEach(row => {
        const source = row.occupiedId && targetById(row.occupiedId);
        const old = source && trialFor(source.id).devices.find(device => device.mac === row.mac);
        draft.trial.devices.push(old ? { ...clone(old), current: row.current } : { mac: row.mac, current: row.current, user: "", authorization: "待绑定" });
        if (source) draft.migrations.push({ mac: row.mac, source: source.id, original: fingerprint(source) });
      });
      draw();
    };
  }
  async function pauseRelease(target) {
    const before = fingerprint(target);
    const nextPaused = !target.releasePaused;
    const ok = await showConfirm(nextPaused ? "暂停发布" : "继续发布", nextPaused ? "暂停期间不返回该版本新候选，主状态保持发布中。未保存的编辑不生效。" : `按已保存${target.releaseConfig.mode}继续；未保存编辑不生效。`, nextPaused ? "确认暂停" : "确认继续");
    if (!ok) return;
    if (fingerprint(target) !== before || target.status !== "发布中") { showError("配置已变化，请重新打开。"); return; }
    if (nextPaused) target.releaseConfig.coverage = coverage(target);
    target.releasePaused = nextPaused;
    if (!nextPaused) { target.releaseConfig.coverage = coverage(target); if (target.releaseConfig.coverage === 100) target.status = "已发布"; }
    target.scopeRevision++;
    open(target.id); renderFirmware();
  }
  async function cancelSchedule(target) {
    const before = fingerprint(target);
    const ok = await showConfirm("取消定时发布", target.status === "开发中" ? "仅撤销计划；仍为开发中未投放，已固定的虚拟引用不解冻。" : "仅撤销计划；原测试范围、暂停标记和 MAC 锁保持。", "确认取消");
    if (!ok) return;
    if (fingerprint(target) !== before || !scheduledReleasePending(target)) { showError("计划已变化或已执行，本次取消未生效。"); return; }
    delete target.releaseConfig; delete target.scheduleError; target.scopeRevision++;
    open(target.id); renderFirmware();
  }
  function executeScheduled(id, now = Date.now()) {
    const target = targetById(id);
    if (!target || !scheduledReleasePending(target)) return "计划不存在或已终止";
    const error = scheduledReleaseValidation(target);
    if (error || failure === "scheduled") {
      target.scheduleError = error || "模拟到点校验失败"; failure = ""; return target.scheduleError;
    }
    const next = makeDraft(target); next.route = "public"; next.release.effectiveAt = "立即生效";
    const scheduled = target.releaseConfig;
    delete target.releaseConfig;
    next.original = fingerprint(target);
    const result = apply(target, next);
    if (result) target.releaseConfig = scheduled;
    else { delete target.scheduleError; target.releaseConfig.startedAt = now; }
    return result;
  }
  async function terminate(id, remove) {
    const target = targetById(id);
    if (!target || (!remove && target.status === "已停止")) return;
    const refs = id.startsWith("vv") ? [] : virtualVersions.filter(version => (version.members || []).includes(id) || (version.frozenMembers || []).some(member => member.id === id));
    if (remove && refs.length) { showToast(`删除被阻断：虚拟版本 ${refs.map(version => `${version.version}（${version.status}）`).join("、")} 仍引用该组件。请先删除引用版本。`); return; }
    const before = fingerprint(target);
    const others = allFirmwareTargets().filter(row => row.id !== id && ["测试中", "发布中", "已发布"].includes(row.status) && row.id.startsWith("vv") === id.startsWith("vv"));
    const ok = await showConfirm(remove ? "删除版本" : "停止版本", `${escapeHtml(trialLabel(target))}：撤销新候选、关闭 ${trialFor(id)?.devices.length || 0} 台定向、释放 MAC 并取消定时计划。已安装不回滚。${refs.length ? `<br>组件停止不停止引用虚拟版本：${refs.map(row => row.version).join("、")}。` : ""}${!others.length ? "<br>该路径可能无可命中版本，设备保持当前版本。" : ""}${remove ? "<br>移出管理列表，保留必要安装来源与审计；重建为新记录。" : "<br>停止不可恢复。"}`, remove ? "确认删除" : "确认停止");
    if (!ok) return;
    if (targetById(id) !== target || fingerprint(target) !== before) { showToast("版本或计划已变化，未执行终止。"); return; }
    if (remove && !id.startsWith("vv") && virtualVersions.some(version => (version.members || []).includes(id) || (version.frozenMembers || []).some(member => member.id === id))) { showToast("新增虚拟引用，删除未生效。"); return; }
    retainInstalled(target); closeDirected(target, remove ? "删除" : "停止"); delete target.releaseConfig; target.releasePaused = false; target.status = "已停止"; target.scopeRevision++;
    if (remove) { archive.push(clone(target)); if (id.startsWith("vv")) virtualVersions = virtualVersions.filter(row => row.id !== id); else firmwareVersions = firmwareVersions.filter(row => row.id !== id); }
    state.firmwareMessage = `${trialLabel(target)} 已${remove ? "删除" : "停止"}；设备保留已安装版本。`;
    render();
  }
  function testEligible(target, request) {
    if (target.status !== "测试中") return false;
    if (mode(target) === "company") return request.userType === "公司用户";
    if (mode(target) !== "whitelist" || request.userType !== "外部用户" || !request.authorized) return false;
    const user = callerUser(request);
    if (!user || user.type !== "外部用户" || !user.products.includes(products[state.product].name)) return false;
    return target.whitelistFilter !== "specified" || (target.whitelistUserIds || []).includes(user.id);
  }
  function resolve(request) {
    const product = products[state.product];
    const region = request.region || "北美数据中心";
    const listed = publicRegions().includes(region);
    const qualified = request.userType === "公司用户" || request.authorized;
    const visible = request.productVisible !== undefined ? request.productVisible : product.status !== "已下架" && (listed || (qualified && (currentProductListingRangeOptions().includes(region) || (["测试中", "已通过"].includes(state.gateStatus) && regionalGate.region === region))));
    const id = activeDirectedIds().find(key => trialFor(key).devices.some(device => device.mac === request.mac));
    const target = id && targetById(id);
    const device = id && trialFor(id).devices.find(row => row.mac === request.mac);
    const lostAuth = request.userType === "外部用户" && (!request.authorized || device?.authorization === "已失效");
    let frozen = heldDevices.get(request.mac);
    if (lostAuth && target && !frozen?.authorizationFrozen) {
      frozen = { ...frozenDevice(target, device), authorizationFrozen: true };
      heldDevices.set(request.mac, frozen);
    }
    const frozenControl = frozen?.authorizationFrozen ? !directedAppAllowed(request.app, frozen.baseline, { apps: frozen.frozenApps }) : false;
    if (lostAuth && !listed) return { status: "HOLD_CURRENT_VERSION", reason: "资格失效且产品未公开；保持当时可用组合", controlBlocked: frozenControl };
    if (lostAuth && target && frozen?.targetId !== target.id) return { status: "HOLD_CURRENT_VERSION", reason: "仍有其他有效定向目标，保留锁；资格失效不回落普通候选", controlBlocked: frozenControl };
    if (!lostAuth && frozen?.authorizationFrozen && device?.authorization === "有效") heldDevices.delete(request.mac);
    if (!visible) return { status: "HOLD_CURRENT_VERSION", reason: "产品在当前区域对用户不可见" };
    if (target && !lostAuth) {
      const trial = trialFor(id);
      if ((id.startsWith("vv") ? "虚拟版本" : "单 MCU") !== request.path) return { status: "HOLD_CURRENT_VERSION", reason: "另一查询路径锁定，不回落普通候选" };
      if (!qualified || trial.status === "已暂停") return { status: "HOLD_CURRENT_VERSION", reason: "资格不符或定向暂停，MAC 保留锁定" };
      if (!directedAppAllowed(request.app, target, trial)) return { status: "HOLD_CURRENT_VERSION", reason: "选错 APP：保留设备列表，阻断控制/设置/命令", controlBlocked: true };
      const current = request.current || assetVersionForTarget(directedAssetInventory[request.mac], target);
      if (!current || compareVersion(current, target.version) > 0) return { status: "HOLD_CURRENT_VERSION", reason: "当前版本缺失或存在降级风险" };
      return { status: "精确目标", targetId: id, reason: `${trialLabel(target)}；不比较其他更高版本` };
    }
    const asset = directedAssetInventory[request.mac];
    const candidates = allFirmwareTargets().filter(row => {
      if ((row.id.startsWith("vv") ? "虚拟版本" : "单 MCU") !== request.path || !experienceAppMatchesFirmware(request.app, row) || (asset && !assetFitsTarget(asset, row))) return false;
      const current = request.current || assetVersionForTarget(asset, row) || "0.0.0";
      if (compareVersion(current, row.version) > 0) return false;
      if (row.legacyTargeting && row.targetMode !== "不限" && !(row.targetValues || []).includes(row.targetMode === "设备" ? request.mac : request.user)) return false;
      if (!lostAuth && testEligible(row, request)) return true;
      return mode(row) === "public" && ["发布中", "已发布"].includes(row.status) && !row.releasePaused && listed && row.releaseConfig?.range.includes(region) && request.covered !== false;
    }).sort((a, b) => compareVersion(b.version, a.version));
    return candidates.length ? { status: "普通候选", targetId: candidates[0].id, reason: `${trialLabel(candidates[0])}；按当前生效范围与普通升级策略` } : { status: "HOLD_CURRENT_VERSION", reason: "无符合当前范围的候选，保持已安装版本" };
  }
  function actions(target) {
    return `<button class="btn primary" data-scope-open="${target.id}" ${target.status === "已停止" ? "disabled" : ""}>设置范围</button><button class="btn danger" data-scope-stop="${target.id}" ${target.status === "已停止" ? "disabled" : ""}>停止</button><button class="btn danger" data-scope-delete="${target.id}">删除</button>`;
  }
  function summary(target) {
    if (target.status === "开发中") return "尚未投放";
    if (target.status === "已停止") return "已停止投放";
    if (mode(target) === "mac") return `指定 MAC · ${trialFor(target.id)?.devices.length || 0} 台${trialFor(target.id)?.status === "已暂停" ? " · 已暂停" : ""}`;
    if (mode(target) === "whitelist") return `外部授权白名单${target.whitelistFilter === "specified" ? ` · 指定 ${(target.whitelistUserIds || []).length} 人` : " · 全部已授权"}`;
    if (mode(target) === "public") return target.releaseConfig?.range.length ? target.releaseConfig.range.join("、") : "无有效发布范围";
    return "公司用户";
  }
  function firmwareHtml() {
    const counts = firmwareVersions.reduce((result, target) => { result[target.status] = (result[target.status] || 0) + 1; return result; }, {});
    return `<div id="firmware-state" data-note-anchor="firmware-state"><div class="subsection-head"><h3>固件版本</h3><button class="btn primary" id="scopeNewFirmware">新建固件版本</button></div><div class="firmware-state-flow">${["开发中", "测试中", "发布中", "已发布", "已停止"].map(status => `<div class="firmware-state"><strong>${status}</strong><span>${counts[status] || 0} 条</span></div>`).join("")}</div>${state.firmwareMessage ? `<div class="notice success">${escapeHtml(state.firmwareMessage)}</div>` : ""}<div class="trial-device-table"><table><thead><tr><th>固件名称</th><th>类型</th><th>通道</th><th>版本</th><th>硬件</th><th>功能版本</th><th>APP 兼容范围</th><th>生效范围</th><th>状态</th><th>创建时间</th><th>备注</th><th>操作</th></tr></thead><tbody>${firmwareVersions.map(target => `<tr><td>${escapeHtml(target.name)}</td><td>${target.type}</td><td>${target.channel || "--"}</td><td>${target.version}</td><td>${target.hardware}</td><td>${target.functionVersion}</td><td>${target.appRule} ${target.appVersion}</td><td>${escapeHtml(summary(target))}${target.legacyTargeting ? `<span class="sub">存量限制 ${escapeHtml(target.targetValues.join("、"))}</span>` : ""}</td><td><span class="tag ${firmwareStatusClass(target.status)}">${target.status}</span>${target.releasePaused ? `<span class="sub">已暂停</span>` : ""}${target.releaseConfig && mode(target) === "public" ? `<span class="sub">开放 ${coverage(target)}%</span>` : ""}${scheduledReleasePending(target) ? `<span class="sub">待定时发布${target.scheduleError ? " · 校验失败" : ""}</span>` : ""}</td><td>${target.createdAt}</td><td>${escapeHtml(target.log)}</td><td class="table-actions">${actions(target)}</td></tr>`).join("")}</tbody></table></div></div>`;
  }
  function virtualHtml() {
    return `<div id="virtual-version" data-note-anchor="virtual-version"><div class="subsection-head"><h3>虚拟版本</h3><button class="btn primary" id="scopeNewVirtual">新建虚拟版本</button></div>${state.firmwareMessage ? `<div class="notice success">${escapeHtml(state.firmwareMessage)}</div>` : ""}<div class="trial-device-table"><table><thead><tr><th>版本</th><th>APP 兼容范围</th><th>固定组件</th><th>生效范围</th><th>状态</th><th>操作</th></tr></thead><tbody>${virtualVersions.map(target => `<tr><td>${target.version}</td><td>${target.appRule} ${target.appVersion}</td><td>${virtualMembers(target).map(member => `${member.hardware}/${member.channel}/${member.version}`).join("；")}<span class="sub">${target.referenceReview ? "引用待核对" : target.frozen ? "首次范围提交已冻结" : "待首次范围提交冻结"}</span></td><td>${escapeHtml(summary(target))}${target.legacyTargeting ? `<span class="sub">存量指定用户：${escapeHtml(target.targetValues.join("、"))}</span>` : ""}</td><td><span class="tag ${firmwareStatusClass(target.status)}">${target.status}</span>${target.releasePaused ? `<span class="sub">已暂停</span>` : ""}</td><td class="table-actions">${actions(target)}</td></tr>`).join("")}</tbody></table></div></div>`;
  }
  function wire() {
    $$('[data-scope-open]').forEach(button => button.onclick = () => open(button.dataset.scopeOpen));
    $$('[data-scope-stop]').forEach(button => button.onclick = () => terminate(button.dataset.scopeStop, false));
    $$('[data-scope-delete]').forEach(button => button.onclick = () => terminate(button.dataset.scopeDelete, true));
    $$('[data-firmware-tab]').forEach(button => button.onclick = () => { state.firmwareTab = button.dataset.firmwareTab; renderFirmware(); renderNotes(); });
    $("#scopeNewFirmware")?.addEventListener("click", () => openDrawer("firmwareVersionAdd"));
    $("#scopeNewVirtual")?.addEventListener("click", () => { state.virtualEditingId = null; state.virtualDraftMembers = new Set(); openDrawer("virtualVersionCreate"); });
  }
  function demo() {
    const box = $("#directedDemoBox");
    if (!box) return;
    const onFirmware = state.view === "product" && state.productStep === "firmware";
    box.classList.toggle("hide", !onFirmware);
    if (!onFirmware) return;
    const macs = Object.keys(directedAssetInventory);
    $("#directedDemoDevice").innerHTML = macs.map(mac => `<option ${mac === state.directedDemoMac ? "selected" : ""}>${mac}</option>`).join("");
    const selector = $("#directedDemoDevice");
    if (!state.directedDemoMac) state.directedDemoMac = selector.value;
    $("#directedDemoActions").innerHTML = `<div class="field"><label>用户身份</label><select id="scopeDemoType"><option>公司用户</option><option selected>外部用户</option></select></div><div class="field"><label>APP 版本</label><input id="scopeDemoApp" value="2.2.12"></div><div class="field"><label>外部用户账号</label><select id="scopeDemoUser">${whitelistUsers.filter(user => user.type === "外部用户").map(user => `<option value="${escapeAttr(user.id)}">${escapeHtml(user.email || user.phone)}</option>`).join("")}</select></div><div class="check-row"><label><input type="checkbox" id="scopeDemoAuthorized" checked> 当前产品授权有效</label></div><button class="btn" id="scopeDemoQuery">查询单 MCU 候选</button><button class="btn" id="scopeDemoVirtual">查询虚拟候选</button><button class="btn" id="scopeDemoFailure">下次提交失败</button><button class="btn" id="scopeDemoDue">模拟定时到点</button><button class="btn" id="scopeDemoDown">产品区域下架</button><button class="btn" id="scopeDemoUp">产品区域重新上架</button><button class="btn" id="scopeDemoOta">模拟该设备完成 OTA</button><div class="notice" id="scopeDemoResult">演示操作仅位于批注栏，不属于平台产品交互。</div>`;
    const query = path => { const company = $("#scopeDemoType").value === "公司用户"; const user = whitelistUsers.find(row => row.id === $("#scopeDemoUser").value); const result = resolve({ mac: selector.value, path, userType: $("#scopeDemoType").value, userId: company ? "u3" : user?.id, authorized: $("#scopeDemoAuthorized").checked && (company || user?.products.includes(products[state.product].name)), app: $("#scopeDemoApp").value, region: company ? "北美数据中心" : user?.dc }); $("#scopeDemoResult").textContent = `${result.status} · ${result.reason}`; };
    const selected = () => {
      const id = activeDirectedIds().find(key => trialFor(key).devices.some(device => device.mac === selector.value));
      return id ? { target: targetById(id), device: trialFor(id).devices.find(row => row.mac === selector.value) } : null;
    };
    const syncAuthorization = () => { $("#scopeDemoAuthorized").checked = selected()?.device.authorization !== "已失效"; };
    selector.onchange = () => { state.directedDemoMac = selector.value; syncAuthorization(); };
    syncAuthorization();
    $("#scopeDemoAuthorized").onchange = () => {
      const row = selected();
      if (row) {
        if (!$("#scopeDemoAuthorized").checked && !heldDevices.get(selector.value)?.authorizationFrozen) heldDevices.set(selector.value, { ...frozenDevice(row.target, row.device), authorizationFrozen: true });
        row.device.authorization = $("#scopeDemoAuthorized").checked ? "有效" : "已失效";
        if ($("#scopeDemoAuthorized").checked) heldDevices.delete(selector.value);
        row.target.scopeRevision++;
      }
      $("#scopeDemoResult").textContent = $("#scopeDemoAuthorized").checked ? "授权已恢复；按当前范围及 App 规则重新校验。" : "授权已失效；保持当时可用组合，不再获得测试更新。";
    };
    $("#scopeDemoQuery").onclick = () => query("单 MCU");
    $("#scopeDemoVirtual").onclick = () => query("虚拟版本");
    $("#scopeDemoFailure").onclick = () => { failure = "submit"; $("#scopeDemoResult").textContent = "下一次范围提交失败，校验后确认可见旧规则保留。"; };
    $("#scopeDemoDue").onclick = () => { const target = draft && targetById(draft.id); if (!target || !scheduledReleasePending(target)) { $("#scopeDemoResult").textContent = "请打开存在待执行定时计划的版本。"; return; } const error = executeScheduled(target.id); state.firmwareMessage = error || "模拟到点发布成功"; open(target.id); renderFirmware(); };
    $("#scopeDemoDown").onclick = () => { products[state.product].listingMode = "partial"; products[state.product].listingRange = currentProductListingRangeOptions().filter(region => region !== "北美数据中心"); reconcile(); render(); if (draft && targetById(draft.id)) open(draft.id); };
    $("#scopeDemoUp").onclick = () => { products[state.product].listingRange = [...new Set([...products[state.product].listingRange, "北美数据中心"])]; render(); if (draft && targetById(draft.id)) open(draft.id); };
    $("#scopeDemoOta").onclick = () => { const id = activeDirectedIds().find(key => trialFor(key).devices.some(device => device.mac === selector.value)); if (!id) { $("#scopeDemoResult").textContent = "该设备无生效定向"; return; } const target = targetById(id); const trial = trialFor(id); const device = trial.devices.find(row => row.mac === selector.value); if (device.authorization !== "有效" || trial.status === "已暂停") { $("#scopeDemoResult").textContent = "资格未通过或定向暂停，不执行 OTA"; return; } device.current = target.version; directedAssetInventory[device.mac][id.startsWith("vv") ? "virtualCurrent" : "current"] = target.version; target.scopeRevision++; renderFirmware(); if (draft?.id === id) open(id); };
  }
  function tick(now = Date.now()) {
    let changed = reconcile();
    allFirmwareTargets().forEach(target => {
      if (scheduledReleasePending(target) && Date.parse(target.releaseConfig.time) <= now && !target.scheduleError) { const error = executeScheduled(target.id, now); state.firmwareMessage = error ? `到点校验失败：${error}，原主状态及投放配置保持。` : `${target.version} 定时发布已生效。`; changed = true; }
      if (target.status === "发布中" && !target.releasePaused) {
        const percent = coverage(target, now);
        if (percent !== target.releaseConfig.coverage) { target.releaseConfig.coverage = percent; changed = true; }
        if (percent === 100) { target.status = "已发布"; target.scopeRevision++; changed = true; }
      }
    });
    if (changed) renderFirmware();
  }
  allFirmwareTargets().forEach(target => {
    if (target.status === "暂停发布") { target.status = "发布中"; target.releasePaused = true; }
    target.scopeMode = mode(target); target.scopeRevision = 1;
    if (target.scopeMode === "whitelist") {
      if (target.whitelistFilter === "tags") {
        target.whitelistUserIds = eligibleExternalUsers().filter(user => user.tags.some(tag => (target.whitelistTags || []).includes(tag))).map(user => user.id);
        target.whitelistFilter = "specified";
      } else target.whitelistFilter = target.whitelistFilter || "all";
      target.whitelistUserIds = target.whitelistUserIds || [];
      delete target.whitelistTags;
    }
    if (target.scopeMode === "public") {
      target.releaseConfig = { mode: target.status === "已发布" ? "全面发布" : "自动发布", range: clone(publicRegions()), batchDays: "5", upgradeMode: target.status === "已发布" ? "强制升级" : "提示升级", effectiveAt: "已生效", time: "", startedAt: Date.now() - 2 * day, coverage: target.status === "已发布" ? 100 : 60 };
    }
    const trial = trialFor(target.id);
    if (trial) {
      trial.apps = trial.apps.map(normalizedAppVersion);
      trial.devices.forEach(device => { if (device.frozenApps) device.frozenApps = device.frozenApps.map(normalizedAppVersion); });
    }
    (trial?.devices || []).filter(device => device.authorization === "已失效").forEach(device => heldDevices.set(device.mac, frozenDevice(target, device)));
  });
  notes.firmware = [
    { id: "firmware-state", title: "五状态与三个行操作", body: "说明：主状态只正向流转，暂停使用执行标记。交互：设置范围、停止、删除；开发中可自由选择四范围。测试范围互转不改变测试中状态。异常：停止不可恢复；删除引用组件前阻断。", loc: "固件配置 > 版本列表" },
    { id: "virtual-version", title: "虚拟版本独立与冻结引用", body: "说明：首次提交范围固定组件及包（含直接发布、定时）；不提升组件状态。交互：与单 MCU 相同设置范围。异常：固定引用含已停止虚拟版本仍阻断组件删除；虚拟 OTA 区分完成、部分失败、零适用和禁止降级。", loc: "固件配置 > 虚拟版本" }
  ];
  notes.scopeConfig = [
    { id: "scope-summary", title: "当前范围与待提交配置", body: "说明：显示当前状态和唯一生效范围。交互：输入仅修改草稿，取消不生效。异常：校验、并发或提交失败均保留旧范围、状态和锁。", loc: "设置范围 > 版本信息" },
    { id: "scope-route", title: "测试三路由互斥切换", body: "交互：开发中可直接任选四路由；选择前三路由生效进入测试中，后续互相切换且可收窄。状态：MAC/白名单不叠加公司范围；发布后仅所有用户可达；名单空不回退。数据来源：指定用户按已授权外部用户ID名单保存；标签组／账号只筛勾选列表，全选当前结果、跨筛选保留，产品授权实际使用时校验。", loc: "设置范围 > 可见范围" },
    { id: "scope-fields", title: "范围字段与正式区域子集", body: "交互：MAC-only 导入、默认不迁移冲突、整批确认；App 留空继承基线。正式范围：当前公开上架范围非空子集，发布中新增沿用进度，已发布新增全面开放。暂停编辑仍暂停；产品下架撤销范围，重新上架须显式选择。", loc: "设置范围 > 路由配置" },
    { id: "scope-scheduled", title: "定时计划与并发", body: "交互：等待期间修改测试配置先取消计划。取消只撤销计划，锁和暂停保持；到点复核失败不发布。异常：取消、到点、终止只有一次成功提交。默认：发布开始后不重设天数及时间。", loc: "设置范围 > 定时发布" },
    { id: "scope-legacy", title: "历史限制保留", body: "说明：存量指定对象仍是附加条件，范围编辑不清空名单。交互：保留原限制编辑能力。100%：仅指符合区域及存量对象限制的设备全面开放。", loc: "设置范围 > 存量发布限制" }
  ];
  notes.scopeImport = [{ id: "scope-import", title: "MAC 导入与原子迁移", body: "交互：只导入 MAC，目标由版本上下文确定；可迁移冲突默认未选，可全选或清空。校验：旧目标定时、资格失效、路径不符、缺失迁移版本、降级、格式或重复阻断。加入草稿后须确认范围才实际写入，失败整批零写入。", loc: "指定 MAC > 批量导入" }];
  notes.scopeConfig.push({ id: "scope-summary", title: "简洁确认文案", body: "范围变更弹窗只显示原范围和新范围，例如：固件生效范围从尚未投放改为指定MAC。数量、候选及版本解释不放入确认正文；配置页和批注承接规则说明。确认后仍重新校验并原子提交，取消或失败均不生效。", loc: "设置范围 > 确认范围变更" });
  notes.scopeConfig.push({ id: "scope-fields", title: "定向设备清单与迁移入口", body: "字段：只展示 MAC／已有用户及移出；不展示版本或状态。迁移：在目标版本导入 MAC 后校验旧归属，逐台或批量确认迁移，不提供切换固件按钮。校验仍使用真实版本、授权、硬件和路径。App 基线支持≥／=／≤且含边界，清单选填只收窄。", loc: "指定 MAC > 定向设备清单" });
  notes.product[0].body = "沿用可控发布产品详情事实页面；固件和虚拟版本五状态、互斥测试范围与正式发布区域子集使用设置范围统一配置。产品区域内测仍只控制产品可见性。";
  versionStatusTips.firmware = [["开发中", "尚未投放，可直接选择测试或正式范围。"], ["测试中", "公司用户、MAC、外部授权白名单仅一路由生效，可互相切换。"], ["发布中", "按当前正式区域子集自动开放；暂停是执行标记。"], ["已发布", "配置正式范围内100%开放，不表示所有设备完成升级。"], ["已停止", "生命周期终止，不提供新候选，不可恢复。"]];
  firmwareVersionHtml = firmwareHtml;
  virtualVersionHtml = virtualHtml;
  wireFirmware = wire;
  wireVirtualFirmware = () => {};
  renderDirectedDemo = demo;
  targetSummary = summary;
  trialStage = target => target.status === "测试中" ? summary(target) : "";
  openDirectedDrawer = open;
  const previousRender = renderFirmware;
  renderFirmware = () => { reconcile(); previousRender(); };
  const previousSync = syncPublishRangesWithListingRange;
  syncPublishRangesWithListingRange = previous => { previousSync(previous); reconcile(); };
  window.FirmwareScope = { open, mode, resolve, publicRegions, coverage, reconcile, executeScheduled, tick, apply, makeDraft, errorFor, archive, heldDevices, setFailure: kind => { failure = kind; }, getDraft: () => draft };
  if (window.matchMedia("(max-width: 900px)").matches) setNotesOpen(false);
  render();
  setInterval(() => tick(), 1000);
})();
