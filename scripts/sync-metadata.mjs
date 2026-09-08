import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  buildMetadata,
  listPrototypeDirs,
  parseLegacyCards,
  validateMetadata
} from "./catalog-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const checkOnly = process.argv.includes("--check");
let legacyCards = new Map();

try {
  legacyCards = parseLegacyCards(await readFile(path.join(root, "index.html"), "utf8"));
} catch {
  legacyCards = new Map();
}

const dirs = await listPrototypeDirs(root);
const entries = [];
const stale = [];

for (const slug of dirs) {
  const metadata = await buildMetadata(root, slug, legacyCards);
  entries.push(metadata);
}

const seriesDefaults = new Map();
for (const entry of entries) {
  const current = seriesDefaults.get(entry.seriesId);
  const score = entry.tags.length * 10 + (entry.summary.endsWith("交互原型。") ? 0 : 1);
  if (!current || score > current.score) seriesDefaults.set(entry.seriesId, { entry, score });
}

for (const metadata of entries) {
  const sibling = seriesDefaults.get(metadata.seriesId)?.entry;
  if (sibling && metadata.tags.length === 0) metadata.tags = sibling.tags;
  if (sibling && metadata.summary.endsWith("交互原型。") && !sibling.summary.endsWith("交互原型。")) {
    metadata.summary = sibling.summary;
  }

  const slug = metadata.path.split("/").filter(Boolean).at(-1);
  const manifestPath = path.join(root, "prototypes", slug, "prototype.json");
  const serialized = `${JSON.stringify(metadata, null, 2)}\n`;

  if (checkOnly) {
    let current = "";
    try {
      current = await readFile(manifestPath, "utf8");
    } catch {
      // Missing manifests are reported as stale.
    }
    if (current !== serialized) stale.push(path.relative(root, manifestPath));
  } else {
    await writeFile(manifestPath, serialized);
  }
}

const errors = validateMetadata(entries);
if (errors.length) {
  console.error("Catalog metadata validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else if (stale.length) {
  console.error("Prototype metadata is missing or stale. Run npm run catalog:sync:");
  stale.forEach((file) => console.error(`- ${file}`));
  process.exitCode = 1;
} else {
  console.log(`${checkOnly ? "Validated" : "Synchronized"} ${entries.length} prototype manifests.`);
}
