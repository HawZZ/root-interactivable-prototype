import { $, $$, escapeHtml } from './dom.js';
import { ApprovalDemo, USERS, FIELDS, clone, diff } from './model.js';

const params = new URLSearchParams(location.search);
const explicitScenario = params.get('scenario');
const models = new Map();
let currentDemo;
let apps = [];
const drafts = new WeakMap();
const state = {page:'product',activeApplication:null,approvalTab:'initiated',role:'普通用户',retryOutcome:'success',evidence:'',busy:false,currentDrawer:null,editingTarget:null,pendingTarget:null,returnDrawer:null,query:'',actionFilter:'',statusFilter:''};
Object.defineProperties(state,{
  productStatus:{get:()=>currentDemo.product.status},
  activeProductLock:{get:()=>!!currentDemo.getActive()}
});
const currentUser=()=>Object.values(USERS).find(u=>u.role===state.role)||USERS.pm;
const utcDisplay=(at)=>at?new Intl.DateTimeFormat('sv-SE',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(at)):'—';
const tagType=s=>['已生效','已上架'].includes(s)?'success':['待审批','上架中'].includes(s)?'warning':['未生效','已驳回','已下架'].includes(s)?'danger':'info';
const displayValue=v=>v===null||v===undefined?'—':v===''?'（空）':Array.isArray(v)?v.join('、'):typeof v==='boolean'?(v?'开启':'关闭'):String(v);
const rangeText=c=>(c.listingMode||'部分放开')+' · '+(c.regions||[]).join('、');
function newDemo(scenario,metadata){
  const d=new ApprovalDemo(scenario);
  if(metadata){
    d.product.id=metadata.id;
    d.product.config=Object.freeze({...d.product.config,name:metadata.name,model:metadata.model,platform:metadata.platform||'ROOT云'});
    if(d.product.snapshot){d.product.snapshot=null;d.product.snapshots=[];d.snapshotSequence=0;d._createSnapshot(d.product.config,'上架审批');}
  }
  return d;
}
function options(d=currentDemo){const entry=state.editingTarget?state:draftEntry(d);return {actor:currentUser(),baseRevision:entry.baseRevision,baseSnapshotId:entry.baseSnapshotId};}
function freshOptions(d,actor=USERS.pm){return {actor,baseRevision:d.product.revision,baseSnapshotId:d.product.snapshot?.id??null};}
function draftEntry(d=currentDemo){
  if(!drafts.has(d)){
    const target=d.getDraft();
    if(!explicitScenario && d.product.id==='2075767415740338177' && d.applications.length===1 && d.getActive()){target.name='W1 Lite Plus';target.regions=['北美','欧洲'];}
    drafts.set(d,{target,baseRevision:d.product.revision,baseSnapshotId:d.product.snapshot?.id??null});
  }
  return drafts.get(d);
}
function resetDraft(d=currentDemo){drafts.set(d,{target:d.getDraft(),baseRevision:d.product.revision,baseSnapshotId:d.product.snapshot?.id??null});}
function createSamples(){
  const root=newDemo(explicitScenario||'listed');
  if(!explicitScenario){const t=root.getDraft();t.name='W1 Lite Plus';t.regions=['北美','欧洲'];root.submit('详情变更',t,freshOptions(root)).application.id='A-001';}
  models.set(root.product.id,root);currentDemo=root;
  if(!explicitScenario){
    const definitions=[
      {id:'2042519931187200001',name:'T3 Wearable Pump',model:'T3',scenario:'development',action:'上架',status:'success',request:'A-002'},
      {id:'2042519931187200002',name:'S9 Sterilizer',model:'S9',scenario:'listed',action:'下架',status:'reject',request:'A-003'},
      {id:'2042519931187200003',name:'DreamSync Tech',model:'WN05',platform:'涂鸦云',scenario:'listed',action:'详情变更',status:'pending',request:'A-004',range:true},
      {id:'2042519931187200004',name:'N1 Nursery',model:'N1',scenario:'listed',action:'详情变更',status:'success',request:'A-005',admin:true},
      {id:'2042519931187200005',name:'M5 Monitor',model:'M5',scenario:'development',action:'上架',status:'failure',request:'A-006'}
    ];
    for(const f of definitions){const d=newDemo(f.scenario,f);if(f.range)d.product.status='上架中';const t=d.getDraft();if(f.action==='详情变更'){if(f.range)t.regions=['北美','欧洲'];else t.name+=' Plus';}const a=d.submit(f.action,t,freshOptions(d,f.admin?USERS.admin:USERS.pm)).application;a.id=f.request;if(f.range)a.displayAction='上架范围变更';if(f.status==='reject')d.decide(a.id,'reject',{actor:USERS.approver,reason:'目标配置需调整'});else if(f.status!=='pending')d.decide(a.id,'approve',{actor:USERS.approver,outcome:f.status});models.set(d.product.id,d);}
  }
  if(!explicitScenario){const grand=newDemo('development',{id:'2042519931187200010',name:'Grand Flow',model:'G100'});models.set(grand.product.id,grand);}
  state.activeApplication=root.getActive()?.id??root.applications[0]?.id??null;
}
function refreshApps(){
  apps=[...models.values()].flatMap(d=>d.applications);
  for(const a of apps){const d=models.get(a.productId);a.product=a.productName;a.model=d.product.config.model;a.applicant=a.applicantName+' / '+(a.applicantId===USERS.admin.id?'系统管理员':'产品经理');a.submitted=utcDisplay(a.submittedAt);for(const h of a.history)h.occurredAt=utcDisplay(h.at);}
}
function productRows(){return [...models.values()].filter(d=>d.product.id===currentDemo.product.id||!['2042519931187200004','2042519931187200005','2042519931187200001'].includes(d.product.id)).map(d=>[d.product.config.name,d.product.config.model,d.product.status,d.product.config.platform,d.product.id]);}
function set(patch){if(patch.activeApplication){const a=apps.find(a=>a.id===patch.activeApplication);if(a)currentDemo=models.get(a.productId);}Object.assign(state,patch);render();}
function selectProduct(id){currentDemo=models.get(id)||currentDemo;state.editingTarget=null;state.currentDrawer=null;state.evidence='';set({page:'product'});}
function draftRows(){const target=draftEntry().target;const rows=diff(currentDemo.product.config,target).filter(d=>['name','serviceModel','platform','app','regions','listingMode','scopeMode','effectiveMode'].includes(d.key));return rows.map(d=>'<tr><td>'+escapeHtml(d.key==='regions'?'上架范围':d.label)+'</td><td>'+escapeHtml(displayValue(d.before))+'</td><td>'+escapeHtml(displayValue(d.after))+'</td><td>'+(d.key==='name'?'App 展示名称':d.key==='regions'?'区域可见性':'产品配置信息')+'</td></tr>').join('')||'<tr><td colspan="4" class="muted">暂无字段变更</td></tr>';}
function comparisonRows(a){return a.diff.filter(d=>['name','serviceModel','platform','model','communication','app','regions','listingMode','scopeMode','effectiveMode'].includes(d.key)).map(d=>'<tr><td>'+escapeHtml(d.key==='regions'?'上架范围':d.label)+'</td><td class="before">'+escapeHtml(a.baseSnapshot?displayValue(d.before):'—')+'</td><td class="after">'+escapeHtml(displayValue(d.after))+'</td></tr>').join('')||'<tr><td colspan="3" class="muted">无详情字段变化，本次仅审批'+escapeHtml(a.action)+'动作</td></tr>';}
function ensureEditing(kind){if(!state.editingTarget){const entry=draftEntry();state.editingTarget=clone(entry.target);state.baseRevision=entry.baseRevision;state.baseSnapshotId=entry.baseSnapshotId;}state.currentDrawer=kind;return state.editingTarget;}
function activeAppModel(id){const a=apps.find(a=>a.id===id);if(!a)throw Error('审批单不存在');return models.get(a.productId);}
createSamples();
refreshApps();

