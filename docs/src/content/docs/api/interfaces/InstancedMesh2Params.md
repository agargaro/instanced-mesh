---
editUrl: false
next: false
prev: false
title: "InstancedMesh2Params"
---

Parameters for configuring an `InstancedMesh2` instance.

## Properties

### allowsEuler?

> `optional` **allowsEuler**: `boolean`

Determines whether `InstancedEntity` can use the `rotation` property.
If `true` `quaternion` and `rotation` will be synchronized, affecting performance.

#### Default

```ts
false
```

#### Defined in

[src/core/InstancedMesh2.ts:38](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedMesh2.ts#L38)

***

### capacity?

> `optional` **capacity**: `number`

Determines the maximum number of instances that buffers can hold.
The buffers will be expanded automatically if necessary.

#### Default

```ts
1000
```

#### Defined in

[src/core/InstancedMesh2.ts:27](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedMesh2.ts#L27)

***

### createInstances?

> `optional` **createInstances**: `boolean`

Determines whether to create an array of `InstancedEntity` to easily manipulate instances at the cost of more memory.

#### Default

```ts
false
```

#### Defined in

[src/core/InstancedMesh2.ts:32](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedMesh2.ts#L32)

***

### renderer?

> `optional` **renderer**: `WebGLRenderer`

WebGL renderer instance.
If not provided, buffers will be initialized during the first render, resulting in no instances being rendered initially.

#### Default

```ts
null
```

#### Defined in

[src/core/InstancedMesh2.ts:44](https://github.com/three-ez/instanced-mesh/blob/85018850a35ef66e53e9b7df12c8fcc2c395066b/src/core/InstancedMesh2.ts#L44)
