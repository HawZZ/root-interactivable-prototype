import {
  providerCapabilityCandidatesForSource as getProviderCapabilityCandidates,
  resolveProviderProjection as resolveProjection,
  semanticCandidatesForSource as getSemanticCandidates,
  sourceContractFor
} from "./catalog-engine.js?v=20260827v5";

const clone = (value) => JSON.parse(JSON.stringify(value));
const instanceNamePattern = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
const validationSections = ["basic", "mapping", "reporting"];

export const validationIssueContract = {
  name: "ValidationIssue",
  fields: ["id", "severity", "section", "mappingId?", "locale?", "field?", "message"]
};

function createValidationState(status = "idle") {
  return { status, issues: [], errors: [], warnings: [], passed: false, checkedAt: null };
}

function createValidationIssue(severity, section, message, location = {}) {
  const normalizedSection = validationSections.includes(section) ? section : "basic";
  const { mappingId = "", locale = "", field = "", voiceScope = "", sourceValue = "" } = location;
  return {
    id: [severity, normalizedSection, mappingId, locale, field, message].filter(Boolean).join("::"),
    severity,
    section: normalizedSection,
    mappingId,
    locale,
    field,
    voiceScope,
    sourceValue,
    message
  };
}

function commitValidation(issues) {
  const uniqueIssues = [...new Map(issues.map((issue) => [issue.id, issue])).values()];
  const errors = uniqueIssues.filter((issue) => issue.severity === "error");
  const warnings = uniqueIssues.filter((issue) => issue.severity === "warning");
  state.editor.validation = {
    status: errors.length ? "failed" : "passed",
    issues: uniqueIssues,
    errors: errors.map((issue) => issue.message),
    warnings: warnings.map((issue) => issue.message),
    passed: errors.length === 0,
    checkedAt: "刚刚"
  };
  state.editor.preserveScrollOnNextRender = true;
  emit();
  return state.editor.validation;
}

export function invalidateValidation() {
  if (!state.editor?.open) return;
  const validation = state.editor.validation;
  if (!validation || validation.status === "idle" || validation.status === "stale") return;
  state.editor.validation = createValidationState("stale");
}

export const semanticProfileContract = {
  name: "SemanticProfile",
  version: "2.0",
  phase: 1,
  activeProviders: ["alexa"],
  futureProviders: ["google_home"]
};

export const voiceLabelSetContract = {
  name: "VoiceLabelSet",
  provider: "alexa",
  fields: ["scope", "locales.*.primary", "locales.*.aliases"]
};

export const providerCapabilityMappingContract = {
  name: "ProviderCapabilityMapping",
  provider: "alexa",
  fields: ["mappingId", "sourceRef", "semanticRef", "ruleRef", "outputs", "voiceLabelSetRefs"]
};

export const semanticBindingValueContract = {
  name: "SemanticBinding.valueBindings",
  fields: ["sourceValue", "semanticValue"],
  rule: "封闭值域必须完整覆盖源值，且不同源值不得复用同一语义值。"
};

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
  { key: "ToggleController.CribChildLock", scope: "capability", capability: "ToggleController", instance: "Crib.ChildLock", semantic: "婴儿床童锁名称", values: { "en-US": "Child Lock", "de-DE": "Kindersicherung" }, status: "published", version: 1, usage: 1 },
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

