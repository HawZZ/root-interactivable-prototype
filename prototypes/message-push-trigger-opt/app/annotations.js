import {$,$$} from "./dom.js";

const notes={
  rules:[
    ["页面主操作","页面标题 > 新建推送规则","说明：创建入口固定在页面右上角。\n交互：点击打开四步规则抽屉；只读权限下禁用并提示权限原因。","page-heading"],
    ["规则/模板业务页签","页面内容 > 页签","说明：这是产品真实导航，不是原型页表。切换后筛选、表格和批注上下文同步变化。","business-tabs"],
    ["规则筛选区","推送规则 > 筛选","说明：支持规则名、分类、优先级、状态查询；查询后回到第一页。\n数据来源：GET rules 增量扩展 messageCategory/priority 查询。","filter-bar"],
    ["规则治理索引","推送规则 > 表格","说明：列表直接展示 category、priority、eventId/触发对象，为未来跨规则治理预留索引维度。","rules-table"],
    ["策略诚实表达","推送规则 > 频控","说明：小时/日策略均称为节流，不使用“批量/摘要”。窗口内后续事件丢弃，不发生内容聚合。","throttle-column"],
    ["异常与权限场景","页面右上 > 原型场景","交互：切换正常、加载、失败、空态和只读权限。真实页面不一定保留该选择器。\n原型备注：该控件仅用于评审覆盖状态。","page-heading"]
  ],
  templates:[
    ["模板独立管理","消息模板 > 页面","说明：规则只引用 templateId；title/body/cozyLink 从规则侧迁到模板侧。","templates-table"],
    ["语言完成度","消息模板 > 完成度列","说明：绿色=完整，黄色=存在英文 fallback，红色=英文也缺失。P0 是否可保存还取决于选中市场主语言。","completion-column"],
    ["引用关系","消息模板 > 引用规则","交互：显示引用数量；已启用且被规则引用的模板不可直接删除。","refs-column"],
    ["模板筛选与创建","消息模板 > 筛选","交互：可按模板名、分类、完成度筛选；新建打开模板抽屉。","filter-bar"]
  ],
  rule1:[
    ["四步配置结构","规则抽屉 > 左侧步骤","说明：按基础信息、触发与范围、时间与频控、生命周期分步，避免把平台能力平铺成超长表单。","step-nav"],
    ["规则与模板分离","步骤1 > 消息模板","说明：规则只保存 templateId。模板展示内容独立维护；选项展示完成度和状态。","template-field"],
    ["分类与优先级","步骤1 > 分类/优先级","说明：messageCategory 与 priority 独立。默认 P2；P0 会触发关键语言阻断并在规则列表中明确标识。","priority-field"],
    ["草稿与启用","抽屉底部 > 操作","状态：草稿允许一般字段暂缺；保存并启用需通过完整校验。保存中禁用重复提交。","drawer-footer"]
  ],
  rule2:[
    ["第四类事件触发","步骤2 > 触发类型","说明：四类入口共存。事件触发消费 Phase 2 授权白名单，scope=caller_id × event_type × productId。","trigger-type"],
    ["事件注册两层","步骤2 > 事件选择","正常态：名称 + ID + schema 预览来自注册读 API。\n异常：读 API 不可用时仅允许已授权 ID，明确为临时降级，不伪造元数据。","event-field"],
    ["目标模式互斥","步骤2 > 目标用户","说明：单点、批量、条件筛选互斥。本原型展示条件筛选，并映射 Phase 2 白名单 region。","target-mode"],
    ["地域子集","步骤2 > 生效市场","默认：全部市场。多选后同时影响用户筛选、市场时区和 P0 关键语言校验。","regions-field"]
  ],
  rule3:[
    ["基础时间窗口","步骤3 > 生效时间","说明：支持起止时间与每日/每周循环。多时区国家首期通过拆规则处理。","time-field"],
    ["市场时区","步骤3 > 时区","默认市场时区；若选多个市场，运行时分别按各市场时区计算。","timezone-field"],
    ["四种节流预设","步骤3 > 发送频控","实时=0、小时=3600s、日=86400s、自定义。\n重要：间隔内后续事件丢弃，不合并为摘要。","throttle-field"],
    ["自然语言摘要","步骤3 > 规则摘要","说明：实时根据四段配置生成，不允许 undefined 或空分号。摘要用于列表、详情和保存前复核。","rule-summary"]
  ],
  rule4:[
    ["连续提醒结束条件","步骤4 > 生命周期","说明：用户确认 ≠ 事件结束。结束事件按 eventId + userId/deviceId 关联活跃实例。","lifecycle-field"],
    ["受限模式与硬顶","步骤4 > 无结束事件","交互：清空结束事件即进入受限模式。默认 72h/100 可配；系统硬顶 168h/500 不可改。","hard-cap"],
    ["投递级硬顶","步骤4 > 安全上限","说明：无论优先级，均不得超过 1 push/5min/user/rule。","delivery-cap"],
    ["保存前校验","步骤4 > 校验结果","自动检查必填、P0 语言、硬上限、冲突和占位符。冲突默认警告；P0 语言与硬上限阻断。","validation"]
  ],
  template:[
    ["模板字段边界","模板抽屉 > 基础信息","title/body 进入 16 语言 KV；cozyLink 保持顶层单值，不做多语言。`{id}` 在渲染时替换。","template-base"],
    ["多语言 KV 矩阵","模板抽屉 > 语言内容","行=语言，列=title/body。原型显示关键 4 种语言，完整实现覆盖现网 16 语言。","lang-matrix"],
    ["P0 关键语言阻断","模板抽屉 > 完成度","当前规则选美国+德国且为 P0，因此英文与德语均必填。德语缺失时保存阻断；非 P0 改为黄色 fallback 警告。","template-validation"],
    ["结构化占位符","模板抽屉 > 占位符","只能从 placeholderList 插入。点击变量插入当前编辑语言的正文，未定义变量阻断保存。","placeholders"],
    ["实时只读预览","模板抽屉 > App 预览","预览用示例值替换变量；语言切换由编辑区控制，预览本身不反向修改配置。","template-preview"]
  ]
};

