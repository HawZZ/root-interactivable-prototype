(() => {
  'use strict';

  const STORAGE_KEY = 'luteos.consumable-category.prototype.v1';
  const DRAFT_KEY = 'luteos.consumable-category.prototype.draft.v1';
  const SCHEMA_VERSION = 1;

  const PRODUCT_CATEGORIES = [
    { id: '2092494966475055105', name: 'BM04S' },
    { id: 'DEMO-PC-002', name: '吸乳器' },
    { id: 'DEMO-PC-003', name: '空气净化器' }
  ];

  const PRODUCTS = [
    {
      id: '2114647612245774338',
      name: '212',
      model: 'fpctest',
      productCategoryId: '2092494966475055105',
      platform: 'ROOT云',
      app: 'momcozy',
      status: '开发中'
    },
    {
      id: 'DEMO-P-0002',
      name: 'BM04S 净水机 B2',
      model: 'BM04S-B2',
      productCategoryId: '2092494966475055105',
      platform: 'ROOT云',
      app: 'Luteos App',
      status: '开发中'
    },
    {
      id: 'DEMO-P-0003',
      name: '吸乳器 S1',
      model: 'BreastPump-S1',
      productCategoryId: 'DEMO-PC-002',
      platform: 'ROOT云',
      app: 'Momcozy App',
      status: '已上架'
    },
    {
      id: 'DEMO-P-0004',
      name: '空气净化器 A1',
      model: 'Air-A1',
      productCategoryId: 'DEMO-PC-003',
      platform: 'ROOT云',
      app: 'Luteos App',
      status: '开发中'
    }
  ];

  const CONSUMABLE_TYPES = [
    { value: 'non-count', label: '非计数类耗材' },
    { value: 'cloud-timer', label: '云端定时耗材' },
    { value: 'device-count', label: '设备计数耗材' }
  ];

  const COUNTRIES = [
    { value: '', label: '未配置' },
    { value: 'CN', label: '中国' },
    { value: 'US', label: '美国' }
  ];

  const PURCHASE_TYPES = [
    { value: 'none', label: '未配置' },
    { value: 'standalone', label: '独立站购买' },
    { value: 'native', label: '原生购买' }
  ];

  const ICONS = {
    logo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h8a4 4 0 0 1 4 4v12H10a4 4 0 0 1-4-4V4Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8h5M9 12h6M9 16h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
    product: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>',
    config: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M4 12h4M12 12h8"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/><circle cx="10" cy="12" r="2"/></svg>',
    device: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 8a7 7 0 0 1 11.6-1L20 12M4 12l2.3 5a7 7 0 0 0 11.6-1"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v6M12 7.5v.1"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M10 7l-5 5 5 5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg>'
  };

  const NOTES = {
    'CAT-01': {
      id: 'CAT-01',
      title: '所属产品分类与筛选',
      location: '耗材分类列表 > 筛选栏',
      sections: [
        { label: '功能提示', lines: ['按所属产品分类和分类名称查询耗材分类。产品分类来自现有产品分类主数据，耗材分类只在其所属产品分类范围内筛选。', '重置恢复「全部产品分类」与空关键词，列表回到完整演示数据。'] },
        { label: '状态/差异', lines: ['查询无结果时展示空状态，不改变底层分类；筛选不改变新增分类的默认归属。'] },
        { label: '原型假设', lines: ['名称查询使用包含匹配；长度、排序和是否模糊匹配待设计/研发核对。原型未提供按耗材分类跨产品查询。'] }
      ]
    },
    'CAT-02': {
      id: 'CAT-02',
      title: '新增耗材分类入口',
      location: '耗材分类列表 > 列表工具栏',
      sections: [
        { label: '交互', lines: ['点击「新增分类」打开页面内弹窗。新增时必须选择一个产品分类，分类名称只能在弹窗内填写，保存成功后系统自动生成唯一 ID。', '从产品耗材表单的「先去维护分类」进入时，归属产品分类默认取当前产品所属分类；创建成功后自动返回原耗材表单并保留输入。'] },
        { label: '状态/差异', lines: ['当前产品分类没有耗材分类时仍可新增，不提供停用或预建空分类。'] }
      ]
    },
    'CAT-03': {
      id: 'CAT-03',
      title: '分类列表与稳定 ID',
      location: '耗材分类列表 > 表格',
      sections: [
        { label: '字段', lines: ['展示分类名称、所属产品分类、耗材分类 ID与操作；删除时检查引用，不要求列表新增引用统计或更新时间。ID 由系统生成，用户不可填写或编辑。'] },
        { label: '功能提示', lines: ['分类改名后 ID 保持不变；产品耗材通过 ID 关联，并按分类当前名称展示。', '各产品耗材记录保持独立，多个产品可引用同一个耗材分类。'] }
      ]
    },
    'CAT-04': {
      id: 'CAT-04',
      title: '改名、删除与引用保护',
      location: '耗材分类列表 > 行操作',
      sections: [
        { label: '交互', lines: ['编辑只允许改名，不允许更换所属产品分类；改名后既有关联不变。', '删除仅在分类没有任何产品耗材引用时可确认；分类已被引用时阻止删除并显示引用信息。'] },
        { label: '状态/差异', lines: ['删除确认提交时再次检查引用。演示中的「删除前加引用」会先写入一条合法演示引用，再让本次删除因引用变化被拦截，不产生孤儿关系。'] },
        { label: 'PRD 边界', lines: ['不提供停用能力，不级联删除产品耗材，也不把删除动作变成批量迁移。'] }
      ]
    },
    'CAT-05': {
      id: 'CAT-05',
      title: '名称、归属与只读 ID',
      location: '分类新增/编辑弹窗 > 基础字段',
      sections: [
        { label: '字段', lines: ['分类名称必填，保存前去除首尾空格。新增时选择所属产品分类；编辑时归属产品分类、分类 ID 均为只读。', '新增弹窗在保存前显示「保存后自动生成」，成功后才产生稳定 ID。'] },
        { label: '校验', lines: ['同一产品分类内名称不可重复，不把编辑中的当前记录算作重复；不同产品分类可同名。', '原型暂按去首尾空格、区分大小写判断重名，真实规范化规则待研发记录并由产品核对。'] },
        { label: '原型假设', lines: ['演示 ID 为 CCAT-DEMO-* 格式，仅用于表达稳定性；正式 ID 格式和生成方式由研发定义。'] }
      ]
    },
    'CAT-06': {
      id: 'CAT-06',
      title: '保存校验、加载与失败恢复',
      location: '分类新增/编辑弹窗 > 校验与底部操作',
      sections: [
        { label: '校验', lines: ['空名称、未选择产品分类、同产品分类重名均在提交时显示字段或表单错误并聚焦首个错误。', '保存时不提交归属产品分类变更；编辑请求只更新名称。'] },
        { label: '状态/差异', lines: ['保存中按钮进入 loading，字段和关闭操作暂时禁用，防止重复提交。', '保存失败保留全部输入、显示失败原因，并将主按钮变为「重试保存」；重试仅提交同一份表单。取消或关闭不写入数据。'] }
      ]
    },
    'CAT-07': {
      id: 'CAT-07',
      title: '无引用删除 / 被引用阻止',
      location: '分类删除确认弹窗',
      sections: [
        { label: '触发条件', lines: ['行操作点击删除后，系统先读取当前引用数量。'] },
        { label: '系统响应', lines: ['无引用：展示不可恢复提示，确认后再次检查引用并删除。', '有引用：列出引用耗材及产品，明确阻止删除，只允许关闭并保留分类。'] },
        { label: '异常处理', lines: ['确认提交前引用发生变化时，以提交时检查为准拒绝删除。原型可注入一条合法演示引用验证拦截且不留下孤儿数据。'] }
      ]
    },
    'PRO-01': {
      id: 'PRO-01',
      title: '产品上下文与查看'
        ,
      location: '智能产品 > 产品列表',
      sections: [
        { label: '字段', lines: ['产品列表仅作导航上下文，字段与筛选为节选，不构成产品列表改版；本期不新增耗材数量统计。'] },
        { label: '交互', lines: ['点击「查看」进入该产品详情的高级配置 → 耗材管理；耗材页始终带当前产品上下文，不提供跨产品按分类查询。'] },
        { label: '原型假设', lines: ['仅样本212的名称、型号、ID、分类及所属App来源于开发环境；其余产品和所有耗材均为虚构样本。产品列表为导航节选，不作为整页视觉改版依据。'] }
      ]
    },
    'CON-01': {
      id: 'CON-01',
      title: '产品与产品分类上下文',
      location: '产品详情 > 高级配置 > 耗材管理',
      sections: [
        { label: '功能提示', lines: ['沿用现有产品摘要与高级配置导航；本期不新增摘要统计或产品分类ID展示。所有耗材操作限定在当前产品。', '路径：智能产品 → 产品列表 → 产品详情 → 高级配置 → 耗材管理。'] },
        { label: '状态/差异', lines: ['产品所属产品分类是分类选项范围的上游依据；耗材分类不可跨到其他产品分类。'] }
      ]
    },
    'CON-02': {
      id: 'CON-02',
      title: '添加耗材与分类前置条件',
      location: '耗材管理 > 添加耗材',
      sections: [
        { label: '交互', lines: ['沿用现有右侧添加耗材抽屉，在原有字段前新增必选分类；分类单选卡片是交互示意，最终控件由设计定义。', '分类选项从当前产品所属产品分类读取；加载中、加载失败、无可用分类和提交时失效都要有明确反馈。'] },
        { label: '状态/差异', lines: ['无分类时显示「去配置中心维护」；进入配置中心保留当前表单输入，返回后继续编辑。'] }
      ]
    },
    'CON-03': {
      id: 'CON-03',
      title: '耗材分类列与存量状态',
      location: '耗材管理 > 耗材列表',
      sections: [
        { label: '字段', lines: ['仅在现有耗材列表新增「耗材分类」列，展示当前分类名称；关联使用稳定ID，不要求列表展示ID。现有九列顺序保留，不新增「耗材类型」列。'] },
        { label: '状态/差异', lines: ['存量初始化前，尚未映射的演示记录显示「待初始化」，不能把缺失分类当作合法最终状态；初始化后展示预设分类关系。'] },
        { label: '边界', lines: ['多个产品可引用同一耗材分类，但每条产品耗材记录仍独立编辑；分类不是耗材类型。'] }
      ]
    },
    'CON-04': {
      id: 'CON-04',
      title: '编辑耗材与更换分类',
      location: '耗材管理 > 行操作',
      sections: [
        { label: '交互', lines: ['点击编辑只修改当前产品下的当前耗材记录。分类可在当前产品所属产品分类内改选，保存后正确回显。', '更换分类不修改其他产品、其他耗材的关联；分类改名不需要修改任何耗材记录。'] },
        { label: '异常处理', lines: ['若提交时分类已删除、失效或越界，保存被阻止并提示刷新重选，不静默改选或写入孤儿关系。'] }
      ]
    },
    'CON-05': {
      id: 'CON-05',
      title: '必选单分类与可选范围',
      location: '耗材新增/编辑抽屉 > 耗材分类',
      sections: [
        { label: '校验', lines: ['分类必选且只能选择一个；选项仅包含当前产品所属产品分类下的耗材分类，空值或跨产品分类值不得保存。'] },
        { label: '状态/差异', lines: ['加载中显示占位并禁用保存；加载失败提供重试；无分类时提供「去配置中心维护」。', '提交时选项失效会保留其他字段和当前选择，提示刷新重选；刷新后才由用户明确清除失效选择。'] },
        { label: 'PRD 边界', lines: ['耗材类型枚举与耗材分类是两个字段，不用类型代替分类，也不新增 APP 分类展示。'] }
      ]
    },
    'CON-06': {
      id: 'CON-06',
      title: '原有耗材字段与简化边界',
      location: '耗材新增/编辑抽屉 > 配置字段',
      sections: [
        { label: '字段', lines: ['耗材名称沿用 30 字上限、耗材介绍沿用 300 字上限；耗材类型保留「非计数类耗材 / 云端定时耗材 / 设备计数耗材」三个现有枚举。', '既有顺序：展示国家→购买配置→排序→名称→介绍→更换指引→耗材类型及条件项→耗材图片。触发条件和更换周期随类型配置，不是新增自由输入字段。'] },
        { label: '原型边界', lines: ['本原型仅验证分类关系。购买配置、国家选项、上传和类型条件区为沿用现有的静态示意；正式开发保留当前组件、布局、必填性和校验。禁止按示意控件改造原有业务。'] },
        { label: '原型假设', lines: ['2026-11-04实页核对：展示国家、名称、介绍、类型、图片有必填标记；独立站购买链接在该模式下必填。原型购买/上传控件仅示意，不代表必填性或既有规则取消。'] }
      ]
    },
    'CON-07': {
      id: 'CON-07',
      title: '保存、失效与失败重试',
      location: '耗材新增/编辑抽屉 > 保存操作',
      sections: [
        { label: '流程图', lines: ['校验分类与字段 → 保存中禁用重复提交 → 成功回显；失败保留输入 → 用户重试或取消'] },
        { label: '状态/差异', lines: ['保存失败显示具体原因，按钮变为「重试保存」，名称、分类和其他字段不清空。', '分类关系校验失败不自动改选；列表刷新后可重新选择。取消关闭不写入任何数据。'] },
        { label: '功能提示', lines: ['新增和编辑执行同一套分类合法性校验；新增保存后生成独立耗材记录，只关联当前产品。'] }
      ]
    },
    'DEMO-01': {
      id: 'DEMO-01',
      title: '演示场景与数据控制',
      location: '左栏顶部 > 原型演示',
      sections: [
        { label: '原型辅助', lines: ['该区域所有控件仅用于评审和状态复现，不属于真实后台功能，不调用开发环境或生产接口。'] },
        { label: '功能提示', lines: ['可切换存量初始化前后、注入下一次保存失败、分类加载失败、非法关联保存、删除前新增引用与延长加载，并可重置演示数据。'] },
        { label: '状态/差异', lines: ['场景开关只作用于原型会话；重置恢复预置样例和正常状态。浏览器本地存储不可用时自动退化为当前页面内存数据。'] }
      ]
    },
    'MIG-01': {
      id: 'MIG-01',
      title: '存量初始化前后演示',
      location: '原型演示 > 存量状态；耗材列表',
      sections: [
        { label: '状态/差异', lines: ['初始化前：尚未映射的存量耗材显示「待初始化」，编辑时必须重新选择合法分类，保存空分类会被拦截。', '初始化后：展示预置的合法同产品分类关系。该切换只改变演示呈现，不执行迁移，也不改写真实环境。'] },
        { label: 'PRD 边界', lines: ['交付前由业务提供全量清单并核对归类，研发负责稳定键、幂等、失败恢复、执行窗口和强制校验时点；未完成全量合法映射不可交付。'] }
      ]
    },
    'REL-01': {
      id: 'REL-01',
      title: '父级删除 / 产品分类调整保护',
      location: '原型演示 > 父级保护检查',
      sections: [
        { label: '业务规则', lines: ['父级操作不得造成悬空或跨产品分类关联；具体保护方案由研发核对，不新增产品分类调整入口。', '分类或产品改名不得造成关联丢失；保护能力不包含自动迁移、自动改配或级联删除。'] },
        { label: '状态/差异', lines: ['本原型的检查按钮只演示业务拦截结果，不修改产品分类或产品数据，也不宣称现网已实现该保护。'] },
        { label: '研发验收', lines: ['需核对既有父级删除和产品分类调整入口、接口与数据库约束，并由测试在交付前覆盖保护与并发场景。'] }
      ]
    }
  };

  const PAGE_NOTE_IDS = {
    categories: ['CAT-01', 'CAT-02', 'CAT-03', 'CAT-04', 'DEMO-01', 'MIG-01', 'REL-01'],
    products: ['PRO-01', 'DEMO-01', 'REL-01'],
    consumables: ['CON-01', 'CON-02', 'CON-03', 'CON-04', 'DEMO-01', 'MIG-01']
  };

  const MODAL_NOTE_IDS = {
    'category-create': ['CAT-05', 'CAT-06'],
    'category-edit': ['CAT-05', 'CAT-06'],
    'category-delete': ['CAT-07'],
    'consumable-create': ['CON-05', 'CON-06', 'CON-07'],
    'consumable-edit': ['CON-05', 'CON-06', 'CON-07'],
    'parent-guard': ['REL-01'],
    'reset-demo': []
  };

  const MODAL_TITLES = {
    'category-create': '新增耗材分类',
    'category-edit': '编辑耗材分类',
    'category-delete': '删除耗材分类',
    'consumable-create': '添加耗材',
    'consumable-edit': '编辑耗材',
    'parent-guard': '父级保护检查',
    'reset-demo': '重置演示数据'
  };

  const PAGE_TITLES = {
    categories: '耗材分类',
    products: '产品列表',
    consumables: '耗材管理'
  };

  function createSeedData() {
    return {
      schemaVersion: SCHEMA_VERSION,
      initialized: true,
      meta: {
        nextCategory: 1006,
        nextConsumable: 1005
      },
      categories: [
        {
          id: 'CCAT-DEMO-1001',
          productCategoryId: '2092494966475055105',
          name: '滤芯',
          createdAt: '2026-11-03T01:10:00.000Z',
          updatedAt: '2026-11-03T01:10:00.000Z'
        },
        {
          id: 'CCAT-DEMO-1002',
          productCategoryId: '2092494966475055105',
          name: '清洁刷',
          createdAt: '2026-11-03T01:12:00.000Z',
          updatedAt: '2026-11-03T01:12:00.000Z'
        },
        {
          id: 'CCAT-DEMO-1003',
          productCategoryId: '2092494966475055105',
          name: '水箱',
          createdAt: '2026-11-03T01:15:00.000Z',
          updatedAt: '2026-11-03T01:15:00.000Z'
        },
        {
          id: 'CCAT-DEMO-1004',
          productCategoryId: 'DEMO-PC-002',
          name: '滤芯',
          createdAt: '2026-11-03T01:20:00.000Z',
          updatedAt: '2026-11-03T01:20:00.000Z'
        },
        {
          id: 'CCAT-DEMO-1005',
          productCategoryId: 'DEMO-PC-002',
          name: '母乳收集容器',
          createdAt: '2026-11-03T01:23:00.000Z',
          updatedAt: '2026-11-03T01:23:00.000Z'
        }
      ],
      consumables: [
        {
          id: 'CONS-DEMO-1001',
          productId: '2114647612245774338',
          categoryId: 'CCAT-DEMO-1001',
          name: '复合滤芯 Pro',
          intro: '用于演示同产品分类内多条独立耗材记录，可展示分类和原字段的组合。',
          type: 'device-count',
          trigger: '设备计数剩余 10%',
          replacementCycle: '90 天',
          country: 'CN',
          purchaseType: 'native',
          purchaseUrl: '',
          sort: 1,
          legacy: true,
          mappedInPreinit: false,
          createdAt: '2026-11-03T01:30:00.000Z',
          updatedAt: '2026-11-03T01:30:00.000Z'
        },
        {
          id: 'CONS-DEMO-1002',
          productId: '2114647612245774338',
          categoryId: 'CCAT-DEMO-1003',
          name: '可拆洗水箱',
          intro: '演示同一产品下的另一类耗材配置。',
          type: 'cloud-timer',
          trigger: '连续使用 30 天',
          replacementCycle: '30 天检查一次',
          country: 'CN',
          purchaseType: 'none',
          purchaseUrl: '',
          sort: 2,
          legacy: true,
          mappedInPreinit: false,
          createdAt: '2026-11-03T01:32:00.000Z',
          updatedAt: '2026-11-03T01:32:00.000Z'
        },
        {
          id: 'CONS-DEMO-1003',
          productId: 'DEMO-P-0002',
          categoryId: 'CCAT-DEMO-1001',
          name: '复合滤芯 标准版',
          intro: '与 p1 引用同一耗材分类，但记录独立。',
          type: 'device-count',
          trigger: '设备计数剩余 5%',
          replacementCycle: '120 天',
          country: 'US',
          purchaseType: 'standalone',
          purchaseUrl: '',
          sort: 1,
          legacy: true,
          mappedInPreinit: false,
          createdAt: '2026-11-03T01:35:00.000Z',
          updatedAt: '2026-11-03T01:35:00.000Z'
        },
        {
          id: 'CONS-DEMO-1004',
          productId: 'DEMO-P-0003',
          categoryId: 'CCAT-DEMO-1004',
          name: '吸乳器滤芯',
          intro: '演示另一产品分类下与「滤芯」同名但独立归属的分类。',
          type: 'non-count',
          trigger: '手动更换',
          replacementCycle: '按需',
          country: '',
          purchaseType: 'none',
          purchaseUrl: '',
          sort: 1,
          legacy: true,
          mappedInPreinit: false,
          createdAt: '2026-11-03T01:38:00.000Z',
          updatedAt: '2026-11-03T01:38:00.000Z'
        }
      ]
    };
  }

  let storageAvailable = true;
  let data = loadData();

  const ui = {
    page: 'categories',
    productId: '2114647612245774338',
    note: null,
    categoryFilters: { productCategoryId: 'all', query: '' },
    productFilters: { productCategoryId: 'all', query: '' },
    demoOpen: false,
    mobileView: 'product',
    modal: null,
    formDraft: null,
    fieldErrors: {},
    modalError: '',
    modalNotice: '',
    busy: false,
    optionState: 'ready',
    optionLoadToken: 0,
    dialogTrigger: null,
    returnContext: null,
    pendingConsumableDraft: null,
    resumeDraftData: null,
    toast: null,
    toastTimer: null,
    focusAfterRender: null,
    highlightConsumableId: null,
    demo: {
      failNextSave: false,
      failOptions: false,
      slowLoad: false,
      injectDeleteReference: false,
      invalidRelationNextSave: false
    }
  };

  function loadData() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createSeedData();
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.schemaVersion === SCHEMA_VERSION &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.consumables) &&
        parsed.meta
      ) {
        return parsed;
      }
      return createSeedData();
    } catch (_error) {
      storageAvailable = false;
      return createSeedData();
    }
  }

  function persistData() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      storageAvailable = true;
      return true;
    } catch (_error) {
      storageAvailable = false;
      return false;
    }
  }

  function writeDraftSession(draft) {
    ui.resumeDraftData = draft;
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function readDraftSession() {
    if (ui.resumeDraftData) return ui.resumeDraftData;
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function clearDraftSession() {
    ui.resumeDraftData = null;
    try {
      window.sessionStorage.removeItem(DRAFT_KEY);
    } catch (_error) {
      // The in-memory draft is still cleared above.
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return map[char];
    });
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    try {
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date).replace(/\//g, '-');
    } catch (_error) {
      return value;
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function productCategoryById(id) {
    return PRODUCT_CATEGORIES.find((item) => item.id === id) || null;
  }

  function productById(id) {
    return PRODUCTS.find((item) => item.id === id) || null;
  }

  function categoryById(id) {
    return data.categories.find((item) => item.id === id) || null;
  }

  function consumableById(id) {
    return data.consumables.find((item) => item.id === id) || null;
  }

  function categoriesForProduct(product) {
    if (!product) return [];
    return data.categories
      .filter((category) => category.productCategoryId === product.productCategoryId)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }

  function consumablesForProduct(productId) {
    return data.consumables.filter((item) => item.productId === productId);
  }

  function referencesForCategory(categoryId) {
    return data.consumables
      .filter((item) => item.categoryId === categoryId)
      .map((item) => ({ consumable: item, product: productById(item.productId) }))
      .filter((item) => item.product);
  }

  function typeLabel(value) {
    return (CONSUMABLE_TYPES.find((item) => item.value === value) || CONSUMABLE_TYPES[0]).label;
  }

  function countryLabel(value) {
    return (COUNTRIES.find((item) => item.value === value) || COUNTRIES[0]).label;
  }

  function purchaseLabel(value) {
    return (PURCHASE_TYPES.find((item) => item.value === value) || PURCHASE_TYPES[0]).label;
  }

  function isRecordPending(record) {
    return Boolean(record && record.legacy && !data.initialized && !record.mappedInPreinit);
  }

  function nextCategoryId() {
    const id = `CCAT-DEMO-${data.meta.nextCategory}`;
    data.meta.nextCategory += 1;
    return id;
  }

  function nextConsumableId() {
    const id = `CONS-DEMO-${data.meta.nextConsumable}`;
    data.meta.nextConsumable += 1;
    return id;
  }

  function noteAnchor(id, className = '') {
    return `<button type="button" class="note-anchor ${className}" data-note-anchor="${escapeHtml(id)}" aria-label="定位原型批注 ${escapeHtml(id)}" title="原型辅助批注 ${escapeHtml(id)}">${escapeHtml(id)}</button>`;
  }

  function icon(name) {
    return ICONS[name] || '';
  }

  function truncate(value, max) {
    const text = String(value == null ? '' : value);
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  function parseHashRoute() {
    const raw = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(raw);
    const pageValue = params.get('page');
    const page = Object.prototype.hasOwnProperty.call(PAGE_TITLES, pageValue) ? pageValue : 'categories';
    let productId = params.get('product') || '2114647612245774338';
    if (!productById(productId)) productId = '2114647612245774338';
    const noteValue = (params.get('note') || '').toUpperCase();
    const note = NOTES[noteValue] ? noteValue : null;
    const returnTo = params.get('returnTo') === 'consumable' ? 'consumable' : null;
    return { page, productId, note, returnTo };
  }

  function buildHash(page, productId, note, returnTo) {
    const params = new URLSearchParams();
    params.set('page', page);
    if (page === 'consumables' || returnTo === 'consumable') {
      params.set('product', productId || '2114647612245774338');
    }
    if (note) params.set('note', note);
    if (returnTo === 'consumable') params.set('returnTo', 'consumable');
    return `#${params.toString()}`;
  }

  function syncHash(note = ui.note, replace = true) {
    const returnTo = ui.page === 'categories' && ui.returnContext ? 'consumable' : null;
    const hash = buildHash(ui.page, ui.productId, note, returnTo);
    if (window.location.hash === hash) return;
    if (replace) {
      window.history.replaceState(null, '', hash);
    } else {
      window.location.hash = hash;
    }
  }

  function getVisibleNoteIds() {
    if (ui.modal) return MODAL_NOTE_IDS[ui.modal.type] || [];
    return PAGE_NOTE_IDS[ui.page] || [];
  }

  function getVisibleNotes() {
    return getVisibleNoteIds().map((id) => NOTES[id]).filter(Boolean);
  }

  function currentContextLabel() {
    if (ui.modal) {
      const title = MODAL_TITLES[ui.modal.type] || '弹窗';
      if (ui.modal.type.startsWith('consumable')) {
        const product = productById(ui.modal.productId);
        return `${title} · ${product ? product.name : '当前产品'}`;
      }
      return title;
    }
    if (ui.page === 'consumables') {
      const product = productById(ui.productId);
      return `耗材管理 · ${product ? product.name : '当前产品'}`;
    }
    return PAGE_TITLES[ui.page] || '原型页面';
  }

  function productCategoryOptionMarkup(selectedId, includeAll = false) {
    const rows = [];
    if (includeAll) {
      rows.push(`<option value="all"${selectedId === 'all' ? ' selected' : ''}>全部产品分类</option>`);
    }
    PRODUCT_CATEGORIES.forEach((category) => {
      rows.push(`<option value="${escapeHtml(category.id)}"${selectedId === category.id ? ' selected' : ''}>${escapeHtml(category.name)}</option>`);
    });
    return rows.join('');
  }

  function renderSidebar() {
    const productPageActive = ui.page === 'products' || ui.page === 'consumables';
    const categoryPageActive = ui.page === 'categories';
    return `
      <aside class="app-sidebar" aria-label="后台主菜单">
        <div class="brand">
          <span class="brand-mark">${icon('logo')}</span>
          <div class="brand-copy">
            <strong>Luteos IoT</strong>
            <span>Admin console</span>
          </div>
        </div>
        <nav class="side-nav" aria-label="后台导航">
          <button class="nav-item" type="button" data-action="scope-notice" data-label="数据概览">
            <span class="nav-icon">${icon('dashboard')}</span>
            <span>概览</span>
          </button>

          <div class="nav-group-label"><span>智能产品</span><span>›</span></div>
          <a class="nav-sub${productPageActive ? ' is-active' : ''}" href="#page=products">产品列表</a>
          <button class="nav-sub" type="button" data-action="scope-notice" data-label="设备管理">
            <span>消息推送</span>
          </button>

          <div class="nav-group-label"><span>配置中心</span><span>›</span></div>
          <button class="nav-sub" type="button" data-action="scope-notice" data-label="物模型池" aria-disabled="true">物模型池</button>
          <button class="nav-sub" type="button" data-action="scope-notice" data-label="产品模板" aria-disabled="true">产品模板</button>
          <button class="nav-sub" type="button" data-action="scope-notice" data-label="产品分类" aria-disabled="true">产品分类</button>
          <a class="nav-sub${categoryPageActive ? ' is-active' : ''}" href="#page=categories">
            <span>耗材分类</span><span class="new-dot">新</span>
          </a>
          <button class="nav-sub" type="button" data-action="scope-notice" data-label="多语言" aria-disabled="true">多语言</button>
          <button class="nav-sub" type="button" data-action="scope-notice" data-label="系统配置" aria-disabled="true">系统配置</button>
          <button class="nav-sub" type="button" data-action="scope-notice" data-label="审批管理" aria-disabled="true">审批管理</button>
          <button class="nav-sub" type="button" data-action="scope-notice" data-label="音源管理" aria-disabled="true">音源管理</button>
        </nav>
        <div class="sidebar-footer">
          <span class="sidebar-avatar">运</span>
          <span>运营管理员 · 中国站</span>
        </div>
      </aside>
    `;
  }

  function renderBreadcrumb() {
    if (ui.page === 'categories') {
      return `<a href="#page=categories">配置中心</a><span class="crumb-divider">/</span><span class="crumb-current">耗材分类</span>`;
    }
    if (ui.page === 'products') {
      return `<a href="#page=products">智能产品</a><span class="crumb-divider">/</span><span class="crumb-current">产品列表</span>`;
    }
    const product = productById(ui.productId);
    return `
      <a href="#page=products">智能产品</a><span class="crumb-divider">/</span>
      <a href="#page=products">产品列表</a><span class="crumb-divider">/</span>
      <span>${escapeHtml(product ? product.name : '当前产品')}</span><span class="crumb-divider">/</span>
      <span>高级配置</span><span class="crumb-divider">/</span>
      <span class="crumb-current">耗材管理</span>
    `;
  }

  function renderTopbar() {
    return `
      <header class="app-topbar">
        <nav class="crumb" aria-label="面包屑">${renderBreadcrumb()}</nav>
        <div class="topbar-actions">
          <span class="demo-data-tag" title="本原型不连接真实开发环境">演示数据</span>
          <button class="icon-button" type="button" data-action="scope-notice" data-label="帮助中心" aria-label="帮助中心" title="原型范围内帮助">?</button>
          <div class="top-user"><span class="top-user-avatar">运</span><span>运营管理员</span></div>
        </div>
      </header>
    `;
  }

  function renderDemoPanel() {
    const initialized = data.initialized;
    const pageHasMig = ui.page === 'categories' || ui.page === 'consumables';
    const pageHasRel = ui.page === 'categories' || ui.page === 'products';
    const showBasicAnchors = !ui.modal;
    const activeFlags = [
      ui.demo.failNextSave ? '下次保存失败' : '',
      ui.demo.failOptions ? '分类加载失败' : '',
      ui.demo.invalidRelationNextSave ? '非法关联保存' : '',
      ui.demo.injectDeleteReference ? '删除前加引用' : '',
      ui.demo.slowLoad ? '加载 2.5 秒' : ''
    ].filter(Boolean);

    return `
      <section class="demo-panel" data-note-target="DEMO-01" aria-label="原型演示工具">
        <div class="demo-summary-row">
          <span class="demo-tag">原型辅助</span>
          <span class="demo-title">评审工具 · 非交付页面</span>
          <span class="demo-status">${activeFlags.length ? `已注入：${escapeHtml(activeFlags.join('、'))}` : '当前为正常演示状态'}</span>
          <span class="demo-summary-spacer"></span>
          <button class="demo-expand" type="button" data-action="toggle-demo-panel" aria-expanded="${ui.demoOpen}">${ui.demoOpen ? '收起场景' : '展开场景'}</button>
          ${showBasicAnchors ? noteAnchor('DEMO-01') : ''}
        </div>
        ${ui.demoOpen ? `
          <div class="demo-body">
            <div class="demo-row">
              <span class="demo-row-label">存量状态</span>
              <div class="demo-note-wrap">
                <div class="demo-segment" role="group" aria-label="存量初始化状态，仅原型演示">
                  <button type="button" data-action="set-init-state" data-value="post" aria-pressed="${initialized}" title="原型辅助：显示初始化后状态">初始化后</button>
                  <button type="button" data-action="set-init-state" data-value="pre" aria-pressed="${!initialized}" title="原型辅助：显示初始化前状态">初始化前</button>
                </div>
                ${showBasicAnchors && pageHasMig ? noteAnchor('MIG-01') : ''}
              </div>
              <span class="demo-status">只切换演示呈现，不执行数据迁移</span>
            </div>
            <div class="demo-row">
              <span class="demo-row-label">异常注入</span>
              <div class="demo-group" role="group" aria-label="异常场景，仅原型演示">
                <button class="demo-chip" type="button" data-action="toggle-demo-flag" data-flag="failNextSave" aria-pressed="${ui.demo.failNextSave}" title="原型辅助：下一次保存失败一次">下次保存失败</button>
                <button class="demo-chip" type="button" data-action="toggle-demo-flag" data-flag="failOptions" aria-pressed="${ui.demo.failOptions}" title="原型辅助：下一次分类选项加载失败">分类加载失败</button>
                <button class="demo-chip" type="button" data-action="toggle-demo-flag" data-flag="invalidRelationNextSave" aria-pressed="${ui.demo.invalidRelationNextSave}" title="原型辅助：下一次保存触发非法关联校验">非法关联保存</button>
                <button class="demo-chip" type="button" data-action="toggle-demo-flag" data-flag="injectDeleteReference" aria-pressed="${ui.demo.injectDeleteReference}" title="原型辅助：删除确认前注入一条合法引用">删除前加引用</button>
                <button class="demo-chip" type="button" data-action="toggle-demo-flag" data-flag="slowLoad" aria-pressed="${ui.demo.slowLoad}" title="原型辅助：延长分类加载状态">加载 2.5 秒</button>
              </div>
            </div>
            <div class="demo-row">
              <span class="demo-row-label">完整性检查</span>
              <div class="demo-group">
                <span class="demo-note-wrap">
                  <button class="demo-action" type="button" data-action="open-parent-guard" title="原型辅助：只演示父级保护结果">父级保护检查</button>
                  ${showBasicAnchors && pageHasRel ? noteAnchor('REL-01') : ''}
                </span>
                <button class="demo-action is-danger" type="button" data-action="open-reset-demo" title="原型辅助：恢复预置演示数据">重置演示数据</button>
              </div>
              <span class="demo-storage${storageAvailable ? '' : ' is-warning'}">${storageAvailable ? '本地演示数据可持久化' : '本地存储不可用：修改仅在本次会话有效'}</span>
            </div>
          </div>
        ` : ''}
      </section>
    `;
  }

  function renderCategoryPage() {
    const filter = ui.categoryFilters;
    const query = filter.query.trim().toLocaleLowerCase('zh-CN');
    const filtered = data.categories
      .filter((category) => filter.productCategoryId === 'all' || category.productCategoryId === filter.productCategoryId)
      .filter((category) => !query || category.name.toLocaleLowerCase('zh-CN').includes(query))
      .slice()
      .sort((a, b) => {
        const ai = PRODUCT_CATEGORIES.findIndex((item) => item.id === a.productCategoryId);
        const bi = PRODUCT_CATEGORIES.findIndex((item) => item.id === b.productCategoryId);
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name, 'zh-CN');
      });

    const returnBanner = ui.returnContext ? (() => {
      const product = productById(ui.returnContext.productId);
      const parent = product ? productCategoryById(product.productCategoryId) : null;
      return `
        <div class="context-banner" role="status">
          <span class="context-banner-icon">${icon('info')}</span>
          <div class="context-banner-copy">
            <strong>正在为「${escapeHtml(product ? product.name : '当前产品')}」维护耗材分类</strong>
            <span>归属产品分类：${escapeHtml(parent ? parent.name : '—')}。创建成功后会自动返回耗材表单并保留输入。</span>
          </div>
          <button class="btn" type="button" data-action="return-to-consumable">返回耗材表单</button>
        </div>
      `;
    })() : '';

    const rows = filtered.map((category, index) => {
      const parent = productCategoryById(category.productCategoryId);
      const references = referencesForCategory(category.id);
      return `
        <tr>
          <td><span class="cell-strong">${escapeHtml(category.name)}</span></td>
          <td><span class="tag tag-neutral">${escapeHtml(parent ? parent.name : '分类缺失')}</span></td>
          <td><span class="cell-mono">${escapeHtml(category.id)}</span></td>
          
          
          <td class="operation-cell" data-note-target="CAT-04">
            ${index === 0 ? noteAnchor('CAT-04') : ''}
            <button class="text-button" type="button" data-action="edit-category" data-id="${escapeHtml(category.id)}">编辑</button>
            <button class="text-button danger" type="button" data-action="delete-category" data-id="${escapeHtml(category.id)}">删除</button>
          </td>
        </tr>
      `;
    }).join('');

    const empty = `
      <div class="empty-state">
        <div>
          <div class="empty-icon">${icon('box')}</div>
          <p class="empty-title">没有匹配的耗材分类</p>
          <p class="empty-copy">调整产品分类或名称关键词后重新查询。筛选不会删除或修改任何分类。</p>
          <button class="btn" type="button" data-action="reset-category-filter">清除筛选</button>
        </div>
      </div>
    `;

    return `
      <div class="page-heading">
        <div>
          <span class="page-eyebrow">配置中心</span>
          <h1 class="page-title">耗材分类</h1>
          <p class="page-description">按产品分类维护耗材的业务归类；分类 ID 自动生成并用于稳定关联。</p>
        </div>
        <div class="page-heading-side"><span class="demo-data-tag">演示数据</span></div>
      </div>
      ${returnBanner}
      <section class="surface-card filter-card" data-note-target="CAT-01" aria-labelledby="categoryFilterTitle">
        <div class="filter-heading">
          <strong id="categoryFilterTitle">筛选条件</strong>
          ${noteAnchor('CAT-01')}
        </div>
        <form class="filter-row" id="categoryFilterForm">
          <label class="filter-item">
            <span class="filter-label">所属产品分类</span>
            <select name="productCategoryId" id="categoryProductCategoryFilter">
              ${productCategoryOptionMarkup(filter.productCategoryId, true)}
            </select>
          </label>
          <label class="filter-item wide">
            <span class="filter-label">耗材分类名称</span>
            <span class="input-with-icon">
              ${icon('search')}
              <input type="search" id="categoryNameFilter" name="query" value="${escapeHtml(filter.query)}" placeholder="输入分类名称查询">
            </span>
          </label>
          <div class="filter-actions">
            <button class="btn btn-primary" type="submit">查询</button>
            <button class="btn" type="button" data-action="reset-category-filter">重置</button>
          </div>
        </form>
      </section>

      <section class="surface-card data-card" aria-labelledby="categoryTableTitle">
        <div class="table-toolbar">
          <div class="table-toolbar-title">
            <strong id="categoryTableTitle">分类列表</strong>
            <span class="table-count">共 ${filtered.length} 条</span>
            ${noteAnchor('CAT-03')}
          </div>
          <div class="table-toolbar-actions">
            <span class="note-inline" data-note-target="CAT-02">
              ${noteAnchor('CAT-02')}
              <button class="btn btn-primary" type="button" data-action="open-category-create">${icon('plus')}新增分类</button>
            </span>
          </div>
        </div>
        <div class="table-wrap" data-note-target="CAT-03">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">分类名称</th>
                <th scope="col">所属产品分类</th>
                <th scope="col">耗材分类 ID</th>
                
                
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>${filtered.length ? rows : ''}</tbody>
          </table>
          ${filtered.length ? '' : empty}
        </div>
        <div class="table-footer">
          <span>演示数据 · 同产品分类内名称唯一，不同产品分类允许同名</span>
          <span class="pager"><button type="button" disabled>上一页</button><button type="button" class="is-current">1</button><button type="button" disabled>下一页</button></span>
        </div>
      </section>
    `;
  }

  function renderProductPage() {
    const filter = ui.productFilters;
    const query = filter.query.trim().toLocaleLowerCase('zh-CN');
    const filtered = PRODUCTS.filter((product) => filter.productCategoryId === 'all' || product.productCategoryId === filter.productCategoryId)
      .filter((product) => {
        if (!query) return true;
        return [product.name, product.model, product.id].some((value) => String(value).toLocaleLowerCase('zh-CN').includes(query));
      });

    const rows = filtered.map((product) => {
      const parent = productCategoryById(product.productCategoryId);
      const consumableCount = consumablesForProduct(product.id).length;
      return `
        <tr>
          <td><span class="tag tag-neutral">${escapeHtml(parent ? parent.name : '—')}</span></td>
          <td><span class="cell-strong">${escapeHtml(product.name)}</span><span class="cell-secondary">${escapeHtml(product.app)}</span></td>
          <td><span class="cell-mono">${escapeHtml(product.model)}</span></td>
          <td><span class="cell-mono">${escapeHtml(product.id)}</span></td>
          <td><span class="tag ${product.status === '已上架' ? 'tag-green' : 'tag-blue'}">${escapeHtml(product.status)}</span></td>
          
          <td class="operation-cell">
            <a class="text-button" href="${buildHash('consumables', product.id, null, null)}" aria-label="查看 ${escapeHtml(product.name)} 的耗材管理">查看 ${icon('arrowRight')}</a>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="page-heading">
        <div>
          <span class="page-eyebrow">智能产品</span>
          <h1 class="page-title">产品列表</h1>
          <p class="page-description">定位产品后进入产品详情的高级配置，耗材管理始终沿用当前产品上下文。</p>
        </div>
        <div class="page-heading-side"><span class="demo-data-tag">演示数据</span></div>
      </div>
      <section class="surface-card filter-card" aria-labelledby="productFilterTitle">
        <div class="filter-heading"><strong id="productFilterTitle">筛选条件</strong></div>
        <form class="filter-row" id="productFilterForm">
          <label class="filter-item">
            <span class="filter-label">产品分类</span>
            <select name="productCategoryId" id="productProductCategoryFilter">
              ${productCategoryOptionMarkup(filter.productCategoryId, true)}
            </select>
          </label>
          <label class="filter-item wide">
            <span class="filter-label">产品名称 / 型号 / ID</span>
            <span class="input-with-icon">
              ${icon('search')}
              <input type="search" id="productQueryFilter" name="query" value="${escapeHtml(filter.query)}" placeholder="输入产品名称、型号或产品 ID">
            </span>
          </label>
          <div class="filter-actions">
            <button class="btn btn-primary" type="submit">查询</button>
            <button class="btn" type="button" data-action="reset-product-filter">重置</button>
          </div>
        </form>
      </section>
      <section class="surface-card data-card" data-note-target="PRO-01" aria-labelledby="productTableTitle">
        <div class="table-toolbar">
          <div class="table-toolbar-title">
            <strong id="productTableTitle">产品</strong>
            <span class="table-count">共 ${filtered.length} 条</span>
            ${noteAnchor('PRO-01')}
          </div>
          <div class="table-toolbar-actions"><span class="tag tag-neutral">产品分类来自现有主数据</span></div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">产品分类</th>
                <th scope="col">产品名称</th>
                <th scope="col">产品型号</th>
                <th scope="col">产品 ID</th>
                <th scope="col">产品状态</th>
                
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>${filtered.length ? rows : ''}</tbody>
          </table>
          ${filtered.length ? '' : `
            <div class="empty-state">
              <div>
                <div class="empty-icon">${icon('search')}</div>
                <p class="empty-title">没有匹配的产品</p>
                <p class="empty-copy">调整产品分类或产品关键词后重新查询。</p>
                <button class="btn" type="button" data-action="reset-product-filter">清除筛选</button>
              </div>
            </div>
          `}
        </div>
        <div class="table-footer">
          <span>演示数据 · 产品列表不提供按耗材分类的跨产品查询</span>
          <span class="pager"><button type="button" disabled>上一页</button><button type="button" class="is-current">1</button><button type="button" disabled>下一页</button></span>
        </div>
      </section>
    `;
  }

  function renderConsumableCategoryCell(record) {
    if (isRecordPending(record)) {
      return `<span class="category-cell"><span class="tag tag-amber">待初始化</span><span class="category-id">分类关系尚未映射</span></span>`;
    }
    const category = categoryById(record.categoryId);
    return `<span class="category-cell"><span class="tag tag-blue">${escapeHtml(category ? category.name : '分类失效')}</span></span>`;
  }

  function renderConsumablePage() {
    const product = productById(ui.productId) || PRODUCTS[0];
    const parent = productCategoryById(product.productCategoryId);
    const availableCategories = categoriesForProduct(product);
    const records = consumablesForProduct(product.id).slice().sort((a, b) => {
      const sortDiff = Number(a.sort || 0) - Number(b.sort || 0);
      return sortDiff !== 0 ? sortDiff : a.name.localeCompare(b.name, 'zh-CN');
    });

    const steps = ['基础信息', '功能设计', '扩展程序', '设备调试', '配网引导', '高级配置'];
    const stepBar = steps.map((step, index) => `
      <button class="step-item${index === 5 ? ' is-active' : ''}" type="button" data-action="scope-step" data-label="${escapeHtml(step)}" aria-current="${index === 5 ? 'step' : 'false'}">
        <span class="step-index">${index + 1}</span>${escapeHtml(step)}
      </button>
    `).join('');

    const rows = records.map((record, index) => {
      const pending = isRecordPending(record);
      const category = categoryById(record.categoryId);
      const categoryInvalid = !pending && (!category || category.productCategoryId !== product.productCategoryId);
      return `
        <tr class="${record.id === ui.highlightConsumableId ? 'is-highlighted' : ''}">
          <td class="change-column">${renderConsumableCategoryCell(record)}</td>
          <td class="consumable-name"><span class="cell-strong">${escapeHtml(record.name)}</span></td>
          <td><span class="legacy-image" aria-label="既有耗材图片示意">图片</span></td>
          <td>${escapeHtml(record.trigger || '—')}</td>
          <td>${escapeHtml(record.replacementCycle || '—')}</td>
          <td title="${escapeHtml(record.intro || '')}">${escapeHtml(truncate(record.intro || '—', 24))}</td>
          <td><span class="cell-secondary">原有指引</span></td>
          <td>${escapeHtml(String(record.sort == null ? 0 : record.sort))}</td>
          <td>${escapeHtml(purchaseLabel(record.purchaseType))}</td>
          <td class="operation-cell" data-note-target="CON-04">
            ${index === 0 ? noteAnchor('CON-04') : ''}
            <button class="text-button" type="button" data-action="edit-consumable" data-id="${escapeHtml(record.id)}"${categoryInvalid ? ' data-invalid-category="true"' : ''}>编辑</button>
          </td>
        </tr>
      `;
    }).join('');

    let tableContent = '';
    if (!availableCategories.length) {
      tableContent = `
        <div class="empty-state">
          <div>
            <div class="empty-icon">${icon('box')}</div>
            <p class="empty-title">当前产品分类暂无耗材分类</p>
            <p class="empty-copy">「${escapeHtml(parent ? parent.name : '当前产品分类')}」还没有可用的耗材分类。添加耗材前需要先在配置中心维护分类。</p>
            <button class="btn btn-primary" type="button" data-action="go-maintain-empty">去配置中心维护</button>
          </div>
        </div>
      `;
    } else if (!records.length) {
      tableContent = `
        <div class="empty-state">
          <div>
            <div class="empty-icon">${icon('box')}</div>
            <p class="empty-title">还没有耗材配置</p>
            <p class="empty-copy">添加第一条耗材，并选择一个属于「${escapeHtml(parent ? parent.name : '当前产品分类')}」的耗材分类。</p>
            <button class="btn btn-primary" type="button" data-action="open-consumable-create">${icon('plus')}添加耗材</button>
          </div>
        </div>
      `;
    } else {
      tableContent = `
        <div class="table-wrap" data-note-target="CON-03">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col" class="change-column">耗材分类 <span class="change-mark">新增</span></th>
                <th scope="col">耗材名称</th>
                <th scope="col">耗材图片</th>
                <th scope="col">触发条件</th>
                <th scope="col">建议更换周期</th>
                <th scope="col">耗材介绍</th>
                <th scope="col">更换指引</th>
                <th scope="col">排序</th>
                <th scope="col">购买入口</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }

    const initBanner = !data.initialized ? `
      <div class="inline-alert is-warning">
        <span class="inline-alert-icon">!</span>
        <div class="inline-alert-copy">
          <strong>存量分类关系待初始化</strong>
          <span>演示视图中，尚未映射的存量耗材显示为「待初始化」。编辑时必须选择合法分类；缺失分类不能保存。${noteAnchor('MIG-01')}</span>
        </div>
      </div>
    ` : '';

    return `
      <div class="page-heading">
        <div>
          <span class="page-eyebrow">智能产品 / 产品详情</span>
          <h1 class="page-title">高级配置</h1>
          <p class="page-description">配置当前产品的扩展能力；本原型聚焦耗材管理。</p>
        </div>
        <div class="page-heading-side"><span class="demo-data-tag">演示数据</span></div>
      </div>

      <section class="surface-card product-summary" data-note-target="CON-01" aria-labelledby="productSummaryTitle">
        <div class="product-summary-main">
          <span class="product-avatar">${icon('product')}</span>
          <div>
            <div class="product-summary-title">
              <h2 id="productSummaryTitle">${escapeHtml(product.name)}</h2>
              <span class="tag ${product.status === '已上架' ? 'tag-green' : 'tag-blue'}">${escapeHtml(product.status)}</span>
              ${noteAnchor('CON-01')}
            </div>
            <div class="product-meta">
              <span><b>产品型号</b> ${escapeHtml(product.model)}</span>
              <span><b>产品 ID</b> <span class="cell-mono">${escapeHtml(product.id)}</span></span>
              <span><b>产品分类</b> ${escapeHtml(parent ? parent.name : '—')}</span>
              
            </div>
          </div>
        </div>
        <div class="product-summary-side">
          <a class="btn" href="#page=products">${icon('arrowLeft')}返回列表</a>
        </div>
      </section>

      <nav class="detail-stepbar" aria-label="产品详情步骤">${stepBar}</nav>

      <div class="advanced-layout">
        <aside class="surface-card advanced-subnav" aria-label="高级配置子菜单">
          <div class="advanced-subnav-title">高级配置</div>
          <button class="advanced-nav-item" type="button" data-action="scope-config" data-label="新手指导"><span class="advanced-nav-dot"></span>新手指导</button>
          <button class="advanced-nav-item" type="button" data-action="scope-config" data-label="云倒计时"><span class="advanced-nav-dot"></span>云倒计时</button>
          <button class="advanced-nav-item" type="button" data-action="scope-config" data-label="场景联动设置"><span class="advanced-nav-dot"></span>场景联动设置</button>
          <button class="advanced-nav-item is-active" type="button" aria-current="page"><span class="advanced-nav-dot"></span>耗材管理</button>
        </aside>

        <section class="surface-card advanced-main" aria-labelledby="consumableSectionTitle">
          <div class="advanced-section-head">
            <div>
              <h3 id="consumableSectionTitle">耗材管理</h3>
              <p>当前产品共 ${records.length} 条耗材记录；分类仅限「${escapeHtml(parent ? parent.name : '当前产品分类')}」。</p>
            </div>
            <div class="advanced-section-actions">
              <span class="note-inline" data-note-target="CON-02">
                ${noteAnchor('CON-02')}
                <button class="btn btn-primary" type="button" data-action="open-consumable-create">${icon('plus')}添加耗材</button>
              </span>
            </div>
          </div>
          <div class="advanced-body">
            ${initBanner}
            ${tableContent}
          </div>
          <div class="table-footer">
            <span>演示数据 · 每条耗材配置归属于当前产品，分类改名不会改写耗材记录</span>
            <span class="tag tag-neutral">耗材分类不是耗材类型</span>
          </div>
        </section>
      </div>
    `;
  }

  function renderAdmin() {
    let pageContent = '';
    if (ui.page === 'products') pageContent = renderProductPage();
    else if (ui.page === 'consumables') pageContent = renderConsumablePage();
    else pageContent = renderCategoryPage();

    document.getElementById('adminCanvas').innerHTML = `
      <div class="admin-app">
        ${renderSidebar()}
        <div class="app-main">
          ${renderTopbar()}
          <main class="page-shell">${pageContent}</main>
        </div>
      </div>
    `;
  }

  function renderDemoPanelHost() {
    document.getElementById('demoHost').innerHTML = `<div class="review-scope"><strong>本期变更</strong> 配置中心新增耗材分类；耗材列表加分类列；新增/编辑加分类选择。<span>既有页面与字段沿用；带“新增”标签为本期变化，导航与其余布局为上下文示意。</span></div>` + renderDemoPanel();
  }

  function renderAnnotations() {
    const notes = getVisibleNotes();
    if (ui.note && !notes.some((note) => note.id === ui.note)) ui.note = null;

    document.getElementById('annotationContext').textContent = currentContextLabel();
    document.getElementById('annotationCount').textContent = String(notes.length);
    const list = document.getElementById('annotationList');

    if (!notes.length) {
      list.innerHTML = `<div class="annotation-empty">当前操作没有单独的产品规格批注。关闭弹窗后可继续查看页面批注。</div>`;
      return;
    }

    list.innerHTML = notes.map((note) => `
      <article class="annotation-card${ui.note === note.id ? ' is-active' : ''}" tabindex="0" role="button" aria-pressed="${ui.note === note.id}" data-note-card="${escapeHtml(note.id)}" aria-label="查看批注 ${escapeHtml(note.id)} ${escapeHtml(note.title)}">
        <span class="annotation-number">${escapeHtml(note.id)}</span>
        <span class="annotation-copy">
          <span class="annotation-title">${escapeHtml(note.title)}</span>
          <span class="annotation-location">关联位置：${escapeHtml(note.location)}</span>
          ${note.sections.map((section) => `
            <span class="annotation-block">
              <span class="annotation-label">${escapeHtml(section.label)}</span>
              <span class="annotation-lines">
                ${section.lines.map((line) => line.startsWith('流程图：')
                  ? `<span class="annotation-flow">${escapeHtml(line)}</span>`
                  : `<span class="annotation-line">${escapeHtml(line)}</span>`).join('')}
              </span>
            </span>
          `).join('')}
        </span>
      </article>
    `).join('');

    if (ui.note) locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
  }

  function renderToast() {
    const root = document.getElementById('toastRoot');
    if (!root) return;
    if (!ui.toast) {
      root.innerHTML = '';
      return;
    }
    root.innerHTML = `<div class="toast is-${escapeHtml(ui.toast.type || 'info')}" role="status">${escapeHtml(ui.toast.message)}</div>`;
  }

  function showToast(message, type = 'info', duration = 3400) {
    ui.toast = { message, type };
    renderToast();
    document.getElementById('liveStatus').textContent = message;
    if (ui.toastTimer) window.clearTimeout(ui.toastTimer);
    ui.toastTimer = window.setTimeout(() => {
      ui.toast = null;
      renderToast();
    }, duration);
  }

  function setMobileView(view) {
    if (view !== 'product' && view !== 'notes') return;
    ui.mobileView = view;
    document.body.dataset.mobileView = view;
    document.querySelectorAll('[data-mobile-target]').forEach((button) => {
      const active = button.dataset.mobileTarget === view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
  }

  function locateNote(id, options = {}) {
    const { updateHash = true, scroll = true, origin = 'card' } = options;
    if (!getVisibleNoteIds().includes(id)) return;
    if (!ui.modal && (id === 'MIG-01' || id === 'REL-01') && !ui.demoOpen) {
      ui.demoOpen = true;
      renderDemoPanelHost();
    }
    ui.note = id;

    document.querySelectorAll('[data-note-card]').forEach((card) => {
      const active = card.dataset.noteCard === id;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('.note-target-active').forEach((element) => element.classList.remove('note-target-active'));
    const scope = ui.modal ? document.getElementById('modalRoot') : document;
    const targets = scope.querySelectorAll(`[data-note-target="${id}"]`);
    targets.forEach((element) => element.classList.add('note-target-active'));

    const activeCard = document.querySelector(`[data-note-card="${id}"]`);
    const isNarrow = window.innerWidth <= 1080;

    if (origin === 'anchor' && isNarrow) {
      setMobileView('notes');
      window.requestAnimationFrame(() => {
        activeCard?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        activeCard?.focus({ preventScroll: true });
      });
    } else if (origin === 'card' && isNarrow) {
      setMobileView('product');
      window.requestAnimationFrame(() => {
        targets[0]?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        document.getElementById('productViewport')?.focus({ preventScroll: true });
      });
    } else {
      if (scroll && targets[0]) {
        targets[0].scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      }
      if (scroll && activeCard) {
        activeCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    if (updateHash) syncHash(id, true);
    document.getElementById('liveStatus').textContent = `已定位到原型批注 ${id}`;
  }

  function setFocusAfterRender(selector) {
    ui.focusAfterRender = selector;
  }

  function applyFocusAfterRender() {
    const selector = ui.focusAfterRender;
    ui.focusAfterRender = null;
    window.requestAnimationFrame(() => {
      const root = document.getElementById('modalRoot');
      if (!root) return;
      const preferred = selector ? root.querySelector(selector) : null;
      const autofocus = root.querySelector('[data-autofocus]');
      const fallback = root.querySelector('.modal-dialog');
      (preferred || autofocus || fallback)?.focus({ preventScroll: true });
    });
  }

  function closeModal(options = {}) {
    const { restoreFocus = true, force = false } = options;
    if (!ui.modal) return;
    if (ui.busy && !force) return;
    const trigger = ui.dialogTrigger;
    ui.optionLoadToken += 1;
    ui.modal = null;
    ui.formDraft = null;
    ui.fieldErrors = {};
    ui.modalError = '';
    ui.modalNotice = '';
    ui.busy = false;
    ui.optionState = 'ready';
    ui.note = null;
    document.getElementById('modalRoot').innerHTML = '';
    renderAnnotations();
    syncHash(null, true);
    if (restoreFocus && trigger && trigger.isConnected) {
      window.requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
    }
  }

  function modalErrorMarkup(message) {
    if (!message) return '';
    return `
      <div class="inline-alert is-error" role="alert">
        <span class="inline-alert-icon">!</span>
        <div class="inline-alert-copy">
          <strong>操作未完成</strong>
          <span>${escapeHtml(message)}</span>
        </div>
      </div>
    `;
  }

  function fieldErrorMarkup(name) {
    const error = ui.fieldErrors[name];
    if (!error) return '';
    return `<span class="field-error" id="${escapeHtml(name)}Error">${escapeHtml(error)}</span>`;
  }

  function fieldState(name) {
    const error = ui.fieldErrors[name];
    return error
      ? `aria-invalid="true" aria-describedby="${escapeHtml(name)}Error"`
      : '';
  }

  function selectOptions(items, selectedValue) {
    return items.map((item) => `<option value="${escapeHtml(item.value)}"${String(item.value) === String(selectedValue) ? ' selected' : ''}>${escapeHtml(item.label)}</option>`).join('');
  }

  function openCategoryDialog(mode = 'create', categoryId = null, options = {}) {
    const existing = categoryId ? categoryById(categoryId) : null;
    if (mode === 'edit' && !existing) {
      showToast('该耗材分类已不存在，请刷新列表。', 'error');
      return;
    }

    let defaultParentId = PRODUCT_CATEGORIES[0].id;
    if (ui.returnContext) {
      const sourceProduct = productById(ui.returnContext.productId);
      if (sourceProduct) defaultParentId = sourceProduct.productCategoryId;
    } else if (ui.categoryFilters.productCategoryId !== 'all') {
      defaultParentId = ui.categoryFilters.productCategoryId;
    }
    if (options.productCategoryId) defaultParentId = options.productCategoryId;

    ui.dialogTrigger = options.trigger || document.activeElement;
    ui.modal = {
      type: mode === 'create' ? 'category-create' : 'category-edit',
      categoryId: existing ? existing.id : null,
      productCategoryId: existing ? existing.productCategoryId : defaultParentId,
      mode
    };
    ui.formDraft = {
      name: existing ? existing.name : '',
      productCategoryId: existing ? existing.productCategoryId : defaultParentId
    };
    ui.fieldErrors = {};
    ui.modalError = '';
    ui.modalNotice = '';
    ui.busy = false;
    ui.optionState = 'ready';
    ui.note = options.noteId || 'CAT-05';
    setMobileView('product');
    renderModal();
    renderAnnotations();
    syncHash(ui.note, true);
    locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
    setFocusAfterRender(existing ? '#categoryNameInput' : '#categoryParentSelect');
    applyFocusAfterRender();
  }

  function openDeleteCategoryDialog(categoryId, trigger) {
    const category = categoryById(categoryId);
    if (!category) {
      showToast('该耗材分类已不存在，请刷新列表。', 'error');
      return;
    }
    ui.dialogTrigger = trigger || document.activeElement;
    ui.modal = {
      type: 'category-delete',
      categoryId,
      categoryName: category.name,
      productCategoryId: category.productCategoryId
    };
    ui.fieldErrors = {};
    ui.modalError = '';
    ui.modalNotice = '';
    ui.busy = false;
    ui.optionState = 'ready';
    ui.note = 'CAT-07';
    setMobileView('product');
    renderModal();
    renderAnnotations();
    syncHash(ui.note, true);
    locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
    setFocusAfterRender('.modal-footer .btn');
    applyFocusAfterRender();
  }

  function openConsumableDialog(mode = 'create', consumableId = null, options = {}) {
    const product = productById(options.productId || ui.productId) || PRODUCTS[0];
    const existing = consumableId ? consumableById(consumableId) : null;
    if (mode === 'edit' && !existing) {
      showToast('该耗材记录已不存在，请刷新列表。', 'error');
      return;
    }

    let draft;
    if (options.draft) {
      draft = { ...options.draft };
    } else if (existing) {
      draft = {
        categoryId: isRecordPending(existing) ? '' : existing.categoryId,
        name: existing.name,
        type: existing.type,
        trigger: existing.trigger,
        replacementCycle: existing.replacementCycle,
        country: existing.country,
        purchaseType: existing.purchaseType,
        purchaseUrl: existing.purchaseUrl,
        sort: existing.sort,
        intro: existing.intro
      };
    } else {
      draft = {
        categoryId: '',
        name: '',
        type: 'non-count',
        trigger: '',
        replacementCycle: '',
        country: '',
        purchaseType: 'none',
        purchaseUrl: '',
        sort: Math.max(0, consumablesForProduct(product.id).length + 1),
        intro: ''
      };
    }

    if (!draft.type) draft.type = 'non-count';
    if (!draft.purchaseType) draft.purchaseType = 'none';

    ui.dialogTrigger = options.trigger || document.activeElement;
    ui.modal = {
      type: mode === 'create' ? 'consumable-create' : 'consumable-edit',
      consumableId: existing ? existing.id : null,
      productId: product.id,
      mode
    };
    ui.formDraft = draft;
    ui.fieldErrors = {};
    ui.modalError = '';
    ui.modalNotice = '';
    ui.busy = false;
    ui.optionState = 'loading';
    ui.note = options.noteId || 'CON-05';
    setMobileView('product');
    renderModal();
    renderAnnotations();
    syncHash(ui.note, true);
    locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
    setFocusAfterRender('.modal-dialog');
    applyFocusAfterRender();
    loadConsumableOptions();
  }

  function openParentGuardDialog(trigger) {
    const parent = productCategoryById('2092494966475055105');
    const product = productById('DEMO-P-0002');
    ui.dialogTrigger = trigger || document.activeElement;
    ui.modal = {
      type: 'parent-guard',
      productCategoryId: parent.id,
      productId: product.id,
      guardResult: null
    };
    ui.busy = false;
    ui.note = 'REL-01';
    setMobileView('product');
    renderModal();
    renderAnnotations();
    syncHash(ui.note, true);
    locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
    setFocusAfterRender('.modal-dialog');
    applyFocusAfterRender();
  }

  function openResetDemoDialog(trigger) {
    ui.dialogTrigger = trigger || document.activeElement;
    ui.modal = { type: 'reset-demo' };
    ui.busy = false;
    ui.note = null;
    setMobileView('product');
    renderModal();
    renderAnnotations();
    syncHash(null, true);
    setFocusAfterRender('.modal-footer .btn');
    applyFocusAfterRender();
  }

  function loadConsumableOptions() {
    if (!ui.modal || !ui.modal.type.startsWith('consumable')) return;
    const token = ++ui.optionLoadToken;
    ui.optionState = 'loading';
    renderModal();
    renderAnnotations();
    locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
    const delay = ui.demo.slowLoad ? 2500 : 760;
    window.setTimeout(() => {
      if (token !== ui.optionLoadToken || !ui.modal || !ui.modal.type.startsWith('consumable')) return;
      if (ui.demo.failOptions) {
        ui.demo.failOptions = false;
        ui.optionState = 'error';
        renderDemoPanelHost();
        renderModal();
        renderAnnotations();
        locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
        return;
      }
      ui.optionState = 'ready';
      renderModal();
      renderAnnotations();
      locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
    }, delay);
  }

  function renderCategoryOptionsForDialog() {
    const product = productById(ui.modal.productId);
    const categories = categoriesForProduct(product);
    const selectedId = ui.formDraft?.categoryId || '';
    const categoryError = ui.fieldErrors.categoryId;

    if (ui.optionState === 'loading') {
      return `
        <div class="option-loading" aria-label="耗材分类加载中">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <span class="field-help">正在加载「${escapeHtml(productCategoryById(product.productCategoryId)?.name || '当前产品分类')}」下的耗材分类…</span>
        </div>
      `;
    }

    if (ui.optionState === 'error') {
      return `
        <div class="inline-alert is-error" role="alert">
          <span class="inline-alert-icon">!</span>
          <div class="inline-alert-copy">
            <strong>耗材分类加载失败</strong>
            <span>当前无法获取可选分类，保存已禁用。请检查连接后重试。</span>
            <button class="btn" type="button" data-action="retry-consumable-options">重试加载</button>
          </div>
        </div>
      `;
    }

    if (!categories.length) {
      return `
        <div class="option-message">
          <strong>当前产品分类暂无耗材分类</strong>
          先在配置中心新增分类，再返回此处添加或编辑耗材。表单输入会在跳转期间保留。
          <button class="btn" type="button" data-action="go-maintain-category">去配置中心维护</button>
        </div>
      `;
    }

    return `
      <div class="category-options" role="radiogroup" aria-label="耗材分类">
        ${categories.map((category) => `
          <label class="category-option${categoryError ? ' has-error' : ''}">
            <input type="radio" name="categoryId" value="${escapeHtml(category.id)}"${selectedId === category.id ? ' checked' : ''}${ui.busy ? ' disabled' : ''}>
            <span class="category-option-copy">
              <span class="category-option-name">${escapeHtml(category.name)}</span>
              <span class="category-option-id">${escapeHtml(category.id)} · ${escapeHtml(productCategoryById(category.productCategoryId)?.name || '')}</span>
            </span>
          </label>
        `).join('')}
      </div>
      ${categoryError ? `<button class="link-button" type="button" data-action="refresh-consumable-categories">刷新可选分类</button>` : ''}
    `;
  }

  function renderCategoryDialog() {
    const isCreate = ui.modal.type === 'category-create';
    const parent = productCategoryById(ui.modal.productCategoryId);
    const draft = ui.formDraft;
    const disabled = ui.busy ? 'disabled' : '';
    return `
      <div class="modal-backdrop">
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="categoryDialogTitle" tabindex="-1">
          <div class="modal-header">
            <div>
              <div class="modal-kicker">配置中心 / 耗材分类</div>
              <div class="modal-title-row"><h2 id="categoryDialogTitle">${isCreate ? '新增耗材分类' : '编辑耗材分类'}</h2></div>
            </div>
            <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭弹窗"${ui.busy ? ' disabled' : ''}>×</button>
          </div>
          <form class="modal-form" id="categoryForm" novalidate>
            <div class="modal-body">
              ${modalErrorMarkup(ui.modalError)}
              <section class="modal-section" data-note-target="CAT-05">
                <div class="modal-section-title"><span>分类信息</span>${noteAnchor('CAT-05')}</div>
                ${isCreate ? `
                  <label class="form-field">
                    <span>所属产品分类 <span class="required-mark">*</span></span>
                    <select id="categoryParentSelect" name="productCategoryId" ${fieldState('productCategoryId')} ${disabled}>
                      ${productCategoryOptionMarkup(draft.productCategoryId, false)}
                    </select>
                    <span class="field-help">耗材分类只在所属产品分类内供产品选择，保存后不可更换归属。</span>
                    ${fieldErrorMarkup('productCategoryId')}
                  </label>
                ` : `
                  <div class="readonly-block">
                    <div class="readonly-main">
                      <strong>${escapeHtml(parent ? parent.name : '产品分类缺失')}</strong>
                      <span>所属产品分类 · 编辑时只读，不允许更换</span>
                    </div>
                    <span class="readonly-lock" title="归属不可编辑">${icon('lock')}</span>
                  </div>
                `}
                <label class="form-field">
                  <span>耗材分类名称 <span class="required-mark">*</span></span>
                  <input type="text" id="categoryNameInput" name="name" value="${escapeHtml(draft.name)}" placeholder="请输入耗材分类名称" autocomplete="off" ${fieldState('name')} ${disabled}>
                  <span class="field-help">同一产品分类内名称不可重复；保存时忽略首尾空格，区分大小写。</span>
                  ${fieldErrorMarkup('name')}
                </label>
                <div class="readonly-block">
                  <div class="readonly-main">
                    <strong>${isCreate ? '保存后自动生成' : escapeHtml(ui.modal.categoryId)}</strong>
                    <span>耗材分类 ID · 稳定用于产品耗材关联，不随改名变化</span>
                  </div>
                  <span class="readonly-lock" title="分类 ID 不可编辑">${icon('lock')}</span>
                </div>
              </section>
            </div>
            <div class="modal-footer" data-note-target="CAT-06">
              <span class="modal-footer-note">${noteAnchor('CAT-06')} 保存失败保留输入；取消不写入。</span>
              <button class="btn" type="button" data-action="close-modal"${ui.busy ? ' disabled' : ''}>取消</button>
              <button class="btn btn-primary${ui.busy ? ' is-loading' : ''}" type="submit" ${ui.busy ? 'disabled' : ''}>
                ${ui.busy ? '<span class="mini-spinner"></span>保存中…' : (ui.modalError ? '重试保存' : '保存')}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderDeleteCategoryDialog() {
    const category = categoryById(ui.modal.categoryId);
    const parent = productCategoryById(ui.modal.productCategoryId);
    const references = referencesForCategory(ui.modal.categoryId);
    const hasReferences = references.length > 0;
    const disabled = ui.busy ? 'disabled' : '';
    return `
      <div class="modal-backdrop">
        <div class="modal-dialog is-narrow" role="dialog" aria-modal="true" aria-labelledby="deleteCategoryTitle" tabindex="-1">
          <div class="modal-header">
            <div>
              <div class="modal-kicker">配置中心 / 耗材分类</div>
              <div class="modal-title-row"><h2 id="deleteCategoryTitle">删除耗材分类</h2></div>
            </div>
            <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭弹窗"${ui.busy ? ' disabled' : ''}>×</button>
          </div>
          <div class="modal-body">
            ${modalErrorMarkup(ui.modalError)}
            <div class="dialog-summary" data-note-target="CAT-07">
              <div class="modal-section-title"><span>待删除分类</span>${noteAnchor('CAT-07')}</div>
              <div class="dialog-summary-row"><span>分类名称</span><strong>${escapeHtml(category ? category.name : ui.modal.categoryName)}</strong></div>
              <div class="dialog-summary-row"><span>所属产品分类</span><strong>${escapeHtml(parent ? parent.name : '—')}</strong></div>
              <div class="dialog-summary-row"><span>耗材分类 ID</span><strong class="cell-mono">${escapeHtml(ui.modal.categoryId)}</strong></div>
              <div class="dialog-summary-row"><span>当前引用</span><strong>${references.length} 条耗材</strong></div>
              ${hasReferences ? `
                <div class="reference-list">
                  ${references.slice(0, 5).map((reference) => `
                    <div class="reference-item">
                      <span>${escapeHtml(reference.consumable.name)}</span>
                      <small>${escapeHtml(reference.product.name)}</small>
                    </div>
                  `).join('')}
                  ${references.length > 5 ? `<div class="reference-item"><span>其余 ${references.length - 5} 条引用</span><small>未展开</small></div>` : ''}
                </div>
              ` : ''}
            </div>
            ${hasReferences ? `
              <div class="inline-alert is-error" role="alert">
                <span class="inline-alert-icon">!</span>
                <div class="inline-alert-copy"><strong>无法删除：分类已被产品耗材引用</strong><span>请先保留该分类并调整引用；系统不会级联删除耗材或把引用改为未分类。</span></div>
              </div>
            ` : `
              <div class="inline-alert is-warning">
                <span class="inline-alert-icon">!</span>
                <div class="inline-alert-copy"><strong>删除后不可恢复</strong><span>提交时会再次检查引用。删除成功只移除分类，不影响任何产品耗材记录。</span></div>
              </div>
            `}
          </div>
          <div class="modal-footer">
            <span class="modal-footer-note">${ui.demo.injectDeleteReference ? '场景已开启：确认时将先注入一条合法引用。' : '有引用的分类会被阻止删除。'}</span>
            <button class="btn" type="button" data-action="close-modal"${ui.busy ? ' disabled' : ''}>${hasReferences ? '关闭' : '取消'}</button>
            ${hasReferences ? '' : `<button class="btn btn-danger${ui.busy ? ' is-loading' : ''}" type="button" data-action="confirm-delete-category" ${ui.busy ? 'disabled' : ''}>${ui.busy ? '<span class="mini-spinner"></span>检查并删除…' : '确认删除'}</button>`}
          </div>
        </div>
      </div>
    `;
  }

  function renderConsumableDialog() {
    const product = productById(ui.modal.productId) || PRODUCTS[0];
    const parent = productCategoryById(product.productCategoryId);
    const draft = ui.formDraft;
    const isCreate = ui.modal.type === 'consumable-create';
    const disabled = ui.busy ? 'disabled' : '';
    const saveBlockedByOptions = ['loading', 'error'].includes(ui.optionState) || categoriesForProduct(product).length === 0;
    const nameLength = Array.from(String(draft.name || '')).length;
    const introLength = Array.from(String(draft.intro || '')).length;

    return `
      <div class="modal-backdrop">
        <div class="modal-dialog consumable-drawer" role="dialog" aria-modal="true" aria-labelledby="consumableDialogTitle" tabindex="-1">
          <div class="modal-header">
            <div>
              <div class="modal-kicker">${escapeHtml(product.name)} / 高级配置 / 耗材管理</div>
              <div class="modal-title-row"><h2 id="consumableDialogTitle">${isCreate ? '添加耗材' : '编辑耗材'}</h2><span class="tag tag-neutral">当前产品</span></div>
            </div>
            <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭弹窗"${ui.busy ? ' disabled' : ''}>×</button>
          </div>
          <form class="modal-form" id="consumableForm" novalidate>
            <div class="modal-body">
              ${modalErrorMarkup(ui.modalError)}
              <section class="modal-section" data-note-target="CON-05">
                <div class="modal-section-title"><span>耗材分类 <span class="required">*</span> <span class="change-mark">本期新增 / 可更换</span></span>${noteAnchor('CON-05')}</div>
                <div class="field-help">仅可选择「${escapeHtml(parent ? parent.name : '当前产品分类')}」下的一个耗材分类；耗材类型与耗材分类是两个独立字段。</div>
                ${renderCategoryOptionsForDialog()}
                ${fieldErrorMarkup('categoryId')}
              </section>

              <section class="modal-section" data-note-target="CON-06">
                <div class="modal-section-title"><span>耗材配置 <span class="legacy-mark">沿用现有 · 以下控件为示意</span></span>${noteAnchor('CON-06')}</div>
                <div class="form-grid legacy-form-grid">
                  <label class="form-field">
                    <span>耗材展示国家 <span class="required-mark">*</span></span>
                    <select id="consumableCountrySelect" name="country" ${disabled}>
                      ${selectOptions(COUNTRIES, draft.country || '')}
                    </select>
                  </label>
                  <label class="form-field">
                    <span>购买配置</span>
                    <select id="consumablePurchaseTypeSelect" name="purchaseType" ${disabled}>
                      ${selectOptions(PURCHASE_TYPES, draft.purchaseType || 'none')}
                    </select>
                  </label>
                  <label class="form-field span-2">
                    <span>购买链接</span>
                    <input type="url" id="consumablePurchaseUrlInput" name="purchaseUrl" value="${escapeHtml(draft.purchaseUrl || '')}" placeholder="独立站购买链接（完整配置沿用现有）" ${fieldState('purchaseUrl')} ${disabled}>
                    ${fieldErrorMarkup('purchaseUrl')}
                  </label>
                  <label class="form-field">
                    <span>排序</span>
                    <input type="number" id="consumableSortInput" name="sort" min="0" step="1" value="${escapeHtml(draft.sort)}" ${fieldState('sort')} ${disabled}>
                    ${fieldErrorMarkup('sort')}
                  </label>
                  <label class="form-field span-2">
                    <span class="field-label-row"><span>耗材名称 <span class="required-mark">*</span></span><span class="counter${nameLength >= 28 ? ' is-near-limit' : ''}" id="consumableNameCounter">${nameLength} / 30</span></span>
                    <input type="text" id="consumableNameInput" name="name" maxlength="30" value="${escapeHtml(draft.name)}" placeholder="请输入耗材名称" autocomplete="off" ${fieldState('name')} ${disabled}>
                    ${fieldErrorMarkup('name')}
                  </label>
                  <label class="form-field span-2">
                    <span class="field-label-row"><span>耗材介绍 <span class="required-mark">*</span></span><span class="counter${introLength >= 285 ? ' is-near-limit' : ''}" id="consumableIntroCounter">${introLength} / 300</span></span>
                    <textarea id="consumableIntroInput" name="intro" maxlength="300" placeholder="请输入耗材介绍" ${fieldState('intro')} ${disabled}>${escapeHtml(draft.intro || '')}</textarea>
                    ${fieldErrorMarkup('intro')}
                  </label>
                  <div class="form-field"><span>更换指引</span><div class="legacy-options">◉ 图片　○ 视频　○ 富文本</div><div class="legacy-upload">＋ 图片 / 视频 / 富文本编辑区<br><small>沿用当前组件与校验，原型不上传</small></div></div>
                  <label class="form-field">
                    <span>耗材类型 <span class="required-mark">*</span></span>
                    <select id="consumableTypeSelect" name="type" ${fieldState('type')} ${disabled}>
                      ${selectOptions(CONSUMABLE_TYPES, draft.type)}
                    </select>
                    ${fieldErrorMarkup('type')}
                  </label>
                  <div class="legacy-type-context">${draft.type === 'non-count' ? '非计数类耗材：沿用现有配置。' : '沿用现有类型条件：取值类型、固定值/范围值、推荐更换周期与单位、不足及耗尽状态值。此处不定义新配置规则。'}<span class="cell-secondary">原记录示意：${escapeHtml(draft.trigger || '—')} / ${escapeHtml(draft.replacementCycle || '—')}</span></div>
                  <div class="form-field"><span>耗材图片 <span class="required-mark">*</span></span><div class="legacy-upload">＋ 请上传图片<br><small>既有：建议100×100px，≤20M，png/jpg/jpeg；原型仅占位</small></div></div>
                </div>
                <div class="legacy-placeholder">
                  灰色区域用于呈现既有字段位置，不是新增、精简或改版要求。购买配置、国家、类型条件、上传及校验继续使用当前系统实现。
                </div>
              </section>
            </div>
            <div class="modal-footer" data-note-target="CON-07">
              <span class="modal-footer-note">${noteAnchor('CON-07')} ${ui.modalError ? '已保留全部输入，可直接重试。' : '保存中防重复；取消不写入。'}</span>
              <button class="btn" type="button" data-action="close-modal"${ui.busy ? ' disabled' : ''}>取消</button>
              <button class="btn btn-primary${ui.busy ? ' is-loading' : ''}" type="submit" ${ui.busy || saveBlockedByOptions ? 'disabled' : ''} title="${saveBlockedByOptions && !ui.busy ? '请先完成分类加载并选择耗材分类' : ''}">
                ${ui.busy ? '<span class="mini-spinner"></span>保存中…' : (ui.modalError ? '重试保存' : (isCreate ? '添加耗材' : '保存修改'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderParentGuardDialog() {
    const parent = productCategoryById(ui.modal.productCategoryId);
    const product = productById(ui.modal.productId);
    const categoryCount = data.categories.filter((category) => category.productCategoryId === ui.modal.productCategoryId).length;
    const consumableCount = data.consumables.filter((record) => {
      const category = categoryById(record.categoryId);
      return category && category.productCategoryId === ui.modal.productCategoryId;
    }).length;
    const result = ui.modal.guardResult;
    return `
      <div class="modal-backdrop">
        <div class="modal-dialog is-narrow" role="dialog" aria-modal="true" aria-labelledby="parentGuardTitle" tabindex="-1">
          <div class="modal-header">
            <div>
              <div class="modal-kicker">原型辅助 / 完整性检查</div>
              <div class="modal-title-row"><h2 id="parentGuardTitle">父级变更保护</h2><span class="tag tag-amber">原型演示</span></div>
            </div>
            <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭弹窗"${ui.busy ? ' disabled' : ''}>×</button>
          </div>
          <div class="modal-body" data-note-target="REL-01">
            <div class="modal-section-title"><span>检查上下文</span>${noteAnchor('REL-01')}</div>
            <div class="dialog-summary">
              <div class="dialog-summary-row"><span>产品分类</span><strong>${escapeHtml(parent ? parent.name : '—')} / ${escapeHtml(parent ? parent.id : '—')}</strong></div>
              <div class="dialog-summary-row"><span>关联耗材分类</span><strong>${categoryCount} 个</strong></div>
              <div class="dialog-summary-row"><span>关联耗材记录</span><strong>${consumableCount} 条</strong></div>
              <div class="dialog-summary-row"><span>调整测试产品</span><strong>${escapeHtml(product ? product.name : '—')}</strong></div>
            </div>
            <p class="field-help">以下操作只执行演示校验：不会删除产品分类、修改产品归属或写入真实环境。</p>
            ${result ? `
              <div class="inline-alert ${result.blocked ? 'is-error' : 'is-warning'}" role="alert">
                <span class="inline-alert-icon">!</span>
                <div class="inline-alert-copy"><strong>${result.blocked ? '操作被业务规则阻止' : '需要研发进一步核对'}</strong><span>${escapeHtml(result.message)}</span></div>
              </div>
            ` : ''}
          </div>
          <div class="modal-footer">
            <span class="modal-footer-note">保留此结果供 PRD / 验证记录引用</span>
            <button class="btn" type="button" data-action="close-modal">关闭</button>
            <button class="btn" type="button" data-action="check-parent-delete"${ui.busy ? ' disabled' : ''}>尝试删除产品分类</button>
            <button class="btn" type="button" data-action="check-parent-move"${ui.busy ? ' disabled' : ''}>尝试调整产品分类</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderResetDemoDialog() {
    return `
      <div class="modal-backdrop">
        <div class="modal-dialog is-narrow" role="dialog" aria-modal="true" aria-labelledby="resetDemoTitle" tabindex="-1">
          <div class="modal-header">
            <div>
              <div class="modal-kicker">原型辅助</div>
              <div class="modal-title-row"><h2 id="resetDemoTitle">重置演示数据</h2></div>
            </div>
            <button class="modal-close" type="button" data-action="close-modal" aria-label="关闭弹窗"${ui.busy ? ' disabled' : ''}>×</button>
          </div>
          <div class="modal-body">
            <div class="inline-alert is-warning">
              <span class="inline-alert-icon">!</span>
              <div class="inline-alert-copy"><strong>将丢弃当前演示修改</strong><span>分类、耗材、初始化开关与异常注入会恢复为预置状态。该操作不会访问真实开发站点。</span></div>
            </div>
          </div>
          <div class="modal-footer">
            <span class="modal-footer-note">原型辅助操作</span>
            <button class="btn" type="button" data-action="close-modal"${ui.busy ? ' disabled' : ''}>取消</button>
            <button class="btn btn-danger${ui.busy ? ' is-loading' : ''}" type="button" data-action="confirm-reset-demo" ${ui.busy ? 'disabled' : ''}>${ui.busy ? '<span class="mini-spinner"></span>重置中…' : '确认重置'}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderModal() {
    const root = document.getElementById('modalRoot');
    if (!ui.modal) {
      root.innerHTML = '';
      return;
    }
    const active = document.activeElement;
    const hadModalFocus = root.contains(active);
    const activeId = hadModalFocus ? active?.id || '' : '';
    const activeName = hadModalFocus ? active?.name || '' : '';
    const activeRadioValue = hadModalFocus && active?.type === 'radio' ? active.value : '';

    if (ui.modal.type === 'category-create' || ui.modal.type === 'category-edit') root.innerHTML = renderCategoryDialog();
    else if (ui.modal.type === 'category-delete') root.innerHTML = renderDeleteCategoryDialog();
    else if (ui.modal.type === 'consumable-create' || ui.modal.type === 'consumable-edit') root.innerHTML = renderConsumableDialog();
    else if (ui.modal.type === 'parent-guard') root.innerHTML = renderParentGuardDialog();
    else if (ui.modal.type === 'reset-demo') root.innerHTML = renderResetDemoDialog();

    if (ui.focusAfterRender) {
      applyFocusAfterRender();
    } else if (hadModalFocus) {
      window.requestAnimationFrame(() => {
        let target = activeId ? root.querySelector(`#${activeId}`) : null;
        if (!target && activeName) {
          target = root.querySelector(`[name="${activeName}"]${activeRadioValue ? `[value="${activeRadioValue}"]` : ''}`);
        }
        (target || root.querySelector('.modal-dialog'))?.focus({ preventScroll: true });
      });
    }
  }

  function refreshPageUI(options = {}) {
    const { locate = true } = options;
    renderAdmin();
    renderDemoPanelHost();
    renderAnnotations();
    if (locate && ui.note) {
      locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
    }
  }

  function handleRoute() {
    const route = parseHashRoute();
    const pageChanged = route.page !== ui.page || (route.page === 'consumables' && route.productId !== ui.productId);
    if (ui.modal && pageChanged) {
      ui.optionLoadToken += 1;
      ui.modal = null;
      ui.formDraft = null;
      ui.fieldErrors = {};
      ui.modalError = '';
      ui.busy = false;
      ui.optionState = 'ready';
      document.getElementById('modalRoot').innerHTML = '';
    }

    ui.page = route.page;
    ui.productId = route.productId;
    ui.returnContext = route.returnTo === 'consumable' ? { returnTo: 'consumable', productId: route.productId } : null;
    ui.note = null;

    renderAdmin();
    renderDemoPanelHost();
    renderAnnotations();

    if (pageChanged) {
      const viewport = document.getElementById('productViewport');
      if (viewport) viewport.scrollTo({ top: 0, left: 0 });
    }

    if (route.note) {
      const visible = getVisibleNoteIds().includes(route.note);
      if (visible) {
        ui.note = route.note;
        renderAnnotations();
        locateNote(route.note, { updateHash: false, scroll: true, origin: 'render' });
        if (window.innerWidth <= 1080) setMobileView('notes');
      } else if (Object.values(MODAL_NOTE_IDS).some((ids) => ids.includes(route.note))) {
        openDialogForNote(route.note);
        if (window.innerWidth <= 1080) setMobileView('notes');
      }
    }

    if (ui.pendingConsumableDraft && ui.page === 'consumables' && !ui.modal) {
      const pendingDraft = ui.pendingConsumableDraft;
      ui.pendingConsumableDraft = null;
      clearDraftSession();
      openConsumableDialog(pendingDraft.mode || 'create', pendingDraft.consumableId || null, {
        productId: pendingDraft.productId || ui.productId,
        draft: pendingDraft
      });
    }
  }

  function openDialogForNote(noteId) {
    if (noteId === 'CAT-05' || noteId === 'CAT-06') {
      openCategoryDialog('create', null, { noteId });
      return;
    }
    if (noteId === 'CAT-07') {
      const category = data.categories.find((item) => item.name === '清洁刷') || data.categories[0];
      if (category) openDeleteCategoryDialog(category.id, document.activeElement);
      return;
    }
    if (noteId === 'CON-05' || noteId === 'CON-06' || noteId === 'CON-07') {
      openConsumableDialog('create', null, { noteId, productId: ui.productId });
      return;
    }
    if (noteId === 'REL-01') openParentGuardDialog(document.activeElement);
  }

  function setInitState(nextInitialized) {
    data.initialized = Boolean(nextInitialized);
    persistData();
    refreshPageUI();
    showToast(data.initialized ? '已切换到存量初始化后视图。' : '已切换到存量初始化前视图；仅演示呈现，不执行迁移。', 'info');
  }

  function toggleDemoFlag(flag) {
    if (!(flag in ui.demo)) return;
    ui.demo[flag] = !ui.demo[flag];
    renderDemoPanelHost();
    if (ui.note) locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
  }

  function startMaintenanceFlow(draft, trigger) {
    const productId = draft?.productId || ui.productId;
    const product = productById(productId) || PRODUCTS[0];
    const storedDraft = {
      productId: product.id,
      mode: draft?.mode || 'create',
      consumableId: draft?.consumableId || null,
      categoryId: draft?.categoryId || '',
      name: draft?.name || '',
      type: draft?.type || 'non-count',
      trigger: draft?.trigger || '',
      replacementCycle: draft?.replacementCycle || '',
      country: draft?.country || '',
      purchaseType: draft?.purchaseType || 'none',
      purchaseUrl: draft?.purchaseUrl || '',
      sort: draft?.sort ?? 1,
      intro: draft?.intro || ''
    };
    writeDraftSession(storedDraft);
    ui.optionLoadToken += 1;
    ui.modal = null;
    ui.formDraft = null;
    ui.fieldErrors = {};
    ui.modalError = '';
    ui.busy = false;
    ui.optionState = 'ready';
    ui.note = null;
    document.getElementById('modalRoot').innerHTML = '';
    ui.returnContext = { returnTo: 'consumable', productId: product.id };
    ui.dialogTrigger = trigger || null;
    setMobileView('product');
    window.location.hash = buildHash('categories', product.id, null, 'consumable');
  }

  function goMaintainFromPage(trigger) {
    const product = productById(ui.productId) || PRODUCTS[0];
    startMaintenanceFlow({
      productId: product.id,
      mode: 'create',
      categoryId: '',
      name: '',
      type: 'non-count',
      trigger: '',
      replacementCycle: '',
      country: '',
      purchaseType: 'none',
      purchaseUrl: '',
      sort: 1,
      intro: ''
    }, trigger);
  }

  function returnToConsumableForm() {
    const draft = readDraftSession();
    if (!draft) {
      showToast('未找到保留的耗材表单，请返回产品耗材页重新添加。', 'error');
      return;
    }
    ui.pendingConsumableDraft = draft;
    ui.returnContext = null;
    ui.note = null;
    window.location.hash = buildHash('consumables', draft.productId || ui.productId, null, null);
  }

  function readVisibleConsumableDraft() {
    return {
      ...ui.formDraft,
      productId: ui.modal?.productId || ui.productId,
      mode: ui.modal?.mode || (ui.modal?.type === 'consumable-edit' ? 'edit' : 'create'),
      consumableId: ui.modal?.consumableId || null
    };
  }

  function filterCategoryList() {
    const parentSelect = document.getElementById('categoryProductCategoryFilter');
    const queryInput = document.getElementById('categoryNameFilter');
    if (parentSelect) ui.categoryFilters.productCategoryId = parentSelect.value;
    if (queryInput) ui.categoryFilters.query = queryInput.value;
    renderAdmin();
    renderAnnotations();
    if (ui.note) locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
  }

  function filterProductList() {
    const parentSelect = document.getElementById('productProductCategoryFilter');
    const queryInput = document.getElementById('productQueryFilter');
    if (parentSelect) ui.productFilters.productCategoryId = parentSelect.value;
    if (queryInput) ui.productFilters.query = queryInput.value;
    renderAdmin();
    renderAnnotations();
    if (ui.note) locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
  }

  function validateCategoryDraft() {
    const errors = {};
    const name = String(ui.formDraft.name || '').trim();
    if (!name) errors.name = '请输入耗材分类名称。';
    if (ui.modal.type === 'category-create') {
      if (!productCategoryById(ui.formDraft.productCategoryId)) errors.productCategoryId = '请选择有效的产品分类。';
    }
    if (!errors.name && ui.formDraft.productCategoryId) {
      const duplicate = data.categories.some((category) =>
        category.productCategoryId === ui.formDraft.productCategoryId &&
        category.name.trim() === name &&
        category.id !== ui.modal.categoryId
      );
      if (duplicate) errors.name = `同一产品分类下已存在名称「${name}」。`;
    }
    ui.fieldErrors = errors;
    return { valid: Object.keys(errors).length === 0, name };
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();
    if (!ui.modal || !['category-create', 'category-edit'].includes(ui.modal.type) || ui.busy) return;
    const nameInput = document.getElementById('categoryNameInput');
    const parentSelect = document.getElementById('categoryParentSelect');
    if (nameInput) ui.formDraft.name = nameInput.value;
    if (parentSelect) ui.formDraft.productCategoryId = parentSelect.value;
    ui.modalError = '';
    const validation = validateCategoryDraft();
    if (!validation.valid) {
      const firstError = ui.fieldErrors.name ? '#categoryNameInput' : '#categoryParentSelect';
      setFocusAfterRender(firstError);
      renderModal();
      renderAnnotations();
      locateNote('CAT-05', { updateHash: false, scroll: false, origin: 'render' });
      return;
    }

    const wasCreate = ui.modal.type === 'category-create';
    const editingId = ui.modal.categoryId;
    const returnContext = ui.returnContext ? { ...ui.returnContext } : null;
    ui.busy = true;
    ui.modalError = '';
    renderModal();
    renderAnnotations();
    await sleep(620);

    if (ui.demo.failNextSave) {
      ui.demo.failNextSave = false;
      ui.busy = false;
      ui.modalError = '保存失败：分类未写入。已保留全部填写内容，可直接重试。';
      renderDemoPanelHost();
      renderModal();
      renderAnnotations();
      locateNote('CAT-06', { updateHash: false, scroll: false, origin: 'render' });
      return;
    }

    if (!wasCreate) {
      const current = categoryById(editingId);
      if (!current) {
        ui.busy = false;
        ui.modalError = '保存失败：该分类已不存在，请关闭弹窗后刷新列表。';
        renderModal();
        renderAnnotations();
        return;
      }
      current.name = validation.name;
      current.updatedAt = nowIso();
    } else {
      const id = nextCategoryId();
      data.categories.push({
        id,
        productCategoryId: ui.formDraft.productCategoryId,
        name: validation.name,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    }

    persistData();
    const createdCategoryId = data.categories.find((category) => category.name === validation.name && category.productCategoryId === ui.formDraft.productCategoryId)?.id || null;
    closeModal({ restoreFocus: false, force: true });
    ui.busy = false;

    if (wasCreate && returnContext) {
      const draft = readDraftSession();
      if (draft && createdCategoryId) {
        draft.categoryId = createdCategoryId;
        writeDraftSession(draft);
        ui.pendingConsumableDraft = { ...draft };
        ui.returnContext = null;
        showToast('分类已创建，正在返回原耗材表单。', 'success');
        window.location.hash = buildHash('consumables', draft.productId || returnContext.productId, null, null);
        return;
      }
    }

    refreshPageUI();
    showToast(wasCreate ? '耗材分类已新增，系统已自动生成稳定 ID。' : '耗材分类已改名，分类 ID 与既有关联保持不变。', 'success');
  }

  function validateConsumableDraft() {
    const errors = {};
    const product = productById(ui.modal.productId) || PRODUCTS[0];
    const name = String(ui.formDraft.name || '').trim();
    const intro = String(ui.formDraft.intro || '');
    const category = categoryById(ui.formDraft.categoryId);
    const availableCategories = categoriesForProduct(product);

    if (!ui.formDraft.categoryId) {
      errors.categoryId = '请先选择一个耗材分类。';
    } else if (!category || !availableCategories.some((item) => item.id === category.id)) {
      errors.categoryId = '所选分类已失效或不属于当前产品分类，请刷新后重新选择。';
    }
    if (!name) errors.name = '请输入耗材名称。';
    if (Array.from(name).length > 30) errors.name = '耗材名称不得超过 30 字。';
    if (Array.from(intro).length > 300) errors.intro = '耗材介绍不得超过 300 字。';
    if (!CONSUMABLE_TYPES.some((item) => item.value === ui.formDraft.type)) errors.type = '请选择有效的耗材类型。';
    ui.fieldErrors = errors;
    return { valid: Object.keys(errors).length === 0, name, intro };
  }

  async function handleConsumableSubmit(event) {
    event.preventDefault();
    if (!ui.modal || !ui.modal.type.startsWith('consumable') || ui.busy) return;
    if (ui.optionState !== 'ready') return;

    const nameInput = document.getElementById('consumableNameInput');
    const introInput = document.getElementById('consumableIntroInput');
    if (nameInput) ui.formDraft.name = nameInput.value;
    if (introInput) ui.formDraft.intro = introInput.value;
    ui.modalError = '';
    const validation = validateConsumableDraft();
    if (!validation.valid) {
      const order = ['categoryId', 'name', 'type', 'sort', 'purchaseUrl', 'intro'];
      const first = order.find((key) => ui.fieldErrors[key]);
      const selectors = {
        categoryId: 'input[name="categoryId"]',
        name: '#consumableNameInput',
        type: '#consumableTypeSelect',
        sort: '#consumableSortInput',
        purchaseUrl: '#consumablePurchaseUrlInput',
        intro: '#consumableIntroInput'
      };
      setFocusAfterRender(selectors[first]);
      renderModal();
      renderAnnotations();
      locateNote('CON-05', { updateHash: false, scroll: false, origin: 'render' });
      return;
    }

    const isCreate = ui.modal.type === 'consumable-create';
    const editingId = ui.modal.consumableId;
    ui.busy = true;
    ui.modalError = '';
    renderModal();
    renderAnnotations();
    await sleep(680);

    if (ui.demo.failNextSave) {
      ui.demo.failNextSave = false;
      ui.busy = false;
      ui.modalError = '保存失败：耗材未写入。已保留分类、名称和其他全部字段，可直接重试。';
      renderDemoPanelHost();
      renderModal();
      renderAnnotations();
      locateNote('CON-07', { updateHash: false, scroll: false, origin: 'render' });
      return;
    }

    if (ui.demo.invalidRelationNextSave) {
      ui.demo.invalidRelationNextSave = false;
      ui.busy = false;
      ui.fieldErrors = { categoryId: '分类关系校验失败：所选分类已失效或不属于当前产品分类。' };
      ui.modalError = '保存被阻止：提交时分类关系不合法，其他字段与当前选择已保留。请刷新分类后重选。';
      renderDemoPanelHost();
      renderModal();
      renderAnnotations();
      locateNote('CON-05', { updateHash: false, scroll: false, origin: 'render' });
      return;
    }

    const product = productById(ui.modal.productId) || PRODUCTS[0];
    const category = categoryById(ui.formDraft.categoryId);
    if (!category || category.productCategoryId !== product.productCategoryId) {
      ui.busy = false;
      ui.fieldErrors = { categoryId: '所选分类在保存前已失效，请刷新分类后重新选择。' };
      ui.modalError = '保存被阻止：分类关系已变化，未写入任何数据。';
      renderModal();
      renderAnnotations();
      return;
    }

    let savedId = editingId;
    if (isCreate) {
      savedId = nextConsumableId();
      data.consumables.push({
        id: savedId,
        productId: product.id,
        categoryId: ui.formDraft.categoryId,
        name: validation.name,
        intro: validation.intro,
        type: ui.formDraft.type,
        trigger: ui.formDraft.trigger || '',
        replacementCycle: ui.formDraft.replacementCycle || '',
        country: ui.formDraft.country || '',
        purchaseType: ui.formDraft.purchaseType || 'none',
        purchaseUrl: ui.formDraft.purchaseUrl || '',
        sort: ui.formDraft.sort === '' ? 0 : Number(ui.formDraft.sort || 0),
        legacy: false,
        mappedInPreinit: true,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    } else {
      const current = consumableById(editingId);
      if (!current || current.productId !== product.id) {
        ui.busy = false;
        ui.modalError = '保存失败：该耗材记录已不存在，请关闭后刷新列表。';
        renderModal();
        renderAnnotations();
        return;
      }
      Object.assign(current, {
        categoryId: ui.formDraft.categoryId,
        name: validation.name,
        intro: validation.intro,
        type: ui.formDraft.type,
        trigger: ui.formDraft.trigger || '',
        replacementCycle: ui.formDraft.replacementCycle || '',
        country: ui.formDraft.country || '',
        purchaseType: ui.formDraft.purchaseType || 'none',
        purchaseUrl: ui.formDraft.purchaseUrl || '',
        sort: ui.formDraft.sort === '' ? 0 : Number(ui.formDraft.sort || 0),
        mappedInPreinit: true,
        updatedAt: nowIso()
      });
    }

    persistData();
    closeModal({ restoreFocus: false, force: true });
    ui.busy = false;
    ui.highlightConsumableId = savedId;
    refreshPageUI();
    showToast(isCreate ? '耗材已添加，并关联到所选耗材分类。' : '耗材已保存；本次只更新当前产品这一条记录。', 'success');
    window.setTimeout(() => {
      const row = document.querySelector('.data-table tr.is-highlighted');
      row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 80);
    window.setTimeout(() => {
      ui.highlightConsumableId = null;
    }, 2600);
  }

  async function confirmDeleteCategory() {
    if (!ui.modal || ui.modal.type !== 'category-delete' || ui.busy) return;
    const category = categoryById(ui.modal.categoryId);
    ui.busy = true;
    ui.modalError = '';
    renderModal();
    renderAnnotations();
    await sleep(560);

    if (ui.demo.injectDeleteReference && category) {
      const targetProduct = PRODUCTS.find((product) => product.productCategoryId === category.productCategoryId);
      if (targetProduct) {
        data.consumables.push({
          id: nextConsumableId(),
          productId: targetProduct.id,
          categoryId: category.id,
          name: '并发新增引用（原型）',
          intro: '原型演示：删除确认期间新增的合法引用。',
          type: 'non-count',
          trigger: '手动触发',
          replacementCycle: '按需',
          country: '',
          purchaseType: 'none',
          purchaseUrl: '',
          sort: 99,
          legacy: false,
          mappedInPreinit: true,
          createdAt: nowIso(),
          updatedAt: nowIso()
        });
        persistData();
      }
      ui.demo.injectDeleteReference = false;
      renderDemoPanelHost();
    }

    const latestReferences = referencesForCategory(ui.modal.categoryId);
    if (!category) {
      ui.busy = false;
      ui.modalError = '删除失败：该分类已不存在，请关闭后刷新列表。';
      renderModal();
      renderAnnotations();
      return;
    }
    if (latestReferences.length > 0) {
      ui.busy = false;
      ui.modalError = `删除被阻止：确认提交时该分类已有 ${latestReferences.length} 条引用。分类和所有关联记录均已保留。`;
      renderModal();
      renderAnnotations();
      return;
    }

    data.categories = data.categories.filter((item) => item.id !== category.id);
    persistData();
    closeModal({ restoreFocus: false, force: true });
    ui.busy = false;
    refreshPageUI();
    showToast('耗材分类已删除；删除前引用检查通过。', 'success');
  }

  async function checkParentGuard(type) {
    if (!ui.modal || ui.modal.type !== 'parent-guard' || ui.busy) return;
    ui.busy = true;
    ui.modal.guardResult = null;
    renderModal();
    renderAnnotations();
    await sleep(320);
    const parentId = ui.modal.productCategoryId;
    const relatedCategories = data.categories.filter((category) => category.productCategoryId === parentId);
    const product = productById(ui.modal.productId);
    const relatedConsumables = data.consumables.filter((record) => {
      const category = categoryById(record.categoryId);
      return category && category.productCategoryId === parentId;
    });
    let result;
    if (type === 'delete') {
      result = relatedCategories.length
        ? { blocked: true, message: `产品分类下仍有 ${relatedCategories.length} 个耗材分类，删除会造成悬空关系，操作已阻止。` }
        : { blocked: false, message: '当前没有耗材分类；仍需由既有接口和数据库约束完成真实保护验证。' };
    } else {
      const productReferences = relatedConsumables.filter((record) => record.productId === product?.id);
      result = productReferences.length
        ? { blocked: true, message: `产品「${product?.name || ''}」仍有 ${productReferences.length} 条耗材关联，调整所属产品分类会造成越界或悬空关系，操作已阻止。` }
        : { blocked: false, message: '仅依据当前演示数据未发现阻止条件；不能据此宣称现网保护已通过。' };
    }
    ui.modal.guardResult = result;
    ui.busy = false;
    renderModal();
    renderAnnotations();
    locateNote('REL-01', { updateHash: false, scroll: false, origin: 'render' });
  }

  async function confirmResetDemo() {
    if (!ui.modal || ui.modal.type !== 'reset-demo' || ui.busy) return;
    ui.busy = true;
    renderModal();
    await sleep(360);
    data = createSeedData();
    persistData();
    ui.demo = {
      failNextSave: false,
      failOptions: false,
      slowLoad: false,
      injectDeleteReference: false,
      invalidRelationNextSave: false
    };
    ui.categoryFilters = { productCategoryId: 'all', query: '' };
    ui.productFilters = { productCategoryId: 'all', query: '' };
    ui.returnContext = null;
    ui.pendingConsumableDraft = null;
    ui.highlightConsumableId = null;
    clearDraftSession();
    closeModal({ restoreFocus: false, force: true });
    ui.busy = false;
    refreshPageUI();
    showToast('演示数据已恢复为预置状态。', 'success');
  }

  function handleActionElement(element) {
    const action = element.dataset.action;
    if (!action) return;
    if (action === 'scope-notice') {
      const label = element.dataset.label || '该页面';
      showToast(`${label}不在本次耗材分类原型范围内。`, 'info');
      return;
    }
    if (action === 'scope-step' || action === 'scope-config') {
      const label = element.dataset.label || '该配置';
      showToast(`本原型聚焦「高级配置 / 耗材管理」；${label}未展开。`, 'info');
      return;
    }
    if (action === 'toggle-demo-panel') {
      ui.demoOpen = !ui.demoOpen;
      renderDemoPanelHost();
      if (ui.note) locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
      return;
    }
    if (action === 'set-init-state') {
      setInitState(element.dataset.value === 'post');
      return;
    }
    if (action === 'toggle-demo-flag') {
      toggleDemoFlag(element.dataset.flag);
      return;
    }
    if (action === 'open-category-create') {
      openCategoryDialog('create', null, { trigger: element });
      return;
    }
    if (action === 'edit-category') {
      openCategoryDialog('edit', element.dataset.id, { trigger: element });
      return;
    }
    if (action === 'delete-category') {
      openDeleteCategoryDialog(element.dataset.id, element);
      return;
    }
    if (action === 'open-consumable-create') {
      openConsumableDialog('create', null, { trigger: element, productId: ui.productId });
      return;
    }
    if (action === 'edit-consumable') {
      openConsumableDialog('edit', element.dataset.id, { trigger: element, productId: ui.productId });
      return;
    }
    if (action === 'retry-consumable-options' || action === 'refresh-consumable-categories') {
      if (action === 'refresh-consumable-categories') {
        ui.formDraft.categoryId = '';
        delete ui.fieldErrors.categoryId;
      }
      ui.demo.failOptions = false;
      ui.optionState = 'loading';
      renderModal();
      renderAnnotations();
      loadConsumableOptions();
      return;
    }
    if (action === 'go-maintain-category') {
      const draft = readVisibleConsumableDraft();
      startMaintenanceFlow(draft, element);
      return;
    }
    if (action === 'go-maintain-empty') {
      goMaintainFromPage(element);
      return;
    }
    if (action === 'return-to-consumable') {
      returnToConsumableForm();
      return;
    }
    if (action === 'open-parent-guard') {
      openParentGuardDialog(element);
      return;
    }
    if (action === 'open-reset-demo') {
      openResetDemoDialog(element);
      return;
    }
    if (action === 'confirm-reset-demo') {
      confirmResetDemo();
      return;
    }
    if (action === 'confirm-delete-category') {
      confirmDeleteCategory();
      return;
    }
    if (action === 'check-parent-delete') {
      checkParentGuard('delete');
      return;
    }
    if (action === 'check-parent-move') {
      checkParentGuard('move');
      return;
    }
    if (action === 'close-modal') {
      closeModal();
      return;
    }
    if (action === 'reset-category-filter') {
      ui.categoryFilters = { productCategoryId: 'all', query: '' };
      renderAdmin();
      renderAnnotations();
      if (ui.note) locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
      return;
    }
    if (action === 'reset-product-filter') {
      ui.productFilters = { productCategoryId: 'all', query: '' };
      renderAdmin();
      renderAnnotations();
      if (ui.note) locateNote(ui.note, { updateHash: false, scroll: false, origin: 'render' });
    }
  }

  function handleClick(event) {
    const mobileButton = event.target.closest('[data-mobile-target]');
    if (mobileButton) {
      setMobileView(mobileButton.dataset.mobileTarget);
      return;
    }

    const noteButton = event.target.closest('[data-note-anchor]');
    if (noteButton) {
      event.preventDefault();
      event.stopPropagation();
      locateNote(noteButton.dataset.noteAnchor, { updateHash: true, scroll: true, origin: 'anchor' });
      return;
    }

    const noteCard = event.target.closest('[data-note-card]');
    if (noteCard) {
      event.preventDefault();
      locateNote(noteCard.dataset.noteCard, { updateHash: true, scroll: true, origin: 'card' });
      return;
    }

    const actionElement = event.target.closest('[data-action]');
    if (actionElement) {
      event.preventDefault();
      handleActionElement(actionElement);
      return;
    }

    if (event.target.classList?.contains('modal-backdrop') && !ui.busy) {
      closeModal();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && ui.modal) {
      if (!ui.busy) {
        event.preventDefault();
        closeModal();
      }
      return;
    }

    const focusedCard = event.target.closest?.('[data-note-card]');
    if (focusedCard && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      locateNote(focusedCard.dataset.noteCard, { updateHash: true, scroll: true, origin: 'card' });
      return;
    }

    if (!ui.modal || event.key !== 'Tab') return;
    const modalRoot = document.getElementById('modalRoot');
    if (!modalRoot?.contains(document.activeElement)) return;
    const dialog = modalRoot.querySelector('.modal-dialog');
    if (!dialog) return;
    const focusables = Array.from(dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.getClientRects().length > 0);
    if (!focusables.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleInput(event) {
    const target = event.target;
    if (target.id === 'categoryNameFilter') ui.categoryFilters.query = target.value;
    if (target.id === 'productQueryFilter') ui.productFilters.query = target.value;
    if (!ui.modal) return;

    if (target.id === 'categoryNameInput' && ui.formDraft) ui.formDraft.name = target.value;
    const consumableKeys = {
      consumableNameInput: 'name',
      consumableIntroInput: 'intro',
      consumableSortInput: 'sort',
      consumableTriggerInput: 'trigger',
      consumableCycleInput: 'replacementCycle',
      consumablePurchaseUrlInput: 'purchaseUrl'
    };
    const key = consumableKeys[target.id];
    if (key && ui.formDraft) ui.formDraft[key] = target.value;

    if (target.id === 'consumableNameInput') {
      const counter = document.getElementById('consumableNameCounter');
      if (counter) {
        const count = Array.from(target.value).length;
        counter.textContent = `${count} / 30`;
        counter.classList.toggle('is-near-limit', count >= 28);
      }
    }
    if (target.id === 'consumableIntroInput') {
      const counter = document.getElementById('consumableIntroCounter');
      if (counter) {
        const count = Array.from(target.value).length;
        counter.textContent = `${count} / 300`;
        counter.classList.toggle('is-near-limit', count >= 285);
      }
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (target.id === 'categoryProductCategoryFilter') {
      ui.categoryFilters.productCategoryId = target.value;
      return;
    }
    if (target.id === 'productProductCategoryFilter') {
      ui.productFilters.productCategoryId = target.value;
      return;
    }
    if (!ui.modal || !ui.formDraft) return;

    if (target.id === 'categoryParentSelect') {
      ui.formDraft.productCategoryId = target.value;
      return;
    }
    const consumableSelectKeys = {
      consumableTypeSelect: 'type',
      consumableCountrySelect: 'country',
      consumablePurchaseTypeSelect: 'purchaseType'
    };
    const key = consumableSelectKeys[target.id];
    if (key) {
      ui.formDraft[key] = target.value;
      return;
    }
    if (target.name === 'categoryId' && target.type === 'radio') {
      ui.formDraft.categoryId = target.value;
      if (ui.fieldErrors.categoryId) {
        delete ui.fieldErrors.categoryId;
        setFocusAfterRender(`input[name="categoryId"][value="${target.value.replace(/"/g, '\\"')}"]`);
        renderModal();
        renderAnnotations();
      }
    }
  }

  function handleSubmit(event) {
    if (event.target.id === 'categoryFilterForm') {
      event.preventDefault();
      filterCategoryList();
      return;
    }
    if (event.target.id === 'productFilterForm') {
      event.preventDefault();
      filterProductList();
      return;
    }
    if (event.target.id === 'categoryForm') {
      handleCategorySubmit(event);
      return;
    }
    if (event.target.id === 'consumableForm') {
      handleConsumableSubmit(event);
    }
  }

  function init() {
    if (!window.location.hash) {
      window.history.replaceState(null, '', buildHash('categories', ui.productId, null, null));
    }
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleChange);
    document.addEventListener('submit', handleSubmit);
    window.addEventListener('hashchange', handleRoute);
    setMobileView('product');
    handleRoute();
    if (!storageAvailable) {
      showToast('本地存储不可用：修改仅在当前会话内有效。', 'info', 5200);
    }
  }

  init();
})();