async function loadCatalog(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  url.search = "v=20260827v5";
  if (url.protocol === "file:") {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(url, "utf8"));
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Catalog 加载失败：${relativePath} (${response.status})`);
  return response.json();
}

const [semanticCatalogDocument, providerCatalogDocument, projectionCatalogDocument] = await Promise.all([
  loadCatalog("../catalogs/semantic-capabilities.v1.json"),
  loadCatalog("../catalogs/provider-metadata.v2.json"),
  loadCatalog("../catalogs/projection-rules.v1.json")
]);

export const catalogVersions = {
  semantic: semanticCatalogDocument.version,
  provider: providerCatalogDocument.version,
  projection: projectionCatalogDocument.version
};
export const allowedPropertyTypes = semanticCatalogDocument.allowedPropertyTypes;
export const semanticCapabilityCatalog = semanticCatalogDocument.capabilities;
export const capabilityCatalog = providerCatalogDocument.providers.alexa.definitions;
export const providerMetadataCatalog = providerCatalogDocument.providers;
export const projectionRuleCatalog = projectionCatalogDocument.rules;

export const alexaProfileLocales = [...new Set(capabilityCatalog.flatMap((item) => item.supportedLocales || []))]
  .map((locale) => skillLocales.find(([id]) => id === locale) || [locale, locale]);

export const modelPropertyCatalog = [
  { id: "power", label: "电源开关", sourceKind: "property", type: "bool", unit: "-", readable: true, writable: true },
  { id: "brightness", label: "夜灯亮度", sourceKind: "property", type: "int", readable: true, writable: true, dataJson: "{\"step\":1,\"unit\":\"%\",\"min\":0,\"max\":100}" },
  { id: "ambient_temperature", label: "环境温度", sourceKind: "property", type: "float", readable: true, writable: false, dataJson: "{\"step\":0.5,\"unit\":\"°C\",\"min\":-20,\"max\":80}" },
  { id: "target_temperature", label: "目标温度", sourceKind: "property", type: "double", readable: true, writable: true, dataJson: "{\"step\":0.5,\"unit\":\"°C\",\"min\":5,\"max\":40}" },
  { id: "color_payload", label: "颜色与色温结构值", sourceKind: "property", type: "string", unit: "-", valueShape: "color_hsb_cct", readable: true, writable: true },
  { id: "device_label", label: "设备文本标签", sourceKind: "property", type: "string", unit: "-", valueShape: "plain_text", readable: true, writable: false },
  { id: "motion_mode", label: "运动模式", sourceKind: "property", type: "enum", unit: "-", readable: true, writable: true, enumValues: ["SLEEP", "SOFT_ROCKING", "PLAY"] },
  { id: "music_mode", label: "音乐模式", sourceKind: "property", type: "enum", unit: "-", readable: true, writable: true, enumValues: ["SLEEP", "LULLABY", "WHITE_NOISE"] },
  { id: "work_mode", label: "工作模式（数值型枚举值）", sourceKind: "property", type: "enum", unit: "-", readable: true, writable: true, enumValues: [{ value: "0", label: "空闲" }, { value: "1", label: "满载" }, { value: "2", label: "半载" }, { value: "3", label: "低功率" }] },
  { id: "motion_level", label: "运动强度", sourceKind: "property", type: "int", readable: true, writable: true, dataJson: "{\"step\":1,\"unit\":\"\",\"min\":1,\"max\":5}" },
  { id: "child_lock", label: "童锁开关", sourceKind: "property", type: "bool", unit: "-", readable: true, writable: true },
  { id: "volume_0_100", label: "扬声器音量", sourceKind: "property", type: "int", readable: true, writable: true, dataJson: "{\"step\":1,\"unit\":\"%\",\"min\":0,\"max\":100}" },
  { id: "output_power", label: "输出功率", sourceKind: "property", type: "int", readable: true, writable: true, dataJson: "{\"step\":1,\"unit\":\"%\",\"min\":0,\"max\":100}" },
  { id: "missing_step", label: "缺少步长的数值", sourceKind: "property", type: "int", readable: true, writable: true, dataJson: "{\"unit\":\"%\",\"min\":0,\"max\":100}" },
  { id: "numeric_enum", label: "连续数值枚举", sourceKind: "property", type: "enum", readable: true, writable: true, enumValues: [{ value: "0", label: "低" }, { value: "5", label: "中" }, { value: "10", label: "高" }] },
  { id: "playback_state", label: "播放状态", sourceKind: "property", type: "enum", unit: "-", readable: true, writable: false, enumValues: ["PLAYING", "PAUSED", "STOPPED"] },
  { id: "playback_state_code", label: "播放状态（数值枚举值）", sourceKind: "property", type: "enum", unit: "-", readable: true, writable: false, enumValues: [{ value: "0", label: "待机" }, { value: "1", label: "播放" }, { value: "2", label: "暂停" }] },
  { id: "device_online", label: "设备在线状态", sourceKind: "property", type: "bool", unit: "-", readable: true, writable: false },
  { id: "playback_command", label: "播放控制命令", sourceKind: "command", type: null, unit: "-", operations: ["Play", "Pause", "Stop"] }
];

export function semanticCandidatesForSource(source) {
  return getSemanticCandidates(source, semanticCapabilityCatalog);
}

export function resolveProviderProjection(binding, provider = "alexa") {
  return resolveProjection(binding, provider, projectionRuleCatalog, modelPropertyCatalog);
}

export function capabilityCandidatesForSource(source, targetLocales = [localePolicy.baseLocale], provider = "alexa") {
  const definitions = providerMetadataCatalog[provider]?.definitions || [];
  return getProviderCapabilityCandidates(source, provider, semanticCapabilityCatalog, projectionRuleCatalog, definitions, targetLocales);
}

export function enumEntries(property) {
  return (property?.enumValues || []).map((item) => typeof item === "object" ? { value: String(item.value), label: item.label || String(item.value) } : { value: String(item), label: String(item) });
}

export function valueBindingSchemaFor(property) {
  return JSON.stringify(enumEntries(property).map(({ value, label }) => [value, label]));
}

export function sourceContractFingerprintFor(property) {
  return sourceContractFor(property).schemaFingerprint;
}

export function valueBindingsFor(binding, property, candidate) {
  const mode = candidate?.valueMapping?.mode;
  if (!property || !["direct", "required"].includes(mode) || !candidate.valueMapping.allowedValues?.length) return [];
  const existing = new Map((binding?.valueBindings || []).map((item) => [String(item.sourceValue), item]));
  return enumEntries(property).map((entry) => {
    const saved = existing.get(entry.value);
    return { sourceValue: entry.value, semanticValue: saved?.semanticValue || (mode === "direct" ? entry.value : "") };
  });
}

function initializeValueBindings(binding, property, candidate) {
  const mode = candidate?.valueMapping?.mode;
  if (!property || !["direct", "required"].includes(mode) || !candidate.valueMapping.allowedValues?.length) {
    binding.valueBindings = [];
    binding.valueBindingSchema = "";
    return;
  }
  binding.valueBindings = enumEntries(property).map((entry) => ({
    sourceValue: entry.value,
    semanticValue: mode === "direct" ? entry.value : ""
  }));
  binding.valueBindingSchema = valueBindingSchemaFor(property);
}

function stableToken(value) {
  const token = String(value || "binding").replace(/[^A-Za-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return token || "binding";
}

export function stableInstanceFor(binding) {
  return `Momcozy.${stableToken(binding.mappingId || binding.bindingId)}`.slice(0, 64);
}

export function stableProviderValueFor(binding, sourceValue) {
  return `Momcozy.${stableToken(binding.mappingId || binding.bindingId)}.${stableToken(sourceValue)}`.slice(0, 64);
}

export function generatedResourceRefs(binding) {
  const resolution = resolveProviderProjection(binding, "alexa");
  const outputIds = resolution.outputs?.map((item) => item.capabilityId) || [];
  const refs = [];
  if (binding.voice?.control) refs.push(`${outputIds[0] || "Capability"}.${stableToken(binding.bindingId)}.name`);
  Object.keys(binding.voice?.values || {}).forEach((value) => refs.push(`${outputIds[0] || "Capability"}.${stableToken(binding.bindingId)}.${stableToken(value)}`));
  return refs;
}

function labelSetIssues(labelSet, locales, label) {
  return labelSetIssueDetails(labelSet, locales, label).map((item) => item.message);
}

function labelSetIssueDetails(labelSet, locales, label, location = {}) {
  const issues = [];
  locales.forEach((locale) => {
    const entry = labelSet?.locales?.[locale];
    if (!entry?.primary?.trim()) {
      issues.push({ message: `${label}缺少 ${locale} 主名称`, locale, field: "voice-primary", ...location });
      return;
    }
    const names = [entry.primary, ...(entry.aliases || [])].map((item) => item.trim().toLowerCase()).filter(Boolean);
    if (new Set(names).size !== names.length) issues.push({ message: `${label}的 ${locale} 主名称与别名重复`, locale, field: "voice-alias", ...location });
    if ((entry.aliases || []).filter((item) => item.trim()).length > 2) issues.push({ message: `${label}的 ${locale} 最多配置两个别名`, locale, field: "voice-alias", ...location });
  });
  return issues;
}

export function selectedCapabilityCandidate(binding, profile) {
  const source = modelPropertyCatalog.find((item) => item.id === binding.property);
  return capabilityCandidatesForSource(source, profile?.targetLocales || [localePolicy.baseLocale]).find((item) => `${item.rule.ruleId}@${item.rule.version}` === binding.ruleRef);
}

export function mappingIssueDetails(binding, profile) {
  const issues = [];
  const locales = profile?.targetLocales || [localePolicy.baseLocale];
  const source = modelPropertyCatalog.find((item) => item.id === binding.property);
  if (!source) return [{ message: "请选择物模型属性或命令", field: "property" }];
  if (!binding.ruleRef) return [{ message: "请选择 Alexa Capability", field: "ruleRef" }];
  const candidate = selectedCapabilityCandidate(binding, profile);
  if (!candidate) return [{ message: "所选 Capability 与当前属性不再兼容", field: "ruleRef" }];
  if (!candidate.selectable) issues.push(...candidate.reasons.map((message) => ({ message, field: "ruleRef" })));
  if (binding.sourceContractFingerprint && binding.sourceContractFingerprint !== sourceContractFingerprintFor(source)) {
    issues.push({ message: "物模型 dataJson 的范围、步长、单位或读写契约已变化，请重新确认映射", field: "source-contract" });
  }
  const valueMapping = candidate.valueMapping;
  if (["direct", "required"].includes(valueMapping?.mode) && valueMapping.allowedValues?.length) {
    const entries = enumEntries(source);
    if (binding.valueBindingSchema !== valueBindingSchemaFor(source)) {
      issues.push({ message: "物模型枚举值或业务含义已变化，请重新确认值对应关系", field: "value-bindings" });
    }
    const bindings = binding.valueBindings || [];
    if (bindings.length !== entries.length) issues.push({ message: "值对应未覆盖全部物模型枚举值", field: "value-bindings" });
    const targetValues = new Set();
    entries.forEach((entry) => {
      const item = bindings.find((valueBinding) => String(valueBinding.sourceValue) === entry.value);
      if (!item?.semanticValue) {
        issues.push({ message: `枚举值 ${entry.value} 尚未选择 Alexa 目标值`, field: "value-bindings", sourceValue: entry.value });
        return;
      }
      if (!valueMapping.allowedValues.includes(item.semanticValue)) {
        issues.push({ message: `枚举值 ${entry.value} 的 Alexa 目标值不合法`, field: "value-bindings", sourceValue: entry.value });
        return;
      }
      if (targetValues.has(item.semanticValue)) issues.push({ message: `Alexa 目标值 ${item.semanticValue} 不可重复使用`, field: "value-bindings", sourceValue: entry.value });
      targetValues.add(item.semanticValue);
    });
  }
  if (binding.voice?.control) issues.push(...labelSetIssueDetails(binding.voice.control, locales, "控制名称", { voiceScope: "control" }));
  if (candidate.outputs.some((item) => item.capabilityId === "ModeController")) {
    const values = enumEntries(source);
    values.forEach((entry) => issues.push(...labelSetIssueDetails(binding.voice?.values?.[entry.value], locales, `枚举值 ${entry.value}`, { voiceScope: "value", sourceValue: entry.value })));
  }
  if (candidate.outputs.some((item) => item.capabilityId === "PlaybackController") && !["Play", "Pause"].every((operation) => source.operations?.includes(operation))) issues.push({ message: "播放控制命令至少需要 Play 和 Pause", field: "ruleRef" });
  return issues;
}

export function mappingIssues(binding, profile) {
  return mappingIssueDetails(binding, profile).map((item) => item.message);
}

export function localeCompletion(binding, profile) {
  const locales = profile?.targetLocales || [localePolicy.baseLocale];
  const source = modelPropertyCatalog.find((item) => item.id === binding.property);
  const candidate = selectedCapabilityCandidate(binding, profile);
  if (!candidate) return { complete: 0, total: locales.length };
  const sets = [];
  if (binding.voice?.control) sets.push(binding.voice.control);
  if (candidate.outputs.some((item) => item.capabilityId === "ModeController")) enumEntries(source).forEach((entry) => sets.push(binding.voice?.values?.[entry.value]));
  if (!sets.length) return { complete: locales.length, total: locales.length };
  return {
    complete: locales.filter((locale) => sets.every((set) => set?.locales?.[locale]?.primary?.trim())).length,
    total: locales.length
  };
}

export function utteranceExamplesForBinding(binding, profile) {
  if (mappingIssues(binding, profile).length) return [];
  const candidate = selectedCapabilityCandidate(binding, profile);
  const source = modelPropertyCatalog.find((item) => item.id === binding.property);
  const controlName = binding.voice?.control?.locales?.[localePolicy.baseLocale]?.primary?.trim() || "";
  const firstValue = enumEntries(source)[0]?.value;
  const valueName = binding.voice?.values?.[firstValue]?.locales?.[localePolicy.baseLocale]?.primary?.trim() || "";
  const numeric = sourceContractFor(source).numeric;
  const sampleValue = Number.isFinite(numeric?.min) && Number.isFinite(numeric?.max) ? String((numeric.min + numeric.max) / 2) : "50";
  const examples = candidate.outputs.flatMap((output) => output.metadata?.utteranceTemplates?.[localePolicy.baseLocale] || []).map((template) => template
    .replaceAll("{control name}", controlName)
    .replaceAll("{value name}", valueName)
    .replaceAll("{sample value}", sampleValue));
  return [...new Set(examples)].slice(0, 3);
}

const defaultVoiceNames = {
  motion_mode: { control: { "en-US": "motion mode", "de-DE": "Bewegungsmodus" }, values: { SLEEP: { "en-US": "sleep", "de-DE": "Schlaf" }, SOFT_ROCKING: { "en-US": "soft rocking", "de-DE": "sanftes Wiegen" }, PLAY: { "en-US": "play", "de-DE": "Wiedergabe" } } },
  music_mode: { control: { "en-US": "music mode", "de-DE": "Musikmodus" }, values: { SLEEP: { "en-US": "sleep", "de-DE": "Schlaf" }, LULLABY: { "en-US": "lullaby", "de-DE": "Schlaflied" }, WHITE_NOISE: { "en-US": "white noise", "de-DE": "weisses Rauschen" } } },
  work_mode: { control: { "en-US": "work mode", "de-DE": "Betriebsmodus" }, values: { 0: { "en-US": "idle", "de-DE": "Leerlauf" }, 1: { "en-US": "full load", "de-DE": "Volllast" }, 2: { "en-US": "half load", "de-DE": "halbe Last" }, 3: { "en-US": "low power", "de-DE": "Energiesparen" } } },
  motion_level: { control: { "en-US": "motion intensity", "de-DE": "Bewegungsintensitaet" } },
  child_lock: { control: { "en-US": "child lock", "de-DE": "Kindersicherung" } }
};

function createLabelSet(bindingId, scope, locales, values = {}, status = "draft") {
  return {
    id: `alexa.${stableToken(bindingId)}.${scope}`,
    provider: "alexa",
    scope,
    locales: Object.fromEntries(locales.map((locale) => [locale, { primary: values[locale] || "", aliases: [] }])),
    status,
    version: 1
  };
}

function candidateNeedsControlName(candidate) {
  return candidate?.outputs.some((output) => (output.metadata?.utteranceTemplates?.[localePolicy.baseLocale] || []).some((template) => template.includes("{control name}")));
}

function initializeVoice(binding, candidate, source, locales, seedDefaults = false) {
  const defaults = seedDefaults ? defaultVoiceNames[source?.id] || {} : {};
  const initialStatus = seedDefaults ? "published" : "draft";
  const voice = { values: {} };
  if (candidateNeedsControlName(candidate)) voice.control = createLabelSet(binding.bindingId, "capability", locales, defaults.control || {}, initialStatus);
  if (candidate?.outputs.some((output) => output.capabilityId === "ModeController")) {
    enumEntries(source).forEach((entry) => {
      voice.values[entry.value] = createLabelSet(binding.bindingId, `mode.${stableToken(entry.value)}`, locales, defaults.values?.[entry.value] || {}, initialStatus);
    });
  }
  return voice;
}

function normalizeBinding(binding, locales, seedDefaults = true) {
  const normalized = clone(binding);
  normalized.mappingId ||= normalized.bindingId;
  normalized.sourceRef = normalized.property || "";
  normalized.semanticRef = normalized.semantic || "";
  normalized.sourceContractFingerprint ||= sourceContractFingerprintFor(modelPropertyCatalog.find((item) => item.id === normalized.property));
  normalized.provider = "alexa";
  const source = modelPropertyCatalog.find((item) => item.id === normalized.property);
  const resolution = resolveProviderProjection(normalized, "alexa");
  if (!normalized.ruleRef && resolution.rule) normalized.ruleRef = `${resolution.rule.ruleId}@${resolution.rule.version}`;
  const candidate = capabilityCandidatesForSource(source, locales).find((item) => `${item.rule.ruleId}@${item.rule.version}` === normalized.ruleRef);
  if (!normalized.valueBindings || !normalized.valueBindingSchema) initializeValueBindings(normalized, source, candidate);
  normalized.voice ||= initializeVoice(normalized, candidate, source, locales, seedDefaults);
  normalized.providerOverrides ||= { alexa: {} };
  candidate?.outputs.forEach((output) => {
    normalized.providerOverrides.alexa ||= {};
    normalized.providerOverrides.alexa[output.capabilityId] ||= {};
    const support = output.metadata?.instanceSupport || "none";
    if (support !== "none") normalized.providerOverrides.alexa[output.capabilityId].instance = stableInstanceFor(normalized);
    if (output.capabilityId === "ModeController") {
      normalized.providerOverrides.alexa[output.capabilityId].modeMappings = enumEntries(source).map((entry) => ({
        modelValue: entry.value,
        alexaValue: stableProviderValueFor(normalized, entry.value)
      }));
    }
    if (output.capabilityId === "PlaybackController") normalized.providerOverrides.alexa[output.capabilityId].supportedOperations = "Play, Pause";
  });
  return normalized;
}

function normalizeProfile(profile) {
  const normalized = clone(profile);
  normalized.targetLocales ||= normalized.category === "Smart Crib" ? ["en-US", "de-DE"] : ["en-US"];
  normalized.catalogVersions.semantic = catalogVersions.semantic;
  normalized.catalogVersions.projection = catalogVersions.projection;
  normalized.catalogVersions.provider = catalogVersions.provider;
  normalized.providerProjections.alexa.ruleCatalogVersion = catalogVersions.projection;
  normalized.providerProjections.alexa.providerMetadataVersion = catalogVersions.provider;
  normalized.capabilities = normalized.capabilities.map((binding) => normalizeBinding(binding, normalized.targetLocales));
  return normalized;
}

const profileFixtures = [
  {
    id: "bedside-light-v2",
    productId: "momcozy.bedside_light",
    name: "Bedside Light Alexa V2",
    productKey: "momcozy.bedside_light.v2",
    category: "Night Light",
    displayCategory: "LIGHT",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    catalogVersions: { semantic: "2026.08.1", projection: "2026.08.1", provider: "2026.08.1" },
    semanticProfileVersion: 1,
    providerProjections: { alexa: { semanticProfileVersion: 1, ruleCatalogVersion: "2026.08.1", providerMetadataVersion: "2026.08.1", status: "draft" } },
    status: "draft",
    updatedAt: "2026-08-02 15:18",
    updatedBy: "林宇",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [
      { bindingId: "bedside-power", semantic: "device.power", semanticSlot: "value", property: "power", providerOverrides: { alexa: { PowerController: { instance: "" } } } },
      { bindingId: "bedside-brightness", semantic: "light.brightness", semanticSlot: "value", property: "brightness", providerOverrides: { alexa: { BrightnessController: { instance: "" } } } }
    ]
  },
  {
    id: "smart-crib-motion-v2",
    productId: "momcozy.smart_crib.motion",
    name: "Smart Crib Motion Alexa V2",
    productKey: "momcozy.smart_crib.motion.v2",
    category: "Smart Crib",
    displayCategory: "OTHER",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    catalogVersions: { semantic: "2026.08.1", projection: "2026.08.1", provider: "2026.08.1" },
    semanticProfileVersion: 1,
    providerProjections: { alexa: { semanticProfileVersion: 1, ruleCatalogVersion: "2026.08.1", providerMetadataVersion: "2026.08.1", status: "draft" } },
    status: "draft",
    updatedAt: "2026-08-04 10:42",
    updatedBy: "陈静",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [
      { bindingId: "crib-mode", semantic: "device.mode", semanticSlot: "value", property: "motion_mode", providerOverrides: { alexa: { ModeController: { instance: "Crib.MotionMode", modeMappings: [{ modelValue: "SLEEP", alexaValue: "SLEEP" }, { modelValue: "SOFT_ROCKING", alexaValue: "SOFT_ROCKING" }, { modelValue: "PLAY", alexaValue: "PLAY" }] } } } },
      { bindingId: "crib-music-mode", semantic: "device.mode", semanticSlot: "value", property: "music_mode", providerOverrides: { alexa: { ModeController: {} } } },
      { bindingId: "crib-level", semantic: "device.numeric_range", semanticSlot: "value", property: "motion_level", providerOverrides: { alexa: { RangeController: { instance: "Crib.MotionIntensity", range: "1-5" } } } },
      { bindingId: "crib-lock", semantic: "device.toggle", semanticSlot: "value", property: "child_lock", providerOverrides: { alexa: { ToggleController: { instance: "Crib.ChildLock" } } } }
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
    catalogVersions: { semantic: "2026.08.1", projection: "2026.08.1", provider: "2026.08.1" },
    semanticProfileVersion: 1,
    providerProjections: { alexa: { semanticProfileVersion: 1, ruleCatalogVersion: "2026.08.1", providerMetadataVersion: "2026.08.1", status: "draft" } },
    status: "draft",
    updatedAt: "2026-08-01 16:06",
    updatedBy: "王琪",
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [
      { bindingId: "noise-power", semantic: "device.power", semanticSlot: "value", property: "power", providerOverrides: { alexa: { PowerController: { instance: "" } } } },
      { bindingId: "noise-volume", semantic: "audio.volume", semanticSlot: "value", property: "volume_0_100", providerOverrides: { alexa: { Speaker: { instance: "" } } } },
      { bindingId: "noise-playback-command", semantic: "audio.playback_control", semanticSlot: "command", property: "playback_command", providerOverrides: { alexa: { PlaybackController: { instance: "", supportedOperations: "Play, Pause" } } } },
      { bindingId: "noise-playback-state", semantic: "audio.playback_state", semanticSlot: "state", property: "playback_state", providerOverrides: { alexa: { PlaybackStateReporter: { instance: "" } } } }
    ]
  }
];

const profiles = profileFixtures.map(normalizeProfile);

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
  { id: "momcozy.bedside_light", name: "Bedside Light v1", model: "BL-01", category: "Night Light", status: "已上架", platform: "ROOT云", app: "momcozy", comm: "Wi-Fi", alexaSupported: true, alexa: "草稿", version: "版本1 / 已发布", updatedAt: "2026-08-19", requiredAlexaLocales: ["en-US"] },
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
  resourceFilters: { product: "all", capability: "all", scope: "all", status: "all", keyword: "" },
  editor: { open: false, section: "basic", sourceId: "", draft: null, productAlexaSupported: false, validation: null, isSaving: false, expandedMapping: 0, technicalDetails: {} },
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
  const { product, capability, scope, status, keyword } = state.resourceFilters;
  const search = keyword.trim().toLowerCase();
  return voiceLabelResources().filter((item) => {
    const matchesProduct = product === "all" || item.productId === product;
    const matchesCapability = capability === "all" || item.capability === capability;
    const matchesScope = scope === "all" || item.scope === scope;
    const matchesStatus = status === "all" || item.status === status;
    const localeText = Object.values(item.locales).flatMap((entry) => [entry.primary, ...(entry.aliases || [])]);
    const matchesKeyword = !search || [item.profileName, item.productName, item.mappingId, item.capability, item.machineId, item.resourceRef, item.label, ...localeText].join(" ").toLowerCase().includes(search);
    return matchesProduct && matchesCapability && matchesScope && matchesStatus && matchesKeyword;
  });
}

export function voiceLabelResources() {
  return state.profiles.flatMap((profile) => profile.capabilities.flatMap((binding) => {
    const source = modelPropertyCatalog.find((item) => item.id === binding.property);
    const candidate = selectedCapabilityCandidate(binding, profile);
    const capability = candidate?.outputs?.[0]?.capabilityId || "Unsupported";
    const product = productData.find((item) => item.id === profile.productId);
    const common = {
      profileId: profile.id,
      profileName: profile.name,
      productId: profile.productId,
      productName: product?.name || profile.productKey,
      productKey: profile.productKey,
      bindingId: binding.bindingId,
      mappingId: binding.mappingId,
      capability,
      sourceLabel: source?.label || binding.property,
      targetLocales: profile.targetLocales || [localePolicy.baseLocale]
    };
    const rows = [];
    if (binding.voice?.control) {
      rows.push({
        ...common,
        id: binding.voice.control.id,
        scope: "capability",
        sourceValue: "",
        label: source?.label || binding.property,
        machineId: stableInstanceFor(binding),
        resourceRef: binding.voice.control.id,
        locales: binding.voice.control.locales || {},
        status: binding.voice.control.status || "draft",
        version: binding.voice.control.version || 1
      });
    }
    enumEntries(source).forEach((entry) => {
      const set = binding.voice?.values?.[entry.value];
      if (!set) return;
      rows.push({
        ...common,
        id: set.id,
        scope: "mode",
        sourceValue: entry.value,
        label: `${entry.label} (${entry.value})`,
        machineId: stableProviderValueFor(binding, entry.value),
        resourceRef: set.id,
        locales: set.locales || {},
        status: set.status || "draft",
        version: set.version || 1
      });
    });
    return rows;
  }));
}

export function setResourceFilter(key, value) {
  state.resourceFilters[key] = value;
  emit();
}

export function resetResourceFilters() {
  state.resourceFilters = { product: "all", capability: "all", scope: "all", status: "all", keyword: "" };
  emit();
}

export function openResourceEditor(key) {
  const source = voiceLabelResources().find((item) => item.id === key);
  if (!source) return false;
  const locales = Object.fromEntries(skillLocales.map(([locale]) => {
    const entry = source.locales?.[locale];
    return [locale, { primary: entry?.primary || "", aliases: [entry?.aliases?.[0] || "", entry?.aliases?.[1] || ""] }];
  }));
  state.resourceEditor = {
    open: true,
    sourceKey: key,
    draft: clone({ ...source, locales }),
    validation: null
  };
  emit();
  return true;
}

export function closeResourceEditor() {
  state.resourceEditor = { open: false, sourceKey: "", draft: null, validation: null };
  emit();
}

export function updateResourceDraft(path, value) {
  if (!state.resourceEditor.draft) return;
  const keys = path.split(".");
  let cursor = state.resourceEditor.draft;
  keys.slice(0, -1).forEach((key) => {
    cursor[key] ||= {};
    cursor = cursor[key];
  });
  cursor[keys[keys.length - 1]] = value;
  state.resourceEditor.validation = null;
}

export function validateResourceDraft() {
  const draft = state.resourceEditor.draft;
  const errors = [];
  if (!draft) return { errors: ["未找到 VoiceLabelSet"], passed: false };
  draft.targetLocales.forEach((locale) => {
    const entry = draft.locales?.[locale] || { primary: "", aliases: [] };
    if (!entry.primary?.trim()) errors.push(`${locale} 缺少主名称。`);
    const names = [entry.primary, ...(entry.aliases || [])].map((item) => String(item || "").trim().toLowerCase()).filter(Boolean);
    if (new Set(names).size !== names.length) errors.push(`${locale} 的主名称与别名不可重复。`);
    if ((entry.aliases || []).filter((item) => String(item || "").trim()).length > 2) errors.push(`${locale} 最多配置两个别名。`);
  });
  state.resourceEditor.validation = { errors, passed: errors.length === 0 };
  emit();
  return state.resourceEditor.validation;
}

export function saveResourceDraft(publish = false) {
  if (!state.resourceEditor.draft) return false;
  const validation = publish ? (state.resourceEditor.validation || validateResourceDraft()) : null;
  if (publish && !validation.passed) return false;
  const draft = clone(state.resourceEditor.draft);
  const profile = getProfile(draft.profileId);
  const binding = profile?.capabilities.find((item) => item.bindingId === draft.bindingId);
  if (!binding) return false;
  const target = draft.scope === "capability" ? binding.voice?.control : binding.voice?.values?.[draft.sourceValue];
  if (!target || target.id !== state.resourceEditor.sourceKey) return false;
  target.locales = clone(draft.locales);
  target.status = publish ? "published" : "draft";
  target.version = (target.version || 1) + 1;
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
  state.editor = { open: true, section, sourceId: id, draft: normalizeProfile(source), productAlexaSupported: Boolean(product?.alexaSupported), validation: createValidationState(), isSaving: false, expandedMapping: 0, technicalDetails: {}, preserveScrollOnNextRender: false, focusValidationIssueId: "" };
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
  state.editor = { open: true, section: "basic", sourceId: source?.id || "", draft: normalizeProfile(draft), productAlexaSupported: Boolean(product?.alexaSupported), validation: createValidationState(), isSaving: false, expandedMapping: 0, technicalDetails: {}, preserveScrollOnNextRender: false, focusValidationIssueId: "" };
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
  state.editor.focusValidationIssueId = "";
  emit();
}

export function updateDraft(path, value) {
  const keys = path.split(".");
  let cursor = state.editor.draft;
  keys.slice(0, -1).forEach((key) => { cursor = cursor[key]; });
  cursor[keys[keys.length - 1]] = value;
  invalidateValidation();
}

export function updateCapability(index, key, value) {
  const capability = state.editor.draft.capabilities[index];
  if (capability) {
    capability[key] = value;
    invalidateValidation();
  }
}

export function setExpandedMapping(index) {
  state.editor.expandedMapping = state.editor.expandedMapping === index ? -1 : index;
  emit();
}

export function toggleTechnicalDetails(index) {
  state.editor.technicalDetails[index] = !state.editor.technicalDetails[index];
  emit();
}

export function setProfileLocale(locale, enabled) {
  const draft = state.editor.draft;
  if (!draft || (locale === localePolicy.baseLocale && !enabled)) return false;
  const next = new Set(draft.targetLocales || [localePolicy.baseLocale]);
  if (enabled) next.add(locale);
  else next.delete(locale);
  draft.targetLocales = alexaProfileLocales.map(([id]) => id).filter((id) => next.has(id));
  draft.capabilities.forEach((binding) => {
    const sets = [binding.voice?.control, ...Object.values(binding.voice?.values || {})].filter(Boolean);
    sets.forEach((set) => { if (enabled && !set.locales[locale]) set.locales[locale] = { primary: "", aliases: [] }; });
  });
  invalidateValidation();
  emit();
  return true;
}

function applyMappingChange(index, field, value) {
  const binding = state.editor.draft.capabilities[index];
  if (!binding) return;
  if (field === "property") {
    binding.property = value;
    binding.sourceRef = value;
    binding.semantic = "";
    binding.semanticRef = "";
    binding.semanticSlot = "";
    binding.ruleRef = "";
    binding.voice = { values: {} };
    binding.valueBindings = [];
    binding.valueBindingSchema = "";
    binding.providerOverrides = { alexa: {} };
    binding.sourceContractFingerprint = "";
  } else if (field === "ruleRef") {
    const source = modelPropertyCatalog.find((item) => item.id === binding.property);
    const candidate = capabilityCandidatesForSource(source, state.editor.draft.targetLocales).find((item) => `${item.rule.ruleId}@${item.rule.version}` === value);
    binding.ruleRef = value;
    binding.semantic = candidate?.semantic.id || "";
    binding.semanticRef = binding.semantic;
    binding.semanticSlot = candidate?.slotId || "";
    binding.sourceContractFingerprint = sourceContractFingerprintFor(source);
    binding.providerOverrides = { alexa: {} };
    binding.voice = initializeVoice(binding, candidate, source, state.editor.draft.targetLocales, false);
    initializeValueBindings(binding, source, candidate);
    candidate?.outputs.forEach((output) => {
      const override = {};
      if (output.metadata?.instanceSupport !== "none") override.instance = stableInstanceFor(binding);
      if (output.capabilityId === "ModeController") override.modeMappings = enumEntries(source).map((entry) => ({ modelValue: entry.value, alexaValue: stableProviderValueFor(binding, entry.value) }));
      if (output.capabilityId === "PlaybackController") override.supportedOperations = "Play, Pause";
      binding.providerOverrides.alexa[output.capabilityId] = override;
    });
  }
  invalidateValidation();
}

export function requestMappingChange(index, field, value) {
  const binding = state.editor.draft.capabilities[index];
  if (!binding || binding[field] === value) return;
  const hasDependentConfig = Boolean(binding.ruleRef || binding.voice?.control || Object.keys(binding.voice?.values || {}).length);
  if (hasDependentConfig) {
    state.modal = { type: "reset-mapping", index, field, value };
    emit();
    return;
  }
  applyMappingChange(index, field, value);
  emit();
}

export function confirmMappingChange() {
  if (state.modal.type !== "reset-mapping") return;
  const { index, field, value } = state.modal;
  applyMappingChange(index, field, value);
  state.modal = { type: "", profileId: "", productId: "", draft: null };
  emit();
}

export function updateVoiceLabel(index, scope, sourceValue, locale, field, aliasIndex, value) {
  const binding = state.editor.draft.capabilities[index];
  if (!binding) return;
  const set = scope === "control" ? binding.voice?.control : binding.voice?.values?.[sourceValue];
  if (!set) return;
  set.locales[locale] ||= { primary: "", aliases: [] };
  if (field === "primary") set.locales[locale].primary = value;
  else {
    const aliases = set.locales[locale].aliases ||= [];
    aliases[Number(aliasIndex)] = value;
  }
  invalidateValidation();
}

export function updateValueBinding(index, sourceValue, semanticValue) {
  const binding = state.editor.draft.capabilities[index];
  if (!binding) return;
  const item = (binding.valueBindings || []).find((valueBinding) => String(valueBinding.sourceValue) === String(sourceValue));
  if (!item || item.semanticValue === semanticValue) return;
  item.semanticValue = semanticValue;
  invalidateValidation();
}

export function updateProjectionOverride(index, provider, capabilityId, key, value) {
  const binding = state.editor.draft.capabilities[index];
  if (!binding) return;
  binding.providerOverrides ||= {};
  binding.providerOverrides[provider] ||= {};
  binding.providerOverrides[provider][capabilityId] ||= {};
  binding.providerOverrides[provider][capabilityId][key] = value;
  invalidateValidation();
}

export function addCapability() {
  const mappingId = `binding-${Date.now()}`;
  state.editor.draft.capabilities.push({ bindingId: mappingId, mappingId, sourceRef: "", semanticRef: "", provider: "alexa", semantic: "", semanticSlot: "", property: "", ruleRef: "", valueBindings: [], valueBindingSchema: "", voice: { values: {} }, providerOverrides: { alexa: {} } });
  state.editor.expandedMapping = state.editor.draft.capabilities.length - 1;
  state.editor.section = "mapping";
  invalidateValidation();
  emit();
}

export function removeCapability(index) {
  state.editor.draft.capabilities.splice(index, 1);
  state.editor.expandedMapping = Math.min(state.editor.expandedMapping, state.editor.draft.capabilities.length - 1);
  invalidateValidation();
  emit();
}

function runLegacyValidation() {
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
  if (!draft.catalogVersions?.semantic || !draft.catalogVersions?.projection || !draft.catalogVersions?.provider) errors.push("版本：SemanticProfile 必须固定语义、投影规则和 Provider Metadata Catalog 版本。");
  if (!draft.providerProjections?.alexa?.semanticProfileVersion || !draft.providerProjections?.alexa?.ruleCatalogVersion || !draft.providerProjections?.alexa?.providerMetadataVersion) errors.push("版本：Alexa ProviderProjection 必须引用 SemanticProfile、Projection Rule 和 Provider Metadata 版本。");
  if (!state.editor.productAlexaSupported) errors.push("Alexa 配置：当前产品未启用 Alexa，不能发布 Profile。");
  if (!draft.capabilities.length) errors.push("能力与映射：至少需要配置一个可发现的 Alexa capability。");
  const sourceOwners = new Map();
  draft.capabilities.forEach((binding, bindingIndex) => {
    const source = modelPropertyCatalog.find((item) => item.id === binding.property);
    if (!binding.bindingId) errors.push(`能力与映射：第 ${bindingIndex + 1} 条 SemanticBinding 缺少稳定 bindingId。`);
    const semanticItem = semanticCapabilityCatalog.find((item) => item.id === binding.semantic);
    if (!source) {
      errors.push(`能力与映射：第 ${bindingIndex + 1} 条绑定未选择有效的物模型属性或命令。`);
      return;
    }
    if (sourceOwners.has(source.id)) errors.push(`能力与映射：${source.id} 已被第 ${sourceOwners.get(source.id)} 条绑定使用；默认不允许重复绑定同一来源。`);
    else sourceOwners.set(source.id, bindingIndex + 1);
    if (!semanticItem) {
      errors.push(`能力与映射：${source.id} 尚未人工选择设备语义。`);
      return;
    }
    const candidate = semanticCandidatesForSource(source).find((item) => item.semantic.id === semanticItem.id);
    if (!candidate) {
      errors.push(`能力与映射：设备语义 ${semanticItem.id} 不接受 ${source.sourceKind === "command" ? "command" : source.type} 来源。`);
      return;
    }
    if (binding.semanticSlot && binding.semanticSlot !== candidate.slotId) errors.push(`能力与映射：${semanticItem.id} 的输入槽位已变化，请重新选择设备语义。`);
    if (candidate.fit === "信息不足") errors.push(`能力与映射：${source.id} 绑定 ${semanticItem.id} 时信息不足（${candidate.notes.join("、")}）。`);
    if (candidate.status === "需要转换") warnings.push(`能力与映射：${source.id} 使用已登记 Adapter 转换（${candidate.notes.join("、")}）。`);

    const resolution = resolveProviderProjection(binding, "alexa");
    if (resolution.status === "conflict") {
      errors.push(`Alexa Projection：${semanticItem.id} 命中多个同优先级规则（${resolution.rules.map((item) => item.ruleId).join(", ")}），请由平台维护者处理 Catalog 冲突。`);
      return;
    }
    if (!resolution.rule || resolution.status === "unsupported" || !resolution.outputs.length) {
      errors.push(`Alexa Projection：${semanticItem.id} 没有可用规则；语义草稿可保存，但不能发布 Alexa。`);
      return;
    }
    if (resolution.status !== "ready") errors.push(`Alexa Projection：规则 ${resolution.rule.ruleId}@${resolution.rule.version} 状态为 ${resolution.status}，尚不能发布。`);

    resolution.outputs.forEach((output) => {
      const capabilityId = output.capabilityId;
      const catalogItem = capabilityCatalog.find((item) => item.id === capabilityId);
      const override = binding.providerOverrides?.alexa?.[capabilityId] || {};
      if (!catalogItem || catalogItem.status !== "profile_ready") errors.push(`能力与映射：${capabilityId} 尚未完成通用 Adapter 能力包，不能发布。`);
      const instanceSupport = catalogItem?.instanceSupport || "none";
      const instance = override.instance?.trim() || "";
      if (instanceSupport === "required" && !instance) errors.push(`能力与映射：${capabilityId} 的 Capability Catalog 要求声明 instance。`);
      if (instanceSupport === "none" && instance) errors.push(`能力与映射：${capabilityId} 不支持 instance，不能填写。`);
      if (instanceSupport !== "none" && instance) {
        if (!instanceNamePattern.test(instance)) errors.push(`能力与映射：${capabilityId} 的 instance 必须为 1-64 位、英文字母开头，仅可含字母、数字、点、下划线和连字符。`);
        else if (instanceOwners.has(instance)) errors.push(`能力与映射：instance “${instance}” 已被 ${instanceOwners.get(instance)} 使用；同一 Endpoint 的通用 Controller 不可重复。`);
        else instanceOwners.set(instance, capabilityId);
        if (catalogItem?.resourceScopes?.includes("capability")) {
          const resource = capabilityResourceFor(capabilityId, instance);
          if (!resource) errors.push(`能力与映射：${capabilityId} 的 instance “${instance}” 尚未维护已发布能力名称 Resource KV。`);
          else validateResource(resource.key, "capability", capabilityId, `${capabilityId} 的能力名称`);
        }
      }
      if (capabilityId === "ModeController") {
        const mappings = override.modeMappings || [];
        const enumValues = enumEntries(source);
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
            const resource = modeResourceFor(capabilityId, mapping.alexaValue);
            if (!resource) errors.push(`能力与映射：Alexa Value “${mapping.alexaValue}” 尚未维护多语言 Resource KV。`);
            else validateResource(resource.key, "mode", capabilityId, `Alexa Value ${mapping.alexaValue}`);
            if (!resource?.modeValue) errors.push(`能力与映射：Alexa Value ${mapping.alexaValue} 未维护稳定机器值。`);
            else if (alexaModeValues.has(resource.modeValue)) errors.push(`能力与映射：Alexa mode 值 “${resource.modeValue}” 在同一 ModeController 中不可重复。`);
            else alexaModeValues.add(resource.modeValue);
          }
        });
      }
      if (capabilityId === "PlaybackController" && !["Play", "Pause"].every((operation) => override.supportedOperations?.split(",").map((item) => item.trim()).includes(operation))) errors.push("能力与映射：PlaybackController 必须声明 Play 和 Pause 操作。");
    });
  });
  if (!draft.reporting.stateReport || !draft.reporting.endpointHealth) warnings.push("状态报告：建议同时启用 StateReport 与 EndpointHealth，避免 Alexa 显示过期状态。");
  if (draft.reporting.changeReport) errors.push("状态报告：首期不启用 proactive ChangeReport，Profile 不能打开该开关。");
  state.editor.validation = { errors, warnings, passed: errors.length === 0, checkedAt: "刚刚" };
  emit();
  return state.editor.validation;
}

export function runValidation() {
  if (state.editor.validation?.status === "running") return state.editor.validation;
  state.editor.validation = createValidationState("running");
  const draft = state.editor.draft;
  const issues = [];
  const error = (section, message, location) => issues.push(createValidationIssue("error", section, message, location));
  const warning = (section, message, location) => issues.push(createValidationIssue("warning", section, message, location));
  const sourceOwners = new Map();
  const instanceOwners = new Map();
  if (!draft.name.trim()) error("basic", "Profile 名称不能为空。", { field: "name" });
  if (!draft.productKey.trim()) error("basic", "产品 Product Key 不能为空。", { field: "productKey" });
  if (!endpointDisplayCategoryCatalog.some((item) => item.id === draft.displayCategory && item.status === "profile_ready")) error("basic", "请选择平台已启用的 Alexa Endpoint 显示分类。", { field: "displayCategory" });
  if (!(draft.targetLocales || []).includes(localePolicy.baseLocale)) error("basic", "Alexa 目标 Locale 必须包含 en-US。", { field: "targetLocales", locale: localePolicy.baseLocale });
  if (!state.editor.productAlexaSupported) error("basic", "当前产品未启用 Alexa，不能发布 Profile。", { field: "productAlexaSupported" });
  if (!draft.capabilities.length) error("mapping", "至少需要配置一个 Alexa Capability。", { field: "capabilities" });

  draft.capabilities.forEach((binding, index) => {
    const source = modelPropertyCatalog.find((item) => item.id === binding.property);
    const mappingId = binding.mappingId || binding.bindingId || `mapping-${index + 1}`;
    if (!binding.bindingId) error("mapping", `第 ${index + 1} 条映射缺少稳定 mappingId。`, { mappingId, field: "technical" });
    if (source) {
      if (sourceOwners.has(source.id)) error("mapping", `${source.id} 已被第 ${sourceOwners.get(source.id)} 条映射使用。`, { mappingId, field: "property" });
      else sourceOwners.set(source.id, index + 1);
    }
    mappingIssueDetails(binding, draft).forEach((issue) => error("mapping", `第 ${index + 1} 条 ${issue.message}。`, { mappingId, locale: issue.locale, field: issue.field, voiceScope: issue.voiceScope, sourceValue: issue.sourceValue }));
    const candidate = selectedCapabilityCandidate(binding, draft);
    if (!candidate) return;
    if (candidate.fit === "信息不足") error("mapping", `${source.id} 的候选信息不足（${candidate.notes.join("、")}）。`, { mappingId, field: "ruleRef" });
    else if (candidate.status === "需要转换") warning("mapping", `${source.id} 使用已登记 Adapter 转换（${candidate.notes.join("、")}）。`, { mappingId, field: "ruleRef" });
    if (binding.semantic !== candidate.semantic.id || binding.semanticSlot !== candidate.slotId) error("mapping", `${binding.bindingId} 的内部语义引用与所选 Capability 规则不一致。`, { mappingId, field: "technical" });
    candidate.outputs.forEach((output) => {
      if (output.metadata?.instanceSupport !== "none") {
        const instance = binding.providerOverrides?.alexa?.[output.capabilityId]?.instance;
        const expected = stableInstanceFor(binding);
        if (instance !== expected) error("mapping", `${output.capabilityId} 的稳定 instance 已失效。`, { mappingId, field: "technical" });
        else if (instanceOwners.has(instance)) error("mapping", `instance ${instance} 与 ${instanceOwners.get(instance)} 重复。`, { mappingId, field: "technical" });
        else instanceOwners.set(instance, binding.bindingId);
      }
      if (output.capabilityId === "ModeController") {
        const mappings = binding.providerOverrides?.alexa?.ModeController?.modeMappings || [];
        const entries = enumEntries(source);
        if (mappings.length !== entries.length) error("mapping", `${source.id} 的稳定 Alexa Value 未覆盖全部枚举值。`, { mappingId, field: "technical" });
        entries.forEach((entry) => {
          const expected = stableProviderValueFor(binding, entry.value);
          if (!mappings.some((item) => item.modelValue === entry.value && item.alexaValue === expected)) error("mapping", `${source.id}.${entry.value} 的 Alexa Value 已失效。`, { mappingId, field: "technical" });
        });
      }
    });
  });
  if (!draft.reporting.endpointHealth) error("reporting", "EndpointHealth 是 Alexa 配置发布必需项。", { field: "endpointHealth" });
  if (!draft.reporting.stateReport) warning("reporting", "StateReport 未启用；具体 Capability 的可查询属性仍须满足 Provider 契约。", { field: "stateReport" });
  if (draft.reporting.changeReport) error("reporting", "首期不启用 proactive ChangeReport。", { field: "changeReport" });
  return commitValidation(issues);
}

export function locateValidationIssue(issueId) {
  const issue = state.editor.validation?.issues?.find((item) => item.id === issueId);
  if (!issue) return false;
  state.editor.section = issue.section;
  if (issue.section === "mapping" && issue.mappingId) {
    const index = state.editor.draft.capabilities.findIndex((binding) => (binding.mappingId || binding.bindingId) === issue.mappingId);
    if (index >= 0) state.editor.expandedMapping = index;
  }
  state.editor.focusValidationIssueId = issue.id;
  state.editor.preserveScrollOnNextRender = false;
  emit();
  return true;
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
    state.editor.validation = createValidationState("stale");
    emit();
    return;
  }
  if (existingIndex >= 0 && state.profiles[existingIndex].status === "disabled") draft.status = "draft";
  draft.status = draft.status === "published" ? "ready" : draft.status;
  if (draft.providerProjections?.alexa) draft.providerProjections.alexa.status = draft.status;
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
  const validation = state.editor.validation?.status === "passed" ? state.editor.validation : runValidation();
  if (!validation.passed) return false;
  const draft = clone(state.editor.draft);
  const product = productData.find((item) => item.id === draft.productId);
  if (!product || !state.editor.productAlexaSupported) return false;
  product.alexaSupported = true;
  product.alexa = "已发布";
  product.updatedAt = "2026-08-10";
  draft.status = "published";
  if (draft.providerProjections?.alexa) draft.providerProjections.alexa.status = "published";
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
  invalidateValidation();
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
  const mappingId = `binding-${Date.now()}`;
  return {
    id: `new-profile-${Date.now()}`,
    name: "",
    productKey: "",
    category: "Night Light",
    displayCategory: "LIGHT",
    adapter: "smart-home-adapter-v2",
    adapterVersion: "2.4.0",
    catalogVersions: clone(catalogVersions),
    semanticProfileVersion: 1,
    providerProjections: { alexa: { semanticProfileVersion: 1, ruleCatalogVersion: catalogVersions.projection, providerMetadataVersion: catalogVersions.provider, status: "draft" } },
    status: "draft",
    updatedAt: "未保存",
    updatedBy: "林宇",
    targetLocales: [localePolicy.baseLocale],
    reporting: { source: "device_reported", stateReport: true, changeReport: false, endpointHealth: true },
    capabilities: [{ bindingId: mappingId, mappingId, sourceRef: "", semanticRef: "", provider: "alexa", semantic: "", semanticSlot: "", property: "", ruleRef: "", voice: { values: {} }, providerOverrides: { alexa: {} } }]
  };
}
