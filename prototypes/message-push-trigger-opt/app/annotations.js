import {$,$$} from "./dom.js";

const notes={
  rules:[
    ["产品上下文","页面标题 > 当前产品","切换产品会同时刷新规则、事件、占位符和跳转页面；所有读写均按 productId 隔离。","page-heading"],
    ["规则入口","页面标题 > 新建推送规则","消息内容从属于规则，不创建独立模板；三步抽屉覆盖内容、触发和投递生命周期。","page-heading"],
    ["规则列表","推送规则 > 表格","列表只展示当前产品。频控列明确逐条、后续丢弃、合并发送（取最后一次）或状态切换。","rules-table"],
    ["多语言快捷入口","推送规则 > 多语言列","打开同一规则的 18 语言 KV 矩阵；English 锁定，中文可取消，未选语言保留草稿但隐藏。","language-column"],
    ["状态与熔断","推送规则 > 频控 / 生命周期","P0 熔断是平台运维状态，不新增 B 端接收人；异常状态写审计并由平台监控处理。","throttle-column"]
  ],
  events:[
    ["产品隔离","事件管理 > 产品切换","事件目录和规则选择器绑定当前产品；不提供全局调用方授权矩阵。","page-heading"],
    ["固定信封","事件管理 > 固定信封只读区","固定字段包含 deviceId、条件 occurrenceId、idempotencyKey 和 payload；字段不可修改，不提供外部目标用户字段。","fixed-envelope-summary"],
    ["Webhook 安全","事件管理 > Webhook 安全列","第三方使用 webhook URL 与安全配置发送事件；安全服务在规则引擎前认证、校验版本和撤销状态，旧 Event Token 不再作为入口。","events-table"],
    ["复制与冲突报告","事件管理 > 复制到产品","复制 Payload Schema 与直接关联规则；目标事件草稿、规则默认停用，原始 webhook 凭证不复制，需目标产品重新配置。","event-filter"]
  ],
  rule1:[
    ["三步编辑结构","规则抽屉 > 顶部步骤条","顶部 Step Bar 显示当前步骤、已完成步骤和下一步范围；没有起止时间、循环、时区或独立用户条件。","step-nav"],
    ["规则内消息","步骤 1 > 推送消息","默认编辑语言为 English。标题和正文支持占位符按钮，内容归属规则，不产生独立模板实体。","message-editor"],
    ["占位符选择器","步骤 1 > 消息编辑","预设 10 个变量；当前触发无法提供的变量禁用，未知变量在发布时阻断。","placeholder-panel"],
    ["跳转模式","步骤 1 > 跳转页面","只允许不跳转、当前产品预设页面、自定义 cozy:// 深链。自定义链接校验协议、格式、长度和空格。","jump-mode"],
    ["语言入口","步骤 1 > 多语言","18 语言目录的 KV 矩阵从语言选择入口打开；只校验已勾选语言，English 始终 fallback。","language-entry"]
  ],
  rule2:[
    ["四类触发","步骤 2 > 触发类型","设备、云端、耗材、事件均属于范围。云端使用 timerCycleCompleted 周期完成事件。","trigger-source"],
    ["设备条件","步骤 2 > 设备触发","先选属性，再选兼容运算符和值，形成 if（A op b）的触发源。","trigger-source"],
    ["云计时器周期","步骤 2 > 云端触发","阈值文案固定为 0/只读；每个周期到 0 触发一次，自动 reset 后下一周期再触发。必须验收 timerInstanceId 与 cycleId/resetGeneration。","cloud-cycle"],
    ["目标用户解析","步骤 2 > 固定解析规则","所有触发均必须落到真实 deviceId；最终目标用户固定为 BindUsers(deviceId)，页面不维护外部接收人名单。","recipient-resolution"],
    ["事件来源","步骤 2 > 事件触发","事件选择器只列当前产品已发布事件；事件详情提供 webhook URL 与安全配置状态。","trigger-source"]
  ],
  rule3:[
    ["优先级约束","步骤 3 > 优先级","P0/P1/P2 只影响投递调度，不限制提醒模式。","priority-field"],
    ["模式互斥","步骤 3 > 提醒模式与频控","each 无最小间隔；discard/merge/stateSwitch 必填 5 分钟至 7 天窗口。","delivery-mode"],
    ["状态切换","步骤 3 > 状态切换提醒","仅事件触发；初始化可选开/关，每个有效事件按 deviceId 原子翻转，窗口末只发送最终状态内容。","delivery-mode"],
    ["安全硬顶","步骤 3 > 发布校验","滚动保护默认 72 小时/100 次，硬顶 168 小时/500 次，按稳定 ruleId + deviceId 跨版本累计。","validation"],
    ["频控时间线","步骤 3 > 投递时间线","演示首条入队、窗口内 suppressed/最后事件/最终状态，以及同 occurrence 不重复执行。","frequency-timeline"],
    ["发布校验","步骤 3 > 发布校验","校验已选语言、变量、cozy://、来源能力、webhook 安全状态、周期标识和窗口参数。","validation"]
  ],
  language:[
    ["语言选择","多语言抽屉 > 发布语言","English 始终勾选且不可取消；中文默认勾选但可取消；其余语言可复选，取消后保留草稿。","language-selector"],
    ["KV 矩阵","多语言抽屉 > title / body","矩阵只渲染当前勾选语言；取消后该语言从表格隐藏但保留 title/body 草稿，重新勾选恢复原值。发布只校验已选行。","lang-matrix"],
    ["跳转一致性","多语言抽屉 > 跳转页面","跳转页面是规则顶层单值，在步骤 1 配置；语言抽屉只展示当前模式和链接。","message-link"],
    ["发布校验","多语言抽屉 > 发布校验","只校验当前勾选语言的 title/body、变量及当前触发可解析性；未勾选语言草稿不参与校验。","language-validation"]
  ],
  webhook:[
    ["Webhook 地址","事件详情 > Webhook 安全入口","展示脱敏 URL、endpointId 和配置状态；不展示 secret query 或原始凭证。","webhook-security"],
    ["安全服务状态","事件详情 > 安全配置状态","配置、轮换、撤销均由通用 webhook 安全服务承载；认证失败 fail-closed、审计、不入队。","webhook-security"]
  ],
  "cloud-cycle":[
    ["周期事件","步骤 2 > 云端周期","timerCycleCompleted 是唯一运行事件；每个 timerInstanceId + cycleId 到 0 仅执行一次。","cloud-cycle"],
    ["自动重置","步骤 2 > 周期状态","到 0 后计时器自动 reset，生成下一周期；重复上报同一 occurrence 不入队、不计数。","cloud-cycle"]
  ]
};

