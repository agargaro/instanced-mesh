---
editUrl: false
next: false
prev: false
title: "LODRenderList"
---

Represents a list of render levels for LOD.

## Type Parameters

• **TData** = `object`

Type for additional instance data.

## Properties

### count

> **count**: `number`[]

Array of instance counts per LOD level, used internally.

#### Defined in

[src/core/feature/LOD.ts:37](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/LOD.ts#L37)

***

### levels

> **levels**: [`LODLevel`](/api/interfaces/lodlevel/)\<`TData`\>[]

Array of LOD levels.

#### Defined in

[src/core/feature/LOD.ts:33](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/core/feature/LOD.ts#L33)
