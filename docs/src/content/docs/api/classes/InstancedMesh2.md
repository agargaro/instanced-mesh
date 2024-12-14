---
editUrl: false
next: false
prev: false
title: "InstancedMesh2"
---

Alternative `InstancedMesh` class to support additional features like frustum culling, fast raycasting, LOD and more.

## Extends

- `Mesh`\<`TGeometry`, `TMaterial`, `TEventMap`\>

## Type Parameters

• **TData** = `object`

Type for additional instance data.

• **TGeometry** *extends* `BufferGeometry` = `BufferGeometry`

Type extending `BufferGeometry`.

• **TMaterial** *extends* `Material` \| `Material`[] = `Material` \| `Material`[]

Type extending `Material` or an array of `Material`.

• **TEventMap** *extends* `Object3DEventMap` = `Object3DEventMap`

Type extending `Object3DEventMap`.

## Constructors

### new InstancedMesh2()

> **new InstancedMesh2**\<`TData`, `TGeometry`, `TMaterial`, `TEventMap`\>(`geometry`, `material`, `params`?): [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`TData`, `TGeometry`, `TMaterial`, `TEventMap`\>

#### Parameters

• **geometry**: `TGeometry`

An instance of `BufferGeometry`.

• **material**: `TMaterial`

A single or an array of `Material`.

• **params?**: [`InstancedMesh2Params`](/api/interfaces/instancedmesh2params/)

Optional configuration parameters object. See `InstancedMesh2Params` for details.

#### Returns

[`InstancedMesh2`](/api/classes/instancedmesh2/)\<`TData`, `TGeometry`, `TMaterial`, `TEventMap`\>

#### Remarks

Geometries and materials cannot be shared. If reused, they will be cloned.

#### Overrides

`Mesh<TGeometry, TMaterial, TEventMap>.constructor`

#### Defined in

[src/core/InstancedMesh2.ts:216](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L216)

## Properties

### boundingBox

> **boundingBox**: `Box3` = `null`

This bounding box encloses all instances, which can be calculated with `computeBoundingBox` method.
Bounding box isn't computed by default. It needs to be explicitly computed, otherwise it's `null`.

#### Defined in

[src/core/InstancedMesh2.ts:97](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L97)

***

### boundingSphere

> **boundingSphere**: `Sphere` = `null`

This bounding sphere encloses all instances, which can be calculated with `computeBoundingSphere` method.
Bounding sphere is computed during its first render. You may need to recompute it if an instance is transformed.

#### Defined in

[src/core/InstancedMesh2.ts:102](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L102)

***

### bvh

> **bvh**: [`InstancedMeshBVH`](/api/classes/instancedmeshbvh/) = `null`

BVH structure for optimized culling and intersection testing.
It's possible to create the BVH using the `computeBVH` method. Once created it will be updated automatically.

#### Defined in

[src/core/InstancedMesh2.ts:107](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L107)

***

### colorsTexture

> **colorsTexture**: `SquareDataTexture` = `null`

Texture storing colors for instances.

#### Defined in

[src/core/InstancedMesh2.ts:84](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L84)

***

### customDepthMaterial

> **customDepthMaterial**: `MeshDepthMaterial`

#### Default Value

`new MeshDepthMaterial({ depthPacking: RGBADepthPacking })`

#### Overrides

`Mesh.customDepthMaterial`

#### Defined in

[src/core/InstancedMesh2.ts:145](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L145)

***

### customDistanceMaterial

> **customDistanceMaterial**: `MeshDistanceMaterial`

#### Default Value

`new MeshDistanceMaterial()`

#### Overrides

`Mesh.customDistanceMaterial`

#### Defined in

[src/core/InstancedMesh2.ts:149](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L149)

***

### customSort

> **customSort**: [`CustomSortCallback`](/api/type-aliases/customsortcallback/) = `null`

Custom sort function for instances.
It's possible to create the radix sort using the `createRadixSort` method.

#### Default

```ts
null
```

#### Defined in

[src/core/InstancedMesh2.ts:113](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L113)

***

### instanceIndex

> **instanceIndex**: [`GLInstancedBufferAttribute`](/api/classes/glinstancedbufferattribute/)

Attribute storing indices of the instances to be rendered.

#### Defined in

[src/core/InstancedMesh2.ts:76](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L76)

***

### instances

> **instances**: [`Entity`](/api/type-aliases/entity/)\<`TData`\>[] = `null`

An array of `Entity` representing individual instances.
This array is only initialized if `createInstances` is set to `true` in the constructor parameters.

#### Defined in

[src/core/InstancedMesh2.ts:72](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L72)

***

### isInstancedMesh2

> `readonly` **isInstancedMesh2**: `true` = `true`

Indicates if this is an `InstancedMesh2`.

#### Defined in

[src/core/InstancedMesh2.ts:67](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L67)

***

### LODinfo

> **LODinfo**: [`LODInfo`](/api/interfaces/lodinfo/)\<`TData`\> = `null`

Contains data for managing LOD, allowing different levels of detail for rendering and shadow casting.

#### Defined in

[src/core/InstancedMesh2.ts:127](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L127)

***

### matricesTexture

> **matricesTexture**: `SquareDataTexture`

Texture storing matrices for instances.

#### Defined in

[src/core/InstancedMesh2.ts:80](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L80)

***

### morphTexture

> **morphTexture**: `DataTexture` = `null`

Texture storing morph target influences for instances.

#### Defined in

[src/core/InstancedMesh2.ts:88](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L88)

***

### raycastOnlyFrustum

> **raycastOnlyFrustum**: `boolean` = `false`

Flag indicating if raycasting should only consider the last frame frustum culled instances.
This is ignored if the bvh has been created.

#### Default

```ts
false
```

#### Defined in

[src/core/InstancedMesh2.ts:119](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L119)

***

### type

> `readonly` **type**: `"InstancedMesh2"` = `'InstancedMesh2'`

#### Default Value

`InstancedMesh2`

#### Overrides

`Mesh.type`

#### Defined in

[src/core/InstancedMesh2.ts:63](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L63)

***

### uniformsTexture

> **uniformsTexture**: `SquareDataTexture` = `null`

Texture storing custom uniforms per instance.

#### Defined in

[src/core/InstancedMesh2.ts:92](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L92)

***

### visibilityArray

> **visibilityArray**: `boolean`[]

Array storing visibility for instances.

#### Defined in

[src/core/InstancedMesh2.ts:123](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L123)

## Accessors

### capacity

#### Get Signature

> **get** **capacity**(): `number`

The capacity of the instance buffers.

##### Returns

`number`

#### Defined in

[src/core/InstancedMesh2.ts:159](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L159)

***

### count

#### Get Signature

> **get** **count**(): `number`

The number of instances rendered in the last frame.

##### Returns

`number`

#### Defined in

[src/core/InstancedMesh2.ts:164](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L164)

***

### geometry

#### Get Signature

> **get** **geometry**(): `TGeometry`

An instance of `BufferGeometry` (or derived classes), defining the object's structure.

##### Returns

`TGeometry`

#### Set Signature

> **set** **geometry**(`value`): `void`

An instance of THREE.BufferGeometry | BufferGeometry (or derived classes), defining the object's structure.

##### Default Value

THREE.BufferGeometry | `new THREE.BufferGeometry()`.

##### Parameters

• **value**: `TGeometry`

##### Returns

`void`

#### Overrides

`Mesh.geometry`

#### Defined in

[src/core/InstancedMesh2.ts:197](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L197)

***

### instancesCount

#### Get Signature

> **get** **instancesCount**(): `number`

The number of active instances.
If a number greater than the `capacity` is set, the `capacity` will be increased automatically.

##### Returns

`number`

#### Set Signature

> **set** **instancesCount**(`value`): `void`

##### Parameters

• **value**: `number`

##### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:170](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L170)

***

### material

#### Get Signature

> **get** **material**(): `TMaterial`

An instance of `material` (or derived classes) or an array of materials, defining the object's appearance.

##### Returns

`TMaterial`

#### Set Signature

> **set** **material**(`value`): `void`

An instance of material derived from the THREE.Material | Material base class or an array of materials, defining the object's appearance.

##### Default Value

THREE.MeshBasicMaterial | `new THREE.MeshBasicMaterial()`.

##### Parameters

• **value**: `TMaterial`

##### Returns

`void`

#### Overrides

`Mesh.material`

#### Defined in

[src/core/InstancedMesh2.ts:207](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L207)

***

### perObjectFrustumCulled

#### Get Signature

> **get** **perObjectFrustumCulled**(): `boolean`

Determines if per-instance frustum culling is enabled.

##### Default

```ts
true
```

##### Returns

`boolean`

#### Set Signature

> **set** **perObjectFrustumCulled**(`value`): `void`

##### Parameters

• **value**: `boolean`

##### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:177](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L177)

***

### sortObjects

#### Get Signature

> **get** **sortObjects**(): `boolean`

Determines if objects should be sorted before rendering.

##### Default

```ts
false
```

##### Returns

`boolean`

#### Set Signature

> **set** **sortObjects**(`value`): `void`

##### Parameters

• **value**: `boolean`

##### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:187](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L187)

## Methods

### addInstances()

> **addInstances**(`count`, `onCreation`?): `this`

Adds new instances and optionally initializes them using a callback function.

#### Parameters

• **count**: `number`

The number of new instances to add.

• **onCreation?**: [`UpdateEntityCallback`](/api/type-aliases/updateentitycallback/)\<[`Entity`](/api/type-aliases/entity/)\<`TData`\>\>

A callback function to initialize each new entity.

#### Returns

`this`

The current `InstancedMesh2` instance.

#### Defined in

[src/core/feature/Instances.ts:40](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/Instances.ts#L40)

***

### addLOD()

> **addLOD**(`geometry`, `material`, `distance`?, `hysteresis`?): `this`

Adds a new LOD level with the given geometry, material, and distance.

#### Parameters

• **geometry**: `BufferGeometry`\<`NormalBufferAttributes`\>

The geometry for the LOD level.

• **material**: `Material`

The material for the LOD level.

• **distance?**: `number`

The distance for this LOD level.

• **hysteresis?**: `number`

The hysteresis value for this LOD level.

#### Returns

`this`

The current `InstancedMesh2` instance.

#### Defined in

[src/core/feature/LOD.ts:83](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/LOD.ts#L83)

***

### addShadowLOD()

> **addShadowLOD**(`geometry`, `distance`?, `hysteresis`?): `this`

Adds a shadow-specific LOD level with the given geometry and distance.

#### Parameters

• **geometry**: `BufferGeometry`\<`NormalBufferAttributes`\>

The geometry for the shadow LOD.

• **distance?**: `number`

The distance for this LOD level.

• **hysteresis?**: `number`

The hysteresis value for this LOD level.

#### Returns

`this`

The current `InstancedMesh2` instance.

#### Defined in

[src/core/feature/LOD.ts:91](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/LOD.ts#L91)

***

### computeBoundingBox()

> **computeBoundingBox**(): `void`

Computes the bounding box that encloses all instances, and updates the `boundingBox` attribute.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:636](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L636)

***

### computeBoundingSphere()

> **computeBoundingSphere**(): `void`

Computes the bounding sphere that encloses all instances, and updates the `boundingSphere` attribute.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:657](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L657)

***

### computeBVH()

> **computeBVH**(`config`): `void`

Creates and computes the BVH (Bounding Volume Hierarchy) for the instances.
It's recommended to create it when all the instance matrices have been assigned.
Once created it will be updated automatically.

#### Parameters

• **config**: [`BVHParams`](/api/interfaces/bvhparams/) = `{}`

Optional configuration parameters object. See `BVHParams` for details.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:422](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L422)

***

### copy()

> **copy**(`source`, `recursive`?): `this`

Copies the given object into this object.

#### Parameters

• **source**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

• **recursive?**: `boolean`

If set to `true`, descendants of the object are copied next to the existing ones. If set to
`false`, descendants are left unchanged. Default is `true`.

#### Returns

`this`

#### Remarks

Event listeners and user-defined callbacks (.onAfterRender and .onBeforeRender) are not copied.

#### Overrides

`Mesh.copy`

#### Defined in

[src/core/InstancedMesh2.ts:675](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L675)

***

### copyTo()

> **copyTo**(`id`, `target`): `void`

Copies `position`, `quaternion`, and `scale` of a specific instance to the specified target `Object3D`.

#### Parameters

• **id**: `number`

The index of the instance.

• **target**: `Object3D`\<`Object3DEventMap`\>

The `Object3D` where to copy transformation data.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:629](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L629)

