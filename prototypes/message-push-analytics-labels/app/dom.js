export const $ = (selector, root=document) => root.querySelector(selector);
export const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
export const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
export function on(root, event, selector, handler){
  root.addEventListener(event, e => { const target=e.target.closest(selector); if(target && root.contains(target)) handler(e,target); });
}
export function showToast(message,type="success"){
  const toast=$("#toast"); toast.textContent=message; toast.className=`toast show ${type}`;
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.className="toast",1900);
}

