import { $, $$, escapeHtml } from './dom.js';
import { state, apps, set, tagType } from './state.js';

const screen = $('#screen');
const anno = $('#annotation-body');
const modalRoot = $('#modal-root');
const toast = $('#toast');

const tag = (s) => `<span class="el-tag el-tag--${tagType(s)} is-plain">${escapeHtml(s)}</span>`;
const anchor = (n, id) => `<button class="anchor" type="button" data-anchor="${id}" aria-label="查看批注 ${n}">${n}</button>`;

const supportedPages = new Set(['product-list', 'approvals', 'settings', 'changes']);
const navGroup = (title, items, active) => `<div class="menu-title">${title}</div>${items.map(([key, label]) => { const clickable = supportedPages.has(key); const selected = key === 'product-list' ? (active === 'product' || active === 'product-list') : active === key; return `<button class="menu-item ${selected ? 'active' : ''}" ${clickable ? `data-page="${key}"` : 'data-toast="该页面不在本次原型范围内"'}><span class="nav-icon">${key === 'product-list' ? '▦' : key === 'approvals' ? '✓' : key === 'settings' ? '⚙' : key === 'changes' ? '↺' : '•'}</span>${label}</button>`; }).join('')}`;

function layout(content, active) {
  const detail = active === 'product';
  const crumb = detail
    ? `<button class="back-icon" data-page="product-list" aria-label="返回产品列表">‹</button><div><b>智能产品</b><small>查看产品详情　/　产品列表　/　智能产品</small></div>`
    : active === 'product-list'
      ? `<div><b>智能产品</b><small>产品列表　/　智能产品</small></div>`
      : active === 'settings'
        ? `<div><b>配置中心</b><small>变更审批配置</small></div>`
        : active === 'approvals'
          ? `<div><b>审批管理</b><small>审批中心　/　待处理</small></div>`
          : `<div><b>我的变更</b><small>智能产品　/　我的变更</small></div>`;
  return `<div class="app">
    <aside class="aside">
      <div class="brand"><div class="brand-wordmark"><span>路特创新</span><b>AIoT</b> Platform</div></div>
      <nav class="menu">
        <button class="menu-item menu-overview"><span class="nav-icon">◉</span>概览</button>
        ${navGroup('智能产品', [['product-list', '产品列表'], ['message-push', '消息推送']], active)}
        ${navGroup('设备管理', [['device-list', '设备列表'], ['firmware', '固件管理'], ['ota', 'OTA']], active)}
        ${navGroup('App', [['app-list', 'App列表'], ['app-upgrade', 'App升级'], ['extension', '扩展程序管理'], ['whitelist', '白名单管理'], ['whitelist-label', '白名单标签组管理']], active)}
        ${navGroup('配置中心', [['model-pool', '物模型池'], ['product-template', '产品模板'], ['category', '产品分类'], ['i18n', '后台多语言'], ['approvals', '审批管理'], ['changes', '我的变更'], ['settings', '变更审批配置']], active)}
        ${navGroup('生产管理', [['certificate', '生产凭证'], ['production-record', '生产记录']], active)}
      </nav>
      <div class="aside-footer">☰</div>
    </aside>
    <section class="shell-main">
      <header class="topbar"><div class="crumb">${crumb}</div><div class="top-actions"><span class="top-icon">?</span><span class="top-icon">●</span><span class="avatar">陈</span></div></header>
      <main class="content">${content}</main>
    </section>
  </div>`;
}

const productMeta = `<div class="product-meta"><span>产品分类：Breast Pump</span><i></i><span>产品型号：W1Lite</span><i></i><span>产品代码：--</span><i></i><span>产品ID：2075767415740338177</span><i></i><span>产品模板ID：1907328212561108993</span></div>`;

