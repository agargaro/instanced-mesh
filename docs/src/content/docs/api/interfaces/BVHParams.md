---
editUrl: false
next: false
prev: false
title: "BVHParams"
---

Parameters for configuring the BVH (Bounding Volume Hierarchy).

## Properties

### accurateCulling?

> `optional` **accurateCulling**: `boolean`

Enables accurate frustum culling by checking intersections without applying margin to the bounding box.

#### Default

```ts
true
```

#### Defined in

[src/core/InstancedMeshBVH.ts:33](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L33)

***

### getBBoxFromBSphere?

> `optional` **getBBoxFromBSphere**: `boolean`

Uses the geometry bounding sphere to compute instance bounding boxes.
Otherwise it's calculated by applying the object's matrix to all 8 bounding box points.
This is faster but less precise. Useful for moving objects.
Only works if the geometry's bounding sphere is centered at the origin.

#### Default

```ts
false
```

#### Defined in

[src/core/InstancedMeshBVH.ts:28](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L28)

***

### margin?

> `optional` **margin**: `number`

Margin applied to accommodate animated or moving objects.
Improves BVH update performance but slows down frustum culling and raycasting.
For static objects, set to 0 to optimize culling and raycasting efficiency.

#### Default

```ts
0
```

#### Defined in

[src/core/InstancedMeshBVH.ts:20](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMeshBVH.ts#L20)
