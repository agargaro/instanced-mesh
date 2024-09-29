import { FloatArray } from "bvh.js";

export interface SphereTarget {
    centerX: number;
    centerY: number;
    centerZ: number;
    maxScale: number;
}

// this method works if geometry is centered
export function getSphereFromMatrix(id: number, array: FloatArray, target: SphereTarget): SphereTarget {
    const offset = id * 16;

    // get max scale from matrix
    const m0 = array[offset + 0];
    const m1 = array[offset + 1];
    const m2 = array[offset + 2];
    const m4 = array[offset + 4];
    const m5 = array[offset + 5];
    const m6 = array[offset + 6];
    const m8 = array[offset + 8];
    const m9 = array[offset + 9];
    const m10 = array[offset + 10];

    const scaleXSq = m0 * m0 + m1 * m1 + m2 * m2;
    const scaleYSq = m4 * m4 + m5 * m5 + m6 * m6;
    const scaleZSq = m8 * m8 + m9 * m9 + m10 * m10;

    target.maxScale = Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));

    // get position from matrix
    target.centerX = array[offset + 12];
    target.centerY = array[offset + 13];
    target.centerZ = array[offset + 14];

    return target;
}
