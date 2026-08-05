import { $, $$, escapeHtml } from './dom.js';
import { state, apps, users, approvalConfig, currentUser, isActive, set, tagType } from './state.js';

const screen = $('#screen');
const anno = $('#annotation-body');
const modalRoot = $('#modal-root');
const toast = $('#toast');
const W1_ID = '2075767415740338177';
const tag = (value) => `<span class="el-tag el-tag--${tagType(value)} is-plain">${escapeHtml(value)}</span>`;
const anchor = (n, id) => `<button class="anchor" type="button" data-anchor="${id}" aria-label="查看批注 ${n}">${n}</button>`;
const isPrivileged = () => state.role === '审批员' || state.role === '系统管理员';
const isAdmin = () => state.role === '系统管理员';
const visibleAction = (action) => ({ '详情变更': '变更详情', '上架范围变更': '变更详情', 上架: '上架产品', 下架: '下架产品' }[action] || action);

function layout(content, active) {
  const configItem = isAdmin() ? `<button class="menu-item ${active === 'settings' ? 'active' : ''}" data-page="settings"><span class="nav-icon">⚙</span>变更审批配置</button>` : '';
  const crumb = active === 'product' ? '智能产品 / 产品列表 / 产品详情' : active === 'approvals' ? '配置中心 / 审批管理' : active === 'settings' ? '配置中心 / 变更审批配置' : '智能产品 / 产品列表';
  return `<div class="app"><aside class="aside"><div class="brand"><div class="brand-wordmark"><span>路特创新</span><b>AIoT</b> Platform</div></div><nav class="menu"><button class="menu-item"><span class="nav-icon">◉</span>概览</button><div class="menu-title">智能产品</div><button class="menu-item ${active === 'product' || active === 'product-list' ? 'active' : ''}" data-page="product-list"><span class="nav-icon">▦</span>产品列表</button><div class="menu-title">配置中心</div><button class="menu-item ${active === 'approvals' ? 'active' : ''}" data-page="approvals"><span class="nav-icon">✓</span>审批管理</button>${configItem}</nav><div class="aside-footer">☰</div></aside><section class="shell-main"><header class="topbar"><div class="crumb"><div><b>${active === 'approvals' ? '审批管理' : active === 'settings' ? '变更审批配置' : '智能产品'}</b><small>${crumb}</small></div></div><div class="top-actions"><span class="top-icon">?</span><span class="avatar">陈</span></div></header><main class="content">${content}</main></section></div>`;
}

function productList() {
  const rows = [['W1 Lite', 'W1Lite', '已上架', 'ROOT云'], ['DreamSync Tech', 'WN05', '上架中', '涂鸦云'], ['Grand Flow', 'G100', '开发中', 'ROOT云'], ['S9 Sterilizer', 'S9', '已下架', 'ROOT云']];
  return layout(`<div class="list-head"><h1>智能产品</h1><button class="el-btn el-btn--primary" data-toast="创建产品不在本次原型范围内">＋ 创建产品</button></div><section class="filterbar"><input class="el-input" placeholder="产品名称 / 产品型号"><select class="el-select"><option>全部产品状态</option><option>开发中</option><option>上架中</option><option>已上架</option><option>已下架</option></select><button class="el-btn el-btn--primary" data-toast="已按筛选条件查询">查询</button><button class="el-btn" data-toast="筛选已重置">重置</button></section><div class="table-scroll"><table class="el-table" id="product-table"><thead><tr><th>产品名称</th><th>产品型号</th><th>产品状态</th><th>所属平台</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${rows.map((row) => `<tr><td><button class="op-link" data-page="product">${row[0]}</button></td><td>${row[1]}</td><td>${tag(row[2])}</td><td>${row[3]}</td><td>2026-08-05 10:18</td><td><button class="op-link" data-page="product">查看</button></td></tr>`).join('')}</tbody></table></div><div class="pagination">共 ${rows.length} 条　<span class="page-current">1</span></div>`, 'product-list');
}

const info = (label, value) => `<div class="info-field"><label>${label}</label><span>${value}</span></div>`;