function placeAnchors(activeNotes){$$('.note-anchor').forEach(el=>el.remove());activeNotes.forEach((note,index)=>{const target=document.querySelector(`[data-anchor="${note[3]}"]`);if(!target)return;const anchor=document.createElement("button");anchor.className="note-anchor";anchor.textContent=String(index+1);anchor.title=note[0];anchor.addEventListener("click",()=>focusNote(index));target.appendChild(anchor)})}
function focusNote(index){$$('.annotation-card').forEach((el,i)=>el.classList.toggle('active',i===index));$$('.anchor-highlight').forEach(el=>el.classList.remove('anchor-highlight'));const active=notes[currentContext]||notes.rules;const target=document.querySelector(`[data-anchor="${active[index]?.[3]}"]`);if(target){target.classList.add('anchor-highlight');target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target.classList.remove('anchor-highlight'),1400)}}
let currentContext="rules";
export function renderAnnotations(context,label){currentContext=context;const active=notes[context]||notes.rules;$("#annotationContext").textContent=label;$("#annotationList").innerHTML=active.map((n,i)=>`<article class="annotation-card" data-note="${i}"><span class="annotation-number">${i+1}</span><h3>${n[0]}</h3><div class="annotation-location">关联位置：${n[1]}</div><div class="annotation-body">${n[2]}</div></article>`).join("");$$('.annotation-card').forEach((card,i)=>card.addEventListener('click',()=>focusNote(i)));requestAnimationFrame(()=>placeAnchors(active))}
