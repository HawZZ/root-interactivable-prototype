'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const method=v=>({triplet:'三元组认证',certificate:'证书认证','':'未配置'}[v]??`不支持的认证方式（${v}）`);
const scenarios={
  listed:{status:'已上架',auth:'triplet',comm:'WIFI+BLE'},
  new:{status:'开发中',auth:'',comm:'WIFI',name:'Wi-Fi 新产品',new:true},
  developing:{status:'开发中',auth:'triplet',comm:'WIFI+BLE'},
  delisted:{status:'已下架',auth:'triplet',comm:'WIFI+BLE',devices:true},
  readonly:{status:'开发中',auth:'triplet',comm:'WIFI+BLE',permission:false},
  frozen:{status:'开发中',auth:'triplet',comm:'WIFI+BLE',pending:true},
  ble:{status:'开发中',auth:null,comm:'BLE',applicable:false},
  mesh:{status:'开发中',auth:null,comm:'WIFI+BLE Mesh',applicable:false},
  thirdparty:{status:'开发中',auth:null,comm:'WIFI+BLE',cloud:'涂鸦云',applicable:false},
  unknown:{status:'开发中',auth:'future_auth_v9',comm:'WIFI+BLE'},
  loading:{status:'已上架',auth:'triplet',comm:'WIFI+BLE',loading:true},
  loaderror:{status:'已上架',auth:'triplet',comm:'WIFI+BLE',loaderror:true}
};
let requestEpoch=0;
let state,view='detail',form=null,draft=null,error='',busy=false,risk=false,toastTimer;
let riskAction=null,baseline=false,fault='none',selectedNote=null;
function initialize(id){requestEpoch++;selectedNote=null;state={permission:true,applicable:true,cloud:'ROOT云',name:'BM08S',version:1,...scenarios[id],scenario:id};if(state.pending)state.pending={auth:'certificate',name:state.name,authChange:true,expectedVersion:1};draft=null;form=null;error='';busy=false;risk=false;view='detail';render()}
const validAuth=()=>['','triplet','certificate'].includes(state.auth);
const editable=()=>state.permission&&!state.pending;
const authEditable=()=>editable()&&state.status!=='已上架'&&state.applicable&&validAuth();
const changedAuth=()=>!!form&&state.applicable&&validAuth()&&form.auth!==form.originalAuth;
const anchor=(n,target,extra='')=>`<button class="anchor ${extra}" type="button" data-note="${n}" data-target="${target}" aria-label="批注 ${n}">${n}</button>`;
const button=(label,action,cls='',disabled=false)=>`<button class="${cls}" data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
function icon(kind){const shapes={grid:'<rect x="3" y="3" width="6" height="6"/><rect x="13" y="3" width="6" height="6"/><rect x="3" y="13" width="6" height="6"/><rect x="13" y="13" width="6" height="6"/>',monitor:'<rect x="2" y="3" width="20" height="14"/><path d="M8 21h8M12 17v4"/>',phone:'<rect x="6" y="2" width="12" height="20" rx="1"/>',gear:'<circle cx="12" cy="12" r="4"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4 4l3 3M17 17l3 3M4 20l3-3M17 7l3-3"/>',home:'<path d="M3 12a9 9 0 1118 0M12 12l5-6M6 17h12"/>'};return `<svg viewBox="0 0 24 24" aria-hidden="true">${shapes[kind]||shapes.grid}</svg>`}
function sidebar(){return `<aside class="sidebar"><img class="brand" src="assets/platform-logo.svg" alt="路特创新 AIoT Platform"><div class="nav-row">${icon('home')} 概览</div><div class="nav-row">${icon('grid')} 智能产品 <span class="caret">⌃</span></div><div class="nav-row active">产品列表</div><div class="nav-row sub">消息推送</div><div class="nav-row">${icon('monitor')} 设备管理 <span class="caret">⌃</span></div>${['设备列表','固件管理','OTA','虚拟版本配置'].map(x=>`<div class="nav-row sub">${x}</div>`).join('')}<div class="nav-row">${icon('phone')} App <span class="caret">⌃</span></div>${['App列表','App升级','扩展程序管理','白名单管理','白名单标签组管理','日志文件'].map(x=>`<div class="nav-row sub">${x}</div>`).join('')}<div class="nav-row">${icon('gear')} 配置中心 <span class="caret">⌃</span></div>${['物模型池','产品模板','产品分类','多语言','系统配置'].map(x=>`<div class="nav-row sub">${x}</div>`).join('')}<div class="sidebar-bottom">☷</div></aside>`}
function tag(v){return `<span class="tag ${v==='已上架'?'success':v==='开发中'?'warning':'info'}">${v}</span>`}
function row(label,value,id='',cls=''){return `<div class="info-row ${cls}" ${id?`id="${id}"`:''}><div class="info-label">${label}：</div><div class="info-value">${value}</div></div>`}
function details(){
 if(state.loading)return `<div class="load-box" id="load-target">正在加载产品详情… ${anchor(9,'load-target')}<div class="skeleton"></div><div class="skeleton"></div>${button('模拟加载完成','load-done')}</div>`;
 if(state.loaderror)return `<div class="load-box" id="load-target">产品详情加载失败，请重试。 ${anchor(9,'load-target')}<br>${button('重新加载','load-done')}</div>`;
 const auth=state.applicable?row('设备认证方式',`<span class="${state.auth===''?'empty-auth':''}">${esc(method(state.auth))}</span>${anchor(2,'auth-detail')}`,'auth-detail','auth-added'):'';
 const col1=[row('产品ID','2115287389018103810'),row('产品名称',esc(state.name)),row('创建用户','产品配置人员'),row('配网方式','蓝牙配网'),row('配网交互方式','CONNECT_NEW_PROTOCOL（配网过程新协议）'),row('原子化配网','支持'),row('设备是否可以编组','不支持'),row('产品代码','--'),row('最近编辑时间','2026-10-29 06:31:32'),row('所属App','momcozy')].join('');
 const col2=[row('产品状态',tag(state.status)),row('流程配网路由方式','原子化'),row('产品型号','BM08S'),row('创建时间','2026-10-28 11:39:48'),row('动态接入','支持'),row('支持频段','双频'),row('设备类型','直连设备'),row('产品共享','<span class="tag success">开启</span>'),row('最低支持版本','--'),row('产品图片','<img class="product-picture" src="assets/product.png" alt="BM08S产品图片"><span class="image-caption">原子化配网图</span>')].join('');
 const col3=[row('所属平台',esc(state.cloud)),row('通讯方式',`${esc(state.comm)}${!state.applicable?anchor(2,'comm-detail'):''}`,'comm-detail'),auth,row('显示型号','BM08S'),row('客服型号','--'),row('唯一编码','00020101'),row('绑定方式','中绑定'),row('编辑用户','产品配置人员'),row('引导分享','<span class="tag info">关闭</span>'),row('产品类型','--')].join('');
 return `<section class="product-summary" id="product-context"><img class="product-thumbnail" src="assets/product.png" alt="BM08S"><h2 class="product-title">${esc(state.name)} <span class="tag">${state.cloud}</span> ${tag(state.status)} ${anchor(1,'product-context')}</h2><div class="summary-actions">${button('查看 ProductProfile','existing','pale')}${button('编辑上架范围','existing','pale')}${state.status==='已上架'?button('下架产品','existing','danger-pale'):button('上架产品','list','pale',!!state.pending||!state.permission)}</div><div class="summary-meta">产品分类：Baby monitor <i>|</i> 产品型号：BM08S <i>|</i> 产品代码：-- <i>|</i> 产品ID：2115287389018103810 <i>|</i> 产品模板ID：1943157959371124737 <i>|</i> 上架范围：全部放开</div><div class="version-row">功能版本：<select aria-label="功能版本"><option>版本1 – 已发布</option><option>版本2 – 开发中（演示）</option></select><button class="link" data-action="existing">♧ 新建版本</button></div></section>
 <nav class="steps" aria-label="产品配置步骤">${['基础信息','功能设计','扩展程序','固件配置','设备调试','配网引导','高级配置'].map((x,i)=>`<div class="step ${i===0?'current':''}"><span class="step-icon">✓</span>${x}</div>`).join('')}</nav>
 <div class="share-alert"><span class="alert-icon">!</span><div><strong>共享权限已开启</strong><p>新版 APP 可展示「共享设备」入口，新版共享设备接口允许创建共享。旧版 APP 原共享设备接口保持不变。</p></div></div>
 <h2 class="section-title"><span>产品信息</span><span id="edit-entry">${button('编辑产品信息','edit','',!editable())}${anchor(3,'edit-entry')}</span></h2>
 <div class="info-grid"><div class="info-column">${col1}</div><div class="info-column">${col2}</div><div class="info-column">${col3}</div></div>
 <section class="whitelist"><h2>测试白名单</h2><p>*仅白名单用户可在未上架的功能版本中添加设备以及体验最新的功能，功能版本发布后，所有配置项将生效</p>${row('ⓘ 可见用户','所有公司用户　<button class="link" data-action="existing" aria-label="编辑测试白名单">♧</button>')}</section>`;
}
function formRow(label,body,req=false,id='',classes=''){return `<div class="form-row ${classes}" ${id?`id="${id}"`:''}><div class="form-label">${req?'<span class="required">*</span>':''}${label}：</div><div class="control">${body}</div></div>`}
const textInput=(value,disabled=true,label='',attrs='')=>`<input type="text" value="${esc(value)}" aria-label="${label}" ${disabled?'disabled':''} ${attrs}>`;
const selectInput=(value,disabled=true,label='')=>`<select aria-label="${label}" ${disabled?'disabled':''}><option>${value}</option></select>`;
function radios(values,selected,disabled=true,name='existing'){return values.map((x,i)=>`<label><input type="radio" name="${name}" value="${i}" ${x===selected?'checked':''} ${disabled?'disabled':''}><span>${x}</span></label>`).join('')}
function editor(){
const listed=state.status==='已上架',frozen=!!state.pending,authLock=!authEditable()||busy;
let authField='';
if(state.applicable&&!baseline){let hint=listed?'产品上架后不可修改':!validAuth()?'当前认证方式不受支持，请联系技术人员处理；其他合法字段可单独保存。':'必填。请选择设备认证方式；按既有流程审批生效后用于设备接入。';
 authField=formRow('设备认证方式',`${!validAuth()?`<p class="error-text">${esc(method(state.auth))}</p>`:''}<div class="auth-choice" role="radiogroup" aria-label="设备认证方式"><label><input type="radio" name="auth" value="triplet" ${form.auth==='triplet'?'checked':''} ${authLock?'disabled':''}><span>三元组认证</span></label><label><input type="radio" name="auth" value="certificate" ${form.auth==='certificate'?'checked':''} ${authLock?'disabled':''}><span>证书认证</span></label>${anchor(4,'auth-field')}</div><p class="help">${hint}</p>${error==='required'?'<p class="error-text" role="alert">请选择设备认证方式</p>':''}`,true,'auth-field',error==='required'?'invalid auth-added':'auth-added');}
const restore=draft?`<div class="pending-alert">已恢复本地草稿；当前生效方式：${esc(method(state.auth))}。草稿不会改变设备接入参数。</div>`:'';
const err=error&&error!=='required'?`<div class="inline-error" id="save-error" role="alert">${esc(error)} ${button('刷新配置','refresh')}${anchor(9,'save-error')}</div>`:'';
return `<div class="overlay"><section class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><header class="drawer-header"><span id="drawer-title">编辑产品信息</span><button class="close" data-action="close" aria-label="关闭此对话框" ${busy?'disabled':''}>×</button></header><div class="drawer-body">${restore}${err}
${formRow('产品分类','Baby monitor / 2')}
${formRow('所属平台',radios(['ROOT云','涂鸦云','觅睿云'],state.cloud,false,'cloud'),true)}
${formRow('产品ID',textInput('2115287389018103810',true,'产品ID'))}
${formRow('通讯方式',`${selectInput(state.comm,true,'通讯方式')}<p class="help">产品创建后不可修改通讯方式</p>`,true)}
${authField}
${formRow('产品模板',`${selectInput('婴儿监视器',true,'产品模板')}<p class="help">根据通讯方式后自动选择</p>`,true)}
<div class="separator"></div>
${formRow('动态接入',`${radios(['不支持','支持'],'支持',listed,'dynamic')}${listed?'<p class="help">产品上架后不可修改</p>':''}`,true)}
${formRow('唯一编码',`${textInput('00020101',listed,'唯一编码')}${listed?'<p class="help">产品上架后不可修改</p>':''}`,true)}
${formRow('原子化配网',radios(['不支持','支持'],'支持',false,'atomic'),true)}
${formRow('配网交互方式',`${selectInput('CONNECT_NEW_PROTOCOL（配网过程新协议）',listed,'配网交互方式')}${listed?'<p class="help">产品上架后不可修改</p>':''}`,true)}
${formRow('流程配网路由方式',selectInput('原子化',false,'流程配网路由方式'),true)}
${formRow('配网方式',selectInput('蓝牙配网',false,'配网方式'),true)}
${formRow('支持频段',selectInput('双频',false,'支持频段'),true)}
${formRow('动态配网最低支持版本',textInput('',false,'动态配网最低支持版本','placeholder="请输入 x.y.z 格式（如：1.0.0）"'))}
<div class="separator"></div>
${formRow('蓝牙仅配网',radios(['蓝牙控制','蓝牙仅配网'],'蓝牙仅配网',false,'ble-control'),true)}
${formRow('设备是否可以编组',radios(['不支持','支持'],'不支持',false,'group'),true)}
${formRow('绑定类型',radios(['强绑定','弱绑定','中绑定'],'中绑定',false,'binding'),true)}
${formRow('产品共享',radios(['关闭','开启'],'开启',false,'sharing'))}
${formRow('引导分享',radios(['关闭','开启'],'关闭',false,'share-guide'))}
${formRow('设备类型',radios(['直连设备','网关设备','网关子设备','ipc设备'],'直连设备',false,'device-type'),true)}
${formRow('产品型号',`${textInput('BM08S',listed,'产品型号')}${listed?'<p class="help">产品上架后不可修改</p>':''}`,true)}
${formRow('显示型号',`${textInput('BM08S',listed,'显示型号')}${listed?'<p class="help">产品上架后不可修改</p>':''}`,true)}
${formRow('产品名称',`${textInput(form.name,busy,'产品名称','id="product-name" maxlength="32"')}<p class="help" style="text-align:right">${esc(form.name.length)} / 32</p>`,true)}
${formRow('产品代码',textInput('',false,'产品代码','placeholder="请选择产品代码"'))}
${formRow('客服型号',textInput('',false,'客服型号','placeholder="请输入客服型号"'))}
<div class="separator"></div>
${formRow('所属App',selectInput('momcozy',false,'所属App'),true)}
${formRow('产品图片',`<button data-action="existing">选择源图</button><p class="help">建议 600×600，不可大于 5 MB；支持 PNG、JPG、JPEG 格式</p><img class="product-picture" src="assets/product.png" alt="产品图片">`,true)}
</div><footer class="drawer-footer" id="save-actions">${button('取消','close','',busy)}${button(busy?'处理中…':'保存本地草稿','draft','',busy||frozen||baseline)}${button(busy?'提交中…':'提交变更并冻结','submit','primary',busy||frozen||baseline)}${anchor(5,'save-actions')}</footer></section></div>`;
}
function riskDialog(){return `<div class="dialog-shade"><section class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="risk-title" id="risk-dialog"><header class="dialog-header"><span id="risk-title">确认切换设备认证方式 ${anchor(6,'risk-dialog')}</span><button class="close" data-action="risk-cancel" aria-label="关闭风险确认">×</button></header><div class="dialog-body"><p>该产品已下架，且存在已烧录或已接入设备。</p><p>认证方式将由 <strong>${esc(method(state.auth))}</strong> 变更为 <strong>${esc(method(form.auth))}</strong>。</p><ul><li>仅修改平台配置不会补烧证书、私钥或更新固件。</li><li>设备凭证、固件及接入参数不匹配时，设备后续重连可能失败。</li></ul><p>请确认已安排设备适配。继续提交仍需按既有流程审批生效。</p></div><footer class="dialog-footer">${button('取消','risk-cancel')}${button('确认风险并提交','risk-confirm','primary')}</footer></section></div>`}
const notes={
detail:{title:'基础信息 · 产品信息',intro:'按 2026-11-06 现网详情还原。仅黄色编号及评审控制属于原型辅助。',cards:[
 [1,'产品上下文','详情 > 产品概况','<p><strong>数据来源：</strong>ROOT云 BM08S 的已上架页面为现状样本。保留导航、七步配置、共享提示、功能版本及原有操作。</p><p><strong>规则：</strong>认证权限按当前产品上架状态判断，功能版本“已发布 / 开发中”不改变这一限制。切换功能版本不会解锁已上架产品。</p><p><strong>原型备注：</strong>其余场景为同一界面的状态演示，非逐个产品实测；用户信息已脱敏。</p>','product-context'],
 [2,'设备认证方式 · 唯一新增字段','详情 > 产品信息 > 通讯方式附近','<p><strong>说明：</strong>展示产品已生效认证方式。值为“三元组认证 / 证书认证”；新建未配置显示“未配置”，不能用于设备接入或上架。</p><p><strong>初始化：</strong>上线存量快照内缺失值一次性初始化三元组；显式非空值保留。新建空值不进入回填范围，禁止永久 null 兜底。</p><p><strong>适用：</strong>Wi-Fi、BLE+Wi-Fi；纯 BLE 隐藏。Mesh / 第三方云须由技术确认矩阵，未确认不开放新增证书选项、不改变原接入。</p><p><strong>异常：</strong>未知非空值原样展示并提示不支持；不能自动纠正为三元组。A1 / A3 / A9。</p>',()=>state.applicable?'auth-detail':'comm-detail'],
 [3,'复用编辑入口及限制','详情 > 产品信息 > 编辑产品信息','<p><strong>点击：</strong>打开现有 720px 编辑抽屉，无新增独立配置页。</p><p><strong>权限：</strong>开发中 / 已下架在原编辑约束内可修改；已上架仅认证字段只读，其他合法字段仍可保存。无编辑权限、审批冻结沿用原约束。</p><p><strong>状态：</strong>审批值、本地草稿不替代详情生效值。实际冻结控件和提示外观待与既有实现对齐，演示不声称已核实该外观。A1 / A2。</p>','edit-entry']
]},
editor:{title:'编辑产品信息 · 抽屉',intro:'底层页面沿用详情。仅记录抽屉内本次变化；其余字段保留原顺序与密度。',cards:[
 [4,'认证方式单选与必填','编辑产品信息 > 通讯方式之后','<p><strong>字段：</strong>产品级互斥单选，两个选项，无端口输入框。新建初始空、不预选；存量迁移值为三元组。</p><p><strong>校验：</strong>提交变更并冻结时未选，前后端提示“请选择设备认证方式”，保持抽屉和输入；拒绝生效及上架。仅本地草稿可暂存空值。</p><p><strong>只读：</strong>当前已上架显示“产品上架后不可修改”；未知枚举禁改认证，允许其他字段按字段保存并保留原值。</p><p><strong>原型备注：</strong>新增字段拟放在通讯方式之后，最终以设计评审为准；产品名称可编辑用于验证“其他字段独立保存”，其余既有配置保留现状外观和启用状态，演示不提交其改动；不代表正式产品限制这些功能。A1 / A3 / A9。</p>','auth-field'],
 [5,'草稿、提交与审批生效','编辑产品信息 > 底部固定操作区','<p><strong>保存本地草稿：</strong>仅保存演示浏览器内存草稿，重新打开可恢复；允许空认证。详情与设备参数保持生效值。实际草稿存储沿用现有实现，不因原型另设规则。</p><p><strong>提交：</strong>校验 → 下架有设备且方式变化时风险确认 → 请求处理中禁重复 → 成功提交并冻结。待审批值不用于设备接入。</p><p><strong>服务端：</strong>保存与审批应用时再校验状态、权限、适用组合、枚举与认证版本/明确变更意图。上架后拒绝实际变化；同值与其他字段不误拦截。</p><p><strong>失败：</strong>保持输入；请求失败可重试。冲突提示刷新，不覆盖较新值；旧页面仅改其他字段不得带旧认证值覆盖；使用“仅其他字段：认证已更新”请求场景验证字段合并。A2 / A6 / A7 / A10。</p>','save-actions']
]},
risk:{title:'下架产品 · 切换风险确认',intro:'仅在存在设备且认证方式实际改变的提交路径出现；本地草稿不触发生效切换。',cards:[
 [6,'设备适配风险','提交变更 > 风险确认弹窗','<p><strong>触发：</strong>已下架、存在已烧录或已接入设备，且选择方式与原值不同。不存在设备或未变值不重复提示。</p><p><strong>取消：</strong>关闭确认，不提交、不保存本次认证变更，保留抽屉选择便于调整。</p><p><strong>确认风险并提交：</strong>继续既有提交/冻结流程，仍需审批与最终应用校验；不能据此宣称凭证、固件已适配。</p><p><strong>用户决定：</strong>允许下架有设备切换，接受重连可能失败的风险；不得增加禁止切换限制。不会下发私钥或更新固件。A4。</p>','risk-dialog']
]},
validation:{title:'校验与并发 · 异常规格',intro:'通过顶部“请求”选择器触发；该控制属于原型，不属于后台业务功能。',cards:[
 [9,'失败、锁定、未知值与恢复','详情加载 / 编辑提交 / 审批应用','<table><tr><th>场景</th><th>结果</th></tr><tr><td>新建空值提交</td><td>字段错误；输入保留；生效值仍空。</td></tr><tr><td>保存失败</td><td>失败一次，保持输入，再点提交重试。</td></tr><tr><td>提交时已上架</td><td>拒绝认证变化，刷新后上架只读。</td></tr><tr><td>认证版本冲突</td><td>拒绝过期请求，刷新读取新值；不自动重放。</td></tr><tr><td>审批前更新</td><td>最终应用拒绝过期认证，较新值保留。</td></tr><tr><td>无权限 / 冻结</td><td>编辑不可用；不靠前端拦截替代后端。</td></tr><tr><td>未知枚举</td><td>原值展示；其他字段可单独保存，不能覆盖认证。</td></tr></table><p><strong>刷新：</strong>明确以最新生效配置重新加载抽屉，放弃未提交编辑；不是自动覆盖后再提示。服务版本回滚不回滚业务认证值。A2 / A3 / A10。</p><p><strong>加载失败：</strong>保留重试入口；重试成功返回详情。加载中不可编辑。本地演示不等于接口并发测试。</p>',()=>error?'save-error':state.loaderror||state.loading?'load-target':'edit-entry']
]},
delivery:{title:'生效与接入 · 实施规格',intro:'此区是研发 / 测试规格，不新增平台接入调试、证书管理或审批页面。',cards:[
 [7,'生效配置到设备的闭环','既有审批生效 → 设备接入（无新增 UI）','<p><strong>路径：</strong>产品生效认证方式 → 技术定义的端点 / TLS / 端口 → 设备获得参数并选择路径 → EMQX 执行设备身份与产品归属认证。</p><p><strong>参数：</strong>三元组 / 证书分别参考 1883 / 8883，最终由技术定义，不开放运营改端口，不将端口当业务枚举。TLS 握手成功不等于设备证书认证成功。</p><p><strong>依赖：</strong>平台后端 / 固件明确实际下发载体、首次引导、缓存刷新、版本适配，避免先连新端口才拿到新端口的循环。不能仅加字段却无接入闭环。</p><p><strong>会话：</strong>在线会话断连/保留、兼容窗口及结束条件待技术提案；体验变化返回产品复核。生效后新连接/重连遵守当前策略，禁止静默降级或永久双策略。A5 / A6。</p>','auth-detail'],
 [8,'证书供给、记录与技术门禁','实施依赖 > 技术评审 / 联调','<p><strong>事实边界：</strong>EMQX 已实现证书接入来自用户转述开发反馈，本次未实测。</p><p><strong>责任：</strong>平台后端 / EMQX 团队确认信任链、设备唯一身份与产品映射、更新/吊销边界；固件 / 生产团队确认发证、烧录、私钥存储；测试核验生产实际链路。</p><p><strong>记录：</strong>最小追踪操作者、产品、前后值、提交与最终生效结果；草稿 / 拒绝 / 审批阶段分别核对，禁止私钥入日志。不新增审计平台。</p><p><strong>门禁：</strong>技术评审登记真实负责人、系统路径与证据；测试证书联调与生产供给证据分开。缺证据不宣称生产可用。A7 / A8。</p>','auth-detail']
]},
review:{title:'现状还原 · 改动范围',intro:'先用“仅看现状布局”对照，再打开编辑查看新增字段。视觉还原与业务实现验收分开。',cards:[
 [10,'现网依据与变化清单','2026-11-06 > ROOT云 BM08S > 基础信息','<p><strong>直接观察：</strong>现网详情、编辑产品信息抽屉；原页面不存在设备认证方式。Logo、产品图来自该页面并归档本地。</p><table><tr><th>保留</th><th>本次增加</th></tr><tr><td>208px 深色侧栏、54px 页头、页签、产品概况、七步配置</td><td>详情认证方式一行</td></tr><tr><td>共享提示、三列信息、测试白名单、底部下一步</td><td>抽屉认证单选及必填/只读提示</td></tr><tr><td>720px 抽屉、180px 标签、32px 控件、原字段顺序</td><td>下架有设备切换确认、字段校验反馈</td></tr><tr><td>取消 / 保存本地草稿 / 提交变更并冻结</td><td>相关状态与异常规格</td></tr></table><p><strong>原型备注：</strong>固定 1440px 画布，左区可横向滚动，不缩放原页面；右区为评审批注。个人水印和账号信息省略/脱敏；不代表正式产品删除水印。</p><p><strong>推断待评审：</strong>复制为新产品认证置空，依据“新建为空”推导，非用户逐字确认。新增字段位置、冻结/审批提示、失败文案与生产实现需评审确认。</p><p><strong>交付边界：</strong>仅本地原型；未修改平台、未执行迁移、未测试证书或设备链路。旧四方式工件不作为本版需求。</p>','product-context']
]}
};
function renderNotes(){const context=notes[view]||notes.detail;$('#notes').innerHTML=`<h2 class="context-title">${context.title}</h2><p class="context-description">${context.intro}</p>${context.cards.map(([n,title,location,body,target])=>`<section class="note-card ${selectedNote===n?'selected':''}" tabindex="0" role="button" data-card="${n}" data-target="${typeof target==='function'?target():target}"><h3><span class="note-number">${n}</span>${title}</h3><p class="location">关联位置：${location}</p>${body}</section>`).join('')}`;$('.notes-pane').querySelectorAll('[data-card]').forEach(el=>{el.addEventListener('click',()=>highlight(Number(el.dataset.card),el.dataset.target));el.addEventListener('keydown',e=>{if(e.key==='Enter')highlight(Number(el.dataset.card),el.dataset.target)})})}
function render(){const canvas=$('#product-canvas');const oldScroll=$('.drawer-body')?.scrollTop||0;canvas.className=`product-canvas ${baseline?'baseline':''}`;canvas.innerHTML=`${sidebar()}<header class="admin-header"><span class="back-arrow">←</span><div><div class="heading-title">智能产品</div><div class="breadcrumbs">查看产品详情　/　产品列表　/　智能产品</div></div><div class="header-right"><span>⌕</span><span>♧</span><span>文A</span><span class="avatar">配</span></div></header><div class="workspace-tab"><span>产品详情</span></div><article class="main-content">${details()}</article><footer class="page-footer">${button('下一步','existing','primary')}</footer>${form?editor():''}${risk?riskDialog():''}`;
$('#approval-tools').hidden=!state.pending;document.querySelectorAll('#scenario,#fault,#baseline,#reset').forEach(x=>x.disabled=busy);canvas.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>action(el.dataset.action)));canvas.querySelectorAll('[data-note]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();const n=Number(el.dataset.note);view=Object.keys(notes).find(k=>notes[k].cards.some(c=>c[0]===n));renderNotes();highlight(n,el.dataset.target);if(innerWidth<=900)setMobile('notes')}));canvas.querySelectorAll('[name=auth]').forEach(el=>el.addEventListener('change',()=>{form.auth=el.value;error='';render()}));$('#product-name')?.addEventListener('input',e=>{form.name=e.target.value;e.target.nextElementSibling.textContent=`${form.name.length} / 32`});if($('.drawer-body'))$('.drawer-body').scrollTop=oldScroll;renderNotes();}
function highlight(n,target){selectedNote=n;document.querySelectorAll('.annotation-target').forEach(x=>x.classList.remove('annotation-target'));const t=document.getElementById(target);if(t){t.classList.add('annotation-target');t.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'})}document.querySelectorAll('[data-card]').forEach(x=>x.classList.toggle('selected',Number(x.dataset.card)===n));}
function toast(text,isError=false){clearTimeout(toastTimer);$('.toast')?.remove();let t=document.createElement('div');t.className=`toast ${isError?'error':''}`;t.setAttribute('role','status');t.textContent=text;$('#product-canvas').append(t);toastTimer=setTimeout(()=>t.remove(),5000)}
function openEditor(){if(!editable())return;form={auth:state.auth,name:state.name,originalAuth:state.auth,expectedVersion:state.version,...draft};error='';view='editor';render();$('.drawer')?.scrollIntoView({block:'nearest',inline:'end'});}
function action(a){
 if(a==='edit'){openEditor();return}
 if(a==='close'){if(busy)return;form=null;risk=false;error='';view='detail';render();return}
 if(a==='draft'){draft={...form};form=null;error='';view='detail';render();toast('已保存本地草稿，生效配置未改变');return}
 if(a==='submit'){submit();return}
 if(a==='risk-cancel'){risk=false;view='editor';riskAction=null;render();return}
 if(a==='risk-confirm'){risk=false;view='editor';riskAction?.();riskAction=null;return}
 if(a==='refresh'){draft=null;form={auth:state.auth,name:state.name,originalAuth:state.auth,expectedVersion:state.version};error='';view='editor';render();toast('已读取最新配置，请重新核对后提交');return}
 if(a==='list'){if(state.applicable&&!state.auth){view='validation';renderNotes();toast('请选择设备认证方式，未配置时不能上架',true)}else{view='delivery';renderNotes();toast('上架前仍需完成既有校验与接入联调；本原型不执行真实上架')}return}
 if(a==='load-done'){state.loading=false;state.loaderror=false;view='detail';render();return}
 if(a==='existing'){view='review';renderNotes();toast('既有功能仅保留现状外观，本期原型演示认证方式配置');return}
}
function submit(){
if(busy||!editable()||!form)return;
if(state.applicable&&validAuth()&&!form.auth){error='required';view='editor';render();$('#auth-field')?.scrollIntoView({block:'center'});return}
if(!form.name.trim()){error='请输入产品名称';render();$('#product-name')?.focus();return}
if(state.status==='已下架'&&state.devices&&changedAuth()){risk=true;view='risk';riskAction=commit;render();return}commit();}
function commit(){const epoch=requestEpoch;busy=true;error='';render();setTimeout(()=>{if(epoch!==requestEpoch)return;busy=false;const authChange=changedAuth();
 if(fault==='network'){fault='none';$('#fault').value='none';error='提交失败，未提交任何变更。请重试。';view='editor';render();return}
 if(fault==='listed'&&authChange){state.status='已上架';error='产品已上架，设备认证方式未变更。请刷新配置。';view='editor';render();return}
 if(fault==='stale'&&state.applicable&&validAuth()){state.auth='certificate';state.version++;fault='none';$('#fault').value='none'}
 if(fault==='conflict'&&authChange){state.auth='certificate';state.version++;fault='none';$('#fault').value='none';error='设备认证方式已被其他人更新，本次变更未提交。请刷新配置。';view='editor';render();return}
 if(authChange&&(state.status==='已上架'||form.expectedVersion!==state.version)){error='产品状态或认证版本已变化，变更未提交。请刷新配置。';view='editor';render();return}
 state.pending={auth:authChange?form.auth:state.auth,name:form.name,authChange,expectedVersion:form.expectedVersion};form=null;draft=null;view='delivery';render();toast('变更已提交并冻结，待审批后生效');
},650)}
function approve(){if(!state.pending)return;const p=state.pending;let conflict=$('#approval-conflict').checked;
if(conflict){state.auth='certificate';state.version++}
if(p.authChange&&(state.status==='已上架'||p.expectedVersion!==state.version)||conflict){state.pending=null;view='validation';render();toast('审批应用失败：认证状态或版本冲突，较新配置已保留。',true);return}
if(p.authChange)state.auth=p.auth;state.name=p.name;if(p.authChange)state.version++;state.pending=null;view='detail';render();toast('模拟审批通过，详情已更新生效值；设备接入仍需真实联调');}
function setMobile(v){document.body.classList.toggle('show-notes',v==='notes');document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.view===v)))}
$('#scenario').addEventListener('change',e=>{fault='none';$('#fault').value='none';$('#approval-conflict').checked=false;initialize(e.target.value)});
$('#fault').addEventListener('change',e=>{fault=e.target.value});
$('#baseline').addEventListener('change',e=>{baseline=e.target.checked;form=null;view='review';error='';render()});
$('#reset').addEventListener('click',()=>{fault='none';$('#fault').value='none';$('#approval-conflict').checked=false;initialize($('#scenario').value)});
$('#chain').addEventListener('click',()=>{view='delivery';renderNotes();if(innerWidth<=900)setMobile('notes')});
$('#approve').addEventListener('click',approve);
$('#reject').addEventListener('click',()=>{if(!state.pending)return;state.pending=null;view='detail';render();toast('模拟审批驳回，已解除冻结；生效配置未改变')});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setMobile(b.dataset.view)));
document.querySelectorAll('.notes-header a,.notes-footer a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.hash.slice(1));history.replaceState(null,'',a.hash)}));
function navigate(hash){if(hash==='editor'){if(editable())openEditor();else{view='editor';renderNotes()}return}if(hash==='risk'){if(!form)openEditor();view='risk';renderNotes();return}view=notes[hash]?hash:'detail';renderNotes()}
initialize('listed');if(location.hash)navigate(location.hash.slice(1));

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!busy){if(risk)action('risk-cancel');else if(form)action('close')}});
