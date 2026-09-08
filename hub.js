const STORAGE = {
  favorites: "prototype-hub:favorites",
  recent: "prototype-hub:recent"
};

const els = {
  entryTotal: document.querySelector("#entryTotal"),
  seriesTotal: document.querySelector("#seriesTotal"),
  search: document.querySelector("#searchInput"),
  productLines: document.querySelector("#productLines"),
  surface: document.querySelector("#surfaceFilter"),
  system: document.querySelector("#systemFilter"),
  status: document.querySelector("#statusFilter"),
  sort: document.querySelector("#sortSelect"),
  reset: document.querySelector("#resetFilters"),
  library: document.querySelector("#library"),
  summary: document.querySelector("#resultSummary"),
  generatedAt: document.querySelector("#generatedAt"),
  empty: document.querySelector("#emptyState"),
  error: document.querySelector("#errorState"),
  toast: document.querySelector("#toast"),
  viewButtons: [...document.querySelectorAll("[data-view]")]
};

const statusLabels = { active: "使用中", draft: "草稿", archived: "已归档" };
const systemLabels = { web: "Web", ios: "iOS", android: "Android", "mobile-common": "移动端通用" };
const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
const dateFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
const params = new URLSearchParams(location.search);

const state = {
  query: params.get("q") || "",
  productLine: params.get("productLine") || "all",
  surface: params.get("surface") || "all",
  system: params.get("system") || "all",
  status: params.get("status") || "all",
  sort: params.get("sort") || "updated-desc",
  view: params.get("view") || "all",
  expanded: new Set()
};

let catalog;
let series = [];
let favorites = new Set(readStorage(STORAGE.favorites, []));
let recent = readStorage(STORAGE.recent, []);
let toastTimer;

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is optional; the directory remains usable without it.
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function normalize(value = "") {
  return String(value).trim().toLocaleLowerCase("zh-CN");
}

function prototypeUrl(entry) {
  return `${catalog.basePath}${entry.path}`.replace(/\/{2,}/g, "/");
}

function absolutePrototypeUrl(entry) {
  return new URL(prototypeUrl(entry), location.origin).href;
}

function latestEntry(group) {
  return group.versions.find((entry) => entry.id === group.latestId) || group.versions[0];
}

function seriesSearchText(group) {
  return normalize(group.versions.flatMap((entry) => [
    entry.title,
    entry.summary,
    entry.productLine,
    entry.surface,
    entry.systems.join(" "),
    entry.seriesId,
    entry.version,
    entry.status,
    entry.tags.join(" "),
    entry.path
  ]).join(" "));
}

function syncUrl() {
  const next = new URLSearchParams();
  if (state.query) next.set("q", state.query);
  if (state.productLine !== "all") next.set("productLine", state.productLine);
  if (state.surface !== "all") next.set("surface", state.surface);
  if (state.system !== "all") next.set("system", state.system);
  if (state.status !== "all") next.set("status", state.status);
  if (state.sort !== "updated-desc") next.set("sort", state.sort);
  if (state.view !== "all") next.set("view", state.view);
  const query = next.toString();
  history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.hidden = false;
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 1800);
}

function recordRecent(entryId) {
  recent = [{ id: entryId, visitedAt: Date.now() }, ...recent.filter((item) => item.id !== entryId)].slice(0, 30);
  writeStorage(STORAGE.recent, recent);
}

async function copyLink(entry) {
  const url = absolutePrototypeUrl(entry);
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  showToast(`已复制 ${entry.version} 固定链接`);
}

function getFilteredSeries() {
  const query = normalize(state.query);
  const recentIndex = new Map(recent.map((item) => [item.id, item]));
  const filtered = series.filter((group) => {
    const latest = latestEntry(group);
    const isFavorite = favorites.has(group.seriesId);
    const hasRecent = group.versions.some((entry) => recentIndex.has(entry.id));
    if (state.view === "favorites" && !isFavorite) return false;
    if (state.view === "recent" && !hasRecent) return false;
    if (query && !seriesSearchText(group).includes(query)) return false;
    if (state.productLine !== "all" && !group.versions.some((entry) => entry.productLine === state.productLine)) return false;
    if (state.surface !== "all" && !group.versions.some((entry) => entry.surface === state.surface)) return false;
    if (state.system !== "all" && !group.versions.some((entry) => entry.systems.includes(state.system))) return false;
    if (state.status !== "all" && latest.status !== state.status) return false;
    return true;
  });

  const recentTime = (group) => Math.max(...group.versions.map((entry) => recentIndex.get(entry.id)?.visitedAt || 0));
  filtered.sort((a, b) => {
    const aLatest = latestEntry(a);
    const bLatest = latestEntry(b);
    if (state.view === "recent") return recentTime(b) - recentTime(a);
    if (state.sort === "updated-asc") return Date.parse(aLatest.updatedAt) - Date.parse(bLatest.updatedAt);
    if (state.sort === "title-asc") return collator.compare(aLatest.title, bLatest.title);
    if (state.sort === "versions-desc") return b.versions.length - a.versions.length || Date.parse(bLatest.updatedAt) - Date.parse(aLatest.updatedAt);
    return Date.parse(bLatest.updatedAt) - Date.parse(aLatest.updatedAt);
  });
  return filtered;
}

