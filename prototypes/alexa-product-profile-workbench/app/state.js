const clone = (value) => JSON.parse(JSON.stringify(value));

export const statusMeta = {
  published: { label: "已发布", type: "success" },
  draft: { label: "草稿", type: "info" },
  blocked: { label: "门禁阻断", type: "danger" },
  ready: { label: "待发布", type: "warning" },
  rolledback: { label: "已回滚", type: "info" }
};

export const capabilityCatalog = [
  { id: "PowerController", group: "基础控制", support: "标准映射", hint: "开关状态，直接映射 Boolean 属性" },
  { id: "BrightnessController", group: "基础控制", support: "标准映射", hint: "亮度 0-100，支持数值范围校验" },
  { id: "ModeController", group: "通用控制", support: "需实例", hint: "必须声明 instance 与 supportedModes" },
  { id: "RangeController", group: "通用控制", support: "需实例", hint: "适用于等级、强度、音量等离散范围" },
  { id: "ToggleController", group: "通用控制", support: "需实例", hint: "单设备内独立开关能力" },
  { id: "EndpointHealth", group: "状态", support: "必选", hint: "设备在线状态上报" }
];

const profiles = [
  {
    id: "bedside-light-v1",
    name: "Bedside Light v1",
    productKey: "momcozy.bedside_light.v1",
    category: "Night Light",
    endpointType: "LIGHT",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    status: "published",
    locale: "en-US, en-GB",
    release: "production",
    updatedAt: "2026-08-02 15:18",
    updatedBy: "林宇",
    safetyApproved: true,
    handler: "",
    reporting: { source: "device_reported", stateReport: true, changeReport: true, endpointHealth: true },
    capabilities: [
      { id: "PowerController", instance: "", property: "power", mapping: "direct", readOnly: false },
      { id: "BrightnessController", instance: "", property: "brightness", mapping: "direct", readOnly: false }
    ]
  },
  {
    id: "smart-crib-motion-v1",
    name: "Smart Crib Motion v1",
    productKey: "momcozy.smart_crib.motion.v1",
    category: "Smart Crib",
    endpointType: "OTHER",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    status: "blocked",
    locale: "en-US",
    release: "sandbox",
    updatedAt: "2026-08-04 10:42",
    updatedBy: "陈静",
    safetyApproved: false,
    handler: "crib-motion-handler@1.1.0",
    reporting: { source: "device_reported", stateReport: true, changeReport: true, endpointHealth: true },
    capabilities: [
      { id: "ModeController", instance: "Crib.MotionMode", property: "motion_mode", mapping: "handler", readOnly: false, modes: "SLEEP, SOOTHING, PLAY" },
      { id: "RangeController", instance: "Crib.MotionIntensity", property: "motion_level", mapping: "direct", readOnly: false, range: "1-5" }
    ]
  },
  {
    id: "white-noise-pro-v2",
    name: "White Noise Pro v2",
    productKey: "momcozy.white_noise.pro.v2",
    category: "Sound Device",
    endpointType: "OTHER",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    status: "draft",
    locale: "en-US",
    release: "sandbox",
    updatedAt: "2026-08-01 16:06",
    updatedBy: "王琪",
    safetyApproved: true,
    handler: "",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [
      { id: "PowerController", instance: "", property: "power", mapping: "direct", readOnly: false },
      { id: "RangeController", instance: "Sound.Volume", property: "volume", mapping: "direct", readOnly: false, range: "0-15" }
    ]
  }
];