function productList() {
  const rows = [
    ['Breast Pump', 'W1 Lite', 'W1Lite', 'W1L-NA', '2075767415740338177', '--', '弱绑定', '直连设备', '已上架', '版本1 - 已发布', 'ROOT云', 'momcozy', 'BLE', '2026-07-20'],
    ['Sound Machine', 'DreamSync Tech', 'WN05', '--', '7dirq5hqba22fw5y', '--', '弱绑定', '直连设备', '已上架', '版本1 - 已发布', '涂鸦云', 'momcozy', 'WIFI+BLE', '2024-11-20'],
    ['Baby monitor', 'BM04', 'BM04', '--', 'mzohju3minbjogwz', '--', '强绑定', '直连设备', '已上架', '版本1 - 已发布', '涂鸦云', 'momcozy', 'WIFI', '2024-06-18'],
    ['Breast Pump', 'Grand Flow', 'G100', '--', '1773196524151373826', '--', '弱绑定', '直连设备', '开发中', '版本1 - 迭代中', 'ROOT云', 'momcozy', 'BLE', '2024-03-28']
  ];
  return layout(`<div class="list-head"><div><h1>智能产品</h1></div><button class="el-btn el-btn--primary">＋ 创建产品</button></div>
    <section class="filterbar product-filter"><select class="el-select"><option>产品分类</option><option>Breast Pump</option><option>Sound Machine</option></select><select class="el-select"><option>所属 APP</option><option>momcozy</option></select><select class="el-select"><option>所属平台</option><option>ROOT云</option><option>涂鸦云</option></select><select class="el-select"><option>通讯方式</option><option>BLE</option><option>WIFI+BLE</option></select><input class="el-input" placeholder="输入产品ID..."/><button class="el-btn el-btn--primary" data-toast="已按筛选条件查询">查询</button><button class="el-btn" data-toast="筛选已重置">重置</button></section>
    <div class="table-scroll"><table class="el-table product-table"><thead><tr><th>产品分类</th><th>产品名称</th><th>产品型号</th><th>客服型号</th><th>产品ID</th><th>产品代码</th><th>绑定类型</th><th>设备类型</th><th>产品图片</th><th>产品状态</th><th>功能版本/状态</th><th>所属平台</th><th>所属App</th><th>通讯方式</th><th>创建时间</th><th class="col-ops">操作</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${r[0]}</td><td><button class="op-link" data-page="product">${r[1]}</button></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td><td>${r[7]}</td><td><span class="image-thumb">${i === 0 ? '◌' : '▧'}</span></td><td>${tag(r[8])}</td><td>${r[9].replace(' - ', ' · ')}</td><td>${r[10]}</td><td>${r[11]}</td><td>${r[12]}</td><td>${r[13]}</td><td class="col-ops"><button class="op-link">复制</button><span class="op-divider">|</span><button class="op-link" data-page="product">查看</button></td></tr>`).join('')}</tbody></table></div><div class="pagination">共 25 条　<span class="page-current">1</span>　2　3　›　<select class="page-size"><option>10条/页</option></select></div>`, 'product-list');
}

const infoField = (label, value, cls = '') => `<div class="info-field ${cls}"><label>${label}</label><span>${value}</span></div>`;

function product() {
  const locked = state.activeProductLock;
  const activeApp = apps.find((x) => x.id === state.activeApplication) || apps[0];
  return layout(`<section class="product-hero"><div class="product-identity"><span class="product-image-large">W1</span><div><h1>W1 Lite ${tag('ROOT云')} ${tag('已上架')}</h1>${productMeta}<p class="function-version">功能版本：<b>版本1 - 已发布</b>⌄</p></div></div><div class="product-actions"><div class="prototype-demo"><span>演示状态</span><select class="el-select" data-demo><option value="lock" ${state.demoMode === 'lock' ? 'selected' : ''}>有活动申请</option><option value="free" ${state.demoMode === 'free' ? 'selected' : ''}>无活动申请</option></select></div><button class="el-btn el-btn--danger ${locked ? 'is-disabled' : ''}" ${locked ? 'disabled' : ''} data-submit-action="下架">下架产品</button></div></section>
    <nav class="step-tabs" aria-label="产品详情页签"><button class="step-tab active">✓ 基础信息</button><button class="step-tab" data-toast="功能设计页签沿用现有产品详情">✓ 功能设计</button><button class="step-tab" data-toast="扩展程序页签沿用现有产品详情">✓ 扩展程序</button><button class="step-tab" data-toast="设备调试页签沿用现有产品详情">✓ 设备调试</button><button class="step-tab" data-toast="配网引导页签沿用现有产品详情">✓ 配网引导</button><button class="step-tab" data-toast="高级配置页签沿用现有产品详情">✓ 高级配置</button></nav>
    ${locked ? `<div class="lock-banner" id="lock-banner"><div><b>该产品已有冻结变更申请</b>${anchor(1, 'lock-banner')}<p>活动申请 <a href="#" data-open-app="${activeApp.id}">${activeApp.id} · ${escapeHtml(activeApp.action)} / ${escapeHtml(activeApp.status)}</a>。可继续保存草稿，但详情变更、上架、下架均不能再次提交或冻结。</p></div><button class="el-btn" data-open-app="${activeApp.id}">查看申请</button></div>` : ''}
    <section class="product-panel" id="base-info"><div class="panel-head"><h2>产品信息 ${anchor(2, 'base-info')}</h2><div class="button-row"><button class="el-btn" data-action="new-version">新建功能版本</button><button class="el-btn" data-drawer="product-edit">编辑产品信息</button></div></div><div class="info-grid">${infoField('产品ID', '2075767415740338177')}${infoField('产品名称', 'W1 Lite')}${infoField('创建用户', '陈晓 chen.xiao@example.com')}${infoField('创建时间', '2026-07-20 10:18:07')}${infoField('支持频段', '--')}${infoField('编辑用户', '陈晓 chen.xiao@example.com')}${infoField('产品类型', 'Breast Pump')}${infoField('产品状态', tag('已上架'))}${infoField('流程配网路由方式', '原子化')}${infoField('产品型号', 'W1Lite')}${infoField('客服型号', 'W1L-NA')}${infoField('绑定方式', '弱绑定')}${infoField('产品代码', '--')}${infoField('所属App', 'momcozy')}${infoField('所属平台', tag('ROOT云'))}${infoField('通讯方式', 'BLE')}${infoField('配网方式', '蓝牙配网')}${infoField('配网交互方式', 'CONNECT_F0（配网过程仅需发送一个指令）')}${infoField('原子化配网', tag('支持'))}${infoField('设备是否可以编组', tag('支持'))}${infoField('产品共享', tag('开启'))}${infoField('最近编辑时间', '2026-07-20 10:20:42')}<div class="info-field image-field"><label>产品图片</label><span><span class="product-thumb">主图</span><span class="product-thumb">列表图</span></span></div></div><div class="test-whitelist"><h3>测试白名单</h3><p>*仅白名单用户可在未上架的功能版本中添加设备以及体验最新的功能，当功能版本发布后，所有配置项将生效</p><span>ⓘ 可见用户：<button class="op-link">全部白名单用户</button>　<button class="op-link">✎</button></span></div></section>
    <section class="draft-panel" id="draft"><div class="panel-head"><h2>变更草稿与提交 ${anchor(3, 'draft')}</h2><span class="el-tag el-tag--info is-plain">草稿 D-028 · 未冻结</span></div><table class="diff-table"><thead><tr><th>字段</th><th>线上正式版本 v12</th><th>草稿目标值</th><th>影响</th></tr></thead><tbody><tr><td>产品名称</td><td>W1 Lite</td><td>W1 Lite Plus</td><td>App 展示名称</td></tr><tr><td>客服型号</td><td>W1L-NA</td><td>W1LP-NA</td><td>客服识别</td></tr><tr><td>发布区域</td><td>北美</td><td>北美、欧洲</td><td>区域可见性</td></tr></tbody></table><div class="draft-actions"><span class="muted">保存草稿不会改变线上正式配置；提交时才冻结快照。</span><button class="el-btn" data-toast="草稿已保存，线上正式配置未变更">保存草稿</button><button class="el-btn el-btn--primary ${locked ? 'is-disabled' : ''}" ${locked ? 'disabled' : ''} data-submit-action="详情变更">提交变更</button></div></section>`, 'product');
}

function approvals() {
  const rows = apps.filter((x) => x.status === '等待外部测试');
  return layout(`<div class="page-title"><div><h1>审批管理 ${anchor(1, 'approval-table')}</h1><p>仅显示当前审批人授权范围内的申请；“等待外部测试”不等于测试通过。</p></div></div><section class="filterbar"><input class="el-input" placeholder="产品名称 / 申请号"/><select class="el-select"><option>全部动作</option><option>详情变更</option><option>上架</option><option>下架</option></select><button class="el-btn el-btn--primary" data-toast="已按筛选条件查询">查询</button><button class="el-btn" data-toast="筛选已重置">重置</button></section><div class="tabs"><button class="tab active">待处理 <span class="badge">${rows.length}</span></button><button class="tab" data-page="changes">历史审批</button></div><div class="table-scroll"><table class="el-table" id="approval-table"><thead><tr><th>申请号</th><th>产品</th><th>动作</th><th>状态</th><th>提交人</th><th>提交时间</th><th class="col-ops">操作</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${x.id}</td><td>${x.product}</td><td>${x.action}</td><td>${tag(x.status)}</td><td>${x.applicant}</td><td>${x.submitted}</td><td class="col-ops"><button class="op-link" data-open-app="${x.id}">查看审批</button></td></tr>`).join('')}</tbody></table></div><div class="pagination">共 ${rows.length} 条　10 条/页　‹　<span class="page-current">1</span>　›</div>`, 'approvals');
}

