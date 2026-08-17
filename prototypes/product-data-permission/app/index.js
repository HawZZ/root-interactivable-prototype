const users = [
  { name: '陈薇', mail: 'chen.wei@momcozy.com', erp: '产品经理', direct: ['W1 Lite'], roles: ['北美泵产品组'], scope: 'W1 Lite、S12 Pro、M5', status: '已授权' },
  { name: '王琳', mail: 'wang.lin@momcozy.com', erp: '运营专员', direct: [], roles: ['欧洲运营组'], scope: 'S12 Pro、V2', status: '已授权' },
  { name: '赵敏', mail: 'zhao.min@momcozy.com', erp: '历史账号', direct: [], roles: ['系统临时全量角色'], scope: '全部产品（动态）', status: '临时全量' }
];

const dataRoles = [
  { name: '北美泵产品组', owner: '王琳', members: 8, products: ['W1 Lite', 'S12 Pro', 'M5'] },
  { name: '欧洲运营组', owner: '李浩', members: 5, products: ['S12 Pro', 'V2'] }
];

const notes = {
  users: [
    ['页面入口', '关联位置：系统管理 > 数据权限管理。ERP 页面权限决定是否可进入，本页不替代 ERP 功能权限。'],
    ['有效范围', '直授产品与所属数据角色产品取并集；表格展示来源与计算结果。'],
    ['临时全量账号', '仅上线时冻结的有效历史账号加入；新账号不加入，移除立即失效且不会自动回加。'],
    ['用户授权', '全局管理员可新增/撤销直授产品；角色负责人不可修改此范围。']
  ],
  roles: [
    ['数据角色', '角色含负责人、成员与授权产品；负责人只管理成员，不自动取得产品访问权。'],
    ['新建角色', '角色名称、负责人和授权产品为必填项；提交成功后立即可用于授权范围计算。'],
    ['成员管理', '点击“管理成员”进入成员维护；产品范围仅全局管理员可维护。']
  ],
  products: [
    ['产品授权视图', '按产品反向查看直授用户、数据角色与关联资源，用于授权核查。'],
    ['查看授权', '展示当前产品的授权来源；无权产品不会出现在该视图。'],
    ['资源范围', '产品关联资源通过实际归属产品判定；客户端传入产品参数不能扩大访问范围。']
  ],
  drawer: [
    ['抽屉操作', '确认按钮根据当前操作执行校验。取消或关闭不保存任何变更。'],
    ['权限边界', '示例以全局管理员视角展示；负责人仅可维护其角色成员。']
  ]
};

let current = users[0];
let drawerMode = 'grant';
let activeRole = null;
let memberAdded = false;

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('show');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => element.classList.remove('show'), 2600);
}

function renderNotes(tab, context) {
  document.querySelector('#noteContext').textContent = context || ({
    users: '用户授权 · 页面态',
    roles: '数据角色 · 页面态',
    products: '产品授权视图 · 页面态',
    drawer: '操作抽屉 · 当前状态'
  }[tab]);
  document.querySelector('#notes').innerHTML = notes[tab].map((note, index) => `
    <article class="note"><span class="num">${index + 1}</span><b>${note[0]}</b><span>${note[1]}</span></article>
  `).join('');
}

function calculateScope(user) {
  if (user.status === '临时全量') return '全部产品（动态）';
  const roleProducts = user.roles.flatMap(roleName => {
    const role = dataRoles.find(item => item.name === roleName);
    return role ? role.products : [];
  });
  return [...new Set([...user.direct, ...roleProducts])].join('、') || '—';
}

function renderRows() {
  document.querySelector('#userRows').innerHTML = users.map((user, index) => `
    <tr>
      <td><b>${user.name}</b><br><small>${user.mail}</small></td>
      <td>${user.erp}</td>
      <td>${user.direct.length ? user.direct.join('、') : '—'}</td>
      <td>${user.roles.join('、')}</td>
      <td>${calculateScope(user)}</td>
      <td><span class="tag ${user.status === '临时全量' ? 'warning' : 'success'}">${user.status}</span></td>
      <td><button class="op" data-user="${index}">管理授权</button></td>
    </tr>
  `).join('');
  document.querySelectorAll('[data-user]').forEach(button => {
    button.onclick = () => openGrant(users[Number(button.dataset.user)]);
  });
}

function setDrawer(title, body, confirmText, mode) {
  drawerMode = mode;
  document.querySelector('#drawerTitle').textContent = title;
  document.querySelector('#drawerBody').innerHTML = body;
  document.querySelector('#confirm').textContent = confirmText;
  document.querySelector('#drawer').classList.add('open');
  renderNotes('drawer', `${title} · 抽屉态`);
}

function closeDrawer() {
  document.querySelector('#drawer').classList.remove('open');
  renderNotes(document.querySelector('.tab.active').dataset.tab);
}

