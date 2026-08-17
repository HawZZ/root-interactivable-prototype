const users = [
  { name: "陈薇", mail: "chen.wei@momcozy.com", erp: "产品经理", direct: ["W1 Lite"], roles: ["北美泵产品组"] },
  { name: "王琳", mail: "wang.lin@momcozy.com", erp: "运营专员", direct: [], roles: ["欧洲运营组"] },
  { name: "赵敏", mail: "zhao.min@momcozy.com", erp: "历史账号", direct: [], roles: ["系统临时全量角色"] }
];

const dataRoles = [
  { name: "北美泵产品组", owner: "王琳", enabled: true, memberNames: ["陈薇", "周凯", "李宁", "Sofia", "韩雪", "赵敏", "Luca", "Mila"], products: ["W1 Lite", "S12 Pro", "M5"] },
  { name: "欧洲运营组", owner: "李浩", enabled: true, memberNames: ["王琳", "Ana", "Luca", "Mila", "周凯"], products: ["S12 Pro", "V2"] },
  { name: "系统临时全量角色", owner: "全局管理员", enabled: true, memberNames: ["赵敏", "李哲", "林丹", "Grace", "Daisy", "Tom", "Eric", "Nina", "王超", "小陈", "Jasper", "Lily"], products: [], dynamicAll: true }
];

const iotAccounts = [
  ["全局管理员", "globaladmin", "admin@momcozy.com"], ["陈薇", "chenwei", "chen.wei@momcozy.com"], ["王琳", "wanglin", "wang.lin@momcozy.com"],
  ["李浩", "lihao", "li.hao@momcozy.com"], ["周凯", "zhoukai", "zhou.kai@momcozy.com"],
  ["赵敏", "zhaomin", "zhao.min@momcozy.com"], ["韩雪", "hanxue", "han.xue@momcozy.com"],
  ["Sofia", "sofia", "sofia@momcozy.com"], ["Ana", "ana", "ana@momcozy.com"],
  ["Luca", "luca", "luca@momcozy.com"], ["Mila", "mila", "mila@momcozy.com"],
  ["李哲", "lizhe", "li.zhe@momcozy.com"], ["林丹", "lindan", "lin.dan@momcozy.com"]
].map(([name, pinyin, mail]) => ({ name, pinyin, mail }));

const productCatalog = [
  ["W1 Lite", "P-10001"], ["S12 Pro", "P-10002"], ["M5", "P-10003"], ["V2", "P-10004"],
  ["S9 Pro", "P-10005"], ["M6", "P-10006"], ["W2", "P-10007"], ["C1", "P-10008"],
  ["P1 Max", "P-10009"], ["S10", "P-10010"], ["M7", "P-10011"], ["W3", "P-10012"],
  ["C2", "P-10013"], ["P2", "P-10014"], ["S11", "P-10015"], ["M8", "P-10016"],
  ["W4", "P-10017"], ["C3", "P-10018"], ["P3", "P-10019"], ["S13", "P-10020"]
].map(([name, id]) => ({ name, id }));

const notes = {
  users: [
    ["页面可见范围", "仅 IoT 平台管理员可见；管理员资格由 ERP 配置的数据权限管理页面/动作功能授权决定，本页不修改 ERP 权限。"],
    ["有效范围", "用户直授产品与所属数据角色产品取并集；任一来源为“全部产品（动态）”时，有效范围即为动态全部产品。"],
    ["用户授权", "授权入口仅在用户列表的“管理授权”。指定产品通过搜索添加；全部产品会自动覆盖后续新建产品。"],
    ["系统临时全量角色", "历史全量账号作为“系统临时全量角色”在数据角色页管理，不再作为用户状态展示。"]
  ],
  roles: [
    ["数据角色", "角色含负责人、成员与授权产品；负责人只管理成员，不自动取得产品访问权。"],
    ["系统临时全量角色", "该角色的产品范围为全部产品（动态），成员仅为切换上线时冻结的有效历史账号。"],
    ["成员管理", "点击“管理成员”后搜索 IoT 平台账号；产品范围仅全局管理员可维护。"]
  ],
  drawer: [
    ["抽屉操作", "确认按钮根据当前操作执行校验。取消、关闭或点击遮罩均不保存变更。"],
    ["账号来源", "负责人和成员候选均来自 ERP 已分配/同步到 IoT 平台的账号，可按姓名、拼音或邮箱搜索。"]
  ]
};

