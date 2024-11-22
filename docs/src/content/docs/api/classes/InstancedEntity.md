---
editUrl: false
next: false
prev: false
title: "InstancedEntity"
---

## Constructors

### new InstancedEntity()

> **new InstancedEntity**(`owner`, `id`, `useEuler`): [`InstancedEntity`](/api/classes/instancedentity/)

#### Parameters

• **owner**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

• **id**: `number`

• **useEuler**: `boolean`

#### Returns

[`InstancedEntity`](/api/classes/instancedentity/)

#### Defined in

[src/core/InstancedEntity.ts:29](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L29)

## Properties

### id

> `readonly` **id**: `number`

#### Defined in

[src/core/InstancedEntity.ts:9](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L9)

***

### isInstanceEntity

> `readonly` **isInstanceEntity**: `true` = `true`

#### Defined in

[src/core/InstancedEntity.ts:8](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L8)

***

### owner

> `readonly` **owner**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

#### Defined in

[src/core/InstancedEntity.ts:10](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L10)

***

### position

> **position**: `Vector3`

#### Defined in

[src/core/InstancedEntity.ts:11](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L11)

***

### quaternion

> **quaternion**: `Quaternion`

#### Defined in

[src/core/InstancedEntity.ts:13](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L13)

***

### rotation

> **rotation**: `Euler`

#### Defined in

[src/core/InstancedEntity.ts:14](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L14)

***

### scale

> **scale**: `Vector3`

#### Defined in

[src/core/InstancedEntity.ts:12](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L12)

## Accessors

### color

#### Get Signature

> **get** **color**(): `Color`

##### Returns

`Color`

#### Set Signature

> **set** **color**(`value`): `void`

##### Parameters

• **value**: `ColorRepresentation`

##### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:20](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L20)

***

### matrix

#### Get Signature

> **get** **matrix**(): `Matrix4`

##### Returns

`Matrix4`

#### Defined in

[src/core/InstancedEntity.ts:26](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L26)

***

### matrixWorld

#### Get Signature

> **get** **matrixWorld**(): `Matrix4`

##### Returns

`Matrix4`

#### Defined in

[src/core/InstancedEntity.ts:27](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L27)

***

### morph

#### Get Signature

> **get** **morph**(): `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

##### Returns

`Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

#### Set Signature

> **set** **morph**(`value`): `void`

##### Parameters

• **value**: `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

##### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:23](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L23)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

##### Parameters

• **value**: `boolean`

##### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:17](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L17)

## Methods

### applyMatrix4()

> **applyMatrix4**(`m`): `this`

#### Parameters

• **m**: `Matrix4`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:109](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L109)

***

### applyQuaternion()

> **applyQuaternion**(`q`): `this`

#### Parameters

• **q**: `Quaternion`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:114](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L114)

***

### copyTo()

> **copyTo**(`target`): `void`

#### Parameters

• **target**: `Object3D`\<`Object3DEventMap`\>

#### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:102](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L102)

***

### rotateOnAxis()

> **rotateOnAxis**(`axis`, `angle`): `this`

#### Parameters

• **axis**: `Vector3`

• **angle**: `number`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:119](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L119)

***

### rotateOnWorldAxis()

> **rotateOnWorldAxis**(`axis`, `angle`): `this`

#### Parameters

• **axis**: `Vector3`

• **angle**: `number`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:125](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L125)

***

### rotateX()

> **rotateX**(`angle`): `this`

#### Parameters

• **angle**: `number`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:131](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L131)

***

### rotateY()

> **rotateY**(`angle`): `this`

#### Parameters

• **angle**: `number`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:135](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L135)

***

### rotateZ()

> **rotateZ**(`angle`): `this`

#### Parameters

• **angle**: `number`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:139](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L139)

***

### setUniform()

> **setUniform**(`name`, `value`): `void`

#### Parameters

• **name**: `string`

• **value**: [`UniformValue`](/api/type-aliases/uniformvalue/)

#### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:98](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L98)

***

### translateOnAxis()

> **translateOnAxis**(`axis`, `distance`): `this`

#### Parameters

• **axis**: `Vector3`

• **distance**: `number`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:143](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L143)

***

### translateX()

> **translateX**(`distance`): `this`

#### Parameters

• **distance**: `number`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:149](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L149)

***

### translateY()

> **translateY**(`distance`): `this`

#### Parameters

• **distance**: `number`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:153](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L153)

***

### translateZ()

> **translateZ**(`distance`): `this`

#### Parameters

• **distance**: `number`

#### Returns

`this`

#### Defined in

[src/core/InstancedEntity.ts:157](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L157)

***

### updateMatrix()

> **updateMatrix**(): `void`

#### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:42](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L42)

***

### updateMatrixPosition()

> **updateMatrixPosition**(): `void`

#### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:83](https://github.com/agargaro/instanced-mesh/blob/2f190ad5fd5081569022452a2d45df7354f092df/src/core/InstancedEntity.ts#L83)
