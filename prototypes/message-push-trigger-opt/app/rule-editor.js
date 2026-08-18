import { $, esc, showToast } from "./dom.js";
import { appState, placeholders, products, productSources, rules, newRule, dailySummaryGroups, operatorOptions } from "./state.js";
import { renderAnnotations } from "./annotations.js";

const steps = [[1, "消息内容", "独立文案或每日汇总"], [2, "触发条件", "来源、条件与提醒时间"], [3, "投递设置", "目标与发送方式"]];
const product = () => products.find(item => item.id === appState.selectedProductId) || products[0];
const sources = () => productSources[appState.selectedProductId] || { thingModels: [], countdowns: [], consumables: [] };
const groups = () => dailySummaryGroups.filter(group => group.productId === appState.selectedProductId);
const currentGroup = () => dailySummaryGroups.find(group => group.id === appState.rule.dailySummaryGroupId);
const groupValue = (group, field) => group?.values?.["en-US"]?.[field] || "";
const selectedModel = () => sources().thingModels.find(item => item.id === appState.rule.thingModelId) || sources().thingModels[0];
const selectedConsumable = () => sources().consumables.find(item => item.id === appState.rule.consumableId) || sources().consumables[0];
const supportsSummary = () => appState.rule.triggerType === "cloud" || (appState.rule.triggerType === "consumable" && selectedConsumable()?.type === "cloud-timed");
let pickerState = { query: "", group: "all", kind: "all" };

function stepNav() {
  return `<nav class="step-nav" id="ruleStepNav" data-anchor="step-nav"><div class="step-progress"><span>规则配置</span><strong>步骤 ${appState.ruleStep} / 3</strong></div><ol class="step-list">${steps.map(([number, title, subtitle], index) => `<li class="step-slot"><button class="step-item ${number === appState.ruleStep ? "active" : ""} ${number < appState.ruleStep ? "is-complete" : ""}" data-step="${number}"><span class="step-index">${number < appState.ruleStep ? "✓" : number}</span><span class="step-copy"><strong>${title}</strong><small>${subtitle}</small></span></button>${index < 2 ? `<span class="step-connector ${number < appState.ruleStep ? "is-complete" : ""}"></span>` : ""}</li>`).join("")}</ol></nav>`;
}