let current = users[0];
let drawerMode = "grant";
let activeRole = null;
let selectedMember = null;
let grantDraft = null;
let roleDraft = null;
let memberDraft = null;

function toast(message) {
  const element = document.querySelector("#toast");
  element.textContent = message;
  element.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => element.classList.remove("show"), 2600);
}

function roleProductLabel(role) {
  return role.dynamicAll ? "全部产品（动态）" : role.products.join("、");
}

function directProductLabel(user) {
  return user.direct.length ? user.direct.join("、") : "—";
}

function calculateScope(user) {
  const roles = user.roles.map(name => dataRoles.find(role => role.name === name)).filter(Boolean);
  if (roles.some(role => role.dynamicAll)) return "全部产品（动态）";
  return [...new Set([...user.direct, ...roles.flatMap(role => role.products)])].join("、") || "—";
}

function renderNotes(tab, context) {
  const label = { users: "用户授权 · 页面态", roles: "数据角色 · 页面态", drawer: "操作抽屉 · 当前状态" };
  document.querySelector("#noteContext").textContent = context || label[tab];
  document.querySelector("#notes").innerHTML = notes[tab].map((note, index) =>
    "<article class='note'><span class='num'>" + (index + 1) + "</span><b>" + note[0] + "</b><span>" + note[1] + "</span></article>"
  ).join("");
}

function renderRows() {
  document.querySelector("#userRows").innerHTML = users.map((user, index) =>
    "<tr><td><b>" + user.name + "</b><br><small>" + user.mail + "</small></td><td>" + user.erp +
    "</td><td>" + directProductLabel(user) + "</td><td>" + user.roles.join("、") + "</td><td>" +
    calculateScope(user) + "</td><td><button class='op' data-user='" + index + "'>管理授权</button></td></tr>"
  ).join("");
  document.querySelectorAll("[data-user]").forEach(button => {
    button.onclick = () => openGrant(users[Number(button.dataset.user)]);
  });
}

function setDrawer(title, body, confirmText, mode) {
  drawerMode = mode;
  document.querySelector("#drawerTitle").textContent = title;
  document.querySelector("#drawerBody").innerHTML = body;
  document.querySelector("#confirm").textContent = confirmText;
  document.querySelector("#drawer").classList.add("open");
  renderNotes("drawer", title + " · 抽屉态");
}

function closeDrawer() {
  document.querySelector("#drawer").classList.remove("open");
  grantDraft = null;
  renderNotes(document.querySelector(".tab.active").dataset.tab);
}

function bindAccountSearch(inputId, listId, excludedNames, onPick) {
  const input = document.querySelector("#" + inputId);
  const list = document.querySelector("#" + listId);
  const render = () => {
    const keyword = input.value.trim().toLowerCase();
    const matches = iotAccounts.filter(account => {
      const searchable = (account.name + " " + account.pinyin + " " + account.mail).toLowerCase();
      return !excludedNames.includes(account.name) && (!keyword || searchable.includes(keyword));
    });
    list.innerHTML = matches.length ? matches.map(account =>
      "<button type='button' class='account-option' data-mail='" + account.mail + "'><b>" + account.name +
      "</b><span>" + account.mail + " · " + account.pinyin + "</span></button>"
    ).join("") : "<p class='help'>未找到匹配的 IoT 平台账号。</p>";
    list.querySelectorAll(".account-option").forEach(button => {
      button.onclick = () => {
        const account = iotAccounts.find(item => item.mail === button.dataset.mail);
        input.value = account.name + "（" + account.mail + "）";
        input.dataset.accountMail = account.mail;
        onPick(account);
        list.innerHTML = "";
      };
    });
  };
  input.oninput = () => { delete input.dataset.accountMail; render(); };
  input.onfocus = render;
  if (input.dataset.accountMail) list.innerHTML = "";
  else render();
}

