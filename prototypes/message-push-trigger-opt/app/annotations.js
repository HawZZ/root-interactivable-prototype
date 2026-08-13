import {$,$$} from "./dom.js";

const notes={
  rules:[
    ["产品选择","页面标题 > 当前产品","点击后可搜索产品名称、型号或标识符。切换后，只显示这个产品的规则、触发源、跳转页面和多语言内容。","product-switcher"],
    ["统一多语言","页面标题 > 统一多语言","所有规则共用一张多语言大表。抽屉中的选择和内容是草稿，只有保存后才会影响规则；取消不生效。","product-language-entry"],
    ["主题查询","推送规则 > 筛选区","可以查看独立发送的规则，或按具体通知主题查看。主题不限制触发源，只决定哪些实际提醒汇总展示。","filter-bar"],
    ["规则列表","推送规则 > 表格","列表展示独立发送或主题名称、触发条件、语言数量和投递方式。多语言内容仅从页面顶部「统一多语言」进入管理。","rules-table"],
    ["后续版本","推送规则 > 后续能力","事件管理、Webhook、状态切换、优先级和自定义深链不在当前页面提供入口。","future-scope"]
  ],
  rule1:[
    ["编辑顺序","规则抽屉 > 顶部步骤条","先写要发送的内容，再设置何时触发，最后选择投递目标和发送方式。","step-nav"],
    ["通知主题","步骤 1 > 通知主题","不加入主题时独立发送。加入主题后，共享主题文案；同一设备当天实际发生的同主题提醒会补充到一条消息中心记录中。","topic-selector"],
    ["删除主题","步骤 1 > 管理通知主题","仅没有关联规则的主题可以删除。已有规则引用时，删除按钮不可用，并说明需要先把规则移出或改到其他主题；删除不会影响已有消息中心记录。","topic-manager"],
    ["占位内容","步骤 1 > 推送消息","先点击 Title 或 Body，再点选内容插入。用户看到时会替换为设备、耗材或用户的实际信息。","placeholder-panel"],
    ["点击后打开","步骤 1 > 点击后打开","默认是消息中心；若选择系统通知，用户点手机通知后也会打开这里的页面。","jump-mode"]
  ],
  rule2:[
    ["三类触发源","步骤 2 > 触发源","设备属性、云计时器和耗材都来自当前产品已有配置。","trigger-source"],
    ["设备属性选择","步骤 2 > 设备属性","不使用长下拉。可按名称或标识符搜索，也可按分组查看；选中后条件和值会自动调整。","property-selector"],
    ["云端剩余时长","步骤 2 > 云端触发","计时器按天、小时或分钟配置，这里的剩余时长跟随同一个单位。","trigger-source"],
    ["提醒时间","步骤 2 > 提醒时间","只有在设置的时间段内发生，才会发送提醒。可以跨到次日，例如 23:00 至 01:00。","trigger-time"],
    ["接收者","步骤 2 > 接收者","提醒只会发给触发设备已经绑定的用户；设备没有绑定用户时，不发送。","recipient-resolution"]
  ],
  rule3:[
    ["投递目标","步骤 3 > 投递目标","每条消息都会写入 App 消息中心，不能关闭；可按需同时发送到手机系统通知栏。","delivery-target"],
    ["发送方式","步骤 3 > 发送方式","逐条发送表示每次都提醒；仅发送首条表示一段时间内只提醒第一次。","delivery-mode"],
    ["最小发送间隔","步骤 3 > 最小发送间隔","单位是分钟。仅发送首条时才需要设置，用来确定多久内不重复提醒。","min-interval"],
    ["主题汇总","步骤 3 > 主题汇总","同设备、同主题、同自然日共用一条消息中心记录。后续实际发生的提醒只更新详情；系统通知每天最多一次。","topic-summary"],
    ["保存检查","步骤 3 > 保存检查","保存前检查内容、触发条件、提醒时间和发送方式是否完整。","validation"]
  ],
  language:[
    ["选择语言","统一多语言 > 选择语言","English 始终选中。勾选其他语言后，这些语言只会先出现在当前草稿大表；保存后才成为产品可用语言。","language-selection"],
    ["多语言大表","统一多语言 > 大表","每行是一个输入项，每列是一种语言；同一产品的全部规则在这里统一维护。取消时，大表中的改动不会生效。","product-language-matrix"],
    ["导出大表","统一多语言 > 导出","可导出当前已选语言的表格，列顺序与页面一致。","product-language-intro"],
    ["待补全提醒","统一多语言 > 待补全提醒","只提示当前草稿中已选语言未填写的内容，不阻塞保存。保存后语言选择和现有内容立即应用到所有规则，未填写内容可后续补全。","product-language-validation"]
  ]
};

function placeAnchors(activeNotes){$$('.note-anchor').forEach(el=>el.remove());activeNotes.forEach((note,index)=>{const target=document.querySelector(`[data-anchor="${note[3]}"]`);if(!target)return;const anchor=document.createElement("button");anchor.className="note-anchor";anchor.textContent=String(index+1);anchor.title=note[0];anchor.addEventListener("click",()=>focusNote(index));target.appendChild(anchor)})}
function focusNote(index){$$('.annotation-card').forEach((el,i)=>el.classList.toggle("active",i===index));$$('.anchor-highlight').forEach(el=>el.classList.remove("anchor-highlight"));const active=notes[currentContext]||notes.rules,target=document.querySelector(`[data-anchor="${active[index]?.[3]}"]`);if(target){target.classList.add("anchor-highlight");target.scrollIntoView({behavior:"smooth",block:"center"});setTimeout(()=>target.classList.remove("anchor-highlight"),1400)}}
let currentContext="rules";
export function renderAnnotations(context,label){currentContext=context;const active=notes[context]||notes.rules;$("#annotationContext").textContent=label;$("#annotationList").innerHTML=active.map((note,index)=>`<article class="annotation-card" data-note="${index}"><span class="annotation-number">${index+1}</span><h3>${note[0]}</h3><div class="annotation-location">关联位置：${note[1]}</div><div class="annotation-body">${note[2]}</div></article>`).join("");$$('.annotation-card').forEach((card,index)=>card.addEventListener("click",()=>focusNote(index)));requestAnimationFrame(()=>placeAnchors(active))}
