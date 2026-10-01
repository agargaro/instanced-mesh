---
name: add-feature-mixin
description: Use when adding a new feature to InstancedMesh2 in src/core/feature/*.ts, or when modifying feature composition and module augmentation. Triggers include "nuova feature", "add feature", "mixin", "src/core/feature", "InstancedMesh2 prototype", "module augmentation".
---

# Add a feature mixin to InstancedMesh2

Features are **not** factory mixins. The pattern is **prototype augmentation + TypeScript module augmentation**, applied as a module side effect. Each feature file has three mandatory parts.

## Canonical CPU feature — `src/core/feature/Morph.ts`

```ts
import { DataTexture, FloatType, Mesh, RedFormat } from 'three';
import { InstancedMesh2 } from '../InstancedMesh2.js';

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    /**
     * Gets the morph target data for a specific instance.
     * @param id The index of the instance.
     */
    getMorphAt(id: number, object?: Mesh): Mesh;
    /** @internal */
    internalHelper(): void;
  }
}

const _tempMesh = new Mesh();

InstancedMesh2.prototype.getMorphAt = function (id: number, object = _tempMesh): Mesh {
  // use this._capacity, this.instances, this.bvh, this.availabilityArray, ...
  return object;
};
```

Rules:

- The module specifier must be exactly `'../InstancedMesh2.js'` and the interface name exactly `InstancedMesh2`. A wrong path or name fails to merge silently.
- JSDoc lives on the **interface declaration**, never on the implementation. Mark non-public members with exactly `/** @internal */` so `stripInternal` strips them from `.d.ts`.
- If the member returns the chainable mesh, declare `: this`.
- Declare the generic form `interface InstancedMesh2<TData = {}>` only when the feature needs `TData`/`Entity<TData>` (as `Instances.ts` does).
- Do not declare overridden inherited methods (e.g. `raycast`); just assign them to `InstancedMesh2.prototype` with the exact base signature.
- Allocate scratch objects at module scope, never inside hot methods.

## Compose and export

There is no registry or composition call. A feature runs because its module is evaluated, which happens through the barrel:

```ts
export * from './core/feature/MyFeature.js';
```

That single line in `src/index.ts` provides both the runtime side effect (prototype assignment) and the type merge for consumers. A feature missing from the barrel is dead code.

## Features that own a per-instance texture

Use `src/core/feature/Uniforms.ts` and `Skeleton.ts` as templates (`SquareDataTexture`, `enqueueUpdate`, the `!this._parentLOD` guard, `materialsNeedsUpdate()`). The core hard-codes all texture wiring, so you must edit every point (details in the `add-shader-chunk` skill):

- texture init helper (near `InstancedMesh2.ts:398-411`), `updateTextures`, `bindTextures`;
- `_onBeforeCompile`, `_customProgramCacheKey`;
- `dispose`, `copy`;
- `Capacity.resizeBuffers`;
- `LOD.patchLevel` proxy;
- `PropertiesOverride.patchProperties` cache key;
- declare the stored property on the class in `InstancedMesh2.ts` (`/** @internal */` if not public).

If the feature needs a GLSL chunk, also load the `add-shader-chunk` skill.

## Entity-level API

Features cannot rely on an automatic proxy. To expose `instance.myThing`, add a getter/setter to `src/core/InstancedEntity.ts` delegating to the mesh method (follow `morph` at `InstancedEntity.ts:70-71`).

## Gotchas

- Missing barrel export = the feature never runs (the core imports feature modules only in type positions, elided at compile time).
- `_parentLOD` guard is required for anything allocating per-instance data: LOD children proxy the parent's textures.
- Forgetting `Capacity.resizeBuffers` causes a buffer overrun after auto-growth; forgetting `copy`/`dispose` leaks or shares GPU data.
- New shader-visible state must go in `_customProgramCacheKey` **and** the `patchProperties` key.
- There is an existing typo `/** internal */` in `Skeleton.ts` that fails to strip — do not copy it; use `/** @internal */`.
- No comments in code (JSDoc on public API only). Internal imports use the `.js` extension. Named functions need explicit return types.
- Verify with `npm run lint` and `npm run build`; validate behavior with an example and, for hot paths, with `npm run bench`.
