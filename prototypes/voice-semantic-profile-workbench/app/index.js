import { $, $$, escapeHtml } from "./dom.js";
import { capabilityCatalog, profiles, selectedProfile, setState, state, subscribe, v1Baseline } from "./state.js";

const tag = (text, type = "info") => `<span class="el-tag el-tag--${type} is-plain">${text}</span>`;
const anchor = (n) => `<button class="annotation-anchor" type="button" data-anchor="${n}" aria-label="查看批注 ${n}">${n}</button>`;
const statusMeta = { ready: ["已就绪", "success"], draft: ["草稿", "warning"], blocked: ["校验阻断", "danger"], conditional: ["条件映射", "warning"], unsupported: ["不支持", "danger"], alexa_only: ["仅 Alexa", "primary"], metadata_only: ["仅元数据", "info"], passed: ["等价通过", "success"] };

function statusTag(status) { const [label, type] = statusMeta[status] || [status, "info"]; return tag(label, type); }
function profileStatus(profile) { return profile.projections.google.status === "blocked" ? "blocked" : profile.status; }
function featureInfo(id) { return capabilityCatalog.find((item) => item.id === id); }

function renderBreadcrumbs() {
  const crumbs = state.page === "profiles" ? ["智能产品", "设备助手 V2", "语义 Profile"] : state.page === "catalog" ? ["配置中心", "设备助手 V2", "能力 Catalog"] : ["设备助手 V2", "V1 迁移校验"];
  $("#breadcrumbs").innerHTML = `<div class="breadcrumb">${crumbs.map((item, index) => `<span class="${index === crumbs.length - 1 ? "is-current" : ""}">${item}</span>`).join("<i>/</i>")}</div>`;
}

function renderProfiles() {
  const profile = selectedProfile();
  if (state.selectedProfileId && state.tab !== "list") return renderProfileDetail(profile);
  return `<section class="page-heading"><div><div class="heading-line"><h1>语义 Profile</h1>${anchor(1)}</div><p>以设备语义为唯一产品配置源；厂商协议字段在独立 Projection 中维护。</p></div><button class="el-btn el-btn--primary" data-action="new-profile">+ 新建语义 Profile</button></section>
    <section class="metric-grid"><article><span>语义 Profile</span><strong>${profiles.length}</strong><small>全部为 V2 独立副本</small></article><article><span>Alexa Projection</span><strong>${profiles.filter((item) => item.projections.alexa.status === "ready").length}</strong><small>Golden Output 已覆盖</small></article><article><span>Google Ready</span><strong>${profiles.filter((item) => item.projections.google.status === "ready").length}</strong><small>其余显示明确阻断原因</small></article><article><span>V1 基线</span><strong>只读</strong><small>不写回、不切流</small></article></section>
    <section class="admin-panel"><div class="panel-toolbar"><div class="filter-row"><input class="el-input filter-search" placeholder="搜索 Profile、产品 ID 或设备类别" /><select class="el-select"><option>全部状态</option><option>草稿</option><option>校验阻断</option></select><button class="el-btn">重置</button></div><span class="toolbar-note"><b></b> V2 影子编译环境</span></div>
      <table class="el-table"><thead><tr><th>SemanticProfile</th><th>产品 / 设备语义</th><th>版本</th><th>Alexa Projection</th><th>Google Projection</th><th>最近更新</th><th class="col-ops">操作</th></tr></thead><tbody>${profiles.map((item) => `<tr><td><strong>${item.name}</strong><small class="cell-secondary">${item.productKey}</small></td><td>${item.product}<small class="cell-secondary">${item.deviceClass}</small></td><td><code>v${item.semanticVersion}</code></td><td>${statusTag(item.projections.alexa.status)}<small class="cell-secondary">${item.projections.alexa.deviceType}</small></td><td>${statusTag(item.projections.google.status)}<small class="cell-secondary">${item.projections.google.deviceType}</small></td><td>${item.updatedAt}<small class="cell-secondary">${item.updatedBy}</small></td><td class="col-ops"><button class="op-link" data-action="open-profile" data-profile="${item.id}">配置</button><span class="op-divider">|</span><button class="op-link" data-action="compile" data-profile="${item.id}">影子编译</button></td></tr>`).join("")}</tbody></table>
      <footer class="table-footer"><span>产品只选择已准入的语义能力；ProviderMetadata 不直接开放。</span><span>1 - ${profiles.length} / ${profiles.length}</span></footer></section>`;
}

