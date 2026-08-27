import {
  capabilityResourceFor,
  capabilityCatalog,
  capabilityCandidatesForSource,
  catalogVersions,
  closeResourceEditor,
  enumEntries,
  filteredResources,
  getResource,
  localePolicy,
  alexaProfileLocales,
  localeCompletion,
  mappingIssues,
  modelPropertyCatalog,
  modeResourceFor,
  closeEditor,
  closeModal,
  dashboard,
  endpointDisplayCategoryCatalog,
  filteredProfiles,
  getProfile,
  logData,
  openEditor,
  openProductDetail,
  openProductProfile,
  productData,
  resourceRegistry,
  resourcesFor,
  resetResourceFilters,
  publishDraft,
  rollbackProfile,
  runValidation,
  locateValidationIssue,
  invalidateValidation,
  saveDraft,
  setEditorSection,
  setFilter,
  setHighlightedAnchor,
  setMobileView,
  setPage,
  setResourceFilter,
  setToast,
  showModal,
  state,
  statusMeta,
  subscribe,
  updateCapability,
  updateProjectionOverride,
  updateDraft,
  updateProductAlexaSupport,
  updateResourceDraft,
  openResourceEditor,
  saveResourceDraft,
  semanticCapabilityCatalog,
  semanticCandidatesForSource,
  resolveProviderProjection,
  selectedCapabilityCandidate,
  sourceContractFingerprintFor,
  generatedResourceRefs,
  stableInstanceFor,
  utteranceExamplesForBinding,
  updateValueBinding,
  valueBindingsFor,
  skillLocales,
  validateResourceDraft,
  voiceLabelResources,
  addCapability,
  removeCapability,
  setExpandedMapping,
  toggleTechnicalDetails,
  setProfileLocale,
  requestMappingChange,
  confirmMappingChange,
  updateVoiceLabel
} from "./state.js?v=20260827v5";
import { $, anchor, escapeHtml, statusClass, tag } from "./dom.js";

const sections = [
  ["basic", "基础信息"],
  ["mapping", "能力与映射"],
  ["reporting", "状态报告"],
  ["publish", "校验与发布"]
];
const sectionLabels = Object.fromEntries(sections);

function issuesForSection(validation, section) {
  return validation?.status === "failed" || validation?.status === "passed"
    ? (validation.issues || []).filter((issue) => issue.section === section)
    : [];
}

function sectionIssueBadge(validation, section) {
  const issues = issuesForSection(validation, section);
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  if (errorCount) return `<i class="drawer-section-count is-error" aria-label="${errorCount} 个阻断项">${errorCount}</i>`;
  if (warningCount) return `<i class="drawer-section-count is-warning" aria-label="${warningCount} 个提醒">${warningCount}</i>`;
  return "";
}

function validationIssueAction(issue, label = "定位") {
  return `<button class="validation-issue" data-action="locate-validation-issue" data-validation-issue-id="${escapeHtml(issue.id)}"><span class="validation-issue__severity ${issue.severity === "error" ? "is-error" : "is-warning"}">${issue.severity === "error" ? "阻断" : "提醒"}</span><span>${escapeHtml(issue.message)}</span><em>${label}</em></button>`;
}

function renderValidationDock(validation, section) {
  if (section === "publish" || !validation || validation.status === "idle") return "";
  if (validation.status === "stale") return `<section class="validation-dock is-stale" aria-live="polite"><strong>校验结果已失效</strong><p>配置已变更；旧结果不再用于发布，请重新运行完整校验。</p></section>`;
  const errors = (validation.issues || []).filter((issue) => issue.severity === "error");
  const warnings = (validation.issues || []).filter((issue) => issue.severity === "warning");
  if (validation.status === "passed") return `<section class="validation-dock is-passed" aria-live="polite"><div><strong>校验通过，可以发布</strong><p>${warnings.length ? `另有 ${warnings.length} 个提醒，不阻断发布。` : "当前草稿满足 Alexa 配置发布门禁。"}</p></div><button class="el-btn el-btn--primary" data-action="drawer-section" data-section="publish">前往校验与发布</button></section>`;
  const contextual = issuesForSection(validation, section);
  const otherSections = sections.filter(([key]) => key !== "publish" && key !== section).map(([key, label]) => [key, label, issuesForSection(validation, key)]).filter(([, , issues]) => issues.length);
  const visible = contextual.slice(0, 3);
  const firstIssue = errors[0] || warnings[0];
  return `<section class="validation-dock is-failed" aria-live="polite"><div class="validation-dock__head"><div><strong>校验未通过：${errors.length} 个阻断项${warnings.length ? `，${warnings.length} 个提醒` : ""}</strong><p>${contextual.length ? "以下为当前步骤相关问题；完整清单在第四步。" : `本步骤无阻断；问题位于${otherSections.map(([, label, issues]) => `「${label}」${issues.length} 项`).join("、") || "其他步骤"}。`}</p></div></div>${visible.length ? `<div class="validation-dock__list">${visible.map((issue) => validationIssueAction(issue)).join("")}${contextual.length > visible.length ? `<p>其余 ${contextual.length - visible.length} 项请查看全部。</p>` : ""}</div>` : ""}<div class="validation-dock__actions">${firstIssue ? `<button class="el-btn" data-action="locate-first-validation-issue">定位第一项</button>` : ""}<button class="el-btn" data-action="drawer-section" data-section="publish">查看全部</button></div></section>`;
}

const annotations = {
  profiles: {
    context: "Profiles / Alexa Product Profile",
    summary: "产品 Profile 是把 Momcozy 产品物模型映射为 Alexa Endpoint 的配置单元；同一 Adapter 可以服务多个产品。",
    items: [
      { n: 1, title: "Profile 列表与范围", location: "关联位置：Alexa Product Profile > 页面标题", fields: [["说明", "按产品型号维护 Alexa Endpoint、能力集合与发布状态；不是为每个产品复制一套 Lambda。"], ["交互", "点击“新建 Profile”创建草稿；点击行操作进入配置抽屉。"], ["数据来源", "IoT 产品模板、物模型和已登记的 Adapter 契约。"]] },
      { n: 2, title: "共享 Adapter 契约", location: "关联位置：统计区 > Shared Adapter", fields: [["说明", "Adapter 统一处理 OAuth、Discovery、Directive、StateReport 与官方 ErrorResponse；首期 ChangeReport 仅预留。"], ["状态/差异", "标准属性映射仅配置；出现新 Alexa interface 才扩展 Adapter；复杂业务进入二期评审。"], ["原型备注", "部署拆分按区域、容量、隔离或合规决定，不按单一产品决定。"]] },
      { n: 3, title: "校验与发布状态", location: "关联位置：列表 > 校验 / 状态列", fields: [["说明", "草稿、待发布、校验阻断、已发布、已回滚是独立的可追溯状态。"], ["交互", "校验会检查物模型映射、instance、上报策略与版本兼容；通过后才允许发布。"], ["异常处理", "阻断原因须可定位到字段或契约项，不能只显示“发布失败”。"]] }
    ]
  },
  dashboard: {
    context: "工作台 / 概览",
    summary: "工作台是平台级概览，用于查看用户、设备与产品排行的趋势，是进入 Alexa 配置前的数据入口。",
    items: [
      { n: 12, title: "数据中心与时间窗口", location: "关联位置：工作台 > 顶部筛选", fields: [["说明", "按数据中心页签（测试/北美/亚太/欧洲/中国）和时间窗口（近7/14/30天）聚合概览指标。"], ["交互", "切换数据中心或时间窗口会刷新指标、排行与趋势。"], ["数据来源", "概览配置 / 用户汇总 / 设备汇总面板接口。"]] },
      { n: 13, title: "指标与排行", location: "关联位置：工作台 > 指标卡 / 地区·产品排行", fields: [["说明", "注册用户、活跃用户、绑定设备、活跃设备四类核心指标；地区与产品排行展示占比。"], ["状态/差异", "指标名称与图表标题需保持一致口径，避免多套命名。"], ["原型备注", "此处为虚拟演示数据，正式接入取自概览快照接口。"]] }
    ]
  },
  products: {
    context: "智能产品 / 产品列表",
    summary: "V2 基于 Alexa-only 的 V1 需求调整，仍从智能产品进入配置；V1 与 V2 都是需求版本，均不表示功能已经上线。",
    items: [
      { n: 14, title: "产品列表与检索", location: "关联位置：智能产品 > 列表", fields: [["说明", "复原现有产品分类、所属App、所属平台、通讯方式、产品ID 等筛选与列表字段。"], ["交互", "沿用“查看”进入产品详情；Alexa 不作为产品列表字段或行内操作。"], ["数据来源", "产品列表接口；高级配置和 Profile 不参与列表展示。"]] }
    ]
  },
  "product-detail": {
    context: "智能产品 / 产品详情 / 高级配置",
    summary: "V2 保持 V1 的 Alexa 高级配置入口。一期只开放 Alexa；底层语义模型预留多 Provider，Google Home 在二期实现且不出现在一期产品界面。",
    items: [
      { n: 15, title: "高级配置中的 Alexa 入口", location: "关联位置：产品详情 > 高级配置", fields: [["现状依据", "沿用 V1 和现有产品详情 step=5 的信息架构，Alexa 继续作为同级卡片。"], ["交互", "进入卡片后维护 Alexa 支持状态与四步配置；样例默认处于草稿 / 待校验。"], ["分期边界", "一期产品界面仅包含 Alexa。Google Home 二期复用同一设备语义，使用独立 ProviderProjection 与资源体系。"]] }
    ]
  },
  "resource-library": {
    context: "多语言 / Alexa 语音资源",
    summary: "产品配置是 VoiceLabelSet 的主要编辑入口；本页聚合各 Profile 已产生的 Alexa 语音名称，用于集中维护、本地化审核与追溯。",
    items: [
      { n: 16, title: "VoiceLabelSet 集中维护", location: "关联位置：多语言 > Alexa 语音资源", fields: [["数据来源", "列表由产品 Profile 的能力映射实时聚合；控制名称与 Mode 枚举值分别形成 VoiceLabelSet，不允许手工创建脱离映射的孤立资源。"], ["维护交互", "可按产品、Capability、scope、状态和关键词筛选；编辑时只维护各 Locale 的主名称与最多两个别名。instance、Provider Value、资源引用等机器标识只读。"], ["分期边界", "一期 VoiceLabelSet 仅属于 Alexa Provider。Google Home 二期复用同一设备语义，但使用独立 ProviderProjection 与语音资源体系，不复用 Alexa Resource KV。"]] }
    ]
  },
  logs: {
    context: "调用日志",
    summary: "调用日志记录 Alexa 的 Discovery / Directive / State·Change Report 调用，用于排查授权、发现与状态上报问题。",
    items: [
      { n: 18, title: "调用链路与 trace", location: "关联位置：调用日志 > 列表", fields: [["说明", "按 Profile、通道与结果展示每次 Alexa 调用；每条带 traceId 与结果摘要。"], ["交互", "异常记录（拒绝/失败）需可定位到 Profile、通道与物模型/设备回调原因。"], ["数据来源", "测试域名调用日志；trace 字段由技术方案定义，不作为产品配置项。"]] }
    ]
  },
  drawer: {
    basic: {
      context: "配置抽屉 / 基础信息",
      summary: "基础信息增加 Profile 级 Alexa 目标 Locale；en-US 固定必选，其他候选受 Skill 与 Capability 官方支持范围约束。",
      items: [
        { n: 4, title: "Endpoint 与目标 Locale", location: "关联位置：配置抽屉 > 基础信息", fields: [["说明", "Endpoint 显示分类对应 Alexa Discovery displayCategories[0]；它不等于产品分类，也不自动决定 Capability。"], ["Locale", "en-US 必选；其余选项来自 Alexa Skill 已启用 Locale。所有目标 Locale 的主名称完整后才能发布。"], ["分期", "一期只开放 Alexa；Google Home 二期使用独立 ProviderMapping 和资源体系。"]] }
      ]
    },
    mapping: {
      context: "配置抽屉 / 能力与映射",
      summary: "默认链路简化为：物模型属性/命令 -> Alexa Capability -> 多语言语音名称 -> 英语语句示例。封闭值域仅在需要时显示值对应，内部协议字段仍在技术详情只读展示。",
      items: [
        { n: 5, title: "候选与值对应", location: "关联位置：映射项 > 步骤 1-2", fields: [["候选规则", "只比较物模型 dataJson 来源契约与 Alexa 协议契约；属性 ID、名称、描述不参与。所有直接匹配项同级展示，顺序固定为 Catalog order、再 Capability ID。"], ["数值契约", "Range 保留来源 min/max/step；% 仅编码为 Alexa.Unit.Percent，不归一化。缺少 step 是信息不足；未知单位不可静默丢弃。"], ["封闭值域", "需要值对应时，每个物模型枚举值必须选择唯一 Alexa 目标值；不可忽略、不可复用。Alexa 合法值可以未使用。物模型值数量超过目标值时卡片不可选。"], ["Catalog 边界", "当前 10 个 Alexa 能力包为 profile_ready；EndpointHealth 只在状态报告配置；另有 41 个官方候选仅登记为 metadata_only。"]] },
        { n: 6, title: "多语言与语句预览", location: "关联位置：映射项 > 步骤 3-4", fields: [["语音名称", "需要区分对象的 Mode、Range、Toggle 按目标 Locale 填写一个主名称和最多两个别名；Mode 同时维护全部枚举值名称。"], ["多实例", "运动模式与音乐模式可分别映射 ModeController；平台按 mappingId 生成不同稳定 instance，即使都包含 sleep 值也不会混淆。"], ["语句", "输入完整后从 Provider Metadata 的 Alexa 官方预置模板展示 1-3 条 en-US 示例；状态上报类 PlaybackStateReporter 显示无独立语音控制示例。"]] },
        { n: 8, title: "内部模型折叠", location: "关联位置：映射项 > 技术详情", fields: [["默认界面", "不显示设备语义、规则 ID、优先级、Adapter、instance、Alexa Value、Resource KV 或 Catalog 版本。"], ["排查", "折叠技术详情只读展示内部语义、固定规则、生成的 Capability、instance 和资源引用。"], ["二期", "Google Home 复用同一中立语义，但独立选择 Trait、维护本地化资源并发布，不引用 Alexa 资源。"]] }
      ]
    },
    reporting: {
      context: "配置抽屉 / 状态报告",
      summary: "首期状态以 Alexa 主动查询为主。ChangeReport 保留 schema 扩展，但产品 Profile 不能启用。",
      items: [
        { n: 7, title: "StateReport 策略", location: "关联位置：配置抽屉 > 状态报告", fields: [["说明", "StateReport 用于 Alexa 主动查询；权威状态必须来自已登记的设备或云端状态源。"], ["交互", "ChangeReport 显示为首期预留且不可启用；StateReport 与 EndpointHealth 缺失会触发校验提示。"], ["异常处理", "不能把“云已受理”报告为“设备已完成”；EndpointHealth 关闭时不允许发布。"]] }
      ]
    },
    publish: {
      context: "配置抽屉 / 校验与发布",
      summary: "这里承载完整校验清单、发布门禁和发布操作；其他步骤只显示就地摘要。发布不代表 Alexa 功能已经上线。",
      items: [
        { n: 3, title: "校验与配置发布", location: "关联位置：配置抽屉 > 第四步与底部操作栏", fields: [["说明", "运行完整校验不自动跳转；步骤 1～3 就地显示精简反馈，第四步按步骤分组展示全部结果。"], ["按钮状态", "发布仅在本步骤出现，且只在最近一次校验通过时可用；任一字段变更立即使结果失效。"], ["定位", "每条问题携带步骤、mappingId、Locale 和字段定位信息；用户点击后才切换并聚焦。"]] }
      ]
    }
  }
};

