---
name: add-docs-page
description: Use when adding or editing a page on the Astro Starlight documentation site under docs/src/content/docs, including embedding an example. Triggers include "aggiungi una pagina di documentazione", "add docs page", "Starlight", "docs page", "MDX", "sidebar".
---

# Add a documentation page

The docs site is a standalone Astro + Starlight project in `docs/` with its own `package.json`. Work from `docs/`.

## Choose the folder (Diataxis)

| Folder | Content |
| --- | --- |
| `docs/src/content/docs/getting-started/` | tutorials |
| `docs/src/content/docs/basics/` | how-to guides |
| `docs/src/content/docs/advanced/` | advanced guides |
| `docs/src/content/docs/more/` | FAQ, known issues, performance tips |
| `docs/src/content/docs/api/` | **generated** by starlight-typedoc — never edit |

## Create the page

Use a numeric prefix to control order (`autogenerate` sorts alphabetically):

`docs/src/content/docs/basics/11-my-feature.mdx`

```mdx
---
title: My New Feature
description: Short summary of what this page covers.
---

Body text. Use `:::note`, `:::tip`, `:::caution` for asides and fenced code with a language.
```

Frontmatter requires `title`; add `description` per convention. Only the splash `index.mdx` uses `template: splash`/`hero`.

## Sidebar

- Pages inside the four existing folders are **auto-discovered** — no config change.
- A new top-level folder is not shown until you add an entry to the `sidebar` array in `docs/astro.config.mjs`:
  `{ label: 'My Section', autogenerate: { directory: 'my-section' } }`
- Ordering comes from filename prefixes, not `sidebar.order`.

## Embed an example

```mdx
### Example

<Example path='my-feature'/>
```

- `Example` is globally auto-imported via `astro-auto-import` — do **not** add an import statement.
- Props: `path` (folder name under `docs/src/examples`), plus `hideCode`, `hidePreview`, `hideStackblitz`.
- The example folder must contain `index.ts`. See the `add-example` skill for how to create it and add dependencies.

## MDX components

- `Tabs`/`TabItem` from `@astrojs/starlight/components` must be **explicitly imported**:
  `import { Tabs, TabItem } from '@astrojs/starlight/components';`
- Asides use directive syntax (`:::note`, `:::tip`, `:::caution`), not components.
- Do not use code-fence meta such as `title=`/`collapse=` — existing pages do not.

## Generated API reference

`docs/src/content/docs/api/` is generated from JSDoc in `../src` and is gitignored. To change API docs, edit the source JSDoc in `../src` and rebuild (`npm run dev`/`npm run build` in `docs/`). Never hand-edit it.

## Verify

From `docs/`: `npm run dev` (hot reload) or `npm run build` (also regenerates `api/` and compiles examples). Site base path is `/instanced-mesh`, so internal URLs include that prefix. Never edit `dist/`, `.astro/`, or `src/content/docs/api/`.

> `docs/CONTRIBUTE.md` references stale folders (`guides/`, `reference/`, `tutorials/`). Trust `docs/AGENTS.md` and `astro.config.mjs`.
