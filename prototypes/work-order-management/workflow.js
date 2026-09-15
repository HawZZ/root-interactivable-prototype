(function (root) {
  "use strict";
  const errors = Object.freeze({
    NONE: "设备解绑成功",
    UNBIND_DEVICE_NOT_FOUND: "未找到该 SN 对应的设备",
    UNBIND_SN_MISMATCH: "SN 不匹配",
    UNBIND_NOT_ELIGIBLE: "设备不满足解绑条件",
    WORK_ORDER_REJECTED: "解绑申请被人工驳回",
    WORK_ORDER_PROCESSING_FAILED: "系统处理失败，未能确认解绑成功"
  });
  // Prototype normalization only; the production rule is versioned by the service.
  const normalize = value => String(value ?? "").trim();
  function buildCandidates(manualSn, recognizedSn) {
    const candidates = [];
    for (const [source, raw] of [["MANUAL", manualSn], ["RECOGNIZED", recognizedSn]]) {
      const sn = normalize(raw);
      if (!sn) continue;
      const existing = candidates.find(candidate => candidate.sn === sn);
      if (existing) existing.sources.push(source);
      else candidates.push({ sn, sources: [source] });
    }
    return candidates;
  }
  function preferredSource(candidate) {
    return candidate.sources.includes("MANUAL") ? "MANUAL" : "RECOGNIZED";
  }
  function selectInputCandidate(manualSn, recognizedSn) {
    const manualValue = normalize(manualSn);
    if (manualValue) return { sn: manualValue, source: "MANUAL" };
    const recognizedValue = normalize(recognizedSn);
    return recognizedValue ? { sn: recognizedValue, source: "RECOGNIZED" } : null;
  }
  function validateSn(deviceSn, manualSn, recognizedSn) {
    const normalizedDeviceSn = normalize(deviceSn);
    const candidates = buildCandidates(manualSn, recognizedSn);
    const selectedInput = selectInputCandidate(manualSn, recognizedSn);
    if (!selectedInput) return {
      accepted: false,
      submissionError: "SN_CANDIDATE_REQUIRED",
      comparisonSkipped: !normalizedDeviceSn,
      matched: null,
      candidates
    };
    const manualValue = normalize(manualSn);
    const recognizedValue = normalize(recognizedSn);
    if (!normalizedDeviceSn) return {
      accepted: true,
      hasDeviceSn: false,
      comparisonSkipped: true,
      matched: null,
      selectedSn: selectedInput.sn,
      selectedSnSource: selectedInput.source,
      manualMatched: null,
      recognizedMatched: null,
      candidates,
      errorCode: null
    };
    const matched = selectedInput.sn === normalizedDeviceSn;
    return {
      accepted: true,
      hasDeviceSn: true,
      comparisonSkipped: false,
      matched,
      selectedSn: matched ? selectedInput.sn : null,
      selectedSnSource: matched ? selectedInput.source : null,
      manualMatched: manualValue ? manualValue === normalizedDeviceSn : null,
      recognizedMatched: manualValue ? null : recognizedValue ? recognizedValue === normalizedDeviceSn : null,
      candidates,
      errorCode: matched ? null : "UNBIND_SN_MISMATCH"
    };
  }
  function routeLookup(result) {
    if (result.error || result.authorized !== true || result.regionVerified === false) return { action: result.transient ? "RETRY" : "FAIL", errorCode: result.transient ? null : "WORK_ORDER_PROCESSING_FAILED" };
    if (result.confirmedAbsent === true) return { action: "REJECT", errorCode: "UNBIND_DEVICE_NOT_FOUND" };
    if (!result.deviceId) return { action: "FAIL", errorCode: "WORK_ORDER_PROCESSING_FAILED" };
    if (result.bound === false) return { action: "COMPLETE", errorCode: "NONE" };
    if (result.bound === true) return { action: "UNBIND", errorCode: null };
    return { action: "FAIL", errorCode: "WORK_ORDER_PROCESSING_FAILED" };
  }
  function selectTuyaCandidate(validation, lookupResults = {}) {
    if (!validation.accepted) return { action: "INVALID", submissionError: validation.submissionError };
    if (validation.errorCode) return { action: "REJECT", errorCode: validation.errorCode };
    if (validation.hasDeviceSn) {
      const route = routeLookup(lookupResults[validation.selectedSnSource] || {});
      return { ...route, selectedSn: validation.selectedSn, selectedSnSource: validation.selectedSnSource };
    }
    const route = routeLookup(lookupResults[validation.selectedSnSource] || {});
    const selected = { selectedSn: validation.selectedSn, selectedSnSource: validation.selectedSnSource };
    if (route.action === "COMPLETE") return { action: "REJECT", errorCode: "UNBIND_NOT_ELIGIBLE", ...selected };
    return { ...route, ...selected };
  }
  function resultCode(ticket) {
    if (ticket.status === "COMPLETED") return "NONE";
    if (["FAILED", "CLOSED"].includes(ticket.status)) return "WORK_ORDER_PROCESSING_FAILED";
    if (ticket.status !== "REJECTED") return null;
    if (ticket.stage === "REJECTED_MANUAL") return "WORK_ORDER_REJECTED";
    if (ticket.stage === "REJECTED_NOT_FOUND") return "UNBIND_DEVICE_NOT_FOUND";
    if (ticket.stage === "REJECTED_MISMATCH") return "UNBIND_SN_MISMATCH";
    if (ticket.stage === "REJECTED_INELIGIBLE") return "UNBIND_NOT_ELIGIBLE";
    throw new Error("Rejected work order requires an explicit reason");
  }
  function query(ticket, userId) {
    if (userId !== ticket.user) throw new Error("FORBIDDEN");
    const code = resultCode(ticket);
    const result = { workOrderId: ticket.id, isTerminal: code !== null, resultVersion: ticket.resultVersion || 1 };
    if (code !== null) Object.assign(result, { success: code === "NONE", errorCode: code });
    if (code === "WORK_ORDER_REJECTED") result.rejectionReason = ticket.rejectReason;
    if (ticket.replacedByWorkOrderId) result.replacedByWorkOrderId = ticket.replacedByWorkOrderId;
    return result;
  }
  function notification(ticket) {
    if (ticket.status === "CLOSED") return null;
    const result = query(ticket, ticket.user);
    return result.isTerminal ? result : null;
  }
  function acceptResult(previous, incoming) {
    if (previous && previous.workOrderId !== incoming.workOrderId) throw new Error("WORK_ORDER_MISMATCH");
    return previous && previous.resultVersion >= incoming.resultVersion ? previous : incoming;
  }
  function canHandle(ticket, authorized) {
    return authorized && ticket.status === "FAILED" && !ticket.replacedByWorkOrderId;
  }
  const api = { errors, buildCandidates, selectInputCandidate, validateSn, routeLookup, selectTuyaCandidate, resultCode, query, notification, acceptResult, canHandle };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.WorkOrderWorkflow = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
