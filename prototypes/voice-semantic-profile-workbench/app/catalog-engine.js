// Candidate selection is intentionally contract-only: source labels, ids and descriptions
// never participate in this module.
const numericTypes = new Set(["int", "float", "double"]);
const unitMap = { "%": "Alexa.Unit.Percent", "°C": "Alexa.Unit.Temperature.Celsius", "°F": "Alexa.Unit.Temperature.Fahrenheit" };

export function sourceContractFor(source) {
  const raw = parseDataJson(source?.dataJson);
  const numeric = numericTypes.has(source?.type) ? { min: numberOrNull(raw.min), max: numberOrNull(raw.max), step: numberOrNull(raw.step), unit: typeof raw.unit === "string" ? raw.unit : "" } : null;
  const enumValues = (source?.enumValues || []).map((item) => String(typeof item === "object" ? item.value : item));
  const core = { dataType: source?.type || null, readable: Boolean(source?.readable), writable: Boolean(source?.writable), numeric, enumValues, valueShape: source?.valueShape || (numeric ? "numeric" : enumValues.length ? "enum" : source?.type || "unknown") };
  return { ...core, schemaFingerprint: JSON.stringify(core) };
}

export function semanticCandidatesForSource(source, semanticCatalog) {
  if (!source) return [];
  return semanticCatalog.map((semantic) => {
    const slot = semantic.sourceSlots.find((item) => (item.acceptedSourceKinds || []).includes(source.sourceKind || "property") && (source.sourceKind === "command" || (item.acceptedTypes || []).includes(source.type)));
    if (!slot) return null;
    const missing = [];
    if (slot.requiresReadable && !source.readable) missing.push("缺少读取能力");
    if (slot.requiresWritable && !source.writable) missing.push("缺少写入能力");
    if (slot.requiresEnumValues && !source.enumValues?.length) missing.push("缺少枚举值定义");
    return { semantic, slotId: slot.id, fit: missing.length ? "信息不足" : "直接匹配", notes: missing };
  }).filter(Boolean).sort((a, b) => a.semantic.id.localeCompare(b.semantic.id));
}

export function resolveProviderProjection(binding, provider, projectionRules, sourceCatalog) {
  const source = sourceCatalog.find((item) => item.id === binding.property);
  if (!source || !binding.semantic) return { status: "unresolved", rules: [], outputs: [] };
  const applicable = projectionRules.filter((rule) => rule.provider === provider && rule.semanticInputs.length === 1 && rule.semanticInputs[0].semanticId === binding.semantic && ruleMatchesSource(rule, source));
  if (!applicable.length) return { status: "unsupported", rules: [], outputs: [] };
  const priority = Math.max(...applicable.map((rule) => rule.priority || 0));
  const selected = applicable.filter((rule) => (rule.priority || 0) === priority);
  if (selected.length !== 1) return { status: "conflict", rules: selected, outputs: [] };
  return { status: selected[0].support, rule: selected[0], rules: selected, outputs: selected[0].outputs };
}

export function providerCapabilityCandidatesForSource(source, provider, semanticCatalog, projectionRules, providerDefinitions, targetLocales = []) {
  if (!source) return [];
  const candidates = semanticCandidatesForSource(source, semanticCatalog).flatMap((semanticCandidate) => projectionRules
    .filter((rule) => rule.provider === provider && rule.productConfigurable !== false && rule.semanticInputs.length === 1 && rule.semanticInputs[0].semanticId === semanticCandidate.semantic.id && ruleMatchesSource(rule, source) && rule.outputs.length)
    .map((rule) => {
      const outputs = rule.outputs.map((output) => ({ ...output, metadata: providerDefinitions.find((item) => item.id === output.capabilityId) }));
      const compatibility = evaluateCompatibility(source, outputs);
      const unavailable = outputs.filter((output) => output.metadata?.status !== "profile_ready");
      const unsupportedLocales = targetLocales.filter((locale) => outputs.some((output) => !output.metadata?.supportedLocales?.includes(locale)));
      const reasons = [...semanticCandidate.notes, ...compatibility.reasons];
      if (rule.support !== "ready") reasons.push(`规则状态为 ${rule.support}`);
      if (unavailable.length) reasons.push(`${unavailable.map((item) => item.capabilityId).join("、")} 尚未开放`);
      if (unsupportedLocales.length) reasons.push(`不支持 Locale：${unsupportedLocales.join("、")}`);
      const valueMapping = valueMappingFor(source, rule, outputs);
      if (!valueMapping.compatible) reasons.push(valueMapping.reason);
      // A metadata-only / locale-blocked item is not a usable direct match. Keep its
      // contract diagnosis in `detail`, but place it outside the direct-match group.
      const status = reasons.length
        ? (compatibility.status === "直接匹配" ? "不兼容" : compatibility.status)
        : valueMapping.mode === "generated" ? "平台生成" : valueMapping.mode === "required" ? "需要值对应" : "直接匹配";
      return { semantic: semanticCandidate.semantic, slotId: semanticCandidate.slotId, rule, outputs, sourceContract: sourceContractFor(source), compatibility, valueMapping, status, fit: status, notes: reasons, reasons, selectable: !reasons.length && valueMapping.compatible, tier: status === "直接匹配" || status === "平台生成" ? "direct" : "other" };
    }));
  const statusOrder = { "直接匹配": 0, "平台生成": 1, "需要值对应": 2, "需要转换": 3, "信息不足": 4, "不兼容": 5 };
  return candidates.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || (a.rule.catalogOrder || 999) - (b.rule.catalogOrder || 999) || outputId(a).localeCompare(outputId(b)));
}

