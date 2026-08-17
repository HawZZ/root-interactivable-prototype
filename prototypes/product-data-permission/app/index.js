const users = [
  { name: "陈薇", mail: "chen.wei@momcozy.com", erp: "产品经理", directMode: "specified", direct: ["W1 Lite"], roles: ["北美泵产品组"] },
  { name: "王琳", mail: "wang.lin@momcozy.com", erp: "运营专员", directMode: "specified", direct: [], roles: ["欧洲运营组"] },
  { name: "赵敏", mail: "zhao.min@momcozy.com", erp: "历史账号", directMode: "specified", direct: [], roles: ["系统临时全量角色"] }
];

const dataRoles = [
  { name: "北美泵产品组", owner: "王琳", memberNames: ["陈薇", "周凯", "李宁", "Sofia", "韩雪", "赵敏", "Luca", "Mila"], products: ["W1 Lite", "S12 Pro", "M5"] },
  { name: "欧洲运营组", owner: "李浩", memberNames: ["王琳", "Ana", "Luca", "Mila", "周凯"], products: ["S12 Pro", "V2"] },
  { name: "系统临时全量角色", owner: "全局管理员", memberNames: ["赵敏", "李哲", "林丹", "Grace", "Daisy", "Tom", "Eric", "Nina", "王超", "小陈", "Jasper", "Lily"], products: [], dynamicAll: true }
];

const iotAccounts = [
  ["陈薇", "chenwei", "chen.wei@momcozy.com"], ["王琳", "wanglin", "wang.lin@momcozy.com"],
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
  return user.directMode === "all" ? "全部产品（动态）" : (user.direct.length ? user.direct.join("、") : "—");
}

function calculateScope(user) {
  const roles = user.roles.map(name => dataRoles.find(role => role.name === name)).filter(Boolean);
  if (user.directMode === "all" || roles.some(role => role.dynamicAll)) return "全部产品（动态）";
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
  render();
}

