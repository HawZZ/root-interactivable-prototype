import {$,$$,on,esc,showToast} from "./dom.js";
import {appState,events} from "./state.js";
import {renderAnnotations} from "./annotations.js";

const steps=[
  [1,"基础信息","分类、优先级、模板"],[2,"触发与范围","事件、目标、地域"],[3,"时间与频控","窗口、时区、节流"],[4,"生命周期","结束、上限、升级"]
];

function drawerShell(){
  return `<div class="drawer-host is-open" id="ruleDrawer">
    <div class="drawer-mask" data-close-drawer></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="${appState.editingRule?'编辑':'新建'}推送规则">
      <header class="drawer-header"><div class="drawer-title"><h2>${appState.editingRule?'编辑':'新建'}推送规则</h2><p>S12 Pro 吸乳器 · ${appState.rule.name||'未命名规则'}</p></div><button class="icon-btn" data-close-drawer>×</button></header>
      <div class="drawer-body">
        <nav class="step-nav" data-anchor="step-nav">${steps.map(([id,title,sub])=>`<button class="step-item ${appState.ruleStep===id?'active':''}" data-step="${id}"><span class="step-index">${id}</span><span class="step-copy"><strong>${title}</strong><small>${sub}</small></span></button>`).join('')}</nav>
        <section class="drawer-content" id="ruleStepContent">${renderStep()}</section>
      </div>
      <footer class="drawer-footer" data-anchor="drawer-footer"><span class="save-hint">自动保存上次编辑：刚刚</span><div class="footer-actions"><button class="el-btn" data-draft>保存草稿</button><button class="el-btn" data-prev ${appState.ruleStep===1?'disabled':''}>上一步</button>${appState.ruleStep<4?'<button class="el-btn el-btn--primary" data-next>下一步</button>':'<button class="el-btn el-btn--primary" data-enable>保存并启用</button>'}</div></footer>
    </aside></div>`;
}

function basicStep(){return `<div class="form-section"><div class="section-title"><h3>基础信息</h3><p>规则负责“何时、向谁、按什么策略发送”</p></div><div class="form-grid">
  <label class="form-row full"><span class="form-label"><i class="required">*</i>规则名称</span><input class="el-input" data-field="name" value="${esc(appState.rule.name)}" maxlength="50"><p class="form-help">2-50 字，仅后台可见。</p></label>
  <label class="form-row"><span class="form-label"><i class="required">*</i>产品</span><div class="readonly-field">S12 Pro 吸乳器 · 1764579849076604930</div></label>
  <label class="form-row"><span class="form-label"><i class="required">*</i>消息分类</span><select class="el-select" data-field="category">${["安全","维护","耗材","通知","系统","固件","安防"].map(v=>`<option ${v===appState.rule.category?'selected':''}>${v}</option>`).join('')}</select><p class="form-help">管理员可在分类字典中扩展。</p></label>
  <div class="form-row full" data-anchor="priority-field"><span class="form-label"><i class="required">*</i>优先级</span><div class="radio-row">${[["P0","紧急","关键语言阻断，最快升级"],["P1","重要","标准升级"],["P2","常规","默认，无强制升级"]].map(([v,t,d])=>`<label class="choice-card ${appState.rule.priority===v?'selected':''}"><input type="radio" name="priority" value="${v}" ${appState.rule.priority===v?'checked':''}><span class="choice-copy"><strong>${v} · ${t}</strong><small>${d}</small></span></label>`).join('')}</div></div>
  <label class="form-row full" data-anchor="template-field"><span class="form-label"><i class="required">*</i>消息模板</span><div class="inline-fields"><select class="el-select" data-field="template"><option>溢奶安全提醒 · 16/16</option><option>滤芯更换提醒 · 13/16</option><option>固件升级结果 · 10/16</option></select><span></span><button type="button" class="el-btn" data-open-template>编辑当前模板</button></div><p class="form-help">规则仅保存 templateId；title/body/cozyLink 在模板中维护。</p></label>
  </div></div>`}

