---
editUrl: false
next: false
prev: false
title: "InstancedEntity"
---

Represents an instance in an `InstancedMesh2`.
This class stores transformation data (position, rotation, scale) and provides methods to manipulate them.

## Constructors

### new InstancedEntity()

> **new InstancedEntity**(`owner`, `id`, `useEuler`): [`InstancedEntity`](/api/classes/instancedentity/)

This object is instantiated automatically by setting `createInstances` to `true` in the `InstancedMesh2` constructor parameters.
Dont instantiate this manually.

#### Parameters

• **owner**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

The `InstancedMesh2` that owns this instance.

• **id**: `number`

The unique identifier for this instance within the `InstancedMesh2`.

• **useEuler**: `boolean`

Whether to use Euler rotations in addition to quaternion rotations.

#### Returns

[`InstancedEntity`](/api/classes/instancedentity/)

#### Defined in

[src/core/InstancedEntity.ts:84](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L84)

## Properties

### id

> `readonly` **id**: `number`

The unique identifier for this instance (relative to the `InstancedMesh2` it references).

#### Defined in

[src/core/InstancedEntity.ts:20](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L20)

***

### isInstanceEntity

> `readonly` **isInstanceEntity**: `true` = `true`

Indicates if this is an `InstancedEntity`.

#### Defined in

[src/core/InstancedEntity.ts:16](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L16)

***

### owner

> `readonly` **owner**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

`InstancedMesh2` to which this instance refers.

#### Defined in

[src/core/InstancedEntity.ts:24](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L24)

***

### position

> **position**: `Vector3`

The local position.

#### Defined in

[src/core/InstancedEntity.ts:28](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L28)

***

### quaternion

> **quaternion**: `Quaternion`

The local rotation as `Quaternion`.

#### Defined in

[src/core/InstancedEntity.ts:36](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L36)

***

### rotation

> **rotation**: `Euler`

The local rotation as `Euler`.
This works only if `allowsEuler` is set to `true` in the `InstancedMesh2` constructor parameters.

#### Defined in

[src/core/InstancedEntity.ts:41](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L41)

***

### scale

> **scale**: `Vector3`

The local scale.

#### Defined in

[src/core/InstancedEntity.ts:32](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L32)

## Accessors

### color

#### Get Signature

> **get** **color**(): `Color`

Color set and got from `owner.colorsTexture`.

##### Returns

`Color`

#### Set Signature

> **set** **color**(`value`): `void`

##### Parameters

• **value**: `ColorRepresentation`

##### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:52](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L52)

***

### matrix

#### Get Signature

> **get** **matrix**(): `Matrix4`

The local transform matrix got from `owner.matricesTexture`.

##### Returns

`Matrix4`

#### Defined in

[src/core/InstancedEntity.ts:70](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L70)

***

### matrixWorld

#### Get Signature

> **get** **matrixWorld**(): `Matrix4`

The world transform matrix got by multiplying the matrix got from `owner.matricesTexture` and `this.owner.matrixWorld`.

##### Returns

`Matrix4`

#### Defined in

[src/core/InstancedEntity.ts:75](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L75)

***

### morph

#### Get Signature

> **get** **morph**(): `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

Morph target influences set and got from `owner.morphTexture`.

##### Returns

`Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

#### Set Signature

> **set** **morph**(`value`): `void`

##### Parameters

