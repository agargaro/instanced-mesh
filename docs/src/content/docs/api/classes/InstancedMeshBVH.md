---
editUrl: false
next: false
prev: false
title: "InstancedMeshBVH"
---

Class to manage BVH (Bounding Volume Hierarchy) for `InstancedMesh2`.
Provides methods for managing bounding volumes, frustum culling, raycasting, and bounding box computation.

## Constructors

### new InstancedMeshBVH()

> **new InstancedMeshBVH**(`target`, `margin`, `getBBoxFromBSphere`, `accurateCulling`): [`InstancedMeshBVH`](/api/classes/instancedmeshbvh/)

#### Parameters

• **target**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

The target `InstancedMesh2`.

• **margin**: `number` = `0`

The margin applied for bounding box calculations (default is 0).

• **getBBoxFromBSphere**: `boolean` = `false`

Flag to determine if instance bounding boxes should be computed from the geometry bounding sphere. Faster but less precise (default is false).

• **accurateCulling**: `boolean` = `true`

Flag to enable accurate frustum culling without considering margin (default is true).

#### Returns

[`InstancedMeshBVH`](/api/classes/instancedmeshbvh/)

#### Defined in

[src/core/InstancedMeshBVH.ts:84](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L84)

## Properties

### accurateCulling

> **accurateCulling**: `boolean`

Enables accurate frustum culling by checking intersections without applying margin to the bounding box.

#### Defined in

[src/core/InstancedMeshBVH.ts:67](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L67)

***

### bvh

> **bvh**: `BVH`\<`object`, `number`\>

The BVH instance used to organize bounding volumes.

#### Defined in

[src/core/InstancedMeshBVH.ts:59](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L59)

***

### geoBoundingBox

> **geoBoundingBox**: `Box3`

The geometry bounding box of the target.

#### Defined in

[src/core/InstancedMeshBVH.ts:55](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L55)

***

### nodesMap

> **nodesMap**: `Map`\<`number`, `object`\>

A map that stores the BVH nodes for each instance.

#### Defined in

[src/core/InstancedMeshBVH.ts:63](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L63)

***

### target

> **target**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

The target `InstancedMesh2` object that the BVH is managing.

#### Defined in

[src/core/InstancedMeshBVH.ts:51](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L51)

## Methods

### clear()

> **clear**(): `void`

Clears the BVH.

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:186](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L186)

***

### create()

> **create**(): `void`

Builds the BVH from the target mesh's instances using a top-down construction method.
This approach is more efficient and accurate compared to incremental methods, which add one instance at a time.

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:118](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L118)

***

### delete()

> **delete**(`id`): `void`

Deletes an instance from the BVH.

#### Parameters

• **id**: `number`

The id of the instance to delete.

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:176](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L176)

***

### frustumCulling()

> **frustumCulling**(`projScreenMatrix`, `onFrustumIntersection`): `void`

Performs frustum culling to determine which instances are visible based on the provided projection matrix.

#### Parameters

• **projScreenMatrix**: `Matrix4`

The projection screen matrix for frustum culling.

• **onFrustumIntersection**: `onFrustumIntersectionCallback`\<`object`, `number`\>

Callback function invoked when an instance intersects the frustum.

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:196](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L196)

***

### frustumCullingLOD()

> **frustumCullingLOD**(`projScreenMatrix`, `cameraPosition`, `levels`, `onFrustumIntersection`): `void`

Performs frustum culling with Level of Detail (LOD) consideration.

#### Parameters

• **projScreenMatrix**: `Matrix4`

The projection screen matrix for frustum culling.

• **cameraPosition**: `Vector3`

The camera's position used for LOD calculations.

• **levels**: [`LODLevel`](/api/interfaces/lodlevel/)\<`object`\>[]

An array of LOD levels.

• **onFrustumIntersection**: `onFrustumIntersectionLODCallback`\<`object`, `number`\>

Callback function invoked when an instance intersects the frustum.

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:215](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L215)

***

### insert()

> **insert**(`id`): `void`

Inserts an instance into the BVH.

#### Parameters

• **id**: `number`

The id of the instance to insert.

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:139](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L139)

***

### insertRange()

> **insertRange**(`ids`): `void`

Inserts a range of instances into the BVH.

#### Parameters

• **ids**: `number`[]

An array of ids to insert.

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:148](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L148)

***

### intersectBox()

> **intersectBox**(`target`, `onIntersection`): `boolean`

Checks if a given box intersects with any instance bounding box.

#### Parameters

• **target**: `Box3`

The target bounding box.

• **onIntersection**: `onIntersectionCallback`\<`number`\>

Callback function invoked when an intersection occurs.

#### Returns

`boolean`

`True` if there is an intersection, otherwise `false`.

#### Defined in

[src/core/InstancedMeshBVH.ts:264](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L264)

***

### move()

> **move**(`id`): `void`

Moves an instance within the BVH.

#### Parameters

• **id**: `number`

The id of the instance to move.

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:165](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L165)

***

### raycast()

> **raycast**(`raycaster`, `onIntersection`): `void`

Performs raycasting to check if a ray intersects any instances.

#### Parameters

• **raycaster**: `Raycaster`

The raycaster used for raycasting.

• **onIntersection**: `onIntersectionRayCallback`\<`number`\>

Callback function invoked when a ray intersects an instance.

#### Returns

`void`

#### Defined in

[src/core/InstancedMeshBVH.ts:246](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L246)