const pageRenderers = {
  products: renderProductsPage,
  "product-detail": renderProductDetail,
  "resource-library": renderResourceLibraryPage
};

function render({ preserveDrawerScroll = false } = {}) {
  const currentDrawerBody = preserveDrawerScroll ? document.querySelector(".el-drawer__body") : null;
  const drawerScroll = currentDrawerBody ? { top: currentDrawerBody.scrollTop, left: currentDrawerBody.scrollLeft } : null;
  document.documentElement.dataset.mobileView = state.mobileView;
  $(".prototype-shell").dataset.mobileView = state.mobileView;
  renderPageHeader();
  const renderPage = pageRenderers[state.page] || renderProductsPage;
  $("#pageRoot").innerHTML = renderPage();
  renderAnnotations();
  renderDrawer();
  applyInstanceFieldHints();
  renderModal();
  renderToast();
  refreshNav();
  refreshMobileTabs();
  applyHighlight();
  applyValidationIssueFocus();
  if (drawerScroll) {
    const restoreDrawerScroll = () => {
      const nextDrawerBody = document.querySelector(".el-drawer__body");
      if (!nextDrawerBody) return;
      nextDrawerBody.scrollTop = drawerScroll.top;
      nextDrawerBody.scrollLeft = drawerScroll.left;
    };
    restoreDrawerScroll();
    window.requestAnimationFrame(restoreDrawerScroll);
  }
}

function renderPageHeader() {
  const meta = {
    products: { crumb: "智能产品", title: "产品列表", copy: "查询、复制、查看产品；Alexa 配置仅在产品详情的高级配置中维护。", action: `<button class="el-btn el-btn--primary" data-action="show-toast" data-toast="创建产品沿用既有 IoT 产品流程" data-toast-type="info">+ 创建产品</button>`, anchor: 14 },
    "product-detail": { crumb: "产品详情", title: "产品详情", copy: "高级配置是当前需求唯一新增 Alexa 入口。", action: `<button class="el-btn" data-action="nav" data-page="products">返回列表</button>`, anchor: 15 },
    "resource-library": { crumb: "多语言 / Alexa 语音资源", title: "Alexa 语音资源", copy: "集中维护由产品能力映射产生的 VoiceLabelSet；产品内联配置仍是主要编辑流程。", action: "", anchor: 16 }
  }[state.page] || { crumb: "智能产品", title: "产品列表", copy: "", action: "", anchor: 14 };
  $("#breadcrumb").innerHTML = `<span>智能产品</span><span class="breadcrumb-slash">/</span><strong>${meta.crumb}</strong>`;
  $("#pageHeader").innerHTML = `<div><div class="page-title-line"><h1>${meta.title}</h1>${anchor(meta.anchor)}</div><p>${meta.copy}</p></div><div class="page-header-actions">${meta.action}</div>`;
}