function product() {
  const active = apps.find((item) => item.id === 'A-001');
  const locked = state.activeProductLock;
  const direct = state.productStatus === '开发中';
  const transition = ['开发中', '已下架'].includes(state.productStatus) ? '上架' : '下架';
  const submitLabel = direct ? '保存并更新' : '保存本地草稿';
  return layout(`<section class="product-hero"><div class="product-identity"><span class="product-image-large">W1</span><div><h1>W1 Lite ${tag('ROOT云')} ${tag(state.productStatus)}</h1><div class="product-meta"><span>产品分类：Breast Pump</span><i></i><span>产品型号：W1Lite</span><i></i><span>产品ID：${W1_ID}</span></div><p class="function-version">功能版本：<b>版本1 - 已发布</b></p></div></div><div class="product-actions"><button class="el-btn el-btn--danger ${locked ? 'is-disabled' : ''}" ${locked ? 'disabled' : ''} data-submit-action="${transition}" data-confirm-title="${transition === '上架' ? '确认提交上架审批' : '确认提交下架审批'}">${transition}产品</button></div></section><nav class="step-tabs"><button class="step-tab active">✓ 基础信息</button><button class="step-tab" data-toast="功能设计不在本次审批范围">✓ 功能设计</button><button class="step-tab" data-toast="扩展程序不在本次审批范围">✓ 扩展程序</button><button class="step-tab" data-toast="设备调试不在本次审批范围">✓ 设备调试</button><button class="step-tab" data-toast="配网引导不在本次审批范围">✓ 配网引导</button><button class="step-tab" data-toast="高级配置不在本次审批范围">✓ 高级配置</button></nav>${locked ? `<div class="lock-banner" id="product-lock"><div><b>该产品已有活跃审批单，已冻结编辑提交</b>${anchor(1, 'product-lock')}<p>当前审批单 <button class="op-link" data-open-app="${active.id}">${active.id} · ${active.action} / ${active.status}</button>。服务端以产品 ID 原子占位；后到提交请求会被拒绝。</p></div><button class="el-btn" data-open-app="${active.id}">查看审批单</button></div>` : ''}<section class="product-panel" id="base-info"><div class="panel-head"><h2>产品信息 ${anchor(2, 'base-info')}</h2><div class="button-row"><button class="el-btn" data-drawer="product-edit">编辑产品信息</button><button class="el-btn" data-drawer="listing-range">编辑上架范围</button></div></div><div class="info-grid">${info('产品名称', 'W1 Lite')}${info('产品状态', tag(state.productStatus))}${info('所属平台', tag('ROOT云'))}${info('产品型号', 'W1Lite')}${info('所属 App', 'momcozy')}${info('通讯方式', 'BLE')}${info('上架范围', '部分放开 · 北美、欧洲')}${info('配网方式', '蓝牙配网')}${info('最近编辑时间', '2026-08-05 10:18:07')}</div></section><section class="draft-panel" id="draft"><div class="panel-head"><h2>${direct ? '直接保存' : '本地草稿与审批提交'} ${anchor(3, 'draft')}</h2>${tag(direct ? '开发中可直存' : '前端草稿 · 未冻结')}</div><table class="diff-table"><thead><tr><th>字段</th><th>线上正式值</th><th>当前编辑值</th><th>影响</th></tr></thead><tbody><tr><td>产品名称</td><td>W1 Lite</td><td>W1 Lite Plus</td><td>App 展示名称</td></tr><tr><td>上架范围</td><td>北美</td><td>北美、欧洲</td><td>区域可见性</td></tr></tbody></table><div class="draft-actions"><span class="muted">${direct ? '开发中产品的详情与上架范围编辑可直接更新；草稿仅保存在当前前端会话。' : '上架中、已上架、已下架的详情或上架范围变更必须提交审批；草稿仅保存在当前前端会话。'}</span><button class="el-btn ${direct ? 'el-btn--primary' : ''}" ${direct ? 'data-save-direct' : 'data-toast="本地草稿已更新，关闭页面即清空"'}>${submitLabel}</button>${!direct ? `<button class="el-btn el-btn--primary ${locked ? 'is-disabled' : ''}" ${locked ? 'disabled' : ''} data-submit-action="详情变更">提交变更并冻结</button>` : ''}</div></section>`, 'product');
}

