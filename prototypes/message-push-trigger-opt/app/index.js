import { $, $$, esc, showToast } from "./dom.js";
import { appState, products, rules, newRule, dailySummaryGroups } from "./state.js";
import { renderAnnotations } from "./annotations.js";
import { openRuleDrawer, resetRuleDraft } from "./rule-editor.js";
import { openProductLanguageDrawer } from "./language-editor.js";
import { openProductPicker, renderProductPickerTrigger } from "./product-picker.js";
import { openConfirmationDialog } from "./confirmation-dialog.js";

const workspace = $("#workspace");
let query = "";
let statusQuery = "";
let groupQuery = "";
const activeProduct = () => products.find(item => item.id === appState.selectedProductId) || products[0];
const scopedRules = () => rules.filter(item => item.productId === appState.selectedProductId);
const scopedGroups = () => dailySummaryGroups.filter(item => item.productId === appState.selectedProductId);
const groupMembers = id => scopedRules().filter(rule => rule.dailySummaryGroupId === id);
const groupValue = (group, field) => group?.values?.["en-US"]?.[field] || "";
const statusTag = status => `<span class="el-tag el-tag--${status === "启用" ? "success" : status === "草稿" ? "warning" : "info"} is-plain">${esc(status)}</span>`;

function futureScope() {
  return `<div class="future-scope" data-anchor="future-scope"><strong>后续版本能力</strong><span>事件管理、Webhook 接入、通用窗口合并、状态切换、优先级和自定义深链不在本期范围。</span></div>`;
}

function rulesView() {
  const source = scopedRules();
  const groups = scopedGroups();
  const rows = source.filter(item => (!query || item.name.includes(query) || item.id.toLowerCase().includes(query.toLowerCase())) && (!statusQuery || item.status === statusQuery) && (!groupQuery || (groupQuery === "none" ? !item.dailySummaryGroupId : item.dailySummaryGroupId === groupQuery)));
  return `<div class="help-alert" data-anchor="p0-scope"><strong>本期规则：</strong>设备物模型、云计时器和耗材均可独立发送；只有可预测的云计时器与云端定时耗材可以加入每日汇总。</div>
    <div class="filter-bar" data-anchor="filter-bar">
      <input class="el-input" id="keyword" placeholder="规则名称 / ID" value="${esc(query)}">
      <select class="el-select" id="groupFilter"><option value="">全部汇总方式</option><option value="none" ${groupQuery === "none" ? "selected" : ""}>独立发送</option>${groups.map(group => `<option value="${group.id}" ${groupQuery === group.id ? "selected" : ""}>${esc(group.name)}</option>`).join("")}</select>
      <select class="el-select" id="statusFilter"><option value="">全部状态</option><option value="启用" ${statusQuery === "启用" ? "selected" : ""}>启用</option><option value="草稿" ${statusQuery === "草稿" ? "selected" : ""}>草稿</option></select>
      <button class="el-btn el-btn--primary" data-search>查询</button><button class="el-btn" data-reset>重置</button>
    </div>
    <div class="summary-strip"><span>当前产品 <strong>${esc(activeProduct().name)}</strong></span><span>启用规则 <strong>${source.filter(item => item.status === "启用").length}</strong></span><span>每日汇总组 <strong>${groups.length}</strong></span><span>消息中心 <strong>始终投递</strong></span></div>
    <div class="table-scroll"><table class="el-table" data-anchor="rules-table"><thead><tr><th>规则</th><th>触发条件</th><th>内容方式</th><th>推送消息</th><th>多语言</th><th>投递方式</th><th>状态</th><th>更新时间</th><th class="col-ops">操作</th></tr></thead><tbody>${rows.map(item => {
      const index = rules.indexOf(item);
      const group = groups.find(entry => entry.id === item.dailySummaryGroupId);
      return `<tr><td><div class="primary-cell">${esc(item.name)}</div><div class="secondary-cell">${esc(item.id)}</div></td><td>${esc(item.trigger)}</td><td><div class="primary-cell">${esc(group?.name || "独立发送")}</div><div class="secondary-cell">${group ? "当天预计提醒合成一条" : "使用规则自身文案"}</div></td><td><div class="primary-cell">${esc(item.title)}</div><div class="secondary-cell">${group ? `提醒项：${esc(item.itemLabel)}` : esc(item.body)}</div></td><td>${esc(item.languages)} 个语言</td><td>${esc(item.strategy)}</td><td>${statusTag(item.status)}</td><td>${esc(item.updated)}</td><td class="col-ops"><button class="op-link" data-edit-rule="${index}" ${appState.readOnly ? "disabled" : ""}>编辑</button><span class="op-divider">|</span><button class="op-link danger" data-delete-rule="${index}" ${appState.readOnly ? "disabled" : ""}>删除</button></td></tr>`;
    }).join("")}</tbody></table></div><div class="pagination"><span>当前产品 ${rows.length} 条</span><button class="page-num active">1</button></div>${futureScope()}`;
}

