import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import { BASE_PATH } from "../scripts/catalog-lib.mjs";
import { startStaticServer } from "../scripts/static-server.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");

test("hub search, filters, versions, favorites and URL state work", async () => {
  const server = await startStaticServer(dist);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ["clipboard-read", "clipboard-write"]
  });
  const page = await context.newPage();

  try {
    await page.goto(`${server.origin}${BASE_PATH}/`, { waitUntil: "networkidle" });
    await page.locator(".prototype-card").first().waitFor({ state: "visible" });
    assert.equal(await page.locator("#entryTotal").innerText(), "24");
    assert.equal(await page.locator("#seriesTotal").innerText(), "20");
    assert.equal(await page.getByText("undefined", { exact: true }).count(), 0);
    assert.ok(await page.locator(".preview-frame img").count() > 0);

    await page.locator("#searchInput").fill("设备共享");
    assert.equal(await page.locator(".prototype-card").count(), 1);
    assert.equal(await page.locator('.prototype-card[data-surface="app"]').count(), 1);
    assert.match(page.url(), /q=%E8%AE%BE%E5%A4%87%E5%85%B1%E4%BA%AB/);

    await page.locator("#resetFilters").click();
    await page.locator('[data-product-line="IoT Admin"]').click();
    assert.ok(await page.locator(".prototype-card").count() > 1);
    assert.match(page.url(), /productLine=IoT\+Admin/);

    await page.locator("#resetFilters").click();
    await page.locator("#searchInput").fill("device-assistant-cloud-config");
    const seriesCard = page.locator('[data-series-id="device-assistant-cloud-config"]');
    await seriesCard.locator('[data-action="versions"]').click();
    assert.equal(await seriesCard.locator(".version-row").count(), 3);
    assert.deepEqual(await seriesCard.locator(".version-link").evaluateAll((links) => links.map((link) => link.getAttribute("href"))), [
      `${BASE_PATH}/prototypes/device-assistant-cloud-config-annotation-optimized-v3/`,
      `${BASE_PATH}/prototypes/device-assistant-cloud-config-annotation-optimized-v2/`,
      `${BASE_PATH}/prototypes/device-assistant-cloud-config/`
    ]);

    await seriesCard.locator('[data-action="copy"]').first().click();
    await page.locator("#toast").waitFor({ state: "visible" });
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /device-assistant-cloud-config-annotation-optimized-v3\/$/);

    await seriesCard.locator('[data-action="favorite"]').click();
    await page.locator('[data-view="favorites"]').click();
    assert.equal(await page.locator(".prototype-card").count(), 1);
  } finally {
    await context.close();
    await browser.close();
    await server.close();
  }
});

test("hub has no horizontal overflow across required viewports", async () => {
  const server = await startStaticServer(dist);
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 844, height: 390 }
  ];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.goto(`${server.origin}${BASE_PATH}/`, { waitUntil: "networkidle" });
      await page.locator(".prototype-card").first().waitFor({ state: "visible" });
      const metrics = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        document: document.documentElement.scrollWidth,
        viewport: window.innerWidth
      }));
      assert.ok(metrics.body <= metrics.viewport, `body overflow at ${viewport.width}x${viewport.height}`);
      assert.ok(metrics.document <= metrics.viewport, `document overflow at ${viewport.width}x${viewport.height}`);
      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
});
