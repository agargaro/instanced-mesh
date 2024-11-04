import { Intersection, Material } from "three";
import { InstancedRenderItem } from "../core/utils/InstancedRenderList.js";
import { radixSort, RadixSortOptions } from "three/examples/jsm/utils/SortUtils.js";
import { InstancedMesh2 } from "../core/InstancedMesh2.js";

// REFERENCE: https://github.com/mrdoob/three.js/blob/master/examples/webgl_mesh_batch.html#L291

export function createRadixSort(target: InstancedMesh2): typeof radixSort<InstancedRenderItem> {

    const options: RadixSortOptions<InstancedRenderItem> = {
        get: el => el.depthSort,
        aux: new Array(target.maxCount),
        reversed: null
    };

    return function sortFunction(list: InstancedRenderItem[]): void {
        const material = (target._material as Material);

        if (!material.isMaterial) throw new Error("Multi material is not supported.");

        options.reversed = material.transparent;

        if (target.maxCount > options.aux.length) {
            options.aux.length = target.maxCount;
        }

        let minZ = Infinity;
        let maxZ = -Infinity;

        for (const { depth } of list) {
            if (depth > maxZ) maxZ = depth;
            if (depth < minZ) minZ = depth;
        }

        const depthDelta = maxZ - minZ;
        const factor = (2 ** 32 - 1) / depthDelta;

        for (const item of list) {
            item.depthSort = (item.depth - minZ) * factor;
        }

        radixSort(list, options);
    }
}

/** @internal */
export function sortOpaque(a: InstancedRenderItem, b: InstancedRenderItem) {
    return a.depth - b.depth;
}

/** @internal */
export function sortTransparent(a: InstancedRenderItem, b: InstancedRenderItem) {
    return b.depth - a.depth;
}

/** @internal */
export function ascSortIntersection(a: Intersection, b: Intersection): number {
    return a.distance - b.distance;
}
