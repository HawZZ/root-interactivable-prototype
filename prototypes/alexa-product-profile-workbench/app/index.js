import {
  capabilityCatalog,
  closeEditor,
  closeHandlerEditor,
  closeModal,
  completeAuth,
  completeDiscovery,
  dashboard,
  filteredProfiles,
  getProfile,
  handlerData,
  logData,
  openEditor,
  openHandlerEditor,
  productData,
  publishDraft,
  rollbackProfile,
  runValidation,
  saveDraft,
  setConnectionScenario,
  setEditorSection,
  setFilter,
  setHighlightedAnchor,
  setMobileView,
  setPage,
  setToast,
  showModal,
  state,
  statusMeta,
  subscribe,
  submitHandler,
  updateCapability,
  updateDraft,
  updateHandlerDraft,
  addCapability,
  removeCapability,
  approveSafetyGate,
  beginAuth,
  beginDiscovery
} from "./state.js?v=20260806h";
import { $, anchor, escapeHtml, statusClass, tag } from "./dom.js";

const sections = [
  ["basic", "基础信息"],
  ["mapping", "能力与映射"],
  ["reporting", "状态报告"],
  ["gate", "发布门禁"],
  ["release", "发布策略"]
];

const annotations = {
  profiles: {
    context: "Profiles / Alexa Product Profile",
    summary: "产品 Profile 是把 Momcozy 产品物模型映射为 Alexa Endpoint 的配置单元；同一 Adapter 可以服务多个产品。",
    items: [
      { n: 1, title: "Profile 列表与范围", location: "关联位置：Alexa Product Profile > 页面标题", fields: [["说明", "按产品型号维护 Alexa Endpoint、能力集合与发布状态；不是为每个产品复制一套 Lambda。"], ["交互", "点击“新建 Profile”创建草稿；点击行操作进入配置抽屉。"], ["数据来源", "IoT 产品模板、物模型和已登记的 Adapter 契约。"]] },
      { n: 2, title: "共享 Adapter 契约", location: "关联位置：统计区 > Shared Adapter", fields: [["说明", "Adapter 只处理 OAuth、Discovery、Directive、State/Change Report 和错误响应的通用协议。"], ["状态/差异", "直接属性映射仅配置；出现新 Alexa interface 才扩展 Adapter；复杂业务绑定受管 Handler。"], ["原型备注", "部署拆分按区域、容量、隔离或合规决定，不按单一产品决定。"]] },
      { n: 3, title: "校验与发布状态", location: "关联位置：列表 > 校验 / 状态列", fields: [["说明", "草稿、待发布、门禁阻断、已发布、已回滚是独立的可追溯状态。"], ["交互", "校验会检查物模型映射、instance、上报策略、Handler 与 Safety Gate；通过后才允许发布。"], ["异常处理", "阻断原因须可定位到字段或门禁项，不能只显示“发布失败”。"]] }
    ]
  },
  catalog: {
    context: "Capability Catalog / 受控能力目录",
    summary: "目录是 Adapter 的 allowlist。Profile 只能选择已经实现、通过回归的 interface，不能配置任意协议调用。",
    items: [
      { n: 4, title: "受控 Capability Catalog", location: "关联位置：能力目录 > Interface 列表", fields: [["说明", "每条能力定义 Discovery Schema、Directive Router、属性转换和状态报告要求。"], ["交互", "新增产品优先复用目录项；目录不存在时进入 Adapter 能力扩展评审。"], ["权限", "仅平台管理员可以新增或停用目录项。"]] },
      { n: 5, title: "配置边界", location: "关联位置：能力目录 > 使用边界", fields: [["说明", "配置可声明字段映射、值域、实例和已登记 Handler，不允许任意 URL、脚本、循环或跨设备编排。"], ["异常处理", "不在 allowlist 的 interface 或参数在校验阶段直接拒绝。"]] }
    ]
  },
  connect: {
    context: "连接与发现测试 / Staging",
    summary: "本页是测试环境的真实链路验收入口：OAuth/App-to-App 回调成功后，才允许发起 Alexa Discovery 并对比 Profile。",
    items: [
      { n: 9, title: "OAuth / App-to-App 绑定", location: "关联位置：连接与发现测试 > Step 1", fields: [["说明", "使用真实 Alexa 测试账号与 Momcozy 测试环境授权，平台只保存脱敏状态和 request id。"], ["交互", "开始绑定后进入 loading；可演示成功、用户拒绝和 redirect callback 错误。"], ["异常处理", "错误态须给出回调/客户端登记问题与重试入口，不展示 token 明文。"]] },
      { n: 10, title: "真实 Discovery 请求", location: "关联位置：连接与发现测试 > Step 2", fields: [["说明", "绑定成功才可调用测试环境的 Alexa.Discovery；生产请求不在此原型范围内。"], ["交互", "请求显示 loading、trace id、Endpoint 数和 Profile 对比结果。"], ["状态/差异", "可切换“能力不一致”和“超时”场景，用于验收错误日志与重试。"]] },
      { n: 11, title: "Discovery Diff 与 Trace", location: "关联位置：连接与发现测试 > 响应对比", fields: [["说明", "逐项对比 endpointId、interface、instance；发现少报或错报时阻断发布前验收。"], ["数据来源", "测试环境 Discovery response 与当前 Profile 草稿快照。"], ["原型备注", "正式接入需补充 OAuth Client、redirect URI、测试账号、地区和日志保留策略。"]] }
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
      { n: 14, title: "产品列表与检索", location: "关联位置：智能产品 > 列表", fields: [["说明", "按产品分类、所属App、通讯方式、产品ID 检索；字段覆盖产品型号、状态、功能版本、所属平台。"], ["交互", "行内展示 Alexa 关联列（未配置/草稿/门禁阻断/已发布），引导进入 Profile 配置。"], ["数据来源", "产品列表接口；Alexa 列由 Profile 状态映射。"]] },
      { n: 15, title: "产品与 Alexa 关联", location: "关联位置：智能产品 > Alexa 关联列", fields: [["说明", "明确产品是否已建立 Alexa Profile 及当前状态，作为配置闭环的入口。"], ["异常处理", "门禁阻断的产品在此标记，避免误以为可通过 Alexa 控制。"]] }
    ]
  },
  handlers: {
    context: "Handler 注册",
    summary: "Handler 是受管而不是自由函数：注册登记契约版本、适用范围与审核状态，Profile 只能绑定已登记、已审核的 Handler。",
    items: [
      { n: 16, title: "Handler 登记与契约", location: "关联位置：Handler 注册 > 列表", fields: [["说明", "每条 Handler 绑定固定输入输出契约版本，禁止任意函数地址；平台内置通用 Handler 与产品专用 Handler 并列。"], ["交互", "新增/停用走 Adapter Contract 评审；产品专用 Handler 需显示适用原因与审核状态。"], ["状态/差异", "generic-direct-directive 为平台内置，多产品复用；crib-motion-handler 为单产品专用。"]] },
      { n: 17, title: "审核与适用范围", location: "关联位置：Handler 注册 > 审核 / 适用范围列", fields: [["说明", "未审核的 Handler 不可被 Profile 绑定；适用范围说明 Handler 承担的云侧语义。"], ["异常处理", "待审核 Handler 在 Profile 校验中视为未通过，阻止发布。"]] }
    ]
  },
  handlerRegister: {
    context: "Handler 注册 / 登记抽屉",
    summary: "Handler 是受管而不是自由函数：登记时锁定契约版本与适用范围，提交后进入待审核，禁止登记任意函数地址。",
    items: [
      { n: 19, title: "受管登记与评审", location: "关联位置：Handler 注册 > 登记抽屉", fields: [["说明", "Handler 名称、契约版本、输入输出契约与适用范围为必填；契约版本固定，禁止任意函数地址或脚本。"], ["交互", "提交后进入「待审核」；未审核不可被 Profile 绑定，Profile 校验视为未通过。"], ["状态/差异", "平台内置 generic-direct-directive 由平台维护，不在此登记；此处仅登记产品专用 Handler。"]] }
    ]
  },
  logs: {
    context: "调用日志",
    summary: "调用日志记录 Alexa 的 Discovery / Directive / State·Change Report 调用，用于排查授权、发现与状态上报问题。",
    items: [
      { n: 18, title: "调用链路与 trace", location: "关联位置：调用日志 > 列表", fields: [["说明", "按 Profile、通道与结果展示每次 Alexa 调用；每条带 traceId 与结果摘要。"], ["交互", "异常记录（拒绝/失败）需可定位到 Profile、通道与 Safety Gate 或回调原因。"], ["数据来源", "Sandbox 调用日志；生产调用日志不在本原型范围。"]] }
    ]
  },
  drawer: {
    basic: {
      context: "配置抽屉 / 基础信息",
      summary: "Profile 是产品级声明。Adapter 名称不可由产品配置任意替换，防止绕开统一协议和审计。",
      items: [
        { n: 4, title: "产品与 Adapter 绑定", location: "关联位置：配置抽屉 > 基础信息", fields: [["说明", "产品 Key 必须绑定既有 IoT 产品；Endpoint 类型决定 Alexa Discovery 分类。"], ["校验规则", "名称和 Product Key 必填；Adapter 使用受控版本 smart-home-adapter-v2。"], ["交互", "保存草稿不发布；修改后将重新触发配置校验。"]] }
      ]
    },
    mapping: {
      context: "配置抽屉 / 能力与映射",
      summary: "每个 capability 明确绑定到物模型属性或受管 Handler，支持不同产品在同一 Adapter 下复用。",
      items: [
        { n: 5, title: "Capability 与物模型映射", location: "关联位置：配置抽屉 > 能力与映射", fields: [["说明", "一行对应一个 Alexa interface；Mode、Range、Toggle 必须有 instance。"], ["交互", "可添加目录内能力、绑定属性、选择直接映射或 Handler，并删除未使用能力。"], ["校验规则", "ModeController 必须配置 supported modes；属性为空或 instance 缺失时阻断。"]] },
        { n: 6, title: "Handler 适用边界", location: "关联位置：配置抽屉 > 映射方式", fields: [["说明", "复杂产品语义可绑定版本化 Handler；Adapter 仍统一负责协议解析、鉴权和响应格式。"], ["状态/差异", "只做值转换时使用 direct；安全校验、组合动作或确认链路时才使用 handler。"]] }
      ]
    },
    reporting: {
      context: "配置抽屉 / 状态报告",
      summary: "状态报告是语音控制闭环的一部分。Discovery 不是一次性结果，设备状态必须持续可查询、可上报。",
      items: [
        { n: 7, title: "State / Change Report 策略", location: "关联位置：配置抽屉 > 状态报告", fields: [["说明", "StateReport 用于查询，ChangeReport 在 App 或设备侧变化时更新 Alexa。"], ["交互", "可配置上报数据源和三项开关；关闭会在校验中产生警告。"], ["异常处理", "EndpointHealth 关闭时不允许发布，避免离线设备被错误显示为可控。"]] }
      ]
    },
    gate: {
      context: "配置抽屉 / 发布门禁",
      summary: "Safety Gate 是对可写高风险能力的发布限制，而不是通过 UI 文案替代真实安全审查。",
      items: [
        { n: 8, title: "Safety Gate", location: "关联位置：配置抽屉 > 发布门禁", fields: [["说明", "Smart Crib 的远程运动能力在安全批准前不得被 Discovery 为可写 endpoint。"], ["交互", "原型中的“模拟审批通过”仅验证状态机；真实审批来自硬件/安全流程。"], ["异常处理", "门禁未通过时校验明确失败，发布按钮不可用。"]] }
      ]
    },
    release: {
      context: "配置抽屉 / 发布策略",
      summary: "发布操作要求最近一次校验通过，并支持受控回滚到 Sandbox 版本。",
      items: [
        { n: 3, title: "校验、发布与回滚", location: "关联位置：配置抽屉 > 底部操作栏", fields: [["说明", "先运行校验，再发布到 Production；不通过时展示具体错误。"], ["按钮状态", "默认可保存草稿；发布仅在校验通过时可用；发布成功后列表状态变为已发布。"], ["异常处理", "回滚需二次确认，回滚后 Profile 回到 Sandbox 而非删除配置。"]] }
      ]
    }
  }
};

