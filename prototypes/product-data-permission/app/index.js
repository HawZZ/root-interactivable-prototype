const users = [
  { name: '陈薇', mail: 'chen.wei@momcozy.com', erp: '产品经理', direct: ['W1 Lite'], roles: ['北美泵产品组'], scope: 'W1 Lite、S12 Pro、M5', status: '已授权' },
  { name: '王琳', mail: 'wang.lin@momcozy.com', erp: '运营专员', direct: [], roles: ['欧洲运营组'], scope: 'S12 Pro、V2', status: '已授权' },
  { name: '赵敏', mail: 'zhao.min@momcozy.com', erp: '历史账号', direct: [], roles: ['系统临时全量角色'], scope: '全部产品（动态）', status: '临时全量' }
];

const dataRoles = [
  { name: '北美泵产品组', owner: '王琳', members: 8, memberNames: ['陈薇', '周凯', '李宁', 'Sofia', '韩雪', '赵敏', 'Luca', 'Mila'], products: ['W1 Lite', 'S12 Pro', 'M5'] },
  { name: '欧洲运营组', owner: '李浩', members: 5, memberNames: ['王琳', 'Ana', 'Luca', 'Mila', '周凯'], products: ['S12 Pro', 'V2'] }
];

const iotAccounts = [
  { name: '陈薇', pinyin: 'chenwei', mail: 'chen.wei@momcozy.com' },
  { name: '王琳', pinyin: 'wanglin', mail: 'wang.lin@momcozy.com' },
  { name: '李浩', pinyin: 'lihao', mail: 'li.hao@momcozy.com' },
  { name: '周凯', pinyin: 'zhoukai', mail: 'zhou.kai@momcozy.com' },
  { name: '赵敏', pinyin: 'zhaomin', mail: 'zhao.min@momcozy.com' },
  { name: '韩雪', pinyin: 'hanxue', mail: 'han.xue@momcozy.com' },
  { name: 'Sofia', pinyin: 'sofia', mail: 'sofia@momcozy.com' },
  { name: 'Ana', pinyin: 'ana', mail: 'ana@momcozy.com' },
  { name: 'Luca', pinyin: 'luca', mail: 'luca@momcozy.com' },
  { name: 'Mila', pinyin: 'mila', mail: 'mila@momcozy.com' }
];

const notes = {
  users: [
    ['页面可见范围', '仅 IoT 平台管理员可见；管理员资格由 ERP 配置的数据权限管理页面/动作功能授权决定，本页不修改 ERP 权限。'],
    ['有效范围', '直授产品与所属数据角色产品取并集；表格展示来源与计算结果。'],
    ['临时全量账号', '仅上线时冻结的有效历史账号加入；新账号不加入，移除立即失效且不会自动回加。'],
    ['用户授权', '全局管理员可新增/撤销直授产品；角色负责人不可修改此范围。']
  ],
  roles: [
    ['数据角色', '角色含负责人、成员与授权产品；负责人只管理成员，不自动取得产品访问权。'],
    ['新建角色', '角色名称、负责人和授权产品为必填项；提交成功后立即可用于授权范围计算。'],
    ['成员管理', '点击“管理成员”进入成员维护；产品范围仅全局管理员可维护。']
  ],
  drawer: [
    ['抽屉操作', '确认按钮根据当前操作执行校验。取消或关闭不保存任何变更。'],
    ['权限边界', '示例以全局管理员视角展示；负责人仅可维护其角色成员。']
  ]
};

let current = users[0];
let drawerMode = 'grant';
let activeRole = null;
let selectedMember = null;

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

function bindAccountSearch(inputId, listId, excludedNames, onPick) {
  const input = document.querySelector(`#${inputId}`);
  const list = document.querySelector(`#${listId}`);
  const render = () => {
    const keyword = input.value.trim().toLowerCase();
    const matches = iotAccounts.filter(account => {
      const searchable = `${account.name} ${account.pinyin} ${account.mail}`.toLowerCase();
      return !excludedNames.includes(account.name) && (!keyword || searchable.includes(keyword));
    });
    list.innerHTML = matches.length ? matches.map(account => `
      <button type="button" class="account-option" data-mail="${account.mail}">
        <b>${account.name}</b><span>${account.mail} · ${account.pinyin}</span>
      </button>
    `).join('') : '<p class="help">未找到匹配的 IoT 平台账号。</p>';
    list.querySelectorAll('.account-option').forEach(button => {
      button.onclick = () => {
        const account = iotAccounts.find(item => item.mail === button.dataset.mail);
        input.value = `${account.name}（${account.mail}）`;
        input.dataset.accountMail = account.mail;
        onPick(account);
        list.innerHTML = '';
      };
    });
  };
  input.oninput = () => {
    delete input.dataset.accountMail;
    render();
  };
  input.onfocus = render;
  render();
}

