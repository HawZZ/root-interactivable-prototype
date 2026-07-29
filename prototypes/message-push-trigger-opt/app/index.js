import {$,$$,on,esc,showToast} from "./dom.js";
import {appState,rules,templates} from "./state.js";
import {renderAnnotations} from "./annotations.js";
import {openRuleDrawer} from "./rule-editor.js";
import {openTemplateDrawer} from "./template-editor.js";

const workspace=$("#workspace");
let query="";

function tag(type,text){return `<span class="el-tag el-tag--${type} is-plain">${text}</span>`}
function priorityTag(p){return tag(p==='P0'?'danger':p==='P1'?'warning':'info',p)}
function statusTag(s){return tag(s==='启用'?'success':s==='草稿'?'warning':'info',s)}

function rulesView(){
  const rows=rules.filter(r=>!query||r.name.includes(query)||r.id.toLowerCase().includes(query.toLowerCase()));
  return `<div class="filter-bar" data-anchor="filter-bar"><input class="el-input" id="keyword" placeholder="规则名称 / ID" value="${esc(query)}"><select class="el-select"><option>全部分类</option><option>安全</option><option>维护</option><option>耗材</option></select><select class="el-select"><option>全部优先级</option><option>P0 紧急</option><option>P1 重要</option><option>P2 常规</option></select><select class="el-select"><option>全部状态</option><option>启用</option><option>草稿</option><option>停用</option></select><button class="el-btn el-btn--primary" data-search>查询</button><button class="el-btn" data-reset>重置</button><span class="spacer"></span><button class="el-btn" data-conflict-scan ${appState.readOnly?'disabled':''}>冲突扫描</button></div>
  <div class="summary-strip"><span>启用规则 <strong>9</strong></span><span>P0 紧急 <strong>2</strong></span><span>连续提醒 <strong>3</strong></span><span>今日触发 <strong>1,284</strong></span><span>熔断 <strong style="color:var(--el-color-danger)">1</strong></span></div>
  <table class="el-table" data-anchor="rules-table"><thead><tr><th style="width:38px"><input type="checkbox" class="el-checkbox"></th><th>规则</th><th>分类/优先级</th><th>触发对象</th><th>模板</th><th>市场</th><th data-anchor="throttle-column">节流/生命周期</th><th>状态</th><th>更新时间</th><th class="col-ops">操作</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td><input type="checkbox" class="el-checkbox"></td><td><div class="primary-cell">${r.name}</div><div class="secondary-cell">${r.id} · ${r.product}</div></td><td>${tag('primary',r.category)} ${priorityTag(r.priority)}</td><td><div>${r.trigger}</div><div class="secondary-cell">${r.trigger.includes('.')?'eventId':'现网条件对象'}</div></td><td>${r.template}</td><td>${r.regions}</td><td><div>${r.throttle}</div><div class="secondary-cell">${r.lifecycle}</div></td><td>${statusTag(r.status)}</td><td>${r.updated}</td><td class="col-ops"><button class="op-link" data-edit-rule="${i}" ${appState.readOnly?'disabled':''}>编辑</button><span class="op-divider">|</span><button class="op-link" data-copy-rule="${i}" ${appState.readOnly?'disabled':''}>复制</button><span class="op-divider">|</span><button class="op-link danger" data-delete-rule="${i}" ${appState.readOnly?'disabled':''}>删除</button></td></tr>`).join('')}</tbody></table><div class="pagination"><span>共 12 条</span><button class="page-num active">1</button><button class="page-num">2</button><select class="el-select" style="width:92px"><option>10 条/页</option></select></div>`
}

function templatesView(){
  const rows=templates.filter(t=>!query||t.name.includes(query)||t.id.toLowerCase().includes(query.toLowerCase()));
  return `<div class="filter-bar" data-anchor="filter-bar"><input class="el-input" id="keyword" placeholder="模板名称 / ID" value="${esc(query)}"><select class="el-select"><option>全部分类</option><option>安全</option><option>耗材</option><option>固件</option></select><select class="el-select"><option>全部完成度</option><option>100% 完整</option><option>存在 fallback</option><option>阻断缺失</option></select><button class="el-btn el-btn--primary" data-search>查询</button><button class="el-btn" data-reset>重置</button><span class="spacer"></span><button class="el-btn" data-export>导出检查结果</button></div>
  <table class="el-table" data-anchor="templates-table"><thead><tr><th>模板</th><th>分类</th><th data-anchor="completion-column">语言完成度</th><th data-anchor="refs-column">引用规则</th><th>状态</th><th>更新时间</th><th class="col-ops">操作</th></tr></thead><tbody>${rows.map((t,i)=>`<tr><td><div class="primary-cell">${t.name}</div><div class="secondary-cell">${t.id}</div></td><td>${tag('primary',t.category)}</td><td><div class="completion"><span class="completion-bar"><i style="width:${t.completion}%;background:${t.completion===100?'var(--el-color-success)':'var(--el-color-warning)'}"></i></span><span>${t.completion}% · ${t.languages}</span></div></td><td><button class="op-link">${t.refs} 条规则</button></td><td>${statusTag(t.status)}</td><td>${t.updated}</td><td class="col-ops"><button class="op-link" data-edit-template="${i}" ${appState.readOnly?'disabled':''}>编辑</button><span class="op-divider">|</span><button class="op-link">预览</button><span class="op-divider">|</span><button class="op-link danger ${t.refs?'is-disabled':''}" ${t.refs?'disabled':''}>删除</button></td></tr>`).join('')}</tbody></table><div class="pagination"><span>共 8 条</span><button class="page-num active">1</button></div>`
}

function stateView(type){
  if(type==='loading')return `<div class="state-box"><div class="skeleton">${Array.from({length:7},()=>'<div class="skeleton-line"></div>').join('')}</div></div>`;
  if(type==='error')return `<div class="state-box"><div><div class="state-icon">⚠</div><h3>消息推送数据加载失败</h3><p>网络连接异常，请重试。筛选条件已保留。</p><button class="el-btn el-btn--primary" data-retry>重新加载</button></div></div>`;
  if(type==='empty')return `<div class="state-box"><div><div class="state-icon">▤</div><h3>${appState.tab==='rules'?'暂无推送规则':'暂无消息模板'}</h3><p>${appState.tab==='rules'?'先创建消息模板，再配置第一条推送规则。':'创建模板后，可由多条规则复用。'}</p><button class="el-btn el-btn--primary" data-empty-create>${appState.tab==='rules'?'新建推送规则':'新建消息模板'}</button></div></div>`;
  return appState.tab==='rules'?rulesView():templatesView();
}

function render(){
  appState.readOnly=appState.scenario==='permission';workspace.innerHTML=stateView(appState.scenario);
  if(appState.scenario==='permission'){workspace.insertAdjacentHTML('afterbegin','<div class="help-alert warning" style="margin-top:0">当前账号只有查看权限：可筛选、查看和预览，不可新增、编辑、复制、删除或启停。</div>')}
  $('#primaryCreateBtn').textContent=appState.tab==='rules'?'新建推送规则':'新建消息模板';$('#primaryCreateBtn').disabled=appState.readOnly;
  renderAnnotations(appState.tab,appState.tab==='rules'?'推送规则列表':'消息模板列表');wireWorkspace();
}

function openTemplateFromAnywhere(){openTemplateDrawer({onClose:()=>{const step=$('[data-step="4"]');if(step)step.click();else render()}})}
function wireWorkspace(){
  $('[data-search]')?.addEventListener('click',()=>{query=$('#keyword')?.value.trim()||'';const count=(appState.tab==='rules'?rules:templates).filter(item=>!query||item.name.includes(query)||item.id.toLowerCase().includes(query.toLowerCase())).length;render();showToast(`已查询到 ${count} 条数据`) });
  $('[data-reset]')?.addEventListener('click',()=>{query='';render()});
  $('[data-retry]')?.addEventListener('click',()=>{appState.scenario='loading';$('#scenarioSelect').value='loading';render();setTimeout(()=>{appState.scenario='normal';$('#scenarioSelect').value='normal';render();showToast('数据已重新加载')},650)});
  $('[data-empty-create]')?.addEventListener('click',()=>appState.tab==='rules'?openRuleDrawer({openTemplate:openTemplateFromAnywhere}):openTemplateFromAnywhere());
  $$('[data-edit-rule]').forEach(el=>el.addEventListener('click',()=>openRuleDrawer({edit:true,openTemplate:openTemplateFromAnywhere})));
  $$('[data-copy-rule]').forEach(el=>el.addEventListener('click',()=>showToast('已复制为草稿：设备溢奶紧急提醒（副本）')));
  $$('[data-delete-rule]').forEach(el=>el.addEventListener('click',()=>openDelete(Number(el.dataset.deleteRule))));
  $$('[data-edit-template]').forEach(el=>el.addEventListener('click',openTemplateFromAnywhere));
  $('[data-export]')?.addEventListener('click',()=>showToast('多语言检查结果已导出'));
  $('[data-conflict-scan]')?.addEventListener('click',e=>{const b=e.currentTarget;b.disabled=true;b.textContent='扫描中…';setTimeout(()=>{b.disabled=false;b.textContent='冲突扫描';showToast('扫描完成：发现 1 条潜在冲突','error')},700)});
}

function openDelete(index){const r=rules[index]||rules[0];const modal=document.createElement('div');modal.className='modal-host';modal.innerHTML=`<div class="modal"><header class="modal-header"><h3>删除推送规则</h3><button class="icon-btn" data-modal-close>×</button></header><div class="modal-body"><p>确定删除「<strong>${r.name}</strong>」吗？</p><div class="help-alert danger">删除后数据不可恢复。若规则处于连续提醒中，已激活实例将按安全上限结束。</div></div><footer class="modal-footer"><button class="el-btn" data-modal-close>取消</button><button class="el-btn el-btn--danger" data-confirm-delete>删除</button></footer></div>`;document.body.appendChild(modal);$$('[data-modal-close]',modal).forEach(x=>x.onclick=()=>modal.remove());$('[data-confirm-delete]',modal).onclick=e=>{e.currentTarget.disabled=true;e.currentTarget.textContent='删除中…';setTimeout(()=>{modal.remove();showToast('规则已删除');},600)}}

$$('.business-tab').forEach(tab=>tab.addEventListener('click',()=>{appState.tab=tab.dataset.tab;query='';$$('.business-tab').forEach(x=>x.classList.toggle('active',x===tab));render()}));
$('#scenarioSelect').addEventListener('change',e=>{appState.scenario=e.target.value;render()});
$('#refreshBtn').addEventListener('click',e=>{const b=e.currentTarget;b.disabled=true;b.textContent='刷新中…';setTimeout(()=>{b.disabled=false;b.textContent='刷新';showToast('已刷新')},500)});
$('#primaryCreateBtn').addEventListener('click',()=>appState.tab==='rules'?openRuleDrawer({openTemplate:openTemplateFromAnywhere}):openTemplateFromAnywhere());
$('#annotationToggle').addEventListener('click',()=>{$('.prototype-shell').classList.add('annotation-closed')});
$('#annotationReopen').addEventListener('click',()=>{$('.prototype-shell').classList.remove('annotation-closed')});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#templateLayer')?.remove();$('#ruleDrawer')?.remove()}});
render();
const demo=new URLSearchParams(location.search).get('demo');
if(demo==='template')openTemplateFromAnywhere();
if(/^rule[1-4]$/.test(demo||'')){
  openRuleDrawer({edit:true,openTemplate:openTemplateFromAnywhere});
  const step=Number(demo.slice(-1));
  if(step>1)document.querySelector(`[data-step="${step}"]`)?.click();
}