const pageRenderers = {
  profiles: renderProfilesPage,
  catalog: renderCatalogPage,
  connect: renderConnectPage,
  dashboard: renderDashboardPage,
  products: renderProductsPage,
  handlers: renderHandlersPage,
  logs: renderLogsPage
};

function render() {
  document.documentElement.dataset.mobileView = state.mobileView;
  $(".prototype-shell").dataset.mobileView = state.mobileView;
  renderPageHeader();
  const renderPage = pageRenderers[state.page] || renderProfilesPage;
  $("#pageRoot").innerHTML = renderPage();
  renderAnnotations();
  renderDrawer();
  renderModal();
  renderToast();
  refreshNav();
  refreshMobileTabs();
  applyHighlight();
}

function renderPageHeader() {
  const meta = {
    profiles: { crumb: "Alexa Product Profile", title: "Alexa Product Profile", copy: "管理 Momcozy 产品物模型到 Alexa Endpoint 的受控映射。", action: `<button class="el-btn el-btn--primary" data-action="new-profile">+ 新建 Profile</button>`, anchor: 1 },
    catalog: { crumb: "Alexa 能力目录", title: "Alexa Capability Catalog", copy: "维护共享 Adapter 已实现且允许被 Product Profile 选择的 capability。", action: "", anchor: 4 },
    connect: { crumb: "连接与发现测试", title: "连接与发现测试", copy: "在 Sandbox 使用测试账号验证 OAuth/App-to-App 回调和真实 Discovery 响应。", action: "", anchor: 9 },
    dashboard: { crumb: "工作台", title: "工作台", copy: "查看平台级用户、绑定设备与产品排行的概览数据。", action: "", anchor: 12 },
    products: { crumb: "智能产品", title: "智能产品", copy: "维护产品定义、功能版本与 Alexa Profile 关联状态。", action: `<button class="el-btn el-btn--primary" data-action="show-toast" data-toast="创建产品走既有 IoT 产品流程，此处为原型入口" data-toast-type="info">+ 创建产品</button>`, anchor: 13 },
    handlers: { crumb: "Handler 注册", title: "Handler 注册", copy: "登记受管 Alexa Handler 的契约版本、适用范围与审核状态。", action: `<button class="el-btn el-btn--primary" data-action="open-handler-editor">+ 注册 Handler</button>`, anchor: 14 },
    logs: { crumb: "调用日志", title: "调用日志", copy: "查询 Alexa Discovery / Directive / State·Change Report 的调用 trace 记录。", action: "", anchor: 15 }
  }[state.page] || { crumb: "Alexa Product Profile", title: "Alexa Product Profile", copy: "", action: "", anchor: 1 };
  $("#breadcrumb").innerHTML = `<span>配置中心</span><span class="breadcrumb-slash">/</span><strong>${meta.crumb}</strong>`;
  $("#pageHeader").innerHTML = `<div><div class="page-title-line"><h1>${meta.title}</h1>${anchor(meta.anchor)}</div><p>${meta.copy}</p></div><div class="page-header-actions">${meta.action}</div>`;
}

