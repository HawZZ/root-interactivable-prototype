# Root Interactivable Prototype

Static Web and APP prototype directory published with GitHub Pages.

Site: https://hawzz.github.io/root-interactivable-prototype/

## Permanent routes

Every prototype keeps an independent route:

```text
/prototypes/{prototype-name}/
```

The hub may group several versions into one series, but it never redirects,
renames, or replaces an existing prototype route. PRDs can continue linking to
the exact version they require.

## Publishing a prototype

1. Copy the standalone build into `prototypes/{prototype-name}/`.
2. Run `npm run catalog:sync` to create or refresh `prototype.json`.
3. Run `npm run verify`.
4. Commit the prototype, generated metadata, and any hub changes together.

The publishing command derives paths, timestamps, and the most recent
publisher from Git. It also infers title, product line, business area, surface,
systems, series, version, status, and tags from the page and directory name.
Ambiguous values are recorded as `未分类` instead of being guessed.

`IoT Admin`, `AIoT Platform`, and `配置中心` are business areas within the
`IoT Admin` Web product line. The hub keeps them available as a secondary
filter instead of presenting them as separate product lines.

For reliable automatic classification, prototypes may expose these HTML meta
tags:

```html
<meta name="description" content="Short prototype summary">
<meta name="keywords" content="tag one, tag two">
<meta name="prototype:product-line" content="IoT Admin">
<meta name="prototype:business-area" content="配置中心">
<meta name="prototype:surface" content="app">
<meta name="prototype:systems" content="ios, android">
```

`prototype.json` is maintained by the publishing tool. Existing semantic
values are preserved while derived Git fields are refreshed.

## Preview configuration

The default manifest setting captures the first viewport automatically:

```json
{
  "preview": {
    "mode": "auto"
  }
}
```

Optional fields are `route`, `waitFor`, and `delayMs`. Use `mode: "manual"`
with `path` for a checked-in image, or `mode: "none"` to show the generated
placeholder. Preview failures produce a build warning and do not remove the
prototype from the catalog.

## Commands

- `npm run catalog:sync`: create or update per-directory manifests.
- `npm run catalog:check`: fail when manifests are missing, stale, or invalid.
- `npm run build`: generate `dist/catalog.json` and the static Pages artifact.
- `npm run previews`: capture Web and APP thumbnails into `dist/previews/`.
- `npm run check:links`: validate permanent routes and local HTML references.
- `npm test`: run metadata and migration tests.
- `npm run test:e2e`: run hub interaction and responsive layout tests.
- `npm run verify`: run the complete local verification sequence.

## Source policy

Prototype files are copied from their source projects. Updating this aggregate
repository must not modify the original source repositories.
