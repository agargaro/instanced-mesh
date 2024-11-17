import { FloatArray } from 'bvh.js';
import { Vector3 } from 'three';

export interface SphereTarget {
  centerX: number;
  centerY: number;
  centerZ: number;
  maxScale: number;
}

export function getSphereFromMatrix_centeredGeometry(id: number, array: FloatArray, target: SphereTarget): SphereTarget {
  const offset = id * 16;

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

  target.centerX = array[offset + 12];
  target.centerY = array[offset + 13];
  target.centerZ = array[offset + 14];

  return target;
}

// TODO move it
export function getPositionAt(index: number, array: FloatArray, target: Vector3): Vector3 {
  const offset = index * 16;
  target.x = array[offset + 12];
  target.y = array[offset + 13];
  target.z = array[offset + 14];
  return target;
}

export function getMaxScaleOnAxisAt(index: number, array: FloatArray): number {
  const offset = index * 16;

  const te0 = array[offset + 0];
  const te1 = array[offset + 1];
  const te2 = array[offset + 2];
  const scaleXSq = te0 * te0 + te1 * te1 + te2 * te2;

  const te4 = array[offset + 4];
  const te5 = array[offset + 5];
  const te6 = array[offset + 6];
  const scaleYSq = te4 * te4 + te5 * te5 + te6 * te6;

  const te8 = array[offset + 8];
  const te9 = array[offset + 9];
  const te10 = array[offset + 10];
  const scaleZSq = te8 * te8 + te9 * te9 + te10 * te10;

  return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
}