***

### dispose()

> **dispose**(): `void`

Frees the GPU-related resources allocated.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:702](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L702)

***

### disposeBVH()

> **disposeBVH**(): `void`

Disposes of the BVH structure.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:431](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L431)

***

### getColorAt()

> **getColorAt**(`id`, `color`): `Color`

Gets the color of a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

• **color**: `Color` = `_tempCol`

Optional `Color` to store the result.

#### Returns

`Color`

The color of the instance.

#### Defined in

[src/core/InstancedMesh2.ts:550](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L550)

***

### getMatrixAt()

> **getMatrixAt**(`id`, `matrix`): `Matrix4`

Gets the local transformation matrix of a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

• **matrix**: `Matrix4` = `_tempMat4`

Optional `Matrix4` to store the result.

#### Returns

`Matrix4`

The transformation matrix of the instance.

#### Defined in

[src/core/InstancedMesh2.ts:458](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L458)

***

### getMaxScaleOnAxisAt()

> **getMaxScaleOnAxisAt**(`index`): `number`

Calculates the maximum scale on any axis for a specific instance.

#### Parameters

• **index**: `number`

The index of the instance.

#### Returns

`number`

The maximum scale on any axis as a number.

#### Defined in

[src/core/InstancedMesh2.ts:484](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L484)

