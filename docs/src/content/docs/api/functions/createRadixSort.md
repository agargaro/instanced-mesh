---
editUrl: false
next: false
prev: false
title: "createRadixSort"
---

> **createRadixSort**(`target`): *typeof* `radixSort`

Creates a radix sort function specifically for sorting `InstancedMesh2` instances.
The sorting is based on the `depth` property of each `InstancedRenderItem`.
This function dynamically adjusts for transparent materials by reversing the sort order if necessary.

## Parameters

• **target**: [`InstancedMesh2`](/api/classes/instancedmesh2/)\<`object`, `BufferGeometry`\<`NormalBufferAttributes`\>, `Material` \| `Material`[], `Object3DEventMap`\>

The `InstancedMesh2` instance that contains the instances to be sorted.

## Returns

*typeof* `radixSort`

A radix sort function.

## Defined in

[src/utils/SortingUtils.ts:14](https://github.com/agargaro/instanced-mesh/blob/1764d29737a254f52685fad96d0cc8ced649dde1/src/utils/SortingUtils.ts#L14)
