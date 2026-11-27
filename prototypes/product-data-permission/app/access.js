/* Synthetic, tab-local data for the access walkthrough. */
const $ = selector => document.querySelector(selector);
const sampleKey = "iot-permissions-review-v3";
const emptyViewer = {name:"零授权样例", mail:"empty@example.test", direct:[], roles:[]};
const viewers = [...users, emptyViewer];
let viewer = users[1];
let scopeFailure = false;
let results = [];
let batchTargets = [];
let page = 1;
let search = "";
let filter = "";
const pageSize = 2;

function saveExample() {
  try {
    sessionStorage.setItem(sampleKey, JSON.stringify({users, dataRoles, created:productCatalog.filter(p=>p.created), viewer:viewer.mail, scenario:activeScenario, approvalRole:$("#approvalRole").value, downloadAllowed:$("#logDownloadAllowed").checked, approved:[...approvedBills], firmwareLinks, erpAccess:$("#erpAccess").value, audio:[...productAudioLinks], codes:exampleCodes, relations:Object.fromEntries(Object.entries(exampleRelations).map(([key,ids])=>[key,[...ids]]))}));
  } catch { /* The example also works without tab storage. */ }
}
function restoreExample() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(sampleKey));
    if (!saved) return;
    if (Array.isArray(saved.created)) productCatalog.push(...saved.created);
    for (const user of users) {
      const old = saved.users.find(item => item.mail === user.mail);
      if (old) Object.assign(user,{direct:old.direct, roles:old.roles});
    }
    dataRoles.splice(0,dataRoles.length,...saved.dataRoles);
    viewer = viewers.find(user => user.mail === saved.viewer) || viewer;
    if (["edit","read","none"].includes(saved.erpAccess)) $("#erpAccess").value=saved.erpAccess;
    if (["user","approver","admin"].includes(saved.approvalRole)) $("#approvalRole").value=saved.approvalRole;
    if (typeof saved.downloadAllowed==="boolean") $("#logDownloadAllowed").checked=saved.downloadAllowed;
    if (Array.isArray(saved.approved)) approvedBills=new Set(saved.approved);
    if (saved.firmwareLinks) Object.assign(firmwareLinks,saved.firmwareLinks);
    if (saved.codes) exampleCodes.splice(0,exampleCodes.length,...saved.codes);
    if (saved.audio) productAudioLinks=new Set(saved.audio);
    for (const key of Object.keys(exampleRelations)) {
      if (saved.relations?.[key]) exampleRelations[key]=new Set(saved.relations[key]);
    }
    applyScenario(saved.scenario === "user" ? "user" : "admin");
  } catch { /* Fresh example data is available on first open. */ }
}

