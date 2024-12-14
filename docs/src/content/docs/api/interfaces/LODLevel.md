---
editUrl: false
next: false
prev: false
title: "LODLevel"
---

Represents a single LOD level.

## Type Parameters

• **TData** = `object`

Type for additional instance data.

## Properties

### distance

> **distance**: `number`

The squared distance at which this LOD level becomes active.

#### Defined in

[src/core/feature/LOD.ts:48](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/LOD.ts#L48)

***

### hysteresis

> **hysteresis**: `number`

Hysteresis value to prevent LOD flickering when transitioning.

#### Defined in

[src/core/feature/LOD.ts:52](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/LOD.ts#L52)

***

### object

> **object**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`TData`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

The `InstancedMesh2` object associated with this LOD level.

#### Defined in

[src/core/feature/LOD.ts:56](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/LOD.ts#L56)
