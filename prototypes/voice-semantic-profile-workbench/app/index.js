import {
  capabilityResourceFor,
  capabilityCatalog,
  catalogVersions,
  closeResourceEditor,
  enumEntries,
  filteredResources,
  getResource,
  localePolicy,
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
  skillLocales,
  validateResourceDraft,
  addCapability,
  removeCapability
} from "./state.js?v=20260819v3";
import { $, anchor, escapeHtml, statusClass, tag } from "./dom.js";

const sections = [
  ["basic", "基础信息"],
  ["mapping", "能力与映射"],
  ["reporting", "状态报告"],
  ["publish", "校验与发布"]
];

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
    context: "平台配置 / Alexa 多语言资源库",
    summary: "资源库是平台级 Capability Resource KV，统一维护 Discovery 需要的本地化 Friendly Names；产品 Profile 不选择 Key，由平台自动解析。",
    items: [
      { n: 16, title: "Alexa 资源维护", location: "关联位置：多语言 > Alexa资源", fields: [["现状对齐", "沿用产品模板多语言页的筛选、查询/重置、导入/导出和横向语言表格；Alexa 资源不按产品、模板或 SKU 分栏。"], ["维护交互", "新增或编辑时维护 capability、scope、Resource Key、能力名称资源的 instance 或 mode 资源的 Alexa Value、语义说明与 18 个 Locale 词条；草稿不会参与产品 Profile 的自动解析。"], ["发布规则", "en-US 是自定义资源必填基线；Resource Key 全局唯一。目标市场 Locale 缺失由产品 Profile 发布校验阻断；英语不能保证 Alexa 将本地语言语音理解为英语名称。"]] }
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
      summary: "V2 基于 V1 的基础信息表单调整，不处理 V1 数据搬运。SemanticProfile 保存产品语义，Phase 1 仅实例化 Alexa ProviderProjection。",
      items: [
        { n: 4, title: "产品与 Endpoint 定义", location: "关联位置：配置抽屉 > 基础信息", fields: [["说明", "产品 Key 必须绑定既有 IoT 产品；Endpoint 显示分类对应 Alexa Discovery displayCategories[0]，决定 Alexa App 的类型、图标与控制页；它不等于产品分类或 capability。"], ["校验规则", "名称、Product Key 和平台 Catalog 中已启用的显示分类必填；首期仅输出一个主分类，不能自定义或由 capability 自动推导。"], ["状态/差异", "多路开关为单一 endpoint；网关及子设备独立呈现；解绑再绑定生成新 endpointId；虚拟设备和 Group 不暴露。"]] }
      ]
    },
    mapping: {
      context: "配置抽屉 / 能力与映射",
      summary: "一期链路为：物模型属性/命令 -> 按类型生成候选 -> 人工确认设备语义 -> 版本化规则生成 0..N 个 Alexa Capability。",
      items: [
        { n: 5, title: "类型候选与人工确认", location: "关联位置：配置抽屉 > 物模型属性 / 设备语义", fields: [["候选规则", "物模型属性类型仅允许 int、float、double、enum、bool、string，并作为硬筛条件；命令使用独立 command 来源。"], ["排序提示", "单位、范围、读写方向和值结构只决定“可直接绑定 / 需转换 / 信息不足”的排序和提示，不根据属性名称自动判定语义。"], ["交互", "更换属性后清空旧语义和厂商覆盖；产品人员必须重新确认语义。"]] },
        { n: 6, title: "版本化多 Provider 投影", location: "关联位置：配置抽屉 > Alexa 投影结果组", fields: [["一期", "产品页只执行 Alexa 规则；规则 ID、版本、条件和 0..N 个输出只读展示，instance 与 Alexa Value 等仍在输出项中维护。"], ["扩展", "同一 semanticId 分别关联 Alexa 与 Google 规则；device.power 可投影 PowerController，也可在二期独立投影 Google OnOff。"], ["边界", "Google Home 不出现在一期产品界面；Google unsupported 不影响 Alexa，规则冲突只阻断目标 Provider。"]] }
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
      summary: "这里的发布表示需求中的配置发布状态机，不代表 Alexa 功能已经上线；V2 验收执行 V1 Alexa 需求继承回归。",
      items: [
        { n: 3, title: "校验与配置发布", location: "关联位置：配置抽屉 > 底部操作栏", fields: [["说明", "先保存草稿并运行 Alexa 配置校验，再发布当前需求配置版本。"], ["按钮状态", "默认可保存草稿；发布仅在校验通过时可用；发布成功只表示配置状态变更。"], ["回归范围", "Discovery、Directive、StateReport、instance、Alexa Value 与 Resource KV 必须覆盖 V1 Alexa 需求。"]] }
      ]
    }
  }
};