function messageStep() {
  const rule = appState.rule;
  const group = currentGroup();
  return `<div id="ruleStepContent"><div class="form-section"><div class="section-title"><h3>规则信息</h3><p>当前产品：${esc(product().name)}</p></div><label class="form-row"><span class="form-label"><i class="required">*</i>规则名称</span><input class="el-input" data-rule-input="name" value="${esc(rule.name)}" placeholder="例如：吸乳罩清洗提醒"></label></div>
    <div class="form-section" data-anchor="summary-selector"><div class="section-title"><h3>消息内容</h3><p>先决定是否与当天其他定时提醒合并</p></div><div class="radio-row message-mode-row">
      <label class="choice-card ${!rule.dailySummaryGroupId ? "selected" : ""}"><input type="radio" name="content-mode" value="standalone" ${!rule.dailySummaryGroupId ? "checked" : ""}><span class="choice-copy"><strong>独立发送</strong><small>使用这条规则自己的 Title / Body</small></span></label>
      <label class="choice-card ${rule.dailySummaryGroupId ? "selected" : ""}"><input type="radio" name="content-mode" value="summary" ${rule.dailySummaryGroupId ? "checked" : ""}><span class="choice-copy"><strong>加入每日汇总组</strong><small>与同设备当天预计提醒合成一条消息</small></span></label>
    </div>
    ${rule.dailySummaryGroupId ? `<div class="form-grid summary-config"><label class="form-row full"><span class="form-label"><i class="required">*</i>每日汇总组</span><select class="el-select" data-group-select><option value="">请选择已有汇总组</option>${groups().map(item => `<option value="${item.id}" ${item.id === rule.dailySummaryGroupId ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select><p class="form-help">汇总组请在页面“每日汇总”页签中管理。</p></label>${group ? `<div class="form-row full readonly-message"><span><b>共享 Title</b>${esc(groupValue(group, "title"))}</span><span><b>共享 Body</b>${esc(groupValue(group, "body"))}</span><small>只读预览 · revision ${group.revision}</small></div>` : ""}<label class="form-row full"><span class="form-label"><i class="required">*</i>English 提醒项</span><input class="el-input" maxlength="100" data-rule-input="itemLabel" value="${esc(rule.itemLabel)}" placeholder="例如：Breast shields"><p class="form-help">只显示在 App 消息详情的“今日提醒”中，不进入系统通知或 Body。</p></label></div>` : `<div class="form-grid standalone-content"><label class="form-row full"><span class="form-label"><i class="required">*</i>English Title</span><input class="el-input" maxlength="100" data-content="title" value="${esc(rule.title)}"></label><label class="form-row full"><span class="form-label"><i class="required">*</i>English Body</span><textarea class="el-textarea" maxlength="200" data-content="body">${esc(rule.body)}</textarea></label><label class="form-row full"><span class="form-label">点击后打开</span><select class="el-select" data-rule-input="presetLinkId">${product().presetLinks.map(link => `<option value="${link.id}" ${link.id === rule.presetLinkId ? "selected" : ""}>${esc(link.label)}${link.id === "message-center" ? "（默认）" : ""}</option>`).join("")}</select></label></div><div class="placeholder-area" data-anchor="placeholder-panel"><div><strong>插入内容</strong><span>先点 Title 或 Body，再选择</span></div><div class="placeholder-panel">${placeholders.map(token => `<button type="button" class="placeholder" data-placeholder="${esc(token)}">${esc(token)}</button>`).join("")}</div></div>`}
    </div></div>`;
}

function modelMeta(model) {
  if (!model) return "";
  return `${model.kind === "event" ? "事件" : model.dataType}${model.unit ? ` · ${model.unit}` : ""} · ${model.id}`;
}
function modelGroups() { return [...new Set(sources().thingModels.map(item => item.group || "其他"))]; }
function matchingModels() {
  const keyword = pickerState.query.trim().toLowerCase();
  return sources().thingModels.filter(item => (pickerState.group === "all" || item.group === pickerState.group) && (pickerState.kind === "all" || item.kind === pickerState.kind) && (!keyword || `${item.name} ${item.id} ${item.group}`.toLowerCase().includes(keyword)));
}
function pickerShell() {
  const all = sources().thingModels;
  const rows = matchingModels();
  const current = selectedModel();
  return `<div class="property-picker-host is-open" id="propertyPicker"><div class="property-picker-mask" data-picker-close></div><section class="property-picker"><header class="property-picker-header"><div><h3>选择物模型</h3><p>属性按数据类型配置条件；事件上报即触发。</p></div><button class="icon-btn" data-picker-close>×</button></header><div class="property-picker-toolbar"><div class="property-search"><span>⌕</span><input class="el-input" data-model-query value="${esc(pickerState.query)}" placeholder="搜索名称或标识符"><kbd>Esc</kbd></div><div class="segmented"><button class="${pickerState.kind === "all" ? "active" : ""}" data-model-kind="all">全部</button><button class="${pickerState.kind === "property" ? "active" : ""}" data-model-kind="property">属性</button><button class="${pickerState.kind === "event" ? "active" : ""}" data-model-kind="event">事件</button></div></div><div class="property-picker-body"><aside class="property-group-list"><button class="property-group ${pickerState.group === "all" ? "active" : ""}" data-model-group="all"><span>全部分组</span><b>${all.length}</b></button>${modelGroups().map(group => `<button class="property-group ${pickerState.group === group ? "active" : ""}" data-model-group="${esc(group)}"><span>${esc(group)}</span><b>${all.filter(item => item.group === group).length}</b></button>`).join("")}</aside><section class="property-results"><div class="property-results-head"><span>${pickerState.query ? `“${esc(pickerState.query)}” 的结果` : "可选物模型"}</span><small>${rows.length} 个</small></div><div class="property-option-list">${rows.length ? rows.map(item => `<button class="property-option ${item.id === current?.id ? "selected" : ""}" data-select-model="${item.id}"><span class="property-type-icon">${item.kind === "event" ? "E" : item.dataType === "enum" ? "≡" : item.dataType === "string" ? "T" : "#"}</span><span class="property-option-copy"><strong>${esc(item.name)}</strong><small>${esc(modelMeta(item))}</small></span><span class="property-option-side"><b>${item.id === current?.id ? "已选" : "选择"}</b></span></button>`).join("") : `<div class="property-empty"><strong>没有匹配结果</strong><span>可换个名称或分组。</span></div>`}</div></section></div><footer class="property-picker-footer"><span>来源：当前产品物模型配置</span><button class="el-btn" data-picker-close>取消</button></footer></section></div>`;
}
function closePicker() { $("#propertyPicker")?.remove(); }
function renderPicker() { const host = $("#propertyPicker"); if (!host) return; host.outerHTML = pickerShell(); wirePicker(); }
function selectModel(model) {
  appState.rule.thingModelId = model.id;
  appState.rule.operator = operatorOptions[model.dataType][0];
  appState.rule.conditionValues = [];
  appState.rule.conditionValue = model.kind === "event" ? "true" : model.dataType === "bool" ? "true" : model.dataType === "enum" ? model.options[0]?.value || "" : model.example || "";
}
function wirePicker() {
  const host = $("#propertyPicker");
  host.querySelectorAll("[data-picker-close]").forEach(button => button.onclick = closePicker);
  host.querySelector("[data-model-query]").oninput = event => { pickerState.query = event.target.value; renderPicker(); };
  host.querySelectorAll("[data-model-kind]").forEach(button => button.onclick = () => { pickerState.kind = button.dataset.modelKind; renderPicker(); });
  host.querySelectorAll("[data-model-group]").forEach(button => button.onclick = () => { pickerState.group = button.dataset.modelGroup; renderPicker(); });
  host.querySelectorAll("[data-select-model]").forEach(button => button.onclick = () => { const model = sources().thingModels.find(item => item.id === button.dataset.selectModel); if (!model) return; selectModel(model); closePicker(); rerender(); showToast(`已选择：${model.name}`); });
}
function openPicker() { pickerState = { query: "", group: "all", kind: "all" }; $("#overlayRoot").insertAdjacentHTML("beforeend", pickerShell()); wirePicker(); }

function conditionValueControl(model) {
  const rule = appState.rule;
  if (model.kind === "event") return `<div class="readonly-field">true（设备上报事件时触发）</div>`;
  if (model.dataType === "bool") return `<select class="el-select" data-rule-input="conditionValue"><option value="true" ${rule.conditionValue === "true" ? "selected" : ""}>true</option><option value="false" ${rule.conditionValue === "false" ? "selected" : ""}>false</option></select>`;
  if (model.dataType === "enum") {
    const multi = ["包含", "不包含"].includes(rule.operator);
    if (!multi) return `<select class="el-select" data-rule-input="conditionValue">${model.options.map(option => `<option value="${option.value}" ${option.value === rule.conditionValue ? "selected" : ""}>${esc(option.label)} (${esc(option.value)})</option>`).join("")}</select>`;
    return `<div class="enum-values">${model.options.map(option => `<label><input type="checkbox" data-enum-value="${option.value}" ${(rule.conditionValues || []).includes(option.value) ? "checked" : ""}>${esc(option.label)} <small>${esc(option.value)}</small></label>`).join("")}</div><p class="form-help">${rule.operator === "包含" ? "上报值属于所选集合时触发。" : "上报值不属于所选集合时触发；不能选择全部值。"}</p>`;
  }
  if (["int32", "int64", "float", "double"].includes(model.dataType)) return `<div class="threshold-control"><input class="el-input" type="number" ${model.dataType.startsWith("int") ? "step=\"1\"" : `step="${model.step}"`} min="${model.min}" max="${model.max}" data-rule-input="conditionValue" value="${esc(rule.conditionValue)}"><span>${esc(model.unit || "")}</span></div><p class="form-help">范围 ${model.min}-${model.max}，步进 ${model.step}。</p>`;
  return `<input class="el-input" maxlength="${model.maxLength}" data-rule-input="conditionValue" value="${esc(rule.conditionValue)}" placeholder="${["包含", "不包含"].includes(rule.operator) ? "输入一个关键词" : "输入文本"}"><p class="form-help">区分大小写；按原文匹配，不支持正则、通配符或多个关键词。</p>`;
}

function timeWindow() {
  const cross = appState.rule.timeStart > appState.rule.timeEnd;
  return `<div class="form-section" data-anchor="trigger-time"><div class="section-title"><h3>提醒时间</h3><p>触发条件和这个时间段都满足时才提醒</p></div><div class="time-range"><input class="el-input" type="time" data-rule-input="timeStart" value="${esc(appState.rule.timeStart)}"><span>至</span><input class="el-input" type="time" data-rule-input="timeEnd" value="${esc(appState.rule.timeEnd)}"><span class="el-tag el-tag--${cross ? "warning" : "info"} is-plain">${cross ? "跨到次日" : "当天"}</span></div></div>`;
}

function triggerStep() {
  const rule = appState.rule;
  const model = selectedModel();
  const consumable = selectedConsumable();
  let detail = "";
  if (rule.triggerType === "device") detail = `<div class="form-grid"><div class="form-row full" data-anchor="property-selector"><span class="form-label"><i class="required">*</i>物模型</span><button class="property-select-trigger" data-open-picker><span class="property-select-main"><strong>${esc(model?.name || "请选择")}</strong><small>${esc(modelMeta(model))}</small></span><span class="property-select-action">选择 / 更换 ›</span></button></div><label class="form-row"><span class="form-label"><i class="required">*</i>运算符</span><select class="el-select" data-rule-input="operator" ${model?.kind === "event" ? "disabled" : ""}>${operatorOptions[model?.dataType || "string"].map(operator => `<option ${operator === rule.operator ? "selected" : ""}>${operator}</option>`).join("")}</select></label><div class="form-row"><span class="form-label"><i class="required">*</i>条件值</span>${conditionValueControl(model)}</div></div>`;
  if (rule.triggerType === "cloud") {
    const timer = sources().countdowns.find(item => item.id === rule.cloudCountdownId) || sources().countdowns[0];
    detail = `<div class="form-grid"><label class="form-row"><span class="form-label"><i class="required">*</i>云计时器</span><select class="el-select" data-rule-input="cloudCountdownId">${sources().countdowns.map(item => `<option value="${item.id}" ${item.id === rule.cloudCountdownId ? "selected" : ""}>${esc(item.name)} · 每 ${item.duration} ${item.unit}</option>`).join("")}</select></label><label class="form-row"><span class="form-label"><i class="required">*</i>剩余时长</span><div class="threshold-control"><input class="el-input" type="number" min="0" max="${timer.duration}" data-rule-input="cloudThreshold" value="${esc(rule.cloudThreshold)}"><span>${esc(timer.unit)}</span></div><p class="form-help">剩余时长小于或等于这个值时触发。</p></label></div>`;
  }
  if (rule.triggerType === "consumable") detail = `<div class="form-grid"><label class="form-row"><span class="form-label"><i class="required">*</i>耗材项</span><select class="el-select" data-rule-input="consumableId">${sources().consumables.map(item => `<option value="${item.id}" ${item.id === rule.consumableId ? "selected" : ""}>${esc(item.name)} · ${esc(item.typeLabel)}</option>`).join("")}</select><p class="form-help">当前类型：${esc(consumable?.typeLabel || "-")}。${consumable?.type === "cloud-timed" ? "可以加入每日汇总。" : "只能独立发送。"}</p></label><label class="form-row"><span class="form-label"><i class="required">*</i>触发项</span><select class="el-select" data-rule-input="consumableEvent"><option value="low" ${rule.consumableEvent === "low" ? "selected" : ""}>不足</option><option value="empty" ${rule.consumableEvent === "empty" ? "selected" : ""}>耗尽</option></select></label></div>`;
  return `<div id="ruleStepContent"><div class="form-section" data-anchor="trigger-source"><div class="section-title"><h3>触发源</h3><p>决定什么时候产生提醒</p></div><div class="radio-row">${[["device", "设备触发", "物模型属性或事件"], ["cloud", "云端触发", "云计时器剩余时长"], ["consumable", "耗材触发", "不足或耗尽"]].map(([value, label, help]) => `<label class="choice-card ${rule.triggerType === value ? "selected" : ""}"><input type="radio" name="trigger" value="${value}" ${rule.triggerType === value ? "checked" : ""}><span class="choice-copy"><strong>${label}</strong><small>${help}</small></span></label>`).join("")}</div><div class="trigger-detail">${detail}</div>${rule.dailySummaryGroupId ? `<div class="help-alert ${supportsSummary() ? "success" : "danger"}"><strong>每日汇总：</strong>${supportsSummary() ? "当前来源可预测当天触发时间，将保留汇总组。" : "当前来源不支持汇总，保存前必须移出汇总组。"}</div>` : ""}</div>${timeWindow()}<div class="form-section" data-anchor="recipient-resolution"><div class="section-title"><h3>接收者</h3><p>无需单独配置</p></div><div class="readonly-field">触发设备的全部绑定用户；无绑定用户时不发送。</div></div></div>`;
}

function deliveryStep() {
  const rule = appState.rule;
  const group = currentGroup();
  const checks = validate(false);
  return `<div id="ruleStepContent"><div class="form-section" data-anchor="delivery-target"><div class="section-title"><h3>投递目标</h3><p>App 消息中心始终投递</p></div><div class="delivery-targets"><label class="choice-card selected locked"><input type="checkbox" checked disabled><span class="choice-copy"><strong>App 消息中心</strong><small>必选，不能关闭</small></span></label><label class="choice-card ${rule.systemNotificationEnabled ? "selected" : ""}"><input type="checkbox" name="system-notification" ${rule.systemNotificationEnabled ? "checked" : ""}><span class="choice-copy"><strong>系统 notification</strong><small>在手机系统通知栏额外提醒</small></span></label></div></div>
    <div class="form-section" data-anchor="delivery-mode"><div class="section-title"><h3>发送方式</h3><p>${group ? "入组规则固定按自然日汇总" : "仅影响当前独立规则"}</p></div>${group ? `<div class="summary-card" data-anchor="group-summary"><h4>每日汇总 · ${esc(group.name)}</h4><p>第一条实际触发时，合并同设备当天已触发和预计会触发的规则。后续只更新同一条 App 消息。</p><div class="summary-key">同产品 + 同设备 + 同汇总组 + 同自然日；每个接收用户各一条</div></div>` : `<div class="radio-row"><label class="choice-card ${rule.reminderMode === "each" ? "selected" : ""}"><input type="radio" name="mode" value="each" ${rule.reminderMode === "each" ? "checked" : ""}><span class="choice-copy"><strong>逐条发送</strong><small>每次满足条件都发送</small></span></label><label class="choice-card ${rule.reminderMode === "discard" ? "selected" : ""}"><input type="radio" name="mode" value="discard" ${rule.reminderMode === "discard" ? "checked" : ""}><span class="choice-copy"><strong>仅发送首条</strong><small>一段时间内只发送第一次</small></span></label></div>${rule.reminderMode === "discard" ? `<label class="form-row interval-field" data-anchor="min-interval"><span class="form-label"><i class="required">*</i>最小发送间隔</span><div class="threshold-control"><input class="el-input" type="number" min="5" max="10080" data-rule-input="minIntervalMinutes" value="${esc(rule.minIntervalMinutes)}"><span>分钟</span></div></label>` : ""}`}</div>
    <div class="form-section" data-anchor="validation"><div class="section-title"><h3>保存检查</h3><p>${checks.length ? `${checks.length} 项需要处理` : "可以发布"}</p></div><div class="validation-list">${checks.length ? checks.map(item => `<div class="validation-item validation-fail"><span>! ${esc(item)}</span><span>待完善</span></div>`).join("") : `<div class="validation-item"><span>✓ 内容、触发条件与投递设置完整</span><span class="el-tag el-tag--success is-plain">通过</span></div>`}</div></div></div>`;
}

function validate(strict = true) {
  const rule = appState.rule;
  const issues = [];
  if (!rule.name.trim()) issues.push("填写规则名称");
  if (rule.dailySummaryGroupId) {
    if (!currentGroup()) issues.push("选择有效的每日汇总组");
    if (!rule.itemLabel.trim()) issues.push("填写 English 提醒项");
    if (!supportsSummary()) issues.push("当前触发来源不能加入每日汇总组");
  } else if (!rule.title.trim() || !rule.body.trim()) issues.push("填写 English Title 和 Body");
  if (rule.triggerType === "device") {
    const model = selectedModel();
    if (!model) issues.push("选择物模型");
    if (model?.dataType === "enum" && ["包含", "不包含"].includes(rule.operator)) {
      const count = (rule.conditionValues || []).length;
      if (!count) issues.push("至少选择一个枚举值");
      if (rule.operator === "不包含" && count === model.options.length) issues.push("“不包含”不能选择全部枚举值");
    }
    if (model?.dataType === "string" && !rule.conditionValue.trim()) issues.push("文本条件不能为空或只有空格");
  }
  if (!rule.dailySummaryGroupId && rule.reminderMode === "discard" && (+rule.minIntervalMinutes < 5 || +rule.minIntervalMinutes > 10080)) issues.push("最小发送间隔需为 5-10080 分钟");
  return issues;
}

function body() { return appState.ruleStep === 1 ? messageStep() : appState.ruleStep === 2 ? triggerStep() : deliveryStep(); }
function shell() {
  return `<div class="drawer-host is-open" id="ruleDrawer"><div class="drawer-mask" data-close></div><aside class="drawer"><header class="drawer-header"><div class="drawer-title"><h2>${appState.editingRule ? "编辑" : "新建"}推送规则</h2><p>${esc(product().name)} · P0 规则闭环</p></div><button class="icon-btn" data-close>×</button></header><div class="drawer-main">${stepNav()}<div class="drawer-body"><section class="drawer-content">${body()}</section></div></div><footer class="drawer-footer"><span class="save-hint">提醒发给触发设备的绑定用户</span><div class="footer-actions"><button class="el-btn" data-close>取消</button>${appState.ruleStep > 1 ? `<button class="el-btn" data-prev>上一步</button>` : ""}${appState.ruleStep < 3 ? `<button class="el-btn el-btn--primary" data-next>下一步</button>` : `<button class="el-btn" data-save-draft>保存草稿</button><button class="el-btn el-btn--primary" data-publish>发布</button>`}</div></footer></aside></div>`;
}

function insertToken(input, token) {
  if (!input) return;
  const start = input.selectionStart ?? input.value.length;
  input.value = `${input.value.slice(0, start)}${token}${input.value.slice(input.selectionEnd ?? start)}`;
  appState.rule[input.dataset.content] = input.value;
  input.focus(); input.setSelectionRange(start + token.length, start + token.length);
}
function rerender() { const host = $("#ruleDrawer"); if (!host) return; host.outerHTML = shell(); wire(); renderAnnotations(`rule${appState.ruleStep}`, `规则配置 · 步骤 ${appState.ruleStep}/3`); }

function switchTrigger(next) {
  const rule = appState.rule;
  if (rule.dailySummaryGroupId && next === "device" && !window.confirm("设备触发不能加入每日汇总组。继续后将移出汇总组并恢复独立内容，是否继续？")) return;
  if (rule.dailySummaryGroupId && next === "device") rule.dailySummaryGroupId = "";
  rule.triggerType = next;
  if (next === "consumable" && selectedConsumable()?.type !== "cloud-timed" && rule.dailySummaryGroupId) rule.dailySummaryGroupId = "";
  rerender();
}
function switchContentMode(mode) {
  if (mode === "standalone") { appState.rule.dailySummaryGroupId = ""; rerender(); return; }
  if (!supportsSummary()) {
    if (!window.confirm("当前来源不能加入每日汇总组。继续后将切换为云端触发，是否继续？")) { rerender(); return; }
    appState.rule.triggerType = "cloud";
  }
  appState.rule.dailySummaryGroupId = groups()[0]?.id || "";
  appState.rule.groupRevision = currentGroup()?.revision || 0;
  rerender();
}
function switchConsumable(id) {
  const next = sources().consumables.find(item => item.id === id);
  if (!next) return;
  if (appState.rule.dailySummaryGroupId && next.type !== "cloud-timed") {
    if (!window.confirm(`${next.typeLabel}不能加入每日汇总组。继续后将移出汇总组并恢复独立内容，是否继续？`)) { rerender(); return; }
    appState.rule.dailySummaryGroupId = "";
  }
  appState.rule.consumableId = id;
  rerender();
}
function save(status) {
  const issues = validate();
  if (status === "启用" && issues.length) return showToast(issues[0], "error");
  const rule = appState.rule;
  const group = currentGroup();
  const model = selectedModel();
  const timer = sources().countdowns.find(item => item.id === rule.cloudCountdownId);
  const consumable = selectedConsumable();
  let trigger = "";
  if (rule.triggerType === "device") trigger = model.kind === "event" ? `物模型事件：${model.name} = true` : `物模型：${model.name} ${rule.operator} ${["包含", "不包含"].includes(rule.operator) ? (rule.conditionValues || []).join("、") : rule.conditionValue}${model.unit ? ` ${model.unit}` : ""}`;
  if (rule.triggerType === "cloud") trigger = `云端：${timer.name} <= ${rule.cloudThreshold} ${timer.unit}`;
  if (rule.triggerType === "consumable") trigger = `耗材：${consumable.name}${rule.consumableEvent === "low" ? "不足" : "耗尽"}`;
  const output = { ...rule, id: rule.id || `R-${2050 + rules.length}`, product: product().name, trigger, title: group ? groupValue(group, "title") : rule.title, body: group ? groupValue(group, "body") : rule.body, languages: rule.languages || "1", strategy: group ? `每日汇总 · 消息中心${rule.systemNotificationEnabled ? " + 系统通知" : ""}` : `${rule.reminderMode === "each" ? "逐条发送" : `仅发送首条 · ${rule.minIntervalMinutes} 分钟`} · 消息中心${rule.systemNotificationEnabled ? " + 系统通知" : ""}`, status, updated: "2026-08-18 16:30", groupRevision: group?.revision || 0 };
  const index = rules.findIndex(item => item.id === rule.id);
  if (index >= 0) rules[index] = output; else rules.unshift(output);
  closeRuleDrawer(); window.dispatchEvent(new CustomEvent("message-push:rule-changed")); showToast(status === "启用" ? "规则已发布" : "草稿已保存");
}

function wire() {
  const host = $("#ruleDrawer");
  host.querySelectorAll("[data-close]").forEach(button => button.onclick = closeRuleDrawer);
  host.querySelectorAll("[data-step]").forEach(button => button.onclick = () => { appState.ruleStep = +button.dataset.step; rerender(); });
  host.querySelectorAll("[data-rule-input]").forEach(input => input.onchange = () => {
    if (input.dataset.ruleInput === "consumableId") { switchConsumable(input.value); return; }
    appState.rule[input.dataset.ruleInput] = input.value;
    if (["operator", "cloudCountdownId"].includes(input.dataset.ruleInput)) rerender();
  });
  host.querySelectorAll("[data-content]").forEach(input => { input.onfocus = () => appState.activeContentField = input.dataset.content; input.oninput = () => appState.rule[input.dataset.content] = input.value; });
  host.querySelectorAll("[data-placeholder]").forEach(button => button.onclick = () => insertToken(host.querySelector(`[data-content="${appState.activeContentField}"]`), button.dataset.placeholder));
  host.querySelectorAll('input[name="content-mode"]').forEach(input => input.onchange = () => switchContentMode(input.value));
  host.querySelector("[data-group-select]")?.addEventListener("change", event => { appState.rule.dailySummaryGroupId = event.target.value; appState.rule.groupRevision = currentGroup()?.revision || 0; rerender(); });
  host.querySelectorAll('input[name="trigger"]').forEach(input => input.onchange = () => switchTrigger(input.value));
  host.querySelector("[data-open-picker]")?.addEventListener("click", openPicker);
  host.querySelectorAll("[data-enum-value]").forEach(input => input.onchange = () => { const values = new Set(appState.rule.conditionValues || []); input.checked ? values.add(input.dataset.enumValue) : values.delete(input.dataset.enumValue); appState.rule.conditionValues = [...values]; });
  host.querySelectorAll('input[name="mode"]').forEach(input => input.onchange = () => { appState.rule.reminderMode = input.value; rerender(); });
  host.querySelector('input[name="system-notification"]')?.addEventListener("change", event => { appState.rule.systemNotificationEnabled = event.target.checked; rerender(); });
  host.querySelector("[data-prev]")?.addEventListener("click", () => { appState.ruleStep--; rerender(); });
  host.querySelector("[data-next]")?.addEventListener("click", () => { appState.ruleStep++; rerender(); });
  host.querySelector("[data-save-draft]")?.addEventListener("click", () => save("草稿"));
  host.querySelector("[data-publish]")?.addEventListener("click", () => save("启用"));
}

export function openRuleDrawer({ edit = false } = {}) { appState.editingRule = edit; appState.ruleStep = 1; $("#overlayRoot").innerHTML = shell(); wire(); renderAnnotations("rule1", "规则配置 · 步骤 1/3"); }
export function closeRuleDrawer() { closePicker(); $("#ruleDrawer")?.remove(); renderAnnotations("rules", "推送规则列表"); }
export function resetRuleDraft() { appState.rule = { ...newRule(), productId: appState.selectedProductId }; appState.activeContentField = "title"; }