function changes() {
  return layout(`<div class="page-title"><div><h1>我的变更 ${anchor(1, 'change-table')}</h1><p>查看本人草稿及审批结果。审批完成或驳回后释放产品活动锁。</p></div><button class="el-btn" data-page="product">返回产品详情</button></div><div class="table-scroll"><table class="el-table" id="change-table"><thead><tr><th>申请号</th><th>产品</th><th>动作</th><th>状态</th><th>提交时间</th><th>当前锁</th><th>操作</th></tr></thead><tbody>${apps.map((x) => `<tr><td>${x.id}</td><td>${x.product}</td><td>${x.action}</td><td>${tag(x.status)}</td><td>${x.submitted}</td><td>${x.lock ? '<span class="lock-dot">持有</span>' : '已释放'}</td><td><button class="op-link" data-open-app="${x.id}">查看</button>${x.status === '已驳回' ? '<span class="op-divider">|</span><button class="op-link" data-toast="已基于最新正式版本创建草稿">重新编辑</button>' : ''}</td></tr>`).join('')}</tbody></table></div>`, 'changes');
}

function settings() {
  return layout(`<div class="page-title"><div><h1>变更审批配置 ${anchor(1, 'config-table')}</h1><p>配置中心页面访问由 ERP 菜单权限控制；审批人仅维护姓名与企业邮箱。</p></div><button class="el-btn el-btn--primary" data-drawer="config">编辑配置</button></div><div class="notice-box"><b>权限说明</b><p>ERP 仅控制审批管理和配置入口。测试工程师邮箱与审批人邮箱均为手工输入/配置，不做 ERP 账号映射。</p></div><section class="product-panel settings-panel"><div class="panel-head"><h2>按动作指定审批人</h2></div><div class="table-scroll"><table class="el-table" id="config-table"><thead><tr><th>动作</th><th>审批人姓名</th><th>审批人企业邮箱</th><th>启用状态</th></tr></thead><tbody><tr><td>产品详情变更</td><td>李娜</td><td>li.na@example.com</td><td>${tag('已启用')}</td></tr><tr><td>上架</td><td>李娜</td><td>li.na@example.com</td><td>${tag('已启用')}</td></tr><tr><td>下架</td><td>李娜</td><td>li.na@example.com</td><td>${tag('已启用')}</td></tr></tbody></table></div></section><section class="product-panel settings-panel"><div class="panel-head"><h2>通知渠道</h2></div><div class="info-grid two">${infoField('审批人企业邮箱', '启用；每次申请必须投递')}${infoField('飞书机器人', '可选提醒；密钥由技术侧托管')}${infoField('测试工程师邮箱', '提交变更时手工输入')}${infoField('模板链接', '测试快照只读页 / 审批详情页')}</div></section>`, 'settings');
}