function updateSelection() {
  $("#selectionCount").textContent = "已选 " + selectedAccounts.size + " 个账号";
  $("#batchStart").disabled = !isAdmin() || !selectedAccounts.size;
}
$("#userRows").addEventListener("change", event => {
  const mail = event.target.dataset.selectAccount;
  if (!mail) return;
  if (event.target.checked) selectedAccounts.add(mail);
  else selectedAccounts.delete(mail);
  updateSelection();
});
function updateBatchPreview() {
  const count = grantDraft.direct.length;
  $("#batchPreview").textContent = batchTargets.length + " 个账号 × " + count + " 个产品，共 " + (batchTargets.length * count) + " 项";
  $("#confirm").disabled = !batchTargets.length || !count;
}
$("#batchStart").onclick = () => {
  if (!isAdmin() || !selectedAccounts.size) return;
  batchTargets = users.filter(user => selectedAccounts.has(user.mail));
  grantDraft = {direct:[]};
  setDrawer("批量授权", '<div class="field"><label>选中的后台账号</label><div class="scope" id="batchNames"></div></div><div class="field"><label>追加指定产品直授</label><div id="grantProducts"></div></div><div class="scope" id="batchPreview" aria-live="polite"></div>', "确认追加授权","batch");
  $("#batchNames").textContent = batchTargets.map(u=>u.name+" · "+u.mail).join("，");
  renderGrantProductPicker();
  renderNotes("batch", "批量授权 · 提交前");
};
notes.batch = [
  ["选中的账号", "仅向列表中明确勾选的 IoT 后台账号追加直授。全局管理员的管理权限决定可授产品范围。"],
  ["选中的产品", "已有直授自动跳过。仅通过角色获得的产品仍会新增直授，其他产品与角色关系保留。"],
  ["逐项结果", "核对账号数、产品数和组合数后提交。每个组合独立返回新增、已直授或失败，重试只处理失败项。"]
];
function confirmBatch() {
  if (!isAdmin()) return;
  if (drawerMode === "batch") {
    if (!grantDraft.direct.length || !batchTargets.length) return;
    results = batchTargets.flatMap(user => grantDraft.direct.map(product=>({user, product, status:"待提交"})));
  } else if (!results.some(r=>r.status === "失败")) {
    closeDrawer();
    return;
  }
  let simulate = $("#batchFailure").checked;
  $("#batchFailure").checked = false;
  for (const row of results) {
    if (!["待提交","失败"].includes(row.status)) continue;
    if (row.user.direct.includes(row.product)) row.status = "已直授";
    else if (simulate) {
      row.status = "失败";
      row.reason = "授权服务暂时不可用";
      simulate = false;
    } else {
      row.user.direct.push(row.product);
      row.status = "新增";
    }
  }
  const failed = results.filter(r=>r.status === "失败").length;
  const added = results.filter(r=>r.status === "新增").length;
  setDrawer("批量授权结果", '<p id="batchTotals"></p><div id="outcomes"></div>', failed ? "仅重试失败项" : "完成","batchResult");
  $("#cancel").hidden = true;
  $("#batchTotals").textContent = "新增 "+added+" 项 · 已直授 "+(results.length-added-failed)+" 项 · 失败 "+failed+" 项";
  for (const row of results) {
    const line = document.createElement("div");
    line.className = "result-line";
    line.textContent = [row.user.name, row.product, row.status, row.status === "失败" ? row.reason : ""].filter(Boolean).join("　");
    $("#outcomes").append(line);
  }
  renderRows();
  filterUsers();
  saveExample();
  renderNotes("batch", "批量授权 · 逐项结果");
}

function filterUsers() {
  const term = $("#users .el-input").value.trim().toLowerCase();
  const state = $("#users select").value;
  let count = 0;
  $("#userRows").querySelectorAll("tr").forEach((tr,i)=>{
    const u = users[i];
    const matched = (u.name+" "+u.mail).toLowerCase().includes(term);
    const statusMatch = state === "全部授权状态" || (state === "已授权" ? scopeProducts(u).length > 0 : u.roles.includes("系统临时全量角色"));
    tr.hidden = !(matched && statusMatch);
    if (!tr.hidden) count++;
  });
  $("#users .pager").textContent = "共 " + count + " 条";
}
$("#users .filters .el-btn--primary").onclick = filterUsers;
$("#users .filters .el-btn:last-child").onclick = () => {
  $("#users .el-input").value = "";
  $("#users select").selectedIndex = 0;
  filterUsers();
};