const screen = $('#screen');
const anno = $('#annotation-body');
const modalRoot = $('#modal-root');
const toast = $('#toast');
const W1_ID = '2075767415740338177';
const tag = (value) => `<span class="el-tag el-tag--${tagType(value)} is-plain">${escapeHtml(value)}</span>`;
const anchor = (n, id) => `<button class="anchor" type="button" data-anchor="${id}" aria-label="查看批注 ${n}">${n}</button>`;
const isPrivileged = () => state.role === '审批员' || state.role === '系统管理员';
const visibleAction = (action) => ({ '详情变更': '变更详情', '上架范围变更': '变更详情', 上架: '上架产品', 下架: '下架产品' }[action] || action);
const creationBehavior = (action) => ({ '详情变更': '编辑产品详情', '上架范围变更': '编辑产品上架范围', 上架: '提交产品上架', 下架: '提交产品下架' }[action] || action);

function layout(content, active) {
  const crumb = active === 'product' ? '智能产品 / 产品列表 / 产品详情' : active === 'approvals' ? '配置中心 / 审批管理' : '智能产品 / 产品列表';
  return `<div class="app"><aside class="aside"><div class="brand"><div class="brand-wordmark"><span>路特创新</span><b>AIoT</b> Platform</div></div><nav class="menu"><button class="menu-item"><span class="nav-icon">◉</span>概览</button><div class="menu-title">智能产品</div><button class="menu-item ${active === 'product' || active === 'product-list' ? 'active' : ''}" data-page="product-list"><span class="nav-icon">▦</span>产品列表</button><div class="menu-title">配置中心</div><button class="menu-item ${active === 'approvals' ? 'active' : ''}" data-page="approvals"><span class="nav-icon">✓</span>审批管理</button></nav><div class="aside-footer">☰</div></aside><section class="shell-main"><header class="topbar"><div class="crumb"><div><b>${active === 'approvals' ? '审批管理' : '智能产品'}</b><small>${crumb}</small></div></div><div class="top-actions"><span class="top-icon">?</span><span class="avatar">${escapeHtml(currentUser().name[0])}</span></div></header><main class="content">${content}</main></section></div>`;
}

function productList() {
  const rows = productRows();
  return layout(`<div class="list-head"><h1>智能产品</h1><button class="el-btn el-btn--primary" data-toast="创建产品不在本次原型范围内">＋ 创建产品</button></div><section class="filterbar"><input class="el-input" placeholder="产品名称 / 产品型号"><select class="el-select"><option>全部产品状态</option><option>开发中</option><option>上架中</option><option>已上架</option><option>已下架</option></select><button class="el-btn el-btn--primary" data-toast="已按筛选条件查询">查询</button><button class="el-btn" data-toast="筛选已重置">重置</button></section><div class="table-scroll"><table class="el-table" id="product-table"><thead><tr><th>产品名称</th><th>产品型号</th><th>产品状态</th><th>所属平台</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${rows.map((row) => `<tr><td><button class="op-link" data-page="product" data-product-id="${row[4]}">${row[0]}</button></td><td>${row[1]}</td><td>${tag(row[2])}</td><td>${row[3]}</td><td>2026-08-05 10:18</td><td><button class="op-link" data-page="product" data-product-id="${row[4]}">查看</button></td></tr>`).join('')}</tbody></table></div><div class="pagination">共 ${rows.length} 条　<span class="page-current">1</span></div>`, 'product-list');
}

const info = (label, value) => `<div class="info-field"><label>${label}</label><span>${value}</span></div>`;