function detail(app) {
  const canApprove = app.id === 'A-001';
  return layout(`<div class="page-title"><div><h1>审批详情 ${app.id} ${tag(app.status)}</h1><p>冻结快照 v13 · 提交人：陈晓 · 测试邮箱：qa.liu@example.com · 冻结审批人：李娜（li.na@example.com）</p></div><button class="el-btn" data-page="approvals">返回审批管理</button></div><div class="detail-grid"><div><section class="product-panel" id="snapshot"><div class="panel-head"><h2>冻结快照与变更差异 ${anchor(1, 'snapshot')}</h2><span class="el-tag el-tag--info is-plain">不可修改</span></div><div class="info-grid two">${infoField('产品', 'W1 Lite')}${infoField('基线正式版本', 'v12')}${infoField('冻结快照版本', 'v13')}${infoField('申请动作', app.action)}</div><table class="diff-table"><thead><tr><th>字段</th><th>v12</th><th>v13 目标值</th></tr></thead><tbody><tr><td>产品名称</td><td class="before">W1 Lite</td><td class="after">W1 Lite Plus</td></tr><tr><td>发布区域</td><td class="before">北美</td><td class="after">北美、欧洲</td></tr></tbody></table></section>${approvalPanel(canApprove)}<section class="timeline"><h2>操作记录</h2><div class="timeline-item"><b>快照已冻结</b><small>2026-07-31 10:18 · 陈晓 · D-028 → v13</small></div><div class="timeline-item"><b>通知投递已发起</b><small>2026-07-31 10:19 · 测试邮箱、审批邮箱、飞书机器人</small></div><div class="timeline-item"><b>等待外部测试结论</b><small>测试操作、结果传达在系统外部</small></div></section></div><aside><section class="notice-box" id="notifications"><h2>通知投递 ${anchor(2, 'notifications')}</h2>${state.notifications.map((n, i) => `<div class="notice-line"><div><b>${n.name}</b><small>${n.target}<br>${n.copy}</small></div><div>${tag(n.status)}${n.status === '失败待重试' ? `<button class="op-link retry" data-retry="${i}">重试</button>` : ''}</div></div>`).join('')}<p class="muted">已受理仅表示渠道接受投递，不代表已读或测试通过。</p><button class="el-btn el-btn--small" data-test-link>预览测试快照只读页</button></section></aside></div>`, 'approvals');
}

function approvalPanel(canApprove) {
  const ready = state.testConfirmed && state.evidence.trim();
  return `<section class="confirm-card" id="approval-action"><h2>外部测试确认与审批 ${anchor(3, 'approval-action')}</h2><p>测试工程师在系统外完成测试并通知审批人。平台仅要求审批人确认结论及依据。</p><label class="checkline"><input type="checkbox" data-confirm-test ${state.testConfirmed ? 'checked' : ''}>我已核验当前冻结快照的外部测试通过结论</label><label class="field">外部测试依据引用（必填）<input class="el-input" data-evidence value="${escapeHtml(state.evidence)}" placeholder="邮件主题、报告链接或编号"></label><label class="field">审批意见（可选）<textarea class="el-input textarea" placeholder="请输入审批意见"></textarea></label><div class="button-row"><button class="el-btn el-btn--danger" data-reject>驳回并撤销</button><button class="el-btn el-btn--primary ${ready && canApprove ? '' : 'is-disabled'}" ${ready && canApprove ? '' : 'disabled'} data-approve>通过并应用</button></div>${!ready ? '<p class="muted">完成勾选并填写依据后，才可通过并应用。</p>' : ''}</section>`;
}

