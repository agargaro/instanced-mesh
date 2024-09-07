import { radixSort, RadixSortOptions } from "three/examples/jsm/utils/SortUtils.js";
import { InstancedMesh2 } from "../objects/InstancedMesh2.js";
import { InstancedRenderItem } from "../objects/InstancedRenderList.js";

export function createRadixSort(target: InstancedMesh2): typeof radixSort<InstancedRenderItem> {
    const options: RadixSortOptions<InstancedRenderItem> = {
        get: el => el.depth,
        aux: new Array(target.maxCount), //TODO check array and typed array
        reversed: null
    };

    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_mesh_batch.html#L291
    return function sortFunction(list: InstancedRenderItem[]): void {
        options.reversed = target.material.transparent; // TODO support multimaterial?

        let minZ = Infinity;
        let maxZ = -Infinity;

        for (const { depth } of list) {
            if (depth > maxZ) maxZ = depth;
            if (depth < minZ) minZ = depth;
        }

        const depthDelta = maxZ - minZ;
        const factor = (2 ** 32 - 1) / depthDelta;

        for (const item of list) {
            item.depth = (item.depth - minZ) * factor;
        }

        radixSort(list, options);
    }
}
