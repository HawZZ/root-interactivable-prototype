import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { BASE_PATH } from "./catalog-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const catalog = JSON.parse(await readFile(path.join(dist, "catalog.json"), "utf8"));
const errors = [];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

for (const entry of catalog.entries) {
  const route = path.join(dist, entry.path.replace(/^\/+/, ""), "index.html");
  if (!(await exists(route))) errors.push(`${entry.path}: missing index.html`);
  if (entry.preview.mode === "manual" && entry.preview.path) {
    const preview = path.join(dist, entry.preview.path.replace(/^\/+/, ""));
    if (!(await exists(preview))) errors.push(`${entry.id}: missing manual preview ${entry.preview.path}`);
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.name.endsWith(".html")) files.push(target);
  }
  return files;
}

const htmlFiles = await walk(dist);
for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, "utf8");
  const attributes = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const value of attributes) {
    if (!value || /^(?:https?:|data:|blob:|mailto:|tel:|javascript:|#)/i.test(value) || /{{[^}]+}}|\$\{[^}]+}/.test(value)) continue;
    const clean = value.split(/[?#]/)[0];
    let target;
    if (clean.startsWith(`${BASE_PATH}/`)) target = path.join(dist, clean.slice(BASE_PATH.length + 1));
    else if (clean.startsWith("/")) continue;
    else target = path.resolve(path.dirname(htmlPath), clean);
    if (clean.endsWith("/")) target = path.join(target, "index.html");
    if (!(await exists(target))) errors.push(`${path.relative(dist, htmlPath)}: broken local reference ${value}`);
  }
}

if (errors.length) {
  console.error("Link validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${catalog.entries.length} prototype routes and ${htmlFiles.length} HTML files.`);
}