function renderProfileDetail(profile) {
  const tabs = [["semantic", "语义能力"], ["alexa", "Alexa Projection"], ["google", "Google Projection"], ["fixtures", "Fixture 校验"]];
  const current = state.tab === "list" ? "semantic" : state.tab;
  return `<section class="detail-heading"><div><button class="back-link" data-action="back-list">返回语义 Profile</button><div class="heading-line"><h1>${profile.name}</h1>${statusTag(profileStatus(profile))}${anchor(2)}</div><p>${profile.productKey} <i>|</i> deviceClass: <code>${profile.deviceClass}</code> <i>|</i> SemanticProfile v${profile.semanticVersion}</p></div><div class="page-actions"><button class="el-btn" data-action="run-golden">运行 Alexa 等价校验</button><button class="el-btn el-btn--primary" data-action="save-draft">保存草稿</button></div></section>
  <section class="profile-summary"><div><span>权威状态源</span><strong>device_reported</strong></div><div><span>语义功能</span><strong>${profile.features.length} 项</strong></div><div><span>Alexa</span>${statusTag(profile.projections.alexa.status)}</div><div><span>Google</span>${statusTag(profile.projections.google.status)}</div></section>
  <nav class="detail-tabs">${tabs.map(([id, label]) => `<button class="detail-tab ${current === id ? "is-active" : ""}" data-tab="${id}">${label}</button>`).join("")}</nav>
  <section class="detail-surface">${current === "semantic" ? renderSemantic(profile) : current === "alexa" ? renderAlexa(profile) : current === "google" ? renderGoogle(profile) : renderFixtures(profile)}</section>`;
}

function renderSemantic(profile) {
  return `<div class="section-heading"><div><h2>中立语义能力 ${anchor(3)}</h2><p>这里不出现 Alexa instance、Alexa Value、Google Trait 或厂商资源字段。</p></div><button class="el-btn el-btn--primary" data-action="edit-feature">+ 添加能力</button></div>
  <table class="el-table feature-table"><thead><tr><th>Feature ID</th><th>中立语义</th><th>物模型引用</th><th>方向 / 状态源</th><th>值域</th><th>投影关系</th><th class="col-ops">操作</th></tr></thead><tbody>${profile.features.map((feature) => { const info = featureInfo(feature.id); return `<tr><td><code>${feature.id}</code></td><td><strong>${info.label}</strong><small class="cell-secondary">${info.semantic}</small></td><td><code>${feature.property}</code></td><td>${feature.direction}<small class="cell-secondary">${feature.source}</small></td><td>${feature.values}</td><td><span class="mapping-pill">${info.cardinality}</span></td><td class="col-ops"><button class="op-link" data-action="edit-feature">编辑</button></td></tr>`; }).join("")}</tbody></table>
  <section class="semantic-note"><div class="note-icon">i</div><div><strong>共享的是语义和值含义，不是厂商资源。</strong><p>例如 <code>brightness</code> 在两家平台均表示 0-100 亮度；Alexa Resource KV 与 Google trait schema / 同义词由各 Projection 单独生成。</p></div></section>`;
}

function renderAlexa(profile) {
  const p = profile.projections.alexa;
  return `<div class="projection-header"><div><h2>Alexa ProviderProjection ${anchor(4)}</h2><p>由 SemanticProfile 生成；本期保持与 V1 的 Discovery、Directive、StateReport、Resource KV 输出等价。</p></div><div>${statusTag(p.status)} <button class="el-btn" data-action="run-golden">重新校验</button></div></div>
  <div class="projection-grid"><section class="admin-panel"><h3>Endpoint 分类</h3><code class="big-code">displayCategories: ["${p.deviceType}"]</code><p class="muted">投影版本 v${p.version}；${p.source}</p></section><section class="admin-panel"><h3>资源生成</h3><strong>${p.resources}</strong><p class="muted">instance 与 Alexa Value 仅在该 Projection 内保存和解析。</p></section></div>
  <section class="admin-panel"><div class="panel-heading"><div><h3>Capability Mapping</h3><p>V2 读取中立 Feature，生成 Alexa 公开协议字段。</p></div></div><table class="el-table"><thead><tr><th>Feature</th><th>Alexa Interface</th><th>Instance / Alexa Value</th><th>Resource KV</th><th>结果</th></tr></thead><tbody>${profile.features.map((feature) => { const info = featureInfo(feature.id); const instance = feature.id === "range" ? "NightLight.Intensity" : "-"; const resource = feature.id === "range" ? "RangeController.NightLightIntensity" : "平台模板解析"; return `<tr><td><code>${feature.id}</code></td><td>${info.alexa}</td><td>${instance}</td><td>${resource}</td><td>${tag("等价", "success")}</td></tr>`; }).join("")}</tbody></table></section>
  <section class="code-panel"><header><span>Discovery preview</span><button class="op-link" data-action="copy-preview">复制</button></header><pre>${escapeHtml(JSON.stringify({ endpointId: profile.productKey, displayCategories: [p.deviceType], capabilities: profile.features.map((feature) => ({ interface: "Alexa." + featureInfo(feature.id).alexa })) }, null, 2))}</pre></section>`;
}

