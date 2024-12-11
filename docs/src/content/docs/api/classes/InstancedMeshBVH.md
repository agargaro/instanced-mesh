---
editUrl: false
next: false
prev: false
title: "InstancedMeshBVH"
---

## Constructors

### new InstancedMeshBVH()

> **new InstancedMeshBVH**(`target`, `margin`, `highPrecision`, `getBoxFromSphere`): [`InstancedMeshBVH`](/api/classes/instancedmeshbvh/)

#### Parameters

• **target**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

• **margin**: `number` = `0`

• **highPrecision**: `boolean` = `false`

• **getBoxFromSphere**: `boolean` = `false`

#### Returns

[`InstancedMeshBVH`](/api/classes/instancedmeshbvh/)

#### Defined in

[src/core/InstancedMeshBVH.ts:26](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L26)

## Properties

### bvh

> **bvh**: `BVH`\<`object`, `number`\>

#### Defined in

[src/core/InstancedMeshBVH.ts:13](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L13)

***

### geoBoundingBox

> **geoBoundingBox**: `Box3`

#### Defined in

[src/core/InstancedMeshBVH.ts:12](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L12)

***

### nodesMap

> **nodesMap**: `Map`\<`number`, `object`\>

#### Defined in

[src/core/InstancedMeshBVH.ts:14](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L14)

***

### target

> **target**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

#### Defined in

[src/core/InstancedMeshBVH.ts:11](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L11)

## Methods

### clear()

> **clear**(): `void`

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:105](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L105)

***

### create()

> **create**(): `void`

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:56](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L56)

***

### delete()

> **delete**(`id`): `void`

#### Parameters

• **id**: `number`

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:98](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L98)

***

### frustumCulling()

> **frustumCulling**(`projScreenMatrix`, `onFrustumIntersection`): `void`

#### Parameters

• **projScreenMatrix**: `Matrix4`

• **onFrustumIntersection**: `onFrustumIntersectionCallback`\<`object`, `number`\>

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:110](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L110)

***

### frustumCullingLOD()

> **frustumCullingLOD**(`projScreenMatrix`, `cameraPosition`, `levels`, `onFrustumIntersection`): `void`

#### Parameters

• **projScreenMatrix**: `Matrix4`

• **cameraPosition**: `Vector3`

• **levels**: [`LODLevel`](/api/interfaces/lodlevel/)\<`object`\>[]

• **onFrustumIntersection**: `onFrustumIntersectionLODCallback`\<`object`, `number`\>

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:122](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L122)

***

### insert()

> **insert**(`id`): `void`

#### Parameters

• **id**: `number`

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:73](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L73)

***

### insertRange()

> **insertRange**(`ids`): `void`

#### Parameters

• **ids**: `number`[]

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:78](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L78)

***

### intersectBox()

> **intersectBox**(`target`, `onIntersection`): `boolean`

#### Parameters

• **target**: `Box3`

• **onIntersection**: `onIntersectionCallback`\<`number`\>

#### Returns

`boolean`

#### Defined in

[src/core/InstancedMeshBVH.ts:159](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L159)

***

### move()

> **move**(`id`): `void`

#### Parameters

• **id**: `number`

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:91](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L91)

***

### raycast()

> **raycast**(`raycaster`, `onIntersection`): `void`

#### Parameters

• **raycaster**: `Raycaster`

• **onIntersection**: `onIntersectionRayCallback`\<`number`\>

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:148](https://github.com/agargaro/instanced-mesh/blob/6b4aafb234e44b872be8f20e0304628a1f2217cf/src/core/InstancedMeshBVH.ts#L148)
