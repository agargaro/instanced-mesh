---
editUrl: false
next: false
prev: false
title: "GLInstancedBufferAttribute"
---

## Extends

- `GLBufferAttribute`

## Constructors

### new GLInstancedBufferAttribute()

> **new GLInstancedBufferAttribute**(`gl`, `type`, `itemSize`, `elementSize`, `array`, `meshPerAttribute`): [`GLInstancedBufferAttribute`](/api/classes/glinstancedbufferattribute/)

#### Parameters

• **gl**: `WebGL2RenderingContext`

• **type**: `number`

• **itemSize**: `number`

• **elementSize**: `1` \| `2` \| `4`

• **array**: `TypedArray`

• **meshPerAttribute**: `number` = `1`

#### Returns

[`GLInstancedBufferAttribute`](/api/classes/glinstancedbufferattribute/)

#### Overrides

`GLBufferAttribute.constructor`

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:10](https://github.com/agargaro/instanced-mesh/blob/09034c570fc8bedebf7b7757d2f658100710378c/src/core/utils/GLInstancedBufferAttribute.ts#L10)

## Properties

### array

> **array**: `TypedArray`

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:7](https://github.com/agargaro/instanced-mesh/blob/09034c570fc8bedebf7b7757d2f658100710378c/src/core/utils/GLInstancedBufferAttribute.ts#L7)

***

### buffer

> **buffer**: `WebGLBuffer`

The current [WebGLBuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) instance.

#### Inherited from

`GLBufferAttribute.buffer`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:40

***

### count

> **count**: `number`

The expected number of vertices in VBO.

#### Remarks

Expects a `Integer`

#### Inherited from

`GLBufferAttribute.count`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:88

***

### elementSize

> **elementSize**: `1` \| `2` \| `4`

Stores the corresponding size in bytes for the current [.type](../../../../../api/classes/glinstancedbufferattribute/#type) property value.

The corresponding size (_in bytes_) for the given "type" param.
#### WebGL Data Type (`GLenum`)
- gl.BYTE: 1
- gl.UNSIGNED_BYTE: 1
- gl.SHORT: 2
- gl.UNSIGNED_SHORT: 2
- gl.INT: 4
- gl.UNSIGNED_INT: 4
- gl.FLOAT: 4

#### Remarks

Set this property together with [.type](../../../../../api/classes/glinstancedbufferattribute/#type). The recommended way is using the [.setType](../../../../../api/classes/glinstancedbufferattribute/#settype) method.

#### See

`constructor`` for a list of known type sizes.
@remarks Expects a `1`, `2` or `4`

#### Inherited from

`GLBufferAttribute.elementSize`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:82

***

### isGLBufferAttribute

> `readonly` **isGLBufferAttribute**: `true`

Read-only flag to check if a given object is of type GLBufferAttribute.

#### Remarks

This is a _constant_ value

#### Default Value

`true`

#### Inherited from

`GLBufferAttribute.isGLBufferAttribute`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:29

***

### isGLInstancedBufferAttribute

> **isGLInstancedBufferAttribute**: `boolean` = `true`

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:5](https://github.com/agargaro/instanced-mesh/blob/09034c570fc8bedebf7b7757d2f658100710378c/src/core/utils/GLInstancedBufferAttribute.ts#L5)

***

### isInstancedBufferAttribute

> **isInstancedBufferAttribute**: `boolean` = `true`

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:4](https://github.com/agargaro/instanced-mesh/blob/09034c570fc8bedebf7b7757d2f658100710378c/src/core/utils/GLInstancedBufferAttribute.ts#L4)

***

### itemSize

> **itemSize**: `number`

How many values make up each item (vertex).

#### Remarks

The number of values of the array that should be associated with a particular vertex.
For instance, if this attribute is storing a 3-component vector (such as a position, normal, or color), then itemSize should be 3.

#### Inherited from

`GLBufferAttribute.itemSize`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:64

***

### meshPerAttribute

> **meshPerAttribute**: `number`

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:6](https://github.com/agargaro/instanced-mesh/blob/09034c570fc8bedebf7b7757d2f658100710378c/src/core/utils/GLInstancedBufferAttribute.ts#L6)

***

### name

> **name**: `string`

Optional name for this attribute instance.

#### Default Value

`""`

#### Inherited from

`GLBufferAttribute.name`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:35

***

### type

> **type**: `number`

A [WebGL Data Type](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants#Data_types) describing the underlying VBO contents.

#### WebGL Data Type (`GLenum`)
- gl.BYTE: 0x1400
- gl.UNSIGNED_BYTE: 0x1401
- gl.SHORT: 0x1402
- gl.UNSIGNED_SHORT: 0x1403
- gl.INT: 0x1404
- gl.UNSIGNED_INT: 0x1405
- gl.FLOAT: 0x1406

#### Remarks

Set this property together with [.elementSize](../../../../../api/classes/glinstancedbufferattribute/#elementsize). The recommended way is using the [.setType()](../../../../../api/classes/glinstancedbufferattribute/#settype) method.

#### Inherited from

`GLBufferAttribute.type`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:56

***

### version

> **version**: `number`

A version number, incremented every time the needsUpdate property is set to true.

#### Remarks

Expects a `Integer`

#### Inherited from

`GLBufferAttribute.version`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:94

## Accessors

### needsUpdate

#### Set Signature

> **set** **needsUpdate**(`value`): `void`

Setting this to true increments [.version](../../../../../api/classes/glinstancedbufferattribute/#version).

##### Remarks

_set-only property_.

##### Parameters

• **value**: `boolean`

##### Returns

`void`

#### Inherited from

`GLBufferAttribute.needsUpdate`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:100

## Methods

### clone()

> **clone**(): `this`

#### Returns

`this`

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:31](https://github.com/agargaro/instanced-mesh/blob/09034c570fc8bedebf7b7757d2f658100710378c/src/core/utils/GLInstancedBufferAttribute.ts#L31)

***

### setBuffer()

> **setBuffer**(`buffer`): `this`

Sets the [.buffer](../../../../../api/classes/glinstancedbufferattribute/#buffer) property.

#### Parameters

• **buffer**: `WebGLBuffer`

#### Returns

`this`

#### Inherited from

`GLBufferAttribute.setBuffer`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:105

***

### setCount()

> **setCount**(`count`): `this`

Sets the [count](../../../../../api/classes/glinstancedbufferattribute/#count) property.

#### Parameters

• **count**: `number`

#### Returns

`this`

#### Inherited from

`GLBufferAttribute.setCount`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:120

***

### setItemSize()

> **setItemSize**(`itemSize`): `this`

Sets the [itemSize](../../../../../api/classes/glinstancedbufferattribute/#itemsize) property.

#### Parameters

• **itemSize**: `number`

#### Returns

`this`

#### Inherited from

`GLBufferAttribute.setItemSize`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:115

***

### setType()

> **setType**(`type`, `elementSize`): `this`

Sets the both [type](../../../../../api/classes/glinstancedbufferattribute/#type) and GLBufferAttribute.elementSize | elementSize properties.

#### Parameters

• **type**: `number`

• **elementSize**: `1` \| `2` \| `4`

#### Returns

`this`

#### Inherited from

`GLBufferAttribute.setType`

#### Defined in

node\_modules/@types/three/src/core/GLBufferAttribute.d.ts:110

***

### update()

> **update**(`renderer`, `count`): `void`

#### Parameters

• **renderer**: `WebGLRenderer`

• **count**: `number`

#### Returns

`void`

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:21](https://github.com/agargaro/instanced-mesh/blob/09034c570fc8bedebf7b7757d2f658100710378c/src/core/utils/GLInstancedBufferAttribute.ts#L21)
