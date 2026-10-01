---
name: add-example
description: Use when adding or creating a runnable example in this repository, either for the root Vite dev app (examples/*.ts) or for the documentation site (docs/src/examples/<kebab-name>/). Triggers include "aggiungi un esempio", "add example", "new demo", "playground", "examples/", "docs example".
---

# Add an example

This repo has **two separate example systems** with different rules. Decide which one first.

| | Root app | Docs site |
| --- | --- | --- |
| Path | `examples/<name>.ts` (flat file) | `docs/src/examples/<kebab-name>/index.ts` |
| Purpose | local Vite playground | examples embedded in docs pages |
| Library import | `../src/index.js` (relative) | `@three.ez/instanced-mesh` (via importmap) |
| Addons | `three/examples/jsm/...` | `three/addons/...` **only** |
| Discovery | manual (one `<script>` in `index.html`) | automatic (`import.meta.glob`) |
| Run | `npm run start` (root), one example at a time | `npm run dev` (from `docs/`) |

Both compile with NodeNext, so local imports always use the `.js` extension even for `.ts` sources.

## Root app recipe

1. Create `examples/<name>.ts`. Use a descriptive name (`camelCase` is the norm; `kebab-case`/`PascalCase` also exist). Do not create subfolders for examples; reusable helpers go in `examples/objects/`.
2. Copy the shape from `examples/template.ts` and fix imports:

```ts
import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshNormalMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const camera = new PerspectiveCameraAuto().translateZ(10);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const boxes = new InstancedMesh2(new BoxGeometry(), new MeshNormalMaterial());
scene.add(boxes);
boxes.addInstances(100, (obj, index) => {
  obj.position.randomDirection().multiplyScalar(Math.random() * 5);
});
```

3. Register it by editing the single `<script type="module" src="./examples/<old>.ts">` line in `index.html`. That is the only registration; only one root example runs at a time.
4. Shared helpers: import from `./objects/random.js` etc.
5. New dependency: add it to root `package.json` `devDependencies` (ask first — see `AGENTS.md` boundaries).
6. Verify with `npm run lint` (root examples are linted; they are **not** type-checked by `npm run build`).

## Docs site recipe

1. Create the folder `docs/src/examples/<kebab-name>/` and a mandatory `index.ts`. Optionally split logic into `app.ts`.
2. Imports must be resolvable by the importmap: `three`, `three/addons/...`, `@three.ez/main`, `@three.ez/instanced-mesh`, `bvh.js`. Local files use `.js`:

```ts
import { Scene, DirectionalLight, AmbientLight } from 'three';
import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { torusKnots } from './app.js';

const main = new Main();
const camera = new PerspectiveCameraAuto().translateZ(20);
const scene = new Scene().add(torusKnots);
main.createView({ scene, camera });
```

3. Embed it in any `.mdx` page under `docs/src/content/docs/**` with `<Example path='<kebab-name>'/>`. `Example` is globally auto-imported — do **not** add an import statement.
4. New dependency requires **three** edits or it breaks somewhere:
   - add a mapping in the importmap in `docs/src/pages/examples/[...slug].astro`;
   - add the package to `docs/package.json` dependencies (for `tsc`/`astro check`);
   - add it to `docs/src/components/Example/stackblitz-files/stackblitz-package.json` (or "Open in StackBlitz" fails).
5. Fullscreen URL in dev: `http://localhost:4321/instanced-mesh/examples/<kebab-name>`.
6. Verify from `docs/`: `npm run dev` (hot reload) or `npm run build`.

## Gotchas

- `index.ts` is required in docs examples — routes are generated only from `**/index.ts`.
- `Example.astro` filters files with `startsWith(path)`, so example names must not be prefixes of each other (e.g. `first` would also match `first-extra/`). Pick unique names.
- Docs use `three/addons/`; the root app uses `three/examples/jsm/`. Do not copy-paste between the two without fixing imports.
- Max 2 levels of nesting in a docs example (the rendered file tree only handles that depth).
- Docs examples are compiled to `docs/public/examples/**`, which is gitignored and never cleaned by `tsc`. Never edit generated output there.
- `docs/CONTRIBUTE.md` uses stale folder names; trust `docs/AGENTS.md` and `astro.config.mjs`.
