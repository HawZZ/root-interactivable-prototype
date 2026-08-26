export function semanticCandidatesForSource(source, semanticCatalog) {
  if (!source) return [];
  const order = { "可直接绑定": 0, "需转换": 1, "信息不足": 2 };
  return semanticCatalog
    .map((semantic) => candidateFit(source, semantic))
    .filter(Boolean)
    .sort((a, b) => order[a.fit] - order[b.fit] || b.score - a.score || a.semantic.label.localeCompare(b.semantic.label, "zh-CN"));
}

export function resolveProviderProjection(binding, provider, projectionRules, sourceCatalog) {
  const source = sourceCatalog.find((item) => item.id === binding.property);
  if (!source || !binding.semantic) return { status: "unresolved", rules: [], outputs: [] };
  const candidates = projectionRules.filter((rule) => rule.provider === provider && rule.semanticInputs.length === 1 && rule.semanticInputs[0].semanticId === binding.semantic);
  if (!candidates.length) return { status: "unsupported", rules: [], outputs: [] };
  const applicable = candidates.filter((rule) => ruleMatchesSource(rule, source));
  if (!applicable.length) return { status: "unsupported", rules: candidates, outputs: [] };
  const priority = Math.max(...applicable.map((rule) => rule.priority || 0));
  const selected = applicable.filter((rule) => (rule.priority || 0) === priority);
  if (selected.length !== 1) return { status: "conflict", rules: selected, outputs: [] };
  const rule = selected[0];
  return { status: rule.support, rule, rules: selected, outputs: rule.outputs };
}

export function providerCapabilityCandidatesForSource(source, provider, semanticCatalog, projectionRules, providerDefinitions, targetLocales = []) {
  if (!source) return [];
  const candidates = semanticCandidatesForSource(source, semanticCatalog).flatMap((semanticCandidate) => {
    return projectionRules
      .filter((rule) => rule.provider === provider && rule.semanticInputs.length === 1 && rule.semanticInputs[0].semanticId === semanticCandidate.semantic.id)
      .filter((rule) => ruleMatchesSource(rule, source) && rule.outputs.length)
      .map((rule) => {
        const outputs = rule.outputs.map((output) => ({
          ...output,
          metadata: providerDefinitions.find((item) => item.id === output.capabilityId)
        }));
        const unavailableOutputs = outputs.filter((output) => output.metadata?.status !== "profile_ready");
        const unsupportedLocales = targetLocales.filter((locale) => outputs.some((output) => !output.metadata?.supportedLocales?.includes(locale)));
        const valueMapping = valueMappingFor(source, rule, outputs);
        const reasons = [];
        if (rule.support !== "ready") reasons.push(`规则状态为 ${rule.support}`);
        if (unavailableOutputs.length) reasons.push(`${unavailableOutputs.map((item) => item.capabilityId).join("、")} 尚未开放`);
        if (unsupportedLocales.length) reasons.push(`不支持 Locale：${unsupportedLocales.join("、")}`);
        if (!valueMapping.compatible) reasons.push(valueMapping.reason);
        return {
          semantic: semanticCandidate.semantic,
          slotId: semanticCandidate.slotId,
          fit: semanticCandidate.fit,
          score: semanticCandidate.score,
          notes: semanticCandidate.notes,
          rule,
          outputs,
          selectable: reasons.length === 0,
          reasons,
          valueMapping,
          tier: valueMapping.compatible && ["direct", "generated"].includes(valueMapping.mode) && semanticCandidate.fit === "可直接绑定" ? "recommended" : "other"
        };
      });
  });
  const fitOrder = { "可直接绑定": 0, "需转换": 1, "信息不足": 2 };
  return candidates.sort((a, b) => Number(b.selectable) - Number(a.selectable) || fitOrder[a.fit] - fitOrder[b.fit] || b.score - a.score || a.rule.ruleId.localeCompare(b.rule.ruleId));
}

function valueMappingFor(source, rule, outputs) {
  const policy = rule.valueTransformPolicy || { mode: "direct" };
  const contract = outputs.map((output) => output.metadata?.valueContract).find(Boolean) || { kind: "open" };
  if (policy.mode === "generated") return { mode: "generated", compatible: true, allowedValues: [], label: "平台自动生成" };
  if (policy.mode !== "required") return { mode: "direct", compatible: true, allowedValues: [], label: "直接使用" };
  const sourceValues = (source.enumValues || []).map((entry) => String(typeof entry === "object" ? entry.value : entry));
  const allowedValues = (contract.allowedValues || policy.semanticToProvider || []).map((entry) => typeof entry === "string" ? entry : entry.providerValue);
  if (!sourceValues.length || !allowedValues.length) return { mode: "incompatible", compatible: false, allowedValues, label: "值域不兼容", reason: "缺少可用于完整映射的枚举值定义" };
  if (sourceValues.length > allowedValues.length) return { mode: "incompatible", compatible: false, allowedValues, label: "值域不兼容", reason: `物模型有 ${sourceValues.length} 个枚举值，超过 Alexa 可用的 ${allowedValues.length} 个目标值` };
  const direct = sourceValues.every((value) => allowedValues.includes(value)) && new Set(sourceValues).size === sourceValues.length;
  return { mode: direct ? "direct" : "required", compatible: true, allowedValues, label: direct ? "直接使用" : "需要值对应", policy };
}

function candidateFit(source, semantic) {
  const slot = semantic.sourceSlots.find((item) => {
    if (!item.acceptedSourceKinds.includes(source.sourceKind || "property")) return false;
    return source.sourceKind === "command" || item.acceptedTypes.includes(source.type);
  });
  if (!slot) return null;
  const notes = [];
  let score = 0;
  if (slot.requiresReadable && !source.readable) notes.push("缺少读取能力");
  else if (slot.requiresReadable) score += 12;
  if (slot.requiresWritable && !source.writable) notes.push("缺少写入能力");
  else if (slot.requiresWritable) score += 12;
  if (slot.requiresEnumValues && !source.enumValues?.length) notes.push("缺少枚举值定义");
  else if (slot.requiresEnumValues) score += 10;
  if (slot.preferredUnits?.length) {
    if (slot.preferredUnits.includes(source.unit)) score += 24;
    else notes.push(`单位需转换为 ${slot.preferredUnits.join("/")}`);
  }
  if (slot.preferredValueShapes?.length) {
    if (slot.preferredValueShapes.includes(source.valueShape)) score += 24;
    else notes.push(`值结构需转换为 ${slot.preferredValueShapes.join("/")}`);
  }
  if (slot.preferredRange && Number.isFinite(source.min) && Number.isFinite(source.max)) {
    if (source.min === slot.preferredRange.min && source.max === slot.preferredRange.max) score += 18;
    else notes.push(`范围需归一化为 ${slot.preferredRange.min}-${slot.preferredRange.max}`);
  }
  const blocking = notes.some((item) => item.startsWith("缺少"));
  return { semantic, slotId: slot.id, score, fit: blocking ? "信息不足" : notes.length ? "需转换" : "可直接绑定", notes };
}

function ruleMatchesSource(rule, source) {
  const sourceKinds = rule.conditions?.sourceKinds;
  const sourceTypes = rule.conditions?.sourceTypes;
  const valueShapes = rule.conditions?.valueShapes;
  if (sourceKinds?.length && !sourceKinds.includes(source.sourceKind)) return false;
  if (sourceTypes?.length && !sourceTypes.includes(source.type)) return false;
  if (valueShapes?.length && !valueShapes.includes(source.valueShape)) return false;
  return true;
}