const pageRenderers = {
  products: renderProductsPage,
  "product-detail": renderProductDetail,
  "resource-library": renderResourceLibraryPage
};

function render() {
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
}

function renderPageHeader() {
  const meta = {
    products: { crumb: "智能产品", title: "产品列表", copy: "查询、复制、查看产品；Alexa 配置仅在产品详情的高级配置中维护。", action: `<button class="el-btn el-btn--primary" data-action="show-toast" data-toast="创建产品沿用既有 IoT 产品流程" data-toast-type="info">+ 创建产品</button>`, anchor: 14 },
    "product-detail": { crumb: "产品详情", title: "产品详情", copy: "高级配置是当前需求唯一新增 Alexa 入口。", action: `<button class="el-btn" data-action="nav" data-page="products">返回列表</button>`, anchor: 15 },
    "resource-library": { crumb: "多语言 / Alexa资源", title: "Alexa 多语言资源", copy: "沿用多语言词条管理结构；资源按 capability 与 scope 全局复用，不按产品区分。", action: `<button class="el-btn" data-action="new-resource">+ 新增资源</button>`, anchor: 16 }
  }[state.page] || { crumb: "智能产品", title: "产品列表", copy: "", action: "", anchor: 14 };
  $("#breadcrumb").innerHTML = `<span>智能产品</span><span class="breadcrumb-slash">/</span><strong>${meta.crumb}</strong>`;
  $("#pageHeader").innerHTML = `<div><div class="page-title-line"><h1>${meta.title}</h1>${anchor(meta.anchor)}</div><p>${meta.copy}</p></div><div class="page-header-actions">${meta.action}</div>`;
}