function renderGrantProductPicker() {
  const host = document.querySelector("#grantProducts");
  host.innerHTML = "<input class='el-input' id='productSearch' placeholder='搜索产品名称或产品 ID（共 " +
    productCatalog.length + " 个产品）'><div class='account-suggestions' id='productSuggestions'></div><div class='scope' id='selectedProducts'>" +
    (grantDraft.direct.length ? grantDraft.direct.map(name => "<span class='chip'>" + name + " <button class='op danger' data-remove-product='" + name + "'>×</button></span>").join("") : "尚未选择指定产品") + "</div>";
  const input = document.querySelector("#productSearch");
  const list = document.querySelector("#productSuggestions");
  const render = () => {
    const keyword = input.value.trim().toLowerCase();
    const matches = productCatalog.filter(product => !grantDraft.direct.includes(product.name) &&
      (!keyword || (product.name + " " + product.id).toLowerCase().includes(keyword))).slice(0, 8);
    list.innerHTML = matches.length ? matches.map(product =>
      "<button type='button' class='account-option' data-product='" + product.name + "'><b>" + product.name +
      "</b><span>" + product.id + "</span></button>"
    ).join("") : "<p class='help'>没有可添加的匹配产品。</p>";
    list.querySelectorAll("[data-product]").forEach(button => {
      button.onclick = () => { grantDraft.direct.push(button.dataset.product); renderGrantProductPicker(); };
    });
  };
  input.oninput = render;
  input.onfocus = render;
  render();
  document.querySelectorAll("[data-remove-product]").forEach(button => {
    button.onclick = () => {
      grantDraft.direct = grantDraft.direct.filter(name => name !== button.dataset.removeProduct);
      renderGrantProductPicker();
    };
  });
}

function renderGrantRolePicker() {
  const host = document.querySelector("#grantRoles");
  host.innerHTML = "<input class='el-input' id='roleSearch' placeholder='搜索数据角色名称'><div class='account-suggestions' id='roleSuggestions'></div><div class='scope' id='selectedRoles'>" +
    (grantDraft.roles.length ? grantDraft.roles.map(name => {
      const role = dataRoles.find(item => item.name === name);
      const removable = role && role.dynamicAll ? "" : " <button class='op danger' data-remove-role='" + name + "'>×</button>";
      return "<span class='chip'>" + name + removable + "</span>";
    }).join("") : "暂无数据角色授权") + "</div>";
  const input = document.querySelector("#roleSearch");
  const list = document.querySelector("#roleSuggestions");
  const render = () => {
    const keyword = input.value.trim().toLowerCase();
    const matches = dataRoles.filter(role => !role.dynamicAll && !grantDraft.roles.includes(role.name) &&
      (!keyword || role.name.toLowerCase().includes(keyword)));
    list.innerHTML = matches.length ? matches.map(role =>
      "<button type='button' class='account-option' data-role='" + role.name + "'><b>" + role.name +
      "</b><span>" + roleProductLabel(role) + "</span></button>"
    ).join("") : "<p class='help'>没有可添加的匹配数据角色。</p>";
    list.querySelectorAll("[data-role]").forEach(button => {
      button.onclick = () => { grantDraft.roles.push(button.dataset.role); renderGrantRolePicker(); };
    });
  };
  input.oninput = render;
  input.onfocus = render;
  render();
  document.querySelectorAll("[data-remove-role]").forEach(button => {
    button.onclick = () => {
      grantDraft.roles = grantDraft.roles.filter(name => name !== button.dataset.removeRole);
      renderGrantRolePicker();
    };
  });
}

function openGrant(user) {
  current = user;
  grantDraft = { direct: [...user.direct], roles: [...user.roles] };
  setDrawer("管理用户授权 · " + user.name,
    "<div class='field'><label>IoT 平台账号</label><input class='el-input' value='" + user.name + "（" + user.mail +
    "）' disabled><p class='help'>账号由 ERP 分配并同步至 IoT 平台；本页仅维护 IoT 产品数据授权，不修改 ERP 账号、角色或页面权限。</p></div>" +
    "<div class='field'><label>直接授权产品</label><p class='help'>用户直授仅支持指定产品，可按名称或产品 ID 检索后多选。</p><div id='grantProducts'></div></div>" +
    "<div class='field'><label>从属数据角色</label><p class='help'>可加入多个数据角色；系统临时全量角色仅由上线冻结名单管理，不能在此新增。</p><div id='grantRoles'></div></div>",
    "确认授权", "grant");
  renderGrantProductPicker();
  renderGrantRolePicker();
}

