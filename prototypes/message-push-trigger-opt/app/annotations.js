import {$,$$} from "./dom.js";

const notes={
  rules:[
    ["页面主操作","页面标题 > 新建推送规则","说明：创建入口固定在页面右上角；内容属于规则，不再创建或引用独立模板。\n交互：点击打开四步规则抽屉；只读权限下禁用。","page-heading"],
    ["规则 / 授权事件页签","页面内容 > 页签","说明：授权事件是同一需求范围内的产品页，注册、发布 Schema 并授权到产品后才可被规则选用。","business-tabs"],
    ["规则筛选区","推送规则 > 筛选","说明：支持规则名、分类、优先级、状态查询；查询后回到第一页。","filter-bar"],
    ["规则内消息","推送规则 > 表格","说明：推送标题与内容归属规则。删除独立模板、引用数和模板库等额外编辑面。","rules-table"],
    ["多语言快捷入口","推送规则 > 多语言列","交互：操作列的“多语言”打开该规则的 title/body KV 矩阵。完成度按规则显示。","language-column"],
    ["策略诚实表达","推送规则 > 频控","说明：小时/日策略均称为节流。窗口内后续事件丢弃，不发生内容聚合。","throttle-column"]
  ],
  events:[
    ["授权事件来源","授权事件 > 说明","说明：事件在本页注册 event_type 与版本化 Schema，发布后按 caller_id × event_type × productId 授权；不是规则配置中的隐式外部依赖。","event-source"],
    ["事件查询与注册","授权事件 > 筛选","交互：按名称、来源、授权状态查询。注册事件需录入 Schema 并保存授权。","event-filter"],
    ["Schema 受众契约","授权事件 > 列表","数据：userIds?: string[]。有值时支持单点（长度 1）和批量；无值时按产品绑定用户解析。设备类事件还必须有 deviceId。","events-table"]
  ],
  rule1:[
    ["四步配置结构","规则抽屉 > 左侧步骤","说明：步骤依次为基础与消息、触发与受众、时间与频控、生命周期。将内容归入规则，去除模板独立编辑流。","step-nav"],
    ["分类与优先级","步骤1 > 分类/优先级","说明：messageCategory 与 priority 独立。P0 要求英文和已选市场主语言完整；P1/P2 显示 fallback 警告。","priority-field"],
    ["规则内推送消息","步骤1 > 推送消息","说明：当前语言的标题、内容和跳转页面在规则内直接编辑；占位符仅允许结构化变量。","message-editor"],
    ["多语言 KV 入口","步骤1 > 多语言","交互：打开 title/body KV 矩阵；此入口与列表“多语言”是同一能力，不产生独立模板实体。","language-entry"],
    ["草稿与启用","抽屉底部 > 操作","状态：草稿允许一般字段暂缺；保存并启用需通过完整校验。保存中禁用重复提交。","drawer-footer"]
  ],
  rule2:[
    ["四类触发均在范围内","步骤2 > 触发类型","说明：设备、云端、耗材与事件均可配置具体条件。切换类型后仅保留当前类型条件。","trigger-type"],
    ["授权事件目录","步骤2 > 授权事件","说明：事件仅来自本产品的已发布、已授权目录。入口可跳转到「授权事件」页管理 Schema 与授权。","event-field"],
    ["候选用户来源","步骤2 > 触发载荷","规则：设备/云端/耗材的 userIds 有值时取其集合，否则按 deviceId 取绑定用户；事件 userIds 为空时取当前产品全部绑定用户。","candidate-users"],
    ["独立用户条件","步骤2 > 用户条件","说明：条件独立于 userIds；仅可用 region、bindingType、activeStatus 等白名单字段，不能把 userId 当筛选条件。","audience-filter"],
    ["受众交集","步骤2 > 目标用户计算","公式：最终目标 = 触发载荷候选 ∩ 设备/产品绑定范围 ∩ 用户条件 ∩ 生效市场。空集不报错，suppressed=0。","audience-intersection"],
    ["地域子集","步骤2 > 生效市场","默认：全部市场。选中市场同时参与最终交集、市场时区和 P0 关键语言校验。","regions-field"]
  ],
  rule3:[
    ["基础时间窗口","步骤3 > 生效时间","说明：支持起止时间与每日/每周循环。多时区国家首期通过拆规则处理。","time-field"],
    ["市场时区","步骤3 > 时区","默认市场时区；若选多个市场，运行时分别按各市场时区计算。","timezone-field"],
    ["四种节流预设","步骤3 > 发送频控","说明：实时=0、小时=3600s、日=86400s、自定义。间隔内后续事件丢弃，不合并为摘要。","throttle-field"],
    ["自然语言摘要","步骤3 > 规则摘要","说明：摘要明确候选用户来源与条件交集，不允许 undefined 或空分号。","rule-summary"]
  ],
  rule4:[
    ["连续提醒结束条件","步骤4 > 生命周期","说明：用户确认 ≠ 事件结束。结束事件按 eventId + userId/deviceId 关联活跃实例。","lifecycle-field"],
    ["受限模式与硬顶","步骤4 > 无结束事件","交互：清空结束事件即进入受限模式。默认 72h/100 可配；系统硬顶 168h/500 不可改。","hard-cap"],
    ["投递级硬顶","步骤4 > 安全上限","说明：无论优先级，均不得超过 1 push / 5 min / user / rule。","delivery-cap"],
    ["保存前校验","步骤4 > 校验结果","自动检查必填、事件授权、用户目标交集、P0 语言、硬上限与冲突。","validation"]
  ],
  language:[
    ["规则内多语言边界","多语言抽屉 > 说明","说明：语言内容从属于当前规则，不存在模板 ID、引用关系或独立模板管理。","language-scope"],
    ["多语言 KV 矩阵","多语言抽屉 > 语言内容","结构：行=语言，列=title/body；完整实现应覆盖现网 16 种语言。","lang-matrix"],
    ["跳转页面","多语言抽屉 > 跳转页面","说明：cozyLink 是规则顶层单值，不进入语言矩阵；{id} 在发送时替换。","message-link"],
    ["P0 语言校验","多语言抽屉 > 发布校验","规则：P0 必须具备英文和已选市场主语言。缺失则阻断保存/启用；非 P0 可降为 fallback 警告。","language-validation"]
  ]
};
function placeAnchors(activeNotes){$$('.note-anchor').forEach(el=>el.remove());activeNotes.forEach((note,index)=>{const target=document.querySelector(`[data-anchor="${note[3]}"]`);if(!target)return;const anchor=document.createElement("button");anchor.className="note-anchor";anchor.textContent=String(index+1);anchor.title=note[0];anchor.addEventListener("click",()=>focusNote(index));target.appendChild(anchor)})}
function focusNote(index){$$(".annotation-card").forEach((el,i)=>el.classList.toggle("active",i===index));$$(".anchor-highlight").forEach(el=>el.classList.remove("anchor-highlight"));const active=notes[currentContext]||notes.rules;const target=document.querySelector(`[data-anchor="${active[index]?.[3]}"]`);if(target){target.classList.add("anchor-highlight");target.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>target.classList.remove("anchor-highlight"),1400)}}
let currentContext="rules";
export function renderAnnotations(context,label){currentContext=context;const active=notes[context]||notes.rules;$("#annotationContext").textContent=label;$("#annotationList").innerHTML=active.map((n,i)=>`<article class="annotation-card" data-note="${i}"><span class="annotation-number">${i+1}</span><h3>${n[0]}</h3><div class="annotation-location">关联位置：${n[1]}</div><div class="annotation-body">${n[2]}</div></article>`).join("");$$(".annotation-card").forEach((card,i)=>card.addEventListener("click",()=>focusNote(i)));requestAnimationFrame(()=>placeAnchors(active))}