function product() {
  const active = currentDemo.getActive();
  const locked = state.activeProductLock;
  const direct = ['开发中','已下架'].includes(state.productStatus);
  const transition = ['开发中', '已下架'].includes(state.productStatus) ? '上架' : '下架';
  const submitLabel = direct ? '保存并更新' : '保存本地草稿';
  return layout(`<section class="product-hero"><div class="product-identity"><span class="product-image-large">W1</span><div><h1>${escapeHtml(currentDemo.product.config.name)} ${tag(currentDemo.product.config.platform)} ${tag(state.productStatus)}</h1><div class="product-meta"><span>产品分类：Breast Pump</span><i></i><span>产品型号：${escapeHtml(currentDemo.product.config.model)}</span><i></i><span>产品ID：${currentDemo.product.id}</span></div><p class="function-version">功能版本：<b>版本1 - 已发布</b></p></div></div><div class="product-actions"><button class="el-btn el-btn--danger ${locked ? 'is-disabled' : ''}" ${locked ? 'disabled' : ''} data-submit-action="${transition}" data-confirm-title="${transition === '上架' ? '确认提交上架审批' : '确认提交下架审批'}">${transition}产品</button></div></section><nav class="step-tabs"><button class="step-tab active">✓ 基础信息</button><button class="step-tab" data-toast="功能设计不在本次审批范围">✓ 功能设计</button><button class="step-tab" data-toast="扩展程序不在本次审批范围">✓ 扩展程序</button><button class="step-tab" data-toast="设备调试不在本次审批范围">✓ 设备调试</button><button class="step-tab" data-toast="配网引导不在本次审批范围">✓ 配网引导</button><button class="step-tab" data-toast="高级配置不在本次审批范围">✓ 高级配置</button></nav>${locked ? `<div class="lock-banner" id="product-lock"><div><b>该产品已有活跃审批单，已冻结编辑提交</b>${anchor(1, 'product-lock')}<p>当前审批单 <button class="op-link" data-open-app="${active.id}">${active.id} · ${active.action} / ${active.status}</button>。服务端以产品 ID 原子占位；后到提交请求会被拒绝。</p></div><button class="el-btn" data-open-app="${active.id}">查看审批单</button></div>` : ''}<section class="product-panel" id="base-info"><div class="panel-head"><h2>产品信息 ${anchor(2, 'base-info')}</h2><div class="button-row"><button class="el-btn" data-drawer="product-edit">编辑产品信息</button><button class="el-btn" data-drawer="listing-range">编辑上架范围</button></div></div><div class="info-grid">${info('产品名称', escapeHtml(currentDemo.product.config.name))}${info('产品状态', tag(state.productStatus))}${info('所属平台', tag(currentDemo.product.config.platform))}${info('产品型号', escapeHtml(currentDemo.product.config.model))}${info('所属 App', 'momcozy')}${info('通讯方式', 'BLE')}${info('上架范围', escapeHtml(rangeText(currentDemo.product.config)))}${info('配网方式', '蓝牙配网')}${info('最近编辑时间', '2026-08-05 10:18:07')}</div></section><section class="draft-panel" id="draft"><div class="panel-head"><h2>${direct ? '直接保存' : '本地草稿与审批提交'} ${anchor(3, 'draft')}</h2>${tag(direct ? '开发中可直存' : '前端草稿 · 未冻结')}</div><table class="diff-table"><thead><tr><th>字段</th><th>线上正式值</th><th>当前编辑值</th><th>影响</th></tr></thead><tbody>${draftRows()}</tbody></table><div class="draft-actions"><span class="muted">${direct ? '开发中、已下架产品的详情与上架范围编辑可直接更新；草稿仅保存在当前前端会话。' : '上架中、已上架的详情或上架范围变更必须提交审批；草稿仅保存在当前前端会话。'}</span><button class="el-btn ${direct ? 'el-btn--primary' : ''}" ${direct ? 'data-save-direct' : 'data-save-local'}>${submitLabel}</button>${!direct ? `<button class="el-btn el-btn--primary ${locked ? 'is-disabled' : ''}" ${locked ? 'disabled' : ''} data-submit-action="详情变更">提交变更并冻结</button>` : ''}</div></section>`, 'product');
}

