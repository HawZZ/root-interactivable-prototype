const clone = (value) => JSON.parse(JSON.stringify(value));
const instanceNamePattern = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;

export const localePolicy = {
  enabledLocaleCount: 18,
  baseLocale: "en-US",
  previewLocales: ["en-US", "de-DE"],
  rule: "en-US 是所有自定义资源的必填基线；目标市场 Locale 缺失时不得宣称本地语音支持。"
};

export const skillLocales = [
  ["zh-CN", "中文"], ["en-US", "英语（默认）"], ["de-DE", "德语"], ["fr-FR", "法语"], ["zh-TW", "中文繁体"], ["it-IT", "意大利语"], ["pt-BR", "葡萄牙语"], ["es-ES", "西班牙语"], ["ar-SA", "阿拉伯语"], ["vi-VN", "越南语"], ["id-ID", "印尼语"], ["th-TH", "泰语"], ["ms-MY", "马来语"], ["ja-JP", "日语"], ["ru-RU", "俄语"], ["fil-PH", "菲律宾语"], ["en-GB", "英语（英国）"], ["es-MX", "西班牙语（墨西哥）"]
];

// Platform-owned subset of Alexa's official Discovery displayCategories. Product
// profiles select one primary display category; the Adapter emits it as a one-item array.
export const endpointDisplayCategoryCatalog = [
  { id: "LIGHT", label: "LIGHT", semantic: "灯具或夜灯", status: "profile_ready" },
  { id: "SPEAKER", label: "SPEAKER", semantic: "扬声器或白噪音设备", status: "profile_ready" },
  { id: "AIR_PURIFIER", label: "AIR_PURIFIER", semantic: "空气净化器", status: "profile_ready" },
  { id: "FAN", label: "FAN", semantic: "风扇", status: "profile_ready" },
  { id: "SMARTPLUG", label: "SMARTPLUG", semantic: "智能插座", status: "profile_ready" },
  { id: "SWITCH", label: "SWITCH", semantic: "墙壁开关或独立开关", status: "profile_ready" },
  { id: "TEMPERATURE_SENSOR", label: "TEMPERATURE_SENSOR", semantic: "温度传感器", status: "profile_ready" },
  { id: "THERMOSTAT", label: "THERMOSTAT", semantic: "温控设备", status: "profile_ready" },
  { id: "OTHER", label: "OTHER", semantic: "尚无准确官方分类的设备", status: "profile_ready" }
];

// Platform-owned resource KV. Mode mappings store Alexa Values; the platform resolves the matching key.
export const resourceRegistry = [
  { key: "ModeController.CribMotionMode", scope: "capability", capability: "ModeController", instance: "Crib.MotionMode", semantic: "婴儿床运动模式名称", values: { "en-US": "Motion Mode", "de-DE": "Bewegungsmodus" }, status: "published", version: 1, usage: 1 },
  { key: "ModeController.SLEEP", scope: "mode", capability: "ModeController", modeValue: "SLEEP", semantic: "睡眠模式", values: { "en-US": "Sleep", "de-DE": "Schlafmodus" }, status: "published", version: 1, usage: 1 },
  { key: "ModeController.SOFT_ROCKING", scope: "mode", capability: "ModeController", modeValue: "SOFT_ROCKING", semantic: "轻柔摇摆模式", values: { "en-US": "Soft Rocking", "de-DE": "Sanftes Wiegen" }, status: "published", version: 1, usage: 1 },
  { key: "ModeController.PLAY", scope: "mode", capability: "ModeController", modeValue: "PLAY", semantic: "播放模式", values: { "en-US": "Play", "de-DE": "Wiedergabe" }, status: "published", version: 1, usage: 1 },
  { key: "ModeController.WorkMode", scope: "capability", capability: "ModeController", instance: "Device.WorkMode", semantic: "设备工作模式名称", values: { "en-US": "Work Mode", "de-DE": "Betriebsmodus" }, status: "published", version: 1, usage: 0 },
  { key: "ModeController.IDLE", scope: "mode", capability: "ModeController", modeValue: "IDLE", semantic: "空闲工作模式", values: { "en-US": "Idle", "de-DE": "Leerlauf" }, status: "published", version: 1, usage: 0 },
  { key: "ModeController.FULL_LOAD", scope: "mode", capability: "ModeController", modeValue: "FULL_LOAD", semantic: "满载工作模式", values: { "en-US": "Full Load", "de-DE": "Volllast" }, status: "published", version: 1, usage: 0 },
  { key: "ModeController.HALF_LOAD", scope: "mode", capability: "ModeController", modeValue: "HALF_LOAD", semantic: "半载工作模式", values: { "en-US": "Half Load", "de-DE": "Halbe Beladung" }, status: "published", version: 1, usage: 0 },
  { key: "ModeController.LOW_POWER", scope: "mode", capability: "ModeController", modeValue: "LOW_POWER", semantic: "低功率工作模式", values: { "en-US": "Low Power", "de-DE": "Niedriger Energieverbrauch" }, status: "published", version: 1, usage: 0 },
  { key: "RangeController.CribMotionIntensity", scope: "capability", capability: "RangeController", instance: "Crib.MotionIntensity", semantic: "婴儿床运动强度名称", values: { "en-US": "Motion Intensity", "de-DE": "Bewegungsintensität" }, status: "published", version: 1, usage: 1 },
  { key: "ModeController.CALM", scope: "mode", capability: "ModeController", modeValue: "CALM", semantic: "平静模式", values: { "en-US": "Calm" }, status: "draft", version: 1, usage: 0 }
];

