---
version: 1
slug: "docs"
primary_target: "docs"
related_targets: []
---

# Surface Brief — docs

## Scope and Mode

Surface: the full documentation site for `@three.ez/instanced-mesh` (splash index, site chrome, doc articles + generated API reference, examples grid). Mode: **Read** — the visitor understands, evaluates, and adopts the library.

## Audience and Job

Three.js developers who need to render/manage large numbers of GPU instances beyond stock `InstancedMesh`. Jobs: learn the library (tutorials), solve a specific problem (culling, sorting, LOD, raycasting, skinning, uniforms), or look up exact API types/options/defaults. They configure nothing here; they read, run examples in-page or in StackBlitz, and then build with it.

## Direction Contract

- THESIS: The docs read as a shop drawing that pulls one mesh apart into its ten-thousand instances — proving performance by measured, dimensioned, exploded demonstration instead of the default dark-canvas demo palette.
- OWN-WORLD: Graphite-on-vellum drafting sheets: eye rest ground `#f4f6f8` (and a dark "blueprint" counterpart), ink linework `#1b2330`, blueprint-blue hairline `#2b4a8f`, safety-orange accent `#e85418` for live/active instances, teal `#0e7c86` for dimension figures. Title blocks, dimension callouts, section rails — every feature is a sub-assembly drawing; live counts are dimension measurements, not badges.
- STORY: A visitor lands on an exploded drawing of the instanced mesh; the live 3D showcase sits at the sheet's center; the sidebar reads as the drawing's section rail; each doc page is one sub-assembly sheet with title block, callouts around its live `<Example>` proof, and a "signature" interaction (explode slider / dimension reveals) that shows the mechanism at work. They leave convinced the library is measured, honest, and adopted.
- FIRST VIEWPORT: Orientation landscape. A title block top band carries product name, live instance counter, and sheet number; below it a wide exploded-hero plate — one geometry at the origin with instances fanning along hairlines — with the 3D showcase framed as the main projection; a right rail of dimension callouts (BVH, LOD rings, sort order); bottom edge a rail of animated example strips with gif/webp previews. Primary action: "Start the tutorial" as a title-block button.
- FORM: drafting sheet / exploded assembly (assigned direction 9b6c89c4). Graphite-on-vellum, hairline rules, orthographic projection, title blocks, dimension callouts, straight-quoted sheet titles, spectral-band active state, proof adjacency for claims.
- FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Memorable Moment

The explode interaction on the splash: the spline that fans instances out of the shared geometry along dimension hairlines, with the live counter ticking in the title block — proof that one draw call is doing work a stock `InstancedMesh` would never survive.

## Constraints

- Keep product truth, content, functions, and examples exactly as-is; copy lives in MDX content collections and generated API reference — do not rewrite factual copy.
- The Samoyed mascot (`src/assets/samoyed-mascot.png`) is a committed logo asset; it belongs in the new world as the drawing's stamp/mark.
- Examples use animated webp/gif previews (`public/examples-thumbs/*.webp`) — the redesign keeps these (with the oil/play affordance these already have) and keeps `<Example path="..." />` live embeds.
- Async 3D showcase must be progressive — sheet background conveys while canvas loads.
- Respect `prefers-reduced-motion`.
- The library's own aesthetic (the mesh viewer / dark graphite three.js palette) is the subject shown inside the world, not a competitor.
- No invented commercial claims, benchmarks, customers, or prices.

## Unresolved Decisions

- Exact Starlight theme entry points for light/dark blueprint variants; whether the vellum variant is default light and the blueprint dark (to be decided during build).
