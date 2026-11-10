/* FAQ H5 increment. Base V3.2 product shell and lifecycle stay in index.html. */
(() => {
  // Prototype browser metadata: avoid an unrelated root favicon request.
  const faqIcon = document.createElement('link'); faqIcon.rel = 'icon'; faqIcon.href = 'data:,'; document.head.appendChild(faqIcon);
  const base = {
    form: renderManualForm, bind: bindManualForm, preview: renderManualPreview,
    validate: validateConfig, capture: captureV3Config, restore: restoreV3Config,
    annotations: renderPrototypeAnnotations
  };
  const blank = () => ({ enabled: false, html: '' });
  state.manualH5 = blank();
  let reviewClient = 'new';
  let savedRange = null;
  let selectedMedia = null;
  let mediaSequence = 0;
  const editor = () => document.getElementById('faqH5Editor');
  function contentDoc(html = state.manualH5?.html || '') {
    const node = document.createElement('div'); node.innerHTML = html; return node;
  }
  function textCount(html) {
    const node = contentDoc(html);
    node.querySelectorAll('figure').forEach(n => n.remove());
    // Visible text only: Unicode code points; normalized newlines count once.
    function visibleText(n) {
      if (n.nodeType === Node.TEXT_NODE) return n.textContent;
      if (n.nodeType !== Node.ELEMENT_NODE) return '';
      if (n.matches('figure')) return '';
      if (n.tagName === 'BR') return '\n';
      const parts = Array.from(n.childNodes).map(visibleText);
      return parts.join('') + (/^(P|DIV|H2|LI)$/.test(n.tagName) ? '\n' : '');
    }
    const text = Array.from(node.childNodes).map(visibleText).join('').replace(/\n$/, '').replace(/\r\n?/g, '\n');
    return Array.from(text).length;
  }
  function h5Issues() {
    const h5 = state.manualH5 || blank();
    if (state.manualPdfHidden || !h5.enabled) return [];
    const node = contentDoc(h5.html);
    const issues = [];
    if (!(node.textContent || '').trim() && !node.querySelector('figure')) issues.push('已启用 H5，请编辑正文或插入媒体；也可停用 H5 后仅使用 PDF。');
    if (textCount(h5.html) > 5000) issues.push('H5 纯文字超过 5000 字，请调整后发布。');
    if ([...node.querySelectorAll('figure')].some(n => Number(n.dataset.bytes) > 5 * 1024 * 1024)) issues.push('H5 存在超过 5MB 的媒体，请移除后重新插入。');
    return issues;
  }
  function cleanHtml() {
    const node = contentDoc(editor()?.innerHTML || '');
    node.querySelectorAll('.faq-selected').forEach(n => n.classList.remove('faq-selected'));
    return node.innerHTML;
  }
  function refreshFeedback() {
    const count = document.getElementById('faqTextCount');
    if (count) { count.textContent = `${textCount()} / 5000`; count.classList.toggle('faq-over', textCount() > 5000); }
    const errors = document.getElementById('faqH5Errors');
    if (errors) errors.textContent = h5Issues().join(' ');
    renderPreviewSurfaces();
    updateReviewResult();
    if (state.validationRan) renderValidationBox();
  }
  function commitEditor() {
    state.manualH5.html = cleanHtml(); setDirty(); refreshFeedback();
  }
  function rememberRange() {
    const selection = window.getSelection();
    if (selection.rangeCount && editor()?.contains(selection.anchorNode)) savedRange = selection.getRangeAt(0).cloneRange();
  }
  function focusRange() {
    const el = editor(); if (!el) return;
    el.focus();
    const selection = window.getSelection(); selection.removeAllRanges();
    if (savedRange && el.contains(savedRange.commonAncestorContainer)) selection.addRange(savedRange);
    else { const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); selection.addRange(range); }
  }
  function moveMedia(direction) {
    const el = editor();
    if (!selectedMedia || !el?.contains(selectedMedia)) return showToast('先点击正文中需要移动的媒体');
    const media = selectedMedia;
    // Keep movement in the same document flow, across text blocks and other media.
    while (media.parentElement !== el && media.parentElement?.parentElement !== el) {
      media.parentElement.after(media);
    }
    if (media.parentElement !== el) media.parentElement.after(media);
    const neighbor = direction < 0 ? media.previousSibling : media.nextSibling;
    if (!neighbor) return showToast(direction < 0 ? '媒体已在正文最前面' : '媒体已在正文最后面');
    if (direction < 0) neighbor.before(media); else neighbor.after(media);
    commitEditor();
  }
  async function insertFiles(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    // Validate the entire batch before editing existing content.
    const invalid = list.find(file => file.size > 5 * 1024 * 1024);
    if (invalid) return showToast(`${invalid.name} 超过 5MB，未插入；原正文已保留`);
    const unsupported = list.find(file => !/^(image|audio|video)\//.test(file.type));
    if (unsupported) return showToast('请选择图片、音频或视频；原正文已保留');
    const rows = await Promise.all(list.map(file => new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onerror = reject;
      reader.onload = () => resolve({ file, url: reader.result }); reader.readAsDataURL(file);
    })));
    focusRange();
    const markup = rows.map(({ file, url }) => {
      const tag = file.type.startsWith('image/') ? 'img' : file.type.startsWith('video/') ? 'video' : 'audio';
      return `<figure contenteditable="false" data-faq-media="${++mediaSequence}" data-bytes="${file.size}" data-name="${escapeHtml(file.name)}"><${tag} src="${escapeHtml(url)}" ${tag === 'img' ? 'alt="' + escapeHtml(file.name) + '"' : 'controls'}></${tag}><figcaption>${escapeHtml(file.name)}</figcaption></figure>`;
    }).join('');
    document.execCommand('insertHTML', false, markup + '<p><br></p>');
    rememberRange(); commitEditor(); showToast('媒体已插入当前光标位置');
  }
  renderManualForm = function () {
    const h5 = state.manualH5 || blank();
    return base.form() + `<div class="form-grid faq-h5-increment">
      <div class="field" id="faqH5SwitchField"><label class="check-row"><input id="faqH5Enabled" type="checkbox" ${h5.enabled ? 'checked' : ''} ${state.manualPdfHidden ? 'disabled' : ''}>启用 H5（可选增强）</label><div class="field-help">启用说明书入口后可配置 H5。PDF 仍必填；新版 APP 优先使用 H5，历史 APP 使用 PDF。</div></div>
      ${h5.enabled && !state.manualPdfHidden ? `<div class="field" id="faqH5ContentField"><label>H5 正文</label>
      <div class="faq-editor-shell"><div class="rich-text-toolbar faq-toolbar" role="toolbar" aria-label="H5 格式与媒体工具栏">
        <select id="faqBlockType" aria-label="段落格式"><option value="p">正文</option><option value="h2">标题</option></select>
        <button class="btn" type="button" data-faq-command="bold" aria-label="加粗"><b>B</b></button>
        <button class="btn" type="button" data-faq-command="italic" aria-label="斜体"><i>I</i></button>
        <button class="btn" type="button" data-faq-command="insertUnorderedList">无序列表</button>
        <button class="btn" type="button" data-faq-command="insertOrderedList">有序列表</button>
        <button class="btn" type="button" id="faqInsertMedia">插入媒体</button>
        <button class="btn" type="button" id="faqMediaBefore" aria-label="媒体前移">前移</button><button class="btn" type="button" id="faqMediaAfter" aria-label="媒体后移">后移</button><button class="btn text" type="button" id="faqDeleteMedia">删除媒体</button>
      </div><input id="faqMediaInput" type="file" accept="image/*,audio/*,video/*" multiple hidden>
      <div class="faq-rich-document" id="faqH5Editor" role="textbox" aria-label="H5 富文本正文" aria-multiline="true" contenteditable="true" spellcheck="false">${h5.html || '<p><br></p>'}</div>
      <div class="faq-editor-bottom"><span>纯文字最多 5000 字；单个媒体 ≤ 5MB</span><span id="faqTextCount">${textCount()} / 5000</span></div></div>
      <div class="field-help">在正文中定位光标后插入媒体。点击媒体后可前移、后移或删除。</div><div id="faqH5Errors" class="faq-error" role="status">${h5Issues().join(' ')}</div></div>` : ''}</div>`;
  };
  bindManualForm = function () {
    base.bind(); savedRange = null; selectedMedia = null;
    document.getElementById('faqH5Enabled')?.addEventListener('change', event => {
      state.manualH5.enabled = event.target.checked; setDirty(); renderAll();
    });
    const el = editor(); if (!el) return;
    el.addEventListener('input', () => { rememberRange(); commitEditor(); });
    el.addEventListener('keyup', rememberRange); el.addEventListener('mouseup', rememberRange);
    el.addEventListener('paste', event => { event.preventDefault(); document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); commitEditor(); });
    el.addEventListener('drop', event => { if (event.dataTransfer.files.length) { event.preventDefault(); showToast('请先定位光标，再通过工具栏插入媒体'); } });
    el.addEventListener('click', event => {
      el.querySelectorAll('.faq-selected').forEach(n => n.classList.remove('faq-selected'));
      selectedMedia = event.target.closest('figure'); if (selectedMedia) selectedMedia.classList.add('faq-selected');
      rememberRange();
    });
    document.querySelectorAll('.faq-toolbar button').forEach(button => button.addEventListener('mousedown', event => { event.preventDefault(); rememberRange(); }));
    document.querySelectorAll('[data-faq-command]').forEach(button => button.addEventListener('click', () => {
      focusRange(); document.execCommand(button.dataset.faqCommand, false); rememberRange(); commitEditor();
    }));
    document.getElementById('faqBlockType').addEventListener('mousedown', rememberRange);
    document.getElementById('faqBlockType').addEventListener('change', event => {
      focusRange(); document.execCommand('formatBlock', false, event.target.value); rememberRange(); commitEditor();
    });
    document.getElementById('faqInsertMedia').addEventListener('click', () => document.getElementById('faqMediaInput').click());
    document.getElementById('faqMediaInput').addEventListener('change', async event => {
      try { await insertFiles(event.target.files); } catch { showToast('媒体读取失败，原正文已保留，请重试'); } event.target.value = '';
    });
    document.getElementById('faqMediaBefore').addEventListener('click', () => moveMedia(-1));
    document.getElementById('faqMediaAfter').addEventListener('click', () => moveMedia(1));
    document.getElementById('faqDeleteMedia').addEventListener('click', () => {
      if (!selectedMedia) return showToast('先点击正文中需要删除的媒体'); selectedMedia.remove(); selectedMedia = null; savedRange = null; commitEditor();
    });
  };
  validateConfig = function () {
    return [...base.validate(), ...h5Issues().map(text => ({ level: '错误', type: 'danger', text }))];
  };
  captureV3Config = function () { return { ...base.capture(), manualH5: cloneV3(state.manualH5 || blank()) }; };
  restoreV3Config = function (config) { base.restore(config); state.manualH5 = cloneV3(config?.manualH5 || blank()); };
  renderManualPreview = function () {
    if (state.manualPdfHidden || reviewClient !== 'new' || !state.manualH5.enabled || h5Issues().length) return base.preview();
    return `<div class="phone-status"><span>9:41</span><span>Manual</span><span>100%</span></div><div class="phone-body"><div class="phone-nav-row"><span class="phone-back">‹</span><div class="phone-title">Manual</div><span></span></div><article class="faq-rendered-document">${state.manualH5.html}</article></div>`;
  };
  const faqNotes = [
    { id:'faq-pdf', target:'#manualPdfInput', title:'沿用 PDF 上传与入口', body:'功能提示：说明书入口展示时 PDF 必填，原有 10MB 限制继续生效。\n变更范围：在现有说明书面板增加 H5，不增页面导航、发布入口或独立版本。',loc:'说明书 PDF > PDF 上传' },
    { id:'faq-switch', target:'#faqH5SwitchField', title:'可选 H5 与发布生效', body:'功能提示：默认关闭；打开后显示富文本编辑器。关闭保留当前编辑内容，再开启可继续编辑。\n生效规则：编辑与保存草稿均不改变正式 APP；发布后才应用新的 H5 开关及内容。隐藏说明书入口时保留内容、停用编辑。',loc:'说明书 PDF > 启用 H5' },
    { id:'faq-format', target:'#faqH5ContentField', title:'格式与正文内媒体', body:'功能提示：正文、单级标题、加粗、斜体、有序列表、无序列表。媒体在光标处插入；选中后可调整正文内位置及删除。\n校验：可插入多个媒体；单个 ≤5MB，超限批次拒绝插入并保留正文。纯文字按Unicode码点计数，空格与显式换行各计1，CRLF归一为LF；表情按组成码点计。格式、媒体与资源名不计。5000允许，5001提示并阻断发布、不截断正文。5MB在原型中按5×1024×1024字节演示。超限或空H5可保存草稿、阻断发布。\n原型备注：工具栏样式、媒体格式支持和跨端排版由设计/前端/APP对齐；当前图片/音视频操作仅作交互演示。',loc:'说明书 PDF > H5 正文编辑器' },
    { id:'faq-preview', target:'#phonePreview', title:'内容与顺序预览', body:'功能提示：新版 APP 有有效 H5 时优先 H5；历史 APP 始终 PDF；无 H5 或整页失败用同一发布内容的 PDF。单媒体失败占位，其余正文保留。\n一致性：Web与APP的文字、格式语义、媒体和先后顺序一致，不要求字体、间距及换行像素相同。\n原型备注：左侧是当前编辑内容预览，以下选择器只用于评审，不是产品新增控件，也不代表真实APP联调。',loc:'说明书 PDF > 只读预览' }
  ];
  currentPrototypeAnnotations = function () {
    if (state.drawerOpen && state.layer === 'manual') return faqNotes.filter(n => n.id !== 'faq-format' || (state.manualH5.enabled && !state.manualPdfHidden));
    return []; // Context outside FAQ inherits baseline UI; no historical increments presented as this requirement.
  };
  renderPrototypeAnnotations = function () {
    base.annotations();
    const caption = document.getElementById('prototypeAnnotationContext');
    if (caption) caption.textContent = state.drawerOpen && state.layer === 'manual' ? 'FAQ H5 增量批注 · 黄色锚点为评审辅助。基线页面与整套配置生命周期沿用 V3.2。' : '本需求仅扩展「说明书 PDF」属性面板。当前画面沿用 V3.2；进入说明书面板查看 H5 增量。';
    if (!state.drawerOpen || state.layer !== 'manual' || !annotationPanelOpen) return;
    const list = document.getElementById('prototypeAnnotationList');
    list.insertAdjacentHTML('beforeend', `<section class="faq-review-controls"><strong>原型评审 · APP 兼容场景</strong><select id="faqReviewClient"><option value="new">新版 APP · H5 优先</option><option value="old">历史 APP · PDF</option><option value="fail">新版 APP · H5 整页失败</option><option value="mediaFail">新版 APP · 单媒体失败</option></select><p id="faqReviewResult"></p><small>仅切换演示场景，不写入产品配置。</small></section>`);
    const select = document.getElementById('faqReviewClient'); select.value = reviewClient;
    select.addEventListener('change', event => { reviewClient = event.target.value; renderPhonePreview(); updateReviewResult(); });
    updateReviewResult();
  };
  function updateReviewResult() {
    const output = document.getElementById('faqReviewResult'); if (!output) return;
    output.textContent = reviewClient === 'fail' ? '模拟：H5 整页失败 → PDF。' : reviewClient === 'old' ? '历史 APP 始终 PDF。' : state.manualH5.enabled && !h5Issues().length ? '当前预览：H5 正文。' : '当前预览：PDF；未启用或未完成 H5。';
    if (reviewClient === 'mediaFail' && state.manualH5.enabled && !h5Issues().length) {
      renderPhonePreview();
      const target = document.querySelector('#phonePreview .faq-rendered-document figure');
      if (target) { target.innerHTML = '<div class="faq-media-failed">媒体加载失败</div>'; output.textContent = '模拟：首个媒体失败；其余正文、格式及顺序保留。'; }
    }
  }
  // Review-only adapter handles single media failure without mutating editor content.
  const baselinePhone = renderPhonePreview;
  renderPhonePreview = function () {
    const original = reviewClient; if (reviewClient === 'mediaFail') reviewClient = 'new';
    baselinePhone(); reviewClient = original;
    if (original === 'mediaFail') {
      const target = document.querySelector('#phonePreview .faq-rendered-document figure');
      if (target) target.innerHTML = '<div class="faq-media-failed">媒体加载失败</div>';
    }
  };
  // Existing published sample remains PDF/hidden; H5 defaults absent in that snapshot.
  if (state.publishedConfigSnapshot) state.publishedConfigSnapshot.manualH5 = blank();
  renderAll();
})();