export const dashboard = {
  regions: ["测试数据", "北美", "亚太", "欧洲", "中国"],
  ranges: ["近7天", "近14天", "近30天"],
  metrics: [
    { label: "注册用户", value: "128,430", delta: "+4.2%" },
    { label: "活跃用户", value: "38,215", delta: "+2.8%" },
    { label: "绑定设备", value: "96,780", delta: "+5.1%" },
    { label: "活跃设备", value: "22,904", delta: "+1.6%" }
  ],
  regionRank: [
    { region: "北美", users: "48,210", share: "37.5%" },
    { region: "欧洲", users: "31,845", share: "24.8%" },
    { region: "亚太", users: "24,672", share: "19.2%" },
    { region: "中国", users: "16,903", share: "13.2%" },
    { region: "其它", users: "6,800", share: "5.3%" }
  ],
  productRank: [
    { name: "W1 Lite", id: "momcozy.w1_lite", devices: "24,108", share: "24.9%" },
    { name: "Smart Crib Motion", id: "momcozy.smart_crib.motion", devices: "18,540", share: "19.2%" },
    { name: "Bedside Light v1", id: "momcozy.bedside_light", devices: "15,232", share: "15.7%" },
    { name: "White Noise Pro v2", id: "momcozy.white_noise.pro", devices: "9,876", share: "10.2%" },
    { name: "其它", id: "momcozy.others", devices: "29,024", share: "30.0%" }
  ]
};

export const productData = [
  { id: "momcozy.w1_lite", name: "W1 Lite", model: "W1Lite", category: "Breast Pump", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "BLE", alexa: "已配置", version: "版本1 / 已发布", updatedAt: "2026-08-02" },
  { id: "momcozy.bedside_light", name: "Bedside Light v1", model: "BL-01", category: "Night Light", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "Wi-Fi", alexa: "已发布", version: "版本1 / 已发布", updatedAt: "2026-08-02" },
  { id: "momcozy.smart_crib.motion", name: "Smart Crib Motion", model: "CB-M", category: "Smart Crib", status: "内部测试", platform: "ROOT云", app: "momcozy", comm: "BLE", alexa: "门禁阻断", version: "版本2 / 草稿", updatedAt: "2026-08-04" },
  { id: "momcozy.white_noise.pro", name: "White Noise Pro v2", model: "WN-P2", category: "Sound Device", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "Wi-Fi", alexa: "草稿", version: "版本1 / 已发布", updatedAt: "2026-08-01" }
];

export const handlerData = [
  { id: "crib-motion-handler", version: "1.1.0", contract: "controller:1.2", products: 1, status: "已审核", scope: "Smart Crib 运动模式编排 / 安全校验", updatedAt: "2026-08-04", updatedBy: "陈静" },
  { id: "multi-zone-handler", version: "0.9.0", contract: "controller:1.2", products: 0, status: "待审核", scope: "多温区组合动作与异步确认", updatedAt: "2026-08-01", updatedBy: "王琪" },
  { id: "generic-direct-directive", version: "2.4.0", contract: "adapter:2.4", products: 12, status: "已审核", scope: "标准属性 / 单位转换（平台内置）", updatedAt: "2026-07-28", updatedBy: "林宇" }
];

export const logData = [
  { time: "2026-08-04 14:28:11", profile: "smart-crib-motion-v1", channel: "Discovery", result: "一致", status: "success", traceId: "disc-5c3f71d2", detail: "endpoint 3 / capability 一致" },
  { time: "2026-08-04 14:28:09", profile: "bedside-light-v1", channel: "StateReport", result: "成功", status: "success", traceId: "state-2a9f1180", detail: "brightness -> 80" },
  { time: "2026-08-04 14:27:58", profile: "smart-crib-motion-v1", channel: "Directive", result: "拒绝", status: "danger", traceId: "dir-77c1e04a", detail: "ModeController 未通过 Safety Gate" },
  { time: "2026-08-04 14:27:41", profile: "white-noise-pro-v2", channel: "ChangeReport", result: "成功", status: "success", traceId: "chg-9b20d3cc", detail: "volume 7 -> 12" },
  { time: "2026-08-04 14:27:33", profile: "bedside-light-v1", channel: "Directive", result: "成功", status: "success", traceId: "dir-5e8f21b7", detail: "PowerController ON" }
];

export const alexaLocales = {
  note: "Amazon 官方支持语言（Custom Skills 多语言文档，17 个 locale）。Smart Home 实际可用语言以 Alexa Developer Console 当前支持为准。",
  languages: [
    { lang: "English", locales: ["en-US", "en-GB", "en-AU", "en-CA", "en-IN"] },
    { lang: "Deutsch", locales: ["de-DE"] },
    { lang: "Español", locales: ["es-ES", "es-MX", "es-US"] },
    { lang: "Français", locales: ["fr-FR", "fr-CA"] },
    { lang: "Italiano", locales: ["it-IT"] },
    { lang: "日本語", locales: ["ja-JP"] },
    { lang: "हिन्दी", locales: ["hi-IN"] },
    { lang: "Português", locales: ["pt-BR"] },
    { lang: "Nederlands", locales: ["nl-NL"] },
    { lang: "العربية", locales: ["ar-SA"] }
  ]
};

