export const products = [
  { id: "prod-s12", name: "S12 Pro 吸乳器", model: "S12 Pro", presetLinks: [{ id: "message-center", label: "消息中心" }, { id: "home", label: "设备首页" }, { id: "care", label: "护理记录" }] },
  { id: "prod-air-p3", name: "Cozy Air P3", model: "Air P3", presetLinks: [{ id: "message-center", label: "消息中心" }, { id: "home", label: "设备首页" }, { id: "filter", label: "滤芯管理" }] }
];

const numeric = (id, name, group, dataType, unit, example, min, max, step) => ({ kind: "property", id, name, group, dataType, unit, example, min, max, step });
const enumeration = (id, name, group, options) => ({ kind: "property", id, name, group, dataType: "enum", options });
const bool = (id, name, group) => ({ kind: "property", id, name, group, dataType: "bool" });
const text = (id, name, group, maxLength) => ({ kind: "property", id, name, group, dataType: "string", maxLength });
const event = (id, name, group) => ({ kind: "event", id, name, group, dataType: "event" });

const s12Models = [
  numeric("milkLevel", "储奶量", "安全与告警", "int32", "ml", "180", 0, 240, 1),
  enumeration("overflowRiskLevel", "溢奶风险等级", "安全与告警", [{ value: "low", label: "低" }, { value: "medium", label: "中" }, { value: "high", label: "高" }]),
  numeric("milkTemperature", "奶液温度", "安全与告警", "float", "°C", "38.5", 0, 80, 0.1),
  bool("leakDetected", "漏液检测", "安全与告警"),
  text("errorText", "故障描述", "安全与告警", 64),
  event("milkOverflow", "储奶杯已满", "安全与告警"),
  event("motorStall", "电机堵转", "安全与告警"),
  numeric("batteryLevel", "电池电量", "设备状态", "int32", "%", "20", 0, 100, 1),
  enumeration("chargeStatus", "充电状态", "设备状态", [{ value: "charging", label: "充电中" }, { value: "full", label: "已充满" }, { value: "discharging", label: "未充电" }]),
  bool("deviceOnline", "设备在线", "设备状态"),
  text("firmwareVersion", "固件版本", "设备状态", 32),
  event("deviceRestarted", "设备重启", "设备状态"),
  enumeration("pumpMode", "吸乳模式", "泵乳过程", [{ value: "standard", label: "标准" }, { value: "stimulation", label: "刺激" }, { value: "quiet", label: "静音" }]),
  numeric("pumpDuration", "本次吸乳时长", "泵乳过程", "int32", "分钟", "30", 0, 120, 1),
  numeric("suctionLevel", "吸力档位", "泵乳过程", "int32", "档", "6", 1, 12, 1),
  event("sessionCompleted", "吸乳完成", "泵乳过程"),
  numeric("motorRuntime", "电机累计运行时长", "维护与诊断", "int64", "小时", "300", 0, 10000, 1),
  enumeration("valveHealth", "阀门健康度", "维护与诊断", [{ value: "normal", label: "正常" }, { value: "degraded", label: "衰减" }, { value: "replace", label: "需更换" }]),
  event("selfCheckFailed", "自检失败", "维护与诊断")
];

export const productSources = {
  "prod-s12": {
    thingModels: s12Models,
    countdowns: [
      { id: "feed-reminder", name: "配件清洗周期", duration: 30, unit: "天" },
      { id: "sterilize-reminder", name: "消毒提醒", duration: 12, unit: "小时" }
    ],
    consumables: [
      { id: "shield-timer", name: "吸乳罩清洗", type: "cloud-timed", typeLabel: "云端定时耗材", unit: "天" },
      { id: "valve-timer", name: "阀门清洗", type: "cloud-timed", typeLabel: "云端定时耗材", unit: "天" },
      { id: "duckbill-count", name: "鸭嘴阀寿命", type: "device-counted", typeLabel: "设备计数耗材", unit: "次" },
      { id: "storage-bag", name: "储奶袋", type: "non-counted", typeLabel: "非计数类耗材", unit: "个" }
    ]
  },
  "prod-air-p3": {
    thingModels: [numeric("pm25", "PM2.5", "空气质量", "float", "μg/m³", "75", 0, 1000, 0.1), enumeration("fanMode", "风机模式", "设备状态", [{ value: "auto", label: "自动" }, { value: "sleep", label: "睡眠" }, { value: "turbo", label: "强劲" }]), bool("deviceOnline", "设备在线", "设备状态"), event("filterBlocked", "滤芯堵塞", "维护与诊断")],
    countdowns: [{ id: "filter-dry", name: "滤芯干燥提醒", duration: 30, unit: "天" }],
    consumables: [{ id: "filter", name: "HEPA 滤芯", type: "cloud-timed", typeLabel: "云端定时耗材", unit: "天" }, { id: "carbon", name: "活性炭滤芯", type: "device-counted", typeLabel: "设备计数耗材", unit: "%" }]
  }
};

export const operatorOptions = {
  int32: ["=", "!=", ">", ">=", "<", "<="], int64: ["=", "!=", ">", ">=", "<", "<="],
  float: ["=", "!=", ">", ">=", "<", "<="], double: ["=", "!=", ">", ">=", "<", "<="],
  enum: ["=", "!=", "包含", "不包含"], bool: ["="], string: ["=", "!=", "包含", "不包含"], event: ["="]
};