function triggerStep(){
  const event=events.find(e=>e.id===appState.rule.eventId)||events[0];
  return `<div class="form-section"><div class="section-title"><h3>触发条件</h3><p>一条规则只绑定一种触发类型</p></div>
    <div class="form-row full" data-anchor="trigger-type"><span class="form-label"><i class="required">*</i>触发类型</span><div class="radio-row">${[["device","设备触发"],["cloud","云端触发"],["consumable","耗材触发"],["event","事件触发"]].map(([v,t])=>`<label class="choice-card ${appState.rule.triggerType===v?'selected':''}"><input type="radio" name="triggerType" value="${v}" ${appState.rule.triggerType===v?'checked':''}><span class="choice-copy"><strong>${t}</strong></span></label>`).join('')}</div></div>
    ${appState.rule.triggerType==='event'?`<div class="form-row full" data-anchor="event-field"><span class="form-label"><i class="required">*</i>授权事件</span>${appState.eventApiDown?`<div class="help-alert warning"><strong>事件注册服务暂不可用</strong>：当前仅可消费已授权 event_type ID。此为临时降级；不会伪造事件名称或 schema。</div><input class="el-input" value="${event.id}" aria-label="授权事件ID">`:`<select class="el-select" data-field="eventId">${events.map(e=>`<option value="${e.id}" ${e.id===event.id?'selected':''}>${e.name} · ${e.id}</option>`).join('')}</select><div class="schema-box"><div class="schema-head"><span>${event.name}</span><span>caller_id: ${event.caller} · ${event.scope}</span></div><pre>${esc(event.schema)}</pre></div>`}<p class="form-help">只返回 caller_id × event_type × productId 授权范围内事件；读 API 继承管理员 Bearer JWT。</p><button type="button" class="op-link" data-toggle-event-api>${appState.eventApiDown?'恢复注册读 API':'模拟注册读 API 不可用'}</button></div>`:`<div class="help-alert">当前分支沿用现网条件对象；本原型重点验证事件触发，其他三类保持既有配置语义。</div>`}
  </div><div class="form-section"><div class="section-title"><h3>目标与范围</h3><p>三种目标模式互斥</p></div><div class="form-grid">
    <div class="form-row full" data-anchor="target-mode"><span class="form-label"><i class="required">*</i>目标用户</span><div class="radio-row">${[["direct","单点 userId"],["batch","批量 userId"],["filter","条件筛选"]].map(([v,t])=>`<label><input type="radio" name="targetMode" value="${v}" ${appState.rule.targetMode===v?'checked':''}> ${t}</label>`).join('')}</div><p class="form-help">targets 与 filter 互斥；当前使用 region 白名单字段筛选。</p></div>
    <div class="form-row full" data-anchor="regions-field"><span class="form-label"><i class="required">*</i>生效市场</span><div class="check-row">${["全部市场","美国","德国","日本","英国"].map(v=>`<label><input type="checkbox" name="regions" value="${v}" ${appState.rule.regions.includes(v)?'checked':''}> ${v}</label>`).join('')}</div><p class="form-help">选择市场同时决定用户筛选、默认时区和 P0 关键语言集合。</p></div>
  </div></div>`
}