function testSnapshot() {
  return `<div class="test-page"><div class="test-head"><b>LuteOS · 测试快照</b><span class="el-tag el-tag--warning is-plain">链接 7 天有效</span></div><h2>W1 Lite · 冻结快照 v13</h2><p>该页面由邮件中的限时链接打开，无需 ERP 登录。仅供指定测试协作查看，不能审批或下载敏感附件。</p><div class="test-warning">测试完成后，请在系统外部将结果通知审批人：李娜（li.na@example.com）。</div><table class="diff-table" id="snapshot"><thead><tr><th>字段</th><th>变更前</th><th>冻结目标</th></tr></thead><tbody><tr><td>产品名称</td><td>W1 Lite</td><td>W1 Lite Plus</td></tr><tr><td>发布区域</td><td>北美</td><td>北美、欧洲</td></tr></tbody></table><button class="el-btn" data-close-test>关闭预览</button></div>`;
}

function renderAnnotations(kind) {
  const sets = {
    'product-list': [{ n: 1, t: '现状列表模板', loc: '智能产品 > 产品列表 > 筛选与表格', body: '沿用现有产品列表的筛选项、宽表字段、状态 Tag、复制/查看操作和分页。' }],
    product: [{ n: 1, t: '活动变更锁', loc: '产品详情 > 页签下方提示', body: '同一产品的详情变更、上架、下架共享一把锁。锁存在时仍可保存草稿，但提交按钮和状态动作禁用。' }, { n: 2, t: '线上正式信息', loc: '产品详情 > 产品信息', body: '字段、三列布局、产品图片和测试白名单贴合 IoT Admin 现状；审批前线上正式信息不变。' }, { n: 3, t: '提交与冻结', loc: '产品详情 > 变更草稿与提交', body: '提交时原子获取产品锁，冻结前后差异、测试邮箱、审批人及通知模板。邮箱为手工输入，不映射 ERP。' }],
    approvals: [{ n: 1, t: '审批待办范围', loc: '审批管理 > 待处理表格', body: '使用现有 ERP 菜单权限控制入口；列表采用现有筛选、表格、状态 Tag 和分页模板。' }],
    detail: [{ n: 1, t: '冻结快照与差异', loc: '审批详情 > 冻结快照', body: '审批人只能查看冻结版本，比较基线正式版本与目标值，避免审批中读取可变草稿。' }, { n: 2, t: '通知投递', loc: '审批详情 > 通知投递', body: '状态为待发送、发送中、已受理、失败待重试、重试耗尽；渠道已受理不等于已读或测试通过。' }, { n: 3, t: '审批前置确认', loc: '审批详情 > 外部测试确认与审批', body: '审批人必须勾选已核验外部测试通过，并填写邮件主题、报告链接或编号。' }],
    approve: [{ n: 4, t: '核对信息弹窗', loc: '审批详情 > 通过并应用 > 核对信息弹窗', body: '点击“通过并应用”直接弹窗核对当前申请，不新建额外审批单据，也不跳转独立状态页。' }, { n: 5, t: '确认应用', loc: '核对信息弹窗 > 确认应用', body: '确认后沿用当前 applicationId 按冻结快照应用，当前申请直接反馈已生效或应用失败。' }],
    test: [{ n: 1, t: '限时只读测试快照', loc: '测试快照 > 冻结差异', body: '邮件链接固定 7 个自然日有效；不要求 ERP 登录，不提供审批或敏感附件下载。' }],
    settings: [{ n: 1, t: '按动作配置审批人', loc: '配置中心 > 变更审批配置', body: '每个租户按详情变更、上架、下架配置一名审批人；仅保存姓名、企业邮箱、启用状态，提交时冻结配置。' }],
    changes: [{ n: 1, t: '我的变更与锁状态', loc: '我的变更 > 表格', body: '已生效、已驳回和应用失败（未生效）均为终态并释放产品锁。' }]
  };
  const cards = sets[kind] || sets.approvals;
  anno.innerHTML = `<p class="annotation-intro">点击批注卡或黄色编号，可定位并高亮左侧对应区域。页面结构与字段已按 IoT Admin Wiki 现状恢复。</p>${cards.map((x) => `<button class="anno" data-anchor="${x.loc.includes('页签下方') ? 'lock-banner' : x.loc.includes('产品信息') ? 'base-info' : x.loc.includes('草稿') ? 'draft' : x.loc.includes('待处理') ? 'approval-table' : x.loc.includes('通知') ? 'notifications' : x.loc.includes('前置') ? 'approval-action' : x.loc.includes('确认应用') ? 'approve-confirm-button' : x.loc.includes('核对信息') ? 'approval-modal' : x.loc.includes('列表') ? 'product-table' : x.loc.includes('配置') ? 'config-table' : x.loc.includes('我的变更') ? 'change-table' : 'snapshot'}"><h3><span class="anno-n">${x.n}</span>${x.t}</h3><p><b>关联位置：</b>${x.loc}</p><p><b>说明 / 交互：</b>${x.body}</p></button>`).join('')}<div class="assumption"><b>原型假设</b><p>演示仅模拟页面状态，不发送真实邮件或飞书消息。测试链接令牌、安全签名与机器人密钥由技术侧实现。</p></div>`;
  bindAnnotationAnchors();
}