export const state = {
  page: "profiles",
  profiles: clone(profiles),
  filters: { keyword: "", status: "all" },
  editor: { open: false, section: "basic", sourceId: "", draft: null, validation: null, isSaving: false },
  handlerEditor: { open: false, draft: null },
  modal: { type: "", profileId: "" },
  connection: {
    scenario: "match",
    authStatus: "not_connected",
    authDetail: "尚未为测试账号建立 Alexa 授权。",
    authRequestId: "",
    discoveryStatus: "idle",
    discoveryDetail: "完成授权后可发起测试环境 Discovery 请求。",
    discoveryRequestId: "",
    diff: [],
    endpointCount: 0
  },
  toast: null,
  highlightedAnchor: "",
  mobileView: "product"
};

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emit() {
  listeners.forEach((listener) => listener(state));
}

export function getProfile(id) {
  return state.profiles.find((profile) => profile.id === id);
}

export function filteredProfiles() {
  const keyword = state.filters.keyword.trim().toLowerCase();
  return state.profiles.filter((profile) => {
    const matchesKeyword = !keyword || [profile.name, profile.productKey, profile.category].join(" ").toLowerCase().includes(keyword);
    const matchesStatus = state.filters.status === "all" || profile.status === state.filters.status;
    return matchesKeyword && matchesStatus;
  });
}

export function setPage(page) {
  state.page = ["profiles", "catalog", "connect", "dashboard", "products", "handlers", "logs"].includes(page) ? page : "profiles";
  state.editor.open = false;
  state.modal = { type: "", profileId: "" };
  emit();
}

export function setFilter(key, value) {
  state.filters[key] = value;
  emit();
}

export function openEditor(id = "", section = "basic") {
  const source = id ? getProfile(id) : createEmptyProfile();
  state.editor = { open: true, section, sourceId: id, draft: clone(source), validation: null, isSaving: false };
  emit();
}

export function openHandlerEditor() {
  state.handlerEditor = { open: true, draft: createEmptyHandler() };
  emit();
}

export function closeHandlerEditor() {
  state.handlerEditor.open = false;
  emit();
}

export function updateHandlerDraft(path, value) {
  state.handlerEditor.draft[path] = value;
}

export function submitHandler() {
  const draft = state.handlerEditor.draft;
  if (!draft.id.trim() || !draft.contract.trim() || !draft.scope.trim()) return { ok: false, reason: "必填项缺失：Handler 名称、输入输出契约与适用范围" };
  handlerData.unshift({ id: draft.id, version: draft.version || "1.0.0", contract: draft.contract, products: 0, status: "待审核", scope: draft.scope, updatedAt: "2026-08-04 15:02", updatedBy: "林宇" });
  state.handlerEditor.open = false;
  emit();
  return { ok: true };
}

export function closeEditor() {
  state.editor.open = false;
  state.editor.validation = null;
  emit();
}

export function setEditorSection(section) {
  state.editor.section = section;
  emit();
}

export function updateDraft(path, value) {
  const keys = path.split(".");
  let cursor = state.editor.draft;
  keys.slice(0, -1).forEach((key) => { cursor = cursor[key]; });
  cursor[keys[keys.length - 1]] = value;
}

export function updateCapability(index, key, value) {
  const capability = state.editor.draft.capabilities[index];
  if (capability) capability[key] = value;
}

export function addCapability() {
  const existing = state.editor.draft.capabilities.map((item) => item.id);
  const candidate = capabilityCatalog.find((item) => item.id !== "EndpointHealth" && !existing.includes(item.id)) || capabilityCatalog[0];
  state.editor.draft.capabilities.push({ id: candidate.id, instance: candidate.id === "PowerController" || candidate.id === "BrightnessController" ? "" : "New.Instance", property: "", mapping: "direct", readOnly: false });
  state.editor.section = "mapping";
  emit();
}

