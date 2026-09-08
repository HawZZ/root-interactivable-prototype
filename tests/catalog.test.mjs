import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  buildMetadata,
  createCatalog,
  inferProductLine,
  inferSeriesVersion,
  inferSurface,
  listPrototypeDirs,
  parseLegacyCards,
  validateMetadata
} from "../scripts/catalog-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("infers known series and semantic versions", () => {
  assert.deepEqual(inferSeriesVersion("device-assistant-cloud-config-annotation-optimized-v3", ""), {
    seriesId: "device-assistant-cloud-config",
    version: "v3"
  });
  assert.deepEqual(inferSeriesVersion("official-rhythm-ceres-sync-v2-1-1-draft-whitelist-preview", ""), {
    seriesId: "official-rhythm-ceres-sync",
    version: "v2.1.1"
  });
  assert.deepEqual(inferSeriesVersion("message-push-trigger-opt", "IoT Admin · 消息推送 V3.8"), {
    seriesId: "message-push-trigger-opt",
    version: "v3.8"
  });
});

test("infers APP and product-line metadata without treating platform as the primary taxonomy", () => {
  const surface = inferSurface({ slug: "device-sharing", title: "设备共享原型", kicker: "APP · V1.0", html: "" });
  assert.equal(surface, "app");
  assert.equal(inferProductLine({ kicker: "APP · V1.0", title: "设备共享原型", search: "", surface }), "Momcozy APP");
  assert.equal(inferSurface({ slug: "iot-admin-audit-log", title: "审计日志", kicker: "IoT Admin", html: "" }), "web");
  assert.equal(inferSurface({ slug: "work-order-management", title: "工单管理", kicker: "IoT Admin", html: "" }), "web");
});

test("parses legacy cards for one-time metadata migration", () => {
  const cards = parseLegacyCards(`
    <a class="prototype" href="prototypes/sample/" data-search="sample 示例">
      <p class="prototype-kicker">IoT Admin</p>
      <h3 class="prototype-title">示例原型</h3>
      <p class="prototype-copy">示例说明。</p>
      <span class="tag">示例</span>
    </a>`);
  assert.deepEqual(cards.get("sample"), {
    search: "sample 示例",
    kicker: "IoT Admin",
    title: "示例原型",
    summary: "示例说明。",
    tags: ["示例"]
  });
});

test("preserves every route present at the September 8, 2026 migration baseline", async () => {
  const baseline = JSON.parse(await readFile(path.join(root, "tests", "baseline-routes.json"), "utf8"));
  const dirs = await listPrototypeDirs(root);
  const entries = [];
  for (const slug of dirs) entries.push(await buildMetadata(root, slug));
  assert.deepEqual(validateMetadata(entries), []);
  const paths = new Set(entries.map((entry) => entry.path));
  baseline.forEach((route) => assert.ok(paths.has(route), `Missing permanent route ${route}`));

  const catalog = createCatalog(entries);
  const deviceAssistant = catalog.series.find((group) => group.seriesId === "device-assistant-cloud-config");
  assert.deepEqual(deviceAssistant.versions.map((entry) => entry.version), ["v3", "v2", "v1"]);
  assert.equal(catalog.entries.find((entry) => entry.id === "device-sharing").surface, "app");
});