function renderGoogle(profile) {
  const p = profile.projections.google;
  const googleFeatures = profile.features.filter((feature) => feature.id !== "range");
  const traitRows = profile.features.map((feature) => { const info = featureInfo(feature.id); const blocked = feature.id === "range"; return `<tr class="${blocked ? "row-blocked" : ""}"><td><code>${feature.id}</code></td><td>${info.google}</td><td>${blocked ? tag("conditional", "warning") : tag("ready", "success")}</td><td>${blocked ? "未声明业务语义，不能自动选择 Trait" : "语义定义满足规则"}</td></tr>`; }).join("");
  return `<div class="projection-header"><div><h2>Google Home Shadow Projection ${anchor(5)}</h2><p>仅生成离线 SYNC / QUERY / EXECUTE 预览；不包含 OAuth、Fulfillment、Request Sync、Report State 或认证。</p></div><div>${statusTag(p.status)} <button class="el-btn el-btn--primary" data-action="compile">运行影子编译</button></div></div>
  ${p.blockedBy ? `<section class="validation-banner is-danger"><strong>Google Projection 发布被阻断</strong><span>${p.blockedBy}</span><button class="op-link" data-action="edit-feature">修改语义能力</button></section>` : ""}
  <section class="admin-panel"><div class="panel-heading"><div><h3>Trait Projection</h3><p>不同厂商不强求一一对应；每条投影必须展示关系和前置条件。</p></div></div><table class="el-table"><thead><tr><th>Semantic Feature</th><th>Google Trait / state</th><th>状态</th><th>判定</th></tr></thead><tbody>${traitRows}</tbody></table></section>
  <div class="shadow-grid"><section class="code-panel"><header><span>SYNC</span><span>${p.deviceType}</span></header><pre>${escapeHtml(JSON.stringify({ id: profile.productKey, type: p.deviceType, traits: googleFeatures.map((feature) => "action.devices.traits." + featureInfo(feature.id).google) }, null, 2))}</pre></section><section class="code-panel"><header><span>QUERY</span><span>shadow</span></header><pre>${escapeHtml(JSON.stringify({ online: true, on: true, brightness: 60 }, null, 2))}</pre></section><section class="code-panel"><header><span>EXECUTE</span><span>shadow</span></header><pre>${escapeHtml(JSON.stringify({ command: "action.devices.commands.BrightnessAbsolute", params: { brightness: 60 } }, null, 2))}</pre></section></div>`;
}

function renderFixtures(profile) {
  const fixtureRows = [
    ["Night Light / Power + Brightness", "Alexa PowerController -> Google OnOff; BrightnessController -> Brightness", "passed"],
    ["Mode / Enum", "ModeController values -> Google Modes settings", "passed"],
    ["Toggle / Boolean", "ToggleController instances -> Google Toggles", "passed"],
    ["Range / Generic level", "RangeController -> no generic Google Trait", "conditional"],
    ["Audio / State", "Speaker + Playback State -> Volume + TransportControl", "passed"],
    ["RTC Session", "RTCSessionController -> unsupported", "passed"]
  ];
  return `<div class="section-heading"><div><h2>Contract Fixture 校验 ${anchor(6)}</h2><p>Fixture 用于验证复杂语义结构，不将未经准入的能力开放给产品配置。</p></div><button class="el-btn el-btn--primary" data-action="run-fixtures">${state.fixtureRun ? "全部通过" : "运行全部 Fixture"}</button></div>
  <section class="admin-panel"><table class="el-table"><thead><tr><th>Fixture</th><th>验证规则</th><th>结果</th><th class="col-ops">操作</th></tr></thead><tbody>${fixtureRows.map(([name, rule, result]) => `<tr><td><strong>${name}</strong></td><td>${rule}</td><td>${statusTag(result)}</td><td class="col-ops"><button class="op-link" data-action="run-one">运行</button></td></tr>`).join("")}</tbody></table></section>
  <section class="validation-banner"><strong>发布规则</strong><span>仅 <code>ready</code> Projection 可发布；<code>conditional</code> 与 <code>unsupported</code> 是有效结果，但不能静默降级。</span></section>`;
}