***

### getMorphAt()

> **getMorphAt**(`index`, `object`): `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

Gets the morph target data for a specific instance.

#### Parameters

• **index**: `number`

The index of the instance.

• **object**: `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\> = `_tempMesh`

Optional `Mesh` to store the morph target data.

#### Returns

`Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

The mesh object with updated morph target influences.

#### Defined in

[src/core/InstancedMesh2.ts:584](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L584)

***

### getObjectLODIndexForDistance()

> **getObjectLODIndexForDistance**(`levels`, `distance`): `number`

Retrieves the index of the LOD level for a given distance.

#### Parameters

• **levels**: [`LODLevel`](/api/interfaces/lodlevel/)\<`object`\>[]

The array of LOD levels.

• **distance**: `number`

The squared distance from the camera to the object.

#### Returns

`number`

The index of the LOD level that should be used.

#### Defined in

[src/core/feature/LOD.ts:67](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/LOD.ts#L67)

***

### getOpacityAt()

> **getOpacityAt**(`id`): `number`

Gets the opacity of a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

#### Returns

`number`

The opacity of the instance.

#### Defined in

[src/core/InstancedMesh2.ts:574](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L574)

***

### getPositionAt()

> **getPositionAt**(`index`, `target`): `Vector3`

Retrieves the position of a specific instance.

#### Parameters

• **index**: `number`

The index of the instance.

• **target**: `Vector3` = `_position`

Optional `Vector3` to store the result.

#### Returns

`Vector3`

The position of the instance as a `Vector3`.

#### Defined in

[src/core/InstancedMesh2.ts:468](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L468)

***

### getUniformAt()

> **getUniformAt**(`id`, `name`, `target`?): `UniformValue`

Retrieves a uniform value for a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

• **name**: `string`

The name of the uniform.

• **target?**: `UniformValueObj`

Optional target object to store the uniform value.

#### Returns

`UniformValue`

The uniform value for the specified instance.

#### Defined in

[src/core/feature/Uniforms.ts:21](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/Uniforms.ts#L21)

***

### getVisibilityAt()

> **getVisibilityAt**(`id`): `boolean`

Gets the visibility of a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

#### Returns

`boolean`

Whether the instance is visible.

#### Defined in

[src/core/InstancedMesh2.ts:521](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L521)

***

### initUniformsPerInstance()

> **initUniformsPerInstance**(`schema`): `void`

Initializes per-instance uniforms using a schema.

#### Parameters

• **schema**: `UniformSchema`

The schema defining the uniforms.

#### Returns

`void`

#### Defined in

[src/core/feature/Uniforms.ts:33](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/Uniforms.ts#L33)

***

### onAfterRender()

> **onAfterRender**(`renderer`, `scene`, `camera`, `geometry`, `material`, `group`): `void`

An optional callback that is executed immediately after a 3D object is rendered.

#### Parameters

• **renderer**: `WebGLRenderer`

• **scene**: `Scene`

• **camera**: `Camera`

• **geometry**: `BufferGeometry`\<`NormalBufferAttributes`\>

• **material**: `Material`

• **group**: `any`

#### Returns

`void`

#### Remarks

This function is called with the following parameters: renderer, scene, camera, geometry, material, group.
Please notice that this callback is only executed for `renderable` 3D objects. Meaning 3D objects which
define their visual appearance with geometries and materials like instances of Mesh, Line,
Points or Sprite. Instances of Object3D, Group or Bone are not renderable
and thus this callback is not executed for such objects.

#### Overrides

`Mesh.onAfterRender`

#### Defined in

[src/core/InstancedMesh2.ts:275](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L275)

***

### onBeforeRender()

> **onBeforeRender**(`renderer`, `scene`, `camera`, `geometry`, `material`, `group`): `void`

An optional callback that is executed immediately before a 3D object is rendered.

#### Parameters

• **renderer**: `WebGLRenderer`

• **scene**: `Scene`

• **camera**: `Camera`

• **geometry**: `BufferGeometry`\<`NormalBufferAttributes`\>

• **material**: `Material`

• **group**: `any`

#### Returns

`void`

#### Remarks

This function is called with the following parameters: renderer, scene, camera, geometry, material, group.
Please notice that this callback is only executed for `renderable` 3D objects. Meaning 3D objects which
define their visual appearance with geometries and materials like instances of Mesh, Line,
Points or Sprite. Instances of Object3D, Group or Bone are not renderable
and thus this callback is not executed for such objects.

#### Overrides

`Mesh.onBeforeRender`

#### Defined in

[src/core/InstancedMesh2.ts:260](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L260)

***

### onBeforeShadow()

> **onBeforeShadow**(`renderer`, `scene`, `camera`, `shadowCamera`, `geometry`, `depthMaterial`, `group`): `void`

An optional callback that is executed immediately before a 3D object is rendered to a shadow map.

#### Parameters

• **renderer**: `WebGLRenderer`

• **scene**: `Scene`

• **camera**: `Camera`

• **shadowCamera**: `Camera`

• **geometry**: `BufferGeometry`\<`NormalBufferAttributes`\>

• **depthMaterial**: `Material`

• **group**: `any`

#### Returns

`void`

#### Remarks

This function is called with the following parameters: renderer, scene, camera, shadowCamera, geometry,
depthMaterial, group.
Please notice that this callback is only executed for `renderable` 3D objects. Meaning 3D objects which
define their visual appearance with geometries and materials like instances of Mesh, Line,
Points or Sprite. Instances of Object3D, Group or Bone are not renderable
and thus this callback is not executed for such objects.

#### Overrides

`Mesh.onBeforeShadow`

#### Defined in

[src/core/InstancedMesh2.ts:250](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L250)

***

### performFrustumCulling()

> **performFrustumCulling**(`camera`, `cameraLOD`?): `void`

Performs frustum culling and manages LOD visibility.

#### Parameters

• **camera**: `Camera`

The main camera used for rendering.

• **cameraLOD?**: `Camera`

An optional camera for LOD calculations. Defaults to the main camera.

#### Returns

`void`

#### Defined in

[src/core/feature/FrustumCulling.ts:22](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/FrustumCulling.ts#L22)

***

### resizeBuffers()

> **resizeBuffers**(`capacity`): `this`

Resizes internal buffers to accommodate the specified capacity.
This ensures that the buffers are large enough to handle the required number of instances.

#### Parameters

• **capacity**: `number`

The new capacity of the buffers.

#### Returns

`this`

The current `InstancedMesh2` instance.

#### Defined in

[src/core/feature/Capacity.ts:12](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/Capacity.ts#L12)

***

### setColorAt()

> **setColorAt**(`id`, `color`): `void`

Sets the color of a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

• **color**: `ColorRepresentation`

The color to assign to the instance.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:530](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L530)

***

### setFirstLODDistance()

> **setFirstLODDistance**(`distance`?, `hysteresis`?): `this`

Sets the first LOD (using current geometry) distance and hysteresis.

#### Parameters

• **distance?**: `number`

The distance for the first LOD.

• **hysteresis?**: `number`

The hysteresis value for the first LOD.

#### Returns

`this`

The current `InstancedMesh2` instance.

#### Defined in

[src/core/feature/LOD.ts:74](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/LOD.ts#L74)

***

### setInstancesCount()

> **setInstancesCount**(`count`): `void`

Sets the number of instances to render and resizes buffers if necessary.

#### Parameters

• **count**: `number`

The desired number of instances.

#### Returns

`void`

#### Defined in

[src/core/feature/Capacity.ts:17](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/Capacity.ts#L17)

***

### setMatrixAt()

> **setMatrixAt**(`id`, `matrix`): `void`

Sets the local transformation matrix for a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

• **matrix**: `Matrix4`

A `Matrix4` representing the local transformation to apply to the instance.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:440](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L440)

***

### setMorphAt()

> **setMorphAt**(`index`, `object`): `void`

Sets the morph target influences for a specific instance.

#### Parameters

• **index**: `number`

The index of the instance.

• **object**: `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