export function removeCapability(index) {
  state.editor.draft.capabilities.splice(index, 1);
  emit();
}

export function runValidation() {
  const draft = state.editor.draft;
  const errors = [];
  const warnings = [];
  if (!draft.name.trim()) errors.push("基础信息：Profile 名称不能为空。");
  if (!draft.productKey.trim()) errors.push("基础信息：产品 Product Key 不能为空。");
  if (!draft.capabilities.length) errors.push("能力与映射：至少需要配置一个可发现的 Alexa capability。");
  draft.capabilities.forEach((capability) => {
    if (!capability.property.trim()) errors.push(`能力与映射：${capability.id} 未绑定 Momcozy 物模型属性。`);
    if (["ModeController", "RangeController", "ToggleController"].includes(capability.id) && !capability.instance.trim()) errors.push(`能力与映射：${capability.id} 必须声明 instance。`);
    if (capability.id === "ModeController" && !capability.modes?.trim()) errors.push("能力与映射：ModeController 必须至少配置一个 supported mode。");
  });
  if (!draft.reporting.stateReport || !draft.reporting.endpointHealth) warnings.push("状态报告：建议同时启用 StateReport 与 EndpointHealth，避免 Alexa 显示过期状态。");
  if (draft.category === "Smart Crib" && !draft.safetyApproved) errors.push("发布门禁：Smart Crib 的远程运动能力尚未通过 Safety Gate，不能向 Alexa 发现为可写能力。");
  if (draft.capabilities.some((capability) => capability.mapping === "handler") && !draft.handler.trim()) errors.push("Handler：当前能力选择了业务 Handler，但未绑定受管 Handler 版本。");
  state.editor.validation = { errors, warnings, passed: errors.length === 0, checkedAt: "刚刚" };
  emit();
  return state.editor.validation;
}

export function saveDraft() {
  const draft = clone(state.editor.draft);
  const existingIndex = state.profiles.findIndex((profile) => profile.id === draft.id);
  draft.status = draft.status === "published" ? "ready" : draft.status;
  draft.updatedAt = "2026-08-04 14:26";
  draft.updatedBy = "林宇";
  if (existingIndex >= 0) state.profiles.splice(existingIndex, 1, draft);
  else state.profiles.unshift(draft);
  state.editor.sourceId = draft.id;
  state.editor.draft = clone(draft);
  emit();
}

export function publishDraft() {
  const validation = state.editor.validation || runValidation();
  if (!validation.passed) return false;
  const draft = clone(state.editor.draft);
  draft.status = "published";
  draft.release = "production";
  draft.updatedAt = "2026-08-04 14:28";
  draft.updatedBy = "林宇";
  const existingIndex = state.profiles.findIndex((profile) => profile.id === draft.id);
  if (existingIndex >= 0) state.profiles.splice(existingIndex, 1, draft);
  else state.profiles.unshift(draft);
  state.editor.draft = clone(draft);
  state.editor.sourceId = draft.id;
  emit();
  return true;
}

export function approveSafetyGate() {
  state.editor.draft.safetyApproved = true;
  state.editor.validation = null;
  emit();
}

export function rollbackProfile(id) {
  const profile = getProfile(id);
  if (!profile) return;
  profile.status = "rolledback";
  profile.release = "sandbox";
  profile.updatedAt = "2026-08-04 14:31";
  emit();
}

export function showModal(type, profileId = "") {
  state.modal = { type, profileId };
  emit();
}

export function closeModal() {
  state.modal = { type: "", profileId: "" };
  emit();
}

export function setToast(message, type = "success") {
  state.toast = { message, type, id: Date.now() };
  emit();
}

export function setConnectionScenario(scenario) {
  state.connection.scenario = scenario;
  state.connection.discoveryStatus = "idle";
  state.connection.discoveryDetail = "完成授权后可发起测试环境 Discovery 请求。";
  state.connection.diff = [];
  state.connection.endpointCount = 0;
  emit();
}