function renderCatalog() {
  const scopes = [["semantic", "Semantic Capability"], ["alexa", "Alexa Metadata"], ["google", "Google Metadata"]];
  const scope = state.catalogScope;
  const rows = scope === "semantic" ? capabilityCatalog : scope === "alexa" ? capabilityCatalog.map((item) => ({ ...item, provider: item.alexa })) : capabilityCatalog.map((item) => ({ ...item, provider: item.google }));
  return `<section class="page-heading"><div><div class="heading-line"><h1>能力 Catalog</h1>${anchor(7)}</div><p>官方 Provider 元数据与可供产品选择的中立语义能力分层维护。</p></div><button class="el-btn" data-action="new-catalog">录入官方元数据</button></section>
  <nav class="detail-tabs catalog-tabs">${scopes.map(([id, label]) => `<button class="detail-tab ${scope === id ? "is-active" : ""}" data-catalog-scope="${id}">${label}</button>`).join("")}</nav>
  <section class="catalog-guide"><div><strong>${scope === "semantic" ? "产品只能选择已准入 Semantic Capability" : "Provider Metadata 不直接在产品下拉展示"}</strong><p>${scope === "semantic" ? "准入后才具备数据类型、操作、状态源和投影规则。" : "录入官方版本、字段约束、区域限制与来源，完成能力包后才可升级。"}</p></div>${tag(scope === "semantic" ? "产品可见" : "平台维护", scope === "semantic" ? "success" : "info")}</section>
  <section class="admin-panel"><table class="el-table"><thead><tr><th>${scope === "semantic" ? "Capability" : "官方项"}</th><th>业务语义</th><th>${scope === "semantic" ? "关系" : "Provider 定义"}</th><th>准入状态</th><th>产品操作</th></tr></thead><tbody>${rows.map((item) => `<tr><td><code>${item.id}</code><small class="cell-secondary">${item.kind}</small></td><td>${item.semantic}</td><td>${scope === "semantic" ? item.cardinality : item.provider}</td><td>${statusTag(item.status)}</td><td>${item.status === "metadata_only" ? `<button class="el-btn is-disabled" disabled>待能力包准入</button>` : `<button class="op-link" data-action="show-toast" data-message="已查看 ${item.id} 的投影规则">查看投影规则</button>`}</td></tr>`).join("")}</tbody></table></section>`;
}

function renderMigration() {
  return `<section class="page-heading"><div><div class="heading-line"><h1>V1 迁移校验</h1>${anchor(8)}</div><p>Alexa V1 为不可变输入；V2 迁移只生成独立副本并以 Golden Output 阻断差异。</p></div><button class="el-btn el-btn--primary" data-action="run-golden">运行全部等价校验</button></section>
  <section class="baseline-callout"><div><strong>冻结边界</strong><p>不修改 V1 PRD、飞书文档、原型目录、线上 URL、Profile ID、instance、Alexa Value、Resource KV 或运行配置。</p></div><span class="baseline-lock">V1 READ ONLY</span></section>
  <section class="admin-panel"><table class="el-table"><thead><tr><th>Alexa V1 输入</th><th>V2 迁移副本</th><th>Golden Output</th><th>状态</th><th class="col-ops">操作</th></tr></thead><tbody>${v1Baseline.map((item) => `<tr><td><code>${item.source}</code></td><td><code>${item.semantic}</code></td><td>${item.checks.map((check) => `<span class="check-chip">${check}</span>`).join("")}</td><td>${statusTag(item.status)}</td><td class="col-ops"><button class="op-link" data-action="view-diff">查看规范化差异</button></td></tr>`).join("")}</tbody></table></section>
  <section class="code-panel diff-panel"><header><span>bedside-light-v1 -> night-light-v2</span><span class="diff-ok">0 differences</span></header><pre>{
  "result": "equivalent",
  "normalization": ["stable-key-order", "protocol-defaults-elided"],
  "checkedAt": "2026-08-19T10:30:00+08:00"
}</pre></section>`;
}

