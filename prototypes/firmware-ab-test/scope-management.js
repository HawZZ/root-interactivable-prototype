/* Firmware scope management shares the existing product page and fixed package references. */
(() => {
  const labels = { company: "仅内部测试", mac: "指定 MAC", whitelist: "授权白名单用户", public: "正式发布" };
  const externalLabels = { company: "暂不开放", mac: "指定设备 MAC", whitelist: "授权白名单用户" };
  const clone = value => structuredClone(value);
  const heldDevices = new Map();
  const archive = [];
  const day = 86400000;
  let draft = null;
  let appCompatibilityDraft = null;
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
    return JSON.stringify({ target, trial: trialFor(target.id), ...(isVirtualTarget(target) && ["开发中", "测试中"].includes(target.status) ? { componentAppEvidence: virtualAppEvidence(target) } : {}) });
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
    return { id: target.id, route, original: fingerprint(target), compatibility: clone(scheduledReleasePending(target) && target.releaseConfig.appCompatibility || appCompatibilityOf(target)), trial: clone(trialFor(target.id) || { label: target.version, apps: [], status: "运行中", devices: [] }), filter: legacyTags ? "specified" : target.whitelistFilter || "all", userIds: clone(userIds), userTag: "", userSearch: "", migrations: [], release: clone(target.releaseConfig || { mode: "自动发布", range: [], batchDays: "5", upgradeMode: "提示升级", effectiveAt: "立即生效", time: "" }) };
  }
  function appCompatibilityChanged(target, condition) {
    return JSON.stringify(appConditionBounds(appCompatibilityOf(target))) !== JSON.stringify(appConditionBounds(condition));
  }
  function appCompatibilityHtml(target) {
    const condition = draft.compatibility;
    const virtualHint = isVirtualTarget(target) ? `<span class="hint">${scheduledReleasePending(target) ? '计划交集；到点复核关联固件条件。' : ["发布中", "已发布", "已停止"].includes(target.status) ? '正式交集已固定。' : '自动取全部关联固件的交集，测试期间自动重算，正式发布后固定。'}${target.compatibilityReview ? '历史组件APP条件待核对，保留原兼容范围。' : ''}</span>` : '';
    return `<div class="scope-app-requirement" id="scope-app-compatibility" data-note-anchor="scope-app-compatibility"><span>APP版本号：</span><strong>${escapeHtml(appConditionLabel(condition))}</strong>${virtualHint}</div>`;
  }
  function appErrorFor(target, next) {
    if (!validFirmwareAppCondition(next.compatibility)) return isVirtualTarget(target) ? "关联固件无共同兼容APP版本，不能测试或发布。" : "请选择有效的APP版本号条件并填写版本号。";
    if (isVirtualTarget(target) && appCompatibilityChanged(target, next.compatibility)) return "虚拟版本APP版本号自动取关联固件交集，不可独立修改。";
    if (!isVirtualTarget(target) && !["版本不低于", "版本等于", "版本不高于"].includes(next.compatibility.appRule)) return "请选择有效的APP版本号条件。";
    if (!firmwareAppVersionEditable(target) && appCompatibilityChanged(target, next.compatibility)) return "发布开始后APP版本号不可修改。";
    if (!isVirtualTarget(target) && appCompatibilityChanged(target, next.compatibility)) {
      for (const dependent of virtualVersions.filter(version => version.status === "测试中" && version.members.includes(target.id))) {
        const intersection = appCompatibilityOf(dependent, target.id, next.compatibility);
        if (!validFirmwareAppCondition(intersection)) return `关联虚拟版本 ${dependent.version} 无共同兼容APP版本，整单未保存。`;
        if ((trialFor(dependent.id)?.apps || []).some(app => !experienceAppMatchesFirmware(app, intersection))) return `关联虚拟版本 ${dependent.version} 的指定APP版本不符合新交集，请先调整该清单，整单未保存。`;
      }
    }
    if (next.route === "mac") {
      if (next.trial.apps.some(app => !/^\d+(?:\.\d+)*$/.test(app) || !experienceAppMatchesFirmware(app, next.compatibility))) return "指定APP版本必须全部符合APP版本号兼容条件，请调整清单。";
    }
    return "";
  }
  function errorFor(target, next) {
    if (!target || !canRoute(target, next.route)) return "当前生命周期不允许该范围。";
    if (fingerprint(target) !== next.original) return "版本或定向配置已变化，请重新打开配置。";
    if (scheduledReleasePending(target)) return "请先取消定时发布，再修改生效范围。";
    if (target.referenceReview) return "虚拟版本包引用待核对，不能扩大投放。";
    const appError = appErrorFor(target, next);
    if (appError) return appError;
    if (appCompatibilityChanged(target, next.compatibility)) return "请通过APP兼容配置修改APP版本号，测试／发布配置仅展示。";
    if (next.route === "mac") {
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
    return { ...clone(device), targetId: target.id, frozenApps: clone(device.frozenApps || trialFor(target.id)?.apps || []), baseline: appCompatibilityOf(target), authorizationFrozen: device.authorization === "已失效" };
  }
  function makeAppCompatibilityDraft(target) {
    return { id: target.id, original: fingerprint(target), compatibility: appCompatibilityOf(target) };
  }
  function appCompatibilityError(target, next) {
    if (!target || targetById(target.id) !== target || next.id !== target.id) return "版本不存在或配置对象已变化。";
    if (isVirtualTarget(target)) return "虚拟版本APP版本号自动派生，不可独立修改。";
    if (scheduledReleasePending(target)) return "请先取消定时发布，再修改APP兼容配置。";
    if (!firmwareAppVersionEditable(target)) return "当前状态不允许修改APP兼容配置。";
    if (fingerprint(target) !== next.original) return "版本或投放配置已变化，请重新打开APP兼容配置。";
    return appErrorFor(target, { ...next, route: mode(target), trial: trialFor(target.id) || { apps: [] } });
  }
  function applyAppCompatibility(target, next) {
    const error = appCompatibilityError(target, next);
    if (error) return error;
    if (failure === "submit") { failure = ""; return "模拟保存失败；原APP版本号、状态及投放配置保持。"; }
    if (!appCompatibilityChanged(target, next.compatibility)) return "";
    const affected = [target, ...virtualVersions.filter(version => version.status === "测试中" && version.members.includes(target.id))];
    affected.forEach(version => {
      (trialFor(version.id)?.devices || []).filter(device => device.authorization === "已失效" && !heldDevices.get(device.mac)?.authorizationFrozen).forEach(device => heldDevices.set(device.mac, frozenDevice(version, device)));
    });
    target.appRule = next.compatibility.appRule;
    target.appVersion = `v ${normalizedAppVersion(next.compatibility.appVersion)}`;
    target.scopeRevision++;
    recordDirected(`APP兼容配置：${trialLabel(target)}，${appConditionLabel(appCompatibilityOf(target))}；状态及投放配置保持`, [target.id]);
    return "";
  }
  function openAppCompatibility(id) {
    const target = targetById(id);
    if (!target) return;
    const next = makeAppCompatibilityDraft(target);
    const error = appCompatibilityError(target, next);
    if (error) { showToast(error); return; }
    draft = null;
    appCompatibilityDraft = next;
    showDirectedShell("appCompatibilityConfig", "APP兼容配置", "", `<div id="app-compatibility-config" data-note-anchor="app-compatibility-config"><div><strong>${escapeHtml(trialLabel(target))}</strong> <span class="tag ${firmwareStatusClass(target.status)}">${target.status}</span></div><div class="field" style="margin-top:20px"><label for="appCompatibilityVersion">APP版本号</label><div class="version-rule"><select id="appCompatibilityRule" aria-label="APP版本号条件">${["版本不低于", "版本等于", "版本不高于"].map(rule => `<option ${next.compatibility.appRule === rule ? 'selected' : ''}>${rule}</option>`).join('')}</select><input id="appCompatibilityVersion" value="${escapeAttr(normalizedAppVersion(next.compatibility.appVersion))}" placeholder="例如：2.2.10"></div></div><div class="notice">保存仅更新APP版本号条件，不改变固件状态及投放配置。</div><div class="notice error hide" id="appCompatibilityError" role="alert"></div></div>`, "保存");
    $("#drawerSave").onclick = () => {
      appCompatibilityDraft.compatibility = { appRule: $("#appCompatibilityRule").value, appVersion: $("#appCompatibilityVersion").value.trim() };
      const result = applyAppCompatibility(targetById(id), clone(appCompatibilityDraft));
      if (result) { const node = $("#appCompatibilityError"); node.textContent = result; node.classList.remove("hide"); return; }
      closeDrawer(); appCompatibilityDraft = null; renderFirmware(); showToast("APP兼容配置已保存");
    };
  }
  function apply(target, next) {
    const error = errorFor(target, next);
    if (error) return error;
    if (failure === "submit") { failure = ""; return "模拟提交失败；旧范围、状态和 MAC 锁完整保留。"; }
    if (target.id.startsWith("vv") && target.status === "开发中") {
      try { freezeVirtual(target); } catch (err) { return err.message; }
    }
    const timed = next.route === "public" && ["开发中", "测试中"].includes(target.status) && next.release.effectiveAt === "定时生效" && Date.parse(next.release.time) > Date.now();
    const compatibility = isVirtualTarget(target) ? clone(next.compatibility) : { appRule: next.compatibility.appRule, appVersion: `v ${normalizedAppVersion(next.compatibility.appVersion)}` };
    if (timed) {
      target.releaseConfig = { ...clone(next.release), appCompatibility: compatibility, ...(isVirtualTarget(target) ? { componentAppEvidence: virtualAppEvidence(target) } : {}) };
      delete target.scheduleError;
      delete target.scheduleEvidenceInvalid;
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
      release.appCompatibility = compatibility;
      if (isVirtualTarget(target) && !wasPublic) {
        target.frozenAppCompatibility = clone(compatibility);
        target.frozenAppEvidence = virtualAppEvidence(target);
      }
      release.startedAt = wasPublic ? target.releaseConfig.startedAt : Date.now();
      release.coverage = release.mode === "全面发布" && !target.releasePaused ? 100 : oldCoverage || Math.ceil(100 / Number(release.batchDays));
      release.effectiveAt = wasPublic ? target.releaseConfig.effectiveAt : "已生效";
      target.releaseConfig = release;
      target.status = target.status === "已发布" || (release.mode === "全面发布" && !target.releasePaused) ? "已发布" : "发布中";
      target.revokedRegions = (target.revokedRegions || []).filter(region => !release.range.includes(region));
    } else if (target.status === "开发中") target.status = "测试中";
    target.scopeRevision++;
    recordDirected(`${next.route === "public" ? "发布配置" : "测试配置"}：${labels[next.route]}`, [target.id]);
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
    return `<div id="scope-fields"><div class="form-grid single-field"><div class="field" id="scope-app-selection" data-note-anchor="scope-app-selection"><label for="scopeApps">指定APP版本</label><input id="scopeApps" value="${escapeAttr(trial.apps.join(", "))}" placeholder="例如：${escapeAttr(normalizedAppVersion(validFirmwareAppCondition(draft.compatibility) ? draft.compatibility.appVersion : target.appVersion))}" aria-describedby="scopeAppsHint"><span class="hint" id="scopeAppsHint">填写后，本次定向设备仅可通过指定的APP版本查询该版本OTA；留空则按上方“APP版本号”条件匹配。多个版本用半角逗号分隔，所有版本均须符合上方“APP版本号”条件。</span></div></div><div class="subsection-head"><h3>定向设备（${trial.devices.length}）</h3><div class="trial-inline-actions"><button class="btn" id="scopeImport">批量导入 MAC</button><button class="btn" id="scopePauseMac" ${!trial.devices.length ? "disabled" : ""}>${trial.status === "已暂停" ? "继续定向" : "暂停定向"}</button></div></div><div class="trial-device-table"><table><thead><tr><th>MAC / 用户</th><th>操作</th></tr></thead><tbody>${trial.devices.map(device => `<tr><td>${device.mac}<span class="sub">${escapeHtml(device.user || "未绑定（寄出前）")}</span></td><td class="table-actions"><button class="btn danger" data-scope-remove="${device.mac}">移出</button></td></tr>`).join("") || `<tr><td colspan="2">暂无定向设备。公司用户仍可进行内部测试。</td></tr>`}</tbody></table></div></div>`;
  }
  function releaseBody(target) {
    const release = draft.release;
    const published = ["发布中", "已发布"].includes(target.status);
    return `<div id="scope-fields">${target.revokedRegions?.length ? `<div class="notice warning">已撤销区域：${escapeHtml(target.revokedRegions.join("、"))}。重新上架后仍需显式选择。</div>` : ""}<div class="field"><label><span class="required">*</span>正式发布范围</label><div class="check-row">${publicRegions().map(region => `<label><input type="checkbox" data-scope-region="${escapeAttr(region)}" ${release.range.includes(region) ? "checked" : ""}> ${escapeHtml(region)}</label>`).join("") || "产品当前没有公开上架区域"}</div><span class="hint">可选择产品公开上架范围的子集；待内测区域不可选。</span></div><div class="form-grid"><div class="field"><label>发布方式</label><select id="scopeReleaseMode"><option value="自动发布" ${release.mode === "自动发布" ? "selected" : ""} ${target.status === "已发布" ? "disabled" : ""}>灰度发布</option><option value="全面发布" ${release.mode === "全面发布" ? "selected" : ""}>全量发布</option></select></div><div class="field"><label>灰度发布天数</label><input id="scopeDays" type="number" min="1" value="${release.batchDays}" ${published || release.mode === "全面发布" ? "disabled" : ""}></div><div class="field"><label>升级方式</label><select id="scopeUpgrade"><option ${release.upgradeMode === "提示升级" ? "selected" : ""}>提示升级</option><option ${release.upgradeMode === "强制升级" ? "selected" : ""}>强制升级</option><option ${release.upgradeMode === "静默升级" ? "selected" : ""}>静默升级</option></select></div><div class="field"><label>生效时间</label><select id="scopeEffective" ${published ? "disabled" : ""}><option ${release.effectiveAt !== "定时生效" ? "selected" : ""}>立即生效</option><option ${release.effectiveAt === "定时生效" ? "selected" : ""}>定时生效</option></select></div>${release.effectiveAt === "定时生效" && !published ? `<div class="field"><label>定时发布时间</label><input id="scopeTime" type="datetime-local" value="${escapeAttr(release.time || "")}"></div>` : ""}</div>${published ? `<div class="notice">开放覆盖：${coverage(target)}% · ${target.releasePaused ? "已暂停，不返回新候选" : "投放中"}。新增区域${target.status === "已发布" ? "全面开放" : "沿用当前进度"}。</div>` : ""}${target.status === "发布中" ? `<button class="btn" id="scopePauseRelease">${target.releasePaused ? "继续发布" : "暂停发布"}</button>` : ""}${legacyHtml(target)}</div>`;
  }
  function readFields() {
    if (!draft) return;
    if (draft.route === "mac") {
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
  function open(id, stage) {
    reconcile();
    const target = targetById(id);
    if (!target || target.status === "已停止") return;
    draft = makeDraft(target);
    appCompatibilityDraft = null;
    if (scheduledReleasePending(target) || stage === "release") draft.route = "public";
    state.directedTargetId = id;
    draw();
  }
  function draw() {
    const target = targetById(draft.id);
    const pending = scheduledReleasePending(target);
    const testing = draft.route !== "public";
    const body = `<div id="scope-summary" data-note-anchor="scope-summary"><strong>${escapeHtml(trialLabel(target))}</strong> <span class="tag ${firmwareStatusClass(target.status)}">${target.status}</span><span class="sub">当前配置：${target.status === "开发中" ? "尚未投放" : labels[mode(target)]}${target.releasePaused ? " · 已暂停" : ""}</span>${appCompatibilityHtml(target)}</div>${target.id.startsWith("vv") && target.status === "开发中" && !target.frozen ? '<div class="subsection-head"><span>组件尚未冻结</span><button class="btn" id="scopeEditMembers">编辑组件</button></div>' : ""}${pending ? `<div class="notice warning" id="scope-scheduled">待定时发布：${escapeHtml(target.releaseConfig.time)} · ${escapeHtml(target.releaseConfig.range.join("、"))}<button class="btn" id="scopeCancelSchedule">取消定时发布</button></div>` : ""}${testing ? `<div class="notice" id="scope-internal" data-note-anchor="scope-internal">公司用户可获取测试版本。</div><div class="field" id="scope-route" data-note-anchor="scope-route"><label>对外开放</label><div class="check-row">${Object.entries(externalLabels).map(([route, label]) => `<label><input type="radio" name="scopeRoute" value="${route}" ${draft.route === route ? "checked" : ""} ${pending ? "disabled" : ""}> ${label}</label>`).join("")}</div></div>` : ""}${testing ? testBody(target) : releaseBody(target)}<div class="notice error hide" id="scopeError" role="alert"></div>`;
    showDirectedShell("scopeConfig", pending ? "发布计划" : testing ? "测试配置" : "发布配置", "", body, pending ? "计划待生效" : "确认生效");
    if (pending) $$("#scope-fields input, #scope-fields select, #scope-fields button").forEach(control => { control.disabled = true; });
    $("#drawerSave").disabled = pending;
    $("#drawerSave").onclick = save;
    $$('[name="scopeRoute"]').forEach(input => input.onchange = () => {
      readFields();
      draft.route = input.value;
      if (draft.route === "mac" && mode(target) !== "mac") draft.trial = { label: target.version, apps: [], status: "运行中", devices: [] };
      draft.migrations = draft.route === "mac" ? draft.migrations : [];
      draw();
    });
    $("#scopeEditMembers")?.addEventListener("click", () => {
      state.virtualEditingId = target.id;
      state.virtualDraftMembers = new Set(target.members);
      openDrawer("virtualVersionEdit");
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
  async function pauseRelease(target, fromList = false) {
    const before = fingerprint(target);
    const nextPaused = !target.releasePaused;
    const ok = await showConfirm(nextPaused ? "暂停发布" : "继续发布", nextPaused ? "暂停期间不返回该版本新候选，主状态保持发布中。未保存的编辑不生效。" : `按已保存${target.releaseConfig.mode}继续；未保存编辑不生效。`, nextPaused ? "确认暂停" : "确认继续");
    if (!ok) return;
    if (fingerprint(target) !== before || target.status !== "发布中") { (fromList ? showToast : showError)("配置已变化，请重新打开。"); return; }
    if (nextPaused) target.releaseConfig.coverage = coverage(target);
    target.releasePaused = nextPaused;
    if (!nextPaused) { target.releaseConfig.coverage = coverage(target); if (target.releaseConfig.coverage === 100) target.status = "已发布"; }
    target.scopeRevision++;
    if (!fromList) open(target.id);
    renderFirmware();
    if (fromList) renderNotes();
  }
  async function cancelSchedule(target) {
    const before = fingerprint(target);
    const ok = await showConfirm("取消定时发布", target.status === "开发中" ? "仅撤销计划；仍为开发中未投放，已固定的虚拟引用不解冻。" : "仅撤销计划；原测试范围、暂停标记和 MAC 锁保持。", "确认取消");
    if (!ok) return;
    if (fingerprint(target) !== before || !scheduledReleasePending(target)) { showError("计划已变化或已执行，本次取消未生效。"); return; }
    delete target.releaseConfig; delete target.scheduleError; delete target.scheduleEvidenceInvalid; target.scopeRevision++;
    open(target.id); renderFirmware();
  }
  function executeScheduled(id, now = Date.now()) {
    const target = targetById(id);
    if (!target || !scheduledReleasePending(target)) return "计划不存在或已终止";
    if (target.scheduleEvidenceInvalid) return "关联固件APP版本号已变化，请取消计划并重新配置发布";
    const evidenceChanged = isVirtualTarget(target) && JSON.stringify(target.releaseConfig.componentAppEvidence) !== JSON.stringify(virtualAppEvidence(target));
    const error = scheduledReleaseValidation(target);
    if (error || failure === "scheduled") {
      if (evidenceChanged) target.scheduleEvidenceInvalid = true;
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
    retainInstalled(target); closeDirected(target, remove ? "删除" : "停止");
    if (isVirtualTarget(target)) target.frozenAppCompatibility = appCompatibilityOf(target);
    delete target.releaseConfig; target.releasePaused = false; target.status = "已停止"; target.scopeRevision++;
    if (remove) { archive.push(clone(target)); if (id.startsWith("vv")) virtualVersions = virtualVersions.filter(row => row.id !== id); else firmwareVersions = firmwareVersions.filter(row => row.id !== id); }
    state.firmwareMessage = `${trialLabel(target)} 已${remove ? "删除" : "停止"}；设备保留已安装版本。`;
    render();
  }
  function testEligible(target, request) {
    if (target.status !== "测试中") return false;
    if (request.userType === "公司用户") return true;
    if (mode(target) !== "whitelist" || request.userType !== "外部用户" || !request.authorized) return false;
    const user = callerUser(request);
    if (!user || user.type !== "外部用户" || !user.products.includes(products[state.product].name)) return false;
    return target.whitelistFilter !== "specified" || (target.whitelistUserIds || []).includes(user.id);
  }
  function candidateResponse(target, request, status, reason) {
    if (target.referenceReview) return { status: "HOLD_CURRENT_VERSION", reason: "固定资源引用待核对" };
    const current = request.current || assetVersionForTarget(directedAssetInventory[request.mac], target) || "0.0.0";
    const upgradeRequired = compareVersion(current, target.version) < 0;
    return { status, targetId: target.id, reason, upgradeRequired, resources: upgradeRequired ? firmwareDownloadResources(target) : [] };
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
      return candidateResponse(target, request, "精确目标", `${trialLabel(target)}；不比较其他更高版本`);
    }
    const asset = directedAssetInventory[request.mac];
    const candidates = allFirmwareTargets().filter(row => {
      if (row.referenceReview || (row.id.startsWith("vv") ? "虚拟版本" : "单 MCU") !== request.path || !experienceAppMatchesFirmware(request.app, row) || (asset && !assetFitsTarget(asset, row))) return false;
      const current = request.current || assetVersionForTarget(asset, row) || "0.0.0";
      if (compareVersion(current, row.version) > 0) return false;
      if (row.legacyTargeting && row.targetMode !== "不限" && !(row.targetValues || []).includes(row.targetMode === "设备" ? request.mac : request.user)) return false;
      if (!lostAuth && testEligible(row, request)) return true;
      return mode(row) === "public" && ["发布中", "已发布"].includes(row.status) && !row.releasePaused && listed && row.releaseConfig?.range.includes(region) && request.covered !== false;
    }).sort((a, b) => compareVersion(b.version, a.version));
    return candidates.length ? candidateResponse(candidates[0], request, "普通候选", `${trialLabel(candidates[0])}；按当前生效范围与普通升级策略`) : { status: "HOLD_CURRENT_VERSION", reason: "无符合当前范围的候选，保持已安装版本" };
  }
  function actions(target) {
    const remove = `<button class="btn danger" data-scope-delete="${target.id}">删除</button>`;
    if (target.status === "已停止") return `<div class="version-actions">${remove}</div>`;
    let configure;
    if (scheduledReleasePending(target)) configure = `<button class="btn primary" data-scope-release="${target.id}">发布</button>`;
    else if (["开发中", "测试中"].includes(target.status)) configure = `<button class="btn primary" data-scope-open="${target.id}" data-scope-stage="test">${target.status === "开发中" ? "进入测试" : "测试配置"}</button><button class="btn" data-scope-release="${target.id}">发布</button>`;
    else configure = `<button class="btn primary" data-scope-open="${target.id}" data-scope-stage="release">${target.status === "已发布" ? "修改发布配置" : "修改发布"}</button>${target.status === "发布中" ? `<button class="btn" data-scope-pause-release="${target.id}">${target.releasePaused ? "继续" : "暂停发布"}</button>` : ""}`;
    return `<div class="version-actions">${configure}<button class="btn danger" data-scope-stop="${target.id}">停止</button>${remove}</div>`;
  }
  function summary(target) {
    if (target.status === "开发中") return "尚未投放";
    if (target.status === "已停止") return "已停止投放";
    if (mode(target) === "mac") return `指定 MAC · ${trialFor(target.id)?.devices.length || 0} 台${trialFor(target.id)?.status === "已暂停" ? " · 已暂停" : ""}`;
    if (mode(target) === "whitelist") return `外部授权白名单${target.whitelistFilter === "specified" ? ` · 指定 ${(target.whitelistUserIds || []).length} 人` : " · 全部已授权"}`;
    if (mode(target) === "public") return target.releaseConfig?.range.length ? target.releaseConfig.range.join("、") : "无有效发布范围";
    return "仅内部测试";
  }
  function firmwareHtml() {
    const counts = firmwareVersions.reduce((result, target) => { result[target.status] = (result[target.status] || 0) + 1; return result; }, {});
    return `<div id="firmware-state" data-note-anchor="firmware-state"><div class="subsection-head"><h3>固件版本</h3><button class="btn primary" id="scopeNewFirmware">新建固件版本</button></div><div class="firmware-state-flow">${["开发中", "测试中", "发布中", "已发布", "已停止"].map(status => `<div class="firmware-state"><strong>${status}</strong><span>${counts[status] || 0} 条</span></div>`).join("")}</div>${state.firmwareMessage ? `<div class="notice success">${escapeHtml(state.firmwareMessage)}</div>` : ""}<div class="trial-device-table"><table><thead><tr><th>固件名称</th><th>类型</th><th>通道</th><th>版本</th><th>硬件</th><th>功能版本</th><th>APP版本号</th><th>生效范围</th><th>状态</th><th>创建时间</th><th>备注</th><th>操作</th></tr></thead><tbody>${firmwareVersions.map(target => `<tr><td>${escapeHtml(target.name)}</td><td>${target.type}</td><td>${target.channel || "--"}</td><td>${target.version}</td><td>${target.hardware}</td><td>${target.functionVersion}</td><td>${target.appRule} ${target.appVersion}${firmwareAppVersionEditable(target) ? `<span class="sub"><button type="button" class="btn link" data-app-compatibility-open="${target.id}">APP兼容配置</button></span>` : ""}</td><td>${escapeHtml(summary(target))}${target.legacyTargeting ? `<span class="sub">存量限制 ${escapeHtml(target.targetValues.join("、"))}</span>` : ""}</td><td><span class="tag ${firmwareStatusClass(target.status)}">${target.status}</span>${target.releasePaused ? `<span class="sub">已暂停</span>` : ""}${target.releaseConfig && mode(target) === "public" ? `<span class="sub">开放 ${coverage(target)}%</span>` : ""}${scheduledReleasePending(target) ? `<span class="sub">待定时发布${target.scheduleError ? " · 校验失败" : ""}</span>` : ""}</td><td>${target.createdAt}</td><td>${escapeHtml(target.log)}</td><td class="table-actions">${actions(target)}</td></tr>`).join("")}</tbody></table></div></div>`;
  }
  function virtualHtml() {
    return `<div id="virtual-version" data-note-anchor="virtual-version"><div class="subsection-head"><h3>虚拟版本</h3><button class="btn primary" id="scopeNewVirtual">新建虚拟版本</button></div>${state.firmwareMessage ? `<div class="notice success">${escapeHtml(state.firmwareMessage)}</div>` : ""}<div class="trial-device-table"><table><thead><tr><th>版本</th><th>APP版本号</th><th>固定组件</th><th>生效范围</th><th>状态</th><th>操作</th></tr></thead><tbody>${virtualVersions.map(target => `<tr><td>${target.version}</td><td>${escapeHtml(appConditionLabel(appCompatibilityOf(target)))}${target.compatibilityReview ? `<span class="sub">历史组件APP条件待核对</span>` : ""}</td><td>${virtualMembers(target).map(member => `${member.hardware}/${member.channel}/${member.version}`).join("；")}<span class="sub">${target.referenceReview ? "引用待核对" : target.frozen ? "首次范围提交已冻结" : "待首次范围提交冻结"}</span></td><td>${escapeHtml(summary(target))}${target.legacyTargeting ? `<span class="sub">存量指定用户：${escapeHtml(target.targetValues.join("、"))}</span>` : ""}</td><td><span class="tag ${firmwareStatusClass(target.status)}">${target.status}</span>${target.releasePaused ? `<span class="sub">已暂停</span>` : ""}</td><td class="table-actions">${actions(target)}</td></tr>`).join("")}</tbody></table></div></div>`;
  }
  function wire() {
    $$('[data-app-compatibility-open]').forEach(button => button.onclick = () => openAppCompatibility(button.dataset.appCompatibilityOpen));
    $$('[data-scope-open]').forEach(button => button.onclick = () => open(button.dataset.scopeOpen, button.dataset.scopeStage));
    $$('[data-scope-release]').forEach(button => button.onclick = () => open(button.dataset.scopeRelease, "release"));
    $$('[data-scope-pause-release]').forEach(button => button.onclick = () => pauseRelease(targetById(button.dataset.scopePauseRelease), true));
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
    const query = path => { const company = $("#scopeDemoType").value === "公司用户"; const user = whitelistUsers.find(row => row.id === $("#scopeDemoUser").value); const result = resolve({ mac: selector.value, path, userType: $("#scopeDemoType").value, userId: company ? "u3" : user?.id, authorized: $("#scopeDemoAuthorized").checked && (company || user?.products.includes(products[state.product].name)), app: $("#scopeDemoApp").value, region: company ? "北美数据中心" : user?.dc }); $("#scopeDemoResult").textContent = `${result.status} · ${result.reason}${result.upgradeRequired ? `；返回 ${result.resources.length} 个固件资源链接` : ""}`; };
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
    lockFirmwareAppCompatibility(target);
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
    { id: "firmware-state", title: "基线入口与必要增量", body: "开发中：进入测试、发布；测试中：测试配置、发布；发布中：修改发布、暂停发布／继续；已发布：修改发布配置。分阶段显隐、修改发布及暂停／继续复用可控发布基线；测试配置、开发中直接发布及全状态终止是本次增量。未停止可停止和删除，已停止仅删除。待定时仍从发布入口查看只读发布计划，取消后才可编辑。点击入口只打开草稿，确认后生效。单固件APP版本号列另有APP兼容配置，仅修改兼容条件，不改变生命周期或范围。", loc: "固件配置 > 版本列表" },
    { id: "virtual-version", title: "虚拟版本阶段操作及固定时点", body: "行操作与固件版本一致。APP版本号自动取全部关联固件交集，开发中和测试中随组件条件自动重算，进入发布中／已发布时固定；组件和包仍首次成功提交测试／发布配置时冻结，含定时计划。取消计划不解冻组件；APP交集重算不替换组件，不联动组件状态。未删除引用仍阻断组件删除。", loc: "固件配置 > 虚拟版本" }
  ];
  notes.scopeConfig = [
    { id: "scope-summary", title: "入口决定配置阶段", body: "进入测试／测试配置进入测试配置，发布／修改发布／修改发布配置进入发布配置；待定仍通过发布进入只读发布计划。抽屉不再选择测试／发布。需换阶段时关闭后从列表进入，未提交草稿不沿用。标题对应当前配置或只读发布计划。点击不改状态，取消不生效；确认仅原／新范围一句话，失败保留原配置、暂停及锁。", loc: "测试／发布配置 > 版本信息" },
    { id: "scope-app-compatibility", title: "APP版本号只读展示", body: "测试配置、发布配置及定时计划仅展示APP版本号，不承接修改，也没有字段级完成／取消。单固件需要修改时，关闭当前抽屉，回到版本列表的APP兼容配置独立保存；开发中／测试中可改，待定时先取消计划，正式后固定。虚拟始终展示全部关联固件条件交集，测试自动重算、正式时固定；虚拟计划保存交集及组件条件证据，到点变化则阻断发布。", loc: "测试／发布配置 > 版本信息" },
    { id: "scope-internal", title: "公司用户默认测试候选", body: "全部测试中版本参与公司用户普通候选匹配，仍校验产品区域、硬件、App和禁止降级。已有MAC锁则精确目标优先；暂停保锁。指定APP版本不影响未定向公司设备。", loc: "测试 > 内部测试" },
    { id: "scope-route", title: "对外开放互斥", body: "暂不开放／MAC／授权用户互转，公司默认资格保持。退出MAC释放锁，暂停不释放；清空名单不回退状态，再次进入不恢复旧名单。外部用户仍需当前产品授权。", loc: "测试 > 对外开放" },
    { id: "scope-fields", title: "设备、用户与发布配置", body: "MAC-only导入，冲突默认未选，确认后整批迁移。设备表仅MAC／已有账号及移出，未绑定可导入。用户选择器标签／搜索只筛列表，全选当前结果、跨筛选保留，按用户ID及授权命中。正式区域仍是公开子集，暂停编辑不继续，区域下架撤销且不自动恢复。列表和配置页的暂停／继续均需确认，按已保存策略执行，不提交未保存草稿。", loc: "测试／发布配置 > 配置内容" },
    { id: "scope-app-selection", title: "指定APP版本（定向）", body: "仅在指定MAC配置显示，选填并维护当前MAC目标的APP清单，示例使用兼容边界值而不预填实际配置。填写后仅这些APP版本可为本次定向设备查询该版本OTA，仍须符合顶部APP版本号；留空继承。公司使用已定向MAC同样受限，其他公司设备不受清单影响。错App保留列表但阻断控制／设置／命令，资格失效仍保留原可用组合。", loc: "指定设备MAC > 指定APP版本" },
    { id: "scope-scheduled", title: "定时及原子竞争", body: "等待保留原状态／配置／锁，测试编辑先取消计划。到点复核失败不公开；取消、执行、停止、删除只一次生效。正式开始不重设天数或时间。", loc: "发布计划 > 定时计划" },
    { id: "scope-legacy", title: "存量正式限制保留", body: "旧指定对象规则和编辑能力保持，配置全量也不清空历史限制。新版本不继承旧名单。", loc: "发布 > 存量限制" }
  ];
  notes.scopeImport = [{ id: "scope-import", title: "MAC导入与原子迁移", body: "仅MAC一列，不需账号；目标由当前版本确定。冲突默认未选，可批量确认。格式、重复、路径、降级、授权失效、旧目标定时或并发变化整批阻断。加入草稿后仍需确认配置才实际生效。MAC不校验通道适配；虚拟升级命中后返回全部N个关联固定资源链接，通道识别及执行由APP／设备处理。原型示例资源链接不发起真实下载。", loc: "指定设备MAC > 批量导入" }];
  notes.appCompatibilityConfig = [{ id: "app-compatibility-config", title: "APP兼容配置独立保存", body: "入口位于单固件版本列表的APP版本号列，仅开发中／测试中且无待定时计划可用。字段仍叫APP版本号，支持不低于／等于／不高于。保存只改APP条件，保持主状态、投放范围、MAC名单、锁及暂停，不发起测试或发布；取消、提交失败及并发变化不写入。正式版本和虚拟派生交集无入口。保存须重验当前指定APP清单及关联测试虚拟交集，任何冲突整单阻断，不自动删值；需先在测试配置调整指定APP清单。虚拟组件及包引用不解冻。", loc: "版本列表 > APP版本号 > APP兼容配置" }];
  notes.product[0].body = "沿用可控发布事实页面；固件开发、测试与发布管理由列表入口直接进入对应配置。公司默认参与所有测试候选，MAC锁优先。产品区域内测仅控制产品可见性。";
  notes.firmwareVersionAdd = [{ id: "drawer-firmware-version-add", title: "创建固件与APP版本号", body: "版本及硬件由文件解析。APP版本号支持≥／=／≤，创建后通过独立APP兼容配置维护，开发中和测试中可改，正式后固定。新记录为开发中，通过进入测试或发布打开对应配置，确认后生效。", loc: "新建固件版本" }];
  notes.virtualVersionEdit = [{ id: "drawer-virtual-version-edit", title: "只维护未冻结组件", body: "本页维护组件；APP版本号自动取全部组件交集，测试期间自动重算，正式后固定。首次成功提交配置（含定时）后组件与包冻结，取消计划或修改APP条件不解冻组件。", loc: "虚拟版本 > 编辑组件" }];
  notes.virtualVersionCreate = [{ id: "drawer-virtual-version-create", title: "APP交集与组件引用", body: "虚拟版本号创建后固定，APP版本号由全部关联固件自动取交集，开发中和测试中自动重算、正式后固定；支持上下界、单值及闭区间，无交集只可存开发草稿。组件在首次成功提交测试或发布配置时冻结，不联动组件单MCU状态。", loc: "新建虚拟版本" }];
  versionStatusTips.firmware = [["开发中", "尚未投放，可选择测试或直接发布。"], ["测试中", "公司用户默认参与候选；外部按MAC或授权用户开放。"], ["发布中", "灰度开放当前正式区域，暂停为执行标记。"], ["已发布", "所选正式范围100%开放，不代表全部设备已升级。"], ["已停止", "不提供新候选，不可恢复。"]];
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
  window.FirmwareScope = { open, openAppCompatibility, makeAppCompatibilityDraft, applyAppCompatibility, mode, resolve, publicRegions, coverage, reconcile, executeScheduled, tick, apply, makeDraft, errorFor, archive, heldDevices, setFailure: kind => { failure = kind; }, getDraft: () => draft };
  if (window.matchMedia("(max-width: 900px)").matches) setNotesOpen(false);
  render();
  setInterval(() => tick(), 1000);
})();