function renderResourceLibraryPage() {
  const rows = filteredResources();
  const configuredCount = (resource) => resource.targetLocales.filter((locale) => resource.locales?.[locale]?.primary?.trim()).length;
  const resourceStatus = (resource) => resource.status === "published" ? tag("已发布", "success") : tag("草稿", "warning");
  const capabilities = [...new Set(voiceLabelResources().map((resource) => resource.capability))].sort();
  const products = [...new Map(state.profiles.map((profile) => [profile.productId, { id: profile.productId, name: productData.find((item) => item.id === profile.productId)?.name || profile.productKey }])).values()];
  const localePreview = (resource) => resource.targetLocales.map((locale) => { const entry = resource.locales?.[locale]; const aliases = (entry?.aliases || []).filter(Boolean); return `<span><code>${locale}</code> ${escapeHtml(entry?.primary || "未配置")}${aliases.length ? `<small> · ${escapeHtml(aliases.join(" / "))}</small>` : ""}</span>`; }).join("");
  const resourceRows = rows.length ? rows.map((resource) => `<tr><td><strong>${escapeHtml(resource.productName)}</strong><span class="cell-secondary">${escapeHtml(resource.profileName)}</span></td><td><code class="cell-code">${escapeHtml(resource.mappingId)}</code></td><td><code class="cell-code">${escapeHtml(resource.capability)}</code></td><td>${tag(resource.scope === "capability" ? "控制名称" : "模式值", resource.scope === "capability" ? "primary" : "warning")}<span class="cell-secondary">${escapeHtml(resource.label)}</span></td><td><code class="cell-code machine-id">${escapeHtml(resource.machineId)}</code></td><td><code class="cell-code">${escapeHtml(resource.resourceRef)}</code><span class="cell-secondary">v${resource.version}</span></td><td><strong>${configuredCount(resource)}/${resource.targetLocales.length}</strong><span class="cell-secondary">${escapeHtml(resource.targetLocales.join(" / "))}</span></td><td><div class="locale-preview">${localePreview(resource)}</div></td><td>${resourceStatus(resource)}</td><td class="col-ops"><button class="op-link" data-action="edit-resource" data-resource-key="${resource.id}">编辑</button></td></tr>`).join("") : `<tr><td colspan="10"><div class="table-empty">没有符合条件的 VoiceLabelSet</div></td></tr>`;
  return `<nav class="lang-tabs" aria-label="多语言类型"><button class="lang-tab" disabled>产品模板</button><button class="lang-tab" disabled>智能产品</button><button class="lang-tab" disabled>App通用</button><button class="lang-tab is-active">Alexa 语音资源</button></nav><section class="resource-policy"><div><strong>由产品映射聚合的 VoiceLabelSet</strong><p>控制名称和 Mode 枚举值分别形成资源。这里用于集中维护和审核，不能手工新增孤立资源；稳定 instance、Provider Value 与资源引用由平台生成并保持只读。</p></div>${tag("集中维护 / 审计", "info")}</section><section class="admin-panel resource-library"><div class="panel-toolbar resource-toolbar"><div class="filter-row"><select class="el-select filter-select" data-resource-filter="product"><option value="all">全部产品</option>${products.map((item) => `<option value="${item.id}" ${state.resourceFilters.product === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select><select class="el-select filter-select" data-resource-filter="capability"><option value="all">全部 Capability</option>${capabilities.map((id) => `<option value="${id}" ${state.resourceFilters.capability === id ? "selected" : ""}>${id}</option>`).join("")}</select><select class="el-select filter-select" data-resource-filter="scope"><option value="all">全部 scope</option><option value="capability" ${state.resourceFilters.scope === "capability" ? "selected" : ""}>控制名称</option><option value="mode" ${state.resourceFilters.scope === "mode" ? "selected" : ""}>模式值</option></select><select class="el-select filter-select" data-resource-filter="status"><option value="all">全部状态</option><option value="published" ${state.resourceFilters.status === "published" ? "selected" : ""}>已发布</option><option value="draft" ${state.resourceFilters.status === "draft" ? "selected" : ""}>草稿</option></select><input class="el-input resource-search" data-resource-filter="keyword" value="${escapeHtml(state.resourceFilters.keyword)}" placeholder="搜索 Profile、Mapping ID、机器标识或名称" /><button class="el-btn el-btn--primary" data-action="resource-query">查询</button><button class="el-btn" data-action="reset-resource-filters">重置</button></div><div class="table-actions"><button class="el-btn" data-action="resource-import">导入</button><button class="el-btn" data-action="resource-export">导出</button></div></div><div class="resource-table-scroll"><table class="el-table resource-table"><thead><tr><th>产品 / Profile</th><th>Mapping ID</th><th>Capability</th><th>Scope</th><th>稳定机器标识</th><th>VoiceLabelSet / 引用</th><th>Locale 完成度</th><th>主名称 / 别名</th><th>状态</th><th class="col-ops">操作</th></tr></thead><tbody>${resourceRows}</tbody></table></div><footer class="table-footer"><span>共 ${rows.length} 条，数据实时来自产品 Profile 映射。</span><span>产品页内联编辑为主，本页用于本地化维护与审计</span></footer></section>`;
}

function renderProfilesPage() {
  const rows = filteredProfiles();
  const count = (status) => state.profiles.filter((profile) => profile.status === status).length;
  return `
    <section class="metrics-strip" aria-label="Profile 概览">
      <div class="metric"><span>已发布 Profile</span><strong>${count("published")}</strong></div>
      <div class="metric"><span>待校验 / 待发布</span><strong>${count("draft") + count("ready")}</strong></div>
      <div class="metric metric--alert"><span>校验阻断</span><strong>${count("blocked")}</strong></div>
      <div class="metric metric--wide"><span>Shared Adapter</span><strong>smart-home-adapter-v2</strong><small>Contract v2.4.0</small>${anchor(2)}</div>
    </section>
    <section class="admin-panel">
      <div class="panel-toolbar">
        <div class="filter-row">
          <input class="el-input filter-search" data-filter="keyword" value="${escapeHtml(state.filters.keyword)}" placeholder="搜索 Profile 名称、Product Key 或产品分类" />
          <select class="el-select filter-select" data-filter="status"><option value="all">全部状态</option>${Object.entries(statusMeta).map(([key, value]) => `<option value="${key}" ${state.filters.status === key ? "selected" : ""}>${value.label}</option>`).join("")}</select>
          <button class="el-btn" data-action="reset-filters">重置</button>
        </div>
        <div class="toolbar-note"><span class="status-dot status-dot--success"></span> 最近一次 Adapter Contract 校验：通过</div>
      </div>
      <table class="el-table profile-table">
        <thead><tr><th style="width:42px"><input class="el-checkbox" type="checkbox" aria-label="全选" /></th><th>Profile 名称</th><th>产品分类 / 显示分类</th><th>共享 Adapter</th><th>Capability</th><th>状态</th><th>最近更新</th><th class="col-ops">操作</th></tr></thead>
        <tbody>${rows.length ? rows.map(renderProfileRow).join("") : `<tr><td colspan="8"><div class="table-empty">没有符合条件的 Profile</div></td></tr>`}</tbody>
      </table>
      <footer class="table-footer"><span>共 ${rows.length} 条</span><div class="pagination"><button class="page-btn is-active">1</button><button class="page-btn" disabled>2</button><button class="page-btn" disabled>&gt;</button></div></footer>
    </section>`;
}

function renderProfileRow(profile) {
  const status = statusMeta[profile.status];
  const projectedCapabilities = profile.capabilities.flatMap((binding) => resolveProviderProjection(binding, "alexa").outputs.map((output) => output.capabilityId));
  const capabilityText = projectedCapabilities.map((id) => id.replace("Controller", "")).join(" / ");
  return `<tr>
    <td><input class="el-checkbox" type="checkbox" aria-label="选择 ${escapeHtml(profile.name)}" /></td>
    <td><div class="profile-name">${escapeHtml(profile.name)}${profile.id === "bedside-light-v2" ? anchor(1) : ""}</div><div class="profile-key">${escapeHtml(profile.productKey)}</div></td>
    <td><div>${escapeHtml(profile.category)}</div><span class="cell-secondary">displayCategories[0]: ${escapeHtml(profile.displayCategory)}</span></td>
    <td><div class="adapter-cell">${escapeHtml(profile.adapter)}${profile.id === "bedside-light-v2" ? anchor(2) : ""}</div><span class="cell-secondary">v${escapeHtml(profile.adapterVersion)}</span></td>
    <td><div class="capability-cell">${escapeHtml(capabilityText)}</div><span class="cell-secondary">${projectedCapabilities.length} 个 Alexa 输出</span></td>
    <td>${tag(status.label, status.type)}</td>
    <td><div>${escapeHtml(profile.updatedAt)}</div><span class="cell-secondary">${escapeHtml(profile.updatedBy)}</span></td>
    <td class="col-ops"><button class="op-link" data-action="edit-profile" data-profile-id="${profile.id}">编辑</button><span class="op-divider">|</span><button class="op-link" data-action="validate-profile" data-profile-id="${profile.id}">校验${profile.id === "smart-crib-motion-v2" ? anchor(3) : ""}</button><span class="op-divider">|</span><button class="op-link ${profile.status === "published" ? "danger" : "is-disabled"}" data-action="rollback-open" data-profile-id="${profile.id}" ${profile.status === "published" ? "" : "disabled"}>回滚</button><span class="op-divider">|</span><button class="op-link ${profile.status === "published" ? "danger" : "is-disabled"}" data-action="delist-open" data-profile-id="${profile.id}" ${profile.status === "published" ? "" : "disabled"}>下架</button></td>
  </tr>`;
}

function renderDashboardPage() {
  return `<section class="dash-topbar"><div class="dash-region-tabs" role="tablist">${dashboard.regions.map((region, index) => `<button class="dash-region-tab ${index === 0 ? "is-active" : ""}" data-action="show-toast" data-toast="数据中心：${region}（原型演示数据）" data-toast-type="info" role="tab" aria-selected="${index === 0}">${region}</button>`).join("")}</div><div class="dash-range-group">${dashboard.ranges.map((range, index) => `<button class="dash-range-btn ${index === 0 ? "is-active" : ""}" data-action="show-toast" data-toast="时间窗口：${range}（原型演示数据）" data-toast-type="info">${range}</button>`).join("")}</div></section>
    <section class="metrics-strip">${dashboard.metrics.map((metric) => `<div class="metric"><span>${metric.label}</span><strong>${metric.value}</strong><small class="metric-delta">${metric.delta} 较上周期</small></div>`).join("")}</section>
    <section class="dash-grid">
      <section class="admin-panel"><div class="panel-heading"><div><h2>地区用户排行</h2><p>按国家或地区聚合的用户数量与占比。</p></div></div><table class="el-table"><thead><tr><th>地区</th><th>用户数量</th><th>占比</th></tr></thead><tbody>${dashboard.regionRank.map((row) => `<tr><td>${row.region}</td><td>${row.users}</td><td><div class="share-cell"><span class="share-bar" style="width:${row.share}"></span><span>${row.share}</span></div></td></tr>`).join("")}</tbody></table></section>
      <section class="admin-panel"><div class="panel-heading"><div><h2>产品绑定设备排行</h2><p>按产品聚合的设备数量与占比。</p></div></div><table class="el-table"><thead><tr><th>产品名称</th><th>产品ID</th><th>设备数量</th><th>占比</th></tr></thead><tbody>${dashboard.productRank.map((row) => `<tr><td>${row.name}</td><td><code class="cell-code">${row.id}</code></td><td>${row.devices}</td><td><div class="share-cell"><span class="share-bar" style="width:${row.share}"></span><span>${row.share}</span></div></td></tr>`).join("")}</tbody></table></section>
    </section>`;
}

function renderProductsPage() {
  return `<section class="admin-panel product-list-panel">
    <div class="panel-toolbar"><div class="filter-row"><input class="el-input filter-search" placeholder="搜索产品名称 / 型号 / 产品ID" /><select class="el-select" style="width:120px"><option>全部分类</option><option>Breast Pump</option><option>Night Light</option><option>Smart Crib</option><option>Sound Device</option></select><select class="el-select" style="width:120px"><option>全部通讯方式</option><option>BLE</option><option>Wi-Fi</option></select></div><div class="toolbar-note"><span class="status-dot status-dot--success"></span> 共 ${productData.length} 个产品</div></div>
    <table class="el-table"><thead><tr><th>产品分类</th><th>产品名称</th><th>产品型号</th><th>客服型号</th><th>产品ID</th><th>产品代码</th><th>绑定类型</th><th>设备类型</th><th>产品状态</th><th>功能版本 / 状态</th><th>所属平台</th><th>所属App</th><th>通讯方式</th><th class="col-ops">操作</th></tr></thead><tbody>${productData.map((row) => `<tr><td>${row.category}</td><td><strong>${row.name}</strong></td><td>${row.model}</td><td>--</td><td><code class="cell-code">${row.id}</code></td><td>--</td><td>弱绑定</td><td>${row.comm === "BLE" ? "直连设备" : "网关设备"}</td><td>${tag(row.status, row.status === "已上架" ? "success" : "warning")}</td><td>${row.version}</td><td>${row.platform}</td><td>${row.app}</td><td>${row.comm}</td><td class="col-ops"><button class="op-link" data-action="view-product" data-product-id="${row.id}">查看${row.id === "momcozy.w1_lite" ? anchor(14) : ""}</button><span class="op-divider">|</span><button class="op-link" data-action="show-toast" data-toast="复制产品沿用既有流程" data-toast-type="info">复制</button></td></tr>`).join("")}</tbody></table>
    <footer class="table-footer"><span>共 ${productData.length} 条</span></footer>
  </section>`;
}

function renderProductDetail() {
  const product = productData.find((item) => item.id === state.detailProductId) || productData[0];
  const profile = state.profiles.find((item) => item.productId === product.id);
  const tabs = ["基础信息", "功能设计", "扩展程序", "设备调试", "配网引导", "高级配置"];
  const cards = [
    ["新手指导", "未配置", "管理设备新手引导配置"],
    ["云倒计时", "未配置", "管理云端倒计时能力"],
    ["场景联动设置", "未配置", "管理产品场景联动规则"],
    ["耗材管理", "未配置", "管理耗材服务配置"]
  ];
  const alexaStatus = !product.alexaSupported ? "不支持" : profile?.status === "published" ? "已发布" : profile?.status === "blocked" ? "校验阻断" : profile?.status === "disabled" ? "已停用" : "草稿 / 待校验";
  const statusType = alexaStatus === "已发布" ? "success" : alexaStatus === "校验阻断" ? "danger" : alexaStatus === "不支持" ? "info" : "warning";
  return `<section class="product-detail-shell"><section class="product-detail-summary"><div><div class="product-detail-title"><h2>${escapeHtml(product.name)}</h2>${tag(product.status, product.status === "已上架" ? "success" : "warning")}</div><p>${escapeHtml(product.platform)} <span>/</span> 产品分类：${escapeHtml(product.category)} <span>/</span> 产品型号：${escapeHtml(product.model)} <span>/</span> 功能版本：${escapeHtml(product.version)}</p></div></section><nav class="product-tabs" aria-label="产品详情页签">${tabs.map((label, index) => `<button class="product-tab ${index === 5 ? "is-active" : ""}" ${index === 5 ? "" : "disabled"}>${label}</button>`).join("")}</nav><section class="advanced-config"><div class="advanced-heading"><div><h2>高级配置 ${anchor(15)}</h2><p>沿用产品详情现有高级配置卡片；Alexa 作为同级配置入口。</p></div></div><div class="advanced-card-grid">${cards.map(([title, status, description]) => `<article class="advanced-card"><div><h3>${title}</h3><p>${description}</p></div>${tag(status, "info")}</article>`).join("")}<article class="advanced-card advanced-card--alexa"><div><div class="card-title-line"><h3>Alexa</h3>${tag(alexaStatus, statusType)}</div><p>将物模型能力映射为 Alexa Capability，并维护多语言语音名称。</p><small>${product.alexaSupported ? "一期仅生成 Alexa 配置版本；当前状态不表示功能已经上线。" : "当前未启用；可在配置中切换为支持。"}</small></div><button class="el-btn el-btn--primary" data-action="open-product-profile" data-product-id="${product.id}">编辑 Alexa 配置</button></article></div></section></section>`;
}

function renderLogsPage() {
  const resultTag = (row) => row.status === "success" ? tag(row.result, "success") : tag(row.result, "danger");
  return `<section class="admin-panel">
    <div class="panel-toolbar"><div class="filter-row"><input class="el-input filter-search" placeholder="搜索 Profile / traceId" /><select class="el-select" style="width:120px"><option>全部通道</option><option>Discovery</option><option>Directive</option><option>StateReport</option><option>ReportingPolicy</option></select><select class="el-select" style="width:120px"><option>全部结果</option><option>成功</option><option>拒绝</option><option>失败</option></select></div><div class="toolbar-note"><span class="status-dot status-dot--success"></span> 测试域名调用日志，保留 trace 维度便于排障</div></div>
    <table class="el-table"><thead><tr><th>时间</th><th>Profile</th><th>通道</th><th>结果</th><th>Trace ID</th><th>摘要</th></tr></thead><tbody>${logData.map((row) => `<tr><td>${row.time}</td><td><code class="cell-code">${row.profile}</code></td><td>${row.channel}</td><td>${resultTag(row)}</td><td><code class="cell-code">${row.traceId}</code></td><td>${row.detail}</td></tr>`).join("")}</tbody></table>
    <footer class="table-footer"><span>共 ${logData.length} 条</span></footer>
  </section>`;
}

function renderDrawer() {
  const mount = $("#drawerMount");
  const productPane = $("#productPane");
  const overlayOpen = state.resourceEditor.open || state.editor.open;
  productPane.classList.toggle("has-overlay", overlayOpen);
  if (overlayOpen) {
    productPane.scrollLeft = 0;
    productPane.scrollTop = 0;
  }
  if (state.resourceEditor.open) {
    const draft = state.resourceEditor.draft;
    const validation = state.resourceEditor.validation;
    const identityRows = [["产品 / Profile", `${draft.productName} / ${draft.profileName}`], ["Mapping ID", draft.mappingId], ["Alexa Capability", draft.capability], ["Scope", draft.scope === "capability" ? "capability（控制名称）" : `mode（${draft.sourceValue}）`], [draft.scope === "capability" ? "稳定 instance" : "稳定 Provider Value", draft.machineId], ["VoiceLabelSet / 资源引用", draft.resourceRef]];
    const localeRows = skillLocales.map(([locale, label]) => {
      const entry = draft.locales?.[locale] || { primary: "", aliases: ["", ""] };
      const isTarget = draft.targetLocales.includes(locale);
      return `<div class="resource-voice-row ${isTarget ? "is-target" : ""}"><div class="resource-voice-locale"><strong>${label}</strong><code>${locale}</code>${isTarget ? tag(locale === localePolicy.baseLocale ? "必填基线" : "目标 Locale", "info") : `<span>非目标</span>`}</div><label><span>主名称 ${isTarget ? "*" : ""}</span><input class="el-input" data-resource-field="locales.${locale}.primary" value="${escapeHtml(entry.primary || "")}" placeholder="${isTarget ? "发布必填" : "可选"}" /></label><label><span>别名 1</span><input class="el-input" data-resource-field="locales.${locale}.aliases.0" value="${escapeHtml(entry.aliases?.[0] || "")}" /></label><label><span>别名 2</span><input class="el-input" data-resource-field="locales.${locale}.aliases.1" value="${escapeHtml(entry.aliases?.[1] || "")}" /></label></div>`;
    }).join("");
    mount.innerHTML = `<div class="el-drawer-host is-open"><div class="el-drawer__mask" data-action="close-resource-editor"></div><aside class="el-drawer resource-editor-drawer" role="dialog" aria-modal="true" aria-label="编辑 Alexa 语音资源"><header class="el-drawer__header"><div><h2 class="el-drawer__title">编辑 Alexa 语音资源</h2><p class="drawer-subtitle">${escapeHtml(draft.productName)} <span>/</span> ${escapeHtml(draft.mappingId)} <span>/</span> VoiceLabelSet v${draft.version}</p></div><button class="el-drawer__close" data-action="close-resource-editor" aria-label="关闭">x</button></header><div class="el-drawer__body resource-editor-body"><section class="drawer-section"><div class="section-heading"><h3>来源与机器标识 ${anchor(16)}</h3><p>该资源由产品能力映射生成。这里只能维护语音名称；稳定机器标识和资源引用不可修改。</p></div><dl class="resource-identity">${identityRows.map(([label, value]) => `<div><dt>${label}</dt><dd><code>${escapeHtml(value)}</code></dd></div>`).join("")}</dl><div class="resource-locale-heading"><div><strong>VoiceLabelSet 多语言名称</strong><span>每个 Locale 维护 1 个主名称与最多 2 个别名；目标 Locale 的主名称完整后才可发布。</span></div>${tag(draft.scope === "capability" ? "控制名称" : "模式值名称", draft.scope === "capability" ? "primary" : "warning")}</div><div class="resource-voice-grid">${localeRows}</div><p class="locale-editor-help">产品配置页仍是主要编辑入口；此处保存会回写同一 Profile 映射，不会创建新的孤立资源。</p>${validation ? `<div class="validation-result ${validation.passed ? "is-passed" : "is-failed"}"><div class="validation-result__head"><strong>${validation.passed ? "资源校验通过" : `资源校验未通过 (${validation.errors.length})`}</strong>${tag(validation.passed ? "可发布" : "需处理", validation.passed ? "success" : "danger")}</div>${validation.passed ? `<p>所有目标 Locale 主名称与别名规则均满足发布条件。</p>` : `<ul>${validation.errors.map((item) => `<li class="validation-error">${escapeHtml(item)}</li>`).join("")}</ul>`}</div>` : ""}</section></div><footer class="el-drawer__footer"><button class="el-btn" data-action="close-resource-editor">取消</button><button class="el-btn" data-action="save-resource">保存草稿</button><button class="el-btn el-btn--primary" data-action="validate-resource">运行校验</button><button class="el-btn el-btn--primary" data-action="publish-resource" ${validation?.passed ? "" : "disabled"}>发布资源</button></footer></aside></div>`;
    return;
  }
  if (!state.editor.open) { mount.innerHTML = ""; return; }
  const draft = state.editor.draft;
  const validation = state.editor.validation;
  const isPublishSection = state.editor.section === "publish";
  mount.innerHTML = `<div class="el-drawer-host is-open"><div class="el-drawer__mask" data-action="close-editor"></div><aside class="el-drawer alexa-drawer" role="dialog" aria-modal="true" aria-label="${state.editor.sourceId ? "编辑" : "新建"}产品 Alexa 配置"><header class="el-drawer__header"><div><h2 class="el-drawer__title">${state.editor.sourceId ? "编辑" : "新建"}产品 Alexa 配置</h2><p class="drawer-subtitle">${escapeHtml(draft.name || "未命名 Profile")} <span>/</span> ${escapeHtml(draft.productKey || "草稿")}</p></div><button class="el-drawer__close" data-action="close-editor" aria-label="关闭">x</button></header><div class="drawer-shell"><nav class="drawer-section-nav">${sections.map(([key, label], index) => `<button class="drawer-section-item ${state.editor.section === key ? "is-active" : ""}" data-action="drawer-section" data-section="${key}" ${!state.editor.productAlexaSupported && key !== "basic" ? "disabled" : ""}><span class="drawer-section-index">${index + 1}</span><span class="drawer-section-label">${label}</span>${sectionIssueBadge(validation, key)}</button>`).join("")}</nav><div class="el-drawer__body">${renderDrawerBody(draft)}</div></div>${renderValidationDock(validation, state.editor.section)}<footer class="el-drawer__footer"><button class="el-btn" data-action="close-editor">取消</button><button class="el-btn" data-action="save-draft">保存草稿</button><button class="el-btn el-btn--primary" data-action="run-validation" ${state.editor.productAlexaSupported ? "" : "disabled"}>${isPublishSection ? "重新校验" : "运行完整校验"}</button>${isPublishSection ? `<button class="el-btn el-btn--primary" data-action="publish" ${state.editor.productAlexaSupported && validation?.status === "passed" ? "" : "disabled"}>发布</button>` : ""}</footer></aside></div>`;
}

function renderLegacyDrawerBody(draft) {
  if (state.editor.section === "mapping") return renderMappingSection(draft);
  if (state.editor.section === "reporting") return renderReportingSection(draft);
  if (state.editor.section === "publish") return renderPublishSection(draft);
  const displayCategoryOptions = endpointDisplayCategoryCatalog.filter((item) => item.status === "profile_ready").map((item) => `<option value="${item.id}" ${draft.displayCategory === item.id ? "selected" : ""}>${item.label} · ${item.semantic}</option>`).join("");
  return `<section class="drawer-section"><div class="section-heading"><h3>产品 Alexa 配置 ${anchor(4)}</h3><p>Profile 归属当前产品；选择 Alexa 官方 Endpoint 显示分类，并映射标准物模型能力。</p></div><div class="switch-row switch-row--interactive"><button class="switch-control switch-control--button ${state.editor.productAlexaSupported ? "is-on" : ""}" type="button" data-action="toggle-alexa-support" role="switch" aria-checked="${state.editor.productAlexaSupported}" aria-label="Alexa：${state.editor.productAlexaSupported ? "支持" : "不支持"}"></button><span><strong>Alexa：${state.editor.productAlexaSupported ? "支持" : "不支持"}</strong><small>关闭后保留 Profile 历史并停用发布版本，不参与 Discovery；重新开启后必须重新校验和发布。</small></span></div>${state.editor.productAlexaSupported ? `<div class="form-grid"><label class="form-row"><span>Profile 名称 <b>*</b></span><input class="el-input" data-field="name" value="${escapeHtml(draft.name)}" placeholder="例如 Bedside Light Alexa Profile" /><em>产品级配置版本名称，不直接作为用户语音名称。</em></label><label class="form-row"><span>关联产品 <b>*</b></span><input class="el-input is-readonly" value="${escapeHtml(draft.productKey)}" readonly /><em>从智能产品入口带入，不能在此切换产品。</em></label><label class="form-row"><span>产品分类</span><input class="el-input is-readonly" value="${escapeHtml(draft.category)}" readonly /><em>来自 IoT 产品主数据，不等于 Alexa 显示分类。</em></label><label class="form-row"><span>Alexa Endpoint 显示分类 <b>*</b></span><select class="el-select" data-field="displayCategory">${displayCategoryOptions}</select><em>对应 Discovery <code>displayCategories[0]</code>；仅影响 Alexa App 的类型、图标和控制页，不自动增删 Capability。</em></label></div><div class="lifecycle-notice"><strong>设备路由与呈现规则</strong><span>首期仅声明一个主显示分类，Adapter 输出 <code>displayCategories: [displayCategory]</code>。连接方式、设备类型和网关关系继承产品与设备主数据；Alexa Profile 不重复配置。App 解绑再绑定生成新 endpointId；虚拟设备与 Group 不暴露给 Alexa。</span></div>` : `<div class="lifecycle-notice"><strong>当前不支持 Alexa</strong><span>开启后保留在基础信息，完成产品级 endpoint 定义后再进入能力与映射；保存后才将产品设为支持 Alexa。</span></div>`}</section>`;
}

function renderDrawerBody(draft) {
  if (state.editor.section === "mapping") return renderMappingSection(draft);
  if (state.editor.section === "reporting") return renderReportingSection(draft);
  if (state.editor.section === "publish") return renderPublishSection(draft);
  const displayCategoryOptions = endpointDisplayCategoryCatalog.filter((item) => item.status === "profile_ready").map((item) => `<option value="${item.id}" ${draft.displayCategory === item.id ? "selected" : ""}>${item.label} · ${item.semantic}</option>`).join("");
  const localeOptions = alexaProfileLocales.map(([locale, label]) => `<label class="locale-choice ${locale === localePolicy.baseLocale ? "is-required" : ""}"><input type="checkbox" data-profile-locale="${locale}" ${draft.targetLocales.includes(locale) ? "checked" : ""} ${locale === localePolicy.baseLocale ? "disabled" : ""}/><span>${escapeHtml(label)}</span><code>${locale}</code></label>`).join("");
  return `<section class="drawer-section"><div class="section-heading"><h3>产品 Alexa 配置 ${anchor(4)}</h3><p>Profile 归属当前产品；选择 Endpoint 显示分类和本次配置覆盖的 Alexa Locale。</p></div><div class="switch-row switch-row--interactive"><button class="switch-control switch-control--button ${state.editor.productAlexaSupported ? "is-on" : ""}" type="button" data-action="toggle-alexa-support" role="switch" aria-checked="${state.editor.productAlexaSupported}" aria-label="Alexa：${state.editor.productAlexaSupported ? "支持" : "不支持"}"></button><span><strong>Alexa：${state.editor.productAlexaSupported ? "支持" : "不支持"}</strong><small>关闭后保留草稿；重新开启后必须重新校验和发布。</small></span></div>${state.editor.productAlexaSupported ? `<div class="form-grid"><label class="form-row"><span>Profile 名称 <b>*</b></span><input class="el-input" data-field="name" value="${escapeHtml(draft.name)}" placeholder="例如 Smart Crib Alexa Profile" /><em>配置版本名称，不作为用户语音名称。</em></label><label class="form-row"><span>关联产品 <b>*</b></span><input class="el-input is-readonly" value="${escapeHtml(draft.productKey)}" readonly /><em>从智能产品入口带入。</em></label><label class="form-row"><span>产品分类</span><input class="el-input is-readonly" value="${escapeHtml(draft.category)}" readonly /></label><label class="form-row"><span>Alexa Endpoint 显示分类 <b>*</b></span><select class="el-select" data-field="displayCategory">${displayCategoryOptions}</select><em>对应 Discovery <code>displayCategories[0]</code>，不自动决定 Capability。</em></label><div class="form-row form-row--wide"><span>Alexa 目标 Locale <b>*</b></span><div class="locale-choice-grid">${localeOptions}</div><em><code>en-US</code> 必选；候选仅来自当前 Alexa Skill 已启用且 Provider Metadata 支持的 Locale。</em></div></div><div class="lifecycle-notice"><strong>一期边界</strong><span>本期只开放 Alexa 配置。Google Home 二期复用同一物模型来源与中立语义，但独立选择 Trait、维护资源并发布。</span></div>` : `<div class="lifecycle-notice"><strong>当前不支持 Alexa</strong><span>开启后完成 Endpoint、目标 Locale 和能力映射。</span></div>`}</section>`;
}

function applyInstanceFieldHints() {
  document.querySelectorAll('[data-capability-field="instance"]').forEach((input) => {
    input.placeholder = "例如 Crib.MotionMode（可自定义）";
    const row = input.closest(".form-row");
    if (!row || row.querySelector(".instance-help")) return;
    const hint = document.createElement("em");
    hint.className = "instance-help";
    hint.textContent = "稳定机器标识，不是语音名称。建议 <对象>.<能力>，如 Crib.MotionMode；限 1-64 位英文字母开头，可含字母、数字、点、下划线和连字符；同一 Endpoint 的 Mode/Range/Toggle 不可重复，发布后变更需新版本。";
    input.insertAdjacentElement("afterend", hint);
  });
}

function projectionOverride(binding, capabilityId) {
  return binding.providerOverrides?.alexa?.[capabilityId] || {};
}

function resolvedModeMappings(binding, property) {
  const override = projectionOverride(binding, "ModeController");
  if (override.modeMappings?.length) return override.modeMappings.map((item) => ({ ...item, alexaValue: item.alexaValue || getResource(item.resourceKey)?.modeValue || "" }));
  return enumEntries(property).map(({ value }) => ({
    modelValue: value,
    alexaValue: ""
  }));
}

function instanceSupportFor(interfaceId) {
  return capabilityCatalog.find((item) => item.id === interfaceId)?.instanceSupport || "none";
}

function semanticForBinding(binding) {
  return semanticCapabilityCatalog.find((item) => item.id === binding.semantic);
}

function capabilityStatusLabel(status) {
  if (status === "profile_ready") return ["可用于产品 Profile", "success"];
  if (status === "adapter_ready") return ["Adapter 已实现 / 待准入", "warning"];
  return ["官方已收录 / Adapter 待实现", "info"];
}

function mappingTemplateLabel(template) {
  return {
    direct_property: "direct - 标准属性转换",
    structured_hsb: "structured_hsb - HSB 结构化转换",
    structured_cct: "structured_cct - 色温结构化转换",
    speaker_volume: "speaker_volume - 连续音量转换",
    playback_operations: "playback_operations - 播放操作转换",
    playback_state: "playback_state - 播放状态转换",
    endpoint_health: "endpoint_health - 在线状态转换"
  }[template] || "pending - 等待通用能力包";
}

function renderFieldTags(tags) {
  return `<div class="field-type-tags">${tags.map(([label, type]) => `<span class="field-type-tag field-type-tag--${type}">${escapeHtml(label)}</span>`).join("")}</div>`;
}

function renderModeMappings(binding, property, capabilityIndex) {
  const mappings = resolvedModeMappings(binding, property);
  const entries = enumEntries(property);
  if (!entries.length) return `<div class="mapping-empty">当前属性未登记枚举值，不能用于 ModeController。</div>`;
  const options = resourcesFor("ModeController", "mode");
  return `<section class="mode-mapping"><div class="mode-mapping__heading"><strong>枚举映射</strong><span>产品选择 Alexa Value；平台按 Capability + Alexa Value 自动关联多语言 Resource KV。</span></div><div class="mode-mapping-table"><div class="mode-mapping-table__head"><span>物模型原始值 / 业务含义</span><span>Alexa Value <b>*</b></span><span>Resource KV</span><span>语音名称预览</span></div>${mappings.map((mapping, mappingIndex) => { const resource = modeResourceFor("ModeController", mapping.alexaValue); const entry = entries.find((item) => item.value === String(mapping.modelValue)); return `<div class="mode-mapping-row"><div><code>${escapeHtml(mapping.modelValue)}</code><small>${escapeHtml(entry?.label || "未定义")}</small></div><select class="el-select" data-capability-index="${capabilityIndex}" data-projection-capability="ModeController" data-mode-mapping-index="${mappingIndex}" data-mode-mapping-field="alexaValue"><option value="">请选择 Alexa Value</option>${options.map((item) => `<option value="${item.modeValue}" ${item.modeValue === mapping.alexaValue ? "selected" : ""}>${item.modeValue} · ${item.values["en-US"] || item.key}</option>`).join("")}</select><code class="mode-value-preview">${escapeHtml(resource?.key || "自动查询")}</code><div class="resource-preview">${resource ? `<strong>${escapeHtml(resource.values["en-US"] || "--")}</strong><span>de-DE: ${escapeHtml(resource.values["de-DE"] || "未配置")}</span>` : `<span>选择后预览 en-US / de-DE</span>`}</div></div>`; }).join("")}</div><p class="mode-mapping__help">IoT 原始 enum 值只传给 IoT 云；Alexa 只接收 Alexa Value。Resource Key 与 Locale 词条由平台维护，产品页面不选 Key、不录入翻译。</p></section>`;
}

function candidateTagType(fit) { return fit === "直接匹配" ? "success" : fit === "平台生成" ? "info" : fit === "需要值对应" || fit === "需要转换" ? "warning" : "danger"; }

function renderProjectionOutput(binding, property, output, bindingIndex) {
  const capabilityMeta = capabilityCatalog.find((item) => item.id === output.capabilityId);
  const override = projectionOverride(binding, output.capabilityId);
  const instanceSupport = instanceSupportFor(output.capabilityId);
  const supportsInstance = instanceSupport !== "none";
  const instanceRequired = instanceSupport === "required";
  const [statusLabel, statusType] = capabilityStatusLabel(capabilityMeta?.status);
  const capabilityResource = capabilityResourceFor(output.capabilityId, override.instance);
  const instanceField = supportsInstance ? `<label class="form-row"><span>Instance ${instanceRequired ? "<b>*</b>" : "<i>（可选）</i>"}</span><input class="el-input" data-capability-index="${bindingIndex}" data-projection-capability="${output.capabilityId}" data-projection-field="instance" value="${escapeHtml(override.instance || "")}" placeholder="例如 Crib.MotionMode" /><em>${instanceRequired ? "Capability Catalog 要求填写。" : "仅当设备存在多个同类语义对象时填写。"}</em></label>` : `<div class="form-row"><span>Instance</span><div class="readonly-field">Catalog 不支持</div></div>`;
  const resourceField = supportsInstance && capabilityMeta?.resourceScopes?.includes("capability") ? `<div class="form-row"><span>能力名称 Resource KV</span><div class="readonly-field">${escapeHtml(override.instance ? capabilityResource?.key || "未找到已发布的平台资源" : "未配置 instance；不解析能力名称资源")}</div>${override.instance && capabilityResource ? renderFieldTags([[`en-US：${capabilityResource.values["en-US"]}`, "success"], [`de-DE：${capabilityResource.values["de-DE"] || "未配置"}`, "info"], [`覆盖：${skillLocales.filter(([locale]) => capabilityResource.values[locale]).length}/${localePolicy.enabledLocaleCount}`, "neutral"]]) : renderFieldTags([[override.instance ? "请先在平台资源库发布对应资源" : "填写 instance 后按 capability + instance 自动解析", "neutral"]])}</div>` : "";
  const modeField = output.capabilityId === "ModeController" ? `<div class="form-row form-row--wide">${renderModeMappings(binding, property, bindingIndex)}</div>` : "";
  const operationsField = output.capabilityId === "PlaybackController" ? `<label class="form-row form-row--wide"><span>Supported operations <b>*</b></span><input class="el-input" data-capability-index="${bindingIndex}" data-projection-capability="PlaybackController" data-projection-field="supportedOperations" value="${escapeHtml(override.supportedOperations || "")}" placeholder="Play, Pause" /><em>首期至少声明 Play 和 Pause。</em></label>` : "";
  return `<article class="projection-output"><header><div><strong>${escapeHtml(output.capabilityId)}</strong><small>Adapter：${escapeHtml(output.adapterTemplate)}</small></div>${tag(statusLabel, statusType)}</header><div class="projection-output-grid"><div class="form-row"><span>接口与指令</span><div class="readonly-field">${escapeHtml(capabilityMeta?.directives?.join(" / ") || "状态报告接口")}</div>${renderFieldTags([[`类型：${capabilityMeta?.type || "--"}`, "info"], [instanceSupport === "required" ? "Instance 必填" : instanceSupport === "optional" ? "Instance 可选" : "不支持 Instance", instanceRequired ? "warning" : "neutral"]])}</div>${instanceField}${resourceField}<div class="form-row"><span>转换模板</span><div class="readonly-field">${mappingTemplateLabel(output.adapterTemplate)}</div><em>产品不配置 Lambda 或协议脚本。</em></div>${modeField}${operationsField}</div></article>`;
}

function renderProjectionResult(binding, property, bindingIndex) {
  const resolution = resolveProviderProjection(binding, "alexa");
  if (!binding.semantic) return `<div class="projection-empty"><strong>等待设备语义</strong><span>人工选择语义后，平台再解析 Alexa 规则。</span></div>`;
  if (resolution.status === "conflict") return `<div class="projection-empty projection-empty--danger"><strong>Catalog 规则冲突</strong><span>${escapeHtml(resolution.rules.map((item) => `${item.ruleId}@${item.version}`).join("、"))}</span></div>`;
  if (!resolution.rule || !resolution.outputs.length) return `<div class="projection-empty projection-empty--danger"><strong>不支持 Alexa 投影</strong><span>可以保存 SemanticProfile 草稿，但 Alexa ProviderProjection 不能发布。</span></div>`;
  const supportType = resolution.status === "ready" ? "success" : resolution.status === "conditional" ? "warning" : "info";
  return `<section class="projection-result-group"><div class="projection-rule-head"><div><strong>${escapeHtml(resolution.rule.ruleId)}@${resolution.rule.version}</strong><span>${escapeHtml(resolution.rule.source)}</span></div>${tag(`${resolution.rule.relation} · ${resolution.status}`, supportType)}</div><div class="projection-rule-meta">${renderFieldTags([[`Catalog：${catalogVersions.projection}`, "neutral"], [`优先级：${resolution.rule.priority}`, "info"], [`输出：${resolution.outputs.length} 项`, resolution.outputs.length > 1 ? "warning" : "success"], [`条件：${Object.entries(resolution.rule.conditions || {}).map(([key, value]) => `${key}=${Array.isArray(value) ? value.join("/") : value}`).join("；") || "无"}`, "neutral"]])}</div>${resolution.outputs.map((output) => renderProjectionOutput(binding, property, output, bindingIndex)).join("")}</section>`;
}

function renderLegacyMappingSection(draft) {
  return `<section class="drawer-section"><div class="section-heading section-heading--row"><div><h3>能力与物模型映射 ${anchor(5)}</h3><p>属性类型只产生候选语义；产品人员确认语义后，平台按版本化 Projection Rule 生成 Alexa 投影结果组。</p></div><button class="el-btn" data-action="add-capability">+ 添加能力</button></div><div class="projection-chain"><span>物模型属性 / 命令</span><b>-></b><span>类型兼容候选</span><b>-></b><span>人工确认设备语义</span><b>-></b><span>0..N Alexa Capability</span><b>-></b><span>Enum Mapping / Alexa Value / Resource KV</span></div><div class="catalog-version-strip"><span>Semantic Catalog <strong>${catalogVersions.semantic}</strong></span><span>Projection Rule Catalog <strong>${catalogVersions.projection}</strong></span><span>Provider Metadata <strong>${catalogVersions.provider}</strong></span></div><div class="mapping-list">${draft.capabilities.map((binding, index) => {
    const propertyMeta = modelPropertyCatalog.find((item) => item.id === binding.property);
    const candidates = semanticCandidatesForSource(propertyMeta);
    const semanticMeta = semanticForBinding(binding);
    const selectedCandidate = candidates.find((item) => item.semantic.id === binding.semantic);
    const resolution = resolveProviderProjection(binding, "alexa");
    const propertyOption = (item) => item.sourceKind === "command" ? `${item.id} · ${item.label} · command` : `${item.id} · ${item.label} · ${item.type}${item.unit !== "-" ? ` / ${item.unit}` : ""}${Number.isFinite(item.min) && Number.isFinite(item.max) ? ` / ${item.min}-${item.max}` : ""}`;
    const propertyTags = propertyMeta ? [[propertyMeta.sourceKind === "command" ? "来源：command" : `属性类型：${propertyMeta.type}`, "success"], [propertyMeta.enumValues?.length ? `枚举值：${propertyMeta.enumValues.length} 项` : propertyMeta.valueShape ? `值结构：${propertyMeta.valueShape}` : Number.isFinite(propertyMeta.min) ? `范围：${propertyMeta.min}-${propertyMeta.max}` : "值定义：未声明范围", propertyMeta.enumValues?.length ? "warning" : "neutral"], [propertyMeta.sourceKind === "command" ? `操作：${propertyMeta.operations.join("/")}` : propertyMeta.writable ? "可读写" : "只读", propertyMeta.sourceKind === "command" || propertyMeta.writable ? "success" : "info"], [`候选语义：${candidates.length} 项`, "info"]] : [["请先选择物模型属性或命令", "neutral"]];
    const resultCount = resolution.outputs?.length || 0;
    return `<article class="mapping-item"><header><strong>${escapeHtml(semanticMeta?.label || "待选择设备语义")} ${index === 0 ? anchor(5) : ""}</strong><span>${resultCount ? tag(`${resultCount} 个 Alexa 输出`, resolution.status === "ready" ? "success" : "warning") : tag("待投影", "info")}</span><button class="op-link danger" data-action="remove-capability" data-index="${index}">移除</button></header><div class="mapping-grid"><label class="form-row"><span>Momcozy 物模型属性 / 命令 <b>*</b></span><select class="el-select" data-capability-index="${index}" data-capability-field="property"><option value="">请选择已注册属性或命令</option>${modelPropertyCatalog.map((item) => `<option value="${item.id}" ${binding.property === item.id ? "selected" : ""}>${propertyOption(item)}</option>`).join("")}</select>${renderFieldTags(propertyTags)}<em>候选算法不读取属性 ID 或名称。</em></label><label class="form-row"><span>设备语义 <b>*</b></span><select class="el-select" data-capability-index="${index}" data-capability-field="semantic" ${!propertyMeta || !candidates.length ? "disabled" : ""}><option value="">请选择中立设备语义</option>${candidates.map((item) => `<option value="${item.semantic.id}" ${semanticMeta?.id === item.semantic.id ? "selected" : ""}>[${item.fit}] ${item.semantic.label} · ${item.semantic.id}</option>`).join("")}</select>${renderFieldTags([[`语义 ID：${semanticMeta?.id || "--"}`, semanticMeta ? "success" : "neutral"], [`类型匹配：${selectedCandidate?.fit || "--"}`, candidateTagType(selectedCandidate?.fit)], [`输入槽位：${binding.semanticSlot || "--"}`, "info"]])}<em>${escapeHtml(selectedCandidate?.notes?.length ? selectedCandidate.notes.join("；") : "类型负责筛选；单位、范围、读写和值结构只做排序和提示，最终由人确认。")}</em></label><div class="form-row form-row--wide"><div class="projection-group-label"><span>Alexa 投影结果组 <b>*</b> ${index === 0 ? anchor(6) : ""}</span><em>产品侧不可直接选择 Capability；规则冲突由平台维护者处理。</em></div>${renderProjectionResult(binding, propertyMeta, index)}</div></div></article>`;
  }).join("")}</div></section>`;
}

function sourceOption(item) {
  if (item.sourceKind === "command") return `${item.label} · ${item.id} · command · ${item.operations.join("/")}`;
  let definition = {}; try { definition = JSON.parse(item.dataJson || "{}"); } catch { definition = {}; }
  const detail = item.enumValues?.length ? `${item.enumValues.length} 个枚举值` : Number.isFinite(definition.min) ? `${definition.min}-${definition.max} / step ${definition.step}${definition.unit || ""}` : item.valueShape || "未声明数据定义";
  return `${item.label} · ${item.id} · ${item.type} · ${item.readable ? "可读" : ""}${item.writable ? "可写" : ""} · ${detail}`;
}

function renderVoiceLabelSet(set, label, bindingIndex, scope, sourceValue, locales) {
  if (!set) return "";
  return `<div class="voice-label-set"><div class="voice-label-set__title"><strong>${escapeHtml(label)}</strong><span>每个 Locale 1 个主名称，最多 2 个别名</span></div>${locales.map((locale) => { const entry = set.locales?.[locale] || { primary: "", aliases: [] }; return `<div class="voice-locale-row"><div class="voice-locale-code"><code>${locale}</code><span>${locale === localePolicy.baseLocale ? "必填基线" : "目标语言"}</span></div><label><span>主名称 *</span><input class="el-input" data-voice-index="${bindingIndex}" data-voice-scope="${scope}" data-voice-value="${escapeHtml(sourceValue || "")}" data-voice-locale="${locale}" data-voice-field="primary" value="${escapeHtml(entry.primary || "")}" placeholder="例如 motion mode" /></label><label><span>别名 1</span><input class="el-input" data-voice-index="${bindingIndex}" data-voice-scope="${scope}" data-voice-value="${escapeHtml(sourceValue || "")}" data-voice-locale="${locale}" data-voice-field="alias" data-alias-index="0" value="${escapeHtml(entry.aliases?.[0] || "")}" /></label><label><span>别名 2</span><input class="el-input" data-voice-index="${bindingIndex}" data-voice-scope="${scope}" data-voice-value="${escapeHtml(sourceValue || "")}" data-voice-locale="${locale}" data-voice-field="alias" data-alias-index="1" value="${escapeHtml(entry.aliases?.[1] || "")}" /></label></div>`; }).join("")}</div>`;
}

function renderCapabilityChoices(binding, source, draft, index) {
  if (!source) return `<div class="mapping-empty">先选择物模型属性或命令，平台才会按类型给出 Capability 候选。</div>`;
  const candidates = capabilityCandidatesForSource(source, draft.targetLocales);
  if (!candidates.length) return `<div class="mapping-empty mapping-empty--danger">当前来源没有可用的 Alexa Capability 候选。可以保存草稿，但不能发布。</div>`;
  const card = (candidate) => { const ruleRef = `${candidate.rule.ruleId}@${candidate.rule.version}`; const ids = candidate.outputs.map((output) => output.capabilityId); const title = candidate.outputs.map((output) => output.metadata?.label || output.capabilityId).join(" + "); const status = candidate.status || candidate.valueMapping?.label || "直接匹配"; const statusType = candidate.selectable ? candidateTagType(status) : "danger"; const detail = candidate.selectable ? `${candidate.compatibility?.detail || "无需改变来源数值"}` : candidate.reasons.join("；"); return `<label class="capability-choice ${binding.ruleRef === ruleRef ? "is-selected" : ""} ${candidate.selectable ? "" : "is-disabled"}"><input type="radio" name="capability-${index}" data-mapping-index="${index}" data-mapping-field="ruleRef" value="${ruleRef}" ${binding.ruleRef === ruleRef ? "checked" : ""} ${candidate.selectable ? "" : "disabled"}/><span class="capability-choice__mark"></span><span><strong>${escapeHtml(title)}</strong><code>${escapeHtml(ids.join(" + "))}</code><small>${escapeHtml(detail)}</small></span>${tag(status, statusType)}</label>`; };
  const recommended = candidates.filter((candidate) => candidate.tier === "direct");
  const other = candidates.filter((candidate) => candidate.tier !== "direct");
  if (!recommended.length) return `<div class="capability-choice-list">${other.map(card).join("")}</div>`;
  return `<div class="capability-choice-list">${recommended.map(card).join("")}</div>${other.length ? `<details class="capability-more"><summary>查看其他候选（${other.length}）</summary><p>这些项需要值对应、缺少来源契约，或无法完整表达当前值域。</p><div class="capability-choice-list">${other.map(card).join("")}</div></details>` : ""}`;
}

function renderValueMapping(binding, source, candidate, index) {
  const config = candidate?.valueMapping;
  if (!config) return "";
  if (config.mode === "generated") return `<div class="value-mapping-notice is-generated"><strong>模式值由平台自动生成</strong><span>每个物模型枚举值会生成稳定的 Alexa Mode Value；下一步只需维护多语言模式名称。</span></div>`;
  if (config.mode === "direct" && config.allowedValues?.length) return `<div class="value-mapping-notice"><strong>值域天然一致</strong><span>平台已按同名值建立完整一一对应，无需额外配置。</span></div>`;
  if (config.mode !== "required") return "";
  const bindings = valueBindingsFor(binding, source, candidate);
  return `<section class="value-mapping"><header><div><strong>值对应 <b>*</b></strong><span>每个物模型值必须选择唯一的 Alexa 目标值；不允许忽略或复用。</span></div><em>${bindings.filter((item) => item.semanticValue).length}/${bindings.length} 已对应</em></header><div class="value-mapping__table"><div class="value-mapping__head"><span>物模型原始值</span><span>业务含义</span><span>Alexa 目标值</span></div>${bindings.map((item) => { const entry = enumEntries(source).find((value) => value.value === item.sourceValue); return `<div class="value-mapping__row"><code>${escapeHtml(item.sourceValue)}</code><span>${escapeHtml(entry?.label || item.sourceValue)}</span><select class="el-select" data-value-binding-index="${index}" data-source-value="${escapeHtml(item.sourceValue)}"><option value="">请选择 Alexa 目标值</option>${config.allowedValues.map((targetValue) => { const occupied = bindings.some((other) => other.sourceValue !== item.sourceValue && other.semanticValue === targetValue); return `<option value="${escapeHtml(targetValue)}" ${item.semanticValue === targetValue ? "selected" : ""} ${occupied ? "disabled" : ""}>${escapeHtml(targetValue)}${occupied ? "（已使用）" : ""}</option>`; }).join("")}</select></div>`; }).join("")}</div><p>本页保存的是物模型值到中立语义值的对应；Alexa Projection 将其解析为固定协议值。</p></section>`;
}

function renderMappingEditor(binding, index, draft) {
  const source = modelPropertyCatalog.find((item) => item.id === binding.property);
  const candidate = selectedCapabilityCandidate(binding, draft);
  const issues = mappingIssues(binding, draft);
  const examples = utteranceExamplesForBinding(binding, draft);
  const modeNames = candidate?.outputs.some((output) => output.capabilityId === "ModeController") ? enumEntries(source).map((entry) => renderVoiceLabelSet(binding.voice?.values?.[entry.value], `${entry.label} (${entry.value})`, index, "value", entry.value, draft.targetLocales)).join("") : "";
  const technicalOpen = state.editor.technicalDetails[index];
  const outputIds = candidate?.outputs.map((output) => output.capabilityId) || [];
  const noUtterance = candidate && !candidate.outputs.some((output) => output.metadata?.utteranceTemplates?.[localePolicy.baseLocale]?.length);
  const contract = candidate?.sourceContract?.numeric;
  const sourceRange = contract ? `${contract.min}–${contract.max} / step ${contract.step}${contract.unit ? ` / ${contract.unit}` : ""}` : "不适用";
  return `<div class="mapping-editor"><section class="mapping-step"><div class="mapping-step__number">1</div><div><h4>选择物模型属性或命令</h4><select class="el-select" data-mapping-index="${index}" data-mapping-field="property"><option value="">请选择来源</option>${modelPropertyCatalog.map((item) => `<option value="${item.id}" ${binding.property === item.id ? "selected" : ""}>${escapeHtml(sourceOption(item))}</option>`).join("")}</select>${source ? renderFieldTags([[source.sourceKind === "command" ? "command" : source.type, "success"], [source.sourceKind === "command" ? source.operations.join(" / ") : source.writable ? "可读写" : "只读", "info"], [source.enumValues?.length ? `${source.enumValues.length} 个枚举值` : source.valueShape || sourceRange, "neutral"]]) : ""}<p>候选仅比较来源数据契约和 Alexa 协议契约；属性 ID、名称、描述不参与。</p></div></section><section class="mapping-step"><div class="mapping-step__number">2</div><div><h4>选择 Alexa Capability</h4><p>“直接匹配”均为同级候选，按 Catalog 固定顺序展示；平台不猜测业务语义。</p>${renderCapabilityChoices(binding, source, draft, index)}${renderValueMapping(binding, source, candidate, index)}</div></section>${candidate ? `<section class="mapping-step"><div class="mapping-step__number">3</div><div><h4>维护多语言语音名称</h4>${binding.voice?.control ? renderVoiceLabelSet(binding.voice.control, "控制名称", index, "control", "", draft.targetLocales) : `<div class="standard-name-notice">${escapeHtml(outputIds.join(" + "))} 使用 Alexa 设备名称，无需额外填写控制名称。</div>`}${modeNames}</div></section><section class="mapping-step"><div class="mapping-step__number">4</div><div><h4>英语语句示例</h4>${noUtterance ? `<div class="standard-name-notice"><strong>无独立语音控制示例</strong><span>该 Capability 用于状态上报或响应其他控制结果，不声明独立语音指令。</span></div>` : examples.length ? `<div class="utterance-preview">${examples.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div>` : `<div class="utterance-missing"><strong>输入尚未完整</strong><ul>${issues.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`}<p>语句基于 Alexa 官方预置模型生成，实际识别结果以 Alexa 测试和认证为准。设备名固定显示为 <code>{device name}</code>，不写入发布配置。</p></div></section><div class="technical-disclosure"><button type="button" data-action="toggle-technical" data-index="${index}">${technicalOpen ? "收起" : "展开"}技术详情</button>${technicalOpen ? `<dl><div><dt>内部设备语义</dt><dd><code>${escapeHtml(binding.semantic)}</code></dd></div><div><dt>规则版本</dt><dd><code>${escapeHtml(binding.ruleRef)}</code></dd></div><div><dt>来源契约</dt><dd><code>${escapeHtml(sourceRange)}</code></dd></div><div><dt>Alexa Discovery 预览</dt><dd>${escapeHtml(candidate.compatibility?.detail || "不适用")}</dd></div><div><dt>数值转换</dt><dd>无（单位仅编码，不改变数值）</dd></div><div><dt>生成 Capability</dt><dd>${escapeHtml(outputIds.join(" + "))}</dd></div><div><dt>稳定 instance</dt><dd><code>${outputIds.some((id) => capabilityCatalog.find((item) => item.id === id)?.instanceSupport !== "none") ? escapeHtml(stableInstanceFor(binding)) : "不适用"}</code></dd></div><div><dt>资源引用</dt><dd>${generatedResourceRefs(binding).map((ref) => `<code>${escapeHtml(ref)}</code>`).join(" ") || "不适用"}</dd></div></dl>` : ""}</div>` : ""}</div>`;
}

function renderMappingSection(draft) {
  return `<section class="drawer-section"><div class="section-heading section-heading--row"><div><h3>能力与映射 ${anchor(5)}</h3><p>按“来源 → Alexa Capability → 多语言名称 → 英语示例”完成配置；一次只展开一项。</p></div><button class="el-btn" data-action="add-capability">+ 添加映射</button></div><div class="simple-flow"><span>物模型属性 / 命令</span><b>→</b><span>Alexa Capability</span><b>→</b><span>多语言语音名称</span><b>→</b><span>英语语句示例</span></div><div class="compact-mapping-list">${draft.capabilities.map((binding, index) => { const source = modelPropertyCatalog.find((item) => item.id === binding.property); const candidate = selectedCapabilityCandidate(binding, draft); const completion = localeCompletion(binding, draft); const issues = mappingIssues(binding, draft); const outputs = candidate?.outputs || []; const controlName = binding.voice?.control?.locales?.[localePolicy.baseLocale]?.primary || (candidate ? "使用设备名称" : "--"); const expanded = state.editor.expandedMapping === index; return `<article class="compact-mapping ${expanded ? "is-expanded" : ""}" data-mapping-id="${escapeHtml(binding.mappingId || binding.bindingId || String(index))}"><div class="compact-mapping__summary"><button class="mapping-expand" data-action="expand-mapping" data-index="${index}" aria-label="${expanded ? "收起" : "编辑"}映射">${expanded ? "−" : "+"}</button><div><span>物模型属性</span><strong>${escapeHtml(source?.label || "待选择")}</strong><code>${escapeHtml(source?.id || "--")}</code></div><div><span>Alexa Capability</span><strong>${escapeHtml(outputs.map((item) => item.metadata?.label || item.capabilityId).join(" + ") || "待选择")}</strong><code>${escapeHtml(outputs.map((item) => item.capabilityId).join(" + ") || "--")}</code></div><div><span>控制名称</span><strong>${escapeHtml(controlName)}</strong></div><div><span>Locale 完成度</span><strong>${completion.complete}/${completion.total}</strong></div><div class="mapping-status">${tag(issues.length ? "未完成" : "可校验", issues.length ? "warning" : "success")}</div><div class="mapping-actions"><button class="op-link" data-action="expand-mapping" data-index="${index}">编辑</button><button class="op-link danger" data-action="remove-capability" data-index="${index}">移除</button></div></div>${expanded ? renderMappingEditor(binding, index, draft) : ""}</article>`; }).join("") || `<div class="mapping-empty">尚未添加能力映射。</div>`}</div></section>`;
}

function renderReportingSection(draft) {
  return `<section class="drawer-section"><div class="section-heading"><h3>状态报告 ${anchor(7)}</h3><p>首期统一由 Adapter 支持 Alexa 主动状态查询；最终状态不能由“云已受理”替代。</p></div><div class="reporting-card"><label class="form-row"><span>状态数据源</span><select class="el-select" data-reporting="source"><option value="device_reported" ${draft.reporting.source === "device_reported" ? "selected" : ""}>device_reported（设备上报）</option><option value="cloud_derived" ${draft.reporting.source === "cloud_derived" ? "selected" : ""}>cloud_derived（云端派生）</option></select><em>仅允许平台登记的状态源；不允许配置外部请求。</em></label><label class="switch-row"><input type="checkbox" data-reporting="stateReport" ${draft.reporting.stateReport ? "checked" : ""}/><span class="switch-control"></span><span><strong>StateReport</strong><small>Alexa 查询状态时从物模型读取并转换。</small></span></label><label class="switch-row switch-row--disabled"><input type="checkbox" disabled/><span class="switch-control"></span><span><strong>ChangeReport（首期预留）</strong><small>schema 保留；首期不可启用，平台不向 Alexa 主动发送。</small></span></label><label class="switch-row"><input type="checkbox" data-reporting="endpointHealth" ${draft.reporting.endpointHealth ? "checked" : ""}/><span class="switch-control"></span><span><strong>EndpointHealth</strong><small>设备可达性为发布必需项。</small></span></label></div></section>`;
}

function renderPublishSection(draft) {
  const validation = state.editor.validation;
  const result = !validation || validation.status === "idle"
    ? `<div class="validation-placeholder"><strong>尚未运行校验</strong><p>检查来源、Alexa Capability、多语言主名称、别名重复、稳定机器标识与状态报告。</p></div>`
    : validation.status === "stale"
      ? `<div class="validation-placeholder is-stale"><strong>校验结果已失效</strong><p>草稿已变更，请重新运行完整校验。旧问题清单不会作为当前发布依据。</p></div>`
      : renderValidation(validation);
  return `<section class="drawer-section"><div class="section-heading"><h3>校验与发布 ${anchor(3)}</h3><p>在这里确认完整问题清单、发布门禁和发布操作；其他步骤只展示就地摘要。</p></div><div class="release-grid"><div class="release-readonly"><span>本期 Provider</span><strong>Alexa</strong><em>一期只实例化 Alexa ProviderMapping。</em></div><div class="release-readonly"><span>发布门禁</span><strong>Locale 与映射完整</strong><em>所有目标 Locale 主名称、Capability 和状态报告通过后才可发布。</em></div></div>${result}</section>`;
}

function renderValidation(validation) {
  const grouped = sections.filter(([section]) => section !== "publish").map(([section]) => [section, issuesForSection(validation, section)]).filter(([, issues]) => issues.length);
  const errors = (validation.issues || []).filter((issue) => issue.severity === "error");
  const warnings = (validation.issues || []).filter((issue) => issue.severity === "warning");
  const headline = validation.status === "passed" ? "校验通过，可以发布" : `校验未通过：${errors.length} 个阻断项${warnings.length ? `，${warnings.length} 个提醒` : ""}`;
  return `<div class="validation-result ${validation.status === "passed" ? "is-passed" : "is-failed"}"><div class="validation-result__head"><div><strong>${headline}</strong><small>最近校验：${escapeHtml(validation.checkedAt || "--")}</small></div>${tag(validation.status === "passed" ? "可发布" : "需处理", validation.status === "passed" ? "success" : "danger")}</div>${validation.status === "passed" && !warnings.length ? `<p>Alexa Capability、多语言语音名称、稳定映射标识与状态报告均满足配置发布要求。</p>` : ""}<div class="validation-groups">${grouped.map(([section, issues]) => `<section class="validation-group"><header><strong>${sectionLabels[section]}</strong><span>${issues.filter((issue) => issue.severity === "error").length} 个阻断项${issues.filter((issue) => issue.severity === "warning").length ? ` · ${issues.filter((issue) => issue.severity === "warning").length} 个提醒` : ""}</span></header>${issues.map((issue) => validationIssueAction(issue, "定位")).join("")}</section>`).join("")}</div></div>`;
}

function renderAnnotations() {
  const scope = state.editor.open ? annotations.drawer[state.editor.section] : annotations[state.page];
  $("#annotationContext").textContent = scope.context;
  $("#annotationSummary").textContent = scope.summary;
  $("#annotationCount").textContent = String(scope.items.length);
  $("#annotationList").innerHTML = scope.items.map((item) => `<article class="annotation-card" data-note-anchor="${item.n}"><header><span class="annotation-number">${item.n}</span><div><h3>${item.title}</h3><p>${item.location}</p></div></header><dl>${item.fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl></article>`).join("");
}

function renderModal() {
  const mount = $("#modalMount");
  if (state.modal.type === "reset-mapping") {
    mount.innerHTML = `<div class="modal-host"><div class="modal-mask" data-action="close-modal"></div><section class="confirm-modal" role="dialog" aria-modal="true" aria-label="确认重置映射"><header><h2>确认更换映射条件</h2><button class="el-drawer__close" data-action="close-modal">x</button></header><div class="modal-body"><p>更换物模型来源或 Alexa Capability 后，原有控制名称、枚举值名称和平台生成的投影结果将被清空。</p><div class="modal-alert">该操作只影响当前映射项，其他映射保持不变。</div></div><footer><button class="el-btn" data-action="close-modal">取消</button><button class="el-btn el-btn--danger" data-action="confirm-mapping-reset">确认更换</button></footer></section></div>`;
    return;
  }
  if (state.modal.type === "delist") {
    const profile = getProfile(state.modal.profileId);
    mount.innerHTML = `<div class="modal-host"><div class="modal-mask" data-action="close-modal"></div><section class="confirm-modal" role="dialog" aria-modal="true" aria-label="确认下架 Profile"><header><h2>确认下架 Profile</h2><button class="el-drawer__close" data-action="close-modal">x</button></header><div class="modal-body"><p>下架 <strong>${escapeHtml(profile?.name || "")}</strong> 后，已绑定该 Profile 的 Alexa 用户将失去对该设备的语音控制；未绑定用户不再发现该设备。</p><div class="modal-alert">此操作影响已绑定用户的授权关系，请确认影响范围后再执行。</div></div><footer><button class="el-btn" data-action="close-modal">取消</button><button class="el-btn el-btn--danger" data-action="delist-confirm" data-profile-id="${profile?.id || ""}">确认下架</button></footer></section></div>`;
    return;
  }
  if (state.modal.type !== "rollback") { mount.innerHTML = ""; return; }
  const profile = getProfile(state.modal.profileId);
  mount.innerHTML = `<div class="modal-host"><div class="modal-mask" data-action="close-modal"></div><section class="confirm-modal" role="dialog" aria-modal="true" aria-label="确认回滚"><header><h2>确认回滚 Profile</h2><button class="el-drawer__close" data-action="close-modal">x</button></header><div class="modal-body"><p>将 <strong>${escapeHtml(profile?.name || "")}</strong> 恢复到当前环境的上一个已发布版本。Alexa 发现配置将在下一次发布同步中恢复。</p><div class="modal-alert">此操作不会删除 Profile 或物模型映射。</div></div><footer><button class="el-btn" data-action="close-modal">取消</button><button class="el-btn el-btn--danger" data-action="rollback-confirm" data-profile-id="${profile?.id || ""}">确认回滚</button></footer></section></div>`;
}

function renderToast() {
  const mount = $("#toastRegion");
  if (!state.toast) { mount.innerHTML = ""; return; }
  mount.innerHTML = `<div class="toast toast--${state.toast.type}"><span>${state.toast.type === "success" ? "OK" : "i"}</span>${escapeHtml(state.toast.message)}</div>`;
  const toastId = state.toast.id;
  window.setTimeout(() => {
    if (state.toast?.id === toastId) {
      state.toast = null;
      render();
    }
  }, 2400);
}

function refreshNav() {
  const activePage = state.page === "product-detail" ? "products" : state.page;
  document.querySelectorAll("[data-action='nav']").forEach((button) => button.classList.toggle("is-active", button.dataset.page === activePage));
}

function refreshMobileTabs() {
  document.querySelectorAll("[data-mobile-view-target]").forEach((button) => {
    const active = button.dataset.mobileViewTarget === state.mobileView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function applyHighlight() {
  if (!state.highlightedAnchor) return;
  const element = document.querySelector(`[data-anchor="${state.highlightedAnchor}"]`);
  if (!element) return;
  element.classList.add("is-highlighted");
  window.setTimeout(() => element.classList.remove("is-highlighted"), 1300);
}

function applyValidationIssueFocus() {
  const issueId = state.editor?.focusValidationIssueId;
  if (!issueId) return;
  const issue = state.editor.validation?.issues?.find((item) => item.id === issueId);
  if (!issue) return;
  let target = null;
  if (issue.section === "basic") {
    if (issue.field === "productAlexaSupported") target = document.querySelector('[data-action="toggle-alexa-support"]');
    else if (issue.field === "targetLocales") target = document.querySelector('[data-profile-locale="en-US"]');
    else if (issue.field) target = document.querySelector(`[data-field="${issue.field}"]`);
  } else if (issue.section === "reporting") {
    target = document.querySelector(`[data-reporting="${issue.field}"]`);
  } else if (issue.section === "mapping") {
    const card = [...document.querySelectorAll("[data-mapping-id]")].find((element) => element.dataset.mappingId === issue.mappingId);
    const mappingIndex = state.editor.draft.capabilities.findIndex((item) => (item.mappingId || item.bindingId) === issue.mappingId);
    if (card && mappingIndex >= 0 && issue.locale) {
      const voiceField = issue.field === "voice-alias" ? "alias" : "primary";
      target = card.querySelector(`[data-voice-index="${mappingIndex}"][data-voice-locale="${issue.locale}"][data-voice-field="${voiceField}"]`);
    }
    target ||= card;
  }
  if (!target) return;
  const highlight = target.closest(".compact-mapping") || target.closest(".form-row") || target;
  highlight.classList.add("is-validation-focused");
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  if (typeof target.focus === "function") target.focus({ preventScroll: true });
  window.setTimeout(() => highlight.classList.remove("is-validation-focused"), 1600);
}

function handleAction(event) {
  const anchorTarget = event.target.closest("[data-anchor]");
  if (anchorTarget) {
    event.preventDefault();
    setHighlightedAnchor(anchorTarget.dataset.anchor);
    return;
  }
  const note = event.target.closest("[data-note-anchor]");
  if (note) {
    setHighlightedAnchor(note.dataset.noteAnchor);
    return;
  }
  const trigger = event.target.closest("[data-action]");
  if (!trigger || trigger.disabled) return;
  const { action, profileId, section, index, toast, toastType } = trigger.dataset;
  if (action === "nav") setPage(trigger.dataset.page);
  if (action === "new-profile") openEditor();
  if (action === "view-product") openProductDetail(trigger.dataset.productId);
  if (action === "open-product-profile") openProductProfile(trigger.dataset.productId);
  if (action === "toggle-alexa-support") {
    const enabling = !state.editor.productAlexaSupported;
    updateProductAlexaSupport(enabling);
  }
  if (action === "edit-profile") openEditor(profileId);
  if (action === "validate-profile") { openEditor(profileId, "publish"); window.setTimeout(() => { runValidation(); }, 0); }
  if (action === "close-editor") closeEditor();
  if (action === "drawer-section") setEditorSection(section);
  if (action === "add-capability") addCapability();
  if (action === "remove-capability") removeCapability(Number(index));
  if (action === "expand-mapping") setExpandedMapping(Number(index));
  if (action === "toggle-technical") toggleTechnicalDetails(Number(index));
  if (action === "confirm-mapping-reset") confirmMappingChange();
  if (action === "run-validation") runValidation();
  if (action === "locate-validation-issue") locateValidationIssue(trigger.dataset.validationIssueId);
  if (action === "locate-first-validation-issue") {
    const issues = state.editor.validation?.issues || [];
    const issue = issues.find((item) => item.severity === "error") || issues[0];
    if (issue) locateValidationIssue(issue.id);
  }
  if (action === "save-draft") { saveDraft(); setToast("Profile 草稿已保存", "success"); }
  if (action === "publish") { if (publishDraft()) { setToast("Alexa 配置版本已发布；不代表功能已经上线", "success"); closeEditor(); } else setToast("发布前必须先通过校验", "danger"); }
  if (action === "rollback-open") showModal("rollback", profileId);
  if (action === "delist-open") showModal("delist", profileId);
  if (action === "delist-confirm") { closeModal(); setToast("Profile 已下架，已绑定用户将失去 Alexa 语音控制", "danger"); }
  if (action === "close-modal") closeModal();
  if (action === "rollback-confirm") { rollbackProfile(profileId); closeModal(); setToast("Profile 已回滚至上一版本", "success"); }
  if (action === "reset-filters") { state.filters.keyword = ""; state.filters.status = "all"; render(); }
  if (action === "resource-query") setToast(`已查询 ${filteredResources().length} 条 VoiceLabelSet`, "success");
  if (action === "reset-resource-filters") resetResourceFilters();
  if (action === "resource-import") setToast("导入仅更新已有 VoiceLabelSet 的主名称与别名，不会创建孤立资源。", "info");
  if (action === "resource-export") setToast("已按当前筛选条件生成 VoiceLabelSet 导出任务。", "success");
  if (action === "edit-resource") openResourceEditor(trigger.dataset.resourceKey);
  if (action === "close-resource-editor") closeResourceEditor();
  if (action === "validate-resource") { const validation = validateResourceDraft(); setToast(validation.passed ? "资源校验通过，可以发布" : "资源校验未通过，请处理必填项", validation.passed ? "success" : "danger"); }
  if (action === "save-resource") { if (saveResourceDraft(false)) setToast("VoiceLabelSet 草稿已回写产品映射", "success"); else setToast("未找到对应的产品映射", "danger"); }
  if (action === "publish-resource") { if (saveResourceDraft(true)) setToast("VoiceLabelSet 已发布并回写产品映射", "success"); else setToast("发布前请处理目标 Locale 校验项", "danger"); }
  if (action === "show-toast") setToast(toast, toastType || "info");
}

function handleInput(event) {
  const target = event.target;
  if (target.dataset.filter) {
    const caret = target.selectionStart;
    setFilter(target.dataset.filter, target.value);
    if (target.dataset.filter === "keyword") {
      window.requestAnimationFrame(() => {
        const next = document.querySelector('[data-filter="keyword"]');
        if (next) { next.focus(); next.setSelectionRange(caret, caret); }
      });
    }
    return;
  }
  if (target.dataset.resourceFilter) {
    const caret = target.selectionStart;
    setResourceFilter(target.dataset.resourceFilter, target.value);
    if (target.dataset.resourceFilter === "keyword") {
      window.requestAnimationFrame(() => {
        const next = document.querySelector('[data-resource-filter="keyword"]');
        if (next) { next.focus(); next.setSelectionRange(caret, caret); }
      });
    }
    return;
  }
  if (target.dataset.resourceField && state.resourceEditor.open) {
    updateResourceDraft(target.dataset.resourceField, target.value);
    return;
  }
  if (target.dataset.productAlexaSupport) {
    updateProductAlexaSupport(target.checked);
    return;
  }
  if (target.dataset.profileLocale && state.editor.open) {
    setProfileLocale(target.dataset.profileLocale, target.checked);
    return;
  }
  if (target.dataset.mappingIndex !== undefined && target.dataset.mappingField && state.editor.open) {
    requestMappingChange(Number(target.dataset.mappingIndex), target.dataset.mappingField, target.value);
    return;
  }
  if (target.dataset.valueBindingIndex !== undefined && state.editor.open) {
    updateValueBinding(Number(target.dataset.valueBindingIndex), target.dataset.sourceValue, target.value);
    if (event.type === "change") render({ preserveDrawerScroll: true });
    return;
  }
  if (target.dataset.voiceIndex !== undefined && state.editor.open) {
    updateVoiceLabel(Number(target.dataset.voiceIndex), target.dataset.voiceScope, target.dataset.voiceValue, target.dataset.voiceLocale, target.dataset.voiceField, target.dataset.aliasIndex, target.value);
    if (event.type === "change") render({ preserveDrawerScroll: true });
    return;
  }
  if (target.dataset.modeMappingIndex !== undefined && state.editor.open) {
    const index = Number(target.dataset.capabilityIndex);
    const binding = state.editor.draft.capabilities[index];
    const property = modelPropertyCatalog.find((item) => item.id === binding?.property);
    const mappings = resolvedModeMappings(binding, property).map((item) => ({ ...item }));
    mappings[Number(target.dataset.modeMappingIndex)][target.dataset.modeMappingField] = target.value;
    updateProjectionOverride(index, "alexa", target.dataset.projectionCapability || "ModeController", "modeMappings", mappings);
    invalidateValidation();
    if (event.type === "change") render({ preserveDrawerScroll: true });
    return;
  }
  if (target.dataset.projectionField && state.editor.open) {
    updateProjectionOverride(Number(target.dataset.capabilityIndex), "alexa", target.dataset.projectionCapability, target.dataset.projectionField, target.value);
    invalidateValidation();
    if (event.type === "change") render({ preserveDrawerScroll: true });
    return;
  }
  if (target.dataset.field && state.editor.open) {
    updateDraft(target.dataset.field, target.value);
    if (event.type === "change") render({ preserveDrawerScroll: true });
  }
  if (target.dataset.capabilityIndex !== undefined && state.editor.open) {
    const index = Number(target.dataset.capabilityIndex);
    const field = target.dataset.capabilityField;
    updateCapability(index, field, target.value);
    if (field === "property") {
      updateCapability(index, "semantic", "");
      updateCapability(index, "semanticSlot", "");
      updateCapability(index, "providerOverrides", { alexa: {} });
      invalidateValidation();
      render({ preserveDrawerScroll: true });
      return;
    }
    if (field === "semantic") {
      const binding = state.editor.draft.capabilities[index];
      const property = modelPropertyCatalog.find((item) => item.id === binding.property);
      const candidate = semanticCandidatesForSource(property).find((item) => item.semantic.id === target.value);
      updateCapability(index, "semanticSlot", candidate?.slotId || "");
      updateCapability(index, "providerOverrides", { alexa: {} });
      const resolution = resolveProviderProjection(binding, "alexa");
      resolution.outputs?.forEach((output) => {
        updateProjectionOverride(index, "alexa", output.capabilityId, "instance", "");
        if (output.capabilityId === "ModeController") updateProjectionOverride(index, "alexa", output.capabilityId, "modeMappings", resolvedModeMappings(binding, property));
        if (output.capabilityId === "PlaybackController") updateProjectionOverride(index, "alexa", output.capabilityId, "supportedOperations", "Play, Pause");
      });
      invalidateValidation();
      render({ preserveDrawerScroll: true });
      return;
    }
  }
  if (target.dataset.reporting && state.editor.open) {
    updateDraft(`reporting.${target.dataset.reporting}`, target.type === "checkbox" ? target.checked : target.value);
    if (event.type === "change") render({ preserveDrawerScroll: true });
  }
}

document.addEventListener("click", handleAction);
document.addEventListener("input", handleInput);
document.addEventListener("change", handleInput);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeModal(); closeEditor(); closeResourceEditor(); } });
document.querySelectorAll("[data-mobile-view-target]").forEach((button) => button.addEventListener("click", () => setMobileView(button.dataset.mobileViewTarget)));
subscribe((nextState) => {
  const preserveDrawerScroll = Boolean(nextState.editor?.preserveScrollOnNextRender);
  render({ preserveDrawerScroll });
  if (nextState.editor) nextState.editor.preserveScrollOnNextRender = false;
});
render();
