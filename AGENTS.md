# AGENTS.md

Guidance for AI coding agents working in this repository.
Human contributor documentation lives in [docs/CONTRIBUTE.md](docs/CONTRIBUTE.md).

## Project overview

`@three.ez/instanced-mesh` is a TypeScript/ESM (NodeNext) library for three.js: `InstancedMesh2`, an enhanced `THREE.InstancedMesh` with dynamic capacity, per-instance frustum culling, BVH-accelerated raycasting, sorting, per-instance visibility/opacity/uniforms, LOD, shadow LOD and skinning. Built with Vite and published from the generated `dist/` folder (see `publish-*` scripts).

## Performance first

Performance is the primary goal. **Any change — including a purely cosmetic or refactoring change — must not make the library slower.** Treat a throughput/frame-time regression in a hot path as a bug.

- Benchmark before refactoring or micro-optimizing, and report real before/after numbers — never intuition.
- Never claim "X is faster than Y" without measuring. If a change cannot be measured, prefer the already-measured, simpler implementation.
- Keep the allocation-free style: reuse module-scope temporaries, avoid per-instance allocations in hot loops, and do not upload/bind buffers or textures more than necessary.

## Commands

From the repository root:

```bash
npm run start   # Vite dev server for the examples app
npm run build   # vite build + declarations -> dist/
npm run lint    # eslint --fix
npm run bench   # CPU micro-benchmarks -> benchmarks/results.json
```

There is **no test suite**: `npm test` is a placeholder, so do not claim tests pass. The only automated verification is `npm run lint` + `npm run build` (plus `npm run bench` for performance-sensitive changes); `examples/` are linted but not type-checked. Validate behavior with the examples and benchmarks.

## Conventions

- The public API is flat: every public export goes through `src/index.ts`.
- Import local modules with the `.js` extension (NodeNext), e.g. `import { X } from './core/X.js'`.
- No comments in code; only JSDoc on public API, and `/** @internal */` for non-public members (stripped via `stripInternal`).
- GLSL chunks are authored in `src/shaders/chunks/*.glsl` and injected at runtime through `onBeforeCompile`.
- Follow the existing style and run `npm run lint` before finishing.

## Workflows

Multi-step procedures are packaged as skills in `.opencode/skills/`: `add-example`, `add-shader-chunk`, `add-feature-mixin`, `add-docs-page`, `run-benchmark`. Load the matching skill **before** starting the task.

## Documentation site

`docs/` is a separate Astro Starlight project; read `docs/AGENTS.md` before changing it.

## Boundaries

- Always: run `npm run lint` and `npm run build` after edits.
- Ask first: changing public API signatures, adding runtime dependencies, or touching the `package.json` build/publish scripts.
- Never: edit generated output (`dist/`, `docs/dist/`, `docs/.astro/`, `docs/src/content/docs/api/`), run any `publish-*` script, commit, or push.
