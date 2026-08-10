const clone = (value) => JSON.parse(JSON.stringify(value));
const instanceNamePattern = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;

// Skill 发布治理维护此集合；产品 Profile 只能继承并补齐自定义语义。
export const enabledSkillLocales = ["en-US", "de-DE"];

export const statusMeta = {
  published: { label: "已发布", type: "success" },
  draft: { label: "草稿", type: "info" },
  blocked: { label: "校验阻断", type: "danger" },
  disabled: { label: "已停用", type: "warning" },
  ready: { label: "待发布", type: "warning" },
  rolledback: { label: "已回滚", type: "info" }
};

const profileReadyCapabilities = [
  { id: "PowerController", group: "基础控制", type: "Boolean", support: "标准映射", hint: "开关状态，直接映射 Boolean 属性", directives: ["TurnOn", "TurnOff"], status: "profile_ready", template: "direct_property", propertyIds: ["power"] },
  { id: "BrightnessController", group: "灯光", type: "Integer 0-100", support: "标准映射", hint: "亮度 0-100，支持设置和增减亮度", directives: ["SetBrightness", "AdjustBrightness"], status: "profile_ready", template: "direct_property", propertyIds: ["brightness"] },
  { id: "ColorController", group: "灯光", type: "Color HSB Object", support: "结构化映射", hint: "彩灯颜色，保持当前亮度", directives: ["SetColor"], status: "profile_ready", template: "structured_hsb", propertyIds: ["color_hsb"] },
  { id: "ModeController", group: "通用控制", type: "Enum", support: "需实例", hint: "必须声明 instance 与 supportedModes", directives: ["SetMode", "AdjustMode"], status: "profile_ready", template: "direct_property", instanceRequired: true, propertyIds: ["motion_mode"] },
  { id: "RangeController", group: "通用控制", type: "Integer / Enum", support: "需实例", hint: "适用于等级、强度等通用范围", directives: ["SetRangeValue", "AdjustRangeValue"], status: "profile_ready", template: "direct_property", instanceRequired: true, propertyIds: ["motion_level"] },
  { id: "ToggleController", group: "通用控制", type: "Boolean", support: "需实例", hint: "单设备内独立开关能力", directives: ["TurnOn", "TurnOff"], status: "profile_ready", template: "direct_property", instanceRequired: true, propertyTypes: ["Boolean"] },
  { id: "Speaker", group: "音频", type: "Integer 0-100", support: "标准音量", hint: "连续音量 0-100", directives: ["SetVolume", "AdjustVolume"], status: "profile_ready", template: "speaker_volume", propertyIds: ["volume_0_100"] },
  { id: "PlaybackController", group: "音频", type: "Command", support: "操作映射", hint: "按已声明操作控制播放", directives: ["Play", "Pause", "Stop"], status: "profile_ready", template: "playback_operations", propertyIds: ["playback_command"] },
  { id: "PlaybackStateReporter", group: "音频状态", type: "Enum", support: "状态映射", hint: "上报 PLAYING / PAUSED / STOPPED", directives: [], status: "profile_ready", template: "playback_state", propertyIds: ["playback_state"] },
  { id: "EndpointHealth", group: "状态", type: "Connectivity", support: "必选", hint: "设备在线状态上报", directives: [], status: "profile_ready", template: "endpoint_health", propertyIds: ["device_online"] }
];

const officialMetadataOnlyCapabilities = [
  "AutomationManagement", "CameraStreamController", "ChannelController", "ColorTemperatureController", "Commissionable", "ContactSensor", "Cooking", "DataController", "DeviceUsage", "DoorbellEventSource", "EqualizerController", "HumiditySensor", "InputController", "InventoryLevelSensor", "InventoryLevelUsageSensor", "InventoryUsageSensor", "KeypadController", "Launcher", "LockController", "MotionSensor", "PercentageController", "PowerLevelController", "ProactiveNotificationSource", "RecordController", "RemoteVideoPlayer", "RTCSessionController", "SceneController", "SecurityPanelController", "SeekController", "SimpleEventSource", "SmartVision.ObjectDetectionSensor", "SmartVision.SnapshotProvider", "StepSpeaker", "TemperatureSensor", "ThermostatController", "ThermostatController.Configuration", "ThermostatController.HVAC.Components", "ThermostatController.Schedule", "TimeHoldController", "UIController", "WakeOnLANController"
].map((id) => {
  const adapterReady = false;
  return {
    id,
    group: "官方预置",
    type: "待同步 schema",
    support: adapterReady ? "待发布准入" : "仅元数据",
    hint: adapterReady ? "通用 Adapter 已实现，待完成产品发布准入" : "已收录官方 capability，待通用 Adapter 能力包实现",
    directives: [],
    status: adapterReady ? "adapter_ready" : "metadata_only",
    template: "pending"
  };
});