const annotations = {
  profiles: [
    [1, "语义 Profile 列表", "关联位置：语义 Profile > 列表", "产品侧只读取中立语义版本和各厂商 Projection 状态。Alexa / Google 字段不在列表中混合编辑。", "点击“配置”进入详情；影子编译只产生离线输出。"],
    [2, "V1 冻结边界", "关联位置：列表 > V1 基线", "V1 是只读基线；V2 目录、飞书文档、原型路径和远端分支均独立。", "不能从本页面对 V1 写入或发布。"]
  ],
  semantic: [[3, "中立能力编辑", "关联位置：Profile 详情 > 语义能力", "feature 仅保存能力 ID、物模型引用、读写方向、状态源和值域。", "添加能力时隐藏 metadata_only 项；保存后更新两个 Projection 的待校验状态。"]],
  alexa: [[4, "Alexa Projection", "关联位置：Profile 详情 > Alexa Projection", "instance、Alexa Value、Resource KV 只在 Alexa Projection 内配置与解析。", "运行等价校验失败时阻断 V2 发布，绝不回写 V1。"]],
  google: [[5, "Google Shadow Projection", "关联位置：Profile 详情 > Google Projection", "此页面只预览 SYNC / QUERY / EXECUTE 编译结果，不执行 OAuth、Fulfillment 或线上状态提交。", "通用 Range 未具名时显示 conditional 并阻断 Google 发布；Alexa Projection 不受影响。"]],
  fixtures: [[6, "Fixture 校验", "关联位置：Profile 详情 > Fixture 校验", "以契约 Fixture 覆盖 Mode、Toggle、Range、音频与 Alexa-only RTC 等复杂结构。", "运行后显示明确结果；unsupported 是合格结果，不是自动降级。"]],
  catalog: [[7, "三层 Catalog", "关联位置：能力 Catalog", "官方元数据、产品语义和厂商投影规则分层维护。", "metadata_only 不能被产品选择；新增能力先完成准入与回归。"]],
  migration: [[8, "Golden Output", "关联位置：V1 迁移校验", "比较 Discovery、Directive、StateReport、Resource KV 的规范化输出。", "有差异则阻断 V2 Projection 发布，V1 继续作为唯一线上运行源。"]]
};

function renderAnnotations() {
  const key = state.page === "profiles" ? (state.selectedProfileId && state.tab !== "list" ? state.tab : "profiles") : state.page;
  const items = annotations[key] || annotations.profiles;
  $("#annotation-root").innerHTML = `<section class="annotation-context"><span>当前视图</span><strong>${key === "profiles" ? "语义 Profile 列表" : key}</strong><p>页面级交互、状态和异常规则以此面板为准。</p></section>${items.map(([n, title, location, description, action]) => `<article class="annotation-card" data-annotation="${n}"><div class="annotation-card__top"><b>${n}</b><h2>${title}</h2></div><p class="annotation-location">${location}</p><dl><dt>说明</dt><dd>${description}</dd><dt>交互</dt><dd>${action}</dd></dl></article>`).join("")}<section class="annotation-assumption"><strong>本期假设</strong><p>Google Device Type / Trait 使用离线 Shadow Compiler 结果验证；真实账号绑定、认证和 Fulfillment 不在本期。</p></section>`;
}