function renderProfilesPage() {
  const rows = filteredProfiles();
  const count = (status) => state.profiles.filter((profile) => profile.status === status).length;
  return `
    <section class="metrics-strip" aria-label="Profile 概览">
      <div class="metric"><span>已发布 Profile</span><strong>${count("published")}</strong></div>
      <div class="metric"><span>待校验 / 待发布</span><strong>${count("draft") + count("ready")}</strong></div>
      <div class="metric metric--alert"><span>安全门禁阻断</span><strong>${count("blocked")}</strong></div>
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
    <td class="col-ops"><button class="op-link" data-action="edit-profile" data-profile-id="${profile.id}">编辑</button><span class="op-divider">|</span><button class="op-link" data-action="validate-profile" data-profile-id="${profile.id}">校验${profile.id === "smart-crib-motion-v1" ? anchor(3) : ""}</button><span class="op-divider">|</span><button class="op-link ${profile.status === "published" ? "danger" : "is-disabled"}" data-action="rollback-open" data-profile-id="${profile.id}" ${profile.status === "published" ? "" : "disabled"}>回滚</button></td>
  </tr>`;
}

function renderCatalogPage() {
  return `<section class="catalog-layout">
    <section class="admin-panel">
      <div class="panel-heading"><div><h2>受控能力目录 ${anchor(4)}</h2><p>仅目录内已实现、已回归的 Alexa interface 可以被 Product Profile 引用。</p></div><button class="el-btn" data-action="show-toast" data-toast="目录变更需走 Adapter Contract 评审" data-toast-type="info">查看准入规则</button></div>
      <table class="el-table"><thead><tr><th>Alexa Interface</th><th>能力组</th><th>配置要求</th><th>Adapter 支持</th><th>使用边界</th></tr></thead><tbody>${capabilityCatalog.map((item, index) => `<tr><td><strong>${item.id}</strong>${index === 0 ? anchor(4) : ""}</td><td>${item.group}</td><td>${item.support}</td><td>${tag("已实现", "success")}</td><td>${item.hint}${index === 2 ? anchor(5) : ""}</td></tr>`).join("")}</tbody></table>
    </section>
    <aside class="catalog-aside"><div class="notice-card"><div class="notice-card__title">Profile 配置允许</div><ul><li>标准字段映射与值域转换</li><li>已登记 Handler 的版本绑定</li><li>State/Change Report 策略</li></ul></div><div class="notice-card notice-card--muted"><div class="notice-card__title">Profile 配置禁止</div><ul><li>任意 HTTP URL 或外部脚本</li><li>跨设备循环与编排逻辑</li><li>覆盖 OAuth、权限与安全门禁</li></ul></div></aside>
  </section>`;
}

