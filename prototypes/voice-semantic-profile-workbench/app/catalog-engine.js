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
