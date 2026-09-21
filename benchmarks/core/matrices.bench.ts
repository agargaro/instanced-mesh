import { Matrix4, Vector3 } from 'three';
import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { COUNT, createMesh, seedInstances } from '../shared.js';

const _matrix = new Matrix4();
const _position = new Vector3();

export function registerMatricesBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;

  bench.add('matrices/setMatrixAt', () => {
    for (let i = 0; i < COUNT; i++) {
      mesh.setMatrixAt(i, _matrix);
    }
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
      _matrix.identity();
    }
  });

  bench.add('matrices/getMatrixAt', () => {
    for (let i = 0; i < COUNT; i++) {
      mesh.getMatrixAt(i, _matrix);
    }
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    }
  });

  bench.add('matrices/getPositionAt', () => {
    for (let i = 0; i < COUNT; i++) {
      mesh.getPositionAt(i, _position);
    }
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    }
  });

  bench.add('matrices/resizeBuffers (+50%)', () => {
    mesh.resizeBuffers(Math.floor(COUNT * 1.5));
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, false);
      seedInstances(mesh);
    }
  });
}
