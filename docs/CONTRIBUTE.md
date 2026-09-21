# Contributing to Documentation

This guide explains how to add and maintain documentation for `@three.ez/instanced-mesh`, following the [Diátaxis](https://diataxis.fr/) framework.

For the full step-by-step procedure, see [`docs/AGENTS.md`](./AGENTS.md) and the `add-docs-page` / `add-example` skills in the root `.opencode/skills/`.

## Documentation types

Pages live in `docs/src/content/docs/`:

- `getting-started/` — tutorials (step-by-step lessons)
- `basics/` — how-to guides
- `advanced/` — advanced guides
- `more/` — FAQ, known issues, performance tips
- `api/` — **generated** from JSDoc in `../src` by starlight-typedoc; never edit by hand

## Adding a page

1. Create the `.mdx` file in the directory matching its Diátaxis type, using a numeric filename prefix to control sidebar order (e.g. `basics/11-my-feature.mdx`). Pages inside the four directories are auto-discovered; a new top-level directory must be registered in `astro.config.mjs`.
2. Add frontmatter:

   ```md
   ---
   title: Your Page Title
   description: Brief description
   ---
   ```

3. Embed a runnable example with `<Example path="my-example" />` — it is auto-imported, so no `import` statement is needed.

## Adding an example

1. Create `docs/src/examples/<kebab-case-name>/index.ts` (required) plus optional local files such as `app.ts`. Maximum 2 levels of nesting.
2. Import local files with the `.js` extension (`import { x } from './app.js'`); import three.js addons from `three/addons/...`.
3. Embed it with `<Example path="<kebab-case-name>" />`. Preview it at `http://localhost:4321/instanced-mesh/examples/<name>`.

`<Example>` props:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `path` | string | required | folder name under `src/examples` |
| `hideCode` | boolean | `false` | hides the source panel |
| `hidePreview` | boolean | `false` | hides the preview |
| `hideStackblitz` | boolean | `false` | hides the "Open in StackBlitz" button |

### Dependencies

Examples resolve bare imports through the importmap in `docs/src/pages/examples/[...slug].astro`. Pre-configured: `three`, `three/addons/`, `@three.ez/main`, `@three.ez/instanced-mesh`, `@three.ez/asset-manager`, `bvh.js`.

A new dependency must be added in three places: the importmap, `docs/package.json`, and the StackBlitz package (`src/components/Example/stackblitz-files/stackblitz-package.json`).

## Development

From `docs/`:

```bash
npm run dev      # dev server with hot reload
npm run build    # build the site (also regenerates api/ and compiles examples)
npm run preview  # preview the production build
```

Examples are compiled to `public/examples/` (gitignored). Never edit generated output: `dist/`, `.astro/`, `src/content/docs/api/`, `public/examples/`.
