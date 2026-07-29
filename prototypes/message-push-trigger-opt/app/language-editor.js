import {$,$$,esc,showToast} from "./dom.js";
import {appState,languages} from "./state.js";
import {renderAnnotations} from "./annotations.js";

function requiredLanguages(){return ["en-US",...(appState.rule.regions.includes("德国")?["de-DE"]:[]),...(appState.rule.regions.includes("日本")?["ja-JP"]:[])];}
function missingLanguages(){return requiredLanguages().filter(code=>{const v=appState.message.values[code];return !v?.title.trim()||!v?.body.trim()});}

export function openLanguageDrawer({onClose}={}){
  const root=$("#overlayRoot"); const missing=missingLanguages();
  root.insertAdjacentHTML("beforeend",`<div class="drawer-host is-open" id="languageDrawer" style="z-index:1400"><div class="drawer-mask" data-language-close></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="编辑规则多语言内容">
    <header class="drawer-header"><div class="drawer-title"><h2>规则多语言内容</h2><p>${esc(appState.rule.name)} · title / body KV 矩阵</p></div><button class="icon-btn" data-language-close>×</button></header>
    <div class="drawer-content"><div class="help-alert" data-anchor="language-scope"><strong>规则内内容，不创建独立模板。</strong> 每行一个语言 KV；cozyLink 为全局单值。P0 当前要求：${requiredLanguages().join("、")}。</div>
      <div class="form-section" data-anchor="lang-matrix"><div class="section-title"><h3>多语言 KV 矩阵</h3><p>title、body 均可独立录入</p></div><div class="matrix-wrap"><table class="lang-matrix"><thead><tr><th style="width:130px">语言</th><th>推送标题</th><th>推送内容</th></tr></thead><tbody>${languages.map(([code,name,mark])=>{const v=appState.message.values[code];return `<tr><td><strong>${name}</strong><div class="secondary-cell">${code}${mark?` · ${mark}`:""}</div></td><td><textarea data-lang="${code}" data-key="title" placeholder="请输入标题">${esc(v.title)}</textarea></td><td><textarea data-lang="${code}" data-key="body" placeholder="请输入内容">${esc(v.body)}</textarea></td></tr>`}).join("")}</tbody></table></div></div>
      <div class="form-section" data-anchor="message-link"><label class="form-row full"><span class="form-label">跳转页面</span><input class="el-input" data-cozy-link value="${esc(appState.message.cozyLink)}"><p class="form-help">全局单值；支持 {id} 在发送时替换，不参与多语言矩阵。</p></label></div>
      <div class="form-section" data-anchor="language-validation"><div class="section-title"><h3>发布校验</h3><p>${missing.length?"存在阻断项":"已通过"}</p></div><div class="help-alert ${missing.length?"danger":"success"}">${missing.length?`P0 缺少 ${missing.join("、")} 的 title 或 body，不能启用规则。`:"英文与已选市场主语言均已完整，可保存。"}</div>${missing.includes("de-DE")?'<button class="el-btn" data-fill-german>填入德语评审示例</button>':""}</div>
    </div><footer class="drawer-footer"><button class="el-btn" data-language-close>取消</button><button class="el-btn el-btn--primary" data-language-save>保存多语言内容</button></footer>
  </aside></div>`);
  renderAnnotations("language","规则多语言内容"); wire(onClose);
}

function wire(onClose){const host=$("#languageDrawer");
  $$('[data-lang]',host).forEach(el=>el.addEventListener("input",()=>{appState.message.values[el.dataset.lang][el.dataset.key]=el.value;}));
  $('[data-cozy-link]',host).addEventListener("input",e=>{appState.message.cozyLink=e.target.value});
  $('[data-fill-german]',host)?.addEventListener("click",()=>{appState.message.values["de-DE"]={title:"Milchüberlauf erkannt",body:"Bei {{deviceName}} wurde ein Überlauf erkannt. Bitte sofort prüfen."};close(onClose);setTimeout(()=>{openLanguageDrawer({onClose});showToast("已填入评审示例，请复核后保存")},230)});
  $$('[data-language-close]',host).forEach(el=>el.addEventListener("click",()=>close(onClose)));
  $('[data-language-save]',host).addEventListener("click",e=>{const missing=missingLanguages();if(missing.length){showToast(`P0 缺少 ${missing.join("、")} 内容，无法保存`,"error");return}e.currentTarget.disabled=true;e.currentTarget.textContent="保存中…";setTimeout(()=>{showToast("规则多语言内容已保存");close(onClose)},550)});
}
function close(onClose){const host=$("#languageDrawer");if(!host)return;host.classList.remove("is-open");setTimeout(()=>{host.remove();onClose?.()},220)}