function renderProductLines() {
  const counts = new Map();
  for (const group of series) {
    for (const productLine of new Set(group.versions.map((entry) => entry.productLine))) {
      counts.set(productLine, (counts.get(productLine) || 0) + 1);
    }
  }
  const lines = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]))
    .map(([name, count]) => [name, name, count]);
  const buttons = [["all", "全部产品线", series.length], ...lines];
  els.productLines.innerHTML = buttons.map(([value, label, count]) => `
    <button type="button" data-product-line="${escapeHtml(value)}" aria-pressed="${state.productLine === value}">
      ${escapeHtml(label)} <span class="line-count">${count}</span>
    </button>
  `).join("");
}

function previewMarkup(entry) {
  if (entry.preview?.src) return `<img src="${escapeHtml(entry.preview.src)}" alt="${escapeHtml(entry.title)}预览" loading="lazy">`;
  return `<div class="preview-placeholder" aria-hidden="true">${entry.surface === "app" ? "APP" : "WEB"}</div>`;
}

function badgeMarkup(entry) {
  const system = entry.systems.map((item) => systemLabels[item] || item).join(" / ");
  const systemBadge = entry.systems.length === 1 && entry.systems[0] === "web"
    ? ""
    : `<span class="badge">${escapeHtml(system)}</span>`;
  return `
    <span class="badge surface">${entry.surface === "app" ? "APP" : "Web"}</span>
    ${systemBadge}
    <span class="badge ${escapeHtml(entry.status)}">${escapeHtml(statusLabels[entry.status] || entry.status)}</span>
  `;
}

function versionRows(group) {
  return group.versions.map((entry) => `
    <li class="version-row">
      <a class="version-link" href="${escapeHtml(prototypeUrl(entry))}" data-entry-id="${escapeHtml(entry.id)}">
        <span class="version-code">${escapeHtml(entry.version)}</span>
        <span class="version-path">${escapeHtml(entry.path)}</span>
      </a>
      <span class="version-date">${dateFormatter.format(new Date(entry.updatedAt))}</span>
      <button class="copy-button" type="button" data-action="copy" data-entry-id="${escapeHtml(entry.id)}">复制链接</button>
    </li>
  `).join("");
}

function cardMarkup(group) {
  const latest = latestEntry(group);
  const isFavorite = favorites.has(group.seriesId);
  const isExpanded = state.expanded.has(group.seriesId);
  const tags = latest.tags.slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  return `
    <article class="prototype-card" data-series-id="${escapeHtml(group.seriesId)}" data-surface="${escapeHtml(latest.surface)}">
      <div class="card-primary">
        <div class="preview-frame">${previewMarkup(latest)}</div>
        <div class="card-content">
          <div class="card-topline">
            <div class="badges"><span class="badge">${escapeHtml(latest.productLine)}</span>${badgeMarkup(latest)}</div>
            <button class="favorite-button" type="button" data-action="favorite" aria-pressed="${isFavorite}" aria-label="${isFavorite ? "取消收藏" : "收藏"}${escapeHtml(latest.title)}">
              ${isFavorite ? "已收藏" : "收藏"}
            </button>
          </div>
          <h3 class="prototype-title">${escapeHtml(latest.title)}</h3>
          <p class="prototype-summary">${escapeHtml(latest.summary)}</p>
          ${tags ? `<div class="tags">${tags}</div>` : ""}
          <div class="card-actions">
            <span class="updated">${dateFormatter.format(new Date(latest.updatedAt))} · ${escapeHtml(latest.lastPublisher)}</span>
            <a class="open-link" href="${escapeHtml(prototypeUrl(latest))}" data-entry-id="${escapeHtml(latest.id)}">打开 ${escapeHtml(latest.version)}</a>
          </div>
        </div>
      </div>
      <div class="version-area">
        <div class="version-heading">
          <span>${group.versions.length} 个固定版本 · ${escapeHtml(group.seriesId)}</span>
          <button class="version-toggle" type="button" data-action="versions" aria-expanded="${isExpanded}">${isExpanded ? "收起版本" : "查看版本"}</button>
        </div>
        <ul class="version-list" ${isExpanded ? "" : "hidden"}>${versionRows(group)}</ul>
      </div>
    </article>
  `;
}