function renderGrantProductPicker() {
  const host = document.querySelector("#grantProducts");
  if (grantDraft.mode === "all") {
    host.innerHTML = "<div class='scope'>全部产品（动态）<p class='help'>包括现有全部产品及后续新建产品；撤销后立即按剩余授权来源计算范围。</p></div>";
    return;
  }
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

function openGrant(user) {
  current = user;
  grantDraft = { mode: user.directMode, direct: [...user.direct] };
  setDrawer("管理用户授权 · " + user.name,
    "<div class='field'><label>IoT 平台账号</label><input class='el-input' value='" + user.name + "（" + user.mail +
    "）' disabled><p class='help'>账号由 ERP 分配并同步至 IoT 平台；本页仅维护 IoT 产品数据授权，不修改 ERP 账号、角色或页面权限。</p></div>" +
    "<div class='field'><label>授权产品 <em style='color:#f56c6c'>*</em></label><div class='scope'>" +
    "<label><input type='radio' name='grantMode' value='specified' " + (grantDraft.mode === "specified" ? "checked" : "") + "> 指定产品</label>" +
    "<label style='margin-left:20px'><input type='radio' name='grantMode' value='all' " + (grantDraft.mode === "all" ? "checked" : "") + "> 全部产品（动态）</label></div>" +
    "<p class='help'>指定产品可按名称或产品 ID 检索后多选；全部产品会动态覆盖后续新建产品。</p><div id='grantProducts'></div></div>" +
    "<div class='field'><label>数据角色来源</label><div class='scope'>" + user.roles.map(role => "<span class='chip'>" + role + "</span>").join("") +
    "</div><p class='help'>直授变更不会移除数据角色带来的产品范围。</p></div>",
    "确认授权", "grant");
  document.querySelectorAll("input[name='grantMode']").forEach(input => {
    input.onchange = () => { grantDraft.mode = input.value; renderGrantProductPicker(); };
  });
  renderGrantProductPicker();
}

function openRole(mode, role) {
  activeRole = role || null;
  if (mode === "create") {
    setDrawer("新建数据角色",
      "<div class='field'><label>角色名称 <em style='color:#f56c6c'>*</em></label><input class='el-input' id='roleName' placeholder='例如：日本泵产品组'><p class='help'>名称在数据角色范围内唯一，创建后可用于成员授权。</p></div>" +
      "<div class='field'><label>角色负责人 <em style='color:#f56c6c'>*</em></label><input class='el-input' id='roleOwner' placeholder='搜索姓名、拼音或邮箱'><div class='account-suggestions' id='roleOwnerSuggestions'></div><p class='help'>候选来源为 IoT 平台账号，可按姓名、拼音或邮箱模糊搜索；负责人仅可维护本角色成员，不自动获得产品访问权。</p></div>" +
      "<div class='field'><label>授权产品 <em style='color:#f56c6c'>*</em></label><div class='scope' id='roleProducts'><label><input type='checkbox' value='W1 Lite'> W1 Lite</label><label><input type='checkbox' value='S12 Pro'> S12 Pro</label><label><input type='checkbox' value='M5'> M5</label><label><input type='checkbox' value='V2'> V2</label></div><p class='help'>仅全局管理员可配置产品范围。</p></div>",
      "创建角色", "createRole");
    bindAccountSearch("roleOwner", "roleOwnerSuggestions", [], () => {});
    return;
  }
  if (mode === "members") {
    setDrawer("管理成员 · " + role.name,
      "<div class='field'><label>角色负责人</label><input class='el-input' value='" + role.owner + "' disabled></div>" +
      "<div class='field'><label>授权产品</label><div class='scope'>" + roleProductLabel(role) + "</div><p class='help'>" +
      (role.dynamicAll ? "该角色动态覆盖后续新建产品。" : "角色负责人不可修改产品范围。") + "</p></div>" +
      "<div class='field'><label>当前成员</label><div class='scope' id='memberList'>" +
      role.memberNames.map(name => "<span class='chip'>" + name + "</span>").join("") +
      "</div><button class='op' id='addMember'>+ 添加成员</button><p class='help'>成员来源为 IoT 平台账号；保存后，成员的产品访问范围立即重新计算。</p></div>",
      "完成", "members");
    document.querySelector("#addMember").onclick = () => openMemberPicker(role);
    return;
  }
  setDrawer("数据角色详情 · " + role.name,
    "<div class='field'><label>角色负责人</label><input class='el-input' value='" + role.owner + "' disabled></div>" +
    "<div class='field'><label>成员数</label><input class='el-input' value='" + role.memberNames.length + " 人' disabled></div>" +
    "<div class='field'><label>授权产品</label><div class='scope'>" + roleProductLabel(role) + "</div></div><p class='help'>" +
    (role.dynamicAll ? "系统临时全量角色的成员由上线时冻结名单确定；移除后立即失效且不会自动回加。" : "查看态不提供修改入口；如需维护成员，请使用“管理成员”。") + "</p>",
    "关闭", "detail");
}

function openMemberPicker(role) {
  activeRole = role;
  selectedMember = null;
  setDrawer("添加成员 · " + role.name,
    "<div class='field'><label>选择 IoT 平台账号 <em style='color:#f56c6c'>*</em></label><input class='el-input' id='memberSearch' placeholder='搜索姓名、拼音或邮箱'><div class='account-suggestions' id='memberSuggestions'></div><p class='help'>仅可添加已由 ERP 分配到 IoT 平台的账号；已是成员的账号不会重复出现。</p></div>" +
    "<div class='field'><label>待添加成员</label><div class='scope' id='selectedMember'>请选择一个 IoT 平台账号</div></div>",
    "添加成员", "addMember");
  bindAccountSearch("memberSearch", "memberSuggestions", role.memberNames, account => {
    selectedMember = account;
    document.querySelector("#selectedMember").innerHTML = "<span class='chip'>" + account.name + " · " + account.mail + "</span>";
  });
}

function renderNewRoleRow(role) {
  document.querySelector("#roles tbody").insertAdjacentHTML("beforeend",
    "<tr><td><b>" + role.name + "</b></td><td>" + role.owner + "</td><td>" + role.memberNames.length +
    " 人</td><td>" + roleProductLabel(role) + "</td><td><span class='tag success'>启用</span></td><td><button class='op'>管理成员</button> <button class='op'>查看</button></td></tr>");
  bindRoleActions();
}

function bindRoleActions() {
  [...document.querySelectorAll("#roles tbody tr")].forEach((row, index) => {
    const role = dataRoles[index];
    row.querySelectorAll(".op").forEach(button => {
      button.onclick = () => openRole(button.textContent.includes("管理成员") ? "members" : "detail", role);
    });
  });
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
document.querySelector(".right").onclick = () => openRole("create");
document.querySelector("#close").onclick = closeDrawer;
document.querySelector("#cancel").onclick = closeDrawer;
document.querySelector("#drawer .mask").onclick = closeDrawer;
document.querySelector("#confirm").onclick = () => {
  if (drawerMode === "grant") {
    if (grantDraft.mode === "specified" && !grantDraft.direct.length) return toast("请至少选择一个指定产品，或选择全部产品（动态）");
    current.directMode = grantDraft.mode;
    current.direct = grantDraft.mode === "all" ? [] : [...grantDraft.direct];
    const appliedMode = grantDraft.mode;
    renderRows();
    closeDrawer();
    toast(appliedMode === "all" ? "已授予全部产品（动态）访问范围" : "指定产品授权已生效");
    return;
  }
  if (drawerMode === "createRole") {
    const name = document.querySelector("#roleName").value.trim();
    const ownerInput = document.querySelector("#roleOwner");
    const owner = iotAccounts.find(account => account.mail === ownerInput.dataset.accountMail)?.name;
    const products = [...document.querySelectorAll("#roleProducts input:checked")].map(input => input.value);
    if (!name) return toast("请填写数据角色名称");
    if (dataRoles.some(role => role.name === name)) return toast("数据角色名称已存在");
    if (!owner) return toast("请从 IoT 平台账号搜索结果中选择角色负责人");
    if (!products.length) return toast("请选择至少一个授权产品");
    const role = { name, owner, memberNames: [], products };
    dataRoles.push(role);
    renderNewRoleRow(role);
    closeDrawer();
    toast("数据角色已创建，可继续管理成员");
    return;
  }
  if (drawerMode === "addMember") {
    if (!selectedMember) return toast("请从 IoT 平台账号搜索结果中选择成员");
    activeRole.memberNames.push(selectedMember.name);
    const row = document.querySelectorAll("#roles tbody tr")[dataRoles.indexOf(activeRole)];
    if (row) row.children[2].textContent = activeRole.memberNames.length + " 人";
    closeDrawer();
    toast("已添加 " + selectedMember.name + "；产品访问范围已重新计算");
    return;
  }
  closeDrawer();
  if (drawerMode === "members") toast(activeRole.name + " 的成员维护已完成");
};

renderRows();
bindRoleActions();
bindFilterActions();
renderNotes("users");