function placeAnchors(activeNotes){
  $$(".note-anchor").forEach(el=>el.remove());
  activeNotes.forEach((note,index)=>{
    const target=document.querySelector(`[data-anchor="${note[3]}"]`); if(!target)return;
    const anchor=document.createElement("button"); anchor.className="note-anchor"; anchor.textContent=String(index+1); anchor.title=note[0];
    anchor.addEventListener("click",()=>focusNote(index)); target.appendChild(anchor);
  });
}
function focusNote(index){
  $$(".annotation-card").forEach((el,i)=>el.classList.toggle("active",i===index));
  $$(".anchor-highlight").forEach(el=>el.classList.remove("anchor-highlight"));
  const active=notes[currentContext]||notes.rules; const target=document.querySelector(`[data-anchor="${active[index]?.[3]}"]`);
  if(target){target.classList.add("anchor-highlight");target.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>target.classList.remove("anchor-highlight"),1400)}
}
let currentContext="rules";
export function renderAnnotations(context,label){
  currentContext=context; const active=notes[context]||notes.rules;
  $("#annotationContext").textContent=label;
  $("#annotationList").innerHTML=active.map((n,i)=>`<article class="annotation-card" data-note="${i}"><span class="annotation-number">${i+1}</span><h3>${n[0]}</h3><div class="annotation-location">关联位置：${n[1]}</div><div class="annotation-body">${n[2]}</div></article>`).join("");
  $$(".annotation-card").forEach((card,i)=>card.addEventListener("click",()=>focusNote(i)));
  requestAnimationFrame(()=>placeAnchors(active));
}