function modal(html) { modalRoot.innerHTML = `<div class="modal-mask"><section class="modal">${html}</section></div>`; }
function drawer(html) { modalRoot.innerHTML = `<div class="drawer-mask"><section class="drawer">${html}</section></div>`; }
function closeOverlay() { modalRoot.innerHTML = ''; renderAnnotations(state.page); }
function showToast(msg, good = true) { toast.textContent = msg; toast.style.background = good ? '#67c23a' : '#f56c6c'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }

function openSubmit(action = state.pendingAction || '详情变更') {
  set({ pendingAction: action });
  const target = action === '详情变更' ? '冻结草稿 D-028 为快照 v13，线上正式版本 v12 不会立即变化' : `提交“${action}”申请；审批通过后才会改变产品线上状态`;
  modal(`<h3>提交${escapeHtml(action)}并冻结快照</h3><div class="modal-body"><div class="submit-summary">${target}</div><label class="field">指定测试工程师邮箱<span class="required"> *</span><input class="el-input" id="tester-email" value="${escapeHtml(state.testerEmail)}" placeholder="例如 qa.liu@example.com"><span class="form-help">仅支持手工输入；不映射 ERP 账号。</span><span class="error" id="email-error"></span></label><div class="frozen-box"><b>将被冻结的审批与通知配置</b><p>审批人：李娜（li.na@example.com）</p><p>动作：${escapeHtml(action)}；渠道：测试企业邮箱、审批人企业邮箱、飞书机器人（可选）</p></div></div><div class="modal-foot"><button class="el-btn" data-close-modal>取消</button><button class="el-btn el-btn--primary" data-confirm-submit>确认提交</button></div>`);
}

function openReject() { modal(`<h3>驳回并撤销变更</h3><div class="modal-body"><p>驳回后冻结快照不会应用，线上正式配置保持不变；产品活动锁将释放。</p><label class="field">驳回原因<span class="required"> *</span><textarea class="el-input textarea" id="reject-reason" placeholder="请填写驳回原因"></textarea><span class="error" id="reject-error"></span></label></div><div class="modal-foot"><button class="el-btn" data-close-modal>取消</button><button class="el-btn el-btn--danger" data-confirm-reject>确认驳回</button></div>`); }

function openApprove() {
  const app = apps.find((x) => x.id === state.activeApplication) || apps[0];
  modal(`<h3 id="approval-modal">核对信息 ${anchor(4, 'approval-modal')}</h3><div class="modal-body"><div class="approval-check-grid"><div class="check-item"><label>申请号</label><strong>${escapeHtml(app.id)}</strong></div><div class="check-item"><label>动作</label><strong>${escapeHtml(app.action)}</strong></div><div class="check-item"><label>产品</label><strong>${escapeHtml(app.product)} / 2075767415740338177</strong></div><div class="check-item"><label>审批人</label><strong>李娜（li.na@example.com）</strong></div><div class="check-item"><label>基线正式版本</label><strong>v12</strong></div><div class="check-item"><label>冻结快照</label><strong>v13（不可修改）</strong></div><div class="check-item check-item--wide"><label>目标变更</label><strong>产品名称：W1 Lite → W1 Lite Plus；发布区域：北美 → 北美、欧洲</strong></div><div class="check-item check-item--wide"><label>外部测试依据</label><strong>${escapeHtml(state.evidence)}</strong></div></div><div class="warning-box">确认后将沿用当前申请 ${escapeHtml(app.id)} 按冻结快照更新线上配置，不会新建额外审批单据。系统将在当前申请内完成应用并直接反馈生效或失败结果。</div></div><div class="modal-foot"><button class="el-btn" data-close-modal>返回修改</button><button class="el-btn el-btn--primary" id="approve-confirm-button" data-confirm-approve>确认应用</button>${anchor(5, 'approve-confirm-button')}</div>`);
  renderAnnotations('approve');
}

function openVersion() { modal(`<h3>新建功能版本</h3><div class="modal-body"><p>将基于当前已发布版本创建新的功能版本草稿。版本创建后仍需走产品变更审批。</p><label class="field">版本说明（可选）<textarea class="el-input textarea" placeholder="请输入版本说明"></textarea></label></div><div class="modal-foot"><button class="el-btn" data-close-modal>取消</button><button class="el-btn el-btn--primary" data-toast="功能版本草稿已创建">确定</button></div>`); }

