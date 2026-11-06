'use strict';
const {langs,codes,esc,blank,editable,effective,MAX_TEXT,MAX_FILE}=RN;
const $=id=>document.getElementById(id), clone=o=>JSON.parse(JSON.stringify(o));
const seeds=[
 {id:'m1',kind:'MCU固件',name:'Lute_FD04X-main_1_10_a97e6d61_20261103',version:'1',hardware:'10',channel:'1',status:'开发中',publishedOnce:false,notes:{en:'Bug fixed'},remark:'',app:'不限（旧数据无 APP 条件）',target:'不限',time:'2026-11-05 12:04:49'},
 {id:'m2',kind:'MCU固件',name:'Lute_FD04X-pannel_1_10_657b4109_20261103',version:'1',hardware:'10',channel:'0',status:'开发中',publishedOnce:false,notes:{en:'Bug fixed'},remark:'',app:'不限（旧数据无 APP 条件）',target:'不限',time:'2026-11-05 12:04:36'},
 {id:'module1',kind:'模组固件',name:'Lute_FD04X-wifi_1.2.0_10_9aef_20261103.bin',version:'1.2.0',hardware:'10',channel:null,status:'开发中',publishedOnce:false,notes:{en:'Bug fixed'},remark:'',app:'版本不低于 v2.3.0',target:'不限',time:'2026-11-05 12:06:20'},
 {id:'v1',kind:'虚拟版本',name:'1.0.1',version:'1.0.1',status:'开发中',publishedOnce:false,notes:{en:'Bug fixed'},components:['m1','m2'],target:'不限',app:'不限',time:'2026-11-05 12:16:20'},
 {id:'v2',kind:'虚拟版本',name:'1.0.0',version:'1.0.0',status:'开发中',publishedOnce:false,notes:{en:'Bug fixed'},components:['m1','m2'],target:'不限',app:'不限',time:'2026-11-05 12:05:31'}
];
let objects;try{objects=JSON.parse(localStorage.getItem('firmware-rn-v1'))||clone(seeds);}catch{objects=clone(seeds);}
const statuses=['开发中','测试中','发布中','暂停发布','已发布','已停止'];
let preflightVersion=0;
let tab='firmware',selected='m1',draft=null,opening=null,creating=false,drawerRead=false,drawerMode='base',lang='en',view='source',baseline=false,modal=null,importPlan=null,importName='',listMode='normal',saveFailure=false,race=false,activeNote='',busy=false;
const obj=id=>objects.find(x=>x.id===id),persist=()=>{try{localStorage.setItem('firmware-rn-v1',JSON.stringify(objects));}catch{toast('浏览器存储不可用，本次仅内存保存',true);}};
function toast(text,error=false){$('toast').textContent=text;$('toast').className=error?'error':'';$('toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').style.display='none',3600);}
function anchor(n,id){return `<button class="anchor" data-note="${id}" aria-label="批注${n}">${n}</button>`;}
function card(n,id,title,location,body){return `<article class="note-card ${activeNote===id?'active':''}" data-note="${id}"><h4><span>${n}</span>${title}</h4><div class="location">关联位置：${location}</div>${body}</article>`;}
function setTab(t){tab=t;listMode='normal';$('firmwareTab').classList.toggle('active',t==='firmware');$('virtualTab').classList.toggle('active',t==='virtual');$('firmwareTab').setAttribute('aria-selected',String(t==='firmware'));$('virtualTab').setAttribute('aria-selected',String(t==='virtual'));renderList();renderNotes();}
function records(){return objects.filter(x=>tab==='virtual'?x.kind==='虚拟版本':x.kind!=='虚拟版本'&&(x.kind!=='模组固件'||obj(selected)?.kind==='模组固件'));}
function renderList(){
 let virtual=tab==='virtual',data=records();
 $('list').innerHTML=`<div class="section-head" id="list-top"><div><h3>${virtual?'虚拟版本':'固件版本'}${anchor(1,'context')}</h3>${virtual?'<p class="muted" style="margin:9px 0 0">虚拟版本与单 MCU 固件可同时发布；关联按通道号 + 硬件版本去重，无需覆盖全部通道。</p>':''}</div><button class="primary" id="createObject">新建${virtual?'虚拟版本':'固件版本'}</button></div>${!virtual?`<div class="stats">${statuses.map(s=>`<div class="stat"><b>${s}</b><span>${data.filter(x=>x.status===s).length} 条${s==='暂停发布'?' · 不参与命中':''}</span></div>`).join('')}</div>`:''}<div class="notice">${virtual?'APP 发起虚拟版本查询时，平台先筛选虚拟版本级 APP 条件、应用对象、发布范围和用户身份，再取最高语义化虚拟版本。指定应用对象只覆盖身份分层，冻结快照仍按通道号+硬件版本+当前版本筛选适用子集。':'命中策略说明：单固件（MCU/模组）与虚拟版本查询相互独立，互不兜底。本列表处理单固件查询；指定设备/用户仅绕过白名单/线上身份分层，仍受 APP 条件、发布范围与生命周期限制，并按原 APP 条件和版本号漏斗排序。'}</div><div id="table-target">${listMode==='loading'?'<div class="loading">◌ 正在加载版本…</div>':listMode==='error'?'<div class="notice error">版本加载失败，请重试。 <button id="retryList">重试</button></div>':listMode==='empty'?'<div class="loading">暂无版本，请新建版本。</div>':renderTable(data,virtual)}</div>`;
 $('createObject').onclick=()=>openEditor(null);if($('retryList'))$('retryList').onclick=()=>{listMode='normal';renderList();renderNotes();};
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openEditor(b.dataset.open,b.dataset.mode==='read'));
 document.querySelectorAll('[data-release-note]').forEach(b=>b.onclick=()=>openReleaseNotes(b.dataset.releaseNote));
 document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteObject(b.dataset.delete));
 document.querySelectorAll('[data-existing]').forEach(b=>b.onclick=()=>toast('既有发布流程，本原型仅验证 Release note；请用右侧评审工具切换状态。'));
 bindAnchors();
}
function renderTable(data,virtual){
 let heads=virtual?['虚拟版本号','虚拟版本级 APP 条件','应用对象','关联 MCU','状态','冻结状态','创建时间','操作']:['固件名称','固件类型','通道号','固件版本','硬件版本','功能版本','组件 APP 条件','应用对象','状态','上传时间','发布日志','操作'];
 let widths=virtual?[120,165,132,80,92,145,150,260]:[170,78,55,65,65,65,90,100,85,130,70,260];
 return `<div class="table-scroll"><table style="min-width:${widths.reduce((a,b)=>a+b,0)}px"><colgroup>${widths.map(w=>`<col style="width:${w}px">`).join('')}</colgroup><thead><tr>${heads.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${data.map(o=>{
 const status=`<span class="tag ${o.status==='发布中'?'blue':o.status==='已发布'?'green':o.status==='暂停发布'?'orange':''}">${o.status}</span>`;
 const actions=`<div class="operations">${existingActions(o,virtual)}${o.status==='开发中'&&o.id===data[0]?.id?anchor(7,'delete'):''}${!baseline?`<button class="link" data-release-note="${o.id}">Release note</button>`:''}</div>`;
 const cells=virtual?[esc(o.version),esc(o.app)+'<div class="muted">独立于组件 APP 条件</div>',esc(o.target)+'（沿用原命中）',(o.components||[]).length+' 个 MCU',status,['开发中','测试中'].includes(o.status)?'可调整（测试中截止）':'已冻结',esc(o.time),actions]:[esc(o.name),o.kind,o.channel??'—',o.version,o.hardware,'1',o.app==='不限（旧数据无 APP 条件）'?'不限':esc(o.app),esc(o.target)+'（沿用原命中）',status,esc(o.time),'—',actions];
 return `<tr>${cells.map(x=>`<td>${x}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div>`;
}
function existingActions(o,virtual){
 const passive=(label,cls='')=>`<button class="${cls}" data-existing="${o.id}">${label}</button>`;
 const edit=label=>`<button data-open="${o.id}">${label}</button>`;
 const detail=()=>`<button data-open="${o.id}" data-mode="read">详情</button>`;
 if(o.status==='开发中')return passive('进入测试','primary')+edit('编辑')+`<button class="danger" data-delete="${o.id}">删除</button>`;
 if(o.status==='测试中')return (virtual?edit('编辑')+edit('编辑应用对象'):edit('编辑应用对象'))+passive('发布','primary')+passive('停止','danger');
 if(o.status==='发布中')return edit('编辑应用对象')+passive('暂停发布')+passive('停止','danger')+passive('修改发布');
 if(o.status==='暂停发布')return passive('继续','primary')+passive('停止','danger');
 if(o.status==='已发布')return (virtual?'<span class="muted">关联和包信息已冻结</span>':'')+edit('编辑应用对象')+passive('停止','danger')+passive('修改发布配置')+(virtual?'':detail());
 return virtual?'<span class="muted">已停止：仅保留历史记录，不可删除或编辑</span>':detail();
}
function targetBox(){return `<div class="target-box full"><div>应用对象</div><div class="radio-row">${['不限','指定设备','指定用户'].map(t=>`<label><input type="radio" name="target" value="${t}" ${draft.target===t?'checked':''} ${drawerRead?'disabled':''}>${t}</label>`).join('')}</div><div id="targetExtra">${draft.target!=='不限'?`<input aria-label="${draft.target}列表" placeholder="输入${draft.target==='指定设备'?'设备ID':'用户ID'}，多个用逗号分隔" value="${esc(draft.targetIds||'')}">`:''}</div><p class="muted" style="color:#303133">不限：沿用白名单/线上身份分层与原命中逻辑。</p><p class="muted" style="margin-bottom:0">指定设备与指定用户互斥；指定对象仅绕过身份分层，仍须满足 APP 条件、发布范围和生命周期。保存后立即生效。</p></div>`;}
const field=(label,value,cls='')=>`<div class="field ${cls}"><label>${label}</label><div class="readonly">${esc(value??'—')}</div></div>`;
function firmwareFields(){
 let isM=draft.kind==='MCU固件';
 if(!creating)return `<div class="form-grid">${field('固件名称',draft.name)}${field('固件类型',draft.kind)}${field('固件版本',draft.version)}${field('硬件版本',draft.hardware)}${field('通道号',draft.channel)}${field('状态',draft.status)}${field('上传时间',draft.time)}${field('功能版本','1')}${field('APP版本号',draft.app)}${targetBox()}<div class="field"><label>备注</label><textarea id="remark" aria-label="备注" rows="3" ${draft.status!=='开发中'||drawerRead?'disabled':''} placeholder="填写固件说明或变更摘要">${esc(draft.remark)}</textarea></div></div>`;
 return `<div class="form-grid"><div class="field required"><label for="functionVersion">功能版本</label><select id="functionVersion"><option value="">请选择</option><option value="1" ${draft.functionVersion?'selected':''}>版本1 - 已发布</option></select></div><div class="field required"><label for="kind">固件类型</label><select id="kind"><option ${isM?'selected':''}>MCU固件</option><option ${!isM?'selected':''}>模组固件</option></select></div>${isM?`<div class="field"><label for="channel">通道号</label><input id="channel" type="number" min="1" placeholder="可选，正整数" value="${esc(draft.channel||'')}"><small class="muted">仅 MCU 固件配置通道号；留空为 NULL，可单固件发布，但不可关联虚拟版本。</small></div>`:'<div></div>'}<div class="field required"><label>上传固件文件</label><button id="selectFirmware">选择文件</button><input type="file" id="firmwareFile" accept=".ufw,.zip,.bin" hidden><span class="muted" id="packageName">${esc(draft.name||'支持 .ufw、.zip、.bin。示例：Lute_M9_3.08_10_aabb_20240401.ufw')}</span></div>${field('产品','调奶器FD04X')}<div></div><div class="parsed full">${[['公司','Lute'],['项目','FD04X'],['固件版本',draft.version||'—'],['硬件版本',draft.hardware||'—'],['校验码',draft.checksum||'—'],['日期','20261106'],['文件格式',draft.ext||'—'],['固件名称',draft.name||'—'],['初始状态','开发中']].map(([k,v])=>`<div><b>${k}</b>${esc(v)}</div>`).join('')}</div><div class="field required"><label for="appVersion">APP版本号</label><div class="version-pair"><select><option>版本不低于 ≥</option><option>等于 =</option></select><input id="appVersion" placeholder="v x.y.z" value="${esc(draft.appInput||'')}"></div></div><div></div>${targetBox()}<div class="field"><label for="remark">备注</label><textarea id="remark" rows="3" placeholder="填写固件说明或变更摘要">${esc(draft.remark)}</textarea></div></div>`;
}
function virtualFields(){let locked=!['开发中','测试中'].includes(draft.status)||drawerRead;
 return `<div class="notice" style="margin-top:0">虚拟版本以自身的 APP 条件作为命中前置过滤，不继承所关联 MCU 的 APP 条件。请至少关联 1 个可用 MCU；“通道号 + 硬件版本”不可重复，无需覆盖全部通道。</div><div class="form-grid"><div class="field required"><label for="virtualVersion">虚拟版本号</label><input id="virtualVersion" placeholder="例如 2.2.0" value="${esc(draft.version||'')}" ${!creating?'readonly class="readonly"':''}><small class="muted">${creating?'产品内唯一，格式为 x.y.z。':'版本号创建后不可修改。'}</small></div><div class="field required"><label>虚拟版本级 APP 条件</label><div class="version-pair"><select ${locked?'disabled':''}><option>版本不低于 ≥</option><option>等于 =</option></select><input id="appVersion" aria-label="虚拟 APP 版本号" placeholder="例如 v2.2.10" value="${esc(draft.appInput||'')}" ${locked?'disabled':''}></div><small class="muted">独立维护，不继承组件固件。</small></div>${targetBox()}<div class="readonly">${creating?'已选组件':'当前状态'}：${creating?(draft.components||[]).length+' 个':draft.status}</div><div class="readonly">${creating?'创建后状态：开发中':'编辑边界：测试中截止'}</div><div class="component-card full"><div style="display:flex;align-items:center;justify-content:space-between"><b>* 关联 MCU 固件</b><button id="clearComponents" ${locked?'disabled':''}>清空已选</button></div><div class="chosen"><div class="muted">已选 MCU</div><div id="selectedComponents" class="chips">${(draft.components||[]).map(id=>`<span class="tag">${esc(obj(id)?.name||id)}</span>`).join('')||'尚未选择 MCU'}</div></div><div class="component-tools"><input id="componentSearch" placeholder="固件名 / 版本 / 硬件版本"><select aria-label="筛选通道"><option>全部通道</option><option>1</option><option>0</option></select><select aria-label="筛选状态"><option>全部可关联状态</option><option>开发中</option></select><button id="searchComponents">搜索</button><button id="resetComponentSearch">重置筛选</button></div><div class="muted">按通道号 + 硬件版本去重</div><div id="componentRows">${componentsTable('',locked)}</div></div></div><div class="notice warn">${creating?'保存后仅创建开发中虚拟版本，不提升组件状态；进入测试时才提升开发中组件。发布时冻结关联集合和包信息。':'测试中保存后，新加入的开发中组件立即提升至测试中；移除组件不会回退。发布后关联集合与包信息冻结。'}</div>`;
}
function componentsTable(query,locked){return `<table><thead><tr><th style="width:38px">选择</th><th>固件名称 / 备注</th><th style="width:60px">固件版本</th><th style="width:58px">通道号</th><th style="width:68px">硬件版本</th><th style="width:105px">状态 / 选择说明</th></tr></thead><tbody>${objects.filter(x=>x.kind==='MCU固件'&&(!query||x.name.includes(query))).map(o=>`<tr><td><input type="checkbox" data-component="${o.id}" aria-label="选择 ${esc(o.name)}" ${(draft.components||[]).includes(o.id)?'checked':''} ${locked||+o.channel<=0?'disabled':''}></td><td>${esc(o.name)}</td><td>${o.version}</td><td>${o.channel}</td><td>${o.hardware}</td><td><span class="tag">${o.status}</span>${+o.channel<=0?'<div class="muted">仅正整数通道的 MCU 可关联</div>':''}</td></tr>`).join('')}</tbody></table>`;}
function openEditor(id,read=false){
 if(busy)return;
 drawerMode='base';creating=!id;selected=id||selected;opening=id?clone(obj(id)):null;
 draft=id?clone(obj(id)):{id:'new-'+Date.now(),kind:tab==='virtual'?'虚拟版本':'MCU固件',name:'',version:'',hardware:'',channel:null,status:'开发中',publishedOnce:false,notes:{en:'Bug fixed'},remark:'',components:[],target:'不限',app:'',time:'2026-11-06 20:00:00'};
 drawerRead=read;lang='en';view='source';renderDrawer();renderNotes();

}
function openReleaseNotes(id){
 if(busy)return;
 if(baseline)return toast('现状对照隐藏新增功能，请关闭对照后打开 Release note。');
 const o=obj(id);if(!o)return;
 selected=id;creating=false;drawerMode='notes';drawerRead=false;
 opening=clone(o);draft=clone(o);lang='en';view='source';renderDrawer();renderNotes();
}
function renderReleaseNotesDrawer(){
 const o=obj(draft.id)||draft;
 $('overlay').innerHTML=`<div class="shade"><section class="drawer release-notes" role="dialog" aria-label="Release note 管理"><header class="drawer-head"><h3>Release note${anchor(2,'base')}</h3><p>独立维护当前版本的发布说明</p><button class="icon-close" id="closeDrawer" aria-label="关闭抽屉">×</button></header><div class="drawer-body"><div id="base-target" class="rn-context"><span class="muted">${esc(o.kind)} · 版本 ${esc(o.version)}</span><div class="rn-object-name">${esc(o.name)}</div><span class="tag" id="rnStatus">${esc(o.status)}</span></div><section id="rn-section" class="rn-section"></section><div id="saveError" role="alert"></div></div><footer class="drawer-footer" id="save-target"><button id="cancelDrawer">${canWrite()?'取消':'关闭'}</button><button id="saveObject" class="primary" ${!canWrite()?'disabled':''}>保存</button>${anchor(6,'save')}</footer></section></div>`;
 renderRN();$('closeDrawer').onclick=closeDrawer;$('cancelDrawer').onclick=closeDrawer;$('saveObject').onclick=saveObject;bindAnchors();
}
function renderDrawer(){
 if(!draft){$('overlay').innerHTML='';return;}
 if(drawerMode==='notes')return renderReleaseNotesDrawer();
 const virtual=draft.kind==='虚拟版本';
 $('overlay').innerHTML=`<div class="shade"><section class="drawer ${virtual?'virtual':''}" role="dialog" aria-label="${creating?'新建':drawerRead?'查看':'编辑'}${virtual?'虚拟版本':'固件版本'}"><header class="drawer-head"><h3>${creating?'新建':drawerRead?'查看':'编辑'}${virtual?'虚拟版本':'固件版本'}${anchor(2,'base')}</h3><p>${virtual?(creating?'配置独立 APP 条件、应用对象并关联 MCU；组件固件的 APP 条件不会被继承。':'开发中、测试中可维护虚拟版本级 APP 条件和关联 MCU，并按通道号 + 硬件版本阻断重复组合。应用对象保存后立即生效。'):(creating?'选择功能版本、固件类型并上传固件文件；版本和硬件版本由文件名解析。':'仅开发中可维护备注；应用对象在开发中、测试中、发布中、已发布均可编辑，保存立即生效。')}</p><button class="icon-close" id="closeDrawer" aria-label="关闭抽屉">×</button></header><div class="drawer-body"><div id="base-target">${virtual?virtualFields():firmwareFields()}</div><div id="saveError" role="alert"></div></div><footer class="drawer-footer" id="save-target"><button id="cancelDrawer">${drawerRead?'关闭':'取消'}</button>${!drawerRead?'<button id="saveObject" class="primary">保存</button>':''}${anchor(6,'save')}</footer></section></div>`;
 bindBase();$('closeDrawer').onclick=closeDrawer;$('cancelDrawer').onclick=closeDrawer;if($('saveObject'))$('saveObject').onclick=saveObject;bindAnchors();
}
function captureBase(){
 if(!draft||drawerMode!=='base')return;
 if($('remark')&&!$('remark').disabled)draft.remark=$('remark').value;
 if($('functionVersion'))draft.functionVersion=$('functionVersion').value;
 if($('channel'))draft.channel=$('channel').value||null;
 if($('appVersion')&&$('appVersion').value!==(draft.appInput||''))draft.appInput=$('appVersion').value;
 if($('virtualVersion'))draft.version=$('virtualVersion').value;
 const ids=document.querySelector('#targetExtra input');if(ids)draft.targetIds=ids.value;
}
function bindBase(){
 document.querySelectorAll('input[name=target]').forEach(e=>e.onchange=()=>{captureBase();draft.target=e.value;$('targetExtra').innerHTML=e.value==='不限'?'':`<input aria-label="${e.value}列表" placeholder="输入${e.value==='指定设备'?'设备ID':'用户ID'}，多个用逗号分隔">`;});
 if($('kind'))$('kind').onchange=()=>{captureBase();draft.kind=$('kind').value;renderDrawer();renderNotes();};
 if($('selectFirmware'))$('selectFirmware').onclick=()=>$('firmwareFile').click();
 if($('firmwareFile'))$('firmwareFile').onchange=e=>{captureBase();let f=e.target.files[0];if(!f)return;let m=f.name.match(/^([^_]+)_([^_]+)_([^_]+)_([^_]+)_([^_]+)_(\d{8})\.(ufw|zip|bin)$/i);if(!m){toast('文件名无法解析，请按既有命名规则上传。',true);return;}Object.assign(draft,{name:f.name,version:m[3],hardware:m[4],checksum:m[5],ext:m[7]});renderDrawer();};
 if($('clearComponents'))$('clearComponents').onclick=()=>{captureBase();draft.components=[];renderDrawer();};
 if($('searchComponents'))$('searchComponents').onclick=()=>{$('componentRows').innerHTML=componentsTable($('componentSearch').value,!['开发中','测试中'].includes(draft.status)||drawerRead);bindComponents();};
 if($('resetComponentSearch'))$('resetComponentSearch').onclick=()=>{$('componentSearch').value='';$('searchComponents').click();};bindComponents();
}
function bindComponents(){document.querySelectorAll('[data-component]').forEach(e=>e.onchange=()=>{let list=new Set(draft.components||[]);if(e.checked){const picked=obj(e.dataset.component);if([...list].some(id=>{const x=obj(id);return x.channel===picked.channel&&x.hardware===picked.hardware;})){e.checked=false;toast('通道号 + 硬件版本不可重复。',true);return;}list.add(e.dataset.component);}else list.delete(e.dataset.component);draft.components=[...list];$('selectedComponents').innerHTML=draft.components.map(id=>`<span class="tag">${esc(obj(id).name)}</span>`).join('')||'尚未选择 MCU';});}
function canWrite(){return draft&&drawerMode==='notes'&&!drawerRead&&editable(obj(draft.id)||draft);}
function renderRN(){if(!$('rn-section'))return;
 const writable=canWrite(), saved=obj(draft.id)||draft, notes=writable?draft.notes:saved.notes;
 const result=effective(notes,lang),current=notes[lang]||'';
 const languageTools=`<div class="rn-tools" id="language-target"><select id="language" aria-label="Release note语言">${langs.map(([c,n])=>`<option value="${c}" ${lang===c?'selected':''}>${n}${c==='en'?'（默认 / 兜底）':''}</option>`).join('')}</select>${writable?`<div><button id="importNotes">导入多语言</button>${anchor(4,'import')}</div>`:''}</div>`;
 let body;
 if(writable){
  body=`<div class="muted">${lang==='en'?'英语必填，为其他未配置语言提供兜底。':'非必填；未配置时使用当前英语。清空本语言可恢复兜底。'}</div><div class="editor-tabs" id="markdown-target"><button id="sourceView" class="${view==='source'?'active':''}">Markdown 源码</button><button id="previewView" class="${view==='preview'?'active':''}">预览</button>${anchor(5,'markdown')}</div><div id="editorBody">${view==='source'?`<textarea id="noteSource" class="source" aria-label="Release note Markdown源码" dir="${lang==='ar'?'rtl':'auto'}" placeholder="${lang==='en'?'请输入英文 Release note':'未配置；使用当前英语兜底（不写入独立译文）'}">${esc(current)}</textarea>`:`<div class="status-line">${result.fallback?'使用英语兜底':'本语言内容'}</div><div class="preview" dir="${lang==='ar'?'rtl':'auto'}">${RN.markdown(result.text)}</div>`}</div><div id="noteError" class="error-text"></div><div class="rn-footer"><span>${blank(current)&&lang!=='en'?'未配置 · 使用英语兜底':'已配置 · '+(langs.find(x=>x[0]===lang)?.[1])}</span><span id="count">${current.length} / ${MAX_TEXT}</span></div><div class="muted" style="margin-top:7px">支持 Markdown，保存保留源码和换行。</div>`;
 }else{
  const changes=codes.filter(c=>(draft.notes[c]||'')!==(saved.notes[c]||''));
  body=`<div id="markdown-target" class="rn-reading"><div class="rn-reading-label">${result.fallback?'未配置本语言 · 使用英语兜底':'已保存 · '+langs.find(x=>x[0]===lang)[1]}${anchor(5,'markdown')}</div><article class="preview rn-content" aria-label="Release note内容" dir="${lang==='ar'?'rtl':'auto'}">${RN.markdown(result.text)}</article></div>${changes.length?`<section class="rn-unsaved" aria-label="未保存内容"><h4>未保存内容</h4><p class="muted">状态已变为只读，以下内容未写入，可选择复制；上方展示已保存内容。</p>${changes.map(c=>`<div class="rn-reading-label">${langs.find(x=>x[0]===c)[1]}</div><pre class="rn-unsaved-text" dir="${c==='ar'?'rtl':'auto'}">${blank(draft.notes[c])?'（草稿已清空本语言）':esc(draft.notes[c])}</pre>`).join('')}</section>`:''}`;
 }
 $('rn-section').innerHTML=`<div class="rn-title"><b>Release note</b>${anchor(3,'language')}<span class="tag ${writable?'blue':''}">${writable?'可编辑':'只读'}</span></div>${!writable?`<div class="notice" style="margin-top:0">${saved.publishedOnce?'该版本已首次发布，Release note 永久只读。':'当前为'+saved.status+'，Release note 只读。'}</div>`:''}${languageTools}${body}`;
 if($('rnStatus'))$('rnStatus').textContent=saved.status;
 if($('saveObject')){$('saveObject').classList.toggle('hidden',!writable);if(!busy)$('saveObject').disabled=!writable;}
 if($('cancelDrawer'))$('cancelDrawer').textContent=writable?'取消':'关闭';
 $('language').onchange=()=>{lang=$('language').value;renderRN();};
 if($('sourceView'))$('sourceView').onclick=()=>{view='source';renderRN();};
 if($('previewView'))$('previewView').onclick=()=>{view='preview';renderRN();};
 if($('noteSource'))$('noteSource').oninput=e=>{draft.notes[lang]=e.target.value;$('count').textContent=e.target.value.length+' / '+MAX_TEXT;$('noteError').textContent=e.target.value.length>MAX_TEXT?'超过演示长度上限，请缩短后保存。':lang==='en'&&blank(e.target.value)?'英语 Release note 必填。':'';};
 if($('importNotes'))$('importNotes').onclick=openImport;
 bindAnchors();
}
function closeDrawer(){
 if(!draft||busy)return;captureBase();
 const changed=drawerMode==='notes'?JSON.stringify(draft.notes)!==JSON.stringify(opening.notes):creating?!!(draft.name||draft.functionVersion||draft.appInput||draft.remark||draft.channel||draft.version||draft.target!=='不限'||(draft.components||[]).length)||Object.entries(draft.notes).some(([k,v])=>k==='en'?v!=='Bug fixed':!blank(v)):JSON.stringify(draft)!==JSON.stringify(opening);
 if(changed){showConfirm('放弃未保存的修改？','关闭后将丢弃当前表单中的修改，已保存内容不变。','放弃修改',()=>{draft=null;renderDrawer();renderNotes();});return;}
 draft=null;renderDrawer();renderNotes();
}
async function saveObject(){
 if(busy||!draft||drawerRead)return;
 if(baseline){toast('现状对照仅供查看，请关闭对照后验证新增功能。');return;}
 const notesOnly=drawerMode==='notes';captureBase();
 const fail=msg=>{$('saveError').innerHTML=`<div class="notice error">${esc(msg)}</div>`;$('saveError').scrollIntoView({block:'nearest'});toast(msg,true);};
 if(notesOnly){
  if(race){const latest=obj(draft.id);latest.status='已发布';latest.publishedOnce=true;persist();renderList();race=false;}
  if(!canWrite()){renderRN();return fail('对象状态已变为只读，未写入任何内容；当前输入保留，可复制。');}
  if(blank(draft.notes.en))return fail('英语 Release note 必填，请填写后保存。');
  if(codes.some(c=>(draft.notes[c]||'').length>MAX_TEXT))return fail('Release note 超过演示长度上限，未写入任何内容。');
 }else if(creating){if(draft.kind==='虚拟版本'){
  if(!/^\d+\.\d+\.\d+$/.test(draft.version))return fail('请填写 x.y.z 格式的虚拟版本号。');
  if(objects.some(x=>x.kind==='虚拟版本'&&x.version===draft.version))return fail('虚拟版本号已存在。');
  if(!draft.components.length)return fail('请至少关联 1 个可用 MCU。');
 }else{if(!draft.functionVersion||!draft.name)return fail('请选择功能版本并上传可解析的固件文件。');if(draft.channel!==null&&(!/^[1-9]\d*$/.test(draft.channel)))return fail('通道号仅支持正整数或留空。');}
 if(!/^v?\d+\.\d+\.\d+$/.test(draft.appInput||''))return fail('请填写 x.y.z 格式的 APP 版本号。');
 }
 $('saveError').innerHTML='';busy=true;$('saveObject').textContent='保存中…';$('saveObject').disabled=true;
 $('closeDrawer').disabled=true;$('cancelDrawer').disabled=true;
 if(notesOnly){$('language').disabled=true;$('sourceView').disabled=true;$('previewView').disabled=true;$('importNotes').disabled=true;if($('noteSource'))$('noteSource').readOnly=true;}
 renderNotes();await new Promise(r=>setTimeout(r,450));busy=false;
 $('closeDrawer').disabled=false;$('cancelDrawer').disabled=false;
 if(notesOnly)renderRN();
 if(saveFailure){$('saveObject').textContent='重试保存';$('saveObject').disabled=notesOnly&&!canWrite();return fail('保存失败，内容尚未写入，请重试；当前输入已保留。');}
 if(notesOnly&&!canWrite())return fail('对象已进入只读状态，未写入任何内容；输入保留。');
 if(notesOnly){
  const notes=clone(draft.notes);codes.forEach(c=>{if(c!=='en'&&blank(notes[c]))delete notes[c];});
  obj(draft.id).notes=notes;
 }else{
  const saved=clone(draft);
  if(creating){saved.notes={en:'Bug fixed'};if(saved.kind==='虚拟版本')saved.name=saved.version;saved.app='版本不低于 v'+saved.appInput.replace(/^v/,'');objects.push(saved);selected=saved.id;}
  else {const latest=obj(saved.id);saved.status=latest.status;saved.publishedOnce=latest.publishedOnce;saved.notes=clone(latest.notes);objects[objects.findIndex(x=>x.id===saved.id)]=saved;}
 }
 persist();draft=null;renderDrawer();renderList();renderNotes();toast(notesOnly?'Release note 保存成功':'保存成功');
}
function showConfirm(title,text,action,yes){modal='confirm';$('modalLayer').innerHTML=`<div class="modal-shade"><section class="modal small" role="dialog" aria-label="${title}"><div class="modal-head">${title}</div><div class="modal-body">${esc(text)}</div><div class="modal-footer"><button id="confirmCancel">取消</button><button id="confirmYes" class="primary">${action}</button></div></section></div>`;$('confirmCancel').onclick=closeModal;$('confirmYes').onclick=()=>{closeModal();yes();};renderNotes();}
function deleteObject(id){const o=obj(id);if(o.kind!=='虚拟版本'&&objects.some(x=>x.kind==='虚拟版本'&&(x.components||[]).includes(id))){modal='delete';$('modalLayer').innerHTML=`<div class="modal-shade"><section class="modal small" role="dialog" aria-label="无法删除固件"><div class="modal-head" id="delete-target">无法删除固件 ${anchor(7,'delete')}</div><div class="modal-body"><div class="notice error">该固件已关联虚拟版本，无法直接删除</div><p>关联版本：${objects.filter(x=>(x.components||[]).includes(id)).map(x=>esc(x.version)).join('、')}</p><p class="muted">固件、Release note 及关联均保持原值。</p></div><div class="modal-footer"><button id="dismissDelete" class="primary">我知道了</button></div></section></div>`;$('dismissDelete').onclick=closeModal;renderNotes();bindAnchors();return;}
 if(o.status!=='开发中'){toast('当前状态不允许删除。',true);return;}
 showConfirm('删除版本？','删除后该样例版本及其说明不再可读。此操作仅修改本地原型数据。','删除',()=>{objects=objects.filter(x=>x.id!==id);persist();renderList();toast('已删除本地样例');});
}
function closeModal(){preflightVersion++;modal=null;importPlan=null;$('modalLayer').innerHTML='';renderNotes();}
function openImport(){if(!canWrite())return;modal='import';importPlan=null;importName='';renderImport();renderNotes();}
function renderImport(){
 $('modalLayer').innerHTML=`<div class="modal-shade"><section class="modal" role="dialog" aria-label="导入多语言"><div class="modal-head" id="import-target">导入多语言 ${anchor(4,'import')}<button class="icon-close" id="closeImport" aria-label="关闭导入">×</button></div><div class="modal-body"><div class="file-select"><button id="chooseImport" class="primary">选择文件</button><input type="file" id="importFile" accept=".xlsx,.csv" hidden><span id="fileName" class="muted">${esc(importName||'Excel (.xlsx) / UTF-8 CSV')}</span><button id="csvTemplate" class="link">CSV 模板</button><button id="xlsxTemplate" class="link">Excel 模板</button></div><div class="notice">模板16种语言数据格全空。非空覆盖；空白、空值和缺列保留现值。清空翻译请回到表单操作。导入仅作用当前对象。</div><div id="importResult">${importPlan?planHTML():''}</div><div class="muted">演示上限：文件 1 MiB，单语言 10000 字符；正式上限由技术实施前冻结。</div></div><div class="modal-footer"><button id="cancelImport">取消</button><button id="applyImport" class="primary" ${!importPlan?.changes.length||!canWrite()?'disabled':''}>应用到当前表单</button></div></section></div>`;
 $('chooseImport').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const f=e.target.files[0];if(f)await preflight(f);};
 $('csvTemplate').onclick=()=>downloadTemplate('csv');$('xlsxTemplate').onclick=()=>downloadTemplate('xlsx');$('closeImport').onclick=closeModal;$('cancelImport').onclick=closeModal;
 $('applyImport').onclick=()=>{if(!canWrite()){toast('当前对象已只读，未应用导入。',true);return;}if(!importPlan?.changes.length)return;draft.notes=clone(importPlan.merged);closeModal();renderRN();toast('已应用到表单，保存后生效。');};bindAnchors();
}
function planHTML(){return `<div class="notice ${importPlan.changes.length?'success':''}">${importPlan.message}${importPlan.changes.length?' · '+importPlan.changes.length+' 种语言有变更':''}</div><table class="diff-table"><thead><tr><th style="width:90px">语言</th><th style="width:65px">结果</th><th>当前表单</th><th>导入后</th></tr></thead><tbody>${importPlan.items.map(i=>`<tr class="${['新增','覆盖'].includes(i.action)?'changed':''}"><td>${langs.find(x=>x[0]===i.code)[1]}<br><span class="muted">${i.code}</span></td><td>${i.action}</td><td><pre>${esc(i.before||'未配置')}</pre></td><td><pre>${esc(i.after||'未配置')}</pre></td></tr>`).join('')}</tbody></table>`;}
async function preflight(file){
 const currentPreflight=++preflightVersion;
 importPlan=null;importName=file.name;$('fileName').textContent=file.name;$('applyImport').disabled=true;$('importResult').innerHTML='<div class="notice">正在预检…</div>';
 try{
  if(file.size>MAX_FILE)throw Error('文件超过演示上限 1 MiB');
  const ext=file.name.split('.').pop().toLowerCase();if(!['xlsx','csv'].includes(ext))throw Error('请选择 .xlsx 或 UTF-8 .csv 模板格式');
  const data=new Uint8Array(await file.arrayBuffer());let rows;
  if(ext==='csv'){if(data[0]===0x50&&data[1]===0x4b)throw Error('CSV 文件实际结构错误');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(data);}catch{throw Error('CSV 编码错误，请使用 UTF-8（可含 BOM）');}rows=RN.csv(text);}
  else{if(data[0]!==0x50||data[1]!==0x4b)throw Error('Excel 实际结构错误或文件已损坏');let book;try{book=XLSX.read(data,{type:'array',cellFormula:true});}catch{throw Error('Excel 文件已损坏或无法解析');}rows=RN.workbookRows(book,XLSX);}
  if(currentPreflight!==preflightVersion||modal!=='import')return;
  if(!canWrite())throw Error('对象已进入只读状态，无法导入');importPlan=RN.plan(rows,draft.notes);
  if(modal==='import'){renderImport();renderNotes();}
 }catch(e){if(currentPreflight===preflightVersion&&modal==='import'){$('importResult').innerHTML=`<div class="notice error" role="alert">预检失败：${esc(e.message)}。未改写任何语言，请修正文件后重试。</div>`;$('applyImport').disabled=true;}}
}
function downloadTemplate(type){let rows=[codes,codes.map(()=> '')];if(type==='xlsx'){let b=XLSX.utils.book_new();XLSX.utils.book_append_sheet(b,XLSX.utils.aoa_to_sheet(rows),'Release note');XLSX.writeFile(b,'release-note-template.xlsx');return;}const blob=new Blob(['\uFEFF'+codes.join(',')+'\r\n'+codes.map(()=> '').join(',')+'\r\n'],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='release-note-template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function openConsumer(){modal='consumer';let cobj=selected;let clang='en';
 const render=()=>{const o=obj(cobj)||objects[0],r=effective(o.notes||{},clang);$('modalLayer').innerHTML=`<div class="modal-shade"><section class="modal" role="dialog" aria-label="APP读取验证"><div class="modal-head" id="consumer-target">APP 读取与渲染验证 ${anchor(8,'consumer')}<button class="icon-close" id="closeConsumer" aria-label="关闭读取验证">×</button></div><div class="modal-body"><div class="notice">原型验证工具 · 仅使用已保存的本地样例数据；展示需求语义，不代表真实接口或 APP 页面。</div><div class="consumer-controls"><div class="field"><label>读取对象</label><select id="consumeObject">${objects.map(x=>`<option value="${x.id}" ${o.id===x.id?'selected':''}>${x.kind} · ${esc(x.version)}</option>`).join('')}</select></div><div class="field"><label>请求语言</label><select id="consumeLanguage">${langs.map(([c,n])=>`<option value="${c}" ${clang===c?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="consumer-meta">对象：${esc(o.name)}<br>实际内容语言：${r.source} ${r.fallback?'· 使用英语兜底':'· 本语言内容'}<br>${o.kind==='虚拟版本'?'独立读取本虚拟版本说明，不拼接组件。':''}</div><div class="preview" dir="${clang==='ar'?'rtl':'auto'}">${RN.markdown(r.text)}</div><details style="margin-top:18px"><summary>查看已保存 Markdown 源码</summary><pre class="source" style="overflow:auto">${esc(r.text)}</pre></details></div><div class="modal-footer"><button id="doneConsumer" class="primary">完成</button></div></section></div>`;
 $('consumeObject').onchange=e=>{cobj=e.target.value;render();};$('consumeLanguage').onchange=e=>{clang=e.target.value;render();};$('closeConsumer').onclick=closeModal;$('doneConsumer').onclick=closeModal;bindAnchors();};render();renderNotes();}
function openHistory(){modal='history';let sample=[...statuses.flatMap((status,i)=>['MCU固件','模组固件','虚拟版本'].map((kind,j)=>({id:i+'-'+j,kind,status,notes:undefined})))];let message='18 个历史样例：3类对象 × 6状态，新增字段尚未初始化。';
 const render=()=>{$('modalLayer').innerHTML=`<div class="modal-shade"><section class="modal" role="dialog" aria-label="存量初始化验证"><div class="modal-head" id="history-target">存量初始化验证 ${anchor(9,'history')}</div><div class="modal-body"><div class="notice">评审工具 · 内存样例，不执行真实迁移。无旧 Release note 及旧译文。</div><p>${esc(message)}</p><div style="display:flex;gap:8px"><button id="initHistory" class="primary">初始化 / 重复初始化</button><button id="maintainHistory" ${!sample[0].notes?'disabled':''}>模拟维护首条英文</button></div><table style="margin-top:18px"><thead><tr><th>对象</th><th>状态</th><th>英语</th><th>其他15语言</th></tr></thead><tbody>${sample.map(x=>`<tr><td>${x.kind}</td><td>${x.status}</td><td>${esc(x.notes?.en||'尚无字段')}</td><td>未配置</td></tr>`).join('')}</tbody></table></div><div class="modal-footer"><button id="doneHistory">关闭</button></div></section></div>`;
 $('initHistory').onclick=()=>{sample.forEach(x=>{if(!x.notes)x.notes={en:'Bug fixed'};});message='已覆盖18条样例；仅填补新增字段，重复执行保留维护内容。';render();};$('maintainHistory').onclick=()=>{sample[0].notes.en='Improved connection stability';message='首条开发中对象已维护为自定义英文，再次初始化应保留。';render();};$('doneHistory').onclick=closeModal;bindAnchors();};render();renderNotes();}
function renderNotes(){
 const keepTools=document.querySelector('.review-tools')?.open||false;
 let scope=modal==='import'?'导入预检':modal==='consumer'?'APP读取验证':modal==='history'?'存量验证':modal==='delete'?'删除阻断':draft?(drawerMode==='notes'?'Release note · '+draft.kind+' · '+(obj(draft.id)||draft).status:draft.kind+' · '+(creating?'新建':draft.status)):(tab==='virtual'?'虚拟版本列表':'固件版本列表');
 let out=`<h2>原型批注</h2><div class="scope">${scope} · 本地交互样例</div><details class="review-tools" ${keepTools?'open':''}><summary>评审工具（非产品功能）</summary><p class="muted">场景只修改本地样例；切换对象丢弃未保存草稿。基线样式来自2026-11-06现场取证。</p><label for="scenarioObject">演示对象</label><select id="scenarioObject">${objects.map(o=>`<option value="${o.id}" ${selected===o.id?'selected':''}>${o.kind} · ${esc(o.version)} · ${o.status}</option>`).join('')}</select><label for="scenarioStatus">对象状态</label><select id="scenarioStatus">${statuses.map(s=>`<option ${obj(selected)?.status===s?'selected':''}>${s}</option>`).join('')}</select><label><input type="checkbox" id="publishedOnce" ${obj(selected)?.publishedOnce?'checked':''}> 曾首次进入已发布（永久只读）</label><div class="tool-buttons"><button id="openSelected">打开 Release note</button><button id="consumerTool">APP读取验证</button>${anchor(8,'consumer')}<button id="historyTool">存量初始化验证</button>${anchor(9,'history')}</div><label><input id="saveFailure" type="checkbox" ${saveFailure?'checked':''}> 模拟保存失败（取消勾选可重试）</label><label><input id="saveRace" type="checkbox" ${race?'checked':''}> 下次保存前变为已发布</label><label for="listScenario">列表异常</label><select id="listScenario"><option value="normal" ${listMode==='normal'?'selected':''}>正常</option><option value="loading" ${listMode==='loading'?'selected':''}>加载中</option><option value="error" ${listMode==='error'?'selected':''}>加载失败</option><option value="empty" ${listMode==='empty'?'selected':''}>空列表</option></select><div class="tool-buttons"><button id="resetDemo">重置全部本地样例</button></div><p><a href="https://github.com/HawZZ/root-interactivable-prototype/blob/main/prototypes/firmware-release-note/docs/ui-baseline.md">现状证据与改动边界 ↗</a></p></details>`;
 if(modal==='import'){
 out+=card(4,'import','预检 → 应用 → 保存','Release note > 导入多语言','<p><b>模板：</b>16语言列、一条数据行，所有语言数据格全空；Excel .xlsx / UTF-8 CSV（可含BOM）。</p><p><b>合并：</b>非空覆盖；空、纯空白、缺列跳过保留现值。新增/覆盖/不变/跳过逐语言对照。空模板或只有表头为无变更，不能应用。</p><p><b>阻断：</b>未知/重复语言、多数据行、多个非空工作表、损坏/编码错误、公式（含缓存）、超限整单拒绝，定位原因，零部分写入。</p><p><b>提交：</b>应用仅入当前表单；主保存才生效。取消不改表单；换文件重新预检。只读状态不能应用。</p><p><b>演示假设：</b>文件1MiB / 单语言10000字符；正式数值技术冻结。Markdown源码及换行原样保留。</p>');
 }else if(modal==='consumer')out+=card(8,'consumer','对应对象与语言读取','原型验证工具 > APP读取','<p><b>结果：</b>读取已保存对象，本语言未配置时用其当前英文。虚拟版本不读取组件说明；未保存草稿不可读。</p><p><b>边界：</b>这是语义验证面板，不是APP升级页面、API调试器或实际接口契约。具体端点/参数/缓存由技术确定。</p><p><b>验收：</b>真实APP需按MD01–MD10同源码/同策略验证语义、内容、结构和安全一致；允许视觉差异。本地同一渲染函数演示不能证明真实双端联调通过。</p>');
 else if(modal==='history')out+=card(9,'history','新增字段的存量默认','原型验证工具 > 存量初始化','<p><b>范围：</b>三类对象各状态，英语精确 Bug fixed，其他15语言未配置。没有旧译文。</p><p><b>防覆盖：</b>先初始化，再维护首条英文，再重复初始化，首条保持自定义内容。系统初始化不开放已发布对象人工编辑。</p><p><b>边界：</b>仅在内存18条样例验证，不运行真实迁移。</p>');
 else if(modal==='delete')out+=card(7,'delete','存在关联，阻止直接删除','固件列表 > 删除','<p><b>判断：</b>存在任一虚拟版本关联即阻断，即使固件开发中也不能绕过。</p><p><b>结果：</b>固件、说明、关联均保留；不自动解绑或级联删除。无关联后仍按既有生命周期判断。</p>');
 else if(draft&&drawerMode==='base'){
 out+=card(2,'base','既有信息表单','创建 / 编辑 / 详情抽屉 > 基础字段','<p><b>现状：</b>固件560px、虚拟760px；沿用原字段、应用对象、备注或MCU关联与底部按钮。</p><p><b>入口：</b>Release note由列表操作列单独管理，此表单不配置或导入说明。新建成功自动生成英语 Bug fixed，再从列表进入维护。</p><p><b>隔离：</b>信息保存保留已保存的说明，备注与发布日志保持各自用途。包解析、发布与命中规则沿用既有流程。</p>');
 out+=card(6,'save','信息保存与默认说明','信息抽屉 > 底部按钮','<p><b>保存：</b>沿用既有信息校验；新建成功自动初始化英语 Bug fixed，其他语言未配置。取消创建不生成对象或说明。</p><p><b>后续：</b>创建后从列表「操作 → Release note」独立维护；编辑基础信息不覆盖已保存说明。</p>');
 }else if(draft){
 out+=card(2,'base','Release note独立管理','列表 > 操作 > Release note','<p><b>布局：</b>760px独立管理抽屉，顶部只读展示对象类型、名称、版本和当前状态，下方为语言、Markdown、导入及保存。此形态为本次新增设计，沿用平台样式。</p><p><b>隔离：</b>不混入包信息、备注、应用对象或组件配置；三类对象各自维护，虚拟版本不拼接组件。</p><p><b>进入：</b>创建成功后从列表进入；暂停、停止、已发布仍可查看，按状态关闭编辑。</p>');
 out+=card(3,'language','独立字段与16语言','Release note独立管理 > 语言','<p><b>默认：</b>三类对象各自维护；默认英语，内容精确 Bug fixed，必填且兜底。其余15种非必填。</p><p><b>语言：</b>en / zh / de / fr / zh-Hant / it / pt / es / ar / vi / id / th / ms / ja / ru / fil。</p><p><b>交互：</b>切换保留当前草稿；缺译的源码为空，预览标记英语兜底，不伪造独立译文。非英语空或纯空白视为未配置，手工清空恢复兜底。</p><p><b>状态：</b>创建自动默认；开发中/测试中/发布中可编辑及导入；暂停、停止、已发布只读。首次已发布永久截止；未曾已发布的暂停恢复发布中可编辑。权限平台统一处理。</p>');
 if(canWrite())out+=card(4,'import','只作用当前对象的导入','Release note > 导入多语言','<p><b>路径：</b>下载空模板 → 选择文件 → 自动预检 → 差异确认 → 应用当前表单 → 主保存。</p><p><b>保护：</b>只填中文不会覆盖自定义英文；空值、纯空白、缺列均保留。手工清空非英语才删除翻译。</p><p><b>只读：</b>不展示导入入口；错误、无变更不能应用。打开后查看对应预检批注。</p>');
 out+=card(5,'markdown','Markdown 源码与预览','Release note > 编辑器','<p><b>可编辑：</b>标题、列表、强调、链接、换行，保存保留源码。预览只读、长内容区域内滚动，阿拉伯语RTL。</p><p><b>只读：</b>直接展示已保存的Markdown内容；缺译展示英文兜底。无输入框、编辑器边框、源码/预览页签、字符计数、导入和保存，仅保留语言切换与关闭。未保存草稿另行以可复制文本展示，不混入已保存内容。</p><p><b>演示策略：</b>普通换行显示换行；链接仅HTTPS可点击；HTML转义，危险协议禁用；表格、代码块、图片保留可读源码。该保守策略不是生产冻结结论。</p><p><b>实施：</b>技术冻结两端共同元素/URL/长度和资源上限，按MD01–MD10验证，禁止执行原始HTML/脚本。本地预览不代表APP实际渲染已通过。</p>');
 out+=card(6,'save','保存、失败与竞态','Release note独立管理 > 底部按钮','<p><b>保存：</b>英语空白或超限阻断；再次复核最新状态。成功仅更新当前对象的Release note字段，不覆盖基础信息、组件、应用对象、发布状态或其他对象。</p><p><b>恢复：</b>保存失败保留输入，可重试；状态变为只读即切换内容展示，隐藏编辑、导入与保存，已保存内容和未提交的可复制文本分别展示。关闭有修改时确认放弃，无修改直接关闭。</p><p><b>演示：</b>用评审工具触发失败或发布完成竞态。应用导入不等于保存；APP验证只消费已保存数据。</p>');
 }else {
 out+=card(1,'context','现状还原与新增范围','产品详情 > 固件配置','<p><b>现状事实：</b>208px深蓝侧栏、54px顶栏、产品摘要、步骤、双页签、六态统计与原列顺序，来自2026-11-06测试环境取证。</p><p><b>本次新增：</b>列表操作列Release note入口、独立管理抽屉与导入预检；原信息抽屉不增加说明编辑区。通过顶部“现状对照”隐藏新增内容，辨识改动范围。对照模式仅供查看，不执行保存。</p><p><b>样例：</b>默认两条MCU和两个虚拟版本；模组及其他状态由评审工具切换，非现场记录事实。发布日志保留，不作为Release note。</p><p><b>原型备注：</b>右侧批注、编号及评审工具均不属于产品UI。未连接真实平台，无发布或初始化操作。</p>');
 out+=card(7,'delete','沿用关联删除约束','固件列表 > 删除','<p><b>触发：</b>开发中固件点击删除，若有任一虚拟版本关联，弹窗阻止直接删除。无关联按既有生命周期。</p><p><b>范围：</b>不自动解绑、不级联。默认两条MCU有关联，模组样例无关联。</p>');
 out+=card(8,'consumer','APP读取结果验证','右侧评审工具 > APP读取验证','<p><b>交付：</b>平台配置数据支持APP升级接口读取并渲染Markdown。虚拟版本独立，缺译英语兜底。</p><p><b>演示：</b>验证面板仅消费本地已保存数据，不新设计APP页面或预定技术接口。</p>');
 out+=card(9,'history','存量默认值验证','右侧评审工具 > 存量初始化验证','<p><b>范围：</b>三类对象各状态新增英文字段 Bug fixed；其他语言未配置；无旧译文。</p><p><b>幂等：</b>重复初始化不覆盖维护后的内容，面板用18条内存样例演示。</p>');
 }
 $('annotations').innerHTML=out;bindReviewTools();bindAnchors();
}
function bindReviewTools(){
 $('scenarioObject').onchange=e=>{if(busy){e.target.value=selected;return;}if(modal)closeModal();draft=null;renderDrawer();selected=e.target.value;setTab(obj(selected).kind==='虚拟版本'?'virtual':'firmware');};
 $('scenarioStatus').onchange=e=>{const o=obj(selected);if(!o)return;o.status=e.target.value;if(o.status==='已发布')o.publishedOnce=true;persist();renderList();if(draft&&draft.id===o.id){draft.status=o.status;draft.publishedOnce=o.publishedOnce;renderRN();}if(modal==='import'){importPlan=null;renderImport();$('importResult').innerHTML='<div class="notice warn">对象状态已变化，请重新选择文件预检；只读状态无法应用。</div>';}renderNotes();};
 $('publishedOnce').onchange=e=>{const o=obj(selected);if(o.publishedOnce&&!e.target.checked){e.target.checked=true;toast('首次已发布标记不能撤销；重置本地样例可恢复初始场景。',true);return;}o.publishedOnce=e.target.checked;persist();if(draft)renderRN();renderNotes();};
 $('openSelected').onclick=()=>{if(modal)closeModal();openReleaseNotes(selected);};
 $('consumerTool').onclick=openConsumer;$('historyTool').onclick=openHistory;
 $('saveFailure').onchange=e=>{saveFailure=e.target.checked;};$('saveRace').onchange=e=>{race=e.target.checked;};
 $('listScenario').onchange=e=>{listMode=e.target.value;renderList();};
 $('resetDemo').onclick=()=>{if(busy)return;objects=clone(seeds);selected='m1';draft=null;modal=null;saveFailure=false;race=false;listMode='normal';baseline=false;$('baseline').checked=false;$('modalLayer').innerHTML='';persist();renderDrawer();setTab('firmware');toast('已重置本地样例');};
}
const targetMap={context:'list-top',base:'base-target',language:'language-target',import:'import-target',markdown:'markdown-target',save:'save-target',delete:'delete-target',consumer:'consumer-target',history:'history-target'};
function bindAnchors(){document.querySelectorAll('[data-note]').forEach(el=>el.onclick=e=>{e.stopPropagation();let id=el.dataset.note;activeNote=id;document.querySelectorAll('.focus-target').forEach(x=>x.classList.remove('focus-target'));document.querySelectorAll('.note-card').forEach(x=>x.classList.toggle('active',x.dataset.note===id));let target=$(targetMap[id])||(id==='import'?$('importNotes'):id==='delete'?document.querySelector('[data-delete]'):id==='consumer'?$('consumerTool'):id==='history'?$('historyTool'):null);if(id==='context')target=$('list-top');if(target){target.classList.add('focus-target');target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});}if(el.classList.contains('anchor'))document.querySelector('.note-card[data-note="'+id+'"]')?.scrollIntoView({block:'nearest',behavior:'smooth'});});}
$('firmwareTab').onclick=()=>setTab('firmware');$('virtualTab').onclick=()=>setTab('virtual');
$('baseline').onchange=e=>{if(busy){e.target.checked=baseline;return;}baseline=e.target.checked;if(modal)closeModal();if(baseline&&drawerMode==='notes')draft=null;renderList();if(draft)renderDrawer();else $('overlay').innerHTML='';renderNotes();};
$('mobileProduct').onclick=()=>document.body.classList.remove('mobile-notes');$('mobileNotes').onclick=()=>document.body.classList.add('mobile-notes');
 document.querySelectorAll('.existing').forEach(x=>x.onclick=e=>{e.preventDefault();toast('此为既有入口，本原型仅验证 Release note 需求。');});
function route(){let h=location.hash.slice(1);if(h==='virtual')setTab('virtual');else if(h==='create'){setTab('firmware');openEditor(null);}else if(h==='edit'||h==='release-note'){setTab('firmware');openReleaseNotes('m1');}else if(h==='import'){setTab('firmware');openReleaseNotes('m1');openImport();}else if(h==='consumer')openConsumer();else if(h==='history')openHistory();else setTab('firmware');}
setTab('firmware');route();window.addEventListener('hashchange',route);

document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(modal)closeModal();else if(draft)closeDrawer();}});