function timeStep(){return `<div class="form-section"><div class="section-title"><h3>生效时间</h3><p>默认使用市场时区</p></div><div class="form-grid">
  <div class="form-row full" data-anchor="time-field"><span class="form-label"><i class="required">*</i>时间范围</span><div class="inline-fields"><input class="el-input" value="${appState.rule.start}"><span>至</span><input class="el-input" value="${appState.rule.end}" placeholder="长期有效"></div></div>
  <label class="form-row"><span class="form-label">循环</span><select class="el-select"><option>每日</option><option>每周一至周五</option><option>不循环</option></select></label>
  <label class="form-row" data-anchor="timezone-field"><span class="form-label">时区</span><select class="el-select"><option>市场时区（推荐）</option><option>UTC+08:00 Asia/Shanghai</option></select><p class="form-help">多时区国家首期拆分规则。</p></label>
  </div></div><div class="form-section"><div class="section-title"><h3>发送频控</h3><p>规则内最小发送间隔</p></div><div class="form-row full" data-anchor="throttle-field"><div class="radio-row">${[["实时","立即发送"],["小时节流","3600s，仅窗口首发"],["日节流","86400s，仅窗口首发"],["自定义","5 分钟至 7 天"]].map(([v,d])=>`<label class="choice-card ${appState.rule.throttle===v?'selected':''}"><input type="radio" name="throttle" value="${v}" ${appState.rule.throttle===v?'checked':''}><span class="choice-copy"><strong>${v}</strong><small>${d}</small></span></label>`).join('')}</div><div class="help-alert warning"><strong>节流语义：</strong>最小发送间隔内的后续事件将被丢弃，不会合并成批量消息或日摘要。首期不承诺跨规则全局频控。</div></div></div>
  <div class="summary-card" data-anchor="rule-summary"><h4>规则自然语言摘要</h4><p>${ruleSummary()}</p></div>`}

function lifecycleStep(){
  const missingGerman=!appState.template.values["de-DE"].title||!appState.template.values["de-DE"].body;
  return `<div class="form-section"><div class="section-title"><h3>提醒生命周期</h3><p>用户确认不等于事件结束</p></div>
  <div class="form-row full" data-anchor="lifecycle-field"><span class="form-label"><i class="required">*</i>提醒模式</span><div class="radio-row"><label class="choice-card ${appState.rule.lifecycle==='single'?'selected':''}"><input type="radio" name="lifecycle" value="single" ${appState.rule.lifecycle==='single'?'checked':''}><span class="choice-copy"><strong>单次通知</strong><small>触发后按频控发送一次</small></span></label><label class="choice-card ${appState.rule.lifecycle==='continuous'?'selected':''}"><input type="radio" name="lifecycle" value="continuous" ${appState.rule.lifecycle==='continuous'?'checked':''}><span class="choice-copy"><strong>连续提醒</strong><small>直到恢复事件或安全上限结束</small></span></label></div></div>
  ${appState.rule.lifecycle==='continuous'?`<label class="form-row full"><span class="form-label">结束事件（恢复信号）</span><select class="el-select" data-field="recoveryEvent"><option value="">不配置 — 进入受限模式</option>${events.filter(e=>e.id.includes('recovered')).map(e=>`<option value="${e.id}" ${appState.rule.recoveryEvent===e.id?'selected':''}>${e.name} · ${e.id}</option>`).join('')}</select><p class="form-help">通过 eventId + userId/deviceId 匹配活跃提醒实例；用户点击或确认消息不会结束提醒。</p></label>`:''}
  <div class="help-alert ${appState.rule.recoveryEvent?'success':'warning'}">${appState.rule.recoveryEvent?'正常生命周期：已绑定恢复事件；仅匹配同一 userId/deviceId 的活跃实例。':'受限模式：未配置结束事件，必须依赖时长、次数与熔断器自动停止。'}</div></div>
  <div class="form-section" data-anchor="hard-cap"><div class="section-title"><h3>安全上限与熔断</h3><p>系统硬顶不可按规则修改</p></div><div class="form-grid"><label class="form-row"><span class="form-label">规则最大持续时间</span><input class="el-input" type="number" value="${appState.rule.maxHours}" min="1" max="168" ${appState.rule.recoveryEvent?'disabled':''}><p class="form-help">默认 72h；系统硬顶 168h。</p></label><label class="form-row"><span class="form-label">规则最大提醒次数</span><input class="el-input" type="number" value="${appState.rule.maxCount}" min="1" max="500" ${appState.rule.recoveryEvent?'disabled':''}><p class="form-help">默认 100；系统硬顶 500。</p></label><div class="form-row full" data-anchor="delivery-cap"><div class="readonly-field">投递硬顶：1 push / 5 min / user / rule</div><p class="form-help">升级倍率 2×/4× 也不能突破。熔断条件：达到 duration、count 或 >100 triggers/min/rule。</p></div></div></div>
  <div class="form-section" data-anchor="escalation"><div class="section-title"><h3>升级路径</h3><p>P0：12h → 24h；频率递增受硬顶约束</p></div><div class="form-row full"><span class="form-label">升级接收人 userId</span><div class="chip-list">${appState.rule.targets.map(t=>`<span class="chip">${t}<button aria-label="移除">×</button></span>`).join('')}<button class="el-btn el-btn--small" data-add-target>+ 添加接收人</button></div><p class="form-help">为空回退系统管理员；同一接收人 60s 内来自多条规则的升级聚合为一条。</p></div></div>
  <div class="form-section" data-anchor="validation"><div class="section-title"><h3>保存前校验</h3><p>自动执行</p></div><div class="validation-list">
    <div class="validation-item"><span>✓ 规则基础字段与事件授权</span><span class="el-tag el-tag--success is-plain">通过</span></div>
    <div class="validation-item"><span>${missingGerman?'!':'✓'} P0 关键市场语言（英文 + 德语）</span><span class="el-tag el-tag--${missingGerman?'danger':'success'} is-plain">${missingGerman?'阻断：德语缺失':'通过'}</span></div>
    <div class="validation-item"><span>! 与“夜间溢奶安全提醒”触发范围重叠</span><button class="op-link" data-conflict>查看冲突</button></div>
    <div class="validation-item"><span>✓ 占位符与生命周期安全上限</span><span class="el-tag el-tag--success is-plain">通过</span></div>
  </div>${missingGerman?'<button class="el-btn" style="margin-top:10px" data-open-template>补全模板德语</button>':''}</div>`
}

