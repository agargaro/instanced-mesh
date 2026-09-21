import { BoxGeometry, MeshBasicMaterial, Vector3 } from 'three';
import { InstancedEntity, InstancedMesh2 } from '../src/index.js';

export const COUNT = Number(process.env.BENCH_COUNT ?? 1000);

const geometry = new BoxGeometry();
const material = new MeshBasicMaterial();
const _axis = new Vector3(0, 1, 0);

export function createMesh(capacity = COUNT, createEntities = false): InstancedMesh2 {
  return new InstancedMesh2(geometry, material, { capacity, createEntities });
}

export function positionEntity(obj: InstancedEntity, index: number): void {
  obj.position.set(index % 128, (index * 7) % 128, (index * 13) % 128);
  obj.quaternion.setFromAxisAngle(_axis, index * 0.01);
}

export function seedInstances(mesh: InstancedMesh2, count = COUNT): void {
  mesh.addInstances(count, positionEntity);
}
