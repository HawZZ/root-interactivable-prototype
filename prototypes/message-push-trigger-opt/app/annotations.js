import {$,$$} from "./dom.js";

const notes={
  rules:[
    ["产品上下文","页面标题 > 当前产品","规则始终归属一个产品。切换产品只刷新该产品的规则、触发来源和预设跳转页。","page-heading"],
    ["P0 规则闭环","推送规则 > P0 范围提示","首期只覆盖既有设备、云端计时器、耗材三类来源，以及设备绑定用户、内容和两种投递方式。","p0-scope"],
    ["规则列表","推送规则 > 表格","列表只展示触发条件、消息、多语言 KV 状态和投递方式；不展示优先级、事件或生命周期配置。","rules-table"],
    ["KV 快捷入口","推送规则 > 多语言 KV","点击后打开可批量粘贴的 locale / title / body 表。English 必填，导入行才参与发布校验。","language-column"],
    ["后续版本","推送规则 > 后续能力","事件管理、Webhook 安全、合并发送、状态切换、跨产品复制和自定义深链不在 P0 页面提供入口。","future-scope"]
  ],
  rule1:[
    ["三步编辑结构","规则抽屉 > 顶部步骤条","编辑顺序保持触发、投递、消息。每一步只解决一个问题，避免在同一页面配置来源、内容和复杂策略。","step-nav"],
    ["三类既有来源","步骤 1 > 触发源","设备属性、产品云计时器和已配置耗材均复用现有产品能力；不新增 Webhook 或自定义事件入口。","trigger-source"],
    ["设备属性选择","步骤 1 > 设备触发 > 设备属性","不使用长下拉。点击后打开属性选择器，可按属性名称、标识符或说明搜索；默认露出最近使用项。选中属性后自动刷新兼容运算符和值。","property-selector"],
    ["云端阈值","步骤 1 > 云端触发","运营配置剩余时长阈值；系统用既有周期标识保证同一周期首次命中一次，re-arm 不作为页面字段。","cloud-source"],
    ["固定接收人","步骤 1 > 接收者解析","所有来源都落到真实 deviceId，系统仅向 BindUsers(deviceId) 发送；不提供名单、筛选或升级接收人。","recipient-resolution"]
  ],
  rule2:[
    ["两种投递方式","步骤 2 > 提醒模式","首期仅提供逐条发送和后续丢弃。逐条发送不设窗口；后续丢弃使用最小发送间隔。","delivery-mode"],
    ["丢弃窗口","步骤 2 > 投递时间线","窗口首条立即发送；窗口内的后续事件被抑制并记录审计。合并、状态切换与优先级策略属于后续版本。","frequency-timeline"],
    ["发布校验","步骤 2 > 发布校验","校验来源可用性、云端阈值和丢弃窗口；基础去重与失败审计由系统保证。","validation"]
  ],
  rule3:[
    ["English 默认内容","步骤 3 > 推送消息","规则先维护 English title/body；它是默认 fallback，长度分别不超过 100/200。","message-editor"],
    ["KV 快速导入","步骤 3 > 多语言 KV","从 Excel 或 CSV 复制 locale、title、body 三列并粘贴导入。导入行自动成为发布语言，可在矩阵内修订或删除。","language-entry"],
    ["预设跳转","步骤 3 > 跳转页面","首期只支持不跳转或当前产品的预设 App 页面，不开放自定义深链。","jump-mode"]
  ],
  language:[
    ["粘贴导入","多语言 KV > 批量导入","支持从表格粘贴 locale、title、body 三列；未知 locale、列数不完整或 title/body 超长会在导入时提示。","language-import"],
    ["KV 矩阵","多语言 KV > 已导入语言","矩阵仅展示 English 与已导入语言。删除某行即停止发布该语言；English 不能删除。","lang-matrix"],
    ["发布校验","多语言 KV > 保存","只校验当前矩阵行。文件导入导出、翻译辅助和全语言预置选择留到后续版本。","language-validation"]
  ]
};

function placeAnchors(activeNotes){$$('.note-anchor').forEach(el=>el.remove());activeNotes.forEach((note,index)=>{const target=document.querySelector(`[data-anchor="${note[3]}"]`);if(!target)return;const anchor=document.createElement("button");anchor.className="note-anchor";anchor.textContent=String(index+1);anchor.title=note[0];anchor.addEventListener("click",()=>focusNote(index));target.appendChild(anchor)})}
function focusNote(index){$$('.annotation-card').forEach((el,i)=>el.classList.toggle('active',i===index));$$('.anchor-highlight').forEach(el=>el.classList.remove('anchor-highlight'));const active=notes[currentContext]||notes.rules;const target=document.querySelector(`[data-anchor="${active[index]?.[3]}"]`);if(target){target.classList.add('anchor-highlight');target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target.classList.remove('anchor-highlight'),1400)}}
let currentContext="rules";
export function renderAnnotations(context,label){currentContext=context;const active=notes[context]||notes.rules;$("#annotationContext").textContent=label;$("#annotationList").innerHTML=active.map((n,i)=>`<article class="annotation-card" data-note="${i}"><span class="annotation-number">${i+1}</span><h3>${n[0]}</h3><div class="annotation-location">关联位置：${n[1]}</div><div class="annotation-body">${n[2]}</div></article>`).join("");$$('.annotation-card').forEach((card,i)=>card.addEventListener('click',()=>focusNote(i)));requestAnimationFrame(()=>placeAnchors(active))}