function render() {
  syncUrl();
  renderProductLines();
  els.search.value = state.query;
  els.surface.value = state.surface;
  els.system.value = state.system;
  els.status.value = state.status;
  els.sort.value = state.sort;
  els.viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === state.view)));
  const filtered = getFilteredSeries();
  const versionCount = filtered.reduce((total, group) => total + group.versions.length, 0);
  els.summary.textContent = `${filtered.length} 个系列，${versionCount} 个固定版本`;
  els.library.innerHTML = filtered.map(cardMarkup).join("");
  els.library.hidden = filtered.length === 0;
  els.empty.hidden = filtered.length !== 0;
}

function clearFilters() {
  Object.assign(state, { query: "", productLine: "all", surface: "all", system: "all", status: "all", sort: "updated-desc", view: "all" });
  render();
}

function bindEvents() {
  els.search.addEventListener("input", () => { state.query = els.search.value.trim(); render(); });
  els.surface.addEventListener("change", () => { state.surface = els.surface.value; render(); });
  els.system.addEventListener("change", () => { state.system = els.system.value; render(); });
  els.status.addEventListener("change", () => { state.status = els.status.value; render(); });
  els.sort.addEventListener("change", () => { state.sort = els.sort.value; render(); });
  els.reset.addEventListener("click", clearFilters);
  els.viewButtons.forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; render(); }));
  els.productLines.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-line]");
    if (!button) return;
    state.productLine = button.dataset.productLine;
    render();
  });

  els.library.addEventListener("click", (event) => {
    const card = event.target.closest(".prototype-card");
    const action = event.target.closest("[data-action]");
    const link = event.target.closest("a[data-entry-id]");
    if (link) recordRecent(link.dataset.entryId);
    if (!card || !action) return;
    const group = series.find((item) => item.seriesId === card.dataset.seriesId);
    if (!group) return;
    if (action.dataset.action === "favorite") {
      if (favorites.has(group.seriesId)) favorites.delete(group.seriesId);
      else favorites.add(group.seriesId);
      writeStorage(STORAGE.favorites, [...favorites]);
      render();
    } else if (action.dataset.action === "versions") {
      if (state.expanded.has(group.seriesId)) state.expanded.delete(group.seriesId);
      else state.expanded.add(group.seriesId);
      render();
    } else if (action.dataset.action === "copy") {
      const entry = catalog.entries.find((item) => item.id === action.dataset.entryId);
      if (entry) copyLink(entry);
    }
  });

  els.empty.addEventListener("click", (event) => {
    if (event.target.closest('[data-action="clear-filters"]')) clearFilters();
  });
  document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement?.tagName || "";
    if (event.key === "/" && document.activeElement !== els.search && !/input|textarea|select/i.test(activeTag)) {
      event.preventDefault();
      els.search.focus();
    }
  });
}

async function init() {
  try {
    const response = await fetch("catalog.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    catalog = await response.json();
    series = catalog.series;
    els.entryTotal.textContent = catalog.entries.length;
    els.seriesTotal.textContent = catalog.series.length;
    els.generatedAt.textContent = `目录生成于 ${dateFormatter.format(new Date(catalog.generatedAt))}`;
    const systems = [...new Set(catalog.entries.flatMap((entry) => entry.systems))]
      .sort((a, b) => collator.compare(systemLabels[a] || a, systemLabels[b] || b));
    els.system.insertAdjacentHTML("beforeend", systems.map((system) => `<option value="${escapeHtml(system)}">${escapeHtml(systemLabels[system] || system)}</option>`).join(""));
    bindEvents();
    render();
  } catch (error) {
    console.error(error);
    els.library.hidden = true;
    els.empty.hidden = true;
    els.error.hidden = false;
    els.summary.textContent = "无法读取自动生成的 catalog.json";
  }
}

init();
