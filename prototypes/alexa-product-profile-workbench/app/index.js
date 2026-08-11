import {
  capabilityResourceFor,
  capabilityCatalog,
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
  updateDraft,
  updateProductAlexaSupport,
  updateResourceDraft,
  openResourceEditor,
  saveResourceDraft,
  skillLocales,
  validateResourceDraft,
  addCapability,
  removeCapability
} from "./state.js?v=20260811e";
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
    summary: "智能产品是承载产品定义与 Alexa Profile 关联状态的核心对象；列表负责检索、复制与进入详情。",
    items: [
      { n: 14, title: "产品列表与检索", location: "关联位置：智能产品 > 列表", fields: [["说明", "复原现有产品分类、所属App、所属平台、通讯方式、产品ID 等筛选与列表字段。"], ["交互", "沿用“查看”进入产品详情；Alexa 不作为产品列表字段或行内操作。"], ["数据来源", "产品列表接口；高级配置和 Profile 不参与列表展示。"]] }
    ]
  },
  "product-detail": {
    context: "智能产品 / 产品详情 / 高级配置",
    summary: "Alexa 作为高级配置的同级卡片维护，不新增独立菜单、列表字段或产品信息入口。",
    items: [
      { n: 15, title: "高级配置中的 Alexa 入口", location: "关联位置：产品详情 > 高级配置", fields: [["现状依据", "产品详情 step=5 已承载新手指导、云倒计时、场景联动设置与耗材管理；Alexa 以同级卡片接入。"], ["交互", "进入卡片后可编辑 Alexa：支持/不支持；支持时继续配置 Profile、capability 与物模型映射。"], ["边界", "关闭支持后保留历史 Profile、停用发布版本并从 Discovery 排除；不在产品列表或基础信息重复配置。"]] }
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
      summary: "Profile 是产品级声明。产品团队只维护 endpoint 与物模型映射；运行时 Adapter、错误映射和 Skill 地区由平台统一治理。",
      items: [
        { n: 4, title: "产品与 Endpoint 定义", location: "关联位置：配置抽屉 > 基础信息", fields: [["说明", "产品 Key 必须绑定既有 IoT 产品；Endpoint 类型决定 Alexa Discovery 分类；BLE 与 Wi-Fi 复用同一物模型控制语义。"], ["校验规则", "名称和 Product Key 必填；启用 Alexa 后仍停留在本步骤，待基础信息完成后再进入能力映射。"], ["状态/差异", "多路开关为单一 endpoint；网关及子设备独立呈现；解绑再绑定生成新 endpointId；虚拟设备和 Group 不暴露。"]] }
      ]
    },
    mapping: {
      context: "配置抽屉 / 能力与映射",
      summary: "每个 capability 明确绑定到注册物模型属性或标准命令，支持不同产品在同一 Adapter 下复用。",
      items: [
        { n: 5, title: "Capability 与物模型映射", location: "关联位置：配置抽屉 > 能力与映射", fields: [["说明", "先选择当前产品已有物模型属性，系统只展示类型匹配且已完成 Adapter 准入的 Alexa capability。Mode、Range、Toggle 需要 instance。"], ["交互", "ModeController 为每个物模型枚举值选择 Alexa Value；平台按 capability + instance 与 capability + Alexa Value 自动解析 Resource KV。页面仅预览 en-US / de-DE，不录入翻译或 Resource Key。"], ["校验规则", "检查字段存在、类型/单位兼容、instance 唯一性、Resource KV 自动解析、en-US 基线与目标市场 Locale。Asset 与 Friendly Name 原文不在产品页面配置。"]] },
        { n: 6, title: "首期标准映射边界", location: "关联位置：配置抽屉 > 映射方式", fields: [["说明", "首期只支持布尔、枚举、数值和单位转换；一条 directive 必须映射到一个物模型属性或标准命令。"], ["异常处理", "多属性编排、异步确认、安全状态机、跨设备动作和非标准云接口不在首期范围，Profile 不可发布。"]] }
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
      summary: "发布操作要求最近一次自动契约校验通过；Profile 在当前环境生效并保留可回滚版本。",
      items: [
        { n: 3, title: "校验、发布与回滚", location: "关联位置：配置抽屉 > 底部操作栏", fields: [["说明", "当前环境由部署域名确定；先运行自动校验，再发布当前产品 Profile。测试验证使用独立测试域名，不在 Profile 内选环境。"], ["按钮状态", "默认可保存草稿；发布仅在校验通过时可用；发布成功后列表状态变为已发布。"], ["异常处理", "回滚需二次确认，在当前环境恢复上一个已发布版本而非删除配置。"]] }
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
        <thead><tr><th style="width:42px"><input class="el-checkbox" type="checkbox" aria-label="全选" /></th><th>Profile 名称</th><th>产品分类 / Endpoint</th><th>共享 Adapter</th><th>Capability</th><th>状态</th><th>最近更新</th><th class="col-ops">操作</th></tr></thead>
        <tbody>${rows.length ? rows.map(renderProfileRow).join("") : `<tr><td colspan="8"><div class="table-empty">没有符合条件的 Profile</div></td></tr>`}</tbody>
      </table>
      <footer class="table-footer"><span>共 ${rows.length} 条</span><div class="pagination"><button class="page-btn is-active">1</button><button class="page-btn" disabled>2</button><button class="page-btn" disabled>&gt;</button></div></footer>
    </section>`;
}

function renderProfileRow(profile) {
  const status = statusMeta[profile.status];
  const capabilityText = profile.capabilities.map((capability) => capability.id.replace("Controller", "")).join(" / ");
  return `<tr>
    <td><input class="el-checkbox" type="checkbox" aria-label="选择 ${escapeHtml(profile.name)}" /></td>
    <td><div class="profile-name">${escapeHtml(profile.name)}${profile.id === "bedside-light-v1" ? anchor(1) : ""}</div><div class="profile-key">${escapeHtml(profile.productKey)}</div></td>
    <td><div>${escapeHtml(profile.category)}</div><span class="cell-secondary">${escapeHtml(profile.endpointType)}</span></td>
    <td><div class="adapter-cell">${escapeHtml(profile.adapter)}${profile.id === "bedside-light-v1" ? anchor(2) : ""}</div><span class="cell-secondary">v${escapeHtml(profile.adapterVersion)}</span></td>
    <td><div class="capability-cell">${escapeHtml(capabilityText)}</div><span class="cell-secondary">${profile.capabilities.length} 项能力</span></td>
    <td>${tag(status.label, status.type)}</td>
    <td><div>${escapeHtml(profile.updatedAt)}</div><span class="cell-secondary">${escapeHtml(profile.updatedBy)}</span></td>
    <td class="col-ops"><button class="op-link" data-action="edit-profile" data-profile-id="${profile.id}">编辑</button><span class="op-divider">|</span><button class="op-link" data-action="validate-profile" data-profile-id="${profile.id}">校验${profile.id === "smart-crib-motion-v1" ? anchor(3) : ""}</button><span class="op-divider">|</span><button class="op-link ${profile.status === "published" ? "danger" : "is-disabled"}" data-action="rollback-open" data-profile-id="${profile.id}" ${profile.status === "published" ? "" : "disabled"}>回滚</button><span class="op-divider">|</span><button class="op-link ${profile.status === "published" ? "danger" : "is-disabled"}" data-action="delist-open" data-profile-id="${profile.id}" ${profile.status === "published" ? "" : "disabled"}>下架</button></td>
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
  const alexaStatus = !product.alexaSupported ? "不支持" : profile?.status === "published" ? "已发布" : profile?.status === "blocked" ? "校验阻断" : profile?.status === "disabled" ? "已停用" : "待配置";
  const statusType = alexaStatus === "已发布" ? "success" : alexaStatus === "校验阻断" ? "danger" : alexaStatus === "不支持" ? "info" : "warning";
  return `<section class="product-detail-shell"><section class="product-detail-summary"><div><div class="product-detail-title"><h2>${escapeHtml(product.name)}</h2>${tag(product.status, product.status === "已上架" ? "success" : "warning")}</div><p>${escapeHtml(product.platform)} <span>/</span> 产品分类：${escapeHtml(product.category)} <span>/</span> 产品型号：${escapeHtml(product.model)} <span>/</span> 功能版本：${escapeHtml(product.version)}</p></div></section><nav class="product-tabs" aria-label="产品详情页签">${tabs.map((label, index) => `<button class="product-tab ${index === 5 ? "is-active" : ""}" ${index === 5 ? "" : "disabled"}>${label}</button>`).join("")}</nav><section class="advanced-config"><div class="advanced-heading"><div><h2>高级配置 ${anchor(15)}</h2><p>沿用产品详情现有高级配置卡片；Alexa 作为同级配置入口。</p></div></div><div class="advanced-card-grid">${cards.map(([title, status, description]) => `<article class="advanced-card"><div><h3>${title}</h3><p>${description}</p></div>${tag(status, "info")}</article>`).join("")}<article class="advanced-card advanced-card--alexa"><div><div class="card-title-line"><h3>Alexa</h3>${tag(alexaStatus, statusType)}</div><p>维护产品是否支持 Alexa 及其标准 capability 到物模型映射。</p><small>${product.alexaSupported ? "启用后通过产品级 Profile 发布到 Alexa。" : "当前未启用；可在配置中切换为支持。"}</small></div><button class="el-btn el-btn--primary" data-action="open-product-profile" data-product-id="${product.id}">编辑 Alexa 配置</button></article></div></section></section>`;
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
  return `<section class="drawer-section"><div class="section-heading"><h3>产品 Alexa 配置 ${anchor(4)}</h3><p>Profile 归属当前产品；定义 Alexa endpoint 类型和标准物模型映射。</p></div><div class="switch-row switch-row--interactive"><button class="switch-control switch-control--button ${state.editor.productAlexaSupported ? "is-on" : ""}" type="button" data-action="toggle-alexa-support" role="switch" aria-checked="${state.editor.productAlexaSupported}" aria-label="Alexa：${state.editor.productAlexaSupported ? "支持" : "不支持"}"></button><span><strong>Alexa：${state.editor.productAlexaSupported ? "支持" : "不支持"}</strong><small>关闭后保留 Profile 历史并停用发布版本，不参与 Discovery；重新开启后必须重新校验和发布。</small></span></div>${state.editor.productAlexaSupported ? `<div class="form-grid"><label class="form-row"><span>Profile 名称 <b>*</b></span><input class="el-input" data-field="name" value="${escapeHtml(draft.name)}" placeholder="例如 Bedside Light Alexa Profile" /><em>产品级配置版本名称，不直接作为用户语音名称。</em></label><label class="form-row"><span>关联产品 <b>*</b></span><input class="el-input is-readonly" value="${escapeHtml(draft.productKey)}" readonly /><em>从智能产品入口带入，不能在此切换产品。</em></label><label class="form-row"><span>产品分类</span><input class="el-input is-readonly" value="${escapeHtml(draft.category)}" readonly /></label><label class="form-row"><span>Alexa Endpoint 类型</span><select class="el-select" data-field="endpointType"><option ${draft.endpointType === "LIGHT" ? "selected" : ""}>LIGHT</option><option ${draft.endpointType === "OTHER" ? "selected" : ""}>OTHER</option></select></label></div><div class="lifecycle-notice"><strong>设备路由与呈现规则</strong><span>连接方式、设备类型和网关关系继承产品与设备主数据；Alexa Profile 不重复配置。App 解绑再绑定生成新 endpointId；虚拟设备与 Group 不暴露给 Alexa。</span></div>` : `<div class="lifecycle-notice"><strong>当前不支持 Alexa</strong><span>开启后保留在基础信息，完成产品级 endpoint 定义后再进入能力与映射；保存后才将产品设为支持 Alexa。</span></div>`}</section>`;
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

function resolvedModeMappings(capability, property) {
  if (capability.modeMappings?.length) return capability.modeMappings.map((item) => ({ ...item, alexaValue: item.alexaValue || getResource(item.resourceKey)?.modeValue || "" }));
  return enumEntries(property).map(({ value }) => ({
    modelValue: value,
    alexaValue: ""
  }));
}

function requiresInstance(interfaceId) {
  return Boolean(capabilityCatalog.find((item) => item.id === interfaceId)?.instanceRequired);
}

function compatibleCapabilities(propertyId) {
  const property = modelPropertyCatalog.find((item) => item.id === propertyId);
  if (!property) return [];
  return capabilityCatalog.filter((item) => item.id !== "EndpointHealth" && item.status === "profile_ready" && (
    item.propertyIds?.includes(property.id) || item.propertyTypes?.includes(property.type) || item.propertyKinds?.includes(property.valueKind)
  ) && (!item.requiresWritable || property.writable));
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
    speaker_volume: "speaker_volume - 连续音量转换",
    playback_operations: "playback_operations - 播放操作转换",
    playback_state: "playback_state - 播放状态转换",
    endpoint_health: "endpoint_health - 在线状态转换"
  }[template] || "pending - 等待通用能力包";
}

function renderCapabilityOptions(selectedId, propertyId) {
  if (!propertyId) return `<option value="">请先选择 Momcozy 物模型属性</option>`;
  const entries = compatibleCapabilities(propertyId);
  if (!entries.length) return `<option value="">当前属性没有已发布的匹配 capability</option>`;
  return `<option value="" ${selectedId ? "" : "selected"}>请选择匹配的 Alexa capability</option>${entries.map((item) => `<option value="${item.id}" ${selectedId === item.id ? "selected" : ""}>${item.id}</option>`).join("")}`;
}

function renderFieldTags(tags) {
  return `<div class="field-type-tags">${tags.map(([label, type]) => `<span class="field-type-tag field-type-tag--${type}">${escapeHtml(label)}</span>`).join("")}</div>`;
}

function renderModeMappings(capability, property, capabilityIndex) {
  const mappings = resolvedModeMappings(capability, property);
  const entries = enumEntries(property);
  if (!entries.length) return `<div class="mapping-empty">当前属性未登记枚举值，不能用于 ModeController。</div>`;
  const options = resourcesFor("ModeController", "mode");
  return `<section class="mode-mapping"><div class="mode-mapping__heading"><strong>枚举映射</strong><span>产品选择 Alexa Value；平台按 Capability + Alexa Value 自动关联多语言 Resource KV。</span></div><div class="mode-mapping-table"><div class="mode-mapping-table__head"><span>物模型原始值 / 业务含义</span><span>Alexa Value <b>*</b></span><span>Resource KV</span><span>语音名称预览</span></div>${mappings.map((mapping, mappingIndex) => { const resource = modeResourceFor("ModeController", mapping.alexaValue); const entry = entries.find((item) => item.value === String(mapping.modelValue)); return `<div class="mode-mapping-row"><div><code>${escapeHtml(mapping.modelValue)}</code><small>${escapeHtml(entry?.label || "未定义")}</small></div><select class="el-select" data-capability-index="${capabilityIndex}" data-mode-mapping-index="${mappingIndex}" data-mode-mapping-field="alexaValue"><option value="">请选择 Alexa Value</option>${options.map((item) => `<option value="${item.modeValue}" ${item.modeValue === mapping.alexaValue ? "selected" : ""}>${item.modeValue} · ${item.values["en-US"] || item.key}</option>`).join("")}</select><code class="mode-value-preview">${escapeHtml(resource?.key || "自动查询")}</code><div class="resource-preview">${resource ? `<strong>${escapeHtml(resource.values["en-US"] || "--")}</strong><span>de-DE: ${escapeHtml(resource.values["de-DE"] || "未配置")}</span>` : `<span>选择后预览 en-US / de-DE</span>`}</div></div>`; }).join("")}</div><p class="mode-mapping__help">IoT 原始 int 只传给 IoT 云；Alexa 只接收 Alexa Value。Resource Key 与 Locale 词条由平台维护，产品页面不选 Key、不录入翻译。只有“可写且可查询”的离散枚举可选择 ModeController；自动产生的内部状态应只上报或不暴露。</p></section>`;
}

function renderMappingSection(draft) {
  const readyCount = capabilityCatalog.filter((item) => item.status === "profile_ready").length;
  return `<section class="drawer-section"><div class="section-heading section-heading--row"><div><h3>能力与物模型映射 ${anchor(5)}</h3><p>先选择产品已有物模型属性，再从匹配的已发布 capability 中选择。多语言语义由平台资源库统一维护，产品映射 Alexa Value，系统自动解析 Resource KV。</p></div><button class="el-btn" data-action="add-capability">+ 添加能力</button></div><div class="mapping-list">${draft.capabilities.map((capability, index) => {
    const capabilityMeta = capabilityCatalog.find((item) => item.id === capability.id);
    const propertyMeta = modelPropertyCatalog.find((item) => item.id === capability.property);
    const matchingCapabilities = compatibleCapabilities(capability.property);
    const instanceRequired = requiresInstance(capability.id);
    const [statusLabel, statusType] = capabilityStatusLabel(capabilityMeta?.status);
    const capabilityResource = capabilityResourceFor(capability.id, capability.instance);
    const resourceField = capabilityMeta?.resourceScopes?.includes("capability") ? `<div class="form-row"><span>能力名称 Resource KV</span><div class="readonly-field">${escapeHtml(capabilityResource?.key || "将按 capability + instance 自动解析")}</div>${capabilityResource ? renderFieldTags([[`en-US：${capabilityResource.values["en-US"]}`, "success"], [`de-DE：${capabilityResource.values["de-DE"] || "未配置"}`, "info"], [`覆盖：${skillLocales.filter(([locale]) => capabilityResource.values[locale]).length}/${localePolicy.enabledLocaleCount}`, "neutral"]]) : renderFieldTags([["未找到已发布的平台资源", "warning"]])}<em>平台按 capability 与 instance 解析资源；产品页面不选择 Key、不录入翻译。</em></div>` : "";
    const propertyOption = (item) => `${item.id} · ${item.label} · ${item.type}${item.valueKind === "enum" ? " / 枚举" : ""}${item.unit !== "-" ? ` / ${item.unit}` : ""}`;
    const propertyTags = propertyMeta ? [[`属性类型：${propertyMeta.type}`, "success"], [propertyMeta.valueKind === "enum" ? "值定义：离散枚举" : "值定义：连续/结构化", propertyMeta.valueKind === "enum" ? "warning" : "neutral"], [propertyMeta.writable ? "支持写入" : "只读状态，不能控制", propertyMeta.writable ? "success" : "danger"], [`匹配能力：${matchingCapabilities.length} 项`, "info"]] : [["请先选择物模型属性", "neutral"]];
    return `<article class="mapping-item"><header><strong>${capability.id || "待选择 Alexa interface"} ${index === 0 ? anchor(5) : ""}</strong><span>${capabilityMeta ? tag(statusLabel, statusType) : tag("待映射", "info")}</span><button class="op-link danger" data-action="remove-capability" data-index="${index}">移除</button></header><div class="mapping-grid"><label class="form-row"><span>Momcozy 物模型属性 <b>*</b></span><select class="el-select" data-capability-index="${index}" data-capability-field="property"><option value="">请选择已注册属性</option>${modelPropertyCatalog.map((item) => `<option value="${item.id}" ${capability.property === item.id ? "selected" : ""}>${propertyOption(item)}</option>`).join("")}</select>${renderFieldTags(propertyTags)}</label><label class="form-row"><span>Alexa interface <b>*</b></span><select class="el-select" data-capability-index="${index}" data-capability-field="id" ${!propertyMeta || !matchingCapabilities.length ? "disabled" : ""}>${renderCapabilityOptions(capability.id, capability.property)}</select>${renderFieldTags([[`数据类型：${capabilityMeta?.type || "--"}`, "info"], [`指令：${capabilityMeta?.directives?.join(" / ") || "--"}`, "neutral"], [instanceRequired ? "需要 Instance" : capabilityMeta ? "无需 Instance" : "等待 capability", instanceRequired ? "warning" : "neutral"]])}</label>${instanceRequired ? `<label class="form-row"><span>Instance <b>*</b></span><input class="el-input" data-capability-index="${index}" data-capability-field="instance" value="${escapeHtml(capability.instance)}" placeholder="例如 Crib.MotionMode" /></label>` : `<div class="form-row"><span>Instance</span><div class="readonly-field">${capabilityMeta ? "不适用" : "等待选择 capability"}</div></div>`}${resourceField}<div class="form-row"><span>映射模板 ${index === 0 ? anchor(6) : ""}</span><div class="readonly-field">${mappingTemplateLabel(capabilityMeta?.template)}</div><em>平台模板将 Alexa 指令转换为物模型读写；产品不配置 Lambda 或协议细节。</em></div>${capability.id === "ModeController" ? `<div class="form-row form-row--wide">${renderModeMappings(capability, propertyMeta, index)}</div>` : ""}${capability.id === "PlaybackController" ? `<label class="form-row form-row--wide"><span>Supported operations <b>*</b></span><input class="el-input" data-capability-index="${index}" data-capability-field="supportedOperations" value="${escapeHtml(capability.supportedOperations || "")}" placeholder="Play, Pause" /><em>首期白噪机至少声明 Play 和 Pause；状态由 PlaybackStateReporter 上报。</em></label>` : ""}</div></article>`;
  }).join("")}</div></section>`;
}

function renderReportingSection(draft) {
  return `<section class="drawer-section"><div class="section-heading"><h3>状态报告 ${anchor(7)}</h3><p>首期统一由 Adapter 支持 Alexa 主动状态查询；最终状态不能由“云已受理”替代。</p></div><div class="reporting-card"><label class="form-row"><span>状态数据源</span><select class="el-select" data-reporting="source"><option value="device_reported" ${draft.reporting.source === "device_reported" ? "selected" : ""}>device_reported（设备上报）</option><option value="cloud_derived" ${draft.reporting.source === "cloud_derived" ? "selected" : ""}>cloud_derived（云端派生）</option></select><em>仅允许平台登记的状态源；不允许配置外部请求。</em></label><label class="switch-row"><input type="checkbox" data-reporting="stateReport" ${draft.reporting.stateReport ? "checked" : ""}/><span class="switch-control"></span><span><strong>StateReport</strong><small>Alexa 查询状态时从物模型读取并转换。</small></span></label><label class="switch-row switch-row--disabled"><input type="checkbox" disabled/><span class="switch-control"></span><span><strong>ChangeReport（首期预留）</strong><small>schema 保留；首期不可启用，平台不向 Alexa 主动发送。</small></span></label><label class="switch-row"><input type="checkbox" data-reporting="endpointHealth" ${draft.reporting.endpointHealth ? "checked" : ""}/><span class="switch-control"></span><span><strong>EndpointHealth</strong><small>设备可达性为发布必需项。</small></span></label></div></section>`;
}

function renderPublishSection(draft) {
  const validation = state.editor.validation;
  return `<section class="drawer-section"><div class="section-heading"><h3>校验与发布 ${anchor(3)}</h3><p>当前环境由部署域名确定。测试验证使用独立测试域名；无需在产品 Profile 选择目标环境。</p></div><div class="release-grid"><div class="release-readonly"><span>生效环境</span><strong>当前部署环境</strong><em>测试域名与生产域名由平台部署配置维护。</em></div><div class="release-readonly"><span>回滚基线</span><strong>上一个已发布 Profile 版本</strong><em>回滚仅恢复当前环境版本，不删除映射。</em></div></div>${validation ? renderValidation(validation) : `<div class="validation-placeholder"><strong>尚未运行校验</strong><p>检查字段映射、instance、类型/单位、报告策略与版本兼容。</p></div>`}</section>`;
}

function renderValidation(validation) {
  const errors = validation.errors.map((item) => `<li class="validation-error">${escapeHtml(item)}</li>`).join("");
  const warnings = validation.warnings.map((item) => `<li class="validation-warning">${escapeHtml(item)}</li>`).join("");
  return `<div class="validation-result ${validation.passed ? "is-passed" : "is-failed"}"><div class="validation-result__head"><strong>${validation.passed ? "校验通过" : `校验未通过 (${validation.errors.length})`}</strong>${tag(validation.passed ? "可发布" : "需处理", validation.passed ? "success" : "danger")}</div>${validation.passed ? `<p>已满足 Adapter Contract、能力映射、报告策略与版本兼容要求。</p>` : `<ul>${errors}</ul>`}${warnings ? `<div class="validation-warning-group"><strong>建议处理</strong><ul>${warnings}</ul></div>` : ""}</div>`;
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
  if (action === "publish") { if (publishDraft()) { setToast("Profile 已发布到当前环境", "success"); closeEditor(); } else setToast("发布前必须先通过校验", "danger"); }
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
    const capability = state.editor.draft.capabilities[index];
    const property = modelPropertyCatalog.find((item) => item.id === capability?.property);
    const mappings = resolvedModeMappings(capability, property).map((item) => ({ ...item }));
    mappings[Number(target.dataset.modeMappingIndex)][target.dataset.modeMappingField] = target.value;
    updateCapability(index, "modeMappings", mappings);
    state.editor.validation = null;
    return;
  }
  if (target.dataset.field && state.editor.open) updateDraft(target.dataset.field, target.value);
  if (target.dataset.capabilityIndex !== undefined && state.editor.open) {
    const index = Number(target.dataset.capabilityIndex);
    const field = target.dataset.capabilityField;
    updateCapability(index, field, target.value);
    if (field === "property") {
      updateCapability(index, "id", "");
      updateCapability(index, "instance", "");
      updateCapability(index, "mapping", "pending");
      updateCapability(index, "modeMappings", undefined);
      updateCapability(index, "supportedOperations", undefined);
      state.editor.validation = null;
      render();
      return;
    }
    if (field === "id") {
      const catalogItem = capabilityCatalog.find((item) => item.id === target.value);
      updateCapability(index, "instance", requiresInstance(target.value) ? "" : "");
      updateCapability(index, "mapping", catalogItem?.template || "pending");
      updateCapability(index, "modeMappings", target.value === "ModeController" ? resolvedModeMappings({ instance: "" }, modelPropertyCatalog.find((item) => item.id === state.editor.draft.capabilities[index].property)) : undefined);
      if (target.value === "PlaybackController") updateCapability(index, "supportedOperations", "Play, Pause");
      else updateCapability(index, "supportedOperations", undefined);
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
