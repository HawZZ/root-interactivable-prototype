import { $, $$, esc, showToast } from "./ui.js?v=20260903";
import { appState, products, rules, newRule } from "./state.js?v=20260903";
import { renderAnnotations } from "./annotations.js?v=20260903";
import { openRuleDrawer, resetRuleDraft } from "./rule-editor.js?v=20260903";
import { openProductLanguageDrawer } from "./language-editor.js?v=20260903";
import { openProductPicker, renderProductPickerTrigger } from "./product-picker.js?v=20260903";
import { openConfirmationDialog } from "./confirmation-dialog.js?v=20260903";

const workspace = $("#workspace");
let query = "", statusQuery = "", typeQuery = "";
const currentProduct = () => products.find(item => item.id === appState.selectedProductId) || products[0];
const scopedRules = () => rules.filter(item => item.productId === appState.selectedProductId);
const typeName = type => type === "DAILY_SUMMARY" ? "汇总推送" : "普通推送";
const statusTag = status => `<span class="el-tag el-tag--${status === "启用" ? "success" : "warning"} is-plain">${esc(status)}</span>`;

function futureScope() { return `<div class="future-scope" data-anchor="future-scope"><strong>后续版本能力</strong><span>事件择优、跨天维护预告、非定时事件汇总、动态补项和通用 merge 不在本期范围。</span></div>`; }
function ruleRow(item) {
  const isSummary = item.ruleType === "DAILY_SUMMARY";
  const type = `<span class="el-tag el-tag--${isSummary ? "warning" : "info"} is-plain">${typeName(item.ruleType)}</span>`;
  const message = isSummary ? `<div class="primary-cell">${esc(item.title)}</div><div class="secondary-cell">${item.conditions.length} 个汇总条件 · 当天首条触发</div>` : `<div class="primary-cell">${esc(item.title)}</div><div class="secondary-cell">${esc(item.body)}</div>`;
  return `<tr><td><div class="primary-cell">${esc(item.name)}</div><div class="secondary-cell">${esc(item.id)}</div></td><td>${type}</td><td>${esc(item.trigger || "-")}</td><td>${message}</td><td>${esc(item.languages || "1")} 个语言</td><td>${esc(item.strategy || "-")}</td><td>${statusTag(item.status)}</td><td>${esc(item.updated)}</td><td class="col-ops"><button class="op-link" data-edit-rule="${esc(item.id)}" ${appState.readOnly ? "disabled" : ""}>编辑</button><span class="op-divider">|</span><button class="op-link danger" data-delete-rule="${esc(item.id)}" ${appState.readOnly ? "disabled" : ""}>删除</button></td></tr>`;
}
function rulesView() {
  const source = scopedRules();
  const rows = source.filter(item => (!query || item.name.includes(query) || item.id.toLowerCase().includes(query.toLowerCase())) && (!statusQuery || item.status === statusQuery) && (!typeQuery || item.ruleType === typeQuery));
  return `<div class="help-alert" data-anchor="p0-scope"><strong>本期规则：</strong>普通推送按一次触发独立发送；汇总推送由当天首个实际命中的条件立即触发，同设备当天最多发送一次。</div>
    <div class="filter-bar" data-anchor="filter-bar"><input class="el-input" id="keyword" placeholder="规则名称 / ID" value="${esc(query)}"><select class="el-select" id="typeFilter"><option value="">全部规则类型</option><option value="NORMAL" ${typeQuery === "NORMAL" ? "selected" : ""}>普通推送</option><option value="DAILY_SUMMARY" ${typeQuery === "DAILY_SUMMARY" ? "selected" : ""}>汇总推送</option></select><select class="el-select" id="statusFilter"><option value="">全部状态</option><option value="启用" ${statusQuery === "启用" ? "selected" : ""}>启用</option><option value="草稿" ${statusQuery === "草稿" ? "selected" : ""}>草稿</option></select><button class="el-btn el-btn--primary" data-search>查询</button><button class="el-btn" data-reset>重置</button></div>
    <div class="summary-strip"><span>当前产品 <strong>${esc(currentProduct().name)}</strong></span><span>普通推送 <strong>${source.filter(item => item.ruleType === "NORMAL").length}</strong></span><span>汇总推送 <strong>${source.filter(item => item.ruleType === "DAILY_SUMMARY").length}</strong></span><span>消息中心 <strong>始终投递</strong></span></div>
    <div class="table-scroll"><table class="el-table" data-anchor="rules-table"><thead><tr><th>规则</th><th>规则类型</th><th>触发条件 / 汇总范围</th><th>推送消息</th><th>多语言</th><th>投递方式</th><th>状态</th><th>更新时间</th><th class="col-ops">操作</th></tr></thead><tbody>${rows.map(ruleRow).join("") || `<tr><td colspan="9"><div class="empty-inline">没有符合筛选条件的规则</div></td></tr>`}</tbody></table></div><div class="pagination"><span>当前产品 ${rows.length} 条</span><button class="page-num active">1</button></div>${futureScope()}`;
}
function stateView() {
  if (appState.scenario === "loading") return `<div class="state-box"><div class="skeleton">${Array.from({ length: 6 }, () => '<div class="skeleton-line"></div>').join("")}</div></div>`;
  if (appState.scenario === "error") return `<div class="state-box"><div><div class="state-icon">!</div><h3>内容加载失败</h3><p>网络连接异常，当前筛选已保留。</p><button class="el-btn el-btn--primary" data-retry>重新加载</button></div></div>`;
  if (appState.scenario === "empty") return `<div class="state-box"><div><div class="state-icon">+</div><h3>当前产品暂无推送规则</h3><p>新建普通推送或汇总推送开始配置。</p></div></div>`;
  return rulesView();
}
function render() {
  appState.readOnly = appState.scenario === "permission";
  appState.thingModelState = appState.scenario.startsWith("model-") ? appState.scenario.slice(6) : "ready";
  renderProductPickerTrigger();
  $("#annotationScenarioSelect").value = appState.scenario;
  workspace.innerHTML = stateView();
  if (appState.readOnly) workspace.insertAdjacentHTML("afterbegin", '<div class="help-alert warning">当前账号只有查看权限，不能新增或编辑。</div>');
  $("#primaryCreateBtn").disabled = appState.readOnly; $("#productLanguageBtn").disabled = appState.readOnly;
  renderAnnotations("rules", "推送规则列表"); wireWorkspace();
}
function seedRule(row) { appState.selectedProductId = row.productId; appState.rule = JSON.parse(JSON.stringify({ ...newRule(row.ruleType), ...row })); appState.activeContentField = "title"; }
function openNewRule(ruleType) { resetRuleDraft(ruleType); openRuleDrawer(); }
function typeChooser() {
  $("#overlayRoot").insertAdjacentHTML("beforeend", `<div class="modal-host" id="ruleTypeDialog"><section class="modal type-dialog" role="dialog" aria-modal="true" aria-labelledby="typeDialogTitle"><header class="modal-header"><div><h3 id="typeDialogTitle">选择推送规则类型</h3><p>类型创建后不能直接切换，避免丢失配置。</p></div><button class="icon-btn" data-type-close>×</button></header><div class="modal-body type-options"><button class="type-option" data-new-type="NORMAL"><span class="type-option-icon">1</span><span><strong>普通推送</strong><small>一个触发条件生成一条独立消息，可选逐条发送或仅发送首条。</small></span><b>选择 ›</b></button><button class="type-option" data-new-type="DAILY_SUMMARY"><span class="type-option-icon">2</span><span><strong>汇总推送</strong><small>当天首个汇总条件命中时立即发送，同设备当天最多一次。</small></span><b>选择 ›</b></button></div><footer class="modal-footer"><button class="el-btn" data-type-close>取消</button></footer></section></div>`);
  const host = $("#ruleTypeDialog"); host.querySelectorAll("[data-type-close]").forEach(button => button.onclick = () => host.remove()); host.addEventListener("click", event => { if (event.target === host) host.remove(); }); host.querySelectorAll("[data-new-type]").forEach(button => button.onclick = () => { host.remove(); openNewRule(button.dataset.newType); }); renderAnnotations("typeChooser", "选择规则类型");
}
function openDeleteRule(id) { const row = rules.find(item => item.id === id); if (!row) return; openConfirmationDialog({ title: "删除推送规则", description: `删除“${row.name}”后不能恢复。`, confirmLabel: "删除", tone: "danger", onConfirm: () => { rules.splice(rules.indexOf(row), 1); render(); showToast("规则已删除"); } }); }
function setProduct(id) { if (!products.some(product => product.id === id)) return; appState.selectedProductId = id; query = statusQuery = typeQuery = ""; render(); }
function wireWorkspace() {
  $("[data-search]")?.addEventListener("click", () => { query = $("#keyword")?.value.trim() || ""; statusQuery = $("#statusFilter")?.value || ""; typeQuery = $("#typeFilter")?.value || ""; render(); });
  $("[data-reset]")?.addEventListener("click", () => { query = statusQuery = typeQuery = ""; render(); }); $("[data-retry]")?.addEventListener("click", () => { appState.scenario = "normal"; render(); });
  $$('[data-edit-rule]').forEach(button => button.onclick = () => { const row = rules.find(item => item.id === button.dataset.editRule); if (row) { seedRule(row); openRuleDrawer({ edit: true }); } }); $$('[data-delete-rule]').forEach(button => button.onclick = () => openDeleteRule(button.dataset.deleteRule));
}

$("#productPickerTrigger").addEventListener("click", openProductPicker);
$("#annotationScenarioSelect").addEventListener("change", event => { appState.scenario = event.target.value; render(); window.dispatchEvent(new CustomEvent("message-push:model-state-changed")); });
$("#refreshBtn").addEventListener("click", () => { appState.scenario = "loading"; render(); setTimeout(() => { appState.scenario = "normal"; render(); showToast("内容已刷新"); }, 350); });
$("#primaryCreateBtn").addEventListener("click", typeChooser); $("#productLanguageBtn").addEventListener("click", () => openProductLanguageDrawer({ onClose: render }));
$("#annotationToggle").addEventListener("click", () => $(".prototype-shell").classList.add("annotation-closed")); $("#annotationReopen").addEventListener("click", () => $(".prototype-shell").classList.remove("annotation-closed"));
window.addEventListener("message-push:rule-changed", render); window.addEventListener("message-push:product-changed", event => setProduct(event.detail)); render();
const demo = new URLSearchParams(location.search).get("demo"); if (demo === "language") setTimeout(() => openProductLanguageDrawer({ onClose: render }), 0);
