import { Intersection } from "three";
import { InstancedRenderItem } from "../objects/InstancedRenderList.js";

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
