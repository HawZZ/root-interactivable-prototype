import {$,$$,on,esc,showToast} from "./dom.js";
import {appState,languages} from "./state.js";
import {renderAnnotations} from "./annotations.js";

function validation(){
  const values=appState.template.values; const required=["en-US",...(appState.rule.regions.includes('德国')?["de-DE"]:[]),...(appState.rule.regions.includes('日本')?["ja-JP"]:[])];
  const missing=required.filter(code=>!values[code]?.title.trim()||!values[code]?.body.trim());
  return {required,missing};
}
function drawer(){
  const {required,missing}=validation(); const active=appState.template.language; const content=appState.template.values[active]||appState.template.values['en-US'];
  return `<div class="drawer-host is-open" id="templateDrawer" style="z-index:1300"><div class="drawer-mask" data-template-close></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="编辑消息模板">
    <header class="drawer-header"><div class="drawer-title"><h2>编辑消息模板</h2><p>T-1024 · ${appState.template.name}</p></div><button class="icon-btn" data-template-close>×</button></header>
    <div class="drawer-content" style="padding-bottom:24px">
      <div class="form-section" data-anchor="template-base"><div class="section-title"><h3>模板基础信息</h3><p>展示层独立于规则触发层</p></div><div class="form-grid">
        <label class="form-row"><span class="form-label"><i class="required">*</i>模板名称</span><input class="el-input" id="templateName" value="${esc(appState.template.name)}"></label>
        <label class="form-row"><span class="form-label"><i class="required">*</i>模板分类</span><select class="el-select"><option>安全</option><option>维护</option><option>耗材</option></select></label>
        <label class="form-row full"><span class="form-label">cozyLink（非多语言）</span><input class="el-input" id="cozyLink" value="${esc(appState.template.cozyLink)}"><p class="form-help"><code>{id}</code> 在消息渲染时替换；不进入 i18n fieldI18nInfos。</p></label>
      </div></div>
      <div class="split-preview">
        <div>
          <div class="form-section" data-anchor="lang-matrix"><div class="section-title"><h3>多语言 KV 矩阵</h3><div class="completion"><span>${missing.length?'75%':'100%'}</span><span class="completion-bar"><i style="width:${missing.length?75:100}%"></i></span></div></div>
            <div class="matrix-wrap"><table class="lang-matrix"><thead><tr><th style="width:110px">语言</th><th>title</th><th>body</th><th style="width:86px">状态</th></tr></thead><tbody>
            ${languages.map(([code,label,market])=>{const v=appState.template.values[code];const miss=!v.title||!v.body;const must=required.includes(code);return `<tr data-lang-row="${code}"><td><strong>${label}</strong><div class="secondary-cell">${code}</div>${market?`<div class="secondary-cell">${market}</div>`:''}</td><td><textarea data-lang="${code}" data-key="title" placeholder="请输入标题">${esc(v.title)}</textarea></td><td><textarea data-lang="${code}" data-key="body" placeholder="请输入正文">${esc(v.body)}</textarea></td><td><span class="el-tag el-tag--${miss?(must?'danger':'warning'):'success'} is-plain">${miss?(must?'必填缺失':'英文回退'):'完整'}</span></td></tr>`}).join('')}
            </tbody></table></div><p class="form-help">完整实现覆盖现网 16 种语言；原型展开 4 种关键语言验证矩阵与校验。</p>
          </div>
          <div class="form-section" data-anchor="placeholders"><div class="section-title"><h3>占位符面板</h3><p>插入当前语言正文</p></div><div class="placeholder-panel"><button class="placeholder" data-placeholder="{{deviceName}}">deviceName · 设备名称</button><button class="placeholder" data-placeholder="{{occurredAt}}">occurredAt · 发生时间</button><button class="placeholder" data-placeholder="{{level}}">level · 风险等级</button></div><div class="help-alert">示例值：deviceName=S12 Pro-卧室，occurredAt=2026-08-01 09:42，level=高。</div></div>
          <div class="form-section" data-anchor="template-validation"><div class="section-title"><h3>保存校验</h3><p>P0 · 美国、德国</p></div>
            ${missing.length?`<div class="help-alert danger"><strong>阻断：</strong>${missing.map(c=>languages.find(x=>x[0]===c)?.[1]).join('、')}缺少 title 或 body。P0 规则必须具备英文及每个已选市场主语言。</div><button class="el-btn" data-fill-german>填入评审示例德语</button>`:`<div class="help-alert success">英文与所选市场主语言完整，可以保存并供 P0 规则启用。</div>`}
          </div>
        </div>
        <aside data-anchor="template-preview"><div class="section-title"><h3>App Push 预览</h3><select class="el-select" id="previewLanguage" style="width:130px">${languages.map(([c,l])=>`<option value="${c}" ${active===c?'selected':''}>${l}</option>`).join('')}</select></div><div class="phone-preview"><div class="phone-time">09:42</div><div class="push-card"><strong>${esc((content.title||appState.template.values['en-US'].title).replaceAll('{{deviceName}}','S12 Pro-卧室'))}</strong><p>${esc((content.body||appState.template.values['en-US'].body).replaceAll('{{deviceName}}','S12 Pro-卧室').replaceAll('{{occurredAt}}','2026-08-01 09:42').replaceAll('{{level}}','高'))}</p><div class="push-link">打开设备安全页 ›</div></div></div><p class="form-help">缺失语言预览使用英文 fallback；预览只读。</p></aside>
      </div>
    </div>
    <footer class="drawer-footer"><span class="save-hint">i18n objectKey = templateId · messageType=2</span><div class="footer-actions"><button class="el-btn" data-template-close>取消</button><button class="el-btn el-btn--primary" data-template-save>保存模板</button></div></footer>
  </aside></div>`;
}

