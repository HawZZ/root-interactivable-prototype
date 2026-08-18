import { $, $$ } from "./dom.js";

const notes = {
  rules: [
    ["产品选择", "页面标题 > 当前产品", "可按产品名称、型号或标识符搜索。切换后，规则、汇总组、触发源和多语言内容一起切换。", "product-switcher"],
    ["统一多语言", "页面标题 > 统一多语言", "所有规则和汇总组共用一张 KV 大表。导入只改抽屉草稿，保存才应用，取消不生效。", "product-language-entry"],
    ["汇总筛选", "推送规则 > 筛选区", "可查看独立发送规则，或按每日汇总组筛选。", "filter-bar"],
    ["规则列表", "推送规则 > 表格", "内容方式明确显示独立发送或汇总组；多语言只从页面顶部统一入口管理。", "rules-table"],
    ["后续版本", "推送规则 > 后续能力", "事件管理、Webhook、通用合并和优先级不在本期提供入口。", "future-scope"]
  ],
  groups: [
    ["每日汇总定义", "每日汇总 > 顶部说明", "只汇总可以算出当天预计触发时间的云计时器与云端定时耗材。", "group-definition"],
    ["汇总组管理", "每日汇总 > 列表", "共享 Title/Body 在这里统一维护。被规则引用的组不能删除。", "groups-table"],
    ["三种消息预览", "每日汇总 > 发送效果", "系统通知和消息列表只显示共享 Title/Body；提醒项只在 App 消息详情的“今日提醒”中展示。", "message-previews"]
  ],
  groupEditor: [
    ["共享文案", "汇总组抽屉 > English 文案", "系统 notification、App 消息列表和详情共用这一套 Title/Body。规则抽屉只读预览。", "group-definition"]
  ],
  rule1: [
    ["编辑顺序", "规则抽屉 > 顶部步骤条", "先配置消息内容，再设置触发条件，最后设置投递。", "step-nav"],
    ["内容方式", "步骤 1 > 消息内容", "独立发送使用规则自己的文案；加入每日汇总组后只选择已有组并填写提醒项。", "summary-selector"],
    ["插入内容", "步骤 1 > English 文案", "先点击 Title 或 Body，再点击占位内容插入光标位置。", "placeholder-panel"]
  ],
  rule2: [
    ["三类触发", "步骤 2 > 触发源", "设备触发选择物模型；云端选择云计时器；耗材选择配置好的耗材项。", "trigger-source"],
    ["物模型选择", "步骤 2 > 物模型", "搜索属性或事件。属性根据数据类型切换条件组件；事件固定为 = true。", "property-selector"],
    ["提醒时间", "步骤 2 > 提醒时间", "默认全天可提醒；需要限制时，再指定时段，支持 23:00 至 01:00 跨日。", "trigger-time"],
    ["接收者", "步骤 2 > 接收者", "只发给触发设备的绑定用户；每个用户有独立消息记录。", "recipient-resolution"]
  ],
  rule3: [
    ["投递目标", "步骤 3 > 投递目标", "App 消息中心必选；系统 notification 可以按规则开启。", "delivery-target"],
    ["发送方式", "步骤 3 > 发送方式", "独立规则支持逐条发送和仅发送首条；入组规则固定每日汇总。", "delivery-mode"],
    ["最小间隔", "步骤 3 > 仅发送首条", "单位是分钟，只在独立规则选择“仅发送首条”时出现。", "min-interval"],
    ["每日汇总", "步骤 3 > 每日汇总", "同产品、同设备、同组、同自然日合并；每个接收用户分别生成一条消息。", "group-summary"],
    ["保存检查", "步骤 3 > 保存检查", "会检查入组资格、English 必填、物模型条件与发送间隔。", "validation"]
  ],
  language: [
    ["选择语言", "统一多语言 > 选择语言", "English 始终选中。其他语言只在草稿中生效，保存后才应用。", "language-selection"],
    ["XLSX 导入导出", "统一多语言 > 大表操作", "工作表固定为 translations。导入只修改当前抽屉草稿，支持异常报告。", "xlsx-actions"],
    ["KV 大表", "统一多语言 > 大表", "汇总组文案只出现一次，入组规则只出现提醒项，未选语言隐藏但保留值。", "product-language-matrix"],
    ["待补全提醒", "统一多语言 > 待补全", "已选语言缺失只提示，不阻塞保存；未选语言不校验。", "product-language-validation"]
  ]
};

function placeAnchors(activeNotes) {
  $$(".note-anchor").forEach(element => element.remove());
  activeNotes.forEach((note, index) => {
    const target = document.querySelector(`[data-anchor="${note[3]}"]`); if (!target) return;
    const anchor = document.createElement("button"); anchor.className = "note-anchor"; anchor.textContent = String(index + 1); anchor.title = note[0]; anchor.onclick = () => focusNote(index); target.appendChild(anchor);
  });
}
function focusNote(index) {
  $$(".annotation-card").forEach((element, itemIndex) => element.classList.toggle("active", itemIndex === index));
  $$(".anchor-highlight").forEach(element => element.classList.remove("anchor-highlight"));
  const active = notes[currentContext] || notes.rules;
  const target = document.querySelector(`[data-anchor="${active[index]?.[3]}"]`);
  if (target) { target.classList.add("anchor-highlight"); target.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => target.classList.remove("anchor-highlight"), 1400); }
}
let currentContext = "rules";
export function renderAnnotations(context, label) {
  currentContext = context;
  const active = notes[context] || notes.rules;
  $("#annotationContext").textContent = label;
  $("#annotationList").innerHTML = active.map((note, index) => `<article class="annotation-card" data-note="${index}"><span class="annotation-number">${index + 1}</span><h3>${note[0]}</h3><div class="annotation-location">关联位置：${note[1]}</div><div class="annotation-body">${note[2]}</div></article>`).join("");
  $$(".annotation-card").forEach((card, index) => card.onclick = () => focusNote(index));
  requestAnimationFrame(() => placeAnchors(active));
}