export const supportedLanguages = [["en-US", "English"], ["zh-CN", "简体中文"], ["de-DE", "Deutsch"], ["fr-FR", "Français"], ["zh-TW", "繁體中文"], ["it-IT", "Italiano"], ["pt-PT", "Português"], ["es-ES", "Español"], ["ar-SA", "العربية"], ["vi-VN", "Tiếng Việt"], ["id-ID", "Bahasa Indonesia"], ["th-TH", "ไทย"], ["ms-MY", "Bahasa Melayu"], ["ja-JP", "日本語"], ["ru-RU", "Русский"], ["fil-PH", "Filipino"], ["ko-KR", "한국어"], ["nl-NL", "Nederlands"]];
export const placeholders = ["${cozyDeviceName}", "${cozyDeviceModel}", "${cozyUserEmail}", "${cozyUserFirstName}", "${cozyUserLastName}", "${cozyCountdownTimer}", "${cozyDeviceConsumableName}", "${cozyConsumableUseValue}", "${cozyConsumableRemainValue}", "${cozyConsumableUnit}"];

export const dailySummaryGroups = [
  { id: "group-clean", productId: "prod-s12", name: "清洗提醒", revision: 4, updated: "2026-08-18 15:40", values: { "en-US": { title: "Cleaning is due", body: "Your pump parts need cleaning." }, "zh-CN": { title: "该清洗配件了", body: "以下吸乳配件需要清洗。" } } },
  { id: "group-care", productId: "prod-s12", name: "保养提醒", revision: 2, updated: "2026-08-18 13:20", values: { "en-US": { title: "Care tasks for today", body: "Please check today's care items." } } },
  { id: "group-unused", productId: "prod-s12", name: "未使用示例组", revision: 1, updated: "2026-08-17 10:05", values: { "en-US": { title: "Daily reminder", body: "You have tasks scheduled today." } } }
];

export const newRule = () => ({
  id: "", productId: "prod-s12", name: "", dailySummaryGroupId: "", itemLabel: "",
  triggerType: "device", thingModelId: "milkLevel", operator: ">=", conditionValue: "180", conditionValues: [],
  cloudCountdownId: "feed-reminder", cloudThreshold: "0", consumableId: "shield-timer", consumableEvent: "low",
  timeStart: "00:00", timeEnd: "23:59", reminderMode: "each", minIntervalMinutes: "30",
  systemNotificationEnabled: false, presetLinkId: "message-center", title: "", body: "", groupRevision: 0
});

export const rules = [
  { ...newRule(), id: "R-2048", productId: "prod-s12", name: "储奶量过高提醒", trigger: "物模型：储奶量 >= 180 ml", title: "Milk overflow detected", body: "Your S12 Pro needs attention.", languages: "1", strategy: "逐条发送 · 消息中心", status: "启用", updated: "2026-08-18 15:30", thingModelId: "milkLevel", operator: ">=", conditionValue: "180" },
  { ...newRule(), id: "R-2047", productId: "prod-s12", name: "吸乳罩清洗提醒", trigger: "云端：配件清洗周期 <= 0 天", title: "Cleaning is due", body: "Your pump parts need cleaning.", languages: "2", strategy: "每日汇总 · 消息中心 + 系统通知", status: "启用", updated: "2026-08-18 15:30", dailySummaryGroupId: "group-clean", itemLabel: "Breast shields", triggerType: "cloud", cloudThreshold: "0", systemNotificationEnabled: true, groupRevision: 4 },
  { ...newRule(), id: "R-2046", productId: "prod-s12", name: "阀门清洗提醒", trigger: "耗材：阀门清洗不足", title: "Cleaning is due", body: "Your pump parts need cleaning.", languages: "2", strategy: "每日汇总 · 消息中心", status: "启用", updated: "2026-08-18 15:10", dailySummaryGroupId: "group-clean", itemLabel: "Valves", triggerType: "consumable", consumableId: "valve-timer", consumableEvent: "low", groupRevision: 4 },
  { ...newRule(), id: "R-2045", productId: "prod-s12", name: "消毒提醒", trigger: "云端：消毒提醒 <= 1 小时", title: "Care tasks for today", body: "Please check today's care items.", languages: "1", strategy: "每日汇总 · 消息中心", status: "启用", updated: "2026-08-18 14:10", dailySummaryGroupId: "group-care", itemLabel: "Sterilize pump parts", triggerType: "cloud", cloudCountdownId: "sterilize-reminder", cloudThreshold: "1", groupRevision: 2 },
  { ...newRule(), id: "R-2044", productId: "prod-s12", name: "自检失败提醒", trigger: "物模型事件：自检失败 = true", title: "Device check failed", body: "Open the app to view details.", languages: "1", strategy: "仅发送首条 · 60 分钟 · 消息中心", status: "草稿", updated: "2026-08-18 13:20", triggerType: "device", thingModelId: "selfCheckFailed", operator: "=", conditionValue: "true", reminderMode: "discard", minIntervalMinutes: "60" }
];

export const productLanguageConfig = {
  "prod-s12": { selectedLocales: ["en-US", "zh-CN"], values: {} },
  "prod-air-p3": { selectedLocales: ["en-US"], values: {} }
};

export const appState = {
  scenario: "normal", readOnly: false, annotationOpen: true, activePage: "rules", ruleStep: 1,
  selectedProductId: "prod-s12", editingRule: false, rule: newRule(), activeContentField: "title"
};
