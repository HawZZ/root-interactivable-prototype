import { execFileSync } from "node:child_process";
import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export const BASE_PATH = "/root-interactivable-prototype";
export const VALID_SURFACES = new Set(["web", "app"]);
export const VALID_SYSTEMS = new Set(["web", "ios", "android", "mobile-common"]);
export const VALID_STATUSES = new Set(["active", "draft", "archived"]);

const ENTITY_MAP = {
  "&amp;": "&",
  "&gt;": ">",
  "&lt;": "<",
  "&quot;": '"',
  "&#39;": "'"
};

export function decodeEntities(value = "") {
  return value.replace(/&(amp|gt|lt|quot|#39);/g, (match) => ENTITY_MAP[match] ?? match);
}

export function stripHtml(value = "") {
  return decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

export function normalizeVersion(value = "v1") {
  const clean = String(value).trim().toLowerCase().replace(/^version\s*/, "v");
  if (/^v\d+(?:\.\d+)*$/.test(clean)) return clean;
  if (/^\d+(?:\.\d+)*$/.test(clean)) return `v${clean}`;
  return clean || "v1";
}

export function inferSeriesVersion(slug, title = "") {
  const rules = [
    [/^(.*)-annotation-optimized-v(\d+(?:-\d+)*)$/i, 1, 2],
    [/^(official-rhythm-ceres-sync)-v(\d+(?:-\d+)*).*$/i, 1, 2]
  ];

  for (const [pattern, seriesIndex, versionIndex] of rules) {
    const match = slug.match(pattern);
    if (match) {
      return {
        seriesId: match[seriesIndex],
        version: normalizeVersion(match[versionIndex].replaceAll("-", "."))
      };
    }
  }

  const titleVersion = title.match(/(?:^|[\s·（(])V(\d+(?:\.\d+)*)/i)?.[1];
  return {
    seriesId: slug,
    version: normalizeVersion(titleVersion || "v1")
  };
}

export function inferSurface({ slug, title = "", kicker = "", html = "" }) {
  const declared = html.match(/<meta\s+name=["']prototype:surface["']\s+content=["']([^"']+)["']/i)?.[1];
  if (declared && VALID_SURFACES.has(declared.toLowerCase())) return declared.toLowerCase();
  const haystack = `${slug} ${title} ${kicker}`.toLowerCase();
  return /(^|\s)(app|ios|android|mobile)(\s|$)|设备共享/.test(haystack) ? "app" : "web";
}

export function inferProductLine({ kicker = "", title = "", search = "", surface = "web" }) {
  const haystack = `${kicker} ${title} ${search}`;
  if (/AIoT Platform/i.test(haystack)) return "AIoT Platform";
  if (/配置中心/.test(haystack)) return "配置中心";
  if (/IoT Admin/i.test(haystack)) return "IoT Admin";
  if (surface === "app" || /Momcozy/i.test(haystack)) return "Momcozy APP";
  return "未分类";
}

export function inferStatus(slug) {
  return /(?:^|-)draft(?:-|$)/i.test(slug) ? "draft" : "active";
}

function readMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const direct = new RegExp(`<meta\\s+[^>]*name=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i");
  const reverse = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*name=["']${escaped}["'][^>]*>`, "i");
  return decodeEntities(html.match(direct)?.[1] ?? html.match(reverse)?.[1] ?? "").trim();
}

export function extractHtmlMetadata(html, slug) {
  const title = stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const heading = stripHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const description = readMeta(html, "description");
  const keywords = readMeta(html, "keywords")
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const declaredProductLine = readMeta(html, "prototype:product-line");
  const declaredSystems = readMeta(html, "prototype:systems")
    .split(/[,，]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const invalidTemplate = (value) => !value || /{{[^}]+}}/.test(value);
  return {
    title: invalidTemplate(title) ? (invalidTemplate(heading) ? slug : heading) : title,
    summary: invalidTemplate(description) ? "" : description,
    keywords,
    declaredProductLine: invalidTemplate(declaredProductLine) ? "" : declaredProductLine,
    declaredSystems
  };
}

export function parseLegacyCards(html) {
  const cards = new Map();
  const pattern = /<a\s+class=["']prototype["'][^>]*href=["']prototypes\/([^/]+)\/["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const [whole, slug, body] = match;
    const search = decodeEntities(whole.match(/data-search=["']([^"']*)["']/i)?.[1] ?? "");
    const kicker = stripHtml(body.match(/class=["']prototype-kicker["'][^>]*>([\s\S]*?)<\//i)?.[1] ?? "");
    const title = stripHtml(body.match(/class=["']prototype-title["'][^>]*>([\s\S]*?)<\//i)?.[1] ?? "");
    const summary = stripHtml(body.match(/class=["']prototype-copy["'][^>]*>([\s\S]*?)<\//i)?.[1] ?? "");
    const tags = [...body.matchAll(/class=["']tag["'][^>]*>([\s\S]*?)<\//gi)]
      .map((tag) => stripHtml(tag[1]))
      .filter(Boolean);
    cards.set(slug, { search, kicker, title, summary, tags });
  }
  return cards;
}

export function gitMetadata(root, relativeDir) {
  try {
    const output = execFileSync(
      "git",
      ["log", "-1", "--format=%aI%x09%an", "--", relativeDir, `:(exclude)${relativeDir}/prototype.json`],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();
    if (output) {
      const [updatedAt, ...publisherParts] = output.split("\t");
      return { updatedAt, lastPublisher: publisherParts.join("\t") || "待确认" };
    }
  } catch {
    // Fall back to file metadata for uncommitted prototypes.
  }
  return null;
}

export async function listPrototypeDirs(root) {
  const prototypesDir = path.join(root, "prototypes");
  const entries = await readdir(prototypesDir, { withFileTypes: true });
  const dirs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(prototypesDir, entry.name, "index.html");
    try {
      await access(indexPath);
      dirs.push(entry.name);
    } catch {
      // Ignore untracked or intentionally empty directories.
    }
  }
  return dirs.sort();
}

export async function buildMetadata(root, slug, legacyCards = new Map()) {
  const relativeDir = path.posix.join("prototypes", slug);
  const dir = path.join(root, relativeDir);
  const manifestPath = path.join(dir, "prototype.json");
  const htmlPath = path.join(dir, "index.html");
  const html = await readFile(htmlPath, "utf8");
  const extracted = extractHtmlMetadata(html, slug);
  const legacy = legacyCards.get(slug) ?? {};

  let existing = {};
  try {
    existing = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    existing = {};
  }

  const title = existing.title || legacy.title || extracted.title || slug;
  const inferredSeries = inferSeriesVersion(slug, `${title} ${legacy.kicker || ""} ${extracted.title || ""}`);
  const surface = existing.surface || inferSurface({ slug, title, kicker: legacy.kicker, html });
  const gitInfo = gitMetadata(root, relativeDir);
  const htmlStats = await stat(htmlPath);
  const summary = existing.summary || legacy.summary || extracted.summary || `${title}交互原型。`;
  const productLine = existing.productLine || extracted.declaredProductLine || inferProductLine({
    kicker: legacy.kicker,
    title,
    search: legacy.search,
    surface
  });
  const tags = [...new Set(existing.tags || legacy.tags || extracted.keywords || [])].filter(Boolean).slice(0, 8);
  const systems = existing.systems || extracted.declaredSystems.length
    ? (existing.systems || extracted.declaredSystems)
    : surface === "app" ? ["mobile-common"] : ["web"];

  return {
    id: existing.id || slug,
    path: `/prototypes/${slug}/`,
    title,
    summary,
    productLine,
    surface,
    systems,
    seriesId: existing.seriesId || inferredSeries.seriesId,
    version: normalizeVersion(existing.version || inferredSeries.version),
    status: existing.status || inferStatus(slug),
    tags,
    updatedAt: gitInfo?.updatedAt || htmlStats.mtime.toISOString(),
    lastPublisher: gitInfo?.lastPublisher || process.env.GIT_AUTHOR_NAME || "待确认",
    preview: {
      mode: existing.preview?.mode || "auto",
      ...(existing.preview?.path ? { path: existing.preview.path } : {}),
      ...(existing.preview?.route ? { route: existing.preview.route } : {}),
      ...(existing.preview?.waitFor ? { waitFor: existing.preview.waitFor } : {}),
      ...(Number.isFinite(existing.preview?.delayMs) ? { delayMs: existing.preview.delayMs } : {})
    }
  };
}

export function validateMetadata(entries) {
  const errors = [];
  const ids = new Set();
  const paths = new Set();
  const versions = new Set();

  for (const entry of entries) {
    const prefix = entry.path || entry.id || "unknown";
    if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.id)) errors.push(`${prefix}: invalid id`);
    if (!/^\/prototypes\/[a-z0-9][a-z0-9-]*\/$/.test(entry.path)) errors.push(`${prefix}: invalid permanent path`);
    if (!entry.title?.trim()) errors.push(`${prefix}: missing title`);
    if (!entry.summary?.trim()) errors.push(`${prefix}: missing summary`);
    if (!entry.productLine?.trim()) errors.push(`${prefix}: missing productLine`);
    if (!VALID_SURFACES.has(entry.surface)) errors.push(`${prefix}: invalid surface`);
    if (!Array.isArray(entry.systems) || entry.systems.length === 0 || entry.systems.some((item) => !VALID_SYSTEMS.has(item))) {
      errors.push(`${prefix}: invalid systems`);
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.seriesId)) errors.push(`${prefix}: invalid seriesId`);
    if (!/^v\d+(?:\.\d+)*$/.test(entry.version)) errors.push(`${prefix}: invalid version`);
    if (!VALID_STATUSES.has(entry.status)) errors.push(`${prefix}: invalid status`);
    if (!Number.isFinite(Date.parse(entry.updatedAt))) errors.push(`${prefix}: invalid updatedAt`);
    if (!entry.lastPublisher?.trim()) errors.push(`${prefix}: missing lastPublisher`);
    if (!Array.isArray(entry.tags)) errors.push(`${prefix}: tags must be an array`);
    if (!entry.preview || !["auto", "manual", "none"].includes(entry.preview.mode)) errors.push(`${prefix}: invalid preview mode`);
    if (entry.preview?.mode === "manual" && !entry.preview.path) errors.push(`${prefix}: manual preview requires path`);
    if (ids.has(entry.id)) errors.push(`${prefix}: duplicate id ${entry.id}`);
    if (paths.has(entry.path)) errors.push(`${prefix}: duplicate path ${entry.path}`);
    const versionKey = `${entry.seriesId}:${entry.version}`;
    if (versions.has(versionKey)) errors.push(`${prefix}: duplicate series version ${versionKey}`);
    ids.add(entry.id);
    paths.add(entry.path);
    versions.add(versionKey);
  }

  return errors;
}

export function compareVersions(a, b) {
  const left = normalizeVersion(a).slice(1).split(".").map(Number);
  const right = normalizeVersion(b).slice(1).split(".").map(Number);
  const max = Math.max(left.length, right.length);
  for (let index = 0; index < max; index += 1) {
    const diff = (right[index] || 0) - (left[index] || 0);
    if (diff) return diff;
  }
  return 0;
}

export function createCatalog(entries) {
  const sorted = [...entries].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const seriesMap = new Map();
  for (const entry of sorted) {
    const group = seriesMap.get(entry.seriesId) || [];
    group.push(entry);
    seriesMap.set(entry.seriesId, group);
  }

  const series = [...seriesMap.entries()].map(([seriesId, versions]) => {
    versions.sort((a, b) => compareVersions(a.version, b.version) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const latest = [...versions].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
    return { seriesId, latestId: latest.id, versions };
  }).sort((a, b) => {
    const aLatest = a.versions.find((item) => item.id === a.latestId);
    const bLatest = b.versions.find((item) => item.id === b.latestId);
    return Date.parse(bLatest.updatedAt) - Date.parse(aLatest.updatedAt);
  });

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repository: "https://github.com/HawZZ/root-interactivable-prototype",
    basePath: BASE_PATH,
    entries: sorted,
    series
  };
}