function approvals() {
  const me = currentUser();
  const reviewTab = isPrivileged();
  const rows = (state.approvalTab === 'review' && reviewTab ? apps : apps.filter((item) => item.applicantId === me.id)).filter(item=>matchesFilters(item));
  const tabBar = `${reviewTab ? `<button class="tab ${state.approvalTab === 'review' ? 'active' : ''}" data-approval-tab="review">我审批的 <span class="badge">${apps.filter((item) => item.status === '待审批').length}</span></button>` : ''}<button class="tab ${state.approvalTab === 'initiated' ? 'active' : ''}" data-approval-tab="initiated">我发起的 <span class="badge">${apps.filter((item) => item.applicantId === me.id).length}</span></button>`;
  const help = reviewTab ? '我审批的展示全部审批单；我发起的只展示当前用户提交的审批单。禁止审批本人申请。' : '仅展示当前用户发起的审批单；可查看，且仅“待审批”可撤销。';
  return layout(`<div class="page-title"><div><h1>审批管理 ${anchor(1, 'approval-table')}</h1><p>${help}</p></div></div><section class="filterbar"><input class="el-input" id="approval-query" placeholder="产品名称 / 申请号" value="${escapeHtml(state.query)}"><select class="el-select" id="approval-action-filter"><option>全部动作</option><option>详情变更</option><option>上架范围变更</option><option>上架</option><option>下架</option></select><select class="el-select" id="approval-status-filter"><option>全部状态</option><option>待审批</option><option>未生效</option><option>已生效</option><option>已驳回</option></select><button class="el-btn el-btn--primary" data-filter>查询</button><button class="el-btn" data-reset-filter>重置</button></section><div class="tabs">${tabBar}</div><div class="table-scroll"><table class="el-table" id="approval-table"><thead><tr><th>申请号</th><th>产品</th><th>动作</th><th>状态</th><th>提交人</th><th>提交时间</th><th>操作</th></tr></thead><tbody>${rows.map((item) => `<tr><td>${item.id}</td><td>${item.product} / ${item.model}</td><td>${item.displayAction || item.action}</td><td>${tag(item.status)}</td><td>${item.applicant}</td><td>${item.submitted}</td><td><button class="op-link" data-open-app="${item.id}">查看</button>${item.applicantId === me.id && item.status === '待审批' ? `<span class="op-divider">|</span><button class="op-link danger" data-withdraw="${item.id}">撤销</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="7"><div class="empty">暂无可查看的审批单</div></td></tr>`}</tbody></table></div><div class="pagination">共 ${rows.length} 条　<span class="page-current">1</span></div>`, 'approvals');
}

function detail(item) {
  if(!isPrivileged() && item.applicantId!==currentUser().id)return layout('<div class="notice-box"><h2>无权查看该审批单</h2><p>普通用户仅可查看本人发起的审批单。</p><button class="el-btn" data-page="approvals">返回审批管理</button></div>','approvals');
  const me = currentUser();
  const owner = item.applicantId === me.id;
  const canApprove = isPrivileged() && !owner && item.status === '待审批';
  const canWithdraw = owner && item.status === '待审批';
  const canCancel = isPrivileged() && !owner && item.status === '未生效';
  const canRetry = isPrivileged() && !owner && item.status === '未生效';
  const notification = `${item.product} / ${item.model} 正在${visibleAction(item.action)}，待审批。<br>审批单据：/approvals/${item.id}<br>@审批员角色成员`;
  const history = [...(item.history || [])].reverse().map((record) => `<div class="timeline-item"><b>${escapeHtml(record.operator)}，${tag(record.status)}</b><small>${escapeHtml(record.occurredAt)}，${escapeHtml(record.action)}</small></div>`).join('');
  return layout(`<div class="page-title"><div><h1>审批详情 ${item.id} ${tag(item.status)}</h1><p>提交人：${item.applicant} · 审批角色：审批员（外部 ERP 分配 IoT 平台账号）</p></div><button class="el-btn" data-page="approvals">返回审批管理</button></div><div class="detail-grid"><div><section class="product-panel" id="snapshot"><div class="panel-head"><h2>变更内容 ${anchor(1, 'snapshot')}</h2>${tag('不可修改')}</div><div class="info-grid two">${info('产品', `${item.product} / ${item.model}`)}${info('申请动作', item.action)}${info('审批角色', '审批员（外部 ERP 分配）')}</div><table class="diff-table"><thead><tr><th>字段</th><th>变更前</th><th>变更后</th></tr></thead><tbody>${comparisonRows(item)}</tbody></table></section>${canApprove ? approvalPanel(item) : ''}${canWithdraw ? `<section class="confirm-card"><h2>发起人操作</h2><p>你只能撤销本人处于“待审批”的申请；撤销后线上配置不变并释放产品冻结。</p><div class="button-row"><button class="el-btn el-btn--danger" data-withdraw="${item.id}">撤销申请</button></div></section>` : ''}${canCancel ? `<section class="confirm-card"><h2>未生效处理</h2><p>审批已通过但应用失败，产品仍被冻结；审批员可取消本次变更，状态将转为“已驳回”。</p><div class="button-row"><button class="el-btn el-btn--danger" data-cancel-unapplied="${item.id}">取消本次变更</button></div></section>` : ''}${canRetry ? `<section class="confirm-card"><h2>未生效处理</h2><p>审批已通过但应用失败。审批员或系统管理员可在不重新开放编辑的情况下重试应用本次变更内容。</p><div class="button-row"><button class="el-btn el-btn--primary" data-retry-apply="${item.id}">重试应用</button></div></section>` : ''}${!canApprove && !canWithdraw && !canCancel && !canRetry ? `<section class="notice-box"><b>只读详情</b><p>${owner ? '提交人不可通过或驳回本人申请。' : '当前状态或角色不支持审批操作。'}</p></section>` : ''}<section class="timeline"><div class="panel-head"><h2>操作记录 ${anchor(4, 'operation-history')}</h2><span class="muted">按当前时区展示</span></div>${history}</section></div><aside><section class="notice-box" id="notifications"><h2>通知投递 ${anchor(2, 'notifications')}</h2><div class="notice-line"><div><b>飞书机器人</b><small>${notification}</small></div></div><p class="muted">平台仅向审批员角色成员投递待审批提醒；外部测试、测试结果与通知审批人均在系统外完成，“待审批”不代表测试通过。</p></section></aside></div>`, 'approvals');
}

function approvalPanel(item) {
  const ready = state.evidence.trim();
  return `<section class="confirm-card" id="approval-action"><h2>审批操作 ${anchor(3, 'approval-action')}</h2><p>审批员/系统管理员需在系统外取得测试结论后，再核验当前本次变更内容。</p><label class="field"><span>外部测试依据引用 <span class="required">*</span></span><textarea class="el-input textarea" data-evidence placeholder="填写邮件主题、报告链接或编号">${escapeHtml(state.evidence)}</textarea></label><div class="button-row"><button class="el-btn el-btn--danger" data-reject="${item.id}">驳回</button><button class="el-btn el-btn--primary ${ready ? '' : 'is-disabled'}" ${ready ? '' : 'disabled'} data-approve="${item.id}">通过并应用</button></div></section>`;
}

function openSubmit(action) {
  if(state.activeProductLock)return showToast('提交被拒绝：该产品已有活跃审批单',false);
  const realAction=action==='上架范围变更'?'详情变更':action;
  const target=['上架','下架'].includes(action)?currentDemo.getDraft():clone(state.editingTarget||draftEntry().target);
  try{
    currentDemo.preview(target);
    state.pendingAction=realAction;state.pendingDisplayAction=action;state.pendingTarget=target;state.returnDrawer=state.currentDrawer;
    if(!state.editingTarget){state.baseRevision=draftEntry().baseRevision;state.baseSnapshotId=draftEntry().baseSnapshotId;}
    if(['上架','下架'].includes(action)){state.baseRevision=currentDemo.product.revision;state.baseSnapshotId=currentDemo.product.snapshot?.id??null;}
    const actionText=visibleAction(action);
    modal('<h3>确认提交'+actionText+'审批</h3><div class="modal-body"><div class="submit-summary">本次'+actionText+'需要发起审批。确认提交后，系统将冻结本次变更内容，并阻止其他人继续提交产品详情、上架范围、上架或下架变更。</div><div class="warning-box">冻结期间，线上正式配置不会变更；待审批单被撤销、驳回或完成应用后，才会释放产品编辑提交。</div><div class="frozen-box"><b>确认信息</b><p>动作：'+actionText+'</p><p>审批角色：审批员（由外部 ERP 分配 IoT 平台账号）</p></div><div class="error" id="submit-error" role="alert"></div></div><div class="modal-foot"><button class="el-btn" data-close-modal>取消</button><button class="el-btn el-btn--primary" data-confirm-submit="'+action+'">继续提交</button></div>');
  }catch(e){showFormError(e);}
}

function openApprove(id) {
  const item = apps.find((app) => app.id === id);
  modal(`<h3 id="approval-modal">核对信息 ${anchor(5, 'approval-modal')}</h3><div class="modal-body"><div class="approval-check-grid"><div class="check-item"><label>申请号</label><strong>${item.id}</strong></div><div class="check-item"><label>动作</label><strong>${item.displayAction || item.action}</strong></div><div class="check-item"><label>产品</label><strong>${item.product} / ${item.model}</strong></div><div class="check-item"><label>审批角色</label><strong>审批员（外部 ERP 分配）</strong></div><div class="check-item"><label>外部测试依据</label><strong>${escapeHtml(state.evidence)}</strong></div><div class="check-item check-item--wide"><label>目标变更</label><strong>${escapeHtml(item.diff.map(d=>d.label+"："+displayValue(d.before)+" → "+displayValue(d.after)).join("；") || item.action)}</strong></div></div><div class="warning-box">确认后在当前审批单内应用本次变更内容，并直接返回“已生效”或“未生效”的结果。</div></div><div class="modal-foot"><button class="el-btn" data-close-modal>返回修改</button><button class="el-btn el-btn--primary" data-confirm-approve="${id}">确认应用</button></div>`);
}

function openReject(id) { modal(`<h3>驳回申请</h3><div class="modal-body"><p>驳回后不应用本次变更内容，线上正式配置保持不变，产品冻结释放。</p><label class="field"><span>驳回原因 <span class="required">*</span></span><textarea class="el-input textarea" id="reject-reason" placeholder="请填写驳回原因"></textarea><span class="error" id="reject-error"></span></label></div><div class="modal-foot"><button class="el-btn" data-close-modal>取消</button><button class="el-btn el-btn--danger" data-confirm-reject="${id}">确认驳回</button></div>`); }

function openProductEdit() {
  const direct = ['开发中','已下架'].includes(state.productStatus);
  const draft=ensureEditing('product-edit');
  drawer(`<div class="drawer-head"><h3>编辑产品信息</h3><button class="icon-btn" data-close-drawer>×</button></div><div class="drawer-body"><div class="drawer-form"><div class="drawer-readonly"><label>产品分类</label><span>Breast Pump / 1</span></div><label class="drawer-field required-field">产品名称<input class="el-input" aria-label="产品名称" data-field="name" value="${escapeHtml(draft.name)}"></label><label class="drawer-field">客服型号<input class="el-input" aria-label="客服型号" data-field="serviceModel" value="${escapeHtml(draft.serviceModel)}"></label><label class="drawer-field required-field">所属平台<select class="el-select" aria-label="所属平台" data-field="platform"><option ${draft.platform==="ROOT云"?"selected":""}>ROOT云</option><option ${draft.platform==="涂鸦云"?"selected":""}>涂鸦云</option></select></label><label class="drawer-field required-field">通讯方式<select class="el-select" disabled><option>BLE</option></select><small>产品创建后不可修改通讯方式</small></label><label class="drawer-field required-field">所属 App<select class="el-select"><option>momcozy</option></select></label><label class="drawer-field">产品图片<div class="upload-row"><span class="upload-box">＋<small>产品主图</small></span><span class="upload-box"><small>列表图</small></span></div></label><div class="error" id="form-error" role="alert"></div></div></div><div class="drawer-foot"><button class="el-btn" data-close-drawer>取消</button><button class="el-btn ${direct ? 'el-btn--primary' : ''}" ${direct ? 'data-save-direct' : 'data-save-local'}>${direct ? '保存并更新' : '保存本地草稿'}</button>${!direct ? `<button class="el-btn el-btn--primary ${state.activeProductLock ? 'is-disabled' : ''}" ${state.activeProductLock ? 'disabled' : ''} data-submit-action="详情变更">提交变更并冻结</button>` : ''}</div>`);
}

function openListingRange() {
  const direct = ['开发中','已下架'].includes(state.productStatus);
  const draft=ensureEditing('listing-range');
  drawer(`<div class="drawer-head"><h3>编辑产品上架范围</h3><button class="icon-btn" data-close-drawer>×</button></div><div class="drawer-body"><div class="drawer-form"><label class="drawer-field required-field">上架方式<select class="el-select" data-field="listingMode" aria-label="上架方式"><option ${draft.listingMode==="部分放开"?"selected":""}>部分放开</option><option ${draft.listingMode==="全面放开"?"selected":""}>全面放开</option></select></label><label class="drawer-field required-field">范围模式<select class="el-select" data-field="scopeMode" aria-label="范围模式"><option ${draft.scopeMode==="国家 / 地区"?"selected":""}>国家 / 地区</option><option ${draft.scopeMode==="数据中心"?"selected":""}>数据中心</option></select></label><label class="drawer-field required-field">国家 / 地区<span class="check-row"><label><input type="checkbox" data-region="北美" ${draft.regions.includes("北美")?"checked":""}> 北美</label><label><input type="checkbox" data-region="欧洲" ${draft.regions.includes("欧洲")?"checked":""}> 欧洲</label><label><input type="checkbox" data-region="亚太" ${draft.regions.includes("亚太")?"checked":""}> 亚太</label></span></label><label class="drawer-field required-field">生效时间<select class="el-select" data-field="effectiveMode" aria-label="生效时间"><option ${draft.effectiveMode==="立即生效"?"selected":""}>立即生效</option><option ${draft.effectiveMode==="定时生效"?"selected":""}>定时生效</option></select><small>上架中产品仍须先通过本审批；定时生效沿用产品上架范围需求。</small></label><div class="error" id="form-error" role="alert"></div></div></div><div class="drawer-foot"><button class="el-btn" data-close-drawer>取消</button><button class="el-btn ${direct ? 'el-btn--primary' : ''}" ${direct ? 'data-save-direct' : 'data-save-local'}>${direct ? '保存并更新' : '保存本地草稿'}</button>${!direct ? `<button class="el-btn el-btn--primary ${state.activeProductLock ? 'is-disabled' : ''}" ${state.activeProductLock ? 'disabled' : ''} data-submit-action="上架范围变更">提交变更并冻结</button>` : ''}</div>`);
}

function modal(html) { modalRoot.innerHTML = `<div class="modal-mask"><section class="modal">${html}</section></div>`; }
function drawer(html) { modalRoot.innerHTML = `<div class="drawer-mask"><section class="drawer">${html}</section></div>`; }
function closeOverlay() { modalRoot.innerHTML = ''; renderAnnotations(state.page); }
function showToast(message, success = true) { toast.textContent = message; toast.style.background = success ? '#67c23a' : '#f56c6c'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }

function prototypeControls() {
  return `<section class="prototype-controls"><h2>演示条件</h2><p>仅用于切换原型场景，不属于 IoT Admin 实际页面字段。</p><label>原型角色<select class="el-select" data-role><option ${state.role === '普通用户' ? 'selected' : ''}>普通用户</option><option ${state.role === '审批员' ? 'selected' : ''}>审批员</option><option ${state.role === '系统管理员' ? 'selected' : ''}>系统管理员</option></select></label><label>产品状态<select class="el-select" data-product-status><option ${state.productStatus === '开发中' ? 'selected' : ''}>开发中</option><option ${state.productStatus === '上架中' ? 'selected' : ''}>上架中</option><option ${state.productStatus === '已上架' ? 'selected' : ''}>已上架</option><option ${state.productStatus === '已下架' ? 'selected' : ''}>已下架</option></select></label><label>活动审批<select class="el-select" data-lock-demo><option value="locked" ${state.activeProductLock ? 'selected' : ''}>有</option><option value="free" ${!state.activeProductLock ? 'selected' : ''}>无</option></select></label><label>重试应用结果<select class="el-select" data-retry-outcome><option value="success">成功</option><option value="failed">失败</option></select></label></section>`;
}

function renderAnnotations(kind) {
  const cards = kind === 'product' ? [
    ['1', '产品状态与活跃审批锁', '产品详情页头部 / 冻结提示', '开发中、已下架编辑详情与上架范围直接保存；上架中、已上架的详情或上架范围需审批。任一产品最多一个待审批或未生效单，后到提交由服务端拒绝。'],
    ['2', '基础信息与上架范围入口', '产品信息', '保留 IoT Admin 基础信息布局。上架范围归属产品详情内上架动作，编辑入口使用抽屉。'],
    ['3', '前端草稿和提交', '本地草稿与审批提交 / 二次确认弹窗', '草稿只保存在前端会话，不持久化。开发中、已下架直接保存，无需额外留痕；上架中、已上架提交后冻结本次变更内容。二次确认提示提交后将冻结产品并阻止其他人继续提交，弹窗不要求补充通知接收人。']
  ] : kind === 'approvals' ? [
    ['1', '审批员角色与数据隔离', '审批管理列表', '普通用户仅见“我发起的”并只可查看/撤销待审批；外部 ERP 分配“审批员”角色的 IoT 平台账号继承当前审批员全部权限，可见“我审批的”全量列表。IoT 平台不提供审批员配置入口。'],
    ['2', '审批详情操作', '审批详情', '审批员/系统管理员只可对待审批且非本人申请通过或驳回。已通过但应用失败转“未生效”，审批员或系统管理员可取消或重试。']
  ] : [
    ['1', '变更字段前后值', '审批详情', '仅展示本次变更字段的变更前和变更后值，提交后不可修改。'],
    ['2', '飞书审批提醒', '通知投递', '平台仅向审批员角色成员投递飞书待审批提醒；不再向测试工程师投递邮件或测试链接。测试、测试结果和通知审批人均在系统外完成。'],
    ['3', '审批操作', '审批详情 > 审批操作', '审批员/系统管理员根据系统外测试结论处理申请；通过、驳回、重试和取消均驱动审批状态机。'],
    ['4', '状态流转操作记录', '审批详情 > 操作记录', '每次状态变更均新增一条记录，按时间倒序展示“操作人，目标状态”与“按当前时区换算的时间，行为”。重试失败虽保持未生效，也需记录“未生效，重试应用失败”。'],
    ['5', '通过并应用', '审批操作 > 核对信息弹窗', '点击通过并应用直接弹出核对信息，确认后在原单据内应用，不创建额外状态；应用成功或失败分别记录已生效或未生效。']
  ];
  anno.innerHTML = `${prototypeControls()}<p class="annotation-intro">原型角色、产品状态与活动审批仅在本批注栏切换，不属于左侧真实产品页面。切换仅用于展示，不替代真实服务端鉴权。</p>${cards.map(([n, title, location, body]) => `<button class="anno"><h3><span class="anno-n">${n}</span>${title}</h3><p><b>关联位置：</b>${location}</p><p><b>说明 / 交互：</b>${body}</p></button>`).join('')}<div class="assumption"><b>原型备注</b><p>审批员角色由外部 ERP 创建并分配 IoT 平台账号；该角色继承当前审批员全部权限。审批员可见全量审批单，但默认禁止审批本人发起的申请；未生效的重试与取消均由审批员或系统管理员执行。</p></div>`;
}

function render() {
  refreshApps();
  let html;
  if (state.page === 'product-list') html = productList();
  else if (state.page === 'product') html = product();
  else if (state.page === 'approvals') html = approvals();
  else html = detail(apps.find((item) => item.id === state.activeApplication) || apps[0]);
  screen.innerHTML = html;
  renderAnnotations(state.page);
  bind();
}


function bind() {
  const actionFilter=$('#approval-action-filter'),statusFilter=$('#approval-status-filter');
  if(actionFilter)actionFilter.value=state.actionFilter||'全部动作';
  if(statusFilter)statusFilter.value=state.statusFilter||'全部状态';
  $$('.anno').forEach((el,index)=>{el.dataset.noteIndex=index;});
}
function matchesFilters(item){return (!state.query||(item.id+' '+item.product).includes(state.query))&&(!state.actionFilter||(item.displayAction||item.action)===state.actionFilter)&&(!state.statusFilter||item.status===state.statusFilter);}
function showFormError(error) {
  const messages={SNAPSHOT_CONFLICT:'产品信息已发生变化，请重新加载后再提交',SNAPSHOT_DRIFT:'产品信息暂时无法核对，请刷新后重试；仍失败请联系管理员',SNAPSHOT_REQUIRED:'产品信息未完成校验，请稍后重试'};
  const message=messages[error.code]||error.message;
  let box=$('#form-error')||$('#submit-error')||$('#reject-error')||$('#runtime-error');
  if(!box && modalRoot.firstElementChild){box=document.createElement('p');box.id='runtime-error';box.className='error';box.setAttribute('role','alert');(modalRoot.querySelector('.modal-body')||modalRoot.querySelector('.drawer-body')).appendChild(box);}
  if(box)box.textContent=message;
  showToast(message,false);
}
function closeCurrent() {
  if(state.returnDrawer && modalRoot.querySelector('.modal')){
    const origin=state.returnDrawer;state.returnDrawer=null;
    if(origin==='product-edit')openProductEdit();else openListingRange();
    return;
  }
  closeOverlay();state.currentDrawer=null;state.editingTarget=null;state.returnDrawer=null;
}
async function run(operation,done){
  if(state.busy)return;
  state.busy=true;
  document.querySelectorAll('#modal-root button,.prototype-controls select,#screen button').forEach(b=>b.disabled=true);
  await new Promise(resolve=>setTimeout(resolve,350));
  try{const result=operation();state.busy=false;done(result);render();}
  catch(e){state.busy=false;document.querySelectorAll('#modal-root button').forEach(b=>b.disabled=false);render();showFormError(e);}
}
function finishOverlay(){modalRoot.innerHTML='';state.editingTarget=null;state.currentDrawer=null;state.returnDrawer=null;}
function saveDirect(){
  const target=clone(state.editingTarget||draftEntry().target),opts=options();
  run(()=>currentDemo.saveOffline(target,opts),result=>{resetDraft();finishOverlay();showToast(result.kind==='noop'?'没有实际字段变化':state.productStatus+'产品已直接保存并更新');});
}
function saveLocal(){
  const entry=draftEntry();drafts.set(currentDemo,{target:clone(state.editingTarget||entry.target),baseRevision:state.editingTarget?state.baseRevision:entry.baseRevision,baseSnapshotId:state.editingTarget?state.baseSnapshotId:entry.baseSnapshotId});
  render();showToast('本地草稿已更新，关闭页面即清空');
}
function refreshFixture(status,locked){
  const id=currentDemo.product.id;
  const metadata={id,name:currentDemo.product.config.name,model:currentDemo.product.config.model,platform:currentDemo.product.config.platform};
  const scenario=status==='开发中'?'development':status==='已下架'?'delisted':'listed';
  currentDemo=newDemo(scenario,metadata);currentDemo.product.status=status;models.set(id,currentDemo);
  if(locked){const action=['开发中','已下架'].includes(status)?'上架':'详情变更';const target=currentDemo.getDraft();if(action==='详情变更')target.name+=' Plus';const a=currentDemo.submit(action,target,freshOptions(currentDemo)).application;state.activeApplication=a.id;}
  finishOverlay();resetDraft();render();
}
function highlightAnchor(id,index){
  document.querySelectorAll('.highlight-static').forEach(el=>el.classList.remove('highlight-static'));
  $$('.anno').forEach((el,i)=>el.classList.toggle('active',i===index));
  const target=document.getElementById(id);if(target){target.classList.add('highlight-static');target.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'});}
}
document.addEventListener('click',event=>{
  if(state.busy)return;
  const el=event.target.closest('button,[data-close-modal],[data-close-drawer]');
  if(el?.disabled)return;
  if(event.target.classList.contains('modal-mask')||event.target.classList.contains('drawer-mask')||el?.matches('[data-close-modal],[data-close-drawer]')){closeCurrent();return;}
  const anchor=event.target.closest('[data-anchor]');
  if(anchor){const cardIndex=Number(anchor.textContent)-1;highlightAnchor(anchor.dataset.anchor,cardIndex);anno.querySelectorAll('.anno')[cardIndex]?.scrollIntoView({block:'nearest'});return;}
  const note=event.target.closest('.anno');
  if(note){const ids=state.page==='product'?['product-lock','base-info','draft']:state.page==='approvals'?['approval-table','approval-table']:['snapshot','notifications','approval-action','operation-history','approval-modal'];const index=Number(note.dataset.noteIndex);highlightAnchor(ids[index],index);return;}
  if(!el)return;
  if(el.dataset.page){if(el.dataset.productId)selectProduct(el.dataset.productId);else set({page:el.dataset.page});return;}
  if(el.dataset.openApp){state.evidence='';set({page:'detail',activeApplication:el.dataset.openApp});return;}
  if(el.hasAttribute('data-filter')){state.query=$('#approval-query').value.trim();const af=$('#approval-action-filter').value,sf=$('#approval-status-filter').value;state.actionFilter=af==='全部动作'?'':af;state.statusFilter=sf==='全部状态'?'':sf;render();return;}
  if(el.hasAttribute('data-reset-filter')){Object.assign(state,{query:'',actionFilter:'',statusFilter:''});render();return;}
  if(el.dataset.approvalTab){set({approvalTab:el.dataset.approvalTab});return;}
  if(el.dataset.drawer==='product-edit'){state.editingTarget=null;openProductEdit();return;}
  if(el.dataset.drawer==='listing-range'){state.editingTarget=null;openListingRange();return;}
  if(el.hasAttribute('data-save-direct')){saveDirect();return;}
  if(el.hasAttribute('data-save-local')){saveLocal();return;}
  if(el.dataset.submitAction){openSubmit(el.dataset.submitAction);return;}
  if(el.dataset.confirmSubmit){
    const d=currentDemo,opts={actor:currentUser(),baseRevision:state.baseRevision??draftEntry().baseRevision,baseSnapshotId:state.baseSnapshotId??draftEntry().baseSnapshotId};
    run(()=>d.submit(state.pendingAction,clone(state.pendingTarget),opts),result=>{
      if(result.kind==='noop'){finishOverlay();showToast('没有实际字段变化，无需提交审批');return;}
      const a=result.application;if(state.pendingDisplayAction==='上架范围变更')a.displayAction='上架范围变更';finishOverlay();state.activeApplication=a.id;state.page='detail';state.approvalTab='initiated';showToast('审批单已创建，产品已冻结');
    });return;
  }
  if(el.dataset.approve){if(!state.evidence.trim())return;openApprove(el.dataset.approve);return;}
  if(el.dataset.confirmApprove){
    const d=activeAppModel(el.dataset.confirmApprove),id=el.dataset.confirmApprove,evidence=state.evidence.trim();
    if(!evidence)return showToast('请填写外部测试依据引用',false);
    run(()=>d.decide(id,'approve',{actor:currentUser(),outcome:state.retryOutcome==='failed'?'failure':'success'}),a=>{a.evidence=evidence;resetDraft(d);finishOverlay();showToast(a.status==='已生效'?'本次变更已应用，申请已生效':'审批已通过，应用失败，产品继续冻结',a.status==='已生效');});return;
  }
  if(el.dataset.reject){state.returnDrawer=null;openReject(el.dataset.reject);return;}
  if(el.dataset.confirmReject){
    const reason=$('#reject-reason').value.trim();if(!reason){$('#reject-error').textContent='请填写驳回原因';return;}
    const d=activeAppModel(el.dataset.confirmReject);run(()=>d.decide(el.dataset.confirmReject,'reject',{actor:currentUser(),reason}),()=>{finishOverlay();showToast('申请已驳回，线上配置未变更');});return;
  }
  if(el.dataset.withdraw){const d=activeAppModel(el.dataset.withdraw);run(()=>d.withdraw(el.dataset.withdraw,{actor:currentUser()}),()=>showToast('申请已撤销，线上配置未变更'));return;}
  if(el.dataset.retryApply){const d=activeAppModel(el.dataset.retryApply);run(()=>d.retry(el.dataset.retryApply,{actor:currentUser(),outcome:state.retryOutcome==='failed'?'failure':'success'}),a=>{resetDraft(d);showToast(a.status==='已生效'?'本次变更已重试应用并生效':'重试应用失败，审批单保持未生效',a.status==='已生效');});return;}
  if(el.dataset.cancelUnapplied){const d=activeAppModel(el.dataset.cancelUnapplied);run(()=>d.cancel(el.dataset.cancelUnapplied,{actor:currentUser(),verified:true}),()=>showToast('本次变更已取消，产品冻结已释放'));return;}
  if(el.dataset.toast)showToast(el.dataset.toast);
});
document.addEventListener('input',event=>{
  const input=event.target;
  if(input.dataset.field&&state.editingTarget)state.editingTarget[input.dataset.field]=input.value;
  if(input.hasAttribute('data-evidence')){state.evidence=input.value;const approve=$('[data-approve]');if(approve){approve.disabled=!state.evidence.trim();approve.classList.toggle('is-disabled',!state.evidence.trim());}}
});
document.addEventListener('change',event=>{
  const input=event.target;
  if(input.dataset.field&&state.editingTarget)state.editingTarget[input.dataset.field]=input.value;
  if(input.dataset.region&&state.editingTarget)state.editingTarget.regions=[...modalRoot.querySelectorAll('[data-region]:checked')].map(el=>el.dataset.region);
  if(input.hasAttribute('data-role')){state.role=input.value;state.approvalTab=state.role==='普通用户'?'initiated':'review';state.evidence='';finishOverlay();render();}
  if(input.hasAttribute('data-product-status'))refreshFixture(input.value,input.value==='已上架');
  if(input.hasAttribute('data-lock-demo'))refreshFixture(currentDemo.product.status,input.value==='locked');
  if(input.hasAttribute('data-retry-outcome'))state.retryOutcome=input.value;
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!state.busy&&modalRoot.innerHTML)closeCurrent();
  if(event.key==='Tab'&&modalRoot.innerHTML){const dialog=modalRoot.querySelector('.modal,.drawer');const nodes=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(el=>el.offsetParent!==null);const first=nodes[0],last=nodes.at(-1);if(!dialog.contains(document.activeElement)){event.preventDefault();(event.shiftKey?last:first)?.focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
});
window.__prototype={get model(){return currentDemo;},get models(){return models;},ui:state,reset(scenario='listed'){currentDemo=newDemo(scenario);models.clear();models.set(currentDemo.product.id,currentDemo);drafts.delete(currentDemo);finishOverlay();state.page='product';render();}};
window.addEventListener('prototype:change',render);
render();

