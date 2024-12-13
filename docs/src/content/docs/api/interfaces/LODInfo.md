---
editUrl: false
next: false
prev: false
title: "LODInfo"
---

Represents information about Level of Detail (LOD).

## Type Parameters

• **TData** = `object`

Type for additional instance data.

## Properties

### objects

> **objects**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`TData`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>[]

List of `InstancedMesh2` associated to LODs.

#### Defined in

[src/core/feature/LOD.ts:22](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/feature/LOD.ts#L22)

***

### render

> **render**: [`LODRenderList`](/api/interfaces/lodrenderlist/)\<`TData`\>

Render settings for the LOD.

#### Defined in

[src/core/feature/LOD.ts:14](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/feature/LOD.ts#L14)

***

### shadowRender

> **shadowRender**: [`LODRenderList`](/api/interfaces/lodrenderlist/)\<`TData`\>

Shadow rendering settings for the LOD.

#### Defined in

[src/core/feature/LOD.ts:18](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/feature/LOD.ts#L18)