function renderConnectPage() {
  const connection = state.connection;
  const authType = connection.authStatus === "connected" ? "success" : connection.authStatus === "loading" ? "primary" : connection.authStatus === "not_connected" ? "info" : "danger";
  const authLabel = connection.authStatus === "connected" ? "已连接" : connection.authStatus === "loading" ? "授权中" : connection.authStatus === "denied" ? "已拒绝" : connection.authStatus === "error" ? "回调异常" : "未连接";
  const discoveryType = connection.discoveryStatus === "success" ? "success" : connection.discoveryStatus === "warning" ? "warning" : connection.discoveryStatus === "error" ? "danger" : connection.discoveryStatus === "loading" ? "primary" : "info";
  const discoveryLabel = connection.discoveryStatus === "success" ? "一致" : connection.discoveryStatus === "warning" ? "存在差异" : connection.discoveryStatus === "error" ? "失败" : connection.discoveryStatus === "loading" ? "请求中" : "未执行";
  return `<section class="connect-layout">
    <div class="connect-topbar"><div class="staging-badge">STAGING</div><span>测试账号：alexa.sandbox+momcozy@example.com</span><span class="separator-dot"></span><span>Region：US</span><select class="scenario-select" data-connection-scenario><option value="match" ${connection.scenario === "match" ? "selected" : ""}>场景：响应一致</option><option value="capability_mismatch" ${connection.scenario === "capability_mismatch" ? "selected" : ""}>场景：能力不一致</option><option value="timeout" ${connection.scenario === "timeout" ? "selected" : ""}>场景：Discovery 超时</option></select></div>
    <section class="flow-panel">
      <div class="flow-step"><div class="step-index">1</div><div class="flow-step__content"><div class="flow-step__title">授权 Momcozy 账号 ${anchor(9)} ${tag(authLabel, authType)}</div><p>通过 Alexa OAuth / App-to-App 完成测试账号绑定；页面仅保留脱敏状态与 request id。</p><div class="status-surface ${statusClass(authType)}"><strong>${connection.authDetail}</strong>${connection.authRequestId ? `<span>Request ID: ${connection.authRequestId}</span>` : ""}</div><div class="flow-actions"><button class="el-btn el-btn--primary" data-action="auth-start" ${connection.authStatus === "loading" ? "disabled" : ""}>${connection.authStatus === "loading" ? "授权中..." : connection.authStatus === "connected" ? "重新授权" : "开始绑定"}</button><button class="el-btn" data-action="auth-denied" ${connection.authStatus === "loading" ? "disabled" : ""}>模拟用户拒绝</button><button class="el-btn" data-action="auth-callback-error" ${connection.authStatus === "loading" ? "disabled" : ""}>模拟回调异常</button></div></div></div>
      <div class="flow-connector"></div>
      <div class="flow-step"><div class="step-index">2</div><div class="flow-step__content"><div class="flow-step__title">请求 Alexa Discovery ${anchor(10)} ${tag(discoveryLabel, discoveryType)}</div><p>成功授权后才可从测试环境获得 endpoint 响应，并与当前 Product Profile 快照比对。</p><div class="status-surface ${statusClass(discoveryType)}"><strong>${connection.discoveryDetail}</strong>${connection.discoveryRequestId ? `<span>Trace ID: ${connection.discoveryRequestId}</span>` : ""}</div><div class="flow-actions"><button class="el-btn el-btn--primary" data-action="discovery-start" ${connection.authStatus !== "connected" || connection.discoveryStatus === "loading" ? "disabled" : ""}>${connection.discoveryStatus === "loading" ? "请求中..." : "发起 Discovery"}</button><button class="el-btn" data-action="show-toast" data-toast="生产环境调用须经发布变更单审批" data-toast-type="info">查看请求范围</button></div></div></div>
    </section>
    <section class="admin-panel discovery-panel"><div class="panel-heading"><div><h2>Discovery 响应对比 ${anchor(11)}</h2><p>Profile 快照与测试响应在 endpoint、interface 和 instance 维度的最小差异。</p></div><div class="response-counter">Endpoint ${connection.endpointCount}</div></div>${renderDiff(connection)}</section>
  </section>`;
}

