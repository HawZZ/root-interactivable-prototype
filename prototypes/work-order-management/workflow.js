(function (root) {
  "use strict";
  const errors = Object.freeze({
    NONE: "设备解绑成功",
    UNBIND_DEVICE_NOT_FOUND: "未找到该 SN 对应的设备",
    UNBIND_SN_UNRECOGNIZABLE: "无法识别 SN / SN 识别不准确",
    UNBIND_SN_MISMATCH: "SN 不匹配",
    UNBIND_NOT_ELIGIBLE: "设备不满足解绑条件",
    WORK_ORDER_REJECTED: "解绑申请被人工驳回",
    WORK_ORDER_PROCESSING_FAILED: "系统处理失败，未能确认解绑成功"
  });
  // Prototype normalization only; the production rule is versioned by the service.
  const normalize = value => String(value ?? "").trim();
  function validateSn(deviceSn, manualSn, recognition) {
    const hasDeviceSn = Boolean(normalize(deviceSn));
    if (normalize(manualSn)) return {
      selectedSn: normalize(manualSn), snSource: "MANUAL", comparisonSkipped: !hasDeviceSn,
      method: "MANUAL", recognitionStatus: "SKIPPED",
      recognizedSn: null, confidence: null, modelVersion: null,
      matched: hasDeviceSn ? normalize(manualSn) === normalize(deviceSn) : null,
      errorCode: !hasDeviceSn || normalize(manualSn) === normalize(deviceSn) ? null : "UNBIND_SN_MISMATCH"
    };
    if (!recognition) return { method: "IMAGE", recognitionStatus: "PENDING", matched: null, errorCode: null };
    if (recognition.technicalError) return { method: "IMAGE", recognitionStatus: "TECHNICAL_ERROR", matched: null, errorCode: recognition.exhausted ? "WORK_ORDER_PROCESSING_FAILED" : null };
    if (!recognition.valid) return { method: "IMAGE", recognitionStatus: "FAILED", matched: null, errorCode: "UNBIND_SN_UNRECOGNIZABLE" };
    if (!normalize(recognition.sn)) return { method: "IMAGE", recognitionStatus: "FAILED", matched: null, errorCode: "UNBIND_SN_UNRECOGNIZABLE" };
    const matched = hasDeviceSn ? normalize(recognition.sn) === normalize(deviceSn) : null;
    return { method: "IMAGE", recognitionStatus: "SUCCEEDED", selectedSn: normalize(recognition.sn), snSource: "IMAGE", comparisonSkipped: !hasDeviceSn, matched, errorCode: !hasDeviceSn || matched ? null : "UNBIND_SN_MISMATCH" };
  }
  function routeLookup(result) {
    if (result.error || result.authorized !== true || result.regionVerified === false) return { action: result.transient ? "RETRY" : "FAIL", errorCode: result.transient ? null : "WORK_ORDER_PROCESSING_FAILED" };
    if (result.confirmedAbsent === true) return { action: "REJECT", errorCode: "UNBIND_DEVICE_NOT_FOUND" };
    if (!result.deviceId) return { action: "FAIL", errorCode: "WORK_ORDER_PROCESSING_FAILED" };
    if (result.bound === false) return { action: "COMPLETE", errorCode: "NONE" };
    if (result.bound === true) return { action: "UNBIND", errorCode: null };
    return { action: "FAIL", errorCode: "WORK_ORDER_PROCESSING_FAILED" };
  }
  function resultCode(ticket) {
    if (ticket.status === "COMPLETED") return "NONE";
    if (["FAILED", "CLOSED"].includes(ticket.status)) return "WORK_ORDER_PROCESSING_FAILED";
    if (ticket.status !== "REJECTED") return null;
    if (ticket.stage === "REJECTED_MANUAL") return "WORK_ORDER_REJECTED";
    if (ticket.stage === "REJECTED_NOT_FOUND") return "UNBIND_DEVICE_NOT_FOUND";
    if (ticket.stage === "REJECTED_UNRECOGNIZED") return "UNBIND_SN_UNRECOGNIZABLE";
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
  const api = { errors, validateSn, routeLookup, resultCode, query, notification, acceptResult, canHandle };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.WorkOrderWorkflow = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
