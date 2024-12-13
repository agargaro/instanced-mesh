---
editUrl: false
next: false
prev: false
title: "GLInstancedBufferAttribute"
---

A class that extends `GLBufferAttribute` to handle instanced buffer attributes.
This class was specifically created to allow updating instanced buffer attributes during the `onBeforeRender` callback,
providing an efficient way to modify the buffer data dynamically before rendering.

## Extends

- `GLBufferAttribute`

## Constructors

### new GLInstancedBufferAttribute()

> **new GLInstancedBufferAttribute**(`gl`, `type`, `itemSize`, `elementSize`, `array`, `meshPerAttribute`): [`GLInstancedBufferAttribute`](/api/classes/glinstancedbufferattribute/)

#### Parameters

• **gl**: `WebGL2RenderingContext`

The WebGL2RenderingContext used to create the buffer.

• **type**: `number`

The type of data in the attribute.

• **itemSize**: `number`

The number of elements per attribute.

• **elementSize**: `1` \| `2` \| `4`

The size of individual elements in the array.

• **array**: `TypedArray`

The data array that holds the attribute values.

• **meshPerAttribute**: `number` = `1`

The number of meshes that share the same attribute data.

#### Returns

[`GLInstancedBufferAttribute`](/api/classes/glinstancedbufferattribute/)

#### Overrides

`GLBufferAttribute.constructor`

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:35](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/utils/GLInstancedBufferAttribute.ts#L35)

## Properties

### array

> **array**: `TypedArray`

The data array that holds the attribute values.

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:20](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/utils/GLInstancedBufferAttribute.ts#L20)

***

### isGLInstancedBufferAttribute

> **isGLInstancedBufferAttribute**: `boolean` = `true`

Indicates if this is an `isGLInstancedBufferAttribute`.

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:12](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/utils/GLInstancedBufferAttribute.ts#L12)

***

### meshPerAttribute

> **meshPerAttribute**: `number`

The number of meshes that share the same attribute data.

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:16](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/utils/GLInstancedBufferAttribute.ts#L16)

## Methods

### update()

> **update**(`renderer`, `count`): `void`

Updates the buffer data.
This method is designed to be called during the `onBeforeRender` callback.
It ensures that the attribute data is updated just before the rendering process begins.

#### Parameters

• **renderer**: `WebGLRenderer`

The WebGLRenderer used to render the scene.

• **count**: `number`

The number of elements to update in the buffer.

#### Returns

`void`

#### Defined in

[src/core/utils/GLInstancedBufferAttribute.ts:54](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/utils/GLInstancedBufferAttribute.ts#L54)
