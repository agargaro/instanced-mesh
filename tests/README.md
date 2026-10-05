# Tests

Install development dependencies with `npm ci`, then install the test browser with `npx playwright install chromium` (`npx playwright install --with-deps chromium` on Linux CI).

```bash
npm test
npm run test:watch
npm run test:types
npm run test:coverage
```

`npm test` runs the Chromium tests and the existing Node regression checks. `npm run test:watch` watches the browser suite; add `-- --browser.headless=false` to see the browser. The coverage command measures the browser suite over all executable TypeScript in `src/`, including unimported files. The suite does not yet enforce the final 100% thresholds; the remaining source must be covered before that gate is enabled. GLSL execution is not measured by TypeScript coverage.

`browser/rendering.test.ts` is the minimal pattern for renderer-dependent behavior:

1. Create a real `WebGLRenderer`, a small render target, an orthographic camera and an unlit material.
2. Configure the scene through the public API and call `renderer.render`.
3. Read pixels from the render target and compare expected colors, sampling inside geometry rather than at rasterized edges.
4. Change the instance, render again and assert both the changed result and the previous location.
5. Dispose GPU resources and release the WebGL context after each test.

The shared-material test renders `InstancedMesh2` alongside a regular three.js mesh in both orders. It checks the resulting pixels and restoration of renderer/material hooks. Shader compilation errors fail the tests. There are no renderer mocks or manually invoked render hooks.

Headless Chromium uses a real WebGL context, but its graphics backend may be hardware or software depending on the machine. This suite verifies rendering behavior; it is not a GPU performance benchmark.

Use real three.js objects for CPU-only tests as well. Add browser rendering tests whenever a change depends on shader compilation, buffer/texture uploads or renderer patches. Keep deterministic scenes and inputs; avoid elapsed-time assertions in functional tests.

## Feature suites

| File | Behavior |
| --- | --- |
| `browser/instances.test.ts` | Instance lifecycle, capacity, reused IDs, entities, transformations, bounds, lazy initialization, multi-material groups and disposal |
| `browser/spatial.test.ts` | Culling, callbacks, sorting, GPU index buffers, reference raycasting, BVH construction, insertion, movement, bounds, margins and intersections |
| `browser/hot-paths.test.ts` | Six-plane tangencies, seeded culling references, camera/zoom changes, negative scale and shear, empty/reused IDs, large radix distributions, duplicate depths, shared sorting lists, GPU order, BVH mutation sequences and boundary rays |
| `browser/textures.test.ts` | All uniform types in both shader stages, packing, texture formats, resize, partial/full uploads, opacity, vertex colors and unpack-state restoration |
| `browser/deformation.test.ts` | Relative/absolute morph targets, skinning, hierarchy matrices, inverse bind poses and per-instance GPU deformation |
| `browser/lod.test.ts` | Distance/screen-size LOD, both camera types, callbacks, sorted lists, metrics, hysteresis, validation, shared resources and removal |
| `browser/shadows.test.ts` | Directional and point-light shadow LOD through real depth/distance programs and receiver pixels |
| `browser/utilities.test.ts` | Conversion from three.js meshes, render-list pooling, radix edge cases and shader patching |
| `browser/rendering.test.ts` | Minimal rendering example and shared-material patch isolation |
| `browser/growth.test.ts` | Repeated capacity increases, automatic growth to thousands of IDs, lazy/eager initialization, holes, pending uploads, texture row boundaries, packed uniforms, morph targets, bone poses and shared LOD resources |
| `browser/render-interactions.test.ts` | Overlapping opaque/transparent draws, renderOrder, LOD transitions, mixed/hidden/reordered material groups, override material transitions and shader-hook restoration |
| `browser/texture-batches.test.ts` | Adjacent/separated dirty rows, last-ID updates, bounded/full fallback, idle frames, unpack-state restoration and shared-material bindings for different texture sizes |
| `browser/multiple-views.test.ts` | Alternating camera types and zoom, LOD camera changes, multiple directional/spot/point lights and complete-image comparisons with native shadow casters |

CPU results are compared with independent three.js `Object3D`, `Matrix4`, `Box3`, `Sphere`, `Frustum` and `Mesh.raycast` references. Rendering tests check actual pixels and fail on shader compilation or WebGL errors. `helpers.ts` owns the real renderer and resources for each test; it does not emulate three.js or WebGL.

## Known regressions

Eighteen desired-behavior cases currently use Vitest `test.fails` to record twelve confirmed defects in the existing library. They are not skipped, and a future fix makes them fail as unexpected passes until converted to ordinary tests. A green suite therefore does not mean these behaviors work:

- Point-light shadow LOD can miss a caster when it is outside the first cubemap face. The six faces reuse the same camera object during a frame, but culling is cached by frame and camera identity. The fixture contrasts working and failing light orientations by checking receiver pixels.
- `InstancedMesh2.clone()` calls `SquareDataTexture.clone()`, whose inherited clone path constructs the subclass without the required arguments and throws. The desired-behavior test requires cloning without exceptions.
- `getMorphAt(id)` without a target, including the entity `morph` getter, uses a temporary mesh without initialized `morphTargetInfluences`. Explicit-target retrieval and GPU morph deformation are covered by passing tests.
- Sorted distance LOD assigns a distant instance to the next level even when its distance crosses several thresholds. The regression compares correct unsorted membership with sorted membership, both with and without BVH.
- Transparent sorting reverses distance order, but the sorted LOD distributor assumes increasing distances and assigns instances to incorrect levels. Both linear and BVH paths reproduce the defect.
- Sorted distance LOD treats the exact threshold differently from unsorted LOD: equality stays in the previous level. Fixtures include the threshold and small offsets on either side, with and without BVH.
- A transparent `scene.overrideMaterial` does not change per-instance sorting from the original opaque material's front-to-back order. Overlapping red/blue instances produce incorrect blending, with and without BVH.
- Material arrays are sorted as opaque even when all groups are transparent or some groups need back-to-front blending. Pixel tests cover both fully transparent and mixed arrays.
- Lazy buffer initialization waits for the last visible material index, even if no geometry group uses that index. Unused trailing materials can leave `instanceIndex` null indefinitely.
- Raycasting a transformed parent mesh returns points and distances in mesh-local space rather than world space. A translated, nonuniformly scaled fixture compares intersections with an ordinary three.js mesh, with and without BVH.
- Linear raycasting with `raycastOnlyFrustum = false` iterates the culling-mutated index buffer, which can omit IDs or duplicate hits. The same fixture passes with BVH.
- Linear distance-based shadow LOD uses a screen-size metric for directional-light orthographic shadow cameras, instead of the main-camera distance. A two-light fixture alternates near/far main cameras and compares complete images with native casters using the expected shadow geometry. The BVH path passes the same fixture.

Fix these defects with their regression tests, then continue covering the remaining branches before enabling the global 100% gate. Do not satisfy that gate with exclusions or coverage-ignore directives. Library runtime code has not been changed as part of this test expansion.

## GitHub pull requests

`.github/workflows/node.js.yml` runs for opened, updated, reopened and newly ready pull requests targeting any branch, plus merge queues, manual dispatch and pushes to `master`. It installs Chromium with its Linux dependencies and runs lint, build, test type-checks, browser coverage and the existing Node regressions on Ubuntu with Node 24.

The `Tests (Node 24, Chromium)` check uploads HTML/LCOV coverage reports and, on failure, rendering screenshots as workflow artifacts retained for 14 days. Superseded runs on the same pull request are cancelled. After the workflow is uploaded and has run, configure this check as required in the repository's GitHub ruleset or branch protection if merges must be blocked by failures; a workflow file alone does not configure that policy.

Run focused hot-path checks with `npx vitest run tests/browser/hot-paths.test.ts tests/browser/lod.test.ts`. Seeded cases are reproducible and compare culling with three.js bounds/frusta and ray hits with ordinary three.js meshes. The exact-tangency fixture uses exactly representable orthographic planes to isolate boundary behavior from Float32 rounding; other cases exercise decimal coordinates and repeated updates.

Run growth/render interaction checks with `npx vitest run tests/browser/growth.test.ts tests/browser/render-interactions.test.ts`. New growth cases only increase capacity, including sizes that stay within a texture allocation and sizes that cross allocation boundaries. They verify old and new high-ID data on the GPU, not only array lengths. Directional shadow LOD growth also compares complete rendered images before and after resizing.

Override tests compare complete render targets against ordinary three.js meshes for basic, normal, depth and standard materials. Overlapping-color tests assert expected alpha blending away from triangle edges. Group tests include opaque/transparent mixtures, both groups hidden and restored, repeated/reordered groups, draw ranges and material sides. RenderOrder tests account for three.js's separate opaque and transparent render lists.

Run multi-pass/upload checks with `npx vitest run tests/browser/multiple-views.test.ts tests/browser/texture-batches.test.ts`. Batched uploads check all 128 instance colors against CPU expectations, compare partial and forced-full rendered images, and verify that idle frames do not invoke texture update notifications. Lighting references use ordinary three.js casters and the same actual lights, moved between test/reference scenes, so shadow-camera projection and pixel comparisons are deterministic. These additions do not add copy/clone tests.