function openGrant(user) {
  current = user;
  setDrawer(`用户授权 · ${user.name}`, `
    <div class="field"><label>ERP 账号</label><input class="el-input" value="${user.mail}" disabled><p class="help">账号、页面权限和 ERP 角色由 ERP 管理。</p></div>
    <div class="field"><label>用户直授产品 <em style="color:#f56c6c">*</em></label>
      <select class="el-select" id="product"><option value="">请选择产品</option><option>W1 Lite</option><option>S12 Pro</option><option>M5</option><option>V2</option></select>
      <p class="help">仅可授予当前管理员拥有管理权限的产品。</p>
    </div>
    <div class="field"><label>当前直授</label><div class="scope">${user.direct.length ? user.direct.map(product => `<span class="chip">${product} <button class="op danger" data-remove="${product}">×</button></span>`).join('') : '暂无用户直授'}</div></div>
    <div class="field"><label>数据角色来源</label><div class="scope">${user.roles.map(role => `<span class="chip">${role}</span>`).join('')}</div><p class="help">撤销直授不会移除数据角色带来的产品范围。</p></div>
  `, '确认授权', 'grant');
  document.querySelectorAll('[data-remove]').forEach(button => {
    button.onclick = () => {
      user.direct = user.direct.filter(product => product !== button.dataset.remove);
      renderRows();
      openGrant(user);
      toast('已撤销用户直授；角色带来的产品范围保持不变');
    };
  });
}

function openRole(mode, role) {
  activeRole = role || null;
  if (mode === 'create') {
    setDrawer('新建数据角色', `
      <div class="field"><label>角色名称 <em style="color:#f56c6c">*</em></label><input class="el-input" id="roleName" placeholder="例如：日本泵产品组"><p class="help">名称在数据角色范围内唯一，创建后可用于成员授权。</p></div>
      <div class="field"><label>角色负责人 <em style="color:#f56c6c">*</em></label><select class="el-select" id="roleOwner"><option value="">请选择负责人</option><option>陈薇</option><option>王琳</option></select><p class="help">负责人仅可维护本角色成员，不自动获得产品访问权。</p></div>
      <div class="field"><label>授权产品 <em style="color:#f56c6c">*</em></label><div class="scope" id="roleProducts"><label><input type="checkbox" value="W1 Lite"> W1 Lite</label><label><input type="checkbox" value="S12 Pro"> S12 Pro</label><label><input type="checkbox" value="M5"> M5</label><label><input type="checkbox" value="V2"> V2</label></div><p class="help">仅全局管理员可配置产品范围。</p></div>
    `, '创建角色', 'createRole');
    return;
  }

  const memberNames = role.name === '北美泵产品组' ? ['陈薇', '周凯', '李宁', 'Sofia'] : ['王琳', 'Ana', 'Luca', 'Mila'];
  if (mode === 'members') {
    memberAdded = false;
    setDrawer(`管理成员 · ${role.name}`, `
      <div class="field"><label>角色负责人</label><input class="el-input" value="${role.owner}" disabled></div>
      <div class="field"><label>授权产品</label><div class="scope">${role.products.map(product => `<span class="chip">${product}</span>`).join('')}</div><p class="help">角色负责人不可修改产品范围。</p></div>
      <div class="field"><label>当前成员</label><div class="scope" id="memberList">${memberNames.map(name => `<span class="chip">${name}</span>`).join('')}</div><button class="op" id="addMember">+ 添加成员</button><p class="help">成员变更保存后，产品访问范围立即重新计算。</p></div>
    `, '保存成员', 'members');
    document.querySelector('#addMember').onclick = () => {
      const list = document.querySelector('#memberList');
      if (list.textContent.includes('新成员')) return toast('新成员已在待保存列表中');
      list.insertAdjacentHTML('beforeend', '<span class="chip">新成员</span>');
      memberAdded = true;
      toast('已加入待保存成员列表');
    };
    return;
  }

  setDrawer(`数据角色详情 · ${role.name}`, `
    <div class="field"><label>角色负责人</label><input class="el-input" value="${role.owner}" disabled></div>
    <div class="field"><label>成员数</label><input class="el-input" value="${role.members} 人" disabled></div>
    <div class="field"><label>授权产品</label><div class="scope">${role.products.map(product => `<span class="chip">${product}</span>`).join('')}</div></div>
    <p class="help">查看态不提供修改入口；如需维护成员，请使用“管理成员”。</p>
  `, '关闭', 'detail');
}

function openProductAuth(product) {
  const directUsers = users.filter(user => user.direct.includes(product)).map(user => user.name);
  const roles = dataRoles.filter(role => role.products.includes(product));
  setDrawer(`产品授权 · ${product}`, `
    <div class="field"><label>用户直授</label><div class="scope">${directUsers.length ? directUsers.map(name => `<span class="chip">${name}</span>`).join('') : '暂无用户直授'}</div></div>
    <div class="field"><label>数据角色</label><div class="scope">${roles.length ? roles.map(role => `<span class="chip">${role.name} · ${role.members} 人</span>`).join('') : '暂无数据角色授权'}</div></div>
    <div class="field"><label>核查提示</label><p class="help">本视图仅展示当前产品的授权来源；关联资源需按服务端实际产品归属鉴权。</p></div>
  `, '关闭', 'detail');
}