export const capabilityCatalog = [...profileReadyCapabilities, ...officialMetadataOnlyCapabilities];

export const modelPropertyCatalog = [
  { id: "power", label: "电源开关", type: "Boolean", unit: "-" },
  { id: "brightness", label: "夜灯亮度", type: "Integer", unit: "%" },
  { id: "color_hsb", label: "彩灯颜色", type: "ColorHSB", unit: "HSB" },
  { id: "motion_mode", label: "运动模式", type: "Enum", unit: "-", enumValues: ["SLEEP", "SOOTHING", "PLAY"] },
  { id: "motion_level", label: "运动强度", type: "Integer", unit: "level" },
  { id: "volume_0_100", label: "扬声器音量", type: "Integer", unit: "%" },
  { id: "playback_command", label: "播放控制命令", type: "Command", unit: "-" },
  { id: "playback_state", label: "播放状态", type: "Enum", unit: "-" },
  { id: "device_online", label: "设备在线状态", type: "Boolean", unit: "-" }
];

const profiles = [
  {
    id: "bedside-light-v1",
    productId: "momcozy.bedside_light",
    name: "Bedside Light v1",
    productKey: "momcozy.bedside_light.v1",
    category: "Night Light",
    endpointType: "LIGHT",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    status: "published",
    updatedAt: "2026-08-02 15:18",
    updatedBy: "林宇",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [
      { id: "PowerController", instance: "", property: "power", mapping: "direct", readOnly: false },
      { id: "BrightnessController", instance: "", property: "brightness", mapping: "direct", readOnly: false }
    ]
  },
  {
    id: "smart-crib-motion-v1",
    productId: "momcozy.smart_crib.motion",
    name: "Smart Crib Motion v1",
    productKey: "momcozy.smart_crib.motion.v1",
    category: "Smart Crib",
    endpointType: "OTHER",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    status: "draft",
    updatedAt: "2026-08-04 10:42",
    updatedBy: "陈静",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [
      { id: "ModeController", instance: "Crib.MotionMode", property: "motion_mode", mapping: "direct", readOnly: false, capabilityResources: { source: "custom", localizedNames: { "en-US": { primary: "Motion", aliases: "Movement" }, "de-DE": { primary: "Bewegung", aliases: "" } } }, modeMappings: [{ modelValue: "SLEEP", alexaValue: "Crib.MotionMode.Sleep", modeResources: { source: "custom", localizedNames: { "en-US": { primary: "Sleep", aliases: "" }, "de-DE": { primary: "Schlaf", aliases: "" } } } }, { modelValue: "SOOTHING", alexaValue: "Crib.MotionMode.Soothing", modeResources: { source: "custom", localizedNames: { "en-US": { primary: "Soothing", aliases: "" }, "de-DE": { primary: "Beruhigend", aliases: "" } } } }, { modelValue: "PLAY", alexaValue: "Crib.MotionMode.Play", modeResources: { source: "custom", localizedNames: { "en-US": { primary: "Play", aliases: "" }, "de-DE": { primary: "Spiel", aliases: "" } } } }] },
      { id: "RangeController", instance: "Crib.MotionIntensity", property: "motion_level", mapping: "direct", readOnly: false, range: "1-5", capabilityResources: { source: "custom", localizedNames: { "en-US": { primary: "Motion intensity", aliases: "Rocking intensity" }, "de-DE": { primary: "Bewegungsstärke", aliases: "" } } } }
    ]
  },
  {
    id: "white-noise-pro-v2",
    productId: "momcozy.white_noise.pro",
    name: "White Noise Pro v2",
    productKey: "momcozy.white_noise.pro.v2",
    category: "Sound Device",
    endpointType: "OTHER",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    status: "draft",
    updatedAt: "2026-08-01 16:06",
    updatedBy: "王琪",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [
      { id: "PowerController", instance: "", property: "power", mapping: "direct", readOnly: false },
      { id: "Speaker", instance: "", property: "volume_0_100", mapping: "speaker_volume", readOnly: false },
      { id: "PlaybackController", instance: "", property: "playback_command", mapping: "playback_operations", readOnly: false, supportedOperations: "Play, Pause" },
      { id: "PlaybackStateReporter", instance: "", property: "playback_state", mapping: "playback_state", readOnly: true }
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
  { id: "momcozy.w1_lite", name: "W1 Lite", model: "W1Lite", category: "Breast Pump", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "BLE", alexaSupported: false, alexa: "不支持", version: "版本1 / 已发布", updatedAt: "2026-08-02" },
  { id: "momcozy.bedside_light", name: "Bedside Light v1", model: "BL-01", category: "Night Light", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "Wi-Fi", alexaSupported: true, alexa: "已发布", version: "版本1 / 已发布", updatedAt: "2026-08-02" },
  { id: "momcozy.smart_crib.motion", name: "Smart Crib Motion", model: "CB-M", category: "Smart Crib", status: "内部测试", platform: "ROOT云", app: "momcozy", comm: "BLE", alexaSupported: true, alexa: "草稿", version: "版本2 / 草稿", updatedAt: "2026-08-04" },
  { id: "momcozy.white_noise.pro", name: "White Noise Pro v2", model: "WN-P2", category: "Sound Device", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "Wi-Fi", alexaSupported: true, alexa: "草稿", version: "版本1 / 已发布", updatedAt: "2026-08-01" }
];

export const logData = [
  { time: "2026-08-04 14:28:11", profile: "smart-crib-motion-v1", channel: "Discovery", result: "一致", status: "success", traceId: "disc-5c3f71d2", detail: "endpoint 3 / capability 一致" },
  { time: "2026-08-04 14:28:09", profile: "bedside-light-v1", channel: "StateReport", result: "成功", status: "success", traceId: "state-2a9f1180", detail: "brightness -> 80" },
  { time: "2026-08-04 14:27:58", profile: "smart-crib-motion-v1", channel: "Directive", result: "拒绝", status: "danger", traceId: "dir-77c1e04a", detail: "设备处于不可执行状态" },
  { time: "2026-08-04 14:27:41", profile: "white-noise-pro-v2", channel: "ReportingPolicy", result: "预留", status: "success", traceId: "cfg-9b20d3cc", detail: "ChangeReport 首期禁用，保留 schema 扩展" },
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
  page: "products",
  detailProductId: "momcozy.w1_lite",
  profiles: clone(profiles),
  filters: { keyword: "", status: "all" },
  editor: { open: false, section: "basic", sourceId: "", draft: null, productAlexaSupported: false, validation: null, isSaving: false },
  modal: { type: "", profileId: "", productId: "", draft: null },
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
  state.page = ["products", "product-detail"].includes(page) ? page : "products";
  state.editor.open = false;
  state.modal = { type: "", profileId: "", productId: "", draft: null };
  emit();
}

export function openProductDetail(productId) {
  if (!productData.some((product) => product.id === productId)) return;
  state.detailProductId = productId;
  state.page = "product-detail";
  state.editor.open = false;
  emit();
}

export function setFilter(key, value) {
  state.filters[key] = value;
  emit();
}

export function openEditor(id = "", section = "basic") {
  const source = id ? getProfile(id) : createEmptyProfile();
  const product = productData.find((item) => item.id === source.productId);
  state.editor = { open: true, section, sourceId: id, draft: clone(source), productAlexaSupported: Boolean(product?.alexaSupported), validation: null, isSaving: false };
  emit();
}

export function openProductProfile(productId) {
  const source = state.profiles.find((profile) => profile.productId === productId);
  const product = productData.find((item) => item.id === productId);
  const draft = clone(source || createEmptyProfile());
  if (!source && product) {
    draft.productId = product.id;
    draft.productKey = product.id;
    draft.name = `${product.name} Alexa Profile`;
    draft.category = product.category;
    draft.endpointType = product.category === "Night Light" ? "LIGHT" : "OTHER";
  }
  state.editor = { open: true, section: "basic", sourceId: source?.id || "", draft, productAlexaSupported: Boolean(product?.alexaSupported), validation: null, isSaving: false };
  emit();
  return true;
}

export function closeEditor() {
  state.editor.open = false;
  state.editor.validation = null;
  emit();
}

export function setEditorSection(section) {
  if (!state.editor.productAlexaSupported && section !== "basic") return;
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
  state.editor.draft.capabilities.push({ id: "", instance: "", property: "", mapping: "pending", readOnly: false });
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
  const instanceOwners = new Map();
  const capabilityResourceOwners = new Map();
  if (!draft.name.trim()) errors.push("基础信息：Profile 名称不能为空。");
  if (!draft.productKey.trim()) errors.push("基础信息：产品 Product Key 不能为空。");
  if (!state.editor.productAlexaSupported) errors.push("Alexa 配置：当前产品未启用 Alexa，不能发布 Profile。");
  if (!draft.capabilities.length) errors.push("能力与映射：至少需要配置一个可发现的 Alexa capability。");
  draft.capabilities.forEach((capability) => {
    const catalogItem = capabilityCatalog.find((item) => item.id === capability.id);
    if (!capability.id) errors.push("能力与映射：请选择与物模型属性匹配的 Alexa capability。");
    else if (!catalogItem || catalogItem.status !== "profile_ready") errors.push(`能力与映射：${capability.id} 尚未完成通用 Adapter 能力包，不能发布。`);
    if (!capability.property.trim()) errors.push(`能力与映射：${capability.id} 未绑定 Momcozy 物模型属性。`);
    if (catalogItem?.instanceRequired) {
      const instance = capability.instance?.trim() || "";
      if (!instance) errors.push(`能力与映射：${capability.id} 必须声明 instance。`);
      else if (!instanceNamePattern.test(instance)) errors.push(`能力与映射：${capability.id} 的 instance 必须为 1-64 位、英文字母开头，仅可含字母、数字、点、下划线和连字符。`);
      else if (instanceOwners.has(instance)) errors.push(`能力与映射：instance “${instance}” 已被 ${instanceOwners.get(instance)} 使用；同一 Endpoint 的通用 Controller 不可重复。`);
      else instanceOwners.set(instance, capability.id);
      const resourceSource = capability.capabilityResources?.source || "custom";
      const localizedNames = capability.capabilityResources?.localizedNames || {};
      const assetId = capability.capabilityResources?.assetId?.trim() || "";
      const missingLocale = enabledSkillLocales.find((locale) => !localizedNames[locale]?.primary?.trim());
      const primaryName = localizedNames["en-US"]?.primary?.trim() || "";
      const uniqueResourceKey = resourceSource === "asset" ? assetId.toLowerCase() : primaryName.toLowerCase();
      if (resourceSource === "asset" && !assetId) errors.push(`能力与映射：${capability.id} 选择官方 Asset 后必须从平台 Catalog 选择 Asset。`);
      else if (resourceSource === "custom" && missingLocale) errors.push(`能力与映射：${capability.id} 必须补齐 ${missingLocale} 的能力语音主名称（capabilityResources）。`);
      else if (capabilityResourceOwners.has(uniqueResourceKey)) errors.push(`能力与映射：能力语音主名称或 Asset “${resourceSource === "asset" ? assetId : primaryName}” 已被 ${capabilityResourceOwners.get(uniqueResourceKey)} 使用；同一 Endpoint 不可重复。`);
      else capabilityResourceOwners.set(uniqueResourceKey, capability.id);
    }
    if (capability.id === "ModeController") {
      const mappings = capability.modeMappings || [];
      if (mappings.length < 2) errors.push("能力与映射：ModeController 至少需要两个完整的模式映射。");
      const modeValues = new Set();
      mappings.forEach((mapping) => {
        const modeSource = mapping.modeResources?.source || "custom";
        const modeSemantics = modeSource === "asset" ? mapping.modeResources?.assetId?.trim() : enabledSkillLocales.every((locale) => mapping.modeResources?.localizedNames?.[locale]?.primary?.trim());
        if (!mapping.modelValue || !mapping.alexaValue?.trim() || !modeSemantics) errors.push("能力与映射：每个模式都必须配置物模型枚举值、Alexa mode 值，以及每个已启用 Locale 的模式语义（官方 Asset 或自定义 Friendly Name）。");
        else if (modeValues.has(mapping.alexaValue.trim())) errors.push(`能力与映射：Alexa mode 值 “${mapping.alexaValue.trim()}” 不可重复。`);
        else modeValues.add(mapping.alexaValue.trim());
      });
    }
    if (capability.id === "PlaybackController" && !["Play", "Pause"].every((operation) => capability.supportedOperations?.split(",").map((item) => item.trim()).includes(operation))) errors.push("能力与映射：PlaybackController 必须声明 Play 和 Pause 操作。");
  });
  if (!draft.reporting.stateReport || !draft.reporting.endpointHealth) warnings.push("状态报告：建议同时启用 StateReport 与 EndpointHealth，避免 Alexa 显示过期状态。");
  if (draft.reporting.changeReport) errors.push("状态报告：首期不启用 proactive ChangeReport，Profile 不能打开该开关。");
  state.editor.validation = { errors, warnings, passed: errors.length === 0, checkedAt: "刚刚" };
  emit();
  return state.editor.validation;
}

export function saveDraft() {
  const draft = clone(state.editor.draft);
  const product = productData.find((item) => item.id === draft.productId);
  if (!product) return;
  const existingIndex = state.profiles.findIndex((profile) => profile.id === draft.id);
  product.alexaSupported = state.editor.productAlexaSupported;
  product.updatedAt = "2026-08-10";
  if (!product.alexaSupported) {
    product.alexa = "不支持";
    if (existingIndex >= 0) {
      state.profiles[existingIndex].status = "disabled";
    }
    state.editor.validation = null;
    emit();
    return;
  }
  if (existingIndex >= 0 && state.profiles[existingIndex].status === "disabled") draft.status = "draft";
  draft.status = draft.status === "published" ? "ready" : draft.status;
  draft.updatedAt = "2026-08-04 14:26";
  draft.updatedBy = "林宇";
  if (existingIndex >= 0) state.profiles.splice(existingIndex, 1, draft);
  else state.profiles.unshift(draft);
  product.alexa = "草稿";
  state.editor.sourceId = draft.id;
  state.editor.draft = clone(draft);
  emit();
}

export function publishDraft() {
  const validation = state.editor.validation || runValidation();
  if (!validation.passed) return false;
  const draft = clone(state.editor.draft);
  const product = productData.find((item) => item.id === draft.productId);
  if (!product || !state.editor.productAlexaSupported) return false;
  product.alexaSupported = true;
  product.alexa = "已发布";
  product.updatedAt = "2026-08-10";
  draft.status = "published";
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

export function updateProductAlexaSupport(value) {
  if (!state.editor.open) return;
  state.editor.productAlexaSupported = Boolean(value);
  state.editor.validation = null;
  emit();
}

export function rollbackProfile(id) {
  const profile = getProfile(id);
  if (!profile) return;
  profile.status = "rolledback";
  profile.updatedAt = "2026-08-04 14:31";
  emit();
}

export function showModal(type, profileId = "") {
  state.modal = { type, profileId, productId: "", draft: null };
  emit();
}

export function closeModal() {
  state.modal = { type: "", profileId: "", productId: "", draft: null };
  emit();
}

export function setToast(message, type = "success") {
  state.toast = { message, type, id: Date.now() };
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
    updatedAt: "未保存",
    updatedBy: "林宇",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [{ id: "PowerController", instance: "", property: "power", mapping: "direct", readOnly: false }]
  };
}