function groupPreviews() {
  return `<section class="preview-section" data-anchor="message-previews"><div class="section-title"><h3>“清洗提醒”发送效果</h3><p>提醒项只出现在 App 消息详情</p></div><div class="message-preview-grid">
    <article class="preview-pane"><span class="preview-eyebrow">系统 notification</span><div class="notification-preview"><strong>Cleaning is due</strong><p>Your pump parts need cleaning.</p><small>现在 · S12 Pro</small></div><div class="preview-foot">不展示提醒项</div></article>
    <article class="preview-pane"><span class="preview-eyebrow">App 消息列表</span><div class="inbox-row"><span class="inbox-icon">M</span><div><strong>Cleaning is due</strong><p>Your pump parts need cleaning.</p><small>今天 09:10</small></div><i></i></div><div class="preview-foot">同一用户只保留一条记录</div></article>
    <article class="preview-pane"><span class="preview-eyebrow">App 消息详情</span><div class="detail-preview"><strong>Cleaning is due</strong><p>Your pump parts need cleaning.</p><h4>今日提醒</h4><ul><li>Breast shields</li><li>Valves</li></ul></div><div class="preview-foot">App P0 只展示提醒项文字，不展示预测状态和时间</div></article>
  </div><div class="help-alert"><strong>更新方式：</strong>后续实际触发更新同一 messageId 和 revision，不创建新消息、不置顶、不增加未读数。</div></section>`;
}

function groupsView() {
  const groups = scopedGroups();
  return `<div class="help-alert" data-anchor="group-definition"><strong>每日汇总组：</strong>同一设备、同一自然日内预计会触发的定时提醒，共用一套 Title/Body 并合成一条消息。</div>
    <div class="group-toolbar"><div><strong>${esc(activeProduct().name)}</strong><span>共 ${groups.length} 个汇总组</span></div><button class="el-btn el-btn--primary" data-new-group ${appState.readOnly ? "disabled" : ""}>新建汇总组</button></div>
    <table class="el-table" data-anchor="groups-table"><thead><tr><th>汇总组</th><th>English Title / Body</th><th>关联规则</th><th>来源构成</th><th>更新时间</th><th class="col-ops">操作</th></tr></thead><tbody>${groups.map(group => {
      const members = groupMembers(group.id);
      const sourceLabels = [...new Set(members.map(rule => rule.triggerType === "cloud" ? "云计时器" : "云端定时耗材"))];
      return `<tr><td><div class="primary-cell">${esc(group.name)}</div><div class="secondary-cell">${esc(group.id)} · revision ${group.revision}</div></td><td><div class="primary-cell">${esc(groupValue(group, "title"))}</div><div class="secondary-cell">${esc(groupValue(group, "body"))}</div></td><td><strong>${members.length}</strong> 条</td><td>${sourceLabels.length ? sourceLabels.map(label => `<span class="el-tag el-tag--info is-plain">${label}</span>`).join(" ") : "-"}</td><td>${esc(group.updated)}</td><td class="col-ops"><button class="op-link" data-edit-group="${group.id}">编辑</button><span class="op-divider">|</span><button class="op-link danger" data-delete-group="${group.id}" ${members.length ? "disabled title=\"先将关联规则移出汇总组\"" : ""}>删除</button></td></tr>`;
    }).join("")}</tbody></table>${groupPreviews()}`;
}

function stateView() {
  if (appState.scenario === "loading") return `<div class="state-box"><div class="skeleton">${Array.from({ length: 6 }, () => '<div class="skeleton-line"></div>').join("")}</div></div>`;
  if (appState.scenario === "error") return `<div class="state-box"><div><div class="state-icon">!</div><h3>内容加载失败</h3><p>网络连接异常，当前筛选已保留。</p><button class="el-btn el-btn--primary" data-retry>重新加载</button></div></div>`;
  if (appState.scenario === "empty") return `<div class="state-box"><div><div class="state-icon">+</div><h3>${appState.activePage === "rules" ? "当前产品暂无推送规则" : "当前产品暂无每日汇总组"}</h3><p>${appState.activePage === "rules" ? "创建一条规则开始配置。" : "先创建共享文案，再让定时规则加入。"}</p></div></div>`;
  return appState.activePage === "rules" ? rulesView() : groupsView();
}

