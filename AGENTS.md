# AGENTS.md

Guidance for AI coding agents working in this repository.
Human contributor documentation lives in [docs/CONTRIBUTE.md](docs/CONTRIBUTE.md).

## Project overview

`@three.ez/instanced-mesh` is a TypeScript library for three.js. It provides `InstancedMesh2`, an enhanced alternative to `THREE.InstancedMesh` with dynamic capacity, per-instance frustum culling, BVH-accelerated raycasting, sorting, per-instance visibility/opacity/uniforms, LOD, shadow LOD and skinning.

- Language: TypeScript, ESM (`module` and `moduleResolution` are `NodeNext`).
- Bundler: Vite (library mode) — entry `src/index.ts` → `build/index.js` (ESM) and `build/index.cjs` (CJS), with sourcemaps.
- Types: declaration files are emitted by `tsc` (`tsconfig.build.json`, `emitDeclarationOnly`) and shipped inside the generated `dist/` folder.
- Peer dependency: `three` (>= 0.186.0). Runtime dependency: `bvh.js`.
- The npm package is published from the generated `dist/` folder (see `publish-*` scripts).

## Performance first

Performance is the primary goal of this library. **Any change — including a purely cosmetic or refactoring change — must not make the library slower.** Treat a throughput/frame-time regression in a hot path as a bug.

- Before refactoring or micro-optimizing, write and run a benchmark first, then report real before/after numbers — never intuition.
- Never claim "X is faster than Y" without measuring.
- Keep the existing allocation-free style: reuse module-scope temporaries, avoid per-instance allocations in hot loops, and avoid uploading/binding buffers or textures more than necessary.
- If a change is expected to be performance-neutral, verify it. If it cannot be measured, prefer the already-measured, simpler implementation.

## Commands

Run from the repository root:

```bash
npm install
npm run start   # Vite dev server for the examples app (index.html + examples/)
npm run build   # vite build && tsc --build tsconfig.build.json  ->  dist/
npm run lint    # eslint --fix
npm run bench   # CPU micro-benchmarks (vite-node + tinybench) -> benchmarks/results.json
npm test        # NOT IMPLEMENTED YET (placeholder)
```

There is **no test suite**. Do not claim tests pass. If you add tests, use Vitest and wire it to the `test` script.

The only automated verification is `npm run lint` + `npm run build` (and `npm run bench` for performance-sensitive changes). Examples in `examples/` are linted but are **not** type-checked by the build (only `src/**` is). There is no test runner to fall back on: validate behavior with the examples and the benchmarks.

## Repository layout

```
src/
  index.ts                  # public barrel - every public export must be re-exported here
  core/
    InstancedMesh2.ts       # main class
    InstancedEntity.ts      # Object3D-like instance wrapper
    InstancedMeshBVH.ts     # BVH for culling + raycasting
    feature/                # TypeScript mixins for InstancedMesh2 (Capacity, FrustumCulling,
                            # Instances, LOD, Morph, Raycasting, Skeleton, Uniforms)
    utils/                  # GLInstancedBufferAttribute, InstancedRenderList, SquareDataTexture
  shaders/
    ShaderChunk.ts
    chunks/*.glsl           # GLSL chunks, imported via vite-plugin-glsl
  utils/                    # SortingUtils, CreateFrom
examples/*.ts               # runnable three.js scenes used by the Vite dev app
docs/                       # separate Astro Starlight documentation site (own package.json)
```

## Conventions

- Keep the public API flat: new exports go through `src/index.ts`.
- Import local modules with the `.js` extension (NodeNext), e.g. `import { X } from './core/X.js'`.
- Do **not** add comments. Only JSDoc on public API is expected; use `/** @internal */` for non-public members (stripped from `.d.ts` via `stripInternal`).
- GLSL is authored in `src/shaders/chunks/*.glsl` and injected at runtime through `onBeforeCompile`.
- Follow the existing code style and run `npm run lint` before finishing.

## Workflows

Repo-specific, multi-step procedures are packaged as skills in `.opencode/skills/`. Load the matching skill **before** starting the task:

- `add-example` — add a runnable example to the root Vite app (`examples/`) or the docs site (`docs/src/examples/`).
- `add-shader-chunk` — add and wire a GLSL chunk in `src/shaders/`.
- `add-feature-mixin` — add a new `InstancedMesh2` feature in `src/core/feature/`.
- `add-docs-page` — add a page to the Astro Starlight site in `docs/`.
- `run-benchmark` — measure/verify performance and detect regressions (CPU micro-benchmarks).

## Documentation site

Documentation lives in `docs/` and is a separate Astro Starlight project. Read `docs/AGENTS.md` before changing it.

## Boundaries

- Always: run `npm run lint` after edits; verify the package builds with `npm run build`.
- Ask first: changing public API signatures, adding runtime dependencies, or touching the `package.json` build/publish scripts.
- Never: edit generated output (`dist/`, `docs/dist/`, `docs/.astro/`), run any `publish-*` script, commit, or push.