function renderDiff(connection) {
  if (!connection.diff.length) return `<div class="discovery-empty"><div class="empty-state__mark">?</div><strong>尚未获得 Discovery 响应</strong><p>先完成测试账号授权，再发起 Discovery 请求。</p></div>`;
  return `<table class="el-table diff-table"><thead><tr><th>字段</th><th>Profile 期望</th><th>Discovery 实际</th><th>结果</th></tr></thead><tbody>${connection.diff.map((row) => `<tr><td>${row.field}</td><td><code>${row.expected}</code></td><td><code>${row.actual}</code></td><td>${tag(row.type === "success" ? "一致" : "差异", row.type)}</td></tr>`).join("")}</tbody></table>`;
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
  const alexaTag = (value) => value === "已发布" ? tag("Ax 已发布", "success") : value === "已配置" ? tag("Ax 已配置", "info") : value === "门禁阻断" ? tag("Ax 门禁阻断", "danger") : tag("Ax 草稿", "warning");
  return `<section class="admin-panel">
    <div class="panel-toolbar"><div class="filter-row"><input class="el-input filter-search" placeholder="搜索产品名称 / 型号 / 产品ID" /><select class="el-select" style="width:120px"><option>全部分类</option><option>Breast Pump</option><option>Night Light</option><option>Smart Crib</option><option>Sound Device</option></select><select class="el-select" style="width:120px"><option>全部通讯方式</option><option>BLE</option><option>Wi-Fi</option></select></div><div class="toolbar-note"><span class="status-dot status-dot--success"></span> 共 ${productData.length} 个产品</div></div>
    <table class="el-table"><thead><tr><th>产品名称</th><th>产品型号</th><th>产品ID</th><th>产品分类</th><th>产品状态</th><th>功能版本 / 状态</th><th>所属平台</th><th>通讯方式</th><th>Alexa 关联</th></tr></thead><tbody>${productData.map((row) => `<tr><td><strong>${row.name}</strong></td><td>${row.model}</td><td><code class="cell-code">${row.id}</code></td><td>${row.category}</td><td>${tag(row.status, row.status === "已上架" ? "success" : "warning")}</td><td>${row.version}</td><td>${row.platform}</td><td>${row.comm}</td><td>${alexaTag(row.alexa)}</td></tr>`).join("")}</tbody></table>
    <footer class="table-footer"><span>共 ${productData.length} 条</span></footer>
  </section>`;
}

function renderHandlersPage() {
  const statusTag = (status) => status === "已审核" ? tag(status, "success") : tag(status, "warning");
  return `<section class="admin-panel">
    <div class="panel-toolbar"><div class="filter-row"><input class="el-input filter-search" placeholder="搜索 Handler 名称" /><select class="el-select" style="width:120px"><option>全部状态</option><option>已审核</option><option>待审核</option></select></div><div class="toolbar-note"><span class="status-dot status-dot--success"></span> Handler 仅可绑定已登记、已审核的契约版本</div></div>
    <table class="el-table"><thead><tr><th>Handler 名称</th><th>契约版本</th><th>输入输出契约</th><th>绑定产品数</th><th>审核状态</th><th>适用范围</th><th>最近更新</th><th>更新人</th></tr></thead><tbody>${handlerData.map((row) => `<tr><td><strong>${row.id}</strong></td><td><code class="cell-code">${row.version}</code></td><td>${row.contract}</td><td>${row.products}</td><td>${statusTag(row.status)}</td><td>${row.scope}</td><td>${row.updatedAt}</td><td>${row.updatedBy}</td></tr>`).join("")}</tbody></table>
    <footer class="table-footer"><span>共 ${handlerData.length} 条</span></footer>
  </section>`;
}

function renderLogsPage() {
  const resultTag = (row) => row.status === "success" ? tag(row.result, "success") : tag(row.result, "danger");
  return `<section class="admin-panel">
    <div class="panel-toolbar"><div class="filter-row"><input class="el-input filter-search" placeholder="搜索 Profile / traceId" /><select class="el-select" style="width:120px"><option>全部通道</option><option>Discovery</option><option>Directive</option><option>StateReport</option><option>ChangeReport</option></select><select class="el-select" style="width:120px"><option>全部结果</option><option>成功</option><option>拒绝</option><option>失败</option></select></div><div class="toolbar-note"><span class="status-dot status-dot--success"></span> Sandbox 调用日志，保留 trace 维度便于排障</div></div>
    <table class="el-table"><thead><tr><th>时间</th><th>Profile</th><th>通道</th><th>结果</th><th>Trace ID</th><th>摘要</th></tr></thead><tbody>${logData.map((row) => `<tr><td>${row.time}</td><td><code class="cell-code">${row.profile}</code></td><td>${row.channel}</td><td>${resultTag(row)}</td><td><code class="cell-code">${row.traceId}</code></td><td>${row.detail}</td></tr>`).join("")}</tbody></table>
    <footer class="table-footer"><span>共 ${logData.length} 条</span></footer>
  </section>`;
}

function renderDrawer() {
  const mount = $("#drawerMount");
  if (state.handlerEditor.open) { renderHandlerDrawer(mount); return; }
  if (!state.editor.open) { mount.innerHTML = ""; return; }
  const draft = state.editor.draft;
  mount.innerHTML = `<div class="el-drawer-host is-open"><div class="el-drawer__mask" data-action="close-editor"></div><aside class="el-drawer alexa-drawer" role="dialog" aria-modal="true" aria-label="${state.editor.sourceId ? "编辑" : "新建"} Alexa Product Profile"><header class="el-drawer__header"><div><h2 class="el-drawer__title">${state.editor.sourceId ? "编辑" : "新建"} Alexa Product Profile</h2><p class="drawer-subtitle">${escapeHtml(draft.name || "未命名 Profile")} <span>/</span> ${escapeHtml(draft.productKey || "草稿")}</p></div><button class="el-drawer__close" data-action="close-editor" aria-label="关闭">x</button></header><div class="drawer-shell"><nav class="drawer-section-nav">${sections.map(([key, label], index) => `<button class="drawer-section-item ${state.editor.section === key ? "is-active" : ""}" data-action="drawer-section" data-section="${key}"><span>${index + 1}</span>${label}</button>`).join("")}</nav><div class="el-drawer__body">${renderDrawerBody(draft)}</div></div><footer class="el-drawer__footer"><button class="el-btn" data-action="close-editor">取消</button><button class="el-btn" data-action="save-draft">保存草稿</button><button class="el-btn el-btn--primary" data-action="run-validation">运行校验</button><button class="el-btn el-btn--primary" data-action="publish" ${state.editor.validation?.passed ? "" : "disabled"}>发布</button></footer></aside></div>`;
}

