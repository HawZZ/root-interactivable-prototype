export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function anchor(number) {
  return `<button type="button" class="annotation-anchor" data-anchor="${number}" aria-label="查看批注 ${number}">${number}</button>`;
}

export function tag(label, type = "info", dotted = false) {
  return `<span class="el-tag el-tag--${type} is-plain${dotted ? " el-tag--dot" : ""}">${escapeHtml(label)}</span>`;
}

export function emptyState(title, copy, actionLabel = "", action = "") {
  return `<div class="empty-state"><div class="empty-state__mark">0</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p>${actionLabel ? `<button class="el-btn el-btn--primary" data-action="${action}">${escapeHtml(actionLabel)}</button>` : ""}</div>`;
}

export function statusClass(type) {
  return type === "success" ? "status-success" : type === "warning" ? "status-warning" : type === "danger" ? "status-danger" : "status-info";
}
