import {$,$$} from "./dom.js";

const notes={
  rules:[
    ["产品上下文","页面标题 > 当前产品","切换产品会同时刷新规则、事件、占位符和跳转页面；事件唯一性按（productId，eventType）计算。","page-heading"],
    ["规则入口","页面标题 > 新建推送规则","消息内容从属于规则，不再创建独立模板；三步抽屉覆盖内容、触发和投递生命周期。","page-heading"],
    ["规则列表","推送规则 > 表格","列表只展示当前产品。多语言列按已选语言计数，频控列明确后续丢弃、合并发送（取最后一次）或连续提醒。","rules-table"],
    ["多语言快捷入口","推送规则 > 多语言列","打开同一规则的 18 语言 KV 矩阵；English 锁定，中文可取消，未选语言仍保留草稿。","language-column"],
    ["状态与熔断","推送规则 > 频控 / 生命周期","P0 熔断是平台运维状态，不新增 B 端升级接收人；超过 100 unique triggers/min/rule 停止发送并告警。","throttle-column"]
  ],
  events:[
    ["产品隔离","事件管理 > 产品切换","事件注册、规则目录和调用方权限都绑定当前产品；不提供全局产品授权矩阵。","page-heading"],
    ["固定信封","事件管理 > 固定信封只读区","eventType、schemaVersion、productId、occurredAt、deviceId、userIds?、idempotencyKey、payload 为平台固定字段。消息推送事件必须携带 deviceId，页面不可修改。","fixed-envelope-summary"],
    ["研发预置调用方","事件管理 > 事件列表","调用方包含 callerId、凭证状态、允许产品、限流；本页只能选择允许当前产品的调用方，没有注册、签发或编辑入口。","events-table"],
    ["复制与冲突报告","事件管理 > 复制到产品","复制 Payload Schema 与直接关联规则；目标事件草稿、规则默认停用。相同 eventType、调用方无权限等冲突跳过并报告。","event-filter"]
  ],
  rule1:[
    ["三步编辑结构","规则抽屉 > 顶部步骤条","顶部 Step Bar 显示当前步骤、已完成步骤和下一步范围；可点击步骤快速回看，底部按钮负责按流程前进。没有起止时间、循环、时区或独立用户条件。","step-nav"],
    ["规则内消息","步骤 1 > 推送消息","默认编辑语言为 English。标题和正文支持占位符按钮，内容归属规则，不产生独立模板实体。","message-editor"],
    ["占位符选择器","步骤 1 > 消息编辑","预设 10 个 ${cozy...} 变量；当前触发无法提供的变量禁用，未知变量在发布时阻断。","placeholder-panel"],
    ["跳转模式","步骤 1 > 跳转页面","只允许不跳转、当前产品预设页面、自定义 cozy:// 深链。自定义链接校验协议、格式、长度和空格。","jump-mode"],
    ["语言入口","步骤 1 > 多语言","18 语言目录的 KV 矩阵从语言选择入口打开；只校验已勾选语言，English 始终 fallback。","language-entry"]
  ],
  rule2:[
    ["四类触发","步骤 2 > 触发类型","设备、云端、耗材、自定义事件均属于范围。结束来源会在步骤 3 按开始触发源筛选。","trigger-type"],
    ["事件 Payload","步骤 2 > 当前产品事件","自定义事件只来自当前产品已发布目录。固定信封只读，Payload Schema 可定制但受深度、大小、类型和 $ref 限制。","event-field"],
    ["目标用户解析","步骤 2 > 固定解析规则","所有触发均必须携带 deviceId：userIds 有值时与该设备绑定用户取交集；为空时使用该设备全部绑定用户。","candidate-users"],
    ["交集问题已收敛","步骤 2 > 目标用户","userId 仅用于收窄 deviceId 的绑定用户范围；规则侧不维护接收人名单，不提供用户属性、地域或 B 端升级接收人入口。","audience-intersection"]
  ],
  rule3:[
    ["优先级约束","步骤 3 > 优先级","P0 单次全量直发、仅 replay 幂等去重；P1/P2 单次必须选择后续丢弃或合并发送（取最后一次）。策略按规则独立设置。","priority-field"],
    ["模式互斥","步骤 3 > 提醒模式与频控","连续提醒隐藏丢弃/合并，显示 5 分钟至 7 天提醒间隔。重复开始信号只刷新同一设备实例与最新 Payload。","delivery-mode"],
    ["结束条件","步骤 3 > 结束条件","结束源跟随开始源；开始和结束事件由系统按相同 deviceId 匹配。无可用结束事件时只能受限模式。","lifecycle-field"],
    ["安全硬顶","步骤 3 > 受限模式硬上限","默认 72 小时 / 100 次，系统硬顶 168 小时 / 500 次；连续提醒必须配置结束条件或硬上限。","hard-cap"],
    ["频控时间线","步骤 3 > 投递时间线","演示首条发送、窗口内 suppressed/保留最后一次、窗口末发送最后事件内容，以及连续实例 active/closed 状态。","frequency-timeline"],
    ["P0 熔断","步骤 3 > 异常风暴保护","超过 100 unique triggers/min/rule 进入熔断；5 分钟静默后半开，首个正常触发通过后恢复。告警写审计并进入现有监控。","fuse-state"],
    ["发布校验","步骤 3 > 发布校验","只校验已选语言、变量合法性、cozy:// 深链、结束匹配和硬上限；未选语言内容保留但不阻断。","validation"]
  ],
  language:[
    ["语言选择","多语言抽屉 > 发布语言","English 始终勾选且不可取消；中文默认勾选但可取消；其余语言可复选，取消后保留草稿。","language-selector"],
    ["KV 矩阵","多语言抽屉 > title / body","平台语言目录提供 18 种语言，矩阵只渲染当前勾选语言；取消后该语言从表格隐藏但保留 title/body 草稿，重新勾选恢复原值。发布只校验已选行。","lang-matrix"],
    ["跳转一致性","多语言抽屉 > 跳转页面","跳转页面是规则顶层单值，在步骤 1 配置；语言抽屉只展示当前模式和链接。","message-link"],
    ["发布校验","多语言抽屉 > 发布校验","只校验当前勾选语言的 title/body、10 个预设变量及当前触发可解析性；未勾选语言的草稿不参与完整性校验。未知变量或非法链接阻断。","language-validation"]
  ]
};
function placeAnchors(activeNotes){$$('.note-anchor').forEach(el=>el.remove());activeNotes.forEach((note,index)=>{const target=document.querySelector(`[data-anchor="${note[3]}"]`);if(!target)return;const anchor=document.createElement("button");anchor.className="note-anchor";anchor.textContent=String(index+1);anchor.title=note[0];anchor.addEventListener("click",()=>focusNote(index));target.appendChild(anchor)})}
function focusNote(index){$$('.annotation-card').forEach((el,i)=>el.classList.toggle('active',i===index));$$('.anchor-highlight').forEach(el=>el.classList.remove('anchor-highlight'));const active=notes[currentContext]||notes.rules;const target=document.querySelector(`[data-anchor="${active[index]?.[3]}"]`);if(target){target.classList.add('anchor-highlight');target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target.classList.remove('anchor-highlight'),1400)}}
let currentContext="rules";
export function renderAnnotations(context,label){currentContext=context;const active=notes[context]||notes.rules;$("#annotationContext").textContent=label;$("#annotationList").innerHTML=active.map((n,i)=>`<article class="annotation-card" data-note="${i}"><span class="annotation-number">${i+1}</span><h3>${n[0]}</h3><div class="annotation-location">关联位置：${n[1]}</div><div class="annotation-body">${n[2]}</div></article>`).join("");$$('.annotation-card').forEach((card,i)=>card.addEventListener('click',()=>focusNote(i)));requestAnimationFrame(()=>placeAnchors(active))}