function renderStep(){return appState.ruleStep===1?basicStep():appState.ruleStep===2?triggerStep():appState.ruleStep===3?timeStep():lifecycleStep()}
function ruleSummary(){const e=events.find(e=>e.id===appState.rule.eventId);return `当【${e?.name||appState.rule.eventId}】发生时；向【${appState.rule.regions.join('、')}市场的命中用户】；在【2026-08-01 起，按市场时区每日生效】；按【${appState.rule.throttle}，${appState.rule.lifecycle==='continuous'?'连续提醒直至恢复事件':'单次通知'}】发送【${appState.rule.template}】。`}

export function openRuleDrawer({edit=false,openTemplate}={}){
  appState.editingRule=edit; appState.ruleStep=1; const root=$("#overlayRoot"); root.innerHTML=drawerShell(); wire(openTemplate); renderAnnotations("rule1","规则配置 · 步骤 1/4");
}
function rerender(openTemplate){const content=$("#ruleStepContent");content.innerHTML=renderStep();$$(".step-item").forEach(el=>el.classList.toggle("active",Number(el.dataset.step)===appState.ruleStep));const footer=$(".drawer-footer");footer.innerHTML=`<span class="save-hint">自动保存上次编辑：刚刚</span><div class="footer-actions"><button class="el-btn" data-draft>保存草稿</button><button class="el-btn" data-prev ${appState.ruleStep===1?'disabled':''}>上一步</button>${appState.ruleStep<4?'<button class="el-btn el-btn--primary" data-next>下一步</button>':'<button class="el-btn el-btn--primary" data-enable>保存并启用</button>'}</div>`;wireStep(openTemplate);renderAnnotations(`rule${appState.ruleStep}`,`规则配置 · 步骤 ${appState.ruleStep}/4`)}
function wire(openTemplate){const host=$("#ruleDrawer");on(host,"click","[data-close-drawer]",()=>closeRuleDrawer());on(host,"click","[data-step]",(e,el)=>{appState.ruleStep=Number(el.dataset.step);rerender(openTemplate)});wireStep(openTemplate)}
function wireStep(openTemplate){const host=$("#ruleDrawer");
  $$('[data-field]',host).forEach(el=>el.addEventListener('change',()=>{appState.rule[el.dataset.field]=el.value;if(el.dataset.field==='recoveryEvent')rerender(openTemplate);if(el.dataset.field==='eventId')rerender(openTemplate)}));
  $$('input[name="priority"]',host).forEach(el=>el.addEventListener('change',()=>{appState.rule.priority=el.value;rerender(openTemplate)}));
  $$('input[name="triggerType"]',host).forEach(el=>el.addEventListener('change',()=>{appState.rule.triggerType=el.value;rerender(openTemplate)}));
  $$('input[name="targetMode"]',host).forEach(el=>el.addEventListener('change',()=>{appState.rule.targetMode=el.value}));
  $$('input[name="throttle"]',host).forEach(el=>el.addEventListener('change',()=>{appState.rule.throttle=el.value;rerender(openTemplate)}));
  $$('input[name="lifecycle"]',host).forEach(el=>el.addEventListener('change',()=>{appState.rule.lifecycle=el.value;rerender(openTemplate)}));
  $$('input[name="regions"]',host).forEach(el=>el.addEventListener('change',()=>{const vals=$$('input[name="regions"]:checked',host).map(x=>x.value);appState.rule.regions=vals.includes('全部市场')?['全部市场']:vals}));
  $('[data-next]',host)?.addEventListener('click',()=>{appState.ruleStep++;rerender(openTemplate)}); $('[data-prev]',host)?.addEventListener('click',()=>{appState.ruleStep--;rerender(openTemplate)});
  $('[data-draft]',host)?.addEventListener('click',e=>saveButton(e.currentTarget,'草稿已保存'));
  $('[data-open-template]',host)?.addEventListener('click',()=>openTemplate?.());
  $('[data-toggle-event-api]',host)?.addEventListener('click',()=>{appState.eventApiDown=!appState.eventApiDown;rerender(openTemplate)});
  $('[data-add-target]',host)?.addEventListener('click',()=>{appState.rule.targets.push('U-90206 运营负责人');rerender(openTemplate)});
  $('[data-conflict]',host)?.addEventListener('click',()=>openConflict());
  $('[data-enable]',host)?.addEventListener('click',e=>{const missing=!appState.template.values['de-DE'].title||!appState.template.values['de-DE'].body;if(missing){showToast('P0 规则缺少德国市场主语言，无法启用','error');return}openConflict(true,e.currentTarget)});
}
function saveButton(btn,message){btn.disabled=true;btn.textContent='保存中…';setTimeout(()=>{showToast(message);btn.disabled=false;btn.textContent='保存草稿'},650)}
function openConflict(saveAfter=false,button){const root=$("#overlayRoot");const modal=document.createElement('div');modal.className='modal-host';modal.innerHTML=`<div class="modal"><header class="modal-header"><h3>发现 1 条潜在冲突</h3><button class="icon-btn" data-modal-close>×</button></header><div class="modal-body"><div class="help-alert warning">相同触发对象、相同市场且生效时间重叠。该冲突为警告，不自动阻断。</div><div class="conflict-row"><strong>夜间溢奶安全提醒</strong><div class="secondary-cell">美国、德国 · 每日 22:00-08:00 · P0</div></div></div><footer class="modal-footer"><button class="el-btn" data-modal-close>返回修改</button>${saveAfter?'<button class="el-btn el-btn--primary" data-confirm-save>仍然启用</button>':''}</footer></div>`;document.body.appendChild(modal);$$('[data-modal-close]',modal).forEach(x=>x.onclick=()=>modal.remove());$('[data-confirm-save]',modal)?.addEventListener('click',()=>{const b=$('[data-confirm-save]',modal);b.disabled=true;b.textContent='保存中…';setTimeout(()=>{modal.remove();closeRuleDrawer();showToast('规则已保存并启用')},700)})}
export function closeRuleDrawer(){const host=$("#ruleDrawer");if(!host)return;host.classList.remove('is-open');setTimeout(()=>host.remove(),220);renderAnnotations(appState.tab,appState.tab==='rules'?'推送规则列表':'消息模板列表')}