function renderDrawer() {
  const root = $("#drawer-root");
  if (!state.drawer) { root.innerHTML = ""; return; }
  const isCatalog = state.drawer === "catalog";
  root.innerHTML = `<div class="drawer-host is-open"><div class="drawer-mask" data-action="close-drawer"></div><aside class="el-drawer" role="dialog" aria-modal="true" aria-label="${isCatalog ? "录入官方元数据" : "编辑语义能力"}"><header class="el-drawer__header"><h2>${isCatalog ? "录入官方元数据" : "编辑中立语义能力"}</h2><button class="icon-btn" data-action="close-drawer" aria-label="关闭">x</button></header><div class="el-drawer__body">${isCatalog ? `<div class="form-row"><label>Provider</label><select class="el-select"><option>Alexa</option><option>Google Home</option></select></div><div class="form-row"><label>官方 Interface / Trait</label><input class="el-input" placeholder="例如 Alexa.ThermostatController" /><p class="form-help">初始状态固定为 metadata_only，不能直接供产品选择。</p></div><div class="form-row"><label>官方来源</label><input class="el-input" value="https://developers.home.google.com/cloud-to-cloud/traits" /></div>` : `<div class="drawer-alert"><strong>编辑范围</strong><p>仅编辑中立语义字段。厂商字段请在相应 Projection 中维护。</p></div><div class="form-row"><label>Semantic Capability</label><select class="el-select" id="feature-capability">${capabilityCatalog.filter((item) => item.status !== "metadata_only").map((item) => `<option>${item.id}</option>`).join("")}</select></div><div class="form-row"><label>物模型属性 / 命令</label><input class="el-input" value="night_light_level" /></div><div class="form-row"><label>权威状态源</label><select class="el-select"><option>device_reported</option><option>cloud_confirmed</option></select></div><div class="form-row"><label>值域 / 语义值</label><input class="el-input" value="1 - 5" /><p class="form-help">通用 Range 必须补充业务语义后才可生成 Google Trait。</p></div>`}</div><footer class="el-drawer__footer"><button class="el-btn" data-action="close-drawer">取消</button><button class="el-btn el-btn--primary" data-action="drawer-save">保存并校验</button></footer></aside></div>`;
}

function render() {
  renderBreadcrumbs();
  $("#page-root").innerHTML = state.page === "profiles" ? renderProfiles() : state.page === "catalog" ? renderCatalog() : renderMigration();
  renderAnnotations();
  renderDrawer();
  $$(".side-nav__item[data-page]").forEach((button) => button.classList.toggle("is-active", button.dataset.page === state.page));
  if (state.toast) { const toast = $("#toast"); toast.textContent = state.toast; toast.classList.add("show"); setTimeout(() => { toast.classList.remove("show"); if (state.toast) setState({ toast: null }); }, 2400); }
}

function flash(message) { setState({ toast: message }); }

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], [data-page], [data-tab], [data-catalog-scope], [data-anchor]");
  if (!target) return;
  if (target.dataset.page) { setState({ page: target.dataset.page, selectedProfileId: target.dataset.page === "profiles" ? "" : state.selectedProfileId, tab: "list" }); return; }
  if (target.dataset.tab) { setState({ tab: target.dataset.tab }); return; }
  if (target.dataset.catalogScope) { setState({ catalogScope: target.dataset.catalogScope }); return; }
  if (target.dataset.anchor) { const card = $(`[data-annotation="${target.dataset.anchor}"]`); card?.scrollIntoView({ behavior: "smooth", block: "center" }); card?.classList.add("is-highlighted"); setTimeout(() => card?.classList.remove("is-highlighted"), 1200); return; }
  const action = target.dataset.action;
  if (action === "open-profile") setState({ page: "profiles", selectedProfileId: target.dataset.profile, tab: "semantic" });
  else if (action === "back-list") setState({ selectedProfileId: "", tab: "list" });
  else if (action === "compile") { if (target.dataset.profile) setState({ selectedProfileId: target.dataset.profile, page: "profiles", tab: "google", toast: "影子编译完成：已生成离线 Google SYNC / QUERY / EXECUTE 输出" }); else flash("影子编译完成：发现 1 项 Google 条件映射阻断"); }
  else if (["edit-feature", "new-profile"].includes(action)) setState({ drawer: "feature" });
  else if (["new-catalog"].includes(action)) setState({ drawer: "catalog" });
  else if (action === "close-drawer") setState({ drawer: "" });
  else if (action === "drawer-save") setState({ drawer: "", toast: "已保存草稿，Alexa 与 Google Projection 已标记为待校验" });
  else if (action === "run-golden") flash("Alexa Golden Output 校验通过：0 differences");
  else if (action === "run-fixtures") setState({ fixtureRun: true, toast: "6 个 Fixture 已运行：5 项通过，1 项条件映射符合预期" });
  else if (action === "run-one") flash("Fixture 通过：投影结果符合契约");
  else if (action === "save-draft") flash("SemanticProfile 草稿已保存，未影响 V1 运行版本");
  else if (action === "copy-preview") flash("Discovery Preview 已复制到剪贴板（原型模拟）");
  else if (action === "view-diff") flash("规范化差异：0 differences");
  else if (action === "show-v1-baseline") { setState({ page: "migration", selectedProfileId: "", tab: "list" }); }
  else if (action === "show-toast") flash(target.dataset.message || "投影规则已加载");
});

subscribe(render);
render();
