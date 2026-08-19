export const capabilityCatalog = [
  { id: "power", label: "电源", kind: "Boolean", status: "ready", semantic: "设备开关状态", alexa: "PowerController", google: "OnOff", cardinality: "1:1" },
  { id: "brightness", label: "亮度", kind: "Integer 0-100", status: "ready", semantic: "可调光亮度", alexa: "BrightnessController", google: "Brightness", cardinality: "1:1" },
  { id: "color", label: "颜色", kind: "HSB", status: "ready", semantic: "光源颜色", alexa: "ColorController", google: "ColorSetting", cardinality: "N:1" },
  { id: "color_temperature", label: "色温", kind: "Kelvin", status: "ready", semantic: "光源色温", alexa: "ColorTemperatureController", google: "ColorSetting", cardinality: "N:1" },
  { id: "mode", label: "模式", kind: "Enum", status: "ready", semantic: "可读写离散工作模式", alexa: "ModeController", google: "Modes", cardinality: "structure" },
  { id: "toggle", label: "独立开关", kind: "Boolean", status: "ready", semantic: "设备内独立控制对象", alexa: "ToggleController", google: "Toggles", cardinality: "structure" },
  { id: "range", label: "通用范围", kind: "Integer / Enum", status: "conditional", semantic: "未具名等级或数值", alexa: "RangeController", google: "条件 Trait", cardinality: "conditional" },
  { id: "volume", label: "音量", kind: "Integer 0-100", status: "ready", semantic: "扬声器音量", alexa: "Speaker", google: "Volume", cardinality: "1:1" },
  { id: "playback", label: "播放", kind: "Command + State", status: "ready", semantic: "播放运输控制与状态", alexa: "PlaybackController + StateReporter", google: "TransportControl", cardinality: "N:1" },
  { id: "connectivity", label: "连接状态", kind: "Boolean", status: "ready", semantic: "设备可达状态", alexa: "EndpointHealth", google: "online state", cardinality: "protocol" },
  { id: "camera_stream", label: "摄像头直播", kind: "Stream", status: "ready", semantic: "视频流会话", alexa: "CameraStreamController", google: "CameraStream", cardinality: "1:1" },
  { id: "rtc_session", label: "RTC 会话", kind: "Session", status: "alexa_only", semantic: "实时音视频通话", alexa: "RTCSessionController", google: "无稳定通用对应", cardinality: "unsupported" },
  { id: "thermostat", label: "温控", kind: "Temperature", status: "metadata_only", semantic: "官方候选，尚未完成能力包", alexa: "ThermostatController", google: "TemperatureSetting", cardinality: "pending" }
];

export const profiles = [
  {
    id: "night-light-v2", name: "Bedside Light V2", product: "Bedside Light v1", productKey: "momcozy.bedside_light", deviceClass: "night_light", semanticVersion: "2.0.0", status: "draft", updatedAt: "2026-08-19 10:30", updatedBy: "林宇",
    features: [
      { id: "power", property: "power", source: "device_reported", direction: "read/write", values: "OFF / ON" },
      { id: "brightness", property: "brightness", source: "device_reported", direction: "read/write", values: "0 - 100" },
      { id: "range", property: "night_light_level", source: "device_reported", direction: "read/write", values: "1 - 5" }
    ],
    projections: {
      alexa: { status: "ready", version: "2.0.0", deviceType: "LIGHT", validations: 4, resources: "Alexa Resource KV", source: "迁移自 bedside-light-v1" },
      google: { status: "blocked", version: "0.1.0", deviceType: "action.devices.types.LIGHT", validations: 1, resources: "Google modes / synonyms", source: "Shadow compiler", blockedBy: "通用范围未声明为 FanSpeed、OpenClose、Rotation 等可投影语义" }
    }
  },
  { id: "smart-crib-v2", name: "Smart Crib Motion V2", product: "Smart Crib Motion", productKey: "momcozy.smart_crib.motion", deviceClass: "smart_crib", semanticVersion: "2.0.0", status: "draft", updatedAt: "2026-08-18 16:42", updatedBy: "陈静", features: [{ id: "mode", property: "motion_mode", source: "device_reported", direction: "read/write", values: "SLEEP / SOFT_ROCKING / PLAY" }, { id: "range", property: "motion_level", source: "device_reported", direction: "read/write", values: "1 - 5" }], projections: { alexa: { status: "ready", version: "2.0.0", deviceType: "OTHER", validations: 5, resources: "Alexa Resource KV", source: "迁移自 smart-crib-motion-v1" }, google: { status: "conditional", version: "0.1.0", deviceType: "action.devices.types.OTHER", validations: 1, resources: "Google mode names", source: "Shadow compiler", blockedBy: "motion_level 需要先指定业务语义" } } },
  { id: "white-noise-v2", name: "White Noise Pro V2", product: "White Noise Pro v2", productKey: "momcozy.white_noise.pro", deviceClass: "sound_device", semanticVersion: "2.0.0", status: "draft", updatedAt: "2026-08-18 11:06", updatedBy: "王琪", features: [{ id: "power", property: "power", source: "device_reported", direction: "read/write", values: "OFF / ON" }, { id: "volume", property: "volume_0_100", source: "device_reported", direction: "read/write", values: "0 - 100" }, { id: "playback", property: "playback_command", source: "device_reported", direction: "command", values: "PLAY / PAUSE" }], projections: { alexa: { status: "ready", version: "2.0.0", deviceType: "SPEAKER", validations: 5, resources: "Alexa Resource KV", source: "迁移自 white-noise-pro-v2" }, google: { status: "ready", version: "0.1.0", deviceType: "action.devices.types.SPEAKER", validations: 3, resources: "Google transport metadata", source: "Shadow compiler" } } }
];

export const v1Baseline = [
  { source: "bedside-light-v1", semantic: "night-light-v2", checks: ["Discovery", "Directive", "StateReport", "Resource KV"], status: "passed" },
  { source: "smart-crib-motion-v1", semantic: "smart-crib-v2", checks: ["Discovery", "Directive", "StateReport", "Resource KV"], status: "passed" },
  { source: "white-noise-pro-v2", semantic: "white-noise-v2", checks: ["Discovery", "Directive", "StateReport", "Resource KV"], status: "passed" }
];

export const state = { page: "profiles", selectedProfileId: "night-light-v2", tab: "semantic", drawer: "", toast: null, catalogScope: "semantic", fixtureRun: false, highlight: "" };

const listeners = new Set();
export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function emit() { listeners.forEach((listener) => listener(state)); }
export function setState(patch) { Object.assign(state, patch); emit(); }
export function selectedProfile() { return profiles.find((profile) => profile.id === state.selectedProfileId) || profiles[0]; }
