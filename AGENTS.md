# AGENTS.md

Guidance for AI coding agents working in this repository.
Human contributor documentation lives in [docs/CONTRIBUTE.md](docs/CONTRIBUTE.md).

## Project overview

`@three.ez/instanced-mesh` is a TypeScript library for three.js. It provides `InstancedMesh2`, an enhanced alternative to `THREE.InstancedMesh` with dynamic capacity, per-instance frustum culling, BVH-accelerated raycasting, sorting, per-instance visibility/opacity/uniforms, LOD, shadow LOD and skinning.

- Language: TypeScript, ESM (`module` and `moduleResolution` are `NodeNext`).
- Bundler: Vite (library mode) — entry `src/index.ts` → `build/index.js` (ESM) and `build/index.cjs` (CJS), with sourcemaps.
- Types: declaration files are emitted by `tsc` (`tsconfig.build.json`, `emitDeclarationOnly`) and shipped inside the generated `dist/` folder.
- Peer dependency: `three` (>= 0.159.0). Runtime dependency: `bvh.js`.
- The npm package is published from the generated `dist/` folder (see `publish-*` scripts).

## Commands

Run from the repository root:

```bash
npm install
npm run start   # Vite dev server for the examples app (index.html + examples/)
npm run build   # vite build && tsc --build tsconfig.build.json  ->  dist/
npm run lint    # eslint --fix
npm test        # NOT IMPLEMENTED YET (placeholder)
```

There is **no test suite**. Do not claim tests pass. If you add tests, use Vitest and wire it to the `test` script.

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

## Documentation site

Documentation lives in `docs/` and is a separate Astro Starlight project. Read `docs/AGENTS.md` before changing it.

## Boundaries

- Always: run `npm run lint` after edits; verify the package builds with `npm run build`.
- Ask first: changing public API signatures, adding runtime dependencies, or touching the `package.json` build/publish scripts.
- Never: edit generated output (`dist/`, `docs/dist/`, `docs/.astro/`), run any `publish-*` script, commit, or push.