function openProductEdit() {
  drawer(`<div class="drawer-head"><h3>编辑产品信息</h3><button class="icon-btn" data-close-drawer aria-label="关闭">×</button></div><div class="drawer-body"><div class="drawer-form"><div class="drawer-readonly"><label>产品分类</label><span>Breast Pump / 1</span></div><label class="drawer-field required-field">所属平台<span class="radio-row"><label><input type="radio" checked name="platform"> ROOT云</label><label><input type="radio" name="platform"> 涂鸦云</label><label><input type="radio" name="platform"> 觅睿云</label></span></label><label class="drawer-field">产品ID<input class="el-input" value="2075767415740338177" disabled></label><label class="drawer-field">产品模板<input class="el-input" value="根据通讯方式后自动选择" disabled></label><label class="drawer-field required-field">流程配网路由方式<select class="el-select"><option>原子化</option><option>RN1 - LTPairAddPage</option></select></label><label class="drawer-field">配网交互方式<input class="el-input" value="CONNECT_F0（配网过程仅需发送一个指令）" disabled></label><label class="drawer-field required-field">通讯方式<select class="el-select" disabled><option>BLE</option></select><small>产品创建后不可修改通讯方式</small></label><label class="drawer-field required-field">配网方式<select class="el-select"><option>蓝牙配网</option><option>AP配网</option><option>SmartConfig配网</option></select></label><label class="drawer-field required-field">原子化配网<span class="radio-row"><label><input type="radio" name="atom" checked> 支持</label><label><input type="radio" name="atom"> 不支持</label></span></label><label class="drawer-field">动态配网最低支持版本<input class="el-input" placeholder="请输入最低支持版本"></label><hr><label class="drawer-field required-field">发布区域<span class="check-row"><label><input type="checkbox" checked> 北美</label><label><input type="checkbox" checked> 欧洲</label><label><input type="checkbox"> 亚太</label><label><input type="checkbox"> 中国</label></span></label><label class="drawer-field required-field">设备是否可以编组<span class="radio-row"><label><input type="radio" name="group" checked> 支持</label><label><input type="radio" name="group"> 不支持</label></span></label><label class="drawer-field required-field">绑定类型<span class="radio-row"><label><input type="radio" name="binding"> 强绑定</label><label><input type="radio" name="binding" checked> 弱绑定</label></span></label><label class="drawer-field required-field">产品共享<span class="radio-row"><label><input type="radio" name="share" checked> 开启</label><label><input type="radio" name="share"> 关闭</label></span></label><label class="drawer-field required-field">设备类型<span class="radio-row"><label><input type="radio" name="device" checked> 直连设备</label><label><input type="radio" name="device"> 网关设备</label></span></label><label class="drawer-field required-field">产品型号<input class="el-input" value="W1Lite" disabled><small>产品上架后不可修改</small></label><label class="drawer-field required-field">产品名称<input class="el-input" value="W1 Lite"></label><label class="drawer-field">产品代码<div class="input-action"><input class="el-input" placeholder="请选择产品代码"><button class="el-btn">⌕</button></div></label><label class="drawer-field">客服型号<input class="el-input" value="W1L-NA"></label><label class="drawer-field required-field">所属App<select class="el-select"><option>momcozy</option></select></label><label class="drawer-field required-field">产品图片<div class="upload-row"><span class="upload-box">＋<small>产品主图</small></span><span class="upload-box"><small>列表图</small></span><span class="upload-box"><small>详情图</small></span></div><small>主图/列表图推荐 108*108，详情图推荐 600*600；均不可大于5M，支持 png、jpg、jpeg 格式</small></label></div></div><div class="drawer-foot"><button class="el-btn" data-close-drawer>取消</button><button class="el-btn" data-save-draft>保存草稿</button><button class="el-btn el-btn--primary" data-submit-action="详情变更">提交变更并冻结</button></div>`);
}

function openConfig() {
  drawer(`<div class="drawer-head"><h3>编辑变更审批配置</h3><button class="icon-btn" data-close-drawer aria-label="关闭">×</button></div><div class="drawer-body"><p class="muted">ERP 仅控制本页面访问；审批人配置不做 ERP 账号映射。</p><label class="drawer-field required-field">审批人姓名<input class="el-input" value="李娜"></label><label class="drawer-field required-field">审批人企业邮箱<input class="el-input" value="li.na@example.com"></label><label class="drawer-field required-field">配置动作<span class="check-row vertical"><label><input type="checkbox" checked disabled> 产品详情变更</label><label><input type="checkbox" checked disabled> 上架</label><label><input type="checkbox" checked disabled> 下架</label></span></label><label class="drawer-field"><span class="checkline"><input type="checkbox" checked>启用飞书机器人提醒（可选）</span></label><p class="muted">保存后只影响后续提交；已冻结申请继续使用原配置。</p></div><div class="drawer-foot"><button class="el-btn" data-close-drawer>取消</button><button class="el-btn el-btn--primary" data-save-config>保存</button></div>`);
}