function renderHandlerDrawer(mount) {
  const draft = state.handlerEditor.draft;
  mount.innerHTML = `<div class="el-drawer-host is-open"><div class="el-drawer__mask" data-action="close-handler-editor"></div><aside class="el-drawer alexa-drawer" role="dialog" aria-modal="true" aria-label="注册 Alexa Handler"><header class="el-drawer__header"><div><h2 class="el-drawer__title">注册 Alexa Handler</h2><p class="drawer-subtitle">受管 Handler 登记，须通过 Adapter Contract 评审后可用</p></div><button class="el-drawer__close" data-action="close-handler-editor" aria-label="关闭">x</button></header><div class="el-drawer__body"><section class="drawer-section"><div class="section-heading"><h3>Handler 登记信息</h3><p>Handler 只能绑定已登记的契约版本，禁止登记任意函数地址或脚本来完成接入。</p></div><div class="form-grid"><label class="form-row"><span>Handler 名称 <b>*</b></span><input class="el-input" data-handler-field="id" value="${escapeHtml(draft.id)}" placeholder="例如 crib-motion-handler" /><em>作为 Profile «mapping=handler» 绑定的受管标识。</em></label><label class="form-row"><span>契约版本 <b>*</b></span><input class="el-input" data-handler-field="version" value="${escapeHtml(draft.version)}" placeholder="1.0.0" /></label><label class="form-row"><span>输入输出契约 <b>*</b></span><input class="el-input" data-handler-field="contract" value="${escapeHtml(draft.contract)}" placeholder="controller:1.2" /><em>固定输入输出契约，禁止任意函数地址。</em></label><label class="form-row"><span>适用产品 / SKU</span><input class="el-input" data-handler-field="products" value="${escapeHtml(draft.products)}" placeholder="momcozy.smart_crib.motion" /></label><label class="form-row form-row--wide"><span>适用范围 <b>*</b></span><input class="el-input" data-handler-field="scope" value="${escapeHtml(draft.scope)}" placeholder="说明 Handler 承担的云侧语义与安全校验" /></label></div><div class="handler-notice"><span class="notice-mark">i</span><span>提交后进入「待审核」。未审核的 Handler 不可被 Profile 绑定，Profile 校验视为未通过。</span></div></section></div><footer class="el-drawer__footer"><button class="el-btn" data-action="close-handler-editor">取消</button><button class="el-btn el-btn--primary" data-action="submit-handler">提交评审</button></footer></aside></div>`;
}

function renderDrawerBody(draft) {
  if (state.editor.section === "mapping") return renderMappingSection(draft);
  if (state.editor.section === "reporting") return renderReportingSection(draft);
  if (state.editor.section === "gate") return renderGateSection(draft);
  if (state.editor.section === "release") return renderReleaseSection(draft);
  return `<section class="drawer-section"><div class="section-heading"><h3>基础信息 ${anchor(4)}</h3><p>定义产品级 Profile、Endpoint 分类和共享 Adapter 版本。</p></div><div class="form-grid"><label class="form-row"><span>Profile 名称 <b>*</b></span><input class="el-input" data-field="name" value="${escapeHtml(draft.name)}" placeholder="例如 Bedside Light v1" /><em>发布后用于平台配置识别，不直接作为用户语音名称。</em></label><label class="form-row"><span>Product Key <b>*</b></span><input class="el-input" data-field="productKey" value="${escapeHtml(draft.productKey)}" placeholder="momcozy.product.v1" /><em>必须与 IoT 产品模板中的产品标识一致。</em></label><label class="form-row"><span>产品分类</span><select class="el-select" data-field="category"><option ${draft.category === "Night Light" ? "selected" : ""}>Night Light</option><option ${draft.category === "Smart Crib" ? "selected" : ""}>Smart Crib</option><option ${draft.category === "Sound Device" ? "selected" : ""}>Sound Device</option></select></label><label class="form-row"><span>Alexa Endpoint 类型</span><select class="el-select" data-field="endpointType"><option ${draft.endpointType === "LIGHT" ? "selected" : ""}>LIGHT</option><option ${draft.endpointType === "OTHER" ? "selected" : ""}>OTHER</option></select></label><label class="form-row"><span>共享 Adapter</span><input class="el-input is-readonly" value="${escapeHtml(draft.adapter)}" readonly /><em>由平台 Adapter Contract 管理，不允许 Product Profile 自定义入口。</em></label><label class="form-row"><span>支持地区 / Locale</span><input class="el-input" data-field="locale" value="${escapeHtml(draft.locale)}" placeholder="en-US, en-GB" /></label></div></section>`;
}

