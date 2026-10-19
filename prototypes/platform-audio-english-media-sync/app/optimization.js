// Extend the original category table in place; do not introduce another page.
const find = id => document.getElementById(id);
const html = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current = null;
let busy = false;
let noteContext = 'page';
let noteSelected = null;
let syncTimer;
const fileObjects = new Map();
const initialCategories = JSON.stringify(categories);
const notes = {
  1: ['英文列同步入口', '音源类别 > 类别详情 > 当前音源行 > 英文单元格', 'sync-entry', [['说明','直接在原表格英文单元格的「编辑」旁增加「同步到其他语言」，不增加详情页或额外进入步骤。'],['交互','只同步当前类别、当前音源的媒体文件到其他所有语言，包括已有文件与空列；音源名称不变。AC-01、AC-02、AC-03。'],['待确认建议','英文无媒体时禁用；同步中显示「同步中…」并防止重复提交。']]],
  2: ['各语言独立维护', '原语言单元格 > 编辑', 'sync-independent', [['交互','沿用各语言原有「编辑」入口及抽屉。同步后仍可单独上传、替换、删除该语言媒体文件。'],['状态/差异','修改英文不会自动传播。再次主动同步须重新确认，并覆盖其他语言独立修改的媒体文件。AC-05、AC-06。'],['说明','表格的「已配置/回退英文」沿用原名称与图片的完整性判断；同步仅改变媒体字段，不补齐语言名称。']]],
  3: ['原语言编辑抽屉', '编辑语言配置 > 多语言内容 > 音源图片', 'langImageInput', [['交互','沿用原抽屉与保存/取消流程；媒体输入处可上传、替换或删除。保存只影响当前类别、当前音源、当前语言。'],['原型备注','上传仅在页面内存演示，显示所选文件名；手动填写引用沿用原控件。取消不提交变更。同步不改动名称及音源库 URL。']]],
  4: ['覆盖前二次确认', '英文单元格 > 同步到其他语言 > 确认框', 'sync-confirm', [['交互','点击入口先确认；「取消」、关闭或 Esc 均不修改文件。「确认同步」才覆盖其他所有语言。'],['范围','确认框显示类别与音源 ID，避免在多行表格中误认对象。英文源文件不变；不建立持续同步关系。']]],
  5: ['同步结果反馈', '原类别表格 > 结果提示', 'sync-toast', [['成功','全部目标完成后显示「已同步到其他所有语言」，原表格直接更新实际媒体引用。AC-04。'],['失败','显示「同步未完成，请查看各语言媒体文件后重试」；不得误报成功，再次发起仍需确认。'],['原型备注','失败开关仅用于评审，此演示不执行覆盖，不代表生产回滚/部分成功策略已确定。']]]
};