export function getResource(key) {
  return resourceRegistry.find((item) => item.key === key);
}

export function resourcesFor(capability, scope) {
  return resourceRegistry.filter((item) => item.capability === capability && item.scope === scope && item.status === "published");
}

export function modeResourceFor(capability, modeValue) {
  return resourceRegistry.find((item) => item.capability === capability && item.scope === "mode" && item.modeValue === modeValue && item.status === "published");
}

export function capabilityResourceFor(capability, instance) {
  return resourceRegistry.find((item) => item.capability === capability && item.scope === "capability" && item.status === "published" && item.instance === instance);
}

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
  { id: "ModeController", group: "通用控制", type: "Enum", support: "Instance 必填", hint: "仅用于可写、可查询的离散模式；Catalog 要求声明 instance，并逐项映射物模型枚举值", directives: ["SetMode", "AdjustMode"], status: "profile_ready", template: "direct_property", instanceSupport: "required", resourceScopes: ["capability", "mode"], propertyKinds: ["enum"], requiresWritable: true },
  { id: "RangeController", group: "通用控制", type: "Integer / Enum", support: "Instance 可选", hint: "适用于等级、强度等通用范围；多个同类语义对象时填写 instance", directives: ["SetRangeValue", "AdjustRangeValue"], status: "profile_ready", template: "direct_property", instanceSupport: "optional", resourceScopes: ["capability"], propertyIds: ["motion_level"] },
  { id: "ToggleController", group: "通用控制", type: "Boolean", support: "Instance 可选", hint: "单设备内独立开关能力；多个同类开关语义时填写 instance", directives: ["TurnOn", "TurnOff"], status: "profile_ready", template: "direct_property", instanceSupport: "optional", resourceScopes: ["capability"], propertyTypes: ["Boolean"] },
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
  { id: "power", label: "电源开关", type: "Boolean", unit: "-", readable: true, writable: true },
  { id: "brightness", label: "夜灯亮度", type: "Integer", unit: "%", readable: true, writable: true },
  { id: "color_hsb", label: "彩灯颜色", type: "ColorHSB", unit: "HSB", readable: true, writable: true },
  { id: "motion_mode", label: "运动模式", type: "Enum", valueKind: "enum", unit: "-", readable: true, writable: true, enumValues: ["SLEEP", "SOFT_ROCKING", "PLAY"] },
  { id: "work_mode", label: "工作模式（int 枚举示例）", type: "Integer", valueKind: "enum", unit: "-", readable: true, writable: true, enumValues: [{ value: "0", label: "空闲" }, { value: "1", label: "满载" }, { value: "2", label: "半载" }, { value: "3", label: "低功率" }] },
  { id: "motion_level", label: "运动强度", type: "Integer", unit: "level", readable: true, writable: true },
  { id: "volume_0_100", label: "扬声器音量", type: "Integer", unit: "%", readable: true, writable: true },
  { id: "playback_command", label: "播放控制命令", type: "Command", unit: "-", readable: false, writable: true },
  { id: "playback_state", label: "播放状态", type: "Enum", valueKind: "enum", unit: "-", readable: true, writable: false },
  { id: "device_online", label: "设备在线状态", type: "Boolean", unit: "-", readable: true, writable: false }
];

