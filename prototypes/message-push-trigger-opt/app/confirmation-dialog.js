import { $, esc } from "./ui.js?v=20260903";

let activeDialog = null;

export function openConfirmationDialog({ title, description, confirmLabel = "确定", tone = "primary", onConfirm, onCancel } = {}) {
  activeDialog?.remove();
  const root = $("#overlayRoot");
  if (!root) return;

  root.insertAdjacentHTML("beforeend", `<div class="modal-host confirmation-dialog" id="confirmationDialog" role="presentation"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="confirmationDialogTitle"><header class="modal-header"><h3 id="confirmationDialogTitle">${esc(title || "请确认")}</h3><button class="icon-btn" type="button" aria-label="关闭" data-confirm-cancel>×</button></header><div class="modal-body"><p>${esc(description || "")}</p></div><footer class="modal-footer"><button class="el-btn" type="button" data-confirm-cancel>取消</button><button class="el-btn el-btn--${tone === "danger" ? "danger" : "primary"}" type="button" data-confirm>${esc(confirmLabel)}</button></footer></section></div>`);

  const host = $("#confirmationDialog");
  activeDialog = host;
  const close = confirmed => {
    if (!host?.isConnected) return;
    host.remove();
    if (activeDialog === host) activeDialog = null;
    document.removeEventListener("keydown", onKeydown);
    if (confirmed) onConfirm?.(); else onCancel?.();
  };
  const onKeydown = event => { if (event.key === "Escape") close(false); };

  host.querySelectorAll("[data-confirm-cancel]").forEach(button => button.addEventListener("click", () => close(false)));
  host.querySelector("[data-confirm]")?.addEventListener("click", () => close(true));
  host.addEventListener("click", event => { if (event.target === host) close(false); });
  document.addEventListener("keydown", onKeydown);
  host.querySelector("[data-confirm]")?.focus();
}