function evaluateCompatibility(source, outputs) {
  const contract = sourceContractFor(source); const capability = outputs[0]?.metadata; const spec = capability?.compatibilityContract || {};
  if (!capability) return { status: "不兼容", reasons: ["缺少 Provider Metadata"], detail: "" };
  if (spec.kind === "range") {
    if (source.type === "enum") return enumRangeCompatibility(source, contract);
    if (!numericTypes.has(source.type)) return { status: "不兼容", reasons: ["RangeController 只接受数值域或规则数值枚举"], detail: "" };
    const { min, max, step, unit } = contract.numeric || {};
    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step)) return { status: "信息不足", reasons: ["缺少可解析的 min、max 或 step"], detail: "" };
    if (!(min < max) || !(step > 0) || !isStepAligned(min, max, step)) return { status: "信息不足", reasons: ["min、max、step 不能形成有效步进"], detail: "" };
    if (unit && !unitMap[unit]) return { status: "不兼容", reasons: [`单位无法投影：${unit}`], detail: "" };
    return { status: "直接匹配", reasons: [], detail: rangeDetail(min, max, step, unit, !source.writable) };
  }
  if (spec.kind === "fixed_percentage") {
    const { min, max, step } = contract.numeric || {};
    const valid = source.type === "int" && source.writable && min === 0 && max === 100 && step === 1;
    return valid ? { status: "直接匹配", reasons: [], detail: "固定整数 0–100；数值转换：无" } : { status: "不兼容", reasons: ["该 Capability 要求可写整数 0–100 / step 1；当前来源不能无损表达"], detail: "" };
  }
  if (spec.kind === "boolean") return source.type === "bool" && source.readable && source.writable ? { status: "直接匹配", reasons: [], detail: "布尔值直连" } : { status: "信息不足", reasons: ["需要可读写 bool 来源"], detail: "" };
  return { status: "直接匹配", reasons: [], detail: "" };
}

function enumRangeCompatibility(source, contract) {
  const values = contract.enumValues.map(Number);
  if (!values.length || values.some((value) => !Number.isFinite(value)) || new Set(values).size !== values.length) return { status: "不兼容", reasons: ["字符串或重复枚举值不能直接映射 RangeController"], detail: "" };
  const sorted = [...values].sort((a, b) => a - b); const step = sorted[1] - sorted[0];
  if (!(step > 0) || sorted.some((value, index) => index && !nearlyEqual(value - sorted[index - 1], step))) return { status: "不兼容", reasons: ["数值枚举不是固定步长序列；请选择 ModeController 或显式转换规则"], detail: "" };
  return { status: "直接匹配", reasons: [], detail: `${rangeDetail(sorted[0], sorted.at(-1), step, "", !source.writable)}；预设值：${sorted.join("、")}` };
}

function valueMappingFor(source, rule, outputs) {
  const policy = rule.valueTransformPolicy || { mode: "direct" }; const contract = outputs.map((output) => output.metadata?.valueContract).find(Boolean) || { kind: "open" };
  if (policy.mode === "generated") return { mode: "generated", compatible: true, allowedValues: [], label: "平台生成" };
  if (policy.mode !== "required") return { mode: "direct", compatible: true, allowedValues: [], label: "直接匹配" };
  const sourceValues = sourceContractFor(source).enumValues; const allowedValues = (contract.allowedValues || policy.semanticToProvider || []).map((entry) => typeof entry === "string" ? entry : entry.providerValue);
  if (!sourceValues.length || !allowedValues.length) return { mode: "incompatible", compatible: false, allowedValues, label: "值域不兼容", reason: "缺少可用于完整映射的枚举值定义" };
  if (sourceValues.length > allowedValues.length) return { mode: "incompatible", compatible: false, allowedValues, label: "值域不兼容", reason: `物模型有 ${sourceValues.length} 个枚举值，超过 Alexa 可用的 ${allowedValues.length} 个目标值` };
  const direct = sourceValues.every((value) => allowedValues.includes(value)) && new Set(sourceValues).size === sourceValues.length;
  return { mode: direct ? "direct" : "required", compatible: true, allowedValues, label: direct ? "直接匹配" : "需要值对应", policy };
}

function ruleMatchesSource(rule, source) { const c = rule.conditions || {}; return (!c.sourceKinds?.length || c.sourceKinds.includes(source.sourceKind)) && (!c.sourceTypes?.length || c.sourceTypes.includes(source.type)) && (!c.valueShapes?.length || c.valueShapes.includes(source.valueShape)); }
function parseDataJson(value) { try { return typeof value === "string" ? JSON.parse(value) : (value || {}); } catch { return {}; } }
function numberOrNull(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
function nearlyEqual(a, b) { return Math.abs(a - b) < 1e-9; }
function isStepAligned(min, max, step) { return nearlyEqual((max - min) / step, Math.round((max - min) / step)); }
function rangeDetail(min, max, step, unit, nonControllable) { return `Alexa：${min}–${max} / precision ${step}${unit ? ` / ${unitMap[unit]}` : ""}${nonControllable ? " / nonControllable: true" : ""}；数值转换：无`; }
function outputId(candidate) { return candidate.outputs.map((output) => output.capabilityId).join("+"); }