export function openTemplateDrawer({onClose}={}){
  const host=document.createElement('div');host.id='templateLayer';host.innerHTML=drawer();document.body.appendChild(host);wire(onClose);renderAnnotations('template','消息模板 · 编辑抽屉');
}
function rerender(onClose){const layer=$("#templateLayer");layer.innerHTML=drawer();wire(onClose);renderAnnotations('template','消息模板 · 编辑抽屉')}
function wire(onClose){const host=$("#templateDrawer");
  $$('[data-template-close]',host).forEach(el=>el.addEventListener('click',()=>close(onClose)));
  $$('textarea[data-lang]',host).forEach(el=>{el.addEventListener('focus',()=>appState.template.language=el.dataset.lang);el.addEventListener('input',()=>{appState.template.values[el.dataset.lang][el.dataset.key]=el.value})});
  $('#previewLanguage',host).addEventListener('change',e=>{appState.template.language=e.target.value;rerender(onClose)});
  $('[data-fill-german]',host)?.addEventListener('click',()=>{appState.template.values['de-DE']={title:'Milchüberlauf erkannt',body:'Bei {{deviceName}} wurde ein Überlauf erkannt. Bitte sofort prüfen.'};rerender(onClose);showToast('已填入评审示例，请复核后保存')});
  $$('[data-placeholder]',host).forEach(btn=>btn.addEventListener('click',()=>{const lang=appState.template.language;appState.template.values[lang].body+=`${appState.template.values[lang].body?' ':''}${btn.dataset.placeholder}`;rerender(onClose)}));
  $('[data-template-save]',host).addEventListener('click',e=>{const {missing}=validation();if(missing.length){showToast('P0 模板缺少关键市场语言，保存被阻断','error');return}const btn=e.currentTarget;btn.disabled=true;btn.textContent='保存中…';setTimeout(()=>{showToast('模板已保存');close(onClose)},650)});
}
function close(onClose){const layer=$("#templateLayer");const drawer=$("#templateDrawer");drawer?.classList.remove('is-open');setTimeout(()=>{layer?.remove();onClose?.()},210)}
