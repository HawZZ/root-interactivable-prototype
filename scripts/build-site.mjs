import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildMetadata,
  createCatalog,
  listPrototypeDirs,
  validateMetadata
} from "./catalog-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const dirs = await listPrototypeDirs(root);
const entries = [];
for (const slug of dirs) entries.push(await buildMetadata(root, slug));

const errors = validateMetadata(entries);
if (errors.length) {
  console.error("Cannot build an invalid catalog:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

for (const file of ["index.html", "hub.css", "hub.js", ".nojekyll"]) {
  await cp(path.join(root, file), path.join(dist, file));
}
await cp(path.join(root, "prototypes"), path.join(dist, "prototypes"), {
  recursive: true,
  filter: (source) => !source.includes(`${path.sep}.git${path.sep}`)
});

const catalog = createCatalog(entries);
await writeFile(path.join(dist, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Built ${catalog.entries.length} prototype entries in ${catalog.series.length} series.`);