export function beginAuth() {
  state.connection.authStatus = "loading";
  state.connection.authDetail = "正在打开 Momcozy App-to-App 授权通道…";
  state.connection.authRequestId = "auth-9f6a23a1";
  emit();
}

export function completeAuth(outcome) {
  const connection = state.connection;
  if (outcome === "denied") {
    connection.authStatus = "denied";
    connection.authDetail = "用户在 Alexa 授权页拒绝授权，请重新发起绑定。";
  } else if (outcome === "callback_error") {
    connection.authStatus = "error";
    connection.authDetail = "授权回调校验失败：redirect_uri 与测试环境登记值不一致。";
  } else {
    connection.authStatus = "connected";
    connection.authDetail = "测试账号已完成授权，access token 已安全托管。";
  }
  emit();
}

export function unbindAuth() {
  const connection = state.connection;
  connection.authStatus = "not_connected";
  connection.authDetail = "已解绑 Alexa 授权，用户无权再控制该设备。";
  connection.authRequestId = "";
  connection.discoveryStatus = "idle";
  connection.discoveryDetail = "完成授权后可发起测试环境 Discovery 请求。";
  connection.diff = [];
  connection.endpointCount = 0;
  emit();
}

export function beginDiscovery() {
  const connection = state.connection;
  if (connection.authStatus !== "connected") return false;
  connection.discoveryStatus = "loading";
  connection.discoveryDetail = "正在调用 Alexa.Discovery（测试环境）…";
  connection.discoveryRequestId = "disc-5c3f71d2";
  emit();
  return true;
}

export function completeDiscovery() {
  const connection = state.connection;
  const isMismatch = connection.scenario === "capability_mismatch";
  const isTimeout = connection.scenario === "timeout";
  if (isTimeout) {
    connection.discoveryStatus = "error";
    connection.discoveryDetail = "请求在 8s 后超时，未收到 Discovery response。可查看 trace 并重试。";
    connection.diff = [{ field: "request", expected: "200 response", actual: "timeout", type: "danger" }];
    connection.endpointCount = 0;
  } else if (isMismatch) {
    connection.discoveryStatus = "warning";
    connection.discoveryDetail = "返回成功，但 Smart Crib 缺少 Profile 中声明的 RangeController。";
    connection.diff = [
      { field: "endpointId", expected: "smart-crib-motion-v1", actual: "smart-crib-motion-v1", type: "success" },
      { field: "ModeController.instance", expected: "Crib.MotionMode", actual: "Crib.MotionMode", type: "success" },
      { field: "RangeController.instance", expected: "Crib.MotionIntensity", actual: "missing", type: "danger" }
    ];
    connection.endpointCount = 3;
  } else {
    connection.discoveryStatus = "success";
    connection.discoveryDetail = "Discovery response 与三个已选 Product Profile 的 endpoint/capability 声明一致。";
    connection.diff = [
      { field: "endpointId", expected: "bedside-light-v1", actual: "bedside-light-v1", type: "success" },
      { field: "PowerController", expected: "declared", actual: "declared", type: "success" },
      { field: "ModeController.instance", expected: "Crib.MotionMode", actual: "Crib.MotionMode", type: "success" }
    ];
    connection.endpointCount = 3;
  }
  emit();
}

export function setHighlightedAnchor(id) {
  state.highlightedAnchor = String(id);
  emit();
}

export function setMobileView(view) {
  state.mobileView = view;
  emit();
}

function createEmptyHandler() {
  return { id: "", version: "1.0.0", contract: "controller:1.2", scope: "", products: "" };
}

function createEmptyProfile() {
  return {
    id: `new-profile-${Date.now()}`,
    name: "",
    productKey: "",
    category: "Night Light",
    endpointType: "LIGHT",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    status: "draft",
    locale: "en-US",
    release: "sandbox",
    updatedAt: "未保存",
    updatedBy: "林宇",
    safetyApproved: false,
    handler: "",
    reporting: { source: "device_reported", stateReport: true, changeReport: true, endpointHealth: true },
    capabilities: [{ id: "PowerController", instance: "", property: "power", mapping: "direct", readOnly: false }]
  };
}
