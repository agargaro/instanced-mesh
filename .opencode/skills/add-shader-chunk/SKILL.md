---
name: add-shader-chunk
description: Use when adding or modifying a GLSL shader chunk in src/shaders/chunks/*.glsl and wiring it into three.js ShaderChunk or a material via onBeforeCompile. Triggers include "nuovo chunk GLSL", "add shader chunk", "glsl", "ShaderChunk", "onBeforeCompile", "patchShader".
---

# Add and wire a GLSL shader chunk

## Naming

Chunks live in `src/shaders/chunks/` and use `snake_case`, mirroring three.js built-ins:

- `instanced_<name>_pars_vertex.glsl` — declarations (attributes, uniforms, functions). Included outside `main()`.
- `instanced_<name>_vertex.glsl` — statements. Included inside `main()`.

Custom chunks are prefixed `instanced_` to avoid collisions with three.js's global `ShaderChunk` registry. Each file is a plain GLSL fragment guarded by the preprocessor macro set in `_onBeforeCompile`:

```glsl
#ifdef USE_INSTANCING_OPACITY
  vOpacity = getOpacityTexture();
#endif
```

## Import and register

`vite-plugin-glsl` rewrites every `.glsl` file into `export default "<source>"`. Use plain default imports — never `?raw` (that skips the plugin's export format and `#include` resolution).

In `src/shaders/ShaderChunk.ts`:

```ts
import instanced_opacity_vertex from './chunks/instanced_opacity_vertex.glsl';

ShaderChunk['instanced_opacity_vertex'] = instanced_opacity_vertex;
```

- New keys **must** use bracket notation (`ShaderChunk['name']`). Dot notation fails type-check because `@types/three`'s `ShaderChunk` has a closed shape; bracket access compiles only because `noImplicitAny: false`.
- To apply the chunk to all standard materials, attach it to a built-in:
  `ShaderChunk.batching_vertex = ShaderChunk.batching_vertex.concat('\n#include <instanced_vertex>');`
- To supersede a built-in entirely, replace it (only `skinning_pars_vertex` does this today).
- `.glsl` typing comes from `"types": ["vite-plugin-glsl/ext"]` in `tsconfig.json`. No local `.d.ts` is needed.
- Do not add `export * from './shaders/chunks/<name>.glsl'` to `src/index.ts`: default-only modules re-export nothing and leave dangling references in the emitted `.d.ts`.

## Wire the material

All injection happens in `src/core/InstancedMesh2.ts`. In `_onBeforeCompile`:

```ts
shader.defines = { ...shader.defines }; // clone: do not leak defines into shared/override materials
shader.defines['USE_INSTANCING_OPACITY'] = '';
shader.uniforms.opacityTexture = { value: this.opacityTexture };
```

If the chunk is not auto-included through `ShaderChunk`, inject it by replacing `'void main() {'` or an existing token (see the `<color_vertex>` → `<instanced_color_vertex>` replacement).

Any new shader-visible state must be added to **both** cache keys, or three.js reuses the wrong compiled program:

- `_customProgramCacheKey` in `InstancedMesh2.ts`;
- the key in `src/core/utils/PropertiesOverride.ts` (`patchProperties`).

If a per-instance texture is involved, also touch all of these (otherwise it silently never uploads/binds, or breaks on resize/clone/dispose):

1. texture init helper (guard `if (!this._parentLOD)`);
2. `updateTextures`;
3. `bindTextures`;
4. `_onBeforeCompile`;
5. `_customProgramCacheKey`;
6. `dispose` and `copy`;
7. `Capacity.resizeBuffers`;
8. `LOD.patchLevel` proxy;
9. `patchProperties` cache key.

Call `materialsNeedsUpdate()` when enabling/disabling the feature at runtime.

## Gotchas

- Never reuse an existing three.js chunk name unless you intend to override it.
- Include order matters: `*_pars_vertex` declarations must precede the statements that use them; `*_vertex` chunks must be included inside `main()` before `instanceMatrix` is used.
- Chunks are registered as a side effect of importing `src/shaders/ShaderChunk.ts`, which currently happens only through `src/index.ts`. Importing `core/InstancedMesh2.js` directly bypasses registration.
- No comments in code; JSDoc on public API only, `/** @internal */` for internals.
- Verify with `npm run lint` and `npm run build`.
