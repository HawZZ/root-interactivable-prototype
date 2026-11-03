import {$,$$,esc,clone,equal,nowStr,ST,DC,COUNTRIES,FIELDS,initial,params,state} from './model.js';
const ver=no=>state.versions.find(v=>v.no===no),off=()=>['developing','offline'].includes(state.status),detailsNeedApproval=()=>!off();
function fieldEditable(key){const f=FIELDS.find(f=>f[0]===key);return !!f&&f[2]!=='immutable'&&(f[2]==='normal'||off());}
function fieldValue(v){return v===''||v===null||v===undefined?'未设置':typeof v==='boolean'?(v?'是':'否'):String(v);}
function profileDiff(before,after){return FIELDS.filter(([k])=>!equal(before[k],after[k])).map(([key,label])=>({key,label,before:before[key],after:after[key]}));}
function rangeText(r=state.range){if(r.way==='all')return '全面放开';const items=r.mode==='centers'?DC.filter(d=>r.centers.includes(d.id)):COUNTRIES.filter(c=>r.countries.includes(c.id));return items.map(x=>x.name).join('、')||'未设置';}



let timer;function toast(msg,type='ok'){clearTimeout(timer);$('#toast').className='toast show '+type;$('#toast').innerHTML=`<span class="ti">${type==='ok'?'✓':'i'}</span><span>${esc(msg)}</span>`;timer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function setDrawer(type,extra={}){if(type!=='history'&&state.request)return toast('产品处于审批冻结，请先处理当前申请','warn');state.drawer={type,...extra};state.draft=type==='profile'?clone(state.profile):null;state.editBase={profile:clone(state.profile),range:clone(state.range),status:state.status,version:state.globalVersion};state.errors=[];state.countrySearch='';renderAll();}
function closeDrawer(){const version=state.drawer?.version;state.drawer=null;state.draft=null;state.errors=[];renderAll();if(version)$(`[data-act="version-detail"][data-version="${version}"]`)?.focus({preventScroll:true});}
function formErrors(){const errors=[];if(state.request)errors.push('已有活跃申请，请先处理');if(!state.editBase||!equal(state.editBase,{profile:state.profile,range:state.range,status:state.status,version:state.globalVersion}))errors.push('正式配置已变化，请重新打开编辑');const d=state.draft;if(!d?.name?.trim()||d.name.length>50)errors.push('产品名称必填且不超过50个字符');if((d?.serviceModel||'').length>50)errors.push('客服型号不能超过50个字符');for(const x of profileDiff(state.profile,d||{})){if(!fieldEditable(x.key))errors.push(x.label+'当前不可修改');}if(Object.keys(d||{}).some(k=>!FIELDS.some(f=>f[0]===k)))errors.push('包含未知字段');return errors;}
function createRequest(type,payload){if(state.request)return false;const q={no:'APP-DEMO-'+(++state.serial),type,status:'pending',fromStatus:state.status,fromVersion:state.globalVersion,payload:clone(payload),submittedAt:nowStr()};state.request=q;state.requests.push(q);state.modal=null;state.drawer=null;state.draft=null;renderAll();toast('已提交审批，正式配置保持不变');return true;}
function saveDraft(){state.errors=formErrors();if(state.errors.length){renderAll();return;}const diff=profileDiff(state.profile,state.draft);if(!diff.length)return toast('没有实际变更','info');if(detailsNeedApproval()){state.modal={type:'profile',target:clone(state.draft),diff};renderAll();}else{state.profile=clone(state.draft);closeDrawer();toast('已保存工作配置，历史版本不变');}}
function applyRequest(q){if(q.status==='applied')return;const p=q.payload;if(q.type==='profile'){state.profile=clone(p.target);const no='v'+(Math.max(...state.versions.map(v=>Number(v.no.slice(1))))+1);state.versions.unshift({no,time:nowStr(),req:q.no,type:'产品基础信息变更',by:'张子豪',appr:'王静',profile:clone(p.target)});state.globalVersion=no;}if(q.type==='rollback'){const target=ver(p.version);const errors=rollbackErrors(p.version);if(errors.length){q.status='failed';renderAll();toast('恢复目标无法应用，请核对快照及字段权限','warn');return;}state.profile=clone(target.profile);state.globalVersion=p.version;}q.status='applied';if(state.request===q)state.request=null;renderAll();toast('已生效');}
function resolveApproval(action){const q=state.request;if(!q)return;if(action==='approve'||action==='retry')return applyRequest(q);if(action==='advance')return applyRequest(q,Math.max(Date.now(),q.payload.effectiveAt||0));if(action==='fail')q.status='failed';else{if(state.status==='listing')state.status=q.fromStatus;q.status=action==='revoke'?'revoked':'rejected';state.request=null;}renderAll();toast(requestLabel(q.status));}
function requestLabel(s){return ({pending:'待审批',waiting:'等待定时生效',failed:'未生效',applied:'已生效',rejected:'已驳回',revoked:'已撤销'})[s]||s;}
function rollbackErrors(no){const v=ver(no);if(!v?.profile)return ['无法读取目标版本快照'];return profileDiff(state.profile,v.profile).filter(x=>!fieldEditable(x.key)).map(x=>x.label+'当前不可修改，不能通过回滚绕过');}
function openRollback(no){if(state.request)return toast('产品已有活跃申请','warn');if(!ver(no)||no===state.globalVersion||state.versions.length<2)return;state.modal={type:'rollback',version:no,fromVersion:state.globalVersion,source:clone(state.profile),diff:ver(no).profile?profileDiff(state.profile,ver(no).profile):null};renderAll();}
function submitModal(){const m=state.modal;if(!m||state.request)return;if(m.type==='rollback'){if(rollbackErrors(m.version).length)return;if(!equal(m.source,state.profile)||m.fromVersion!==state.globalVersion||!equal(m.diff,profileDiff(state.profile,ver(m.version).profile))){state.modal=null;renderAll();return toast('当前配置已变化，请重新核对','warn');}return createRequest('rollback',{version:m.version,diff:m.diff});}if(m.type==='profile'){state.errors=formErrors();if(state.errors.length||!equal(m.target,state.draft)){state.modal=null;renderAll();return;}return createRequest('profile',{target:m.target,diff:m.diff});}}
function fieldsView(profile){return `<div class="kv-grid">${FIELDS.map(([k,label])=>`<div class="kv"><div class="k">${label}</div><div class="v">${esc(fieldValue(profile[k]))}</div></div>`).join('')}</div>`;}
function renderVersions(){return `<div class="card"><div class="card-hd"><h2>版本与回滚</h2></div><div class="card-bd" id="version-table" style="overflow:auto"><table><thead><tr><th>版本</th><th>变更类型</th><th>生效时间</th><th>申请号</th><th>提交人 / 审批人</th><th>操作</th></tr></thead><tbody>${state.versions.map(v=>`<tr><td>${v.no} ${v.no===state.globalVersion?'<span class="tag tag-ok">全局生效中</span>':''}</td><td>${v.type}</td><td>${esc(v.time)}</td><td>${v.req}</td><td>${v.by} / ${v.appr}</td><td><div class="ops"><button class="btn-link" data-act="version-detail" data-version="${v.no}">详情</button>${v.no!==state.globalVersion?`<button class="btn-link" data-act="rollback" data-version="${v.no}" ${state.request?'disabled':''}>回滚到此版本</button>`:''}</div></td></tr>`).join('')}</tbody></table></div></div>`;}
function renderSummary(){return `<div class="card"><div class="summary" id="product-summary"><h1>${esc(state.profile.name)}</h1> <span class="tag tag-info">ROOT云</span> <span id="product-status" class="tag ${ST[state.status].tag}">${ST[state.status].t}</span> ${state.request?'<span class="tag tag-warn" id="approval-freeze">审批冻结</span>':''}<div class="sum-meta"><div><span class="k">产品分类：</span>${esc(state.profile.productType)}</div><div><span class="k">产品型号：</span>${esc(state.profile.model)}</div><div><span class="k">产品代码：</span>—</div><div><span class="k">产品ID：</span>2075767415740338177</div><div><span class="k">产品模板ID：</span>1907328212561108993</div><div><span class="k">功能版本：</span>版本1 - 已发布</div><div id="range-summary" style="grid-column:1/-1"><span class="k">上架范围：</span>${esc(rangeText())}</div>${state.request?`<div style="grid-column:1/-1">当前申请：${state.request.no} <button class="btn-link" data-act="approval-detail">查看审批单</button></div>`:''}</div></div><div class="tabs">${[['basic','基础信息'],['noop','功能设计'],['noop','扩展程序'],['noop','设备调试'],['noop','配网引导'],['noop','高级配置'],['versions','版本与回滚']].map(([key,label])=>`<button class="tab ${state.tab===key?'active':key==='noop'?'dim':''}" data-act="tab" data-tab="${key}">${label}</button>`).join('')}</div></div>`;}
function renderBasic(){return `<div class="card"><div class="card-hd" id="basic-toolbar"><h2>产品信息</h2><button class="btn btn-sm" data-act="edit-profile" ${state.request?'disabled':''}>编辑产品信息</button></div><div class="card-bd" id="basic-info">${fieldsView(state.profile)}</div></div>`;}
function renderList(){const found=!state.kw||state.profile.name.toLowerCase().includes(state.kw.toLowerCase())||'2075767415740338177'.includes(state.kw);return `<div class="card"><div class="card-bd filter-bar" id="list-filter"><div class="f-field"><label>产品ID / 名称</label><input id="list-kw" value="${esc(state.kw)}" placeholder="请输入产品ID或名称"></div><button class="btn btn-pri" data-act="query">查询</button><button class="btn" data-act="reset-query">重置</button></div><div style="overflow:auto"><table><thead><tr><th>产品名称 / 型号</th><th>产品ID</th><th>产品状态</th><th>上架范围</th><th>功能版本</th><th>操作</th></tr></thead><tbody>${found?`<tr><td>${esc(state.profile.name)}<div class="cell-sub">${esc(state.profile.model)}</div></td><td>2075767415740338177</td><td><span class="tag ${ST[state.status].tag}">${ST[state.status].t}</span></td><td>${esc(rangeText())}</td><td>版本1 / 已发布</td><td><button class="btn-link" data-act="view-product">查看</button></td></tr>`:'<tr><td colspan="6"><div class="empty">暂无匹配产品</div></td></tr>'}</tbody></table></div></div>`;}

function renderCanvas(){const white=false;$('#canvas').innerHTML=`<aside class="aside"><div class="logo"><span class="logo-mark">L</span><div><div class="logo-txt">LuteOS</div><div class="logo-sub">IoT Admin</div></div></div><nav class="menu">${['概览','智能产品','设备管理','白名单管理','App 管理','配置中心','生产管理','运营管理'].map(n=>`<button style="width:100%;text-align:left" class="menu-item ${(white?n==='白名单管理':n==='智能产品')?'active':''} ${n==='智能产品'?'':'dim'}" data-act="${n==='智能产品'?'list':'inert'}"><span class="mi"></span>${n}</button>`).join('')}</nav><div class="aside-foot">test 环境 · v3.8.2</div></aside><div class="main"><header class="hd"><div class="crumb">${white?'白名单管理 / 产品测试白名单':`智能产品${state.page==='detail'?` / 产品详情 / <b>${state.tab==='versions'?'版本与回滚':'基础信息'}</b>`:''}`}</div><div class="userbar"><span class="env-tag">test 环境</span><span class="avatar">张</span>张子豪</div></header><div class="content">${state.page==='list'?renderList():renderSummary()+(state.tab==='versions'?renderVersions():renderBasic())}</div></div>`;}

function renderDrawer(){const open=!!state.drawer;$('#basic-drawer').classList.toggle('open',open);$('#basic-scrim').classList.toggle('open',open);if(!open){$('#basic-drawer').innerHTML='';return;}const d=state.drawer;let title,body,foot;
 if(d.type==='history'){const v=ver(d.version);title='产品详情 · 基础信息';body=`<div class="cell-sub" style="margin-bottom:14px">${esc(d.version)} · ${d.version===state.globalVersion?'当前生效版本':'历史版本'}</div><div id="history-fields">${v?.profile?fieldsView(v.profile):'<div class="empty">无法读取该历史快照</div>'}</div>`;foot='<button class="btn" data-act="close-drawer">关闭</button>';}
 else if(d.type==='profile'){title='编辑产品信息';body=`<div id="profile-fields">${FIELDS.map(([k,label,kind,type])=>{const enabled=fieldEditable(k);return `<div class="form-item"><label>${k==='name'?'<span class="req">*</span> ':''}${label}</label><div>${type==='boolean'?`<select data-profile="${k}" ${enabled?'':'disabled'}><option value="false" ${!state.draft[k]?'selected':''}>否</option><option value="true" ${state.draft[k]?'selected':''}>是</option></select>`:`<input type="text" data-profile="${k}" value="${esc(state.draft[k])}" ${enabled?'':'disabled'} ${['name','serviceModel'].includes(k)?'maxlength="50"':''}>`}${!enabled?`<div class="help">${kind==='immutable'?'创建后不可更改':'仅开发中 / 已下架时可修改'}</div>`:''}</div></div>`;}).join('')}</div>`;foot='<button class="btn" data-act="close-drawer">取消</button><button class="btn btn-pri" data-act="save-draft">保存</button>';}
 
 $('#basic-drawer').setAttribute('role','dialog');$('#basic-drawer').setAttribute('aria-modal','true');$('#basic-drawer').setAttribute('aria-label',title);$('#basic-drawer').innerHTML=`<div class="drawer-hd"><h2>${title}</h2><button class="drawer-x" data-act="close-drawer" aria-label="关闭">×</button></div><div class="drawer-bd">${body}${state.errors.length?`<div class="validation" role="alert">${state.errors.map(e=>`<div>${esc(e)}</div>`).join('')}</div>`:''}</div><div class="drawer-ft"><span></span><div style="display:flex;gap:10px">${foot}</div></div>`;}
function diffTable(rows){return rows?.length?`<div style="overflow:auto"><table class="rollback-diff"><thead><tr><th>字段</th><th>当前值</th><th>回滚后值</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.label}</td><td>${esc(fieldValue(x.before))}</td><td>${esc(fieldValue(x.after))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="cell-sub">无字段值差异。</div>';}
function renderModal(){const m=state.modal;$('#mscrim').classList.toggle('open',!!m);if(!m){$('#modalSlot').innerHTML='';return;}let title='',body='',button='提交审批',disabled=!!state.request,readOnly=false;
 if(m.type==='rollback'){title='回滚产品基础信息';const errors=rollbackErrors(m.version);body=`<div id="rollback-impact">全局生效版本：<b>${m.fromVersion} → ${m.version}</b><p class="cell-sub" style="margin-top:10px">仅恢复基础信息，产品上架状态、上架范围及白名单授权保持不变。</p></div><div id="rollback-field-diff"><h4 style="margin-bottom:10px">字段值差异</h4>${diffTable(m.diff)}</div>${errors.length?`<div class="validation" style="margin-left:0" role="alert">${errors.map(esc).join('<br>')}</div>`:''}`;disabled=disabled||errors.length>0;button='提交回滚审批';}
 else if(m.type==='profile'){title='确认产品详情变更';body=`<div id="profile-diff">${diffTable(m.diff).replace('回滚后值','变更后值')}</div>`;}

 else if(m.type==='approval'){const q=state.request||state.requests.at(-1);title='审批单详情';readOnly=true;body=q?`<div id="approval-detail"><p>${q.no} · ${requestLabel(q.status)}</p><p style="margin-top:10px">${({profile:'产品详情变更',range:'上架范围变更',listing:'产品上架',offline:'产品下架',rollback:'版本回滚'})[q.type]}</p>${q.payload.range?`<p>目标上架范围：${esc(rangeText(q.payload.range))}</p><p>生效时间：${q.payload.effectiveAt?esc(new Date(q.payload.effectiveAt).toLocaleString()):'审批通过后立即生效'}</p>`:''}${q.payload.diff?diffTable(q.payload.diff):''}</div>`:'<div class="empty">暂无申请</div>';}

 $('#modalSlot').innerHTML=`<div class="modal" id="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-hd"><h3 id="modal-title">${title}</h3><button class="drawer-x" data-act="close-modal" aria-label="关闭">×</button></div><div class="modal-bd">${body}</div><div class="modal-ft"><button class="btn" data-act="close-modal">${readOnly?'关闭':'取消'}</button>${readOnly?'':`<button class="btn btn-pri" data-act="submit-modal" ${disabled?'disabled':''}>${button}</button>`}</div></div>`;}
const NOTES=[
 {ctx:'basic',target:'#product-summary',title:'回滚的产品上下文',loc:'产品详情 > 主信息',body:'说明：沿用整体开发中 / 上架中 / 已上架 / 已下架及上架范围摘要；范围是配置集合，没有区域独立状态。\n规则：回滚保持当前整体状态、公开上架范围与白名单授权不变；不按区域选择版本。'},
 {ctx:'basic',target:'#basic-toolbar',title:'编辑与上下架',loc:'产品详情 > 产品信息操作',body:'交互：合法基础信息编辑沿用整体状态审批：开发中 / 已下架直存，上架中 / 已上架送审；审批应用成功生成新版本。\n状态/差异：活跃申请显示审批冻结并禁用配置写入；冻结不撤销已有有效体验授权。'},
 {ctx:'basic',target:'#basic-info',title:'字段权限按整体状态判定',loc:'产品详情 > 基础信息',body:'字段：9项受限字段仅开发中 / 已下架且现有权限允许时可改；分类、通讯方式创建后不可改。名称与客服型号沿用普通字段审批逻辑。\n规则：白名单是否存在不作为修改门槛，审批和回滚不能绕过字段资格。\n原型备注：W1 Lite基础元数据沿现有存档；未提供的协议字段留空，编辑值仅用于演示。真实唯一性 / 格式 / 引用校验及后台联调仍须实施。'},
 {ctx:'list',target:'#list-filter',title:'沿用产品列表',loc:'智能产品 > 产品列表',body:'交互：查询、重置、查看详情。显示整体产品状态与上架范围，不以范围内外派生区域状态。'},
 {ctx:'profile',target:'#profile-fields',title:'按字段资格编辑',loc:'编辑产品信息 > 字段',body:'规则：锁定字段显示原因；名称必填且不超过50字，客服型号不超过50字。保存时重新核对当前正式状态、配置及活跃申请，非法字段变化整次拒绝。\n数据来源：当前工作配置。离线直存不改写不可变历史；在线审批成功才生成下一基础信息版本。'},
 {ctx:'versions',target:'#version-table',title:'产品基础信息版本',loc:'版本与回滚 > 版本表',body:'说明：创建v1，基础信息审批成功应用后递增。范围、上下架、授权不生成版本。\n交互：详情打开只读基础信息，当前版本也可看；非当前版本可申请回滚，活跃申请禁用回滚。无当前版本侧卡或快照摘要侧卡。'},
 {ctx:'history',target:'#history-fields',title:'只读历史基础信息',loc:'历史详情抽屉',body:'数据来源：指定版本快照，不能用最新工作配置替代。\n交互：无编辑保存操作；关闭、遮罩、Esc返回列表，不生成审批或切换指针。'},
 {ctx:'modal:rollback',target:'#rollback-impact',title:'只恢复历史基础信息',loc:'回滚确认 > 影响',body:'规则：审批成功后恢复基础信息与全局指针，不新增版本；产品整体状态、公开范围、白名单授权、已有设备和分享保持不变。'},
 {ctx:'modal:rollback',target:'#rollback-field-diff',title:'核对真实字段差异',loc:'回滚确认 > 字段差异',body:'字段：当前值与目标恢复值，仅列实际变化；空值显示未设置。无差异仍可恢复不同版本指针。\n规则：目标缺失或实际差异违反字段权限时禁用提交；确认后源配置变化要求重新核对。'},
 {ctx:'modal:profile',target:'#profile-diff',title:'冻结产品详情差异',loc:'详情审批确认',body:'交互：核对实际字段变化，取消返回编辑输入；确认后冻结目标，应用成功前正式详情不变。成功后生成下一基础信息版本。'},
 {ctx:'modal:approval',target:'#approval-detail',title:'既有审批单',loc:'审批单详情',body:'说明：展示当前申请冻结目标及处理进度，使用既有单产品活跃申请规则，无逐区域审批。应用失败保留正式值与冻结，重试或取消后继续。'}
];
function currentCtx(){return state.modal?'modal:'+state.modal.type:state.drawer?state.drawer.type:state.page==='detail'?state.tab:state.page;}
function ctxLabel(){return ({basic:'产品详情 · 基础信息',list:'产品列表',whitelist:'白名单管理',range:'抽屉 · 产品上架范围',profile:'抽屉 · 编辑产品信息',history:'抽屉 · 只读历史基础信息',versions:'产品详情 · 版本与回滚'})[currentCtx()]||(currentCtx().startsWith('modal:')?'确认 / 审批弹窗':'产品详情');}
function visibleNotes(){return NOTES.filter(n=>n.ctx===currentCtx());}
function noteTargets(n){return [n.target];}
function renderNoteBody(body){
  return body.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{
    if(/^流程图[:：]|^状态图[:：]|^路径[:：]/.test(l))return `<span class="note-flow">${esc(l)}</span>`;
    if(l.endsWith("：")||l.endsWith(":"))return `<span class="note-sec">${esc(l.replace(/[:：]$/,""))}</span>`;
    return `<span class="note-line plain"><span>${esc(l)}</span></span>`;
  }).join("");
}
function clearAnchors(){$$(".anchor").forEach(a=>a.remove());$$(".note-host").forEach(h=>h.classList.remove("note-host"));$$(".note-target-active").forEach(h=>h.classList.remove("note-target-active"));}
function activateNote(id,scroll=true){
  state.activeNote=id;
  $$(".note-card").forEach(c=>c.classList.toggle("active",c.dataset.noteId===id));
  $$(".note-target-active").forEach(h=>h.classList.remove("note-target-active"));
  const note=idObj(id);
  const target=note&&document.querySelector(noteTargets(note)[0]);
  if(target){target.classList.add("note-target-active");if(scroll)target.scrollIntoView({block:"center",behavior:"smooth"});}
}
function idObj(id){return visibleNotes().find(n=>NOTES.indexOf(n)===Number(id));}
function renderAnnotations(){
  const list=$("#annList");clearAnchors();
  const notes=visibleNotes();
  $("#annCtx").textContent=ctxLabel();
  $("#annCount").textContent=`${notes.length} 条`;
  if(!notes.length){list.innerHTML=`<div class="ann-empty">当前页面暂无批注</div>`;return;}
  if(!notes.some((n,i)=>String(NOTES.indexOf(n))===state.activeNote))state.activeNote=String(NOTES.indexOf(notes[0]));
  list.innerHTML=notes.map((n,i)=>{
    const id=String(NOTES.indexOf(n));
    return `<button class="note-card ${state.activeNote===id?"active":""}" data-note-id="${id}" type="button">
      <span class="note-num">${i+1}</span>
      <span class="note-body"><strong>${esc(n.title)}</strong>${renderNoteBody(n.body)}<span class="note-loc">关联位置：${esc(n.loc)}</span></span>
    </button>`;}).join("");
  const hostCount={};
  notes.forEach((n,i)=>{
    const sel=noteTargets(n)[0],host=document.querySelector(sel);
    if(!host)return;
    host.classList.add("note-host");
    const dup=hostCount[sel]||0;hostCount[sel]=dup+1;
    const a=document.createElement("button");
    a.style.right=(2+dup*24)+"px";
    a.type="button";a.className="anchor";a.textContent=String(i+1);
    a.setAttribute("aria-label",`查看批注：${n.title}`);
    a.addEventListener("click",ev=>{ev.stopPropagation();activateNote(String(NOTES.indexOf(n)));});
    host.appendChild(a);
  });
  $$(".note-card").forEach(c=>c.addEventListener("click",()=>activateNote(c.dataset.noteId)));
  const active=notes.find(n=>String(NOTES.indexOf(n))===state.activeNote);
  if(active){const t=document.querySelector(noteTargets(active)[0]);if(t)t.classList.add("note-target-active");}
}


const baseAnnotations=renderAnnotations;
renderAnnotations=function(){baseAnnotations();const panel=document.createElement('div');panel.className='note-card';panel.id='demo-panel';panel.style.display='block';panel.innerHTML=`<div class="note-body"><strong>原型演示 · 版本回滚</strong><span class="note-line plain">以下为演示控制，不属于真实产品页面。切换整体状态可检查受限字段的回滚资格。</span><label class="f-field">整体状态<select id="demo-status" class="center-config" ${state.request?'disabled':''}>${Object.entries(ST).map(([k,v])=>`<option value="${k}" ${state.status===k?'selected':''}>${v.t}</option>`).join('')}</select></label><span class="note-line plain">公开范围：${esc(rangeText())}</span><span class="note-line plain">现有授权：${state.auths.map(a=>esc(a.email)+' · '+DC.find(d=>d.id===a.dc).name).join('；')||'无'}</span><span class="note-line plain">恢复仅修改基础信息与全局版本指针，保留上述状态、范围、授权及所有历史版本。</span></div>`;$('#annList').appendChild(panel);const related=document.createElement('div');related.className='note-card';related.style.display='block';related.innerHTML='<div class="note-body"><strong>相关需求</strong><a id="related-prd" href="https://momcozy-in.feishu.cn/docx/GG4dd7xCOo5gwCx2nieclOIYnLe" target="_blank" rel="noopener">产品上架范围与白名单解耦 · PRD</a><a id="prd-link" href="https://momcozy-in.feishu.cn/docx/UTeFdR2HUo3sUQx6TZZcVOLZnIh" target="_blank" rel="noopener">本需求 PRD</a></div>';$('#annList').appendChild(related);
 const q=state.request;if(q){const b=document.createElement('div');b.className='note-card';b.style.display='block';b.id='approval-demo';b.innerHTML=`<div class="note-body"><strong>原型演示 · ${q.no} ${requestLabel(q.status)}</strong><span class="note-line plain">模拟有权审批员，实际禁止自审批；等待占用仍见D02。</span><div class="chip-set">${(q.status==='pending'?[['approve','审批通过'],['reject','驳回'],['revoke','撤销'],['fail','应用失败']]:q.status==='waiting'?[['advance','到达生效时间'],['revoke','取消变更']]:[['retry','重试成功'],['reject','取消变更']]).map(([a,t])=>`<button class="btn btn-sm" data-resolve="${a}">${t}</button>`).join('')}</div></div>`;$('#annList').appendChild(b);}

};
function renderAll(){renderCanvas();renderDrawer();renderModal();renderAnnotations();}

document.addEventListener('click',e=>{const b=e.target.closest('[data-act],[data-resolve]');if(!b||b.disabled)return;if(b.dataset.resolve)return resolveApproval(b.dataset.resolve);switch(b.dataset.act){
case 'list':state.page='list';renderAll();break;case 'view-product':state.page='detail';state.tab='versions';renderAll();break;
case 'query':state.kw=$('#list-kw').value;renderAll();break;case 'reset-query':state.kw='';renderAll();break;
case 'tab':if(b.dataset.tab==='noop')return toast('沿用现有产品能力','info');state.tab=b.dataset.tab;state.activeNote=null;renderAll();break;
case 'edit-profile':setDrawer('profile');break;
case 'save-draft':saveDraft();break;case 'close-drawer':closeDrawer();break;case 'close-modal':state.modal=null;renderAll();break;case 'submit-modal':submitModal();break;case 'approval-detail':state.modal={type:'approval'};renderAll();break;
case 'version-detail':setDrawer('history',{version:b.dataset.version});break;case 'rollback':openRollback(b.dataset.version);break;
default:toast('沿用现有功能','info');}});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.profile&&state.drawer?.type==='profile')state.draft[el.dataset.profile]=el.value;else if(el.id==='range-at')state.draft.effAt=el.value;else if(el.id==='country-search'){state.countrySearch=el.value;$$('.country-option').forEach(x=>x.style.display=x.dataset.name.includes(el.value)?'inline-flex':'none');}});
document.addEventListener('change',e=>{const el=e.target;const pickerOpen=$('#country-picker')?.open;if(el.dataset.profile){state.draft[el.dataset.profile]=el.tagName==='SELECT'?el.value==='true':el.value;return;}if(el.dataset.range)state.draft.range[el.dataset.range]=el.value;else if(el.dataset.rangeItem){const key=el.dataset.rangeItem;state.draft.range[key]=el.checked?[...new Set([...state.draft.range[key],el.value])]:state.draft.range[key].filter(v=>v!==el.value);}else if(el.dataset.effective)state.draft.effType=el.dataset.effective;else if(el.id==='range-at')state.draft.effAt=el.value;else if(el.id==='demo-status'){if(state.request)return;state.status=el.value;state.demoResult=null;}else if(el.id==='demo-country')state.demoCountry=el.value;else if(el.id==='demo-user')state.demoUser=el.value;else return;state.errors=[];renderAll();if(pickerOpen&&$('#country-picker')){$('#country-picker').open=true;const search=$('#country-search');search.value=state.countrySearch;$$('.country-option').forEach(x=>x.style.display=x.dataset.name.includes(search.value)?'inline-flex':'none');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(state.modal){state.modal=null;renderAll();}else if(state.drawer)closeDrawer();}});
$('#basic-scrim').onclick=closeDrawer;$('#mscrim').onclick=e=>{if(e.target.id==='mscrim'){state.modal=null;renderAll();}};
$$('#mTabs .m-tab').forEach(b=>b.onclick=()=>{$$('#mTabs .m-tab').forEach(x=>x.classList.toggle('active',x===b));document.body.classList.toggle('show-ann',b.dataset.mtab==='ann');});
renderAll();

export {fieldEditable,profileDiff,rollbackErrors,openRollback};
