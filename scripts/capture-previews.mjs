import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { BASE_PATH } from "./catalog-lib.mjs";
import { startStaticServer } from "./static-server.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const catalogPath = path.join(dist, "catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const previewDir = path.join(dist, "previews");
await mkdir(previewDir, { recursive: true });

const { origin, close } = await startStaticServer(dist);
const browser = await chromium.launch({ headless: true });
const warnings = [];

try {
  for (const entry of catalog.entries) {
    if (entry.preview.mode === "none") continue;
    if (entry.preview.mode === "manual") {
      const manualPath = path.join(dist, entry.preview.path.replace(/^\/+/, ""));
      try {
        await access(manualPath);
        entry.preview.src = entry.preview.path.replace(/^\/+/, "");
      } catch {
        warnings.push(`${entry.id}: manual preview not found at ${entry.preview.path}`);
      }
      continue;
    }

    const isApp = entry.surface === "app";
    const context = await browser.newContext({
      viewport: isApp ? { width: 430, height: 880 } : { width: 1440, height: 900 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    const outputName = `${entry.id}.jpg`;
    const outputPath = path.join(previewDir, outputName);
    const route = entry.preview.route || entry.path;

    try {
      await page.goto(`${origin}${BASE_PATH}${route}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.locator(entry.preview.waitFor || "body").first().waitFor({ state: "visible", timeout: 8000 });
      await page.waitForTimeout(Number.isFinite(entry.preview.delayMs) ? entry.preview.delayMs : 650);
      await page.screenshot({ path: outputPath, type: "jpeg", quality: 76, fullPage: false });
      entry.preview.src = `previews/${outputName}`;
    } catch (error) {
      warnings.push(`${entry.id}: ${error.message.split("\n")[0]}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await close();
}

const previewById = new Map(catalog.entries.map((entry) => [entry.id, entry.preview]));
for (const group of catalog.series) {
  for (const entry of group.versions) entry.preview = previewById.get(entry.id) || entry.preview;
}
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
warnings.forEach((warning) => console.warn(`Preview warning: ${warning}`));
console.log(`Generated ${catalog.entries.filter((entry) => entry.preview.src).length} previews with ${warnings.length} warnings.`);