function renderRoleProductPicker() {
  const host = document.querySelector("#roleProductPicker");
  if (roleDraft.dynamicAll) {
    host.innerHTML = "<div class='scope'>全部产品（动态）<p class='help'>包含现有全部产品与后续新建产品。</p></div>";
    return;
  }
  host.innerHTML = "<input class='el-input' id='roleProductSearch' placeholder='搜索产品名称或产品 ID（共 " + productCatalog.length + " 个产品）'><div class='account-suggestions' id='roleProductSuggestions'></div><div class='scope'>" +
    (roleDraft.products.length ? roleDraft.products.map(name => "<span class='chip'>" + name + " <button class='op danger' data-remove-role-product='" + name + "'>×</button></span>").join("") : "尚未选择指定产品") + "</div>";
  const input = document.querySelector("#roleProductSearch");
  const list = document.querySelector("#roleProductSuggestions");
  const render = () => {
    const keyword = input.value.trim().toLowerCase();
    const matches = productCatalog.filter(product => !roleDraft.products.includes(product.name) && (!keyword || (product.name + " " + product.id).toLowerCase().includes(keyword))).slice(0, 8);
    list.innerHTML = matches.length ? matches.map(product => "<button type='button' class='account-option' data-role-product='" + product.name + "'><b>" + product.name + "</b><span>" + product.id + "</span></button>").join("") : "<p class='help'>没有可添加的匹配产品。</p>";
    list.querySelectorAll("[data-role-product]").forEach(button => {
      button.onclick = () => { roleDraft.products.push(button.dataset.roleProduct); renderRoleProductPicker(); };
    });
  };
  input.oninput = render;
  input.onfocus = render;
  render();
  document.querySelectorAll("[data-remove-role-product]").forEach(button => {
    button.onclick = () => { roleDraft.products = roleDraft.products.filter(name => name !== button.dataset.removeRoleProduct); renderRoleProductPicker(); };
  });
}

function openRoleEditor(role) {
  activeRole = role || null;
  roleDraft = role ? { name: role.name, owner: role.owner, enabled: role.enabled, dynamicAll: !!role.dynamicAll, products: [...role.products] } : { name: "", owner: "", enabled: true, dynamicAll: false, products: [] };
  const owner = iotAccounts.find(account => account.name === roleDraft.owner);
  setDrawer((role ? "编辑数据角色 · " : "新建数据角色") + (role ? role.name : ""),
    "<div class='field'><label>角色名称 <em style='color:#f56c6c'>*</em></label><input class='el-input' id='roleName' value='" + roleDraft.name + "' placeholder='例如：日本泵产品组'></div>" +
    "<div class='field'><label>角色负责人 <em style='color:#f56c6c'>*</em></label><input class='el-input' id='roleOwner' value='" + (owner ? owner.name + "（" + owner.mail + "）" : roleDraft.owner) + "' placeholder='搜索姓名、拼音或邮箱'><div class='account-suggestions' id='roleOwnerSuggestions'></div><p class='help'>候选来源为 IoT 平台账号，可按姓名、拼音或邮箱模糊搜索。</p></div>" +
    "<div class='field'><label>状态</label><select class='el-select' id='roleStatus'><option value='enabled' " + (roleDraft.enabled ? "selected" : "") + ">启用</option><option value='disabled' " + (!roleDraft.enabled ? "selected" : "") + ">停用</option></select></div>" +
    "<div class='field'><label>授权产品 <em style='color:#f56c6c'>*</em></label><div class='scope'><label><input type='radio' name='roleMode' value='specified' " + (!roleDraft.dynamicAll ? "checked" : "") + "> 指定产品</label><label style='margin-left:20px'><input type='radio' name='roleMode' value='all' " + (roleDraft.dynamicAll ? "checked" : "") + "> 全部产品（动态）</label></div><p class='help'>数据角色支持指定产品或动态全部产品。</p><div id='roleProductPicker'></div></div>",
    role ? "保存角色" : "创建角色", "saveRole");
  if (owner) document.querySelector("#roleOwner").dataset.accountMail = owner.mail;
  bindAccountSearch("roleOwner", "roleOwnerSuggestions", [], account => { roleDraft.owner = account.name; });
  document.querySelectorAll("input[name='roleMode']").forEach(input => {
    input.onchange = () => { roleDraft.dynamicAll = input.value === "all"; renderRoleProductPicker(); };
  });
  renderRoleProductPicker();
}