• **value**: `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

##### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:64](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L64)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Opacity set and got from `owner.colorsTexture`.

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

##### Parameters

• **value**: `number`

##### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:58](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L58)

***

### visible

#### Get Signature

> **get** **visible**(): `boolean`

The visibility state set and got from `owner.visibilityArray`.

##### Returns

`boolean`

#### Set Signature

> **set** **visible**(`value`): `void`

##### Parameters

• **value**: `boolean`

##### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:46](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L46)

## Methods

### applyMatrix4()

> **applyMatrix4**(`m`): `this`

Applies the matrix transform to the object and updates the object's position, rotation and scale.

#### Parameters

• **m**: `Matrix4`

The matrix to apply.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:197](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L197)

***

### applyQuaternion()

> **applyQuaternion**(`q`): `this`

Applies the rotation represented by the quaternion to the object.

#### Parameters

• **q**: `Quaternion`

The quaternion representing the rotation to apply.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:207](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L207)

***

### copyTo()

> **copyTo**(`target`): `void`

Copies the transformation properties (`position`, `scale`, `quaternion`) of this instance to the specified `Object3D`.

#### Parameters

• **target**: `Object3D`\<`Object3DEventMap`\>

The `Object3D` where the transformation properties will be copied.

#### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:185](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L185)

***

### getUniform()

> **getUniform**(`name`, `target`?): `UniformValue`

Retrieves the uniform value associated with the given name.

#### Parameters

• **name**: `string`

The name of the uniform to retrieve.

• **target?**: `UniformValueObj`

Optional target object where the uniform value will be written.

#### Returns

`UniformValue`

The retrieved uniform value.

#### Defined in

[src/core/InstancedEntity.ts:168](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L168)

***

### rotateOnAxis()

> **rotateOnAxis**(`axis`, `angle`): `this`

Rotate an object along an axis in object space. The axis is assumed to be normalized.

#### Parameters

• **axis**: `Vector3`

A normalized vector in object space.

• **angle**: `number`

The angle in radians.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:218](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L218)

***

### rotateOnWorldAxis()

> **rotateOnWorldAxis**(`axis`, `angle`): `this`

Rotate an object along an axis in world space. The axis is assumed to be normalized. Method Assumes no rotated parent.

#### Parameters

• **axis**: `Vector3`

A normalized vector in world space.

• **angle**: `number`

The angle in radians.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:230](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L230)

***

### rotateX()

> **rotateX**(`angle`): `this`

Rotates the object around x axis in local space.

#### Parameters

• **angle**: `number`

The angle to rotate in radians.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:241](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L241)

***

### rotateY()

> **rotateY**(`angle`): `this`

Rotates the object around y axis in local space.

#### Parameters

• **angle**: `number`

The angle to rotate in radians.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:250](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L250)

***

### rotateZ()

> **rotateZ**(`angle`): `this`

Rotates the object around z axis in local space.

#### Parameters

• **angle**: `number`

The angle to rotate in radians.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:259](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L259)

***

### setUniform()

> **setUniform**(`name`, `value`): `void`

Sets the uniform value for the given name

#### Parameters

• **name**: `string`

The name of the uniform to set.

• **value**: `UniformValue`

The new value for the uniform.

#### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:177](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L177)

***

### translateOnAxis()

> **translateOnAxis**(`axis`, `distance`): `this`

Translate an object by distance along an axis in object space. The axis is assumed to be normalized.

#### Parameters

• **axis**: `Vector3`

A normalized vector in object space.

• **distance**: `number`

The distance to translate.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:269](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L269)

***

### translateX()

> **translateX**(`distance`): `this`

Translates object along x axis in object space by distance units.

#### Parameters

• **distance**: `number`

The distance to translate.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:280](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L280)

***

### translateY()

> **translateY**(`distance`): `this`

Translates object along y axis in object space by distance units.

#### Parameters

• **distance**: `number`

The distance to translate.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:289](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L289)

***

### translateZ()

> **translateZ**(`distance`): `this`

Translates object along z axis in object space by distance units.

#### Parameters

• **distance**: `number`

The distance to translate.

#### Returns

`this`

The instance of the object.

#### Defined in

[src/core/InstancedEntity.ts:298](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L298)

***

### updateMatrix()

> **updateMatrix**(): `void`

Updates the transformation matrix with its current position, quaternion, and scale.
The updated matrix is stored in the `owner.matricesTexture`.

#### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:101](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L101)

***

### updateMatrixPosition()

> **updateMatrixPosition**(): `void`

Updates only the position component of the transformation matrix.
This is useful if only position changes, avoiding recalculating the full matrix.
The updated matrix is stored in the `owner.matricesTexture`.

#### Returns

`void`

#### Defined in

[src/core/InstancedEntity.ts:147](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedEntity.ts#L147)