function renderNewRoleRow(role) {
  const table = document.querySelector('#roles tbody');
  if (!table) return;
  table.insertAdjacentHTML('beforeend', `<tr><td><b>${role.name}</b></td><td>${role.owner}</td><td>0 人</td><td>${role.products.join('、')}</td><td><span class="tag success">启用</span></td><td><button class="op">管理成员</button> <button class="op">查看</button></td></tr>`);
  bindRoleActions();
}

function bindRoleActions() {
  const roleRows = [...document.querySelectorAll('#roles tbody tr')];
  roleRows.forEach((row, index) => {
    const role = dataRoles[index];
    if (!role) return;
    row.querySelectorAll('.op').forEach(button => {
      button.onclick = () => openRole(button.textContent.includes('管理成员') ? 'members' : 'detail', role);
    });
  });
}

function bindFilterActions() {
  document.querySelectorAll('.filters').forEach((filters, index) => {
    const buttons = filters.querySelectorAll('.el-btn');
    buttons.forEach(button => {
      if (button.classList.contains('right')) return;
      button.onclick = () => {
        const input = filters.querySelector('input');
        if (button.textContent.trim() === '重置') {
          if (input) input.value = '';
          toast('筛选条件已重置');
        } else {
          toast(input && input.value.trim() ? `已按“${input.value.trim()}”查询（演示数据）` : '已刷新全部结果（演示数据）');
        }
      };
    });
    if (index === 2 && buttons.length === 1) buttons[0].onclick = () => toast('已刷新产品授权视图（演示数据）');
  });
}

document.querySelectorAll('.tab').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('.tab, .view').forEach(element => element.classList.remove('active'));
    button.classList.add('active');
    document.querySelector(`#${button.dataset.tab}`).classList.add('active');
    renderNotes(button.dataset.tab);
  };
});

document.querySelector('#newGrant').onclick = () => openGrant(current);
document.querySelector('.right').onclick = () => openRole('create');
document.querySelector('#showTemp').onclick = () => setDrawer('临时全量账号名单', `
  <div class="field"><label>覆盖规则</label><p class="help">上线时冻结的有效历史账号，范围随产品新增动态扩展；新注册账号不自动加入。</p></div>
  <div class="field"><label>演示名单</label><div class="scope"><span class="chip">赵敏</span><span class="chip">李哲</span><span class="chip">其余 10 人</span></div><p class="help">管理员移除后立即失效，且不会自动回加。</p></div>
`, '关闭', 'detail');
document.querySelectorAll('#products .op').forEach(button => {
  button.onclick = () => openProductAuth(button.closest('tr').querySelector('td').textContent.trim());
});
document.querySelector('#close').onclick = closeDrawer;
document.querySelector('#cancel').onclick = closeDrawer;
document.querySelector('#drawer .mask').onclick = closeDrawer;
document.querySelector('#confirm').onclick = () => {
  if (drawerMode === 'grant') {
    const product = document.querySelector('#product').value;
    if (!product) return toast('请选择需授权的产品');
    if (!current.direct.includes(product)) current.direct.push(product);
    renderRows();
    closeDrawer();
    toast('授权已生效，可立即按新范围访问产品数据');
    return;
  }
  if (drawerMode === 'createRole') {
    const name = document.querySelector('#roleName').value.trim();
    const owner = document.querySelector('#roleOwner').value;
    const products = [...document.querySelectorAll('#roleProducts input:checked')].map(input => input.value);
    if (!name) return toast('请填写数据角色名称');
    if (dataRoles.some(role => role.name === name)) return toast('数据角色名称已存在');
    if (!owner) return toast('请选择角色负责人');
    if (!products.length) return toast('请选择至少一个授权产品');
    const role = { name, owner, members: 0, products };
    dataRoles.push(role);
    renderNewRoleRow(role);
    closeDrawer();
    toast('数据角色已创建，可继续管理成员');
    return;
  }
  if (drawerMode === 'members') {
    if (memberAdded) {
      activeRole.members += 1;
      const roleIndex = dataRoles.indexOf(activeRole);
      const row = document.querySelectorAll('#roles tbody tr')[roleIndex];
      if (row) row.children[2].textContent = `${activeRole.members} 人`;
    }
    closeDrawer();
    toast(`成员已保存；${activeRole.name} 的有效产品范围已重新计算`);
    return;
  }
  closeDrawer();
};

renderRows();
bindRoleActions();
bindFilterActions();
renderNotes('users');