function openRoleMembers(role, preserveDraft) {
  activeRole = role;
  if (!preserveDraft) memberDraft = [...role.memberNames];
  setDrawer("管理成员 · " + role.name,
    "<div class='field'><label>当前成员</label><div class='scope' id='memberList'>" +
    (memberDraft.length ? memberDraft.map(name => "<span class='chip'>" + name + " <button class='op danger' data-remove-member='" + name + "'>×</button></span>").join("") : "暂无成员") +
    "</div><button class='op' id='addMember'>+ 添加成员</button><p class='help'>" + (role.dynamicAll ? "系统临时全量角色只允许按冻结名单移除成员，不支持新增。" : "成员来源为 IoT 平台账号，可按姓名、拼音或邮箱搜索。") + "</p></div>",
    "保存成员", "members");
  document.querySelectorAll("[data-remove-member]").forEach(button => {
    button.onclick = () => { memberDraft = memberDraft.filter(name => name !== button.dataset.removeMember); openRoleMembers(role, true); };
  });
  document.querySelector("#addMember").onclick = () => {
    if (role.dynamicAll) return toast("系统临时全量角色不支持新增成员");
    openMemberPicker(role);
  };
}

function openMemberPicker(role) {
  selectedMember = null;
  setDrawer("添加成员 · " + role.name,
    "<div class='field'><label>选择 IoT 平台账号 <em style='color:#f56c6c'>*</em></label><input class='el-input' id='memberSearch' placeholder='搜索姓名、拼音或邮箱'><div class='account-suggestions' id='memberSuggestions'></div><p class='help'>已是成员的账号不会重复出现。</p></div><div class='field'><label>待添加成员</label><div class='scope' id='selectedMember'>请选择一个 IoT 平台账号</div></div>",
    "添加成员", "addMember");
  bindAccountSearch("memberSearch", "memberSuggestions", memberDraft, account => {
    selectedMember = account;
    document.querySelector("#selectedMember").innerHTML = "<span class='chip'>" + account.name + " · " + account.mail + "</span>";
  });
}

function renderRoleRows() {
  document.querySelector("#roles tbody").innerHTML = dataRoles.map((role, index) =>
    "<tr><td><b>" + role.name + "</b></td><td>" + role.owner + "</td><td>" + role.memberNames.length + " 人</td><td>" + roleProductLabel(role) + "</td><td><span class='tag " + (role.enabled ? "success" : "info") + "'>" + (role.enabled ? "启用" : "停用") + "</span></td><td><button class='op' data-role-edit='" + index + "'>编辑</button><i>|</i><button class='op' data-role-members='" + index + "'>管理成员</button></td></tr>"
  ).join("");
  document.querySelectorAll("[data-role-edit]").forEach(button => { button.onclick = () => openRoleEditor(dataRoles[Number(button.dataset.roleEdit)]); });
  document.querySelectorAll("[data-role-members]").forEach(button => { button.onclick = () => openRoleMembers(dataRoles[Number(button.dataset.roleMembers)]); });
}

function bindFilterActions() {
  document.querySelectorAll(".filters").forEach(filters => {
    filters.querySelectorAll(".el-btn").forEach(button => {
      if (button.classList.contains("right")) return;
      button.onclick = () => {
        const input = filters.querySelector("input");
        if (button.textContent.trim() === "重置") {
          if (input) input.value = "";
          toast("筛选条件已重置");
        } else {
          toast(input && input.value.trim() ? "已按“" + input.value.trim() + "”查询（演示数据）" : "已刷新全部结果（演示数据）");
        }
      };
    });
  });
}