function renderMappingSection(draft) {
  return `<section class="drawer-section"><div class="section-heading section-heading--row"><div><h3>能力与映射 ${anchor(5)}</h3><p>添加的是已实现的 Alexa interface；每项都需要绑定物模型属性或受管 Handler。</p></div><button class="el-btn" data-action="add-capability">+ 添加能力</button></div><div class="mapping-list">${draft.capabilities.map((capability, index) => `<article class="mapping-item"><header><strong>${capability.id} ${index === 0 ? anchor(5) : ""}</strong><span>${tag(capability.mapping === "handler" ? "Handler" : "Direct", capability.mapping === "handler" ? "primary" : "info")}</span><button class="op-link danger" data-action="remove-capability" data-index="${index}">移除</button></header><div class="mapping-grid"><label class="form-row"><span>Alexa interface</span><select class="el-select" data-capability-index="${index}" data-capability-field="id">${capabilityCatalog.filter((item) => item.id !== "EndpointHealth").map((item) => `<option value="${item.id}" ${capability.id === item.id ? "selected" : ""}>${item.id}</option>`).join("")}</select></label><label class="form-row"><span>Momcozy 物模型属性 <b>*</b></span><input class="el-input" data-capability-index="${index}" data-capability-field="property" value="${escapeHtml(capability.property)}" placeholder="例如 motion_mode" /></label>${["ModeController", "RangeController", "ToggleController"].includes(capability.id) ? `<label class="form-row"><span>Instance <b>*</b></span><input class="el-input" data-capability-index="${index}" data-capability-field="instance" value="${escapeHtml(capability.instance)}" placeholder="例如 Crib.MotionMode" /></label>` : `<div class="form-row"><span>Instance</span><div class="readonly-field">不适用</div></div>`}<label class="form-row"><span>映射方式 ${index === 0 ? anchor(6) : ""}</span><select class="el-select" data-capability-index="${index}" data-capability-field="mapping"><option value="direct" ${capability.mapping === "direct" ? "selected" : ""}>direct - 标准属性转换</option><option value="handler" ${capability.mapping === "handler" ? "selected" : ""}>handler - 业务语义处理</option></select></label>${capability.id === "ModeController" ? `<label class="form-row form-row--wide"><span>Supported modes <b>*</b></span><input class="el-input" data-capability-index="${index}" data-capability-field="modes" value="${escapeHtml(capability.modes || "")}" placeholder="SLEEP, SOOTHING, PLAY" /><em>枚举值会写入 Discovery capabilityConfiguration。</em></label>` : ""}</div></article>`).join("")}</div></section>`;
}

function renderReportingSection(draft) {
  return `<section class="drawer-section"><div class="section-heading"><h3>状态报告 ${anchor(7)}</h3><p>统一由 Adapter 生成 Alexa 响应；Profile 决定数据源与哪些状态需要持续同步。</p></div><div class="reporting-card"><label class="form-row"><span>状态数据源</span><select class="el-select" data-reporting="source"><option value="device_reported" ${draft.reporting.source === "device_reported" ? "selected" : ""}>device_reported（设备上报）</option><option value="cloud_derived" ${draft.reporting.source === "cloud_derived" ? "selected" : ""}>cloud_derived（云端派生）</option></select><em>仅允许平台登记的状态源；不允许配置外部请求。</em></label><label class="switch-row"><input type="checkbox" data-reporting="stateReport" ${draft.reporting.stateReport ? "checked" : ""}/><span class="switch-control"></span><span><strong>StateReport</strong><small>Alexa 查询状态时从物模型读取并转换。</small></span></label><label class="switch-row"><input type="checkbox" data-reporting="changeReport" ${draft.reporting.changeReport ? "checked" : ""}/><span class="switch-control"></span><span><strong>ChangeReport</strong><small>App 或设备侧属性变化时向 Alexa 主动上报。</small></span></label><label class="switch-row"><input type="checkbox" data-reporting="endpointHealth" ${draft.reporting.endpointHealth ? "checked" : ""}/><span class="switch-control"></span><span><strong>EndpointHealth</strong><small>设备可达性为发布必需项。</small></span></label></div></section>`;
}

function renderGateSection(draft) {
  const gateType = draft.safetyApproved ? "success" : "danger";
  return `<section class="drawer-section"><div class="section-heading"><h3>发布门禁 ${anchor(8)}</h3><p>平台配置只能引用已经批准的安全能力；门禁结论来自外部审查流程。</p></div><div class="gate-card gate-card--${gateType}"><div><span class="gate-label">Safety Gate</span>${tag(draft.safetyApproved ? "已批准" : "未批准", gateType)}<h4>${draft.category === "Smart Crib" ? "远程运动能力审查" : "标准远程控制审查"}</h4><p>${draft.safetyApproved ? "当前 Profile 可以进入发布校验。" : "Smart Crib 远程运动仍未获得安全批准，Discovery 不得暴露可写运动能力。"}</p></div>${draft.safetyApproved ? `<span class="gate-check">PASS</span>` : `<button class="el-btn el-btn--primary" data-action="approve-gate">模拟审批通过</button>`}</div><div class="handler-binding"><div><strong>Handler 绑定</strong><p>仅 Handler 类型映射必须填写并锁定版本。</p></div><input class="el-input" data-field="handler" value="${escapeHtml(draft.handler)}" placeholder="例如 crib-motion-handler@1.1.0" /></div></section>`;
}

function renderReleaseSection(draft) {
  const validation = state.editor.validation;
  return `<section class="drawer-section"><div class="section-heading"><h3>发布策略 ${anchor(3)}</h3><p>先运行配置校验，再把当前草稿发布到 Production；每个 Profile 保留可回滚版本。</p></div><div class="release-grid"><label class="form-row"><span>目标环境</span><select class="el-select" data-field="release"><option value="sandbox" ${draft.release === "sandbox" ? "selected" : ""}>Sandbox</option><option value="production" ${draft.release === "production" ? "selected" : ""}>Production</option></select></label><div class="release-readonly"><span>回滚基线</span><strong>smart-home-adapter-v2 / 2.4.0</strong></div></div>${validation ? renderValidation(validation) : `<div class="validation-placeholder"><strong>尚未运行校验</strong><p>检查字段映射、实例、上报策略、Handler 与 Safety Gate。</p></div>`}</section>`;
}

function renderValidation(validation) {
  const errors = validation.errors.map((item) => `<li class="validation-error">${escapeHtml(item)}</li>`).join("");
  const warnings = validation.warnings.map((item) => `<li class="validation-warning">${escapeHtml(item)}</li>`).join("");
  return `<div class="validation-result ${validation.passed ? "is-passed" : "is-failed"}"><div class="validation-result__head"><strong>${validation.passed ? "校验通过" : `校验未通过 (${validation.errors.length})`}</strong>${tag(validation.passed ? "可发布" : "需处理", validation.passed ? "success" : "danger")}</div>${validation.passed ? `<p>已满足 Adapter Contract、能力映射与发布门禁要求。</p>` : `<ul>${errors}</ul>`}${warnings ? `<div class="validation-warning-group"><strong>建议处理</strong><ul>${warnings}</ul></div>` : ""}</div>`;
}