function openGrant(user) {
  current = user;
  setDrawer(`用户授权 · ${user.name}`, `
    <div class="field"><label>IoT 平台账号</label><input class="el-input" value="${user.name}（${user.mail}）" disabled><p class="help">账号由 ERP 分配并同步至 IoT 平台；本页仅维护 IoT 产品数据授权，不修改 ERP 账号、角色或页面权限。</p></div>
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
      <div class="field"><label>角色负责人 <em style="color:#f56c6c">*</em></label><input class="el-input" id="roleOwner" placeholder="搜索姓名、拼音或邮箱"><div class="account-suggestions" id="roleOwnerSuggestions"></div><p class="help">候选来源为 IoT 平台账号，可按姓名、拼音或邮箱模糊搜索；负责人仅可维护本角色成员，不自动获得产品访问权。</p></div>
      <div class="field"><label>授权产品 <em style="color:#f56c6c">*</em></label><div class="scope" id="roleProducts"><label><input type="checkbox" value="W1 Lite"> W1 Lite</label><label><input type="checkbox" value="S12 Pro"> S12 Pro</label><label><input type="checkbox" value="M5"> M5</label><label><input type="checkbox" value="V2"> V2</label></div><p class="help">仅全局管理员可配置产品范围。</p></div>
    `, '创建角色', 'createRole');
    bindAccountSearch('roleOwner', 'roleOwnerSuggestions', [], () => {});
    return;
  }

  if (mode === 'members') {
    setDrawer(`管理成员 · ${role.name}`, `
      <div class="field"><label>角色负责人</label><input class="el-input" value="${role.owner}" disabled></div>
      <div class="field"><label>授权产品</label><div class="scope">${role.products.map(product => `<span class="chip">${product}</span>`).join('')}</div><p class="help">角色负责人不可修改产品范围。</p></div>
      <div class="field"><label>当前成员</label><div class="scope" id="memberList">${role.memberNames.map(name => `<span class="chip">${name}</span>`).join('')}</div><button class="op" id="addMember">+ 添加成员</button><p class="help">成员来源为 IoT 平台账号；保存后，成员的产品访问范围立即重新计算。</p></div>
    `, '保存成员', 'members');
    document.querySelector('#addMember').onclick = () => openMemberPicker(role);
    return;
  }

  setDrawer(`数据角色详情 · ${role.name}`, `
    <div class="field"><label>角色负责人</label><input class="el-input" value="${role.owner}" disabled></div>
    <div class="field"><label>成员数</label><input class="el-input" value="${role.members} 人" disabled></div>
    <div class="field"><label>授权产品</label><div class="scope">${role.products.map(product => `<span class="chip">${product}</span>`).join('')}</div></div>
    <p class="help">查看态不提供修改入口；如需维护成员，请使用“管理成员”。</p>
  `, '关闭', 'detail');
}

function openMemberPicker(role) {
  activeRole = role;
  selectedMember = null;
  setDrawer(`添加成员 · ${role.name}`, `
    <div class="field"><label>选择 IoT 平台账号 <em style="color:#f56c6c">*</em></label><input class="el-input" id="memberSearch" placeholder="搜索姓名、拼音或邮箱"><div class="account-suggestions" id="memberSuggestions"></div><p class="help">仅可添加已由 ERP 分配到 IoT 平台的账号；已是成员的账号不会重复出现。</p></div>
    <div class="field"><label>待添加成员</label><div class="scope" id="selectedMember">请选择一个 IoT 平台账号</div></div>
  `, '添加成员', 'addMember');
  bindAccountSearch('memberSearch', 'memberSuggestions', role.memberNames, account => {
    selectedMember = account;
    document.querySelector('#selectedMember').innerHTML = `<span class="chip">${account.name} · ${account.mail}</span>`;
  });
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
    const ownerInput = document.querySelector('#roleOwner');
    const owner = iotAccounts.find(account => account.mail === ownerInput.dataset.accountMail)?.name;
    const products = [...document.querySelectorAll('#roleProducts input:checked')].map(input => input.value);
    if (!name) return toast('请填写数据角色名称');
    if (dataRoles.some(role => role.name === name)) return toast('数据角色名称已存在');
    if (!ownerInput.dataset.accountMail) return toast('请从 IoT 平台账号搜索结果中选择角色负责人');
    if (!products.length) return toast('请选择至少一个授权产品');
    const role = { name, owner, members: 0, memberNames: [], products };
    dataRoles.push(role);
    renderNewRoleRow(role);
    closeDrawer();
    toast('数据角色已创建，可继续管理成员');
    return;
  }
  if (drawerMode === 'addMember') {
    if (!selectedMember) return toast('请从 IoT 平台账号搜索结果中选择成员');
    activeRole.memberNames.push(selectedMember.name);
    activeRole.members = activeRole.memberNames.length;
    const roleIndex = dataRoles.indexOf(activeRole);
    const row = document.querySelectorAll('#roles tbody tr')[roleIndex];
    if (row) row.children[2].textContent = `${activeRole.members} 人`;
    closeDrawer();
    toast(`已添加 ${selectedMember.name}；产品访问范围已重新计算`);
    return;
  }
  if (drawerMode === 'members') {
    closeDrawer();
    toast(`${activeRole.name} 的成员维护已完成`);
    return;
  }
  closeDrawer();
};

renderRows();
bindRoleActions();
bindFilterActions();
renderNotes('users');