function renderResourceLibraryPage() {
  const rows = filteredResources();
  const configuredCount = (resource) => skillLocales.filter(([locale]) => resource.values[locale]?.trim()).length;
  const resourceStatus = (resource) => resource.status === "published" ? tag("已发布", "success") : tag("草稿", "warning");
  const capabilities = capabilityCatalog.filter((item) => item.status === "profile_ready").map((item) => item.id);
  const columns = `<th>Capability</th><th>资源范围</th><th>Resource Key</th><th>解析关联</th><th>语义说明</th><th>状态</th>${skillLocales.map(([, label]) => `<th>${label}</th>`).join("")}<th>覆盖</th><th>引用</th><th class="col-ops">操作</th>`;
  const resourceRows = rows.length ? rows.map((resource) => { const binding = resource.scope === "mode" ? resource.modeValue : resource.instance; return `<tr><td><code class="cell-code">${escapeHtml(resource.capability)}</code></td><td>${tag(resource.scope === "capability" ? "能力名称" : "模式名称", resource.scope === "capability" ? "primary" : "warning")}</td><td><code class="cell-code">${escapeHtml(resource.key)}</code></td><td>${binding ? `<code class="cell-code">${escapeHtml(binding)}</code>` : "未配置"}</td><td>${escapeHtml(resource.semantic)}</td><td>${resourceStatus(resource)}</td>${skillLocales.map(([locale]) => `<td class="locale-cell ${resource.values[locale] ? "" : "is-empty"}">${escapeHtml(resource.values[locale] || "未配置")}</td>`).join("")}<td><strong>${configuredCount(resource)}/${localePolicy.enabledLocaleCount}</strong></td><td>${resource.usage}</td><td class="col-ops"><button class="op-link" data-action="edit-resource" data-resource-key="${resource.key}">编辑</button></td></tr>`; }).join("") : `<tr><td colspan="${skillLocales.length + 10}"><div class="table-empty">没有符合条件的 Alexa Resource Key</div></td></tr>`;
  return `<nav class="lang-tabs" aria-label="多语言类型"><button class="lang-tab" disabled>产品模板</button><button class="lang-tab" disabled>智能产品</button><button class="lang-tab" disabled>App通用</button><button class="lang-tab is-active">Alexa资源</button></nav><section class="resource-policy"><div><strong>全局 Alexa Capability Resource KV</strong><p>沿用多语言管理的词条表结构，但不按产品、产品模板或 SKU 划分。能力名称资源以 capability + instance 关联，模式资源以 capability + Alexa Value 关联，供产品 Profile 自动解析。</p></div>${tag("平台维护", "info")}</section><section class="admin-panel resource-library"><div class="panel-toolbar resource-toolbar"><div class="filter-row"><select class="el-select filter-select" data-resource-filter="capability"><option value="all">全部 capability</option>${capabilities.map((id) => `<option value="${id}" ${state.resourceFilters.capability === id ? "selected" : ""}>${id}</option>`).join("")}</select><select class="el-select filter-select" data-resource-filter="scope"><option value="all">全部资源范围</option><option value="capability" ${state.resourceFilters.scope === "capability" ? "selected" : ""}>能力名称</option><option value="mode" ${state.resourceFilters.scope === "mode" ? "selected" : ""}>模式名称</option></select><input class="el-input resource-search" data-resource-filter="keyword" value="${escapeHtml(state.resourceFilters.keyword)}" placeholder="搜索 Resource Key、语义或翻译" /><button class="el-btn el-btn--primary" data-action="resource-query">查询</button><button class="el-btn" data-action="reset-resource-filters">重置</button></div><div class="table-actions"><button class="el-btn" data-action="resource-import">导入</button><button class="el-btn" data-action="resource-export">导出</button><button class="el-btn el-btn--primary" data-action="new-resource">+ 新增资源</button></div></div><div class="resource-table-scroll"><table class="el-table resource-table"><thead><tr>${columns}</tr></thead><tbody>${resourceRows}</tbody></table></div><footer class="table-footer"><span>共 ${rows.length} 条。已发布资源才可被产品 Profile 自动解析。</span><span>Discovery 自动生成 <code>capabilityResources</code> / <code>modeResources</code></span></footer></section>`;
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
  return `<section class="product-detail-shell"><section class="product-detail-summary"><div><div class="product-detail-title"><h2>${escapeHtml(product.name)}</h2>${tag(product.status, product.status === "已上架" ? "success" : "warning")}</div><p>${escapeHtml(product.platform)} <span>/</span> 产品分类：${escapeHtml(product.category)} <span>/</span> 产品型号：${escapeHtml(product.model)} <span>/</span> 功能版本：${escapeHtml(product.version)}</p></div></section><nav class="product-tabs" aria-label="产品详情页签">${tabs.map((label, index) => `<button class="product-tab ${index === 5 ? "is-active" : ""}" ${index === 5 ? "" : "disabled"}>${label}</button>`).join("")}</nav><section class="advanced-config"><div class="advanced-heading"><div><h2>高级配置 ${anchor(15)}</h2><p>沿用产品详情现有高级配置卡片；Alexa 作为同级配置入口。</p></div></div><div class="advanced-card-grid">${cards.map(([title, status, description]) => `<article class="advanced-card"><div><h3>${title}</h3><p>${description}</p></div>${tag(status, "info")}</article>`).join("")}<article class="advanced-card advanced-card--alexa"><div><div class="card-title-line"><h3>Alexa</h3>${tag(alexaStatus, statusType)}</div><p>维护设备语义到 Alexa capability 的产品级投影。</p><small>${product.alexaSupported ? "一期仅生成 Alexa 配置版本；当前状态不表示功能已经上线。" : "当前未启用；可在配置中切换为支持。"}</small></div><button class="el-btn el-btn--primary" data-action="open-product-profile" data-product-id="${product.id}">编辑 Alexa 配置</button></article></div></section></section>`;
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
    const readyCapabilities = capabilityCatalog.filter((item) => item.status === "profile_ready");
    const validation = state.resourceEditor.validation;
    const instanceField = draft.scope === "capability" ? `<label class="form-row"><span>绑定 instance <b>*</b></span><input class="el-input" data-resource-field="instance" value="${escapeHtml(draft.instance || "")}" placeholder="例如 Crib.MotionMode" /><em>平台以 capability + instance 自动解析能力名称 Resource KV；不是产品 Profile 的输入字段。</em></label>` : "";
    const modeValueField = draft.scope === "mode" ? `<label class="form-row"><span>Alexa Value <b>*</b></span><input class="el-input" data-resource-field="modeValue" value="${escapeHtml(draft.modeValue || "")}" placeholder="例如 FULL_LOAD" /><em>稳定机器值，不是语音名称。平台以 capability + Alexa Value 自动解析 mode Resource KV；同一 capability 不可重复。</em></label>` : "";
    mount.innerHTML = `<div class="el-drawer-host is-open"><div class="el-drawer__mask" data-action="close-resource-editor"></div><aside class="el-drawer resource-editor-drawer" role="dialog" aria-modal="true" aria-label="${state.resourceEditor.sourceKey ? "编辑" : "新增"} Alexa 多语言资源"><header class="el-drawer__header"><div><h2 class="el-drawer__title">${state.resourceEditor.sourceKey ? "编辑" : "新增"} Alexa 多语言资源</h2><p class="drawer-subtitle">全局 Capability Resource KV <span>/</span> 不绑定产品</p></div><button class="el-drawer__close" data-action="close-resource-editor" aria-label="关闭">x</button></header><div class="el-drawer__body resource-editor-body"><section class="drawer-section"><div class="section-heading"><h3>资源定义 ${anchor(16)}</h3><p>Resource Key 是稳定机器引用。能力名称资源由 capability + instance 关联，模式资源由 capability + Alexa Value 关联；二者都不等于用户看到的翻译文本。</p></div><div class="form-grid"><label class="form-row"><span>所属 Alexa capability <b>*</b></span><select class="el-select" data-resource-field="capability">${readyCapabilities.map((item) => `<option value="${item.id}" ${draft.capability === item.id ? "selected" : ""}>${item.id}</option>`).join("")}</select></label><label class="form-row"><span>资源范围 <b>*</b></span><select class="el-select" data-resource-field="scope"><option value="capability" ${draft.scope === "capability" ? "selected" : ""}>capability（能力名称）</option><option value="mode" ${draft.scope === "mode" ? "selected" : ""}>mode（模式名称）</option></select></label><label class="form-row"><span>Resource Key <b>*</b></span><input class="el-input" data-resource-field="key" value="${escapeHtml(draft.key)}" placeholder="例如 ModeController.FULL_LOAD" /><em>全局唯一；以英文字母开头，仅含字母、数字、点、下划线和连字符。已发布 Key 不建议改名。</em></label>${instanceField}${modeValueField}<label class="form-row"><span>语义说明 <b>*</b></span><input class="el-input" data-resource-field="semantic" value="${escapeHtml(draft.semantic)}" placeholder="例如 满载工作模式" /><em>供平台与本地化维护者判断是否可被不同产品复用。</em></label></div><div class="resource-locale-heading"><div><strong>多语言词条</strong><span>由 Skill Locale 策略同步的 ${localePolicy.enabledLocaleCount} 项；${localePolicy.baseLocale} 为发布必填。</span></div>${tag("不关联产品", "info")}</div><div class="locale-editor-grid">${skillLocales.map(([locale, label]) => `<label class="locale-editor-row ${locale === localePolicy.baseLocale ? "is-required" : ""}"><span><strong>${label}</strong><code>${locale}</code></span><input class="el-input" data-resource-field="values.${locale}" value="${escapeHtml(draft.values[locale] || "")}" placeholder="${locale === localePolicy.baseLocale ? "必填" : "未配置"}" /></label>`).join("")}</div><p class="locale-editor-help">未配置的 Locale 不会被英语自动翻译为当地语义；产品若面向该 Locale，发布 Profile 时会按其目标市场规则阻断。</p>${validation ? `<div class="validation-result ${validation.passed ? "is-passed" : "is-failed"}"><div class="validation-result__head"><strong>${validation.passed ? "资源校验通过" : `资源校验未通过 (${validation.errors.length})`}</strong>${tag(validation.passed ? "可发布" : "需处理", validation.passed ? "success" : "danger")}</div>${validation.passed ? `<p>Resource Key、关联标识、语义与英语默认词条已满足发布条件。</p>` : `<ul>${validation.errors.map((item) => `<li class="validation-error">${escapeHtml(item)}</li>`).join("")}</ul>`}</div>` : ""}</section></div><footer class="el-drawer__footer"><button class="el-btn" data-action="close-resource-editor">取消</button><button class="el-btn" data-action="save-resource">保存草稿</button><button class="el-btn el-btn--primary" data-action="validate-resource">运行校验</button><button class="el-btn el-btn--primary" data-action="publish-resource" ${validation?.passed ? "" : "disabled"}>发布资源</button></footer></aside></div>`;
    return;
  }
  if (!state.editor.open) { mount.innerHTML = ""; return; }
  const draft = state.editor.draft;
  mount.innerHTML = `<div class="el-drawer-host is-open"><div class="el-drawer__mask" data-action="close-editor"></div><aside class="el-drawer alexa-drawer" role="dialog" aria-modal="true" aria-label="${state.editor.sourceId ? "编辑" : "新建"}产品 Alexa 配置"><header class="el-drawer__header"><div><h2 class="el-drawer__title">${state.editor.sourceId ? "编辑" : "新建"}产品 Alexa 配置</h2><p class="drawer-subtitle">${escapeHtml(draft.name || "未命名 Profile")} <span>/</span> ${escapeHtml(draft.productKey || "草稿")}</p></div><button class="el-drawer__close" data-action="close-editor" aria-label="关闭">x</button></header><div class="drawer-shell"><nav class="drawer-section-nav">${sections.map(([key, label], index) => `<button class="drawer-section-item ${state.editor.section === key ? "is-active" : ""}" data-action="drawer-section" data-section="${key}" ${!state.editor.productAlexaSupported && key !== "basic" ? "disabled" : ""}><span>${index + 1}</span>${label}</button>`).join("")}</nav><div class="el-drawer__body">${renderDrawerBody(draft)}</div></div><footer class="el-drawer__footer"><button class="el-btn" data-action="close-editor">取消</button><button class="el-btn" data-action="save-draft">保存草稿</button><button class="el-btn el-btn--primary" data-action="run-validation" ${state.editor.productAlexaSupported ? "" : "disabled"}>运行校验</button><button class="el-btn el-btn--primary" data-action="publish" ${state.editor.productAlexaSupported && state.editor.validation?.passed ? "" : "disabled"}>发布</button></footer></aside></div>`;
}