// Retain the original product styles within the annotated 1440px canvas.
const baselineApp = document.querySelector('.app');
const panel = find('prototypeAnnotationPanel');
const toolbar = find('prototypeToolbar');
const review = document.createElement('div');
review.className = 'sync-review-layout';
const stage = document.createElement('main');
stage.className = 'sync-stage';
stage.setAttribute('aria-label','音源管理优化原型');
const frame = document.createElement('div');
frame.className = 'sync-canvas-scroll';
frame.id = 'sync-canvas-scroll';
frame.tabIndex = 0;
frame.setAttribute('aria-label','1440 像素原音源管理画布，可横向滚动');
baselineApp.classList.add('sync-canvas');
baselineApp.before(review);
frame.append(baselineApp);
stage.append(toolbar,frame);
const status = document.createElement('div');
status.className = 'sync-status-line';
status.textContent = '原音源原型视觉基线 · 1440 px 画布 · 黄色编号仅为评审批注';
stage.append(status);
review.append(stage,panel);
toolbar.innerHTML = '<span class="prototype-toolbar-title">音源管理优化 · 英文媒体文件同步</span><div class="sync-review-controls"><label><input type="checkbox" id="fail-next">模拟下次同步失败</label><button class="btn" id="reset-demo">重置示例</button></div>';
find('closePrototypeAnnotations').hidden = true;
panel.querySelector('.prototype-annotation-caption').id = 'sync-notes-context';
find('prototypeAnnotationList').classList.add('sync-annotation-list');
const mobile = document.createElement('nav');
mobile.className = 'sync-mobile-tabs';
mobile.setAttribute('aria-label','原型视图');
mobile.innerHTML = '<button data-sync-view="product" aria-selected="true">交互原型</button><button data-sync-view="notes" aria-selected="false">原型批注</button>';
review.before(mobile);
const mask = document.createElement('div');
mask.className = 'sync-confirm-mask';
mask.id = 'sync-confirm-mask';
mask.hidden = true;
mask.innerHTML = '<section class="modal sync-confirm" id="sync-confirm" role="dialog" aria-modal="true" aria-labelledby="sync-confirm-title" aria-describedby="sync-confirm-description"><header class="modal-head"><h2 class="modal-title" id="sync-confirm-title">同步到其他语言？ <button class="prototype-note-number sync-note-anchor" data-sync-note="4" aria-label="查看批注 4">4</button></h2><button class="icon-btn" id="sync-close-confirm" aria-label="关闭确认框">×</button></header><div class="modal-body"><p id="sync-confirm-description">将使用英文列的媒体文件覆盖当前音源其他所有语言列的现有媒体文件。同步后，各语言仍可独立修改。是否继续？</p><div class="sync-source"><span id="sync-source-object"></span><strong id="sync-source-name"></strong></div></div><footer class="modal-foot"><button class="btn" id="sync-cancel">取消</button><button class="btn primary" id="sync-confirm-action">确认同步</button></footer></section>';
baselineApp.append(mask);
const result = document.createElement('div');
result.className = 'toast sync-result';
result.id = 'sync-toast';
result.hidden = true;
result.setAttribute('role','status');
result.setAttribute('aria-live','polite');
result.innerHTML = '<span id="sync-toast-text"></span><button class="prototype-note-number sync-note-anchor" data-sync-note="5" aria-label="查看批注 5">5</button><button class="icon-btn" id="sync-toast-close" aria-label="关闭结果提示">×</button>';
baselineApp.append(result);
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.id = 'sync-file-picker';
fileInput.className = 'sync-file-input';
fileInput.setAttribute('aria-label','选择媒体文件');
document.body.append(fileInput);

