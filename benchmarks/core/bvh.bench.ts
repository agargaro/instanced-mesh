import { Matrix4, Vector3 } from 'three';
import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { COUNT, createMesh, positionEntity, seedInstances } from '../shared.js';

const _matrix = new Matrix4();
const _position = new Vector3();
const ids = Array.from({ length: COUNT }, (_, i) => i);

export function registerBVHBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;

  bench.add('bvh/computeBVH', () => {
    mesh.computeBVH();
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    }
  });

  bench.add('bvh/addInstances (insert)', () => {
    mesh.addInstances(COUNT, positionEntity);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT * 2, false);
      mesh.computeBVH();
    }
  });

  bench.add('bvh/removeInstances (delete)', () => {
    mesh.removeInstances(...ids);
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
      mesh.computeBVH();
    }
  });

  bench.add('bvh/setMatrixAt (move)', () => {
    for (let i = 0; i < COUNT; i++) {
      _position.set(i % 128, (i * 7) % 128, (i * 13) % 128);
      _matrix.makeTranslation(_position.x, _position.y, _position.z);
      mesh.setMatrixAt(i, _matrix);
    }
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
      mesh.computeBVH();
    }
  });
}