function approvals() {
  const me = currentUser();
  const reviewTab = isPrivileged();
  const rows = state.approvalTab === 'review' && reviewTab ? apps : apps.filter((item) => item.applicantId === me.id);
  const tabBar = `${reviewTab ? `<button class="tab ${state.approvalTab === 'review' ? 'active' : ''}" data-approval-tab="review">我审批的 <span class="badge">${apps.filter((item) => item.status === '待审批').length}</span></button>` : ''}<button class="tab ${state.approvalTab === 'initiated' ? 'active' : ''}" data-approval-tab="initiated">我发起的 <span class="badge">${apps.filter((item) => item.applicantId === me.id).length}</span></button>`;
  const help = reviewTab ? '我审批的展示全部审批单；我发起的只展示当前用户提交的审批单。禁止审批本人申请。' : '仅展示当前用户发起的审批单；可查看，且仅“待审批”可撤销。';
  return layout(`<div class="page-title"><div><h1>审批管理 ${anchor(1, 'approval-table')}</h1><p>${help}</p></div></div><section class="filterbar"><input class="el-input" placeholder="产品名称 / 申请号"><select class="el-select"><option>全部动作</option><option>详情变更</option><option>上架范围变更</option><option>上架</option><option>下架</option></select><select class="el-select"><option>全部状态</option><option>待审批</option><option>未生效</option><option>已生效</option><option>已驳回</option></select><button class="el-btn el-btn--primary" data-toast="已按筛选条件查询">查询</button><button class="el-btn" data-toast="筛选已重置">重置</button></section><div class="tabs">${tabBar}</div><div class="table-scroll"><table class="el-table" id="approval-table"><thead><tr><th>申请号</th><th>产品</th><th>动作</th><th>状态</th><th>提交人</th><th>提交时间</th><th>操作</th></tr></thead><tbody>${rows.map((item) => `<tr><td>${item.id}</td><td>${item.product} / ${item.model}</td><td>${item.action}</td><td>${tag(item.status)}</td><td>${item.applicant}</td><td>${item.submitted}</td><td><button class="op-link" data-open-app="${item.id}">查看</button>${item.applicantId === me.id && item.status === '待审批' ? `<span class="op-divider">|</span><button class="op-link danger" data-withdraw="${item.id}">撤销</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="7"><div class="empty">暂无可查看的审批单</div></td></tr>`}</tbody></table></div><div class="pagination">共 ${rows.length} 条　<span class="page-current">1</span></div>`, 'approvals');
}

function settings() {
  if (!isAdmin()) return layout(`<section class="notice-box"><h2>无访问权限</h2><p>审批人配置仅系统管理员可访问和配置。前端隐藏不代表权限校验，服务端必须按当前 IoT 平台用户权限拦截读取与保存。</p><button class="el-btn" data-page="approvals">返回审批管理</button></section>`, 'settings');
  return layout(`<div class="page-title"><div><h1>变更审批配置 ${anchor(1, 'config-table')}</h1><p>仅系统管理员可维护；所有纳入范围的产品详情变更、上架范围变更、产品上架和产品下架均使用同一审批人。</p></div><button class="el-btn el-btn--primary" data-drawer="config">编辑审批人</button></div><div class="notice-box"><b>需要审批的范围</b><p>上架中、已上架、已下架产品的详情/上架范围变更，以及所有产品的上架、下架，均须先由下方审批人审批。飞书待审批消息默认推送，机器人由后台统一配置。</p></div><section class="product-panel settings-panel"><div class="panel-head"><h2>已配置审批人</h2></div><div class="info-grid two" id="config-table">${info('审批人', approvalConfig.name)}${info('IoT 平台账号', approvalConfig.account)}${info('审批范围', '产品详情、上架范围、产品上架、产品下架')}${info('飞书待审批消息', '默认推送（后台统一配置）')}</div></section><section class="product-panel settings-panel"><div class="panel-head"><h2>飞书通知</h2></div><div class="frozen-box"><b>待审批消息模板</b><p>｛产品名称 / 产品型号｝正在｛变更详情/上架产品/下架产品｝，待审批。<br>审批单据：｛审批单 url｝<br>@｛审批人姓名｝</p></div></section>`, 'settings');
}

function detail(item) {
  const me = currentUser();
  const owner = item.applicantId === me.id;
  const canApprove = isPrivileged() && !owner && item.status === '待审批';
  const canWithdraw = owner && item.status === '待审批';
  const canCancel = isPrivileged() && !owner && item.status === '未生效';
  const canRetry = isPrivileged() && !owner && item.status === '未生效';
  const notification = `${item.product} / ${item.model} 正在${visibleAction(item.action)}，待审批。<br>审批单据：/approvals/${item.id}<br>@李娜`;
  return layout(`<div class="page-title"><div><h1>审批详情 ${item.id} ${tag(item.status)}</h1><p>提交人：${item.applicant} · 冻结审批人：李娜（IoT 平台用户） · 测试工程师邮箱：${escapeHtml(state.testerEmail)}</p></div><button class="el-btn" data-page="approvals">返回审批管理</button></div><div class="detail-grid"><div><section class="product-panel" id="snapshot"><div class="panel-head"><h2>冻结快照与变更差异 ${anchor(1, 'snapshot')}</h2>${tag('不可修改')}</div><div class="info-grid two">${info('产品', `${item.product} / ${item.model}`)}${info('申请动作', item.action)}${info('基线正式版本', 'v12')}${info('冻结快照版本', 'v13')}</div><table class="diff-table"><thead><tr><th>字段</th><th>基线正式值</th><th>冻结目标值</th></tr></thead><tbody><tr><td>产品名称</td><td class="before">W1 Lite</td><td class="after">W1 Lite Plus</td></tr><tr><td>上架范围</td><td class="before">北美</td><td class="after">北美、欧洲</td></tr></tbody></table></section>${canApprove ? approvalPanel(item) : ''}${canWithdraw ? `<section class="confirm-card"><h2>发起人操作</h2><p>你只能撤销本人处于“待审批”的申请；撤销后线上配置不变并释放产品冻结。</p><div class="button-row"><button class="el-btn el-btn--danger" data-withdraw="${item.id}">撤销申请</button></div></section>` : ''}${canCancel ? `<section class="confirm-card"><h2>未生效处理</h2><p>审批已通过但应用失败，产品仍被冻结；审批员可取消本次变更，状态将转为“已驳回”。</p><div class="button-row"><button class="el-btn el-btn--danger" data-cancel-unapplied="${item.id}">取消本次变更</button></div></section>` : ''}${canRetry ? `<section class="confirm-card"><h2>未生效处理</h2><p>审批已通过但应用失败。审批员或系统管理员可在不重新开放编辑的情况下重试应用冻结快照。</p><div class="button-row"><button class="el-btn el-btn--primary" data-retry-apply="${item.id}">重试应用</button></div></section>` : ''}${!canApprove && !canWithdraw && !canCancel && !canRetry ? `<section class="notice-box"><b>只读详情</b><p>${owner ? '提交人不可通过或驳回本人申请。' : '当前状态或角色不支持审批操作。'}</p></section>` : ''}<section class="timeline"><h2>操作记录</h2><div class="timeline-item"><b>快照已冻结</b><small>${item.submitted} · ${item.applicant} · v12 → v13</small></div><div class="timeline-item"><b>飞书待审批提醒已投递</b><small>消息仅提醒审批，不承载审批动作；测试在系统外完成。</small></div><div class="timeline-item"><b>${item.outcome || '等待审批结果'}</b><small>申请状态：${item.status}</small></div></section></div><aside><section class="notice-box" id="notifications"><h2>通知投递 ${anchor(2, 'notifications')}</h2><div class="notice-line"><div><b>测试工程师企业邮箱</b><small>${escapeHtml(state.testerEmail)}<br>冻结快照只读链接与测试提醒</small></div>${tag('已受理')}</div><div class="notice-line"><div><b>飞书机器人</b><small>${notification}</small></div>${tag('已受理')}</div><p class="muted">外部测试、测试结果与通知审批人均在系统外完成；“待审批”不代表测试通过。</p><button class="el-btn el-btn--small" data-test-link>预览测试快照只读页</button></section></aside></div>`, 'approvals');
}

function approvalPanel(item) {
  const ready = state.evidence.trim();
  return `<section class="confirm-card" id="approval-action"><h2>审批操作 ${anchor(3, 'approval-action')}</h2><p>审批员/系统管理员需在系统外取得测试结论后，再核验当前冻结快照。</p><label class="field"><span>外部测试依据引用 <span class="required">*</span></span><textarea class="el-input textarea" data-evidence placeholder="填写邮件主题、报告链接或编号">${escapeHtml(state.evidence)}</textarea></label><div class="button-row"><button class="el-btn el-btn--danger" data-reject="${item.id}">驳回</button><button class="el-btn el-btn--primary ${ready ? '' : 'is-disabled'}" ${ready ? '' : 'disabled'} data-approve="${item.id}">通过并应用</button></div></section>`;
}

function testSnapshot() {
  return `<section class="test-page"><div class="test-head"><div><b>产品变更测试快照</b><small>只读链接 · 有效期 7 天</small></div><span>${tag('待审批')}</span></div><h2>W1 Lite / W1Lite · 详情变更</h2><p>本页只展示冻结快照与字段差异，不提供审批或测试结论录入。</p><table class="el-table"><thead><tr><th>字段</th><th>基线正式值</th><th>冻结目标值</th></tr></thead><tbody><tr><td>产品名称</td><td>W1 Lite</td><td>W1 Lite Plus</td></tr><tr><td>上架范围</td><td>北美</td><td>北美、欧洲</td></tr></tbody></table><div class="test-warning">请在系统外完成测试并通知审批人。平台不记录测试过程或结论。</div><button class="el-btn" data-close-test>返回审批详情</button></section>`;
}

function openSubmit(action) {
  if (state.activeProductLock) return showToast('提交被拒绝：该产品已有活跃审批单', false);
  const actionText = visibleAction(action);
  modal(`<h3>确认提交${actionText}审批</h3><div class="modal-body"><div class="submit-summary">确认后将冻结产品快照，并向测试工程师发送邮件提醒、向审批人发送飞书待审批消息。</div><label class="field"><span>指定测试工程师邮箱 <span class="required">*</span></span><input class="el-input" id="tester-email" value="${escapeHtml(state.testerEmail)}" placeholder="例如 qa.liu@example.com"><span class="form-help">仅手工输入，不映射 ERP 账号。</span><span class="error" id="email-error"></span></label><div class="frozen-box"><b>冻结的审批配置</b><p>审批人：李娜（IoT 平台用户 / li.na）</p><p>动作：${actionText}；飞书消息将链接至本审批详情页。</p></div></div><div class="modal-foot"><button class="el-btn" data-close-modal>取消</button><button class="el-btn el-btn--primary" data-confirm-submit="${action}">确认提交并冻结</button></div>`);
}

function openApprove(id) {
  const item = apps.find((app) => app.id === id);
  modal(`<h3 id="approval-modal">核对信息 ${anchor(4, 'approval-modal')}</h3><div class="modal-body"><div class="approval-check-grid"><div class="check-item"><label>申请号</label><strong>${item.id}</strong></div><div class="check-item"><label>动作</label><strong>${item.action}</strong></div><div class="check-item"><label>产品</label><strong>${item.product} / ${item.model}</strong></div><div class="check-item"><label>审批人</label><strong>李娜（IoT 平台用户）</strong></div><div class="check-item"><label>冻结快照</label><strong>v13（不可修改）</strong></div><div class="check-item"><label>外部测试依据</label><strong>${escapeHtml(state.evidence)}</strong></div><div class="check-item check-item--wide"><label>目标变更</label><strong>产品名称：W1 Lite → W1 Lite Plus；上架范围：北美 → 北美、欧洲</strong></div></div><div class="warning-box">确认后在当前审批单内应用冻结快照，并直接返回“已生效”或“未生效”的结果。</div></div><div class="modal-foot"><button class="el-btn" data-close-modal>返回修改</button><button class="el-btn el-btn--primary" data-confirm-approve="${id}">确认应用</button></div>`);
}

function openReject(id) { modal(`<h3>驳回申请</h3><div class="modal-body"><p>驳回后不应用冻结快照，线上正式配置保持不变，产品冻结释放。</p><label class="field"><span>驳回原因 <span class="required">*</span></span><textarea class="el-input textarea" id="reject-reason" placeholder="请填写驳回原因"></textarea><span class="error" id="reject-error"></span></label></div><div class="modal-foot"><button class="el-btn" data-close-modal>取消</button><button class="el-btn el-btn--danger" data-confirm-reject="${id}">确认驳回</button></div>`); }

function openProductEdit() {
  const direct = state.productStatus === '开发中';
  drawer(`<div class="drawer-head"><h3>编辑产品信息</h3><button class="icon-btn" data-close-drawer>×</button></div><div class="drawer-body"><div class="drawer-form"><div class="drawer-readonly"><label>产品分类</label><span>Breast Pump / 1</span></div><label class="drawer-field required-field">产品名称<input class="el-input" value="W1 Lite Plus"></label><label class="drawer-field">客服型号<input class="el-input" value="W1LP-NA"></label><label class="drawer-field required-field">所属平台<select class="el-select"><option>ROOT云</option><option>涂鸦云</option></select></label><label class="drawer-field required-field">通讯方式<select class="el-select" disabled><option>BLE</option></select><small>产品创建后不可修改通讯方式</small></label><label class="drawer-field required-field">所属 App<select class="el-select"><option>momcozy</option></select></label><label class="drawer-field">产品图片<div class="upload-row"><span class="upload-box">＋<small>产品主图</small></span><span class="upload-box"><small>列表图</small></span></div></label></div></div><div class="drawer-foot"><button class="el-btn" data-close-drawer>取消</button><button class="el-btn ${direct ? 'el-btn--primary' : ''}" ${direct ? 'data-save-direct' : 'data-toast="本地草稿已更新，关闭页面即清空"'}>${direct ? '保存并更新' : '保存本地草稿'}</button>${!direct ? `<button class="el-btn el-btn--primary ${state.activeProductLock ? 'is-disabled' : ''}" ${state.activeProductLock ? 'disabled' : ''} data-submit-action="详情变更">提交变更并冻结</button>` : ''}</div>`);
}

function openListingRange() {
  const direct = state.productStatus === '开发中';
  drawer(`<div class="drawer-head"><h3>编辑产品上架范围</h3><button class="icon-btn" data-close-drawer>×</button></div><div class="drawer-body"><div class="drawer-form"><label class="drawer-field required-field">上架方式<select class="el-select"><option>部分放开</option><option>全面放开</option></select></label><label class="drawer-field required-field">范围模式<select class="el-select"><option>国家 / 地区</option><option>数据中心</option></select></label><label class="drawer-field required-field">国家 / 地区<span class="check-row"><label><input type="checkbox" checked> 北美</label><label><input type="checkbox" checked> 欧洲</label><label><input type="checkbox"> 亚太</label></span></label><label class="drawer-field required-field">生效时间<select class="el-select"><option>立即生效</option><option>定时生效</option></select><small>上架中产品仍须先通过本审批；定时生效沿用产品上架范围需求。</small></label></div></div><div class="drawer-foot"><button class="el-btn" data-close-drawer>取消</button><button class="el-btn ${direct ? 'el-btn--primary' : ''}" ${direct ? 'data-save-direct' : 'data-toast="本地草稿已更新，关闭页面即清空"'}>${direct ? '保存并更新' : '保存本地草稿'}</button>${!direct ? `<button class="el-btn el-btn--primary ${state.activeProductLock ? 'is-disabled' : ''}" ${state.activeProductLock ? 'disabled' : ''} data-submit-action="上架范围变更">提交变更并冻结</button>` : ''}</div>`);
}

function openConfig() {
  const options = Object.values(users).map((user) => `<button class="op-link" data-select-approver="${user.id}">${user.name}（${user.role} / ${user.id}）</button>`).join('<span class="op-divider">|</span>');
  drawer(`<div class="drawer-head"><h3>编辑审批人</h3><button class="icon-btn" data-close-drawer>×</button></div><div class="drawer-body"><p class="muted">所有纳入审批范围的变更、上架和下架均使用同一审批人；不允许手工输入姓名或邮箱。飞书待审批消息由后台统一配置并默认推送。</p><label class="drawer-field required-field">审批人<select class="el-select" id="approver-picker"><option value="li.na">李娜（li.na）</option><option value="wang.admin">王敏（wang.admin）</option></select></label><div class="notice-box"><b>可选 IoT 平台用户</b><p>${options}</p></div><div class="frozen-box"><b>审批范围</b><p>产品详情变更、产品上架范围变更、产品上架、产品下架均需提交该审批人审批。</p></div></div><div class="drawer-foot"><button class="el-btn" data-close-drawer>取消</button><button class="el-btn el-btn--primary" data-save-config>保存</button></div>`);
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
    ['1', '产品状态与活跃审批锁', '产品详情页头部 / 冻结提示', '开发中编辑详情与上架范围直接保存；上架中、已上架、已下架的详情或上架范围需审批。任一产品最多一个待审批或未生效单，后到提交由服务端拒绝。'],
    ['2', '基础信息与上架范围入口', '产品信息', '保留 IoT Admin 基础信息布局。上架范围归属产品详情内上架动作，编辑入口使用抽屉。'],
    ['3', '前端草稿和提交', '本地草稿与审批提交', '草稿只保存在前端会话，不持久化；非开发中提交后才冻结快照。上下架均经二次确认后提交审批。']
  ] : kind === 'approvals' ? [
    ['1', '审批页数据隔离', '审批管理列表', '普通用户仅见“我发起的”并只可查看/撤销待审批；审批员和系统管理员可见“我审批的”全量列表。服务端必须复核权限。'],
    ['2', '审批详情操作', '审批详情', '审批员/系统管理员只可对待审批且非本人申请通过或驳回。已通过但应用失败转“未生效”，审批员或系统管理员可取消或重试。']
  ] : kind === 'settings' ? [
    ['1', '全局审批人配置', '已配置审批人', '仅系统管理员可访问。所有纳入范围的变更、上架和下架使用同一 IoT 平台审批人，不手填姓名/邮箱；提交时冻结配置快照。'],
    ['2', '默认飞书提醒', '飞书通知', '待审批消息由后台统一配置并默认推送，审批单 URL 指向审批详情页，@审批人姓名；不接入飞书官方审批流。']
  ] : [
    ['1', '冻结快照', '审批详情', '展示基线与目标差异；快照不可修改。'],
    ['2', '外部测试与飞书提醒', '通知投递', '测试、测试结果和通知审批人均在系统外完成；平台只记录通知投递。'],
    ['3', '通过并应用', '审批操作 / 核对弹窗', '点击通过并应用直接弹出核对信息，确认后在原单据内应用，不创建额外状态。']
  ];
  anno.innerHTML = `${prototypeControls()}<p class="annotation-intro">原型角色、产品状态与活动审批仅在本批注栏切换，不属于左侧真实产品页面。切换仅用于展示，不替代真实服务端鉴权。</p>${cards.map(([n, title, location, body]) => `<button class="anno"><h3><span class="anno-n">${n}</span>${title}</h3><p><b>关联位置：</b>${location}</p><p><b>说明 / 交互：</b>${body}</p></button>`).join('')}<div class="assumption"><b>原型备注</b><p>审批员可见全量审批单，但默认禁止审批本人发起的申请；未生效的重试与取消均由审批员或系统管理员执行。</p></div>`;
}

function render() {
  let html;
  if (state.page === 'product-list') html = productList();
  else if (state.page === 'product') html = product();
  else if (state.page === 'approvals') html = approvals();
  else if (state.page === 'settings') html = settings();
  else html = detail(apps.find((item) => item.id === state.activeApplication) || apps[0]);
  screen.innerHTML = html;
  renderAnnotations(state.page);
  bind();
}

function bind() {
  $$('[data-page]').forEach((button) => button.addEventListener('click', () => set({ page: button.dataset.page })));
  $$('[data-open-app]').forEach((button) => button.addEventListener('click', () => set({ page: 'detail', activeApplication: button.dataset.openApp })));
  $$('[data-toast]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.toast)));
  anno.querySelector('[data-role]')?.addEventListener('change', (event) => { const role = event.target.value; set({ role, approvalTab: role === '普通用户' ? 'initiated' : 'review' }); });
  anno.querySelector('[data-product-status]')?.addEventListener('change', (event) => { const productStatus = event.target.value; set({ productStatus, activeProductLock: productStatus === '已上架' }); });
  anno.querySelector('[data-lock-demo]')?.addEventListener('change', (event) => set({ activeProductLock: event.target.value === 'locked' }));
  const retryOutcome = anno.querySelector('[data-retry-outcome]');
  if (retryOutcome) { retryOutcome.value = state.retryOutcome; retryOutcome.addEventListener('change', (event) => { state.retryOutcome = event.target.value; }); }
  $$('[data-approval-tab]').forEach((button) => button.addEventListener('click', () => set({ approvalTab: button.dataset.approvalTab })));
  $$('[data-submit-action]').forEach((button) => button.addEventListener('click', () => openSubmit(button.dataset.submitAction)));
  $('[data-drawer="product-edit"]')?.addEventListener('click', openProductEdit);
  $('[data-drawer="listing-range"]')?.addEventListener('click', openListingRange);
  $('[data-drawer="config"]')?.addEventListener('click', openConfig);
  $$('[data-save-direct]').forEach((button) => button.addEventListener('click', () => { closeOverlay(); showToast('开发中产品已直接保存并更新'); }));
  $$('[data-withdraw]').forEach((button) => button.addEventListener('click', () => withdraw(button.dataset.withdraw)));
  $$('[data-cancel-unapplied]').forEach((button) => button.addEventListener('click', () => cancelUnapplied(button.dataset.cancelUnapplied)));
  $$('[data-retry-apply]').forEach((button) => button.addEventListener('click', () => retryApply(button.dataset.retryApply)));
  $('[data-evidence]')?.addEventListener('input', (event) => {
    state.evidence = event.target.value;
    const approve = $('[data-approve]');
    if (approve) { approve.disabled = !state.evidence.trim(); approve.classList.toggle('is-disabled', !state.evidence.trim()); }
  });
  $$('[data-approve]').forEach((button) => button.addEventListener('click', () => openApprove(button.dataset.approve)));
  $$('[data-reject]').forEach((button) => button.addEventListener('click', () => openReject(button.dataset.reject)));
  $('[data-test-link]')?.addEventListener('click', () => { screen.innerHTML = testSnapshot(); renderAnnotations('test'); $('[data-close-test]')?.addEventListener('click', () => set({ page: 'detail' })); });
}

function withdraw(id) { const item = apps.find((app) => app.id === id); if (!item || item.status !== '待审批') return; item.status = '已撤销'; item.lock = false; item.outcome = '发起人撤销'; if (item.productId === W1_ID) state.activeProductLock = false; showToast('申请已撤销，线上配置未变更'); render(); }
function cancelUnapplied(id) { const item = apps.find((app) => app.id === id); if (!item || item.status !== '未生效') return; item.status = '已驳回'; item.lock = false; item.outcome = '审批员取消未生效变更'; showToast('本次变更已取消，产品冻结已释放'); render(); }
function retryApply(id) { const item = apps.find((app) => app.id === id); if (!item || item.status !== '未生效') return; if (state.retryOutcome === 'failed') { item.outcome = '重试应用失败'; showToast('重试应用失败，审批单保持未生效', false); render(); return; } item.status = '已生效'; item.lock = false; item.outcome = '重试应用成功'; showToast('冻结快照已重试应用并生效'); render(); }

modalRoot.addEventListener('click', (event) => {
  if (event.target.classList.contains('modal-mask') || event.target.matches('[data-close-modal]') || event.target.matches('.drawer-mask') || event.target.matches('[data-close-drawer]')) return closeOverlay();
  const drawerSubmit = event.target.closest('[data-submit-action]');
  if (drawerSubmit) { openSubmit(drawerSubmit.dataset.submitAction); return; }
  const drawerToast = event.target.closest('[data-toast]');
  if (drawerToast) { showToast(drawerToast.dataset.toast); return; }
  if (event.target.closest('[data-save-direct]')) { closeOverlay(); showToast('开发中产品已直接保存并更新'); return; }
  const submit = event.target.closest('[data-confirm-submit]');
  if (submit) {
    const email = $('#tester-email')?.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email || '')) { $('#email-error').textContent = '请输入有效邮箱地址'; return; }
    if (state.activeProductLock) { closeOverlay(); showToast('提交被拒绝：已有活跃审批单', false); return; }
    const action = submit.dataset.confirmSubmit;
    apps.unshift({ id: `A-${String(7 + apps.length).padStart(3, '0')}`, productId: W1_ID, action, status: '待审批', product: 'W1 Lite', model: 'W1Lite', applicant: '陈晓 / 产品经理', applicantId: 'chen.xiao', submitted: '2026-08-05 11:20', lock: true, outcome: '' });
    state.testerEmail = email; state.activeProductLock = true; state.activeApplication = apps[0].id; closeOverlay(); set({ page: 'detail', approvalTab: 'initiated' }); showToast('审批单已创建，产品已冻结'); return;
  }
  const reject = event.target.closest('[data-confirm-reject]');
  if (reject) { const reason = $('#reject-reason')?.value.trim(); if (!reason) { $('#reject-error').textContent = '请填写驳回原因'; return; } const item = apps.find((app) => app.id === reject.dataset.confirmReject); item.status = '已驳回'; item.lock = false; item.outcome = `审批驳回：${reason}`; if (item.productId === W1_ID) state.activeProductLock = false; closeOverlay(); set({ page: 'detail' }); showToast('申请已驳回，线上配置未变更'); return; }
  const approve = event.target.closest('[data-confirm-approve]');
  if (approve) { const item = apps.find((app) => app.id === approve.dataset.confirmApprove); item.status = '已生效'; item.lock = false; item.outcome = '审批通过，应用成功'; if (item.productId === W1_ID) state.activeProductLock = false; closeOverlay(); set({ page: 'detail' }); showToast('冻结快照已应用，申请已生效'); return; }
  if (event.target.closest('[data-save-config]')) { closeOverlay(); showToast('审批人配置已保存，仅影响后续提交'); return; }
  const select = event.target.closest('[data-select-approver]');
  if (select) { const picker = $('#approver-picker'); if (picker) picker.value = select.dataset.selectApprover; showToast('已选择 IoT 平台用户'); }
});

window.addEventListener('prototype:change', render);
render();