function anchor(number) {
  return `<button class="prototype-note-number sync-note-anchor" data-sync-note="${number}" aria-label="查看批注 ${number}">${number}</button>`;
}
const originalTable = renderCategoryConfigTable;
renderCategoryConfigTable = function(category) {
  originalTable(category);
  find('categoryConfigRows').querySelectorAll('tr').forEach((row,index)=>{
    const audioId = row.querySelector('td .mono').textContent;
    row.dataset.syncAudio = audioId;
    row.querySelectorAll('[data-edit-lang]').forEach(edit=>{
      const code = edit.dataset.lang;
      const cell = edit.closest('.language-cell');
      cell.dataset.syncLanguage = code;
      edit.disabled = busy;
      if (code === 'en') {
        const config = normalizeConfig(category,audioId,'en');
        const actions = document.createElement('div');
        actions.className = 'sync-cell-actions';
        edit.before(actions); actions.append(edit);
        actions.insertAdjacentHTML('beforeend',`<button class="btn link sync-inline-action" data-sync-category="${html(category.id)}" data-sync-audio="${html(audioId)}" aria-label="同步音源 ${html(audioId)} 到其他语言" ${busy||!config.image?'disabled':''} title="${!config.image?'请先上传英文媒体文件':''}">${busy&&current?.categoryId===category.id&&current?.audioId===audioId?'同步中…':'同步到其他语言'}</button>`);
        if(index===0){cell.id='sync-entry'; actions.insertAdjacentHTML('beforeend',anchor(1));}
      } else if(index===0&&code===languageCodes[1]) {
        cell.id='sync-independent';
        const actions=document.createElement('div'); actions.className='sync-cell-actions';
        edit.before(actions); actions.append(edit); actions.insertAdjacentHTML('beforeend',anchor(2));
      }
    });
  });
  highlight();
};
const originalDrawer = openLanguageDrawer;
openLanguageDrawer = function(categoryId,audioId,lang) {
  if(busy) return;
  noteContext='drawer'; result.hidden=true; noteSelected=null;
  originalDrawer(categoryId,audioId,lang);
  const controls=document.createElement('div');
  controls.className='sync-drawer-file-actions';
  controls.innerHTML='<button class="btn" id="sync-upload-file">上传文件</button><button class="btn link danger" id="sync-delete-file">删除媒体文件</button>'+anchor(3);
  find('langImageInput').after(controls);
  updateFileButtons(); renderSyncAnnotations();
};
function updateFileButtons() {
  if(!find('sync-upload-file')) return;
  const hasFile=Boolean(find('langImageInput').value.trim());
  find('sync-upload-file').textContent=hasFile?'替换文件':'上传文件';
  find('sync-delete-file').disabled=!hasFile;
}
function highlight() {
  document.querySelectorAll('.sync-note-selected').forEach(e=>e.classList.remove('sync-note-selected'));
  if(noteSelected) find(notes[noteSelected][2])?.classList.add('sync-note-selected');
}
const originalAnnotations = renderPrototypeAnnotations;
function renderSyncAnnotations() {
  if(!find('categoryView').classList.contains('active')&&!document.body.classList.contains('drawer-open')){originalAnnotations();return;}
  if(document.body.classList.contains('drawer-open')&&activeDrawer!=='language'){originalAnnotations();return;}
  if(noteContext==='drawer'&&!document.body.classList.contains('drawer-open')) noteContext='page';
  document.querySelectorAll('.prototype-note-anchor').forEach(e=>e.remove());
  const drawer=document.body.classList.contains('drawer-open')&&activeDrawer==='language';
  const ids=drawer?[3]:noteContext==='confirm'?[4]:noteContext==='result'?[5]:[1,2];
  find('sync-notes-context').textContent=drawer?'原语言编辑抽屉':noteContext==='confirm'?'英文单元格 > 二次确认':noteContext==='result'?'英文同步 > 结果反馈':'音源类别 > 类别详情 > 原多语言表格';
  find('prototypeAnnotationList').innerHTML='<div class="sync-prd-boundary"><strong>优化范围：F01 同步 / F02 独立维护</strong><p>同步按钮直接位于原表格英文单元格；无新增详情页。</p><a href="https://momcozy-in.feishu.cn/docx/RIbFdwulkoY5Msx620Acy4jfnIf" target="_blank" rel="noopener">查看轻量 PRD ↗</a></div>'+ids.map(id=>{const n=notes[id];return `<section class="prototype-note-card sync-note-card ${noteSelected===id?'active':''}" role="button" tabindex="0" data-sync-card="${id}" aria-label="批注 ${id}：${n[0]}"><span class="prototype-note-number">${id}</span><div class="prototype-note-copy"><strong>${n[0]}</strong><p class="sync-note-location">关联位置：${n[1]}</p><dl>${n[3].map(([key,value])=>`<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl></div></section>`;}).join('')+'<section class="sync-assumptions"><h3>待确认 · 演示假设</h3><ul><li>媒体字段范围仍待确认；本版沿用原单元格「图」字段演示，未把音源库 URL 纳入同步。</li><li>英文为空时禁用、同步中防重复为待确认建议。</li><li>变更仅在当前页面内存演示，刷新恢复；不定义生产保存时点。</li><li>失败演示不覆盖，不代表生产回滚或部分成功策略已确定。</li></ul></section>';
  highlight();
}
renderPrototypeAnnotations=renderSyncAnnotations;
function positionFeedback() {
  if(document.body.dataset.syncView==='notes'&&window.innerWidth<=900)return;
  const bounds=frame.getBoundingClientRect();
  document.documentElement.style.setProperty('--sync-frame-top',`${bounds.top}px`);
  document.documentElement.style.setProperty('--sync-frame-height',`${bounds.height}px`);
  document.documentElement.style.setProperty('--sync-frame-bottom',`${innerHeight-bounds.bottom}px`);
  const width=frame.clientWidth;
  const modalWidth=Math.min(520,Math.max(260,width-32));
  const modal=find('sync-confirm');
  modal.style.width=`${modalWidth}px`;
  modal.style.maxHeight=`${Math.max(180,frame.clientHeight-48)}px`;
  modal.style.left='auto';
  modal.style.marginLeft=`${frame.scrollLeft+(width-modalWidth)/2}px`;
  modal.style.top=`${Math.max(24,Math.min(120,(frame.clientHeight-290)/2))}px`;
  modal.style.marginTop=modal.style.top;
  result.style.left=`${frame.scrollLeft+16}px`;
  result.style.top=`${frame.scrollTop+18}px`;
  result.style.maxWidth=`${Math.max(260,width-32)}px`;
}
function closeConfirm() {
  mask.hidden=true; noteContext='page';noteSelected=null;renderSyncAnnotations();
  document.querySelector(`[data-sync-category="${current?.categoryId}"][data-sync-audio="${current?.audioId}"]`)?.focus({preventScroll:true});
}
function openConfirm(categoryId,audioId) {
  const category=categoryById(categoryId);
  const source=normalizeConfig(category,audioId,'en').image;
  if(busy||!source)return;
  current={categoryId,audioId};result.hidden=true;
  find('sync-source-object').textContent=`${category.name} · 音源 ID ${audioId} · 英文媒体文件`;
  find('sync-source-name').textContent=source;
  mask.hidden=false;noteContext='confirm';noteSelected=null;
  renderSyncAnnotations();positionFeedback();find('sync-cancel').focus({preventScroll:true});
}
function synchronize() {
  if(busy||mask.hidden||!current)return;
  const category=categoryById(current.categoryId);
  const audioId=current.audioId;
  const source=normalizeConfig(category,audioId,'en').image;
  if(!source)return;
  const fails=find('fail-next').checked;find('fail-next').checked=false;
  closeConfirm();busy=true;
  find('reset-demo').disabled=true;find('fail-next').disabled=true;
  renderCategoryDetail();renderSyncAnnotations();
  syncTimer=setTimeout(()=>{
    if(!fails) languageCodes.filter(code=>code!=='en').forEach(code=>{normalizeConfig(category,audioId,code).image=source;});
    busy=false;find('reset-demo').disabled=false;find('fail-next').disabled=false;
    renderCategoryDetail();renderProductRows();
    find('sync-toast-text').textContent=fails?'同步未完成，请查看各语言媒体文件后重试':'已同步到其他所有语言';
    result.classList.toggle('error',fails);result.hidden=false;
    noteContext='result';noteSelected=null;renderSyncAnnotations();positionFeedback();
  },1100);
}
function selectNote(id) {
  noteSelected=id;
  renderSyncAnnotations();highlight();
  find(notes[id][2])?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  document.querySelector(`[data-sync-card="${id}"]`)?.scrollIntoView({block:'nearest'});
}
document.addEventListener('click',event=>{
  const note=event.target.closest('[data-sync-note]');
  if(note){selectNote(Number(note.dataset.syncNote));return;}
  const card=event.target.closest('[data-sync-card]');
  if(card){selectNote(Number(card.dataset.syncCard));return;}
  const sync=event.target.closest('[data-sync-category]');
  if(sync){openConfirm(sync.dataset.syncCategory,sync.dataset.syncAudio);return;}
  if(event.target.closest('#sync-upload-file')){fileInput.value='';fileInput.click();}
  if(event.target.closest('#sync-delete-file')){find('langImageInput').value='';updateFileButtons();}
});
document.addEventListener('input',event=>{if(event.target.id==='langImageInput')updateFileButtons();});
fileInput.addEventListener('change',()=>{
  const file=fileInput.files[0];
  if(!file||activeDrawer!=='language')return;
  fileObjects.set(file.name,file);find('langImageInput').value=file.name;updateFileButtons();
});
find('sync-cancel').addEventListener('click',closeConfirm);
find('sync-close-confirm').addEventListener('click',closeConfirm);
find('sync-confirm-action').addEventListener('click',synchronize);
find('sync-toast-close').addEventListener('click',()=>{result.hidden=true;noteContext='page';noteSelected=null;renderSyncAnnotations();});
find('reset-demo').addEventListener('click',()=>{
  if(busy)return;
  clearTimeout(syncTimer);categories=JSON.parse(initialCategories);fileObjects.clear();
  current=null;mask.hidden=true;result.hidden=true;find('fail-next').checked=false;
  noteContext='page';noteSelected=null;renderAll();
});
mobile.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{
  document.body.dataset.syncView=button.dataset.syncView;
  mobile.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
  positionFeedback();
}));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!mask.hidden)closeConfirm();
  const card=event.target.closest('[data-sync-card]');
  if(card&&['Enter',' '].includes(event.key)){event.preventDefault();selectNote(Number(card.dataset.syncCard));}
  if(event.key==='Tab'&&!mask.hidden){const buttons=[...find('sync-confirm').querySelectorAll('button')];
    if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons.at(-1).focus();}
    else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){event.preventDefault();buttons[0].focus();}
  }
});
frame.addEventListener('scroll',positionFeedback);
window.addEventListener('resize',positionFeedback);
setPrototypeAnnotationsOpen(true);
setActiveView('categoryView');
renderCategoryDetail();renderSyncAnnotations();positionFeedback();