function render() {
  appState.readOnly = appState.scenario === "permission";
  renderProductPickerTrigger();
  $("#annotationScenarioSelect").value = appState.scenario;
  workspace.innerHTML = stateView();
  if (appState.readOnly) workspace.insertAdjacentHTML("afterbegin", '<div class="help-alert warning">当前账号只有查看权限，不能新增或编辑。</div>');
  $$("[data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === appState.activePage));
  $("#primaryCreateBtn").textContent = appState.activePage === "rules" ? "新建推送规则" : "新建汇总组";
  $("#primaryCreateBtn").disabled = appState.readOnly;
  $("#productLanguageBtn").disabled = appState.readOnly;
  $("#ruleCount").textContent = String(scopedRules().length);
  $("#groupCount").textContent = String(scopedGroups().length);
  renderAnnotations(appState.activePage, appState.activePage === "rules" ? "推送规则列表" : "每日汇总管理");
  wireWorkspace();
}

function groupDrawer(group = null) {
  const draft = group ? { ...group, values: JSON.parse(JSON.stringify(group.values)) } : { id: `group-${Date.now()}`, productId: appState.selectedProductId, name: "", revision: 0, values: { "en-US": { title: "", body: "" } } };
  const count = group ? groupMembers(group.id).length : 0;
  $("#overlayRoot").insertAdjacentHTML("beforeend", `<div class="drawer-host is-open" id="groupDrawer"><div class="drawer-mask" data-group-close></div><aside class="drawer compact-drawer"><header class="drawer-header"><div class="drawer-title"><h2>${group ? "编辑" : "新建"}每日汇总组</h2><p>共享文案由组统一维护，规则只填写提醒项</p></div><button class="icon-btn" data-group-close>×</button></header><div class="drawer-content"><div class="help-alert"><strong>适用范围：</strong>云计时器和云端定时耗材。设备触发与其他耗材不能加入。</div><div class="form-section"><div class="section-title"><h3>基本信息</h3><p>${count ? `已关联 ${count} 条规则` : "暂未关联规则"}</p></div><label class="form-row"><span class="form-label"><i class="required">*</i>汇总组名称</span><input class="el-input" data-group-field="name" value="${esc(draft.name)}" placeholder="例如：清洗提醒"><p class="form-help">只在管理端使用，不展示给 App 用户。</p></label></div><div class="form-section"><div class="section-title"><h3>English 共享文案</h3><p>系统 notification 与 App 消息共用</p></div><div class="form-grid"><label class="form-row full"><span class="form-label"><i class="required">*</i>Title</span><input class="el-input" maxlength="100" data-group-field="title" value="${esc(groupValue(draft, "title"))}"></label><label class="form-row full"><span class="form-label"><i class="required">*</i>Body</span><textarea class="el-textarea" maxlength="200" data-group-field="body">${esc(groupValue(draft, "body"))}</textarea></label></div></div><div class="summary-card"><h4>保存影响</h4><p>${count ? `共享文案保存后会同步用于当前产品下 ${count} 条关联规则。` : "保存后即可在规则抽屉中选择此汇总组。"}</p></div></div><footer class="drawer-footer"><span class="save-hint">保存时带 revision ${draft.revision}</span><div class="footer-actions"><button class="el-btn" data-group-close>取消</button><button class="el-btn el-btn--primary" data-group-save>保存</button></div></footer></aside></div>`);
  const host = $("#groupDrawer");
  host.querySelectorAll("[data-group-close]").forEach(button => button.onclick = () => host.remove());
  host.querySelectorAll("[data-group-field]").forEach(input => input.oninput = () => {
    if (input.dataset.groupField === "name") draft.name = input.value;
    else draft.values["en-US"][input.dataset.groupField] = input.value;
  });
  host.querySelector("[data-group-save]").onclick = () => {
    if (!draft.name.trim() || !groupValue(draft, "title").trim() || !groupValue(draft, "body").trim()) return showToast("请补全汇总组名称和 English 文案", "error");
    if (group) Object.assign(group, draft, { revision: group.revision + 1, updated: "2026-08-18 16:20" });
    else dailySummaryGroups.push({ ...draft, revision: 1, updated: "2026-08-18 16:20" });
    host.remove(); render(); showToast(group ? "每日汇总组已更新" : "每日汇总组已创建");
  };
  renderAnnotations("groupEditor", group ? "编辑每日汇总组" : "新建每日汇总组");
}

function deleteGroup(id) {
  const group = dailySummaryGroups.find(item => item.id === id);
  if (!group) return;
  const count = groupMembers(id).length;
  if (count) return showToast(`仍关联 ${count} 条规则，不能删除`, "error");
  openConfirmationDialog({
    title: "删除每日汇总组",
    description: `删除“${group.name}”后不能恢复。已有消息中心记录不会删除。`,
    confirmLabel: "删除",
    tone: "danger",
    onConfirm: () => { dailySummaryGroups.splice(dailySummaryGroups.indexOf(group), 1); render(); showToast("每日汇总组已删除"); }
  });
}

function seedRule(row) {
  appState.selectedProductId = row.productId;
  appState.rule = { ...newRule(), ...row, productId: row.productId };
  appState.activeContentField = "title";
}
function openNewRule() { resetRuleDraft(); openRuleDrawer(); }
function openDeleteRule(index) {
  const row = rules[index];
  if (!row) return;
  openConfirmationDialog({
    title: "删除推送规则",
    description: `删除“${row.name}”后不能恢复。`,
    confirmLabel: "删除",
    tone: "danger",
    onConfirm: () => { rules.splice(index, 1); render(); showToast("规则已删除"); }
  });
}
function setProduct(id) {
  if (!products.some(product => product.id === id)) return;
  appState.selectedProductId = id; query = ""; statusQuery = ""; groupQuery = ""; render();
}
function createForPage() { appState.activePage === "rules" ? openNewRule() : groupDrawer(); }

function wireWorkspace() {
  $("[data-search]")?.addEventListener("click", () => { query = $("#keyword")?.value.trim() || ""; statusQuery = $("#statusFilter")?.value || ""; groupQuery = $("#groupFilter")?.value || ""; render(); });
  $("[data-reset]")?.addEventListener("click", () => { query = ""; statusQuery = ""; groupQuery = ""; render(); });
  $("[data-retry]")?.addEventListener("click", () => { appState.scenario = "normal"; render(); });
  $$('[data-edit-rule]').forEach(button => button.onclick = () => { seedRule(rules[Number(button.dataset.editRule)]); openRuleDrawer({ edit: true }); });
  $$('[data-delete-rule]').forEach(button => button.onclick = () => openDeleteRule(Number(button.dataset.deleteRule)));
  $("[data-new-group]")?.addEventListener("click", () => groupDrawer());
  $$('[data-edit-group]').forEach(button => button.onclick = () => groupDrawer(dailySummaryGroups.find(group => group.id === button.dataset.editGroup)));
  $$('[data-delete-group]').forEach(button => button.onclick = () => deleteGroup(button.dataset.deleteGroup));
}

$("#productPickerTrigger").addEventListener("click", openProductPicker);
$("#annotationScenarioSelect").addEventListener("change", event => { appState.scenario = event.target.value; render(); });
$("#refreshBtn").addEventListener("click", () => { appState.scenario = "loading"; render(); setTimeout(() => { appState.scenario = "normal"; render(); showToast("内容已刷新"); }, 350); });
$("#primaryCreateBtn").addEventListener("click", createForPage);
$("#productLanguageBtn").addEventListener("click", () => openProductLanguageDrawer({ onClose: render }));
$$('[data-page]').forEach(button => button.addEventListener("click", () => { appState.activePage = button.dataset.page; render(); }));
$("#annotationToggle").addEventListener("click", () => $(".prototype-shell").classList.add("annotation-closed"));
$("#annotationReopen").addEventListener("click", () => $(".prototype-shell").classList.remove("annotation-closed"));
window.addEventListener("message-push:rule-changed", render);
window.addEventListener("message-push:product-changed", event => setProduct(event.detail));
render();

const demo = new URLSearchParams(location.search).get("demo");
if (demo === "language") setTimeout(() => openProductLanguageDrawer({ onClose: render }), 0);
if (demo === "groups") { appState.activePage = "groups"; render(); }
