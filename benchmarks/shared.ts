import { BoxGeometry, MeshBasicMaterial, Vector3 } from 'three';
import { InstancedEntity, InstancedMesh2 } from '../src/index.js';

export const COUNT = Number(process.env.BENCH_COUNT ?? 1000);
if (!Number.isSafeInteger(COUNT) || COUNT < 1) throw new Error('BENCH_COUNT must be a positive integer');

const geometry = new BoxGeometry();
const material = new MeshBasicMaterial();
const _axis = new Vector3(0, 1, 0);

export function createMesh(capacity = COUNT, createEntities = false): InstancedMesh2 {
  return new InstancedMesh2(geometry, material, { capacity, createEntities });
}

export function positionEntity(obj: InstancedEntity, index: number): void {
  obj.position.set(
    (Math.imul(index, 1664525) >>> 0) / 0x100000000 * 128,
    (Math.imul(index, 22695477) >>> 0) / 0x100000000 * 128,
    (Math.imul(index, 1103515245) >>> 0) / 0x100000000 * 128
  );
  obj.quaternion.setFromAxisAngle(_axis, index * 0.01);
  obj.scale.set(0.5 + index % 3, 1 + index % 2, 0.75 + index % 5);
}

export function seedInstances(mesh: InstancedMesh2, count = COUNT): void {
  mesh.addInstances(count, positionEntity);
}

export function attachIndex(mesh: InstancedMesh2): void {
  (mesh as any).instanceIndex = { array: Uint32Array.from({ length: mesh.capacity }, (_, i) => i), _needsUpdate: false };
}