The `Mesh` containing the morph target influences to apply.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:602](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L602)

***

### setOpacityAt()

> **setOpacityAt**(`id`, `value`): `void`

Sets the opacity of a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

• **value**: `number`

The opacity value to assign.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:559](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L559)

***

### setUniformAt()

> **setUniformAt**(`id`, `name`, `value`): `void`

Sets a uniform value for a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

• **name**: `string`

The name of the uniform.

• **value**: `UniformValue`

The value to set for the uniform.

#### Returns

`void`

#### Defined in

[src/core/feature/Uniforms.ts:28](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/Uniforms.ts#L28)

***

### setVisibilityAt()

> **setVisibilityAt**(`id`, `visible`): `void`

Sets the visibility of a specific instance.

#### Parameters

• **id**: `number`

The index of the instance.

• **visible**: `boolean`

Whether the instance should be visible.

#### Returns

`void`

#### Defined in

[src/core/InstancedMesh2.ts:511](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/InstancedMesh2.ts#L511)

***

### updateInstances()

> **updateInstances**(`onUpdate`, `start`?, `count`?): `this`

Updates instances by applying a callback function to each instance.

#### Parameters

• **onUpdate**: [`UpdateEntityCallback`](/api/type-aliases/updateentitycallback/)\<[`Entity`](/api/type-aliases/entity/)\<`TData`\>\>

A callback function to update each entity.

• **start?**: `number`

The starting index of the instances to update. Defaults to 0.

• **count?**: `number`

The number of instances to update. Defaults to the total instance count.

#### Returns

`this`

The current `InstancedMesh2` instance.

#### Defined in

[src/core/feature/Instances.ts:24](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/Instances.ts#L24)

***

### updateInstancesPosition()

> **updateInstancesPosition**(`onUpdate`, `start`?, `count`?): `this`

Updates instances position by applying a callback function to each instance.
This method updates only the position attributes of the matrix.

#### Parameters

• **onUpdate**: [`UpdateEntityCallback`](/api/type-aliases/updateentitycallback/)\<[`Entity`](/api/type-aliases/entity/)\<`TData`\>\>

A callback function to update each entity.

• **start?**: `number`

The starting index of the instances to update. Defaults to 0.

• **count?**: `number`

The number of instances to update. Defaults to the total instance count.

#### Returns

`this`

The current `InstancedMesh2` instance.

#### Defined in

[src/core/feature/Instances.ts:33](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/Instances.ts#L33)