function renderAnnotations() {
  const scope = state.editor.open ? annotations.drawer[state.editor.section] : state.handlerEditor.open ? annotations.handlerRegister : annotations[state.page];
  $("#annotationContext").textContent = scope.context;
  $("#annotationSummary").textContent = scope.summary;
  $("#annotationCount").textContent = String(scope.items.length);
  $("#annotationList").innerHTML = scope.items.map((item) => `<article class="annotation-card" data-note-anchor="${item.n}"><header><span class="annotation-number">${item.n}</span><div><h3>${item.title}</h3><p>${item.location}</p></div></header><dl>${item.fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl></article>`).join("");
}

function renderModal() {
  const mount = $("#modalMount");
  if (state.modal.type !== "rollback") { mount.innerHTML = ""; return; }
  const profile = getProfile(state.modal.profileId);
  mount.innerHTML = `<div class="modal-host"><div class="modal-mask" data-action="close-modal"></div><section class="confirm-modal" role="dialog" aria-modal="true" aria-label="确认回滚"><header><h2>确认回滚 Profile</h2><button class="el-drawer__close" data-action="close-modal">x</button></header><div class="modal-body"><p>将 <strong>${escapeHtml(profile?.name || "")}</strong> 从 Production 回滚到 Sandbox。Alexa 发现配置将在下一次发布同步中恢复到上一个可用版本。</p><div class="modal-alert">此操作不会删除 Profile 或物模型映射，但会停止当前 Production 版本。</div></div><footer><button class="el-btn" data-action="close-modal">取消</button><button class="el-btn el-btn--danger" data-action="rollback-confirm" data-profile-id="${profile?.id || ""}">确认回滚</button></footer></section></div>`;
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
  document.querySelectorAll("[data-action='nav']").forEach((button) => button.classList.toggle("is-active", button.dataset.page === state.page));
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
  if (action === "open-handler-editor") openHandlerEditor();
  if (action === "close-handler-editor") closeHandlerEditor();
  if (action === "submit-handler") { const result = submitHandler(); if (result.ok) setToast("Handler 已提交评审，进入待审核", "success"); else setToast(result.reason, "danger"); }
  if (action === "edit-profile") openEditor(profileId);
  if (action === "validate-profile") { openEditor(profileId, "release"); window.setTimeout(() => { runValidation(); setToast("已完成 Profile 配置校验", state.editor.validation.passed ? "success" : "danger"); }, 0); }
  if (action === "close-editor") closeEditor();
  if (action === "drawer-section") setEditorSection(section);
  if (action === "add-capability") addCapability();
  if (action === "remove-capability") removeCapability(Number(index));
  if (action === "run-validation") { const validation = runValidation(); setToast(validation.passed ? "校验通过，可以发布" : "校验未通过，请处理阻断项", validation.passed ? "success" : "danger"); }
  if (action === "save-draft") { saveDraft(); setToast("Profile 草稿已保存", "success"); }
  if (action === "approve-gate") { approveSafetyGate(); setToast("已模拟 Safety Gate 审批通过；请重新运行校验", "info"); }
  if (action === "publish") { if (publishDraft()) { setToast("Profile 已发布到 Production", "success"); closeEditor(); } else setToast("发布前必须先通过校验", "danger"); }
  if (action === "rollback-open") showModal("rollback", profileId);
  if (action === "close-modal") closeModal();
  if (action === "rollback-confirm") { rollbackProfile(profileId); closeModal(); setToast("Profile 已回滚至 Sandbox", "success"); }
  if (action === "reset-filters") { state.filters.keyword = ""; state.filters.status = "all"; render(); }
  if (action === "show-toast") setToast(toast, toastType || "info");
  if (action === "auth-start") {
    const selectedScenario = document.querySelector("[data-connection-scenario]")?.value;
    if (selectedScenario && selectedScenario !== state.connection.scenario) setConnectionScenario(selectedScenario);
    beginAuth();
    window.setTimeout(() => completeAuth("success"), 850);
  }
  if (action === "auth-denied") completeAuth("denied");
  if (action === "auth-callback-error") completeAuth("callback_error");
  if (action === "discovery-start") {
    const selectedScenario = document.querySelector("[data-connection-scenario]")?.value;
    if (selectedScenario && selectedScenario !== state.connection.scenario) setConnectionScenario(selectedScenario);
    if (beginDiscovery()) window.setTimeout(() => completeDiscovery(), 900); else setToast("请先完成测试账号授权", "danger");
  }
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
  if (target.dataset.field && state.editor.open) updateDraft(target.dataset.field, target.value);
  if (target.dataset.capabilityIndex !== undefined && state.editor.open) updateCapability(Number(target.dataset.capabilityIndex), target.dataset.capabilityField, target.value);
  if (target.dataset.reporting && state.editor.open) updateDraft(`reporting.${target.dataset.reporting}`, target.type === "checkbox" ? target.checked : target.value);
  if (target.dataset.handlerField && state.handlerEditor.open) updateHandlerDraft(target.dataset.handlerField, target.value);
}

function handleChange(event) {
  if (event.target.dataset.connectionScenario) {
    window.setTimeout(() => {
      const scenario = document.querySelector("[data-connection-scenario]")?.value;
      if (scenario) setConnectionScenario(scenario);
    }, 0);
    return;
  }
  handleInput(event);
}

document.addEventListener("click", handleAction);
document.addEventListener("input", handleInput);
document.addEventListener("change", handleChange);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeModal(); closeEditor(); closeHandlerEditor(); } });
document.querySelectorAll("[data-mobile-view-target]").forEach((button) => button.addEventListener("click", () => setMobileView(button.dataset.mobileViewTarget)));
subscribe(render);
render();