function navigate(path) {
  if (location.hash.slice(1) === path) showRoute();
  else location.hash = path;
}
function resetFilters() {page=1;search="";filter="";}
function goList() {resetFilters();navigate("/iot-product");}
document.querySelectorAll("[data-route]").forEach(b=>b.onclick=()=>{resetFilters();navigate(b.dataset.route);});
function panel(content) {return '<section class="business-panel">'+content+'</section>';}
function stateBlock(title,detail,action) {
  return '<section class="business-panel business-state"><h2>'+title+'</h2><p>'+detail+'</p>'+(action||"")+'</section>';
}
const returnButton = '<button class="el-btn" id="returnList">返回产品列表</button>';
// Each example uses the policy for its business operation.
const reviewDomains = {
  approval: {erpOnly:true, path:"/approval-manage", title:"审批管理", note:"普通用户只看本人发起的工单。审批员和管理员可查看全部，并按原流程审批待处理工单。"},
  firmware: {path:"/firmware-virtual-version", title:"虚拟版本配置", note:"虚拟版本、已关联固件、可选固件和包均属于当前产品。切换产品后重新加载。"},
  diagnosis: {erpOnly:true, path:"/op-device-info", title:"设备信息查询", note:"四类结果均按原查询资格返回。设备列表及其详情另按产品授权过滤。"},
  devices: {path:"/device-list", title:"设备列表", note:"设备记录按所属产品授权过滤。"},
  logs: {erpOnly:true, path:"/app/log-file", title:"App 日志文件", note:"清单与整文件下载沿用既有权限。此处下载的文件仅含演示日志。"},
  codes: {erpOnly:true, path:"/iot-error-code-resources", title:"错误码资源", note:"错误码语义、语言文案及已有引用沿用原授权。引用示例只用于展示本域权限。"},
  production: {path:"/production/record", title:"生产记录", erpOnly:true, note:"批次、统计及工厂候选按生产业务条件读取。"},
  certificates: {path:"/production/certificate", title:"生产凭证", erpOnly:true, note:"产品与工厂可用作检索条件，操作者零产品授权仍可按功能权限查询。"},
  redeem: {path:"/redemption-code-list", title:"兑换码管理", erpOnly:true, note:"创建、列表和使用记录校验既有功能权限与业务条件。"},
  whitelist: {path:"/app/user-whitelist", title:"App 白名单", erpOnly:true, note:"白名单账号与其产品关系均按 ERP 动作权限管理，修改关系不会给后台账号授予产品。"},
  audioCategory: {path:"/iot-audio-manage", title:"音源类别", erpOnly:true, note:"音源类别的授权产品、绑定和解绑按 ERP 权限管理；进入产品侧音源页面须校验产品。"},
  productLang: {path:"/lang-manage/product", title:"智能产品多语言", note:"按当前用户的产品授权展示智能产品词条。"},
  templateLang: {path:"/lang-manage/product-template", title:"模板多语言", erpOnly:true, note:"模板词条沿用 ERP 功能权限。"},
  appLang: {path:"/lang-manage/app-common", title:"App 通用多语言", erpOnly:true, note:"通用词条沿用 ERP 功能权限。"}
};
const exampleRelations = {
  whitelist: new Set(["P-10002"]),
  audioCategory: new Set(["P-10002", "P-10005"])
};
let productAudioLinks = new Set(["P-10002"]);
const exampleCodes = [{productId:"P-10005", code:"DEMO-001", used:1}];
function businessPicker(selected, products, includeAll = false) {
  const options = products.map(p => '<option value="'+p.id+'" '+(p.id===selected ? 'selected' : '')+'>'+p.name+'</option>');
  if (includeAll) options.unshift('<option value="">全部产品</option>');
  return '<label>产品 <select class="el-select" id="domainProduct">'+options.join("")+'</select></label>';
}
const bills = [
  {id:"REQ-01", product:"S12 Pro", owner:"wang.lin@momcozy.com"},
  {id:"REQ-02", product:"V2", owner:"chen.wei@momcozy.com"},
  {id:"REQ-03", product:"W1 Lite", owner:"chen.wei@momcozy.com"},
  {id:"REQ-04", product:"S9 Pro", owner:"empty@example.test"}
];
let approvedBills = new Set(["REQ-04"]);
const firmwareLinks = {};
function canReviewAll() {
  return ["approver","admin"].includes($("#approvalRole").value);
}
function approvalList(canEdit) {
  const rows = bills.filter(bill=>canReviewAll() || bill.owner===viewer.mail).map(bill=>{
    const complete = approvedBills.has(bill.id);
    const action = canReviewAll() && !complete
      ? ' <button class="el-btn" data-approve="'+bill.id+'" '+(canEdit?"":"disabled")+'>审批通过</button>' : "";
    return bill.id+" · "+bill.product+" · "+(complete?"已通过":"待审批")+action;
  });
  return dataset(canReviewAll() ? "全部审批单" : "我发起的审批单",rows,"暂无本人发起的审批单");
}
function renderErpDomain(domain, target, canEdit) {
  const products = productCatalog;
  const chosen = products.find(p=>p.id===target);
  const empty = "暂无符合条件的数据";
  if (domain === reviewDomains.approval) return approvalList(canEdit);
  if (domain === reviewDomains.diagnosis) {
    return dataset("用户信息",["样例账号 · 已注册"],empty)+dataset("手机 / 终端",["iOS · 本次查询终端"],empty)+
      dataset("App 端设备",["S9 Pro · 已识别设备"],empty)+dataset("已绑定 IoT 设备",["S9 Pro · 已绑定"],empty);
  }
  if (domain === reviewDomains.codes) {
    return dataset("标准语义与语言文案",["网络连接超时 · 请重新连接"],empty)+
      dataset("已有产品引用（样例）",["S9 Pro · 网络连接超时"],empty);
  }
  if (domain === reviewDomains.logs) {
    const download = $("#logDownloadAllowed").checked
      ? '<a id="downloadLog" download="app-client-demo.log" href="data:text/plain;charset=utf-8,Demo%20log%0AApp%20started%0AConnection%20complete%0A">下载整文件</a>'
      : '<button class="el-btn" disabled>无日志下载权限</button>';
    return dataset("测试数据中心 · 文件清单",["app-client.log · 手机诊断日志　"+download],empty);
  }
  if (target && !chosen) return stateBlock("暂无符合条件的数据","请重新选择业务产品。");
  if (domain === reviewDomains.templateLang || domain === reviewDomains.appLang)
    return dataset(domain.title, [domain === reviewDomains.templateLang ? "模板名称 · 智能吸奶器" : "通用操作 · 确认"],empty);
  if ([reviewDomains.production, reviewDomains.certificates].includes(domain)) {
    const rows = products.filter(p=>["P-10001","P-10002","P-10005"].includes(p.id) && (!target || p.id===target));
    return panel(businessPicker(target,products,true))+
      dataset(domain.title,rows.map(p=>p.name+" · 批次 B-"+p.id.slice(-3)),empty)+
      dataset("批次统计",[rows.length+" 个批次"],empty);
  }
  const product = chosen || products.find(p=>p.id==="P-10005");
  const picker = businessPicker(product.id,products);
  const disabled = canEdit ? "" : " disabled";
  if (domain === reviewDomains.redeem) {
    const codes = exampleCodes.filter(item=>item.productId === product.id);
    return panel(picker+' <button class="el-btn" id="domainAction" data-product="'+product.id+'"'+disabled+'>创建兑换码</button>')+
      dataset("兑换码列表",codes.map(row=>row.code),empty)+dataset("使用记录",codes.filter(row=>row.used).map(row=>row.code+" · 已兑换 "+row.used+" 次"),empty);
  }
  const relation = domain === reviewDomains.whitelist ? exampleRelations.whitelist : exampleRelations.audioCategory;
  const linked = products.filter(p=>relation.has(p.id));
  return dataset(domain === reviewDomains.whitelist ? "测试账号 · 已关联产品" : "睡眠音源 · 已授权产品",linked.map(p=>p.name),"暂无关联产品")+
    panel(picker+' <button class="el-btn" id="domainAction" data-product="'+product.id+'"'+disabled+'>'+(relation.has(product.id) ? "解除关联" : "关联产品")+'</button>')+
    panel('<a href="#/iot-product/detail/'+product.id+(domain === reviewDomains.whitelist ? '?step=0">查看产品详情' : '?step=5&subStep=audio">查看产品音源')+'</a>');
}
function dataset(title, rows, emptyText) {
  const body = rows.length ? "<ul>"+rows.map(row=>"<li>"+row+"</li>").join("")+"</ul>" : "<p>"+emptyText+"</p>";
  return panel("<h2>"+title+"</h2>"+body);
}
function renderDomain(domain, catalog, explicit) {
  const empty = catalog.length ? "暂无符合条件的数据" : "暂无已授权产品，请联系管理员授权。";
  const sample = catalog.filter(p=>["P-10001","P-10002","P-10004"].includes(p.id));
  switch (domain) {
    case reviewDomains.devices:
      return dataset("设备记录",catalog.filter(p=>["P-10002","P-10005"].includes(p.id)).map(p=>p.name+" · 已绑定"),empty);
    case reviewDomains.firmware: {
      const current = catalog.find(p=>p.id===(explicit || filter)) || catalog[0];
      const hasVersion = sample.includes(current);
      return panel('<label>当前产品 <select class="el-select" id="domainProduct" '+(catalog.length?"":"disabled")+'>'+
        (catalog.length ? catalog.map(p=>'<option value="'+p.id+'" '+(p===current?"selected":"")+'>'+p.name+'</option>').join(""):'<option>暂无可选产品</option>')+'</select></label>')+
        dataset("虚拟版本",hasVersion?[current.name+" · V1.0 · 2 个 MCU"]:[],empty)+
        dataset("已关联固件",hasVersion?[current.name+" · MCU "+(firmwareLinks[current.id] || "A")]:[],empty)+
        (hasVersion ? panel('<label>可选固件 <select id="firmwarePart" class="el-select">'+["A","B"].map(part=>
          '<option value="'+part+'" '+(part===(firmwareLinks[current.id] || "A") ? 'selected' : '')+'>'+current.name+' · MCU '+part+'</option>').join("")+
          '</select></label> <button id="saveFirmware" data-product="'+current.id+'" class="el-btn" '+($("#erpAccess").value==="edit"?"":"disabled")+'>保存关联</button>') : dataset("可选固件",[],empty));
    }
    case reviewDomains.productLang:
      return dataset("智能产品词条",catalog.map(p=>p.name+" · 产品名称"), empty);
  }
}
function showRoute() {
  const route = new URL(location.hash.slice(1) || "/permissions","https://prototype.invalid");
  const path = route.pathname;
  const redeemCreate = path.match(/^\/redemption-code-list\/([^/]+)\/add$/);
  const domain = redeemCreate ? reviewDomains.redeem : path === "/audio-category/demo" ? reviewDomains.audioCategory : Object.values(reviewDomains).find(item=>item.path === path);
  const canEdit = $("#erpAccess").value === "edit";
  $("#approvalRoleField").hidden = domain!==reviewDomains.approval;
  $("#downloadField").hidden = domain!==reviewDomains.logs;
  const business = path !== "/permissions";
  document.body.classList.toggle("business-mode",business);
  $("#governance").hidden = business;
  $("#business").hidden = !business;
  document.querySelectorAll("[data-route]").forEach(b=>b.classList.toggle("selected",b.dataset.route === path));
  $("#viewer").value = viewer.mail;
  $("#batchFailure").disabled = !isAdmin();
  if (!business) {
    $(".crumb").textContent = "系统管理 / 数据权限管理";
    $("#currentUser").textContent = isAdmin() ? "IoT 管理员" : "普通用户 · "+viewer.name;
    $("#pageTitle").textContent = isAdmin() ? "数据权限管理" : "数据权限管理访问受限";
    $("#pageSubtitle").textContent = isAdmin() ? "按产品配置用户与数据角色的可访问范围" : "当前账号缺少 ERP 管理功能权限";
    renderNotes($(".tab.active").dataset.tab);
    updateSelection();
    return;
  }
  $(".crumb").textContent = domain ? "IoT Admin / "+domain.title : (path === "/home" ? "概览" : "智能产品 / 产品访问");
  $("#currentUser").textContent = "业务访问 · "+viewer.name;
  $("#pageSubtitle").textContent = "当前 IoT 后台账号："+(viewer === emptyViewer ? viewer.name : viewer.mail);
  const effectiveNames = domain?.erpOnly ? null : new Set(scopeProducts(viewer));
  const catalog = effectiveNames ? productCatalog.filter(p=>effectiveNames.has(p.name)) : [];
  const explicit = route.searchParams.get("productId") ?? route.searchParams.get("pid") ?? route.searchParams.get("pId");
  const detail = path.startsWith("/iot-product/detail/");
  const shared = path === "/app/extension-manage/detail/shared-demo";
  const targets = [detail ? path.split("/")[3] : null,explicit].filter(id=>id!==null);
  const related = catalog.filter(p=>["P-10002","P-10005"].includes(p.id));
  const outsideScope = targets.some(id => !catalog.some(p => p.id === id));
  const outsideSharedScope = shared && (!related.length || targets.some(id => !related.some(p => p.id === id)));
  const denied = outsideScope || outsideSharedScope;
  let content;
  let context = "产品列表";
  if ($("#erpAccess").value === "none" || (redeemCreate && !canEdit)) {
    context = "功能权限不足";
    content = stateBlock(context,"请联系管理员确认此功能的页面或操作权限。");
  } else if (domain?.erpOnly) {
    context = domain.title;
    content = renderErpDomain(domain,redeemCreate?.[1] || explicit || filter,canEdit);
  } else if (scopeFailure) {
    context=path === "/home" ? "概览" : "权限读取失败";
    content=stateBlock("暂时无法读取产品权限","请重试以重新加载当前账号的权限。",'<button class="el-btn" id="retryScope">重试</button>');
    if (path === "/home") content = panel('<h2>用户统计</h2><p>注册用户 128 人</p>') + content;
  } else if (denied) {
    context="未授权页面";
    content=stateBlock("无权访问该产品","如需访问，请联系管理员授权。",returnButton);
  } else if (shared) {
    context="产品型共享面板";
    content=panel('<h2>共享控制面板</h2><p>可见关联产品</p><p>'+related.map(p=>p.name).join("、")+'</p><button class="el-btn" disabled>编辑公共属性</button> '+returnButton);
    if (related.length === 2) content=content.replace('<button class="el-btn" disabled>编辑公共属性</button>','<span class="tag success">具备全部关联产品范围</span>');
  } else if (detail || (targets.length && !domain)) {
    const product=catalog.find(p=>p.id===targets[0]);
    context=route.searchParams.get("subStep")==="audio" ? "产品音源" : "产品详情";
    content=panel('<h2>'+product.name+'</h2>'+(context==="产品音源" ? '<p>产品音源 · 睡眠音源</p><button id="productAudioAction" class="el-btn" '+(canEdit?'':'disabled')+'>'+(productAudioLinks.has(product.id)?'解绑音源':'绑定音源')+'</button>' : '')+'<dl class="detail-grid"><dt>产品 ID</dt><dd>'+product.id+'</dd></dl>'+returnButton);
  } else if (domain) {
    context=domain.title;
    content=renderDomain(domain,explicit && domain!==reviewDomains.firmware ? catalog.filter(p=>p.id===explicit) : catalog,explicit);
  } else if (path === "/home") {
    context="概览";
    const total = catalog.reduce((n,p)=>n+exampleDeviceCount(p),0);
    content=panel('<h2>用户统计</h2><p>注册用户 128 人</p>') + (catalog.length ?
      panel('<h2>设备统计</h2><p>绑定设备 '+total+' 台 · 覆盖 '+catalog.length+' 个授权产品</p>') :
      stateBlock("暂无已授权产品","请联系管理员授权，授权后可查看设备指标。"));
  } else {
    if (!catalog.some(p=>p.id===filter)) filter="";
    const filtered=catalog.filter(p=>(!filter || p.id===filter) && (p.name+" "+p.id).toLowerCase().includes(search.toLowerCase()));
    const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
    page=Math.min(page,pages);
    const rows=filtered.slice((page-1)*pageSize,page*pageSize);
    const option=(p)=>'<option value="'+p.id+'">'+p.name+' · '+p.id+'</option>';
    const create = canEdit && viewer.mail === users[2].mail ? '<button class="el-btn el-btn--primary" id="createSample">创建产品</button>' : '';
    content=panel('<div class="action-row">'+create+'<button class="el-btn" id="viewSelected" '+(filter?'':'disabled')+'>查看所选产品</button></div><div class="action-row"><label><span class="anchor-ref">2</span>产品 <select class="el-select" id="productFilter" '+(!catalog.length?"disabled":"")+'>'+ (catalog.length?'<option value="">全部已授权产品</option>':'<option value="">暂无已授权产品</option>')+catalog.map(option).join("")+'</select></label><input id="productKeyword" aria-label="搜索产品" class="el-input" placeholder="产品名称 / ID"><button class="el-btn" id="findProducts">查询</button><button class="el-btn" id="clearFilters">重置</button></div>'+
      (rows.length ? '<table class="el-table"><thead><tr><th>产品名称</th><th>产品 ID</th><th>绑定设备</th><th>操作</th></tr></thead><tbody>'+rows.map(p=>'<tr><td>'+p.name+'</td><td>'+p.id+'</td><td>'+exampleDeviceCount(p)+'</td><td><a href="#/iot-product/detail/'+p.id+'">查看</a></td></tr>').join("")+'</tbody></table>' :
      stateBlock(catalog.length?"暂无符合条件的数据":"暂无已授权产品",catalog.length?"调整查询条件后重试。":"请联系管理员授权。"))+
      '<div class="pager">共 '+filtered.length+' 条 · 第 '+page+' / '+pages+' 页 <button class="el-btn" id="prevPage" '+(page===1?"disabled":"")+'>上一页</button><button class="el-btn" id="nextPage" '+(page===pages?"disabled":"")+'>下一页</button></div>');
  }
  $("#pageTitle").textContent = context;
  $("#business").innerHTML = content;
  const bind = (id,fn)=>{const el=$(id);if(el)el.onclick=fn;};
  bind("#retryScope",()=>{scopeFailure=false;showRoute();});
  bind("#returnList",goList);
  bind("#productAudioAction",()=>{
    if (!canEdit || !catalog.some(p=>p.id===targets[0])) return;
    const id=targets[0];
    if (productAudioLinks.has(id)) productAudioLinks.delete(id); else productAudioLinks.add(id);
    saveExample();showRoute();
  });
  bind("#viewSelected",()=>navigate("/iot-product/detail/"+filter));
  bind("#createSample",()=>{
    if (viewer.mail !== users[2].mail) return;
    const serial=productCatalog.filter(p=>p.created).length+1;
    const item={name:"演示产品 "+serial,id:"DEMO-"+serial,created:true};
    productCatalog.push(item);
    viewer.direct.push(item.name);
    saveExample();renderRows();resetFilters();showRoute();
    toast("演示产品已创建，并已直授创建人");
  });
  if ($("#productFilter")) {
    $("#productFilter").value=filter;
    $("#productKeyword").value=search;
    $("#productFilter").onchange=e=>{filter=e.target.value;page=1;showRoute();};
    bind("#findProducts",()=>{search=$("#productKeyword").value.trim();page=1;showRoute();});
    $("#productKeyword").onkeydown=e=>{if(e.key==="Enter")$("#findProducts").click();};
    bind("#clearFilters",goList);
    bind("#prevPage",()=>{page--;showRoute();});
    bind("#nextPage",()=>{page++;showRoute();});
  }
  if ($("#domainProduct")) $("#domainProduct").onchange=e=>{
    filter=e.target.value;
    if (domain.erpOnly || domain===reviewDomains.firmware) navigate(domain.path+(filter ? "?productId="+encodeURIComponent(filter) : ""));
    else showRoute();
  };
  document.querySelectorAll("[data-approve]").forEach(button=>button.onclick=()=>{
    if (!canEdit || !canReviewAll() || approvedBills.has(button.dataset.approve)) return;
    approvedBills.add(button.dataset.approve);
    saveExample();showRoute();
  });
  bind("#saveFirmware",()=>{
    const id=$("#saveFirmware").dataset.product;
    const part=$("#firmwarePart").value;
    if (!canEdit || !catalog.some(p=>p.id===id) || !["A","B"].includes(part)) return;
    firmwareLinks[id]=part;
    saveExample();showRoute();toast("已保存当前产品的固件关联");
  });
  bind("#domainAction",()=>{
    if (!canEdit) return;
    const id=$("#domainAction").dataset.product;
    if (domain===reviewDomains.redeem) {
      exampleCodes.push({productId:id,code:"DEMO-"+String(exampleCodes.length+1).padStart(3,"0"),used:0});
    } else {
      const links=domain===reviewDomains.whitelist ? exampleRelations.whitelist : exampleRelations.audioCategory;
      if (links.has(id)) links.delete(id); else links.add(id);
    }
    saveExample();showRoute();
  });
  if (domain) {
    notes.domain = [[domain.title,domain.note],["演示数据","可切换业务访问身份及 ERP 动作权限，核对本页结果。"]];
    renderNotes("domain",context+" · 数据范围");
  } else renderNotes("business",context+" · 业务访问");
}
function exampleDeviceCount(product) { return 2*(1+productCatalog.indexOf(product)); }
notes.business=[
  ["产品候选与结果","受控域先取有效授权交集，再搜索、分页或统计。全部已授权产品包括直授与启用角色覆盖的产品。"],
  ["链接与共享关系","受控操作显式指定无权产品显示未授权页。只访问受控共享对象时，按授权交集返回公共配置及可见关系。"],
  ["零授权与加载错误","零授权保留功能入口和非产品区域。搜索无结果提示调整条件；权限服务故障可重试。"],
  ["演示范围","数据为本标签页样例。通过右侧切换访问身份，或用批量直授后查看结果。张静具备独立创建权限，可在零授权时创建演示产品并获得直授。"]
];
$("#viewer").replaceChildren(...viewers.map(u=>new Option(u.name,u.mail)));
for (const selector of ["#erpAccess","#approvalRole","#logDownloadAllowed"]) {
  $(selector).onchange = ()=>{saveExample();showRoute();};
}
$("#viewer").onchange = e=>{
  viewer=viewers.find(u=>u.mail===e.target.value);scopeFailure=false;resetFilters();saveExample();
  if (!location.hash || location.hash === "#/permissions") goList(); else showRoute();
};
$("#example").onchange = e=>{
  const value=e.target.value;
  if (!value) return;
  if (value === "governance") {scopeFailure=false;navigate("/permissions");e.target.value="";return;}
  scopeFailure=value==="error";resetFilters();
  if (value==="empty") viewer=scopeProducts(users[2]).length ? emptyViewer : users[2];
  if (["shared","shared-target","denied"].includes(value)) viewer=users[1];
  const target=productCatalog.find(p=>!scopeProducts(viewer).includes(p.name));
  const routes={products:"/iot-product",empty:"/iot-product",error:"/iot-product",mixed:"/home",productAudio:"/iot-product/detail/P-10005?step=5&subStep=audio",shared:"/app/extension-manage/detail/shared-demo","shared-target":"/app/extension-manage/detail/shared-demo?productId=P-10005",denied:"/iot-product/detail/"+(target?.id||"P-absent")};
  saveExample();navigate(reviewDomains[value]?.path || routes[value]);e.target.value="";
};
document.querySelectorAll(".scenario").forEach(b=>b.onclick=()=>{
  applyScenario(b.dataset.scenario);scopeFailure=false;selectedAccounts.clear();resetFilters();saveExample();navigate("/permissions");
});
$("#confirm").addEventListener("click",saveExample);
window.addEventListener("hashchange",()=>{if($("#drawer").classList.contains("open"))closeDrawer();showRoute();});
restoreExample();renderRows();renderRoleRows();updateSelection();showRoute();