export function enumEntries(property) {
  return (property?.enumValues || []).map((item) => typeof item === "object" ? { value: String(item.value), label: item.label || String(item.value) } : { value: String(item), label: String(item) });
}

const profiles = [
  {
    id: "bedside-light-v1",
    productId: "momcozy.bedside_light",
    name: "Bedside Light v1",
    productKey: "momcozy.bedside_light.v1",
    category: "Night Light",
    displayCategory: "LIGHT",
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
    displayCategory: "OTHER",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    status: "draft",
    updatedAt: "2026-08-04 10:42",
    updatedBy: "陈静",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [
      { id: "ModeController", instance: "Crib.MotionMode", property: "motion_mode", mapping: "direct", readOnly: false, modeMappings: [{ modelValue: "SLEEP", alexaValue: "SLEEP" }, { modelValue: "SOFT_ROCKING", alexaValue: "SOFT_ROCKING" }, { modelValue: "PLAY", alexaValue: "PLAY" }] },
      { id: "RangeController", instance: "Crib.MotionIntensity", property: "motion_level", mapping: "direct", readOnly: false, range: "1-5" }
    ]
  },
  {
    id: "white-noise-pro-v2",
    productId: "momcozy.white_noise.pro",
    name: "White Noise Pro v2",
    productKey: "momcozy.white_noise.pro.v2",
    category: "Sound Device",
    displayCategory: "SPEAKER",
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
  { id: "momcozy.w1_lite", name: "W1 Lite", model: "W1Lite", category: "Breast Pump", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "BLE", alexaSupported: false, alexa: "不支持", version: "版本1 / 已发布", updatedAt: "2026-08-02", requiredAlexaLocales: ["en-US"] },
  { id: "momcozy.bedside_light", name: "Bedside Light v1", model: "BL-01", category: "Night Light", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "Wi-Fi", alexaSupported: true, alexa: "已发布", version: "版本1 / 已发布", updatedAt: "2026-08-02", requiredAlexaLocales: ["en-US"] },
  { id: "momcozy.smart_crib.motion", name: "Smart Crib Motion", model: "CB-M", category: "Smart Crib", status: "内部测试", platform: "ROOT云", app: "momcozy", comm: "BLE", alexaSupported: true, alexa: "草稿", version: "版本2 / 草稿", updatedAt: "2026-08-04", requiredAlexaLocales: ["en-US", "de-DE"] },
  { id: "momcozy.white_noise.pro", name: "White Noise Pro v2", model: "WN-P2", category: "Sound Device", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "Wi-Fi", alexaSupported: true, alexa: "草稿", version: "版本1 / 已发布", updatedAt: "2026-08-01", requiredAlexaLocales: ["en-US"] }
];

export const logData = [
  { time: "2026-08-04 14:28:11", profile: "smart-crib-motion-v1", channel: "Discovery", result: "一致", status: "success", traceId: "disc-5c3f71d2", detail: "endpoint 3 / capability 一致" },
  { time: "2026-08-04 14:28:09", profile: "bedside-light-v1", channel: "StateReport", result: "成功", status: "success", traceId: "state-2a9f1180", detail: "brightness -> 80" },
  { time: "2026-08-04 14:27:58", profile: "smart-crib-motion-v1", channel: "Directive", result: "拒绝", status: "danger", traceId: "dir-77c1e04a", detail: "设备处于不可执行状态" },
  { time: "2026-08-04 14:27:41", profile: "white-noise-pro-v2", channel: "ReportingPolicy", result: "预留", status: "success", traceId: "cfg-9b20d3cc", detail: "ChangeReport 首期禁用，保留 schema 扩展" },
  { time: "2026-08-04 14:27:33", profile: "bedside-light-v1", channel: "Directive", result: "成功", status: "success", traceId: "dir-5e8f21b7", detail: "PowerController ON" }
];

export const state = {
  page: "products",
  detailProductId: "momcozy.w1_lite",
  profiles: clone(profiles),
  filters: { keyword: "", status: "all" },
  resourceFilters: { capability: "all", scope: "all", keyword: "" },
  editor: { open: false, section: "basic", sourceId: "", draft: null, productAlexaSupported: false, validation: null, isSaving: false },
  resourceEditor: { open: false, sourceKey: "", draft: null, validation: null },
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
  state.page = ["products", "product-detail", "resource-library"].includes(page) ? page : "products";
  state.editor.open = false;
  state.resourceEditor = { open: false, sourceKey: "", draft: null, validation: null };
  state.modal = { type: "", profileId: "", productId: "", draft: null };
  emit();
}

export function filteredResources() {
  const { capability, scope, keyword } = state.resourceFilters;
  const search = keyword.trim().toLowerCase();
  return resourceRegistry.filter((item) => {
    const matchesCapability = capability === "all" || item.capability === capability;
    const matchesScope = scope === "all" || item.scope === scope;
    const matchesKeyword = !search || [item.key, item.semantic, ...Object.values(item.values)].join(" ").toLowerCase().includes(search);
    return matchesCapability && matchesScope && matchesKeyword;
  });
}

export function setResourceFilter(key, value) {
  state.resourceFilters[key] = value;
  emit();
}

export function resetResourceFilters() {
  state.resourceFilters = { capability: "all", scope: "all", keyword: "" };
  emit();
}

export function openResourceEditor(key = "") {
  const source = key ? getResource(key) : null;
  state.resourceEditor = {
    open: true,
    sourceKey: key,
    draft: clone(source || { key: "", capability: "ModeController", scope: "mode", instance: "", modeValue: "", semantic: "", values: { "en-US": "", "de-DE": "" }, status: "draft", version: 1, usage: 0 }),
    validation: null
  };
  emit();
}

export function closeResourceEditor() {
  state.resourceEditor = { open: false, sourceKey: "", draft: null, validation: null };
  emit();
}

export function updateResourceDraft(path, value) {
  const [group, key] = path.split(".");
  if (!state.resourceEditor.draft) return;
  if (key) state.resourceEditor.draft[group][key] = value;
  else state.resourceEditor.draft[group] = value;
  state.resourceEditor.validation = null;
}

export function validateResourceDraft() {
  const draft = state.resourceEditor.draft;
  const errors = [];
  if (!/^[A-Za-z][A-Za-z0-9._-]{2,95}$/.test(draft.key?.trim() || "")) errors.push("Resource Key 须以英文字母开头，仅含字母、数字、点、下划线和连字符。");
  if (!draft.semantic?.trim()) errors.push("请填写资源语义说明，供维护者判断复用范围。");
  if (!draft.capability) errors.push("请选择所属 Alexa capability。");
  if (!draft.scope) errors.push("请选择资源范围。");
  if (draft.scope === "capability" && !instanceNamePattern.test(draft.instance?.trim() || "")) errors.push("能力名称资源须绑定 instance：1-64 位、英文字母开头，仅含字母、数字、点、下划线和连字符。");
  if (draft.scope === "mode" && !instanceNamePattern.test(draft.modeValue?.trim() || "")) errors.push("Alexa mode 值须为 1-64 位、英文字母开头，仅含字母、数字、点、下划线和连字符。它是 Discovery / Directive / StateReport 使用的机器值。");
  if (!draft.values?.[localePolicy.baseLocale]?.trim()) errors.push(`必须填写 ${localePolicy.baseLocale}（英语默认）词条。`);
  const duplicate = resourceRegistry.find((item) => item.key === draft.key && item.key !== state.resourceEditor.sourceKey);
  if (duplicate) errors.push(`Resource Key “${draft.key}” 已存在。`);
  const duplicatedModeValue = draft.scope === "mode" && resourceRegistry.find((item) => item.scope === "mode" && item.capability === draft.capability && item.modeValue === draft.modeValue && item.key !== state.resourceEditor.sourceKey);
  if (duplicatedModeValue) errors.push(`Alexa mode 值 “${draft.modeValue}” 已被 ${duplicatedModeValue.key} 使用。`);
  const duplicatedCapabilityInstance = draft.scope === "capability" && resourceRegistry.find((item) => item.scope === "capability" && item.capability === draft.capability && item.instance === draft.instance && item.key !== state.resourceEditor.sourceKey);
  if (duplicatedCapabilityInstance) errors.push(`instance “${draft.instance}” 已被 ${duplicatedCapabilityInstance.key} 绑定。`);
  state.resourceEditor.validation = { errors, passed: errors.length === 0 };
  emit();
  return state.resourceEditor.validation;
}

export function saveResourceDraft(publish = false) {
  const validation = state.resourceEditor.validation || validateResourceDraft();
  if (!validation.passed) return false;
  const draft = clone(state.resourceEditor.draft);
  draft.status = publish ? "published" : "draft";
  draft.version = state.resourceEditor.sourceKey ? (getResource(state.resourceEditor.sourceKey)?.version || 1) + 1 : 1;
  draft.usage = getResource(state.resourceEditor.sourceKey)?.usage || 0;
  const index = resourceRegistry.findIndex((item) => item.key === state.resourceEditor.sourceKey);
  if (index >= 0) resourceRegistry.splice(index, 1, draft);
  else resourceRegistry.push(draft);
  state.resourceEditor = { open: false, sourceKey: "", draft: null, validation: null };
  emit();
  return true;
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
    draft.displayCategory = product.category === "Night Light" ? "LIGHT" : product.category === "Sound Device" ? "SPEAKER" : "OTHER";
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
  const product = productData.find((item) => item.id === draft.productId);
  const requiredLocales = product?.requiredAlexaLocales || [localePolicy.baseLocale];
  const validatedResources = new Set();
  const validateResource = (key, scope, capabilityId, label) => {
    const resource = getResource(key);
    if (!resource) {
      errors.push(`多语言资源：${label} 未关联平台资源 Key。`);
      return;
    }
    if (resource.scope !== scope || resource.capability !== capabilityId) {
      errors.push(`多语言资源：${resource.key} 与 ${label} 的类型或 capability 不匹配。`);
      return;
    }
    if (resource.status !== "published") errors.push(`多语言资源：${resource.key} 尚未发布，不能被产品 Profile 引用。`);
    if (!resource.values[localePolicy.baseLocale]) errors.push(`多语言资源：${resource.key} 缺少必填 ${localePolicy.baseLocale} 基线。`);
    const missingRequired = requiredLocales.filter((locale) => !resource.values[locale]);
    if (missingRequired.length) errors.push(`多语言资源：${resource.key} 缺少目标市场 Locale ${missingRequired.join(", ")}，不能发布。`);
    const missingOptional = skillLocales.map(([locale]) => locale).filter((locale) => !requiredLocales.includes(locale) && !resource.values[locale]);
    if (missingOptional.length && !validatedResources.has(resource.key)) warnings.push(`多语言资源：${resource.key} 有 ${missingOptional.length} 个已启用 Skill Locale 未配置；不得将这些 Locale 标记为本地语音可用。`);
    validatedResources.add(resource.key);
  };
  if (!draft.name.trim()) errors.push("基础信息：Profile 名称不能为空。");
  if (!draft.productKey.trim()) errors.push("基础信息：产品 Product Key 不能为空。");
  if (!endpointDisplayCategoryCatalog.some((item) => item.id === draft.displayCategory && item.status === "profile_ready")) errors.push("基础信息：请选择平台已启用的 Alexa Endpoint 显示分类。");
  if (!state.editor.productAlexaSupported) errors.push("Alexa 配置：当前产品未启用 Alexa，不能发布 Profile。");
  if (!draft.capabilities.length) errors.push("能力与映射：至少需要配置一个可发现的 Alexa capability。");
  draft.capabilities.forEach((capability) => {
    const catalogItem = capabilityCatalog.find((item) => item.id === capability.id);
    if (!capability.id) errors.push("能力与映射：请选择与物模型属性匹配的 Alexa capability。");
    else if (!catalogItem || catalogItem.status !== "profile_ready") errors.push(`能力与映射：${capability.id} 尚未完成通用 Adapter 能力包，不能发布。`);
    if (!capability.property.trim()) errors.push(`能力与映射：${capability.id} 未绑定 Momcozy 物模型属性。`);
    const instanceSupport = catalogItem?.instanceSupport || "none";
    const instance = capability.instance?.trim() || "";
    if (instanceSupport === "required" && !instance) errors.push(`能力与映射：${capability.id} 的 Capability Catalog 要求声明 instance。`);
    if (instanceSupport === "none" && instance) errors.push(`能力与映射：${capability.id} 不支持 instance，不能填写。`);
    if (instanceSupport !== "none" && instance) {
      if (!instanceNamePattern.test(instance)) errors.push(`能力与映射：${capability.id} 的 instance 必须为 1-64 位、英文字母开头，仅可含字母、数字、点、下划线和连字符。`);
      else if (instanceOwners.has(instance)) errors.push(`能力与映射：instance “${instance}” 已被 ${instanceOwners.get(instance)} 使用；同一 Endpoint 的通用 Controller 不可重复。`);
      else instanceOwners.set(instance, capability.id);
      if (catalogItem?.resourceScopes?.includes("capability")) {
        const resource = capabilityResourceFor(capability.id, instance);
        if (!resource) errors.push(`能力与映射：${capability.id} 的 instance “${instance}” 尚未维护已发布能力名称 Resource KV。`);
        else validateResource(resource.key, "capability", capability.id, `${capability.id} 的能力名称`);
      }
    }
    if (capability.id === "ModeController") {
      const mappings = capability.modeMappings || [];
      const enumValues = enumEntries(modelPropertyCatalog.find((item) => item.id === capability.property));
      if (!enumValues.length) errors.push("能力与映射：ModeController 只能绑定已登记枚举值的物模型属性。");
      if (mappings.length !== enumValues.length) errors.push("能力与映射：ModeController 必须映射物模型的全部枚举值。");
      const modelValues = new Set();
      const alexaModeValues = new Set();
      mappings.forEach((mapping) => {
        if (!mapping.modelValue || !mapping.alexaValue) errors.push("能力与映射：每个物模型枚举值都必须映射一个 Alexa Value。");
        else if (!enumValues.some((item) => item.value === String(mapping.modelValue))) errors.push(`能力与映射：模式 “${mapping.modelValue}” 不属于已绑定物模型属性。`);
        else if (modelValues.has(mapping.modelValue)) errors.push(`能力与映射：物模型枚举值 “${mapping.modelValue}” 不可重复。`);
        else {
          modelValues.add(mapping.modelValue);
          const resource = modeResourceFor(capability.id, mapping.alexaValue);
          if (!resource) errors.push(`能力与映射：Alexa Value “${mapping.alexaValue}” 尚未维护多语言 Resource KV。`);
          else validateResource(resource.key, "mode", capability.id, `Alexa Value ${mapping.alexaValue}`);
          if (!resource?.modeValue) errors.push(`能力与映射：Alexa Value ${mapping.alexaValue} 未维护稳定机器值。`);
          else if (alexaModeValues.has(resource.modeValue)) errors.push(`能力与映射：Alexa mode 值 “${resource.modeValue}” 在同一 ModeController 中不可重复。`);
          else alexaModeValues.add(resource.modeValue);
        }
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
    displayCategory: "LIGHT",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    status: "draft",
    updatedAt: "未保存",
    updatedBy: "林宇",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [{ id: "PowerController", instance: "", property: "power", mapping: "direct", readOnly: false }]
  };
}