function renderDrawerBody(draft) {
  if (state.editor.section === "mapping") return renderMappingSection(draft);
  if (state.editor.section === "reporting") return renderReportingSection(draft);
  if (state.editor.section === "publish") return renderPublishSection(draft);
  const displayCategoryOptions = endpointDisplayCategoryCatalog.filter((item) => item.status === "profile_ready").map((item) => `<option value="${item.id}" ${draft.displayCategory === item.id ? "selected" : ""}>${item.label} · ${item.semantic}</option>`).join("");
  return `<section class="drawer-section"><div class="section-heading"><h3>产品 Alexa 配置 ${anchor(4)}</h3><p>Profile 归属当前产品；选择 Alexa 官方 Endpoint 显示分类，并映射标准物模型能力。</p></div><div class="switch-row switch-row--interactive"><button class="switch-control switch-control--button ${state.editor.productAlexaSupported ? "is-on" : ""}" type="button" data-action="toggle-alexa-support" role="switch" aria-checked="${state.editor.productAlexaSupported}" aria-label="Alexa：${state.editor.productAlexaSupported ? "支持" : "不支持"}"></button><span><strong>Alexa：${state.editor.productAlexaSupported ? "支持" : "不支持"}</strong><small>关闭后保留 Profile 历史并停用发布版本，不参与 Discovery；重新开启后必须重新校验和发布。</small></span></div>${state.editor.productAlexaSupported ? `<div class="form-grid"><label class="form-row"><span>Profile 名称 <b>*</b></span><input class="el-input" data-field="name" value="${escapeHtml(draft.name)}" placeholder="例如 Bedside Light Alexa Profile" /><em>产品级配置版本名称，不直接作为用户语音名称。</em></label><label class="form-row"><span>关联产品 <b>*</b></span><input class="el-input is-readonly" value="${escapeHtml(draft.productKey)}" readonly /><em>从智能产品入口带入，不能在此切换产品。</em></label><label class="form-row"><span>产品分类</span><input class="el-input is-readonly" value="${escapeHtml(draft.category)}" readonly /><em>来自 IoT 产品主数据，不等于 Alexa 显示分类。</em></label><label class="form-row"><span>Alexa Endpoint 显示分类 <b>*</b></span><select class="el-select" data-field="displayCategory">${displayCategoryOptions}</select><em>对应 Discovery <code>displayCategories[0]</code>；仅影响 Alexa App 的类型、图标和控制页，不自动增删 Capability。</em></label></div><div class="lifecycle-notice"><strong>设备路由与呈现规则</strong><span>首期仅声明一个主显示分类，Adapter 输出 <code>displayCategories: [displayCategory]</code>。连接方式、设备类型和网关关系继承产品与设备主数据；Alexa Profile 不重复配置。App 解绑再绑定生成新 endpointId；虚拟设备与 Group 不暴露给 Alexa。</span></div>` : `<div class="lifecycle-notice"><strong>当前不支持 Alexa</strong><span>开启后保留在基础信息，完成产品级 endpoint 定义后再进入能力与映射；保存后才将产品设为支持 Alexa。</span></div>`}</section>`;
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

function candidateTagType(fit) {
  return fit === "可直接绑定" ? "success" : fit === "需转换" ? "warning" : "danger";
}

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

function renderMappingSection(draft) {
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

function renderReportingSection(draft) {
  return `<section class="drawer-section"><div class="section-heading"><h3>状态报告 ${anchor(7)}</h3><p>首期统一由 Adapter 支持 Alexa 主动状态查询；最终状态不能由“云已受理”替代。</p></div><div class="reporting-card"><label class="form-row"><span>状态数据源</span><select class="el-select" data-reporting="source"><option value="device_reported" ${draft.reporting.source === "device_reported" ? "selected" : ""}>device_reported（设备上报）</option><option value="cloud_derived" ${draft.reporting.source === "cloud_derived" ? "selected" : ""}>cloud_derived（云端派生）</option></select><em>仅允许平台登记的状态源；不允许配置外部请求。</em></label><label class="switch-row"><input type="checkbox" data-reporting="stateReport" ${draft.reporting.stateReport ? "checked" : ""}/><span class="switch-control"></span><span><strong>StateReport</strong><small>Alexa 查询状态时从物模型读取并转换。</small></span></label><label class="switch-row switch-row--disabled"><input type="checkbox" disabled/><span class="switch-control"></span><span><strong>ChangeReport（首期预留）</strong><small>schema 保留；首期不可启用，平台不向 Alexa 主动发送。</small></span></label><label class="switch-row"><input type="checkbox" data-reporting="endpointHealth" ${draft.reporting.endpointHealth ? "checked" : ""}/><span class="switch-control"></span><span><strong>EndpointHealth</strong><small>设备可达性为发布必需项。</small></span></label></div></section>`;
}

function renderPublishSection(draft) {
  const validation = state.editor.validation;
  return `<section class="drawer-section"><div class="section-heading"><h3>校验与发布 ${anchor(3)}</h3><p>发布表示需求中的 Alexa 配置状态变更，不表示功能已经上线。</p></div><div class="release-grid"><div class="release-readonly"><span>本期 Provider</span><strong>Alexa</strong><em>一期只实例化 Alexa ProviderProjection。</em></div><div class="release-readonly"><span>需求基线</span><strong>V1 Alexa 需求回归</strong><em>校验 V1 能力在 V2 中完整保留，不处理 V1 数据搬运或流量切换。</em></div></div>${validation ? renderValidation(validation) : `<div class="validation-placeholder"><strong>尚未运行校验</strong><p>检查设备语义、Alexa 投影、instance、Alexa Value、Resource KV 与状态报告。</p></div>`}</section>`;
}

function renderValidation(validation) {
  const errors = validation.errors.map((item) => `<li class="validation-error">${escapeHtml(item)}</li>`).join("");
  const warnings = validation.warnings.map((item) => `<li class="validation-warning">${escapeHtml(item)}</li>`).join("");
  return `<div class="validation-result ${validation.passed ? "is-passed" : "is-failed"}"><div class="validation-result__head"><strong>${validation.passed ? "校验通过" : `校验未通过 (${validation.errors.length})`}</strong>${tag(validation.passed ? "可发布" : "需处理", validation.passed ? "success" : "danger")}</div>${validation.passed ? `<p>设备语义、Alexa Projection、Adapter Contract、资源与报告策略均满足配置发布要求。</p>` : `<ul>${errors}</ul>`}${warnings ? `<div class="validation-warning-group"><strong>建议处理</strong><ul>${warnings}</ul></div>` : ""}</div>`;
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
  if (action === "validate-profile") { openEditor(profileId, "publish"); window.setTimeout(() => { runValidation(); setToast("已完成 Profile 配置校验", state.editor.validation.passed ? "success" : "danger"); }, 0); }
  if (action === "close-editor") closeEditor();
  if (action === "drawer-section") setEditorSection(section);
  if (action === "add-capability") addCapability();
  if (action === "remove-capability") removeCapability(Number(index));
  if (action === "run-validation") { const validation = runValidation(); setToast(validation.passed ? "校验通过，可以发布" : "校验未通过，请处理阻断项", validation.passed ? "success" : "danger"); }
  if (action === "save-draft") { saveDraft(); setToast("Profile 草稿已保存", "success"); }
  if (action === "publish") { if (publishDraft()) { setToast("Alexa 配置版本已发布；不代表功能已经上线", "success"); closeEditor(); } else setToast("发布前必须先通过校验", "danger"); }
  if (action === "rollback-open") showModal("rollback", profileId);
  if (action === "delist-open") showModal("delist", profileId);
  if (action === "delist-confirm") { closeModal(); setToast("Profile 已下架，已绑定用户将失去 Alexa 语音控制", "danger"); }
  if (action === "close-modal") closeModal();
  if (action === "rollback-confirm") { rollbackProfile(profileId); closeModal(); setToast("Profile 已回滚至上一版本", "success"); }
  if (action === "reset-filters") { state.filters.keyword = ""; state.filters.status = "all"; render(); }
  if (action === "resource-query") setToast(`已查询 ${filteredResources().length} 条 Alexa Resource Key`, "success");
  if (action === "reset-resource-filters") resetResourceFilters();
  if (action === "resource-import") setToast("导入使用平台 Resource KV 模板；导入前校验 capability、scope、Resource Key 和 en-US。", "info");
  if (action === "resource-export") setToast("已按当前筛选条件生成 Resource KV 导出任务。", "success");
  if (action === "new-resource") openResourceEditor();
  if (action === "edit-resource") openResourceEditor(trigger.dataset.resourceKey);
  if (action === "close-resource-editor") closeResourceEditor();
  if (action === "validate-resource") { const validation = validateResourceDraft(); setToast(validation.passed ? "资源校验通过，可以发布" : "资源校验未通过，请处理必填项", validation.passed ? "success" : "danger"); }
  if (action === "save-resource") { if (saveResourceDraft(false)) setToast("Alexa Resource Key 草稿已保存", "success"); else setToast("保存前请处理资源校验项", "danger"); }
  if (action === "publish-resource") { if (saveResourceDraft(true)) setToast("Alexa Resource Key 已发布，可供产品 Profile 引用", "success"); else setToast("发布前请处理资源校验项", "danger"); }
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
    const resourceField = target.dataset.resourceField;
    updateResourceDraft(resourceField, target.value);
    if (resourceField === "scope") render();
    return;
  }
  if (target.dataset.productAlexaSupport) {
    updateProductAlexaSupport(target.checked);
    return;
  }
  if (target.dataset.modeMappingIndex !== undefined && state.editor.open) {
    const index = Number(target.dataset.capabilityIndex);
    const binding = state.editor.draft.capabilities[index];
    const property = modelPropertyCatalog.find((item) => item.id === binding?.property);
    const mappings = resolvedModeMappings(binding, property).map((item) => ({ ...item }));
    mappings[Number(target.dataset.modeMappingIndex)][target.dataset.modeMappingField] = target.value;
    updateProjectionOverride(index, "alexa", target.dataset.projectionCapability || "ModeController", "modeMappings", mappings);
    state.editor.validation = null;
    return;
  }
  if (target.dataset.projectionField && state.editor.open) {
    updateProjectionOverride(Number(target.dataset.capabilityIndex), "alexa", target.dataset.projectionCapability, target.dataset.projectionField, target.value);
    state.editor.validation = null;
    return;
  }
  if (target.dataset.field && state.editor.open) updateDraft(target.dataset.field, target.value);
  if (target.dataset.capabilityIndex !== undefined && state.editor.open) {
    const index = Number(target.dataset.capabilityIndex);
    const field = target.dataset.capabilityField;
    updateCapability(index, field, target.value);
    if (field === "property") {
      updateCapability(index, "semantic", "");
      updateCapability(index, "semanticSlot", "");
      updateCapability(index, "providerOverrides", { alexa: {} });
      state.editor.validation = null;
      render();
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
      state.editor.validation = null;
      render();
      return;
    }
  }
  if (target.dataset.reporting && state.editor.open) updateDraft(`reporting.${target.dataset.reporting}`, target.type === "checkbox" ? target.checked : target.value);
}

document.addEventListener("click", handleAction);
document.addEventListener("input", handleInput);
document.addEventListener("change", handleInput);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeModal(); closeEditor(); closeResourceEditor(); } });
document.querySelectorAll("[data-mobile-view-target]").forEach((button) => button.addEventListener("click", () => setMobileView(button.dataset.mobileViewTarget)));
subscribe(render);
render();