document.querySelectorAll(".tab").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".tab, .view").forEach(element => element.classList.remove("active"));
    button.classList.add("active");
    document.querySelector("#" + button.dataset.tab).classList.add("active");
    renderNotes(button.dataset.tab);
  };
});
document.querySelector(".right").onclick = () => openRoleEditor(null);
document.querySelector("#close").onclick = closeDrawer;
document.querySelector("#cancel").onclick = closeDrawer;
document.querySelector("#drawer .mask").onclick = closeDrawer;
document.querySelector("#confirm").onclick = () => {
  if (drawerMode === "grant") {
    const previousRoles = [...current.roles];
    current.direct = [...grantDraft.direct];
    current.roles = [...grantDraft.roles];
    previousRoles.forEach(name => {
      if (!current.roles.includes(name)) {
        const role = dataRoles.find(item => item.name === name);
        if (role) role.memberNames = role.memberNames.filter(member => member !== current.name);
      }
    });
    current.roles.forEach(name => {
      if (!previousRoles.includes(name)) {
        const role = dataRoles.find(item => item.name === name);
        if (role && !role.memberNames.includes(current.name)) role.memberNames.push(current.name);
      }
    });
    renderRows();
    renderRoleRows();
    closeDrawer();
    toast("用户的指定产品直授与数据角色归属已保存");
    return;
  }
  if (drawerMode === "saveRole") {
    const name = document.querySelector("#roleName").value.trim();
    const ownerInput = document.querySelector("#roleOwner");
    const owner = iotAccounts.find(account => account.mail === ownerInput.dataset.accountMail)?.name;
    const enabled = document.querySelector("#roleStatus").value === "enabled";
    if (!name) return toast("请填写数据角色名称");
    if (dataRoles.some(role => role.name === name && role !== activeRole)) return toast("数据角色名称已存在");
    if (!owner) return toast("请从 IoT 平台账号搜索结果中选择角色负责人");
    if (!roleDraft.dynamicAll && !roleDraft.products.length) return toast("请选择至少一个指定产品，或选择全部产品（动态）");
    if (activeRole) {
      const oldName = activeRole.name;
      activeRole.name = name;
      activeRole.owner = owner;
      activeRole.enabled = enabled;
      activeRole.dynamicAll = roleDraft.dynamicAll;
      activeRole.products = roleDraft.dynamicAll ? [] : [...roleDraft.products];
      users.forEach(user => { user.roles = user.roles.map(roleName => roleName === oldName ? name : roleName); });
    } else {
      dataRoles.push({ name, owner, enabled, memberNames: [], products: roleDraft.dynamicAll ? [] : [...roleDraft.products], dynamicAll: roleDraft.dynamicAll });
    }
    renderRows();
    renderRoleRows();
    closeDrawer();
    toast(activeRole ? "数据角色已保存" : "数据角色已创建，可继续管理成员");
    return;
  }
  if (drawerMode === "addMember") {
    if (!selectedMember) return toast("请从 IoT 平台账号搜索结果中选择成员");
    memberDraft.push(selectedMember.name);
    openRoleMembers(activeRole, true);
    toast("已加入待保存成员列表");
    return;
  }
  if (drawerMode === "members") {
    const previousMembers = [...activeRole.memberNames];
    activeRole.memberNames = [...memberDraft];
    users.forEach(user => {
      if (previousMembers.includes(user.name) && !memberDraft.includes(user.name)) {
        user.roles = user.roles.filter(roleName => roleName !== activeRole.name);
      }
      if (!previousMembers.includes(user.name) && memberDraft.includes(user.name) && !user.roles.includes(activeRole.name)) {
        user.roles.push(activeRole.name);
      }
    });
    renderRoleRows();
    renderRows();
    closeDrawer();
    toast("成员已保存；产品访问范围已重新计算");
    return;
  }
  closeDrawer();
};

renderRows();
renderRoleRows();
bindFilterActions();
renderNotes("users");
