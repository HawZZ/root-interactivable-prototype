/* FAQ H5 increment. Base V3.2 product shell and lifecycle stay in index.html. */
(() => {
  // Prototype browser metadata: avoid an unrelated root favicon request.
  const faqIcon = document.createElement('link'); faqIcon.rel = 'icon'; faqIcon.href = 'data:,'; document.head.appendChild(faqIcon);
  const base = {
    form: renderManualForm, bind: bindManualForm, preview: renderManualPreview,
    validate: validateConfig, capture: captureV3Config, restore: restoreV3Config,
    annotations: renderPrototypeAnnotations
  };
  const blank = () => ({ enabled: false, html: '', htmlI18n: {} });
  let editingLocale = null;
  const editLocale = () => editingLocale || state.defaultLocale;
  const localeHtml = (locale = editLocale()) => locale === state.defaultLocale ? (state.manualH5?.html || '') : (state.manualH5?.htmlI18n?.[locale] || '');
  state.manualH5 = blank();
  let reviewClient = 'new';
  let savedRange = null;
  let selectedMedia = null;
  let mediaSequence = 0;
  // Local demo adapter: binary resources live in IndexedDB, never in H5/config JSON.
  // These stable same-origin references are resolved locally; production upload/CDN is a technical dependency.
  const resources = new Map();
  const cacheReady = new Promise((resolve, reject) => {
    const request = indexedDB.open('faq-h5-media-cache', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('media', { keyPath: 'url' });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('media').objectStore('media').getAll();
      read.onerror = () => reject(read.error);
      read.onsuccess = () => { read.result.forEach(item => resources.set(item.url, { ...item, displayUrl: URL.createObjectURL(item.blob) })); resolve(db); };
    };
  });
  cacheReady.catch(() => {}); // Upload reports cache failures and keeps the document unchanged.
  async function cacheFiles(files) {
    const db = await cacheReady;
    const rows = files.map(file => ({ url: new URL(`./faq-media/${crypto.randomUUID()}`, location.href).href, blob: file, size: file.size, type: file.type }));
    await new Promise((resolve, reject) => {
      const tx = db.transaction('media', 'readwrite');
      rows.forEach(row => tx.objectStore('media').put(row));
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
    rows.forEach(row => resources.set(row.url, { ...row, displayUrl: URL.createObjectURL(row.blob) }));
    return rows;
  }
  function canonicalMedia(node) {
    node.querySelectorAll('[data-faq-url]').forEach(media => { media.setAttribute('src', media.dataset.faqUrl); media.removeAttribute('data-faq-url'); });
    return node;
  }
  function displayHtml(html) {
    const node = contentDoc(html);
    node.querySelectorAll('img,video,audio').forEach(media => {
      const url = media.getAttribute('src'), resource = resources.get(url);
      if (!resource) { media.removeAttribute('src'); media.closest('figure')?.classList.add('faq-cache-missing'); return; }
      media.dataset.faqUrl = url; media.src = resource.displayUrl;
    });
    return node.innerHTML;
  }
  function mediaMarkup(resource, label) {
    const tag = resource.type.startsWith('image/') ? 'img' : resource.type.startsWith('video/') ? 'video' : 'audio';
    return `<figure contenteditable="false" data-faq-media="${++mediaSequence}"><${tag} src="${escapeHtml(resource.url)}" ${tag === 'img' ? `alt="${escapeHtml(label)}"` : 'controls'}></${tag}><figcaption>${escapeHtml(label)}</figcaption></figure>`;
  }
  function updateMediaDetails() {
    const panel = document.getElementById('faqMediaDetails'); if (!panel) return;
    const valid = selectedMedia && editor()?.contains(selectedMedia);
    panel.hidden = !valid;
    if (valid) {
      const media = selectedMedia.querySelector('img,video,audio');
      document.getElementById('faqMediaLabel').value = selectedMedia.querySelector('figcaption')?.textContent || media?.getAttribute('alt') || '';
      document.getElementById('faqMediaUrl').value = media?.dataset.faqUrl || media?.getAttribute('src') || '';
    }
  }
  const editor = () => document.getElementById('faqH5Editor');
  function contentDoc(html = localeHtml()) {
    // Parse in the inert template document so canonical cache URLs never trigger HTTP requests.
    const template = document.createElement('template'); template.innerHTML = '<div></div>';
    const node = template.content.firstElementChild; node.innerHTML = html; return node;
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
  function h5Issues(locale = editLocale()) {
    const h5 = state.manualH5 || blank();
    if (state.manualPdfHidden || !h5.enabled) return [];
    const html = localeHtml(locale);
    const node = contentDoc(html);
    const issues = [];
    // H5 is optional per language; an empty document uses that language's PDF.
    if (textCount(html) > 5000) issues.push('H5 纯文字超过 5000 字，请调整后发布。');
    if ([...node.querySelectorAll('figure')].some(n => Number(n.dataset.bytes) > 5 * 1024 * 1024)) issues.push('H5 存在超过 5MB 的媒体，请移除后重新插入。');
    return issues;
  }
  const hasH5 = locale => Boolean((contentDoc(localeHtml(locale)).textContent || '').trim() || contentDoc(localeHtml(locale)).querySelector('figure,img,video,audio'));
  const pdfAt = locale => locale === state.defaultLocale ? state.manualPdf : state.manualH5?.pdfByLocale?.[locale] || null;
  function cleanHtml() {
    const node = canonicalMedia(contentDoc(editor()?.innerHTML || ''));
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
    const html = cleanHtml();
    if (editLocale() === state.defaultLocale) state.manualH5.html = html;
    else { state.manualH5.htmlI18n ||= {}; state.manualH5.htmlI18n[editLocale()] = html; }
    setDirty(); refreshFeedback();
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
    const targetEditor = editor(), targetLocale = editLocale();
    const rows = await cacheFiles(list);
    if (editor() !== targetEditor || editLocale() !== targetLocale) return;
    focusRange();
    const markup = rows.map((row, index) => mediaMarkup(row, `媒体 ${mediaSequence + 1}`)).join('');
    document.execCommand('insertHTML', false, displayHtml(markup) + '<p><br></p>');
    rememberRange(); commitEditor(); showToast('媒体已插入当前光标位置');
  }
  renderManualForm = function () {
    const h5 = state.manualH5 || blank();
    return base.form() + `<div class="form-grid faq-h5-increment">
      <div class="field" id="faqH5SwitchField"><label class="check-row"><input id="faqH5Enabled" type="checkbox" ${h5.enabled ? 'checked' : ''} ${state.manualPdfHidden ? 'disabled' : ''}>启用 H5（可选增强）</label><div class="field-help">在此编辑英文 H5；其他语言在多语言 KV 表配置。PDF 仍必填；新版 APP 优先使用 H5，历史 APP 使用 PDF。</div></div>
      ${h5.enabled && !state.manualPdfHidden ? `<div class="field" id="faqH5ContentField"><label>H5 正文</label>
      <div class="faq-editor-shell"><div class="rich-text-toolbar faq-toolbar" role="toolbar" aria-label="H5 格式与媒体工具栏">
        <button class="btn" type="button" id="faqCodeMode" aria-pressed="false">HTML 代码</button><select id="faqBlockType" aria-label="段落格式"><option value="p">正文</option><option value="h2">标题</option></select>
        <button class="btn" type="button" data-faq-command="bold" aria-label="加粗"><b>B</b></button>
        <button class="btn" type="button" data-faq-command="italic" aria-label="斜体"><i>I</i></button>
        <button class="btn" type="button" data-faq-command="insertUnorderedList">无序列表</button>
        <button class="btn" type="button" data-faq-command="insertOrderedList">有序列表</button>
        <button class="btn" type="button" id="faqInsertMedia">插入媒体</button>
        <button class="btn" type="button" id="faqReplaceMedia">替换媒体</button><button class="btn" type="button" id="faqMediaBefore" aria-label="媒体前移">前移</button><button class="btn" type="button" id="faqMediaAfter" aria-label="媒体后移">后移</button><button class="btn text" type="button" id="faqDeleteMedia">删除媒体</button>
      </div><input id="faqMediaInput" type="file" accept="image/*,audio/*,video/*" multiple hidden>
      <input id="faqReplaceInput" type="file" accept="image/*,audio/*,video/*" hidden>
      <div class="faq-media-details" id="faqMediaDetails" hidden><label>媒体标记<input id="faqMediaLabel" type="text" maxlength="100" aria-label="媒体标记"></label><label>媒体 URL<input id="faqMediaUrl" type="text" readonly aria-label="媒体 URL"></label></div>
      <div class="faq-rich-document" id="faqH5Editor" role="textbox" aria-label="H5 富文本正文" aria-multiline="true" contenteditable="true" spellcheck="false">${displayHtml(localeHtml()) || '<p><br></p>'}</div>
      <textarea class="faq-code-editor" id="faqH5Source" aria-label="H5 HTML 代码" spellcheck="false" hidden></textarea><div class="faq-editor-bottom"><span>纯文字最多 5000 字；单个媒体 ≤ 5MB</span><span id="faqTextCount">${textCount()} / 5000</span></div></div>
      <div class="field-help">在正文中定位光标后插入媒体。新增媒体需上传；点击媒体可修改标记、查看 URL、替换、移动或删除。</div><div id="faqH5Errors" class="faq-error" role="status">${h5Issues().join(' ')}</div></div>` : ''}</div>`;
  };
  bindManualForm = function () {
    base.bind(); savedRange = null; selectedMedia = null;
    document.getElementById('faqH5Enabled')?.addEventListener('change', event => {
      state.manualH5.enabled = event.target.checked; setDirty(); renderAll();
    });
    const el = editor(); if (!el) return;
    bindCodeMode();
    el.addEventListener('input', () => { rememberRange(); commitEditor(); });
    el.addEventListener('keyup', rememberRange); el.addEventListener('mouseup', rememberRange);
    el.addEventListener('paste', event => { event.preventDefault(); document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); commitEditor(); });
    el.addEventListener('drop', event => { if (event.dataTransfer.files.length) { event.preventDefault(); showToast('请先定位光标，再通过工具栏插入媒体'); } });
    el.addEventListener('click', event => {
      el.querySelectorAll('.faq-selected').forEach(n => n.classList.remove('faq-selected'));
      selectedMedia = event.target.closest('figure'); if (selectedMedia) selectedMedia.classList.add('faq-selected');
      updateMediaDetails(); rememberRange();
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
    document.getElementById('faqMediaLabel').addEventListener('input', event => {
      if (!selectedMedia || !el.contains(selectedMedia)) return;
      let caption = selectedMedia.querySelector('figcaption');
      if (!caption) { caption = document.createElement('figcaption'); selectedMedia.appendChild(caption); }
      caption.textContent = event.target.value;
      selectedMedia.querySelector('img')?.setAttribute('alt', event.target.value); commitEditor();
    });
    document.getElementById('faqReplaceMedia').addEventListener('click', () => {
      if (!selectedMedia || !el.contains(selectedMedia)) return showToast('先点击正文中需要替换的媒体');
      document.getElementById('faqReplaceInput').click();
    });
    document.getElementById('faqReplaceInput').addEventListener('change', async event => {
      const file = event.target.files?.[0], target = selectedMedia; event.target.value = '';
      if (!file || !target || !el.contains(target)) return;
      if (file.size > 5 * 1024 * 1024 || !/^(image|audio|video)\//.test(file.type)) return showToast('请选择不超过 5MB 的图片、音频或视频；原媒体已保留');
      try {
        const [row] = await cacheFiles([file]);
        if (editor() !== el || !el.contains(target)) return;
        const temp = contentDoc(displayHtml(mediaMarkup(row, target.querySelector('figcaption')?.textContent || '媒体')));
        const replacement = temp.firstElementChild; target.replaceWith(replacement); selectedMedia = replacement; replacement.classList.add('faq-selected');
        savedRange = null; updateMediaDetails(); commitEditor(); showToast('媒体已替换，位置与标记保留');
      } catch { showToast('媒体上传失败，原媒体已保留，请重试'); }
    });
    document.getElementById('faqMediaBefore').addEventListener('click', () => moveMedia(-1));
    document.getElementById('faqMediaAfter').addEventListener('click', () => moveMedia(1));
    document.getElementById('faqDeleteMedia').addEventListener('click', () => {
      if (!selectedMedia) return showToast('先点击正文中需要删除的媒体'); selectedMedia.remove(); selectedMedia = null; savedRange = null; updateMediaDetails(); commitEditor();
    });
  };
  validateConfig = function () {
    return [...base.validate(), ...(!state.manualPdfHidden ? enabledKvLocales().filter(locale => !pdfAt(locale.code)).map(locale => ({level:'错误', type:'danger', text:`${locale.label} 说明书 PDF 必填，请上传 PDF（≤10MB）。`})) : []), ...enabledKvLocales().flatMap(locale => h5Issues(locale.code).map(text => ({ level: '错误', type: 'danger', text: `${locale.label} H5：${text}` })))];
  };
  captureV3Config = function () { return { ...base.capture(), manualH5: cloneV3(state.manualH5 || blank()) }; };
  restoreV3Config = function (config) { base.restore(config); state.manualH5 = cloneV3(config?.manualH5 || blank()); };
  renderManualPreview = function () {
    if (state.manualPdfHidden || reviewClient !== 'new' || !state.manualH5.enabled || !hasH5(state.activeLocale) || h5Issues(state.activeLocale).length) {
      const source = state.manualPdf; state.manualPdf = pdfAt(state.activeLocale);
      try { return base.preview(); } finally { state.manualPdf = source; }
    }
    return `<div class="phone-status"><span>9:41</span><span>Manual</span><span>100%</span></div><div class="phone-body"><div class="phone-nav-row"><span class="phone-back">‹</span><div class="phone-title">Manual</div><span></span></div><article class="faq-rendered-document">${displayHtml(localeHtml(state.activeLocale))}</article></div>`;
  };
  const faqNotes = [
    { id:'faq-pdf', target:'#manualPdfInput', title:'沿用 PDF 上传与入口', body:'功能提示：说明书入口展示时 PDF 必填，原有 10MB 限制继续生效。\n变更范围：在现有说明书面板增加 H5，不增页面导航、发布入口或独立版本。',loc:'说明书 PDF > PDF 上传' },
    { id:'faq-switch', target:'#faqH5SwitchField', title:'可选 H5 与发布生效', body:'功能提示：默认关闭；打开后显示富文本编辑器。关闭保留当前编辑内容，再开启可继续编辑。\n生效规则：编辑与保存草稿均不改变正式 APP；发布后才应用新的 H5 开关及内容。隐藏说明书入口时保留内容、停用编辑。',loc:'说明书 PDF > 启用 H5' },
    { id:'faq-format', target:'#faqH5ContentField', title:'格式与正文内媒体', body:'功能提示：正文、单级标题、加粗、斜体、有序列表、无序列表。媒体上传成功后以 URL 引用在光标处插入，不将文件二进制/Base64写入H5。选中后可修改标记、查看URL、上传替换、调整位置及删除；替换保留位置及标记，失败保留原媒体。多语言表摘要仅显示正文或媒体数量。导入及HTML代码不能新增未上传媒体，只保留已上传引用；新媒体需编辑器上传。\n校验：可插入多个媒体；单个 ≤5MB，超限批次拒绝插入并保留正文。纯文字按Unicode码点计数，空格与显式换行各计1，CRLF归一为LF；表情按组成码点计。格式、媒体与资源名不计。5000允许，5001提示并阻断发布、不截断正文。5MB在原型中按5×1024×1024字节演示。超限H5可保存草稿、阻断发布；空H5为选填，使用本语言PDF。支持可视化与HTML代码模式互切。\n原型备注：工具栏样式、媒体格式支持和跨端排版由设计/前端/APP对齐；当前通过浏览器IndexedDB缓存文件并解析本地引用URL，同浏览器同来源可恢复；清理缓存或跨浏览器需重新上传。正式上传、URL可访问性与生命周期由技术定义，原型不提供生产媒体服务。',loc:'说明书 PDF > H5 正文编辑器' },
    { id:'faq-preview', target:'#phonePreview', title:'内容与顺序预览', body:'功能提示：新版 APP 有有效 H5 时优先 H5；历史 APP 始终 PDF；无 H5 或整页失败用同一发布内容的 PDF。单媒体失败占位，其余正文保留。\n一致性：Web与APP的文字、格式语义、媒体和先后顺序一致，不要求字体、间距及换行像素相同。\n原型备注：左侧是当前编辑内容预览，以下选择器只用于评审，不是产品新增控件，也不代表真实APP联调。',loc:'说明书 PDF > 只读预览' }
  ];
  currentPrototypeAnnotations = function () {
    if (state.drawerOpen && state.layer === 'manual') return faqNotes.filter(n => n.id !== 'faq-format' || (state.manualH5.enabled && !state.manualPdfHidden));
    return []; // Context outside FAQ inherits baseline UI; no historical increments presented as this requirement.
  };
  renderPrototypeAnnotations = function () {
    base.annotations();
    const caption = document.getElementById('prototypeAnnotationContext');
    if (caption) caption.textContent = state.drawerOpen && state.layer === 'manual' ? 'FAQ H5 增量批注 · 黄色锚点为评审辅助。基线页面与整套配置生命周期沿用 V3.2。' : '沿用基线英文结构源与多语言 KV。H5 在英文源配置后，各启用语言在对应列编辑图文并通过预览样式核对。';
    if (!state.drawerOpen || state.layer !== 'manual' || !annotationPanelOpen) return;
    const list = document.getElementById('prototypeAnnotationList');
    list.insertAdjacentHTML('beforeend', `<section class="faq-review-controls"><strong>原型评审 · APP 兼容场景</strong><select id="faqReviewClient"><option value="new">新版 APP · H5 优先</option><option value="old">历史 APP · PDF</option><option value="fail">新版 APP · H5 整页失败</option><option value="mediaFail">新版 APP · 单媒体失败</option></select><p id="faqReviewResult"></p><small>仅切换演示场景，不写入产品配置。</small></section>`);
    const select = document.getElementById('faqReviewClient'); select.value = reviewClient;
    select.addEventListener('change', event => { reviewClient = event.target.value; renderPhonePreview(); updateReviewResult(); });
    updateReviewResult();
  };
  function updateReviewResult() {
    const output = document.getElementById('faqReviewResult'); if (!output) return;
    output.textContent = reviewClient === 'fail' ? '模拟：H5 整页失败 → PDF。' : reviewClient === 'old' ? '历史 APP 始终 PDF。' : state.manualH5.enabled && hasH5(state.activeLocale) && !h5Issues().length ? '当前预览：H5 正文。' : '当前预览：PDF；未启用或未完成 H5。';
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
  // Restore the baseline KV renderer shadowed by the later V3 saved-summary override.
  renderSavedEntryPreview = function() {
      const empty = $("#noviceEmptyState");
      const preview = $("#noviceConfigPreview");
      if (!empty || !preview) return;
      const status = currentLocaleStatus();
      const hasConfig = status.key !== "empty";
      empty.classList.toggle("hidden", hasConfig);
      preview.classList.toggle("hidden", !hasConfig);
      if (!hasConfig) {
        preview.innerHTML = "";
        return;
      }
      const meta = currentLocaleMeta();
      const hasDraft = Boolean(state.draftLocales[state.defaultLocale]);
      if (hasDraft && !state.validationRan) state.validationRan = true;
      const draftTag = hasDraft ? "warning" : "success";
      const draftLabel = hasDraft ? "有草稿" : "无草稿";
      const kvRows = buildKvRows();
      const textRows = kvRows.filter((row) => row.kind !== "media");
      const mediaRows = kvRows.filter((row) => row.kind === "media");
      const enabledLocales = enabledKvLocales();
      const issues = state.validationRan ? validateConfig() : [];
      const errors = issues.filter((issue) => issue.type === "danger").length;
      const warnings = issues.filter((issue) => issue.type === "warning").length;
      const validationTag = !state.validationRan
        ? `<span class="tag info">未运行</span>`
        : errors
          ? `<span class="tag danger">${errors} 个错误</span>`
          : warnings
            ? `<span class="tag warning">${warnings} 个警告</span>`
            : `<span class="tag success">通过</span>`;
      const validationBody = !state.validationRan
        ? `<div class="field-help">保存草稿或发布时会自动校验；发布校验不通过会阻断发布。</div>`
        : issues.length
          ? [...issues].sort((a, b) => (a.type === "danger" ? -1 : 1) - (b.type === "danger" ? -1 : 1)).slice(0, 5).map((issue) => `
            <div class="validation-item">
              <span class="tag ${issue.type}">${issue.level}</span>
              <span>${escapeHtml(issue.text)}</span>
            </div>
          `).join("")
          : `<div class="field-help">当前配置可发布。</div>`;
      preview.innerHTML = `
        <div class="saved-preview-head">
          <div>
            <div class="saved-preview-title">设备助手多语言 KV 配置</div>
            <div class="saved-preview-meta">英文结构源 / ${kvRows.length} 条 KV / ${enabledLocales.length} 个启用语言列 / Step list 可见项 ${visibleStepListItemCount()} / ${escapeHtml(meta.savedAt || "刚刚保存")}</div>
          </div>
          <span class="tag ${draftTag}">${draftLabel}</span>
        </div>
        <div class="kv-summary-grid">
          <div class="kv-summary-card"><span class="kv-summary-label">结构源</span><strong class="kv-summary-value">英文</strong></div>
          <div class="kv-summary-card"><span class="kv-summary-label">文本 / 媒体 Key</span><strong class="kv-summary-value">${textRows.length} / ${mediaRows.length}</strong></div>
          <div class="kv-summary-card"><span class="kv-summary-label">启用语言列</span><strong class="kv-summary-value">${enabledLocales.length}</strong></div>
        </div>
        <div class="kv-locale-panel">
          <div class="kv-locale-toolbar">
            <div>
              <strong>语言列管理</strong>
              <div class="field-help">启用语言后，发布前需要校验该语言所有文本和媒体 Key 是否配置完整。</div>
            </div>
            <button class="btn text" id="toggleLocalePanelBtn" type="button">${state.localePanelOpen ? "收起语言" : "展开语言"}</button>
          </div>
          <div id="localeTabs">
            ${state.localePanelOpen ? renderLocaleColumnControls() : `<div class="field-help">${enabledLocales.map((locale) => locale.label).join("、")}</div>`}
          </div>
        </div>
        <div class="kv-toolbar">
          <div>
            <div class="field-help">沿用基线 JSON 与 CSV/XLSX 导入导出。H5 值保留 HTML 标签、格式及已上传媒体 URL；回导恢复富文本。可先导入文字，再在对应语言编辑器上传媒体；导入不新增未上传媒体。资源引用校验与迁移由技术定义。</div>
            <div class="json-toolbar-note">H5 导出包含 HTML 与已上传媒体 URL，不含媒体文件。跨环境引用以技术方案为准；schemaVersion 不兼容时整包失败。</div>
          </div>
          <div class="kv-toolbar-actions">
            <button class="btn" id="exportConfigJsonBtn" type="button">导出 JSON</button>
            <label class="btn" for="importConfigJsonInput">导入 JSON</label>
            <input id="importConfigJsonInput" type="file" accept="application/json,.json" hidden>
            <button class="btn" id="exportKvCsvBtn" type="button">导出 CSV</button>
            <button class="btn" id="exportKvXlsxBtn" type="button">导出 XLSX</button>
            <label class="btn" for="importKvFileInput">导入 CSV/XLSX</label>
            <input id="importKvFileInput" type="file" accept=".csv,.xlsx,text/csv" hidden>
          </div>
        </div>
        ${renderKvTable(30)}
        <div class="validation-box" id="entryValidationBox">
          <div class="inspector-title-row">
            <strong>配置校验</strong>
            ${validationTag}
          </div>
          ${validationBody}
          ${state.validationRan && issues.length > 5 ? `<div class="field-help">还有 ${issues.length - 5} 条问题未展示。</div>` : ""}
        </div>
      `;
      bindKvTableInputs(preview);
      bindKvMediaControls(preview);
      bindKvPreviewControls(preview);
      bindLocaleColumnControls(preview);
      $("#toggleLocalePanelBtn")?.addEventListener("click", () => {
        state.localePanelOpen = !state.localePanelOpen;
        renderEntry();
      });
      $("#exportConfigJsonBtn")?.addEventListener("click", exportCurrentLocaleConfig);
      $("#importConfigJsonInput")?.addEventListener("change", (event) => importCurrentLocaleConfig(event.target.files?.[0]));
      $("#exportKvCsvBtn")?.addEventListener("click", () => exportKvText("csv"));
      $("#exportKvXlsxBtn")?.addEventListener("click", () => exportKvText("xlsx"));
      $("#importKvFileInput")?.addEventListener("change", (event) => importKvTextFile(event.target.files?.[0]));
      renderKvLocalePreviewModal();
    };
  // Extend the existing language table, retaining its English read-only column and locale management.
  const originalRows = buildKvRows;
  buildKvRows = function () {
    const rows = originalRows();
    if (!state.manualPdfHidden) rows.unshift({ key: 'manual.pdf', item: state.manualH5, field: 'faqPdf', label:'说明书 PDF（必填）', kind:'media', mediaType:'pdf', mediaIndex:0 });
    if (!state.manualPdfHidden && state.manualH5.enabled) rows.splice(1, 0, { key: 'manual.h5', item: state.manualH5, field: 'html', label: '说明书 H5 图文正文', kind: 'faq' });
    return rows;
  };
  const baselineKvTable = renderKvTable;
  renderKvTable = function(maxRows) {
    const node = document.createElement('div'); node.innerHTML = baselineKvTable(maxRows);
    node.querySelectorAll('tbody tr').forEach(row => {
      const cell=row.querySelector('td'), type=cell?.querySelector('.kv-row-type');
      if (type && cell.textContent.includes('manual.pdf')) type.textContent='PDF（必填）';
      if (type && cell.textContent.includes('manual.h5')) type.textContent='H5（选填）';
    });
    return node.innerHTML;
  };
  const originalCell = renderKvTextCell;
  renderKvTextCell = function(row, locale) {
    if (row.kind !== 'faq') return originalCell(row, locale);
    const html = localeHtml(locale.code);
    const node = contentDoc(html); const summary = plainH5(locale.code).trim();
    return `<td class="kv-value-cell"><strong>H5 富文本与媒体（选填）</strong><div class="faq-kv-summary">${escapeHtml(summary.slice(0, 90) || (node.querySelector('figure') ? `已配置 ${node.querySelectorAll('figure').length} 个媒体` : '未配置，使用本语言 PDF'))}</div>${locale.code === state.defaultLocale ? '<small>只读｜在“编辑英文结构源”中修改</small>' : `<button class="btn" type="button" data-faq-edit-locale="${escapeHtml(locale.code)}">编辑 H5</button>`}</td>`;
  };
  const originalCompleteness = validateEnabledKvCompleteness;
  validateEnabledKvCompleteness = function(issues) {
    const allRows = buildKvRows;
    buildKvRows = () => allRows().filter(row => row.kind !== 'faq');
    try { originalCompleteness(issues); } finally { buildKvRows = allRows; }
  };
  localeHasMissing = function(locale) {
    if (!enabledKvLocales().some(item => item.code === locale)) return false;
    return originalRows().some(row => row.kind === 'media' ? !kvMediaValueAt(row.item,row.field,locale,row.mediaIndex??0) : isRichTextField(row.item,row.field) ? !stripHtmlTags(richTextKvValue(row.item,row.field,locale)).trim() : !kvValue(row.item,row.field,locale).trim()) || (!state.manualPdfHidden && (!pdfAt(locale) || h5Issues(locale).length > 0));
  };
  const originalKvBind = bindKvTableInputs;
  bindKvTableInputs = function(root = document) {
    originalKvBind(root);
    root.querySelectorAll('[data-faq-edit-locale]').forEach(button => button.addEventListener('click', () => openLocaleEditor(button.dataset.faqEditLocale)));
  };
  // H5 export carries the full source document; table summaries remain plain text.
  const originalKvValue = kvValue;
  kvValue = (item, field, locale) => item === state.manualH5 && field === 'html' ? localeHtml(locale) : originalKvValue(item, field, locale);
  const originalRichValue = richTextKvValue, originalSetRichValue = setRichTextKvValue;
  richTextKvValue = (item, field, locale) => field === 'html' && item === state.manualH5 ? localeHtml(locale) : originalRichValue(item, field, locale);
  setRichTextKvValue = function(item, field, locale, value) {
    if (field !== 'html' || item !== state.manualH5) return originalSetRichValue(item, field, locale, value);
    if (locale === state.defaultLocale) item.html = value;
    else { item.htmlI18n ||= {}; item.htmlI18n[locale] = value; }
  };
  function closeLocaleEditor() {
    document.getElementById('faqLocaleModal')?.remove(); editingLocale = null; savedRange = null; selectedMedia = null; renderAll();
  }
  function openLocaleEditor(locale) {
    editingLocale = locale;
    document.querySelectorAll('.faq-h5-increment').forEach(node => node.remove());
    const temp = document.createElement('div'); temp.innerHTML = renderManualForm();
    const fields = temp.querySelector('.faq-h5-increment'); fields.querySelector('#faqH5SwitchField').remove();
    const modal = document.createElement('div'); modal.id = 'faqLocaleModal'; modal.className = 'faq-locale-overlay';
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', `${localeLabel(locale)} H5 编辑`);
    modal.innerHTML = `<section class="faq-locale-dialog"><header><h3>${escapeHtml(localeLabel(locale))} · H5 编辑</h3><button class="btn" id="faqLocaleClose">完成编辑</button></header><p>文字、格式与媒体位置仅修改当前语言。完成后按原流程保存草稿、发布。</p>${fields.outerHTML}</section>`;
    document.body.appendChild(modal); bindManualForm();
    modal.querySelector('#faqLocaleClose').onclick = closeLocaleEditor;
    modal.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); closeLocaleEditor(); } });
    editor().focus();
  }
  faqNotes.push({ id:'faq-language', target:'#noviceConfigPreview', title:'沿用基线多语言 KV', body:'功能提示：英文结构源编辑 H5，英文 KV 列只读。其他启用语言通过对应列“编辑 H5”配置文字、格式及正文内媒体，预览样式使用该语言内容。每语言纯文字最多5000字，单媒体≤5MB。每个启用语言的PDF必填（≤10MB），H5选填；空H5使用本语言PDF，已有H5超限则阻断发布。禁用语言保留内容但不阻断。\n保存与迁移：各语言内容随整套配置保存、发布和下架。CSV/XLSX与JSON的H5值导出完整HTML，保留标签、格式、媒体标记、已上传URL及顺序，不导出二进制/Base64。HTML回导还原对应语言富文本，不转义成可见标签；普通文字导入仍兼容。导入不新增未上传媒体，新增需编辑器上传。资源引用校验、跨环境迁移及异常处理由技术定义。原型备注：XLSX沿用基线分隔表格演示，不作为正式文件编码方案。', loc:'多语言 KV 表 > manual.h5' });
  const manualAnnotations = currentPrototypeAnnotations;
  currentPrototypeAnnotations = function() {
    if (!state.drawerOpen && !state.manualPdfHidden) return faqNotes.filter(n => n.id === 'faq-language');
    return manualAnnotations().filter(n => n.id !== 'faq-language');
  };
  function normalizeSource(html) {
    const template = document.createElement('template'); template.innerHTML = html;
    canonicalMedia(template.content);
    let rejected = false;
    template.content.querySelectorAll('img,video,audio,source').forEach(media => { if (!resources.has(media.getAttribute('src'))) { media.closest('figure')?.remove(); media.remove(); rejected = true; } });
    if (rejected) showToast('未导入未上传的媒体；请通过编辑器上传后插入，文本已保留');
    template.content.querySelectorAll('script,iframe,object,embed,link,meta').forEach(node => node.remove());
    template.content.querySelectorAll('*').forEach(node => [...node.attributes].forEach(attr => { if (/^on/i.test(attr.name) || /^(href|src)$/i.test(attr.name) && /^javascript:/i.test(attr.value.trim())) node.removeAttribute(attr.name); }));
    template.content.querySelectorAll('[srcset],[poster]').forEach(media => { media.removeAttribute('srcset'); media.removeAttribute('poster'); });
    template.content.querySelectorAll('img,video,audio').forEach(media => {
      if (!media.closest('figure')) { const figure = document.createElement('figure'); media.before(figure); figure.appendChild(media); }
    });
    template.content.querySelectorAll('figure').forEach(figure => { figure.contentEditable = 'false'; figure.dataset.faqMedia ||= String(++mediaSequence); });
    return template.innerHTML;
  }
  function bindCodeMode() {
    const source = document.getElementById('faqH5Source'), button = document.getElementById('faqCodeMode');
    let codeMode = false;
    source.addEventListener('input', () => { editor().innerHTML = displayHtml(normalizeSource(source.value)); savedRange = null; selectedMedia = null; commitEditor(); });
    button.addEventListener('click', () => {
      codeMode = !codeMode;
      if (codeMode) source.value = cleanHtml();
      else { editor().innerHTML = displayHtml(normalizeSource(source.value)); commitEditor(); }
      source.hidden = !codeMode; editor().hidden = codeMode;
      if (codeMode) { selectedMedia = null; updateMediaDetails(); }
      document.querySelectorAll('.faq-toolbar button:not(#faqCodeMode), .faq-toolbar select').forEach(control => control.disabled = codeMode);
      button.textContent = codeMode ? '可视化编辑' : 'HTML 代码'; button.setAttribute('aria-pressed', String(codeMode));
      (codeMode ? source : editor()).focus();
    });
  }
  const baselineMediaSource = kvMediaSource, baselineMediaAt = kvMediaValueAt, baselineMediaSet = setKvMediaValueAt;
  kvMediaSource = (item, field) => field === 'faqPdf' ? (state.manualPdf ? [state.manualPdf] : []) : baselineMediaSource(item,field);
  kvMediaValueAt = (item, field, locale, index) => field === 'faqPdf' ? pdfAt(locale) : baselineMediaAt(item,field,locale,index);
  setKvMediaValueAt = function(item, field, locale, index, resource) {
    if (field !== 'faqPdf') return baselineMediaSet(item,field,locale,index,resource);
    if (locale === state.defaultLocale) state.manualPdf = resource;
    else { state.manualH5.pdfByLocale ||= {}; state.manualH5.pdfByLocale[locale] = resource; }
  };
  const baselineMediaCell = renderKvMediaCell, baselineMediaBind = bindKvMediaControls;
  renderKvMediaCell = function(row, locale) {
    if (row.field !== 'faqPdf') return baselineMediaCell(row,locale);
    const resource = pdfAt(locale.code);
    return `<td class="kv-value-cell"><strong>PDF（必填）</strong><div class="faq-kv-summary">${escapeHtml(resourceName(resource,'未上传 PDF'))}</div>${locale.code === state.defaultLocale ? '<small>只读｜在“编辑英文结构源”中上传，≤10MB</small>' : `<input type="file" class="faq-pdf-file" accept="application/pdf,.pdf" data-faq-pdf-locale="${escapeHtml(locale.code)}" aria-label="${escapeHtml(locale.label)} PDF 上传"><small>仅PDF，≤10MB</small>`}</td>`;
  };
  bindKvMediaControls = function(root = document) {
    baselineMediaBind(root);
    root.querySelectorAll('[data-faq-pdf-locale]').forEach(input => input.addEventListener('change', () => {
      const file = input.files?.[0]; if (!file) return;
      const result = validateFile(file,['pdf'],10); if (!result.ok) { showToast(result.message); input.value = ''; return; }
      setKvMediaValueAt(state.manualH5,'faqPdf',input.dataset.faqPdfLocale,0,fileResource(file)); setDirty(); renderEntry();
    }));
  };
  function plainH5(locale) {
    const node = contentDoc(localeHtml(locale)); node.querySelectorAll('figure,img,audio,video').forEach(n=>n.remove());
    node.querySelectorAll('br').forEach(n=>n.replaceWith('\n')); node.querySelectorAll('p,div,h1,h2,h3,li').forEach(n=>n.append('\n'));
    return node.textContent.replace(/\n$/, '');
  }
  const baselineExportText = exportKvText;
  exportKvText = function(format) {
    if (!textKvRows().some(row => row.kind === 'faq')) return baselineExportText(format);
    const locales = enabledKvLocales().filter(locale => locale.code !== state.defaultLocale);
    const matrix = [['Key', ...locales.map(locale => locale.label)], ...textKvRows().map(row => [row.key, ...locales.map(locale => kvValue(row.item, row.field, locale.code))])];
    const cell = value => { const text = String(value ?? ''); return /[",\t\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text; };
    const blob = new Blob([matrix.map(row => row.map(cell).join(format === 'xlsx' ? '\t' : ',')).join('\n')], { type:format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `device-assistant-kv-text.${format}`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    showToast(`已导出 KV ${format.toUpperCase()}，H5 值包含 HTML 标签及已上传媒体 URL`);
  };
  const baselineImportText = importKvTextFile;
  importKvTextFile = function(file) {
    if (!file) return;
    if (!['csv','xlsx'].includes(file.name.split('.').pop()?.toLowerCase())) return baselineImportText(file);
    const reader = new FileReader(); reader.onload = async () => {
      await cacheReady.catch(() => {});
      const rows = parseDelimitedRows(String(reader.result||'')); const header = rows[0] || [];
      const keyIndex = header.findIndex(name=>name.trim().toLowerCase()==='key');
      if (keyIndex < 0) return baselineImportText(file);
      const h5Rows = rows.slice(1).filter(row=>row[keyIndex]==='manual.h5');
      h5Rows.forEach(row => header.forEach((name,index) => {
        const locale=state.locales.find(l=>(l.label===name.trim()||l.code===name.trim())&&l.code!==state.defaultLocale); if (!locale) return;
        const value = row[index] || '';
        const isHtml = [...contentDoc(value).querySelectorAll('*')].some(node => !(node instanceof HTMLUnknownElement));
        const media = [...contentDoc(localeHtml(locale.code)).querySelectorAll('figure')].map(n=>n.outerHTML).join('');
        state.manualH5.htmlI18n ||= {};
        state.manualH5.htmlI18n[locale.code] = isHtml ? normalizeSource(value) : (value ? `<p>${escapeHtml(value).replace(/\n/g,'<br>')}</p>` : '') + media;
        state.enabledKvLocales[locale.code]=true;
      }));
      if (h5Rows.length) state.manualH5.enabled=true;
      const filtered=[header,...rows.slice(1).filter(row=>row[keyIndex]!=='manual.h5')];
      const content=filtered.map(row=>row.map(csvEscape).join(',')).join('\n');
      baselineImportText(new File([content],file.name,{type:file.type}));
    }; reader.readAsText(file);
  };
  const baselineJsonImport = importCurrentLocaleConfig;
  importCurrentLocaleConfig = async function(file) {
    if (!file) return;
    try {
      await cacheReady;
      const payload = JSON.parse(await file.text());
      const h5 = payload.metadata?.manualH5;
      if (h5) { h5.html = normalizeSource(h5.html || ''); Object.keys(h5.htmlI18n || {}).forEach(locale => { h5.htmlI18n[locale] = normalizeSource(h5.htmlI18n[locale]); }); }
      (payload.kv || []).filter(row => row.key === 'manual.h5').forEach(row => Object.keys(row.values || {}).forEach(locale => { row.values[locale] = normalizeSource(row.values[locale]); }));
      baselineJsonImport(new File([JSON.stringify(payload)], file.name, {type:'application/json'}));
    } catch { showToast('导入失败：文件或本地媒体缓存不可用，原配置保留'); }
  };
  // Existing published sample remains PDF/hidden; H5 defaults absent in that snapshot.
  if (state.publishedConfigSnapshot) state.publishedConfigSnapshot.manualH5 = blank();
  renderAll();
  cacheReady.then(() => renderPreviewSurfaces()).catch(() => {});
})();