function render() {
  let html;
  if (state.page === 'product-list') html = productList();
  else if (state.page === 'product') html = product();
  else if (state.page === 'approvals') html = approvals();
  else if (state.page === 'changes') html = changes();
  else if (state.page === 'settings') html = settings();
  else html = detail(apps.find((x) => x.id === state.activeApplication) || apps[0]);
  screen.innerHTML = html;
  renderAnnotations(state.page);
  bind();
}

function bind() {
  $$('[data-page]').forEach((b) => b.addEventListener('click', () => set({ page: b.dataset.page })));
  $$('[data-open-app]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); set({ page: 'detail', activeApplication: b.dataset.openApp }); }));
  $$('[data-toast]').forEach((b) => b.addEventListener('click', () => showToast(b.dataset.toast)));
  $('[data-demo]')?.addEventListener('change', (e) => { const mode = e.target.value; set({ demoMode: mode, activeProductLock: mode !== 'free', activeApplication: 'A-001' }); });
  $$('[data-submit-action]').forEach((b) => b.addEventListener('click', () => openSubmit(b.dataset.submitAction)));
  $('[data-action="new-version"]')?.addEventListener('click', openVersion);
  $('[data-drawer="product-edit"]')?.addEventListener('click', openProductEdit);
  $('[data-drawer="config"]')?.addEventListener('click', openConfig);
  $('[data-confirm-test]')?.addEventListener('change', (e) => set({ testConfirmed: e.target.checked }));
  $('[data-evidence]')?.addEventListener('input', (e) => set({ evidence: e.target.value }));
  $('[data-approve]')?.addEventListener('click', openApprove);
  $('[data-reject]')?.addEventListener('click', openReject);
  $$('[data-retry]').forEach((b) => b.addEventListener('click', () => { state.notifications[+b.dataset.retry].status = '发送中'; render(); setTimeout(() => { state.notifications[+b.dataset.retry].status = '已受理'; render(); showToast('通知已重新受理'); }, 500); }));
  $('[data-test-link]')?.addEventListener('click', () => { screen.innerHTML = testSnapshot(); renderAnnotations('test'); bindTest(); });
  bindAnnotationAnchors();
}

function bindTest() { $('[data-close-test]')?.addEventListener('click', () => set({ page: 'detail' })); }
function bindAnnotationAnchors() { $$('[data-anchor]').forEach((b) => { b.onclick = () => highlight(b.dataset.anchor); }); }
function highlight(id) { const el = document.getElementById(id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('highlight'); setTimeout(() => el.classList.remove('highlight'), 1300); } $$('.anno').forEach((x) => x.classList.toggle('active', x.dataset.anchor === id)); }

modalRoot.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-mask') || e.target.matches('[data-close-modal]') || e.target.matches('.drawer-mask') || e.target.matches('[data-close-drawer]')) closeOverlay();
  if (e.target.matches('[data-submit-action]')) { const action = e.target.dataset.submitAction || '详情变更'; closeOverlay(); openSubmit(action); return; }
  if (e.target.matches('[data-confirm-submit]')) { const email = $('#tester-email').value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#email-error').textContent = '请输入有效的企业邮箱'; return; } const app = apps.find((x) => x.id === state.activeApplication) || apps[0]; app.action = state.pendingAction; set({ testerEmail: email, activeProductLock: true, demoMode: 'lock', page: 'detail', activeApplication: 'A-001' }); closeOverlay(); showToast(`申请 ${app.id} 已创建，快照与通知配置已冻结`); }
  if (e.target.matches('[data-confirm-reject]')) { if (!$('#reject-reason').value.trim()) { $('#reject-error').textContent = '请填写驳回原因'; return; } const a = apps.find((x) => x.id === state.activeApplication); a.status = '已驳回'; a.lock = false; set({ activeProductLock: false, page: 'changes' }); closeOverlay(); showToast('已驳回并撤销，线上配置未变更'); }
  if (e.target.matches('[data-confirm-approve]')) { const a = apps.find((x) => x.id === state.activeApplication); a.status = '已生效'; a.lock = false; set({ activeProductLock: false, page: 'changes' }); closeOverlay(); showToast('冻结快照已应用，已向产品经理发送结果通知'); }
  if (e.target.matches('[data-save-config]')) { closeOverlay(); showToast('审批配置已保存，仅对后续提交生效'); }
  if (e.target.matches('[data-save-draft]')) { closeOverlay(); showToast('草稿已保存，线上正式配置未变更'); }
  if (e.target.matches('[data-toast]')) { closeOverlay(); showToast(e.target.dataset.toast); }
});

window.addEventListener('prototype:change', render);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });
render();
