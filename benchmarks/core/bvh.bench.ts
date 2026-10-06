import { Matrix4 } from 'three';
import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { COUNT, createMesh, positionEntity, seedInstances } from '../shared.js';
import { verifyBVHBounds } from '../verify.js';

export function registerBVHBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  const ids = Array.from({ length: COUNT }, (_, i) => i);
  const fixture = createMesh();
  seedInstances(fixture);
  const initialPositions = ids.map((id) => fixture.getPositionAt(id).clone());
  fixture.dispose();
  const matrices = ids.map((i) => new Matrix4().makeTranslation(i % 128 + 10, i * 7 % 128 + 5, i * 13 % 128 - 10));
  for (const sphere of [false, true]) {
    for (const margin of [0, 1]) {
      bench.add(`bvh/computeBVH/sphere=${sphere}/margin=${margin}`, () => mesh.computeBVH({ getBBoxFromBSphere: sphere, margin }), {
        beforeEach: () => {
          mesh = createMesh();
          seedInstances(mesh);
        },
        afterEach: () => mesh.dispose()
      });
    }
  }
  bench.add('bvh/addInstances/insert', () => mesh.addInstances(COUNT, positionEntity), {
    beforeEach: () => {
      mesh = createMesh(COUNT * 2);
      seedInstances(mesh);
      mesh.computeBVH();
    },
    afterEach: () => mesh.dispose()
  });
  bench.add('bvh/removeInstances/delete', () => mesh.removeInstances(...ids), {
    beforeEach: () => {
      mesh = createMesh();
      seedInstances(mesh);
      mesh.computeBVH();
    },
    afterEach: () => mesh.dispose()
  });
  for (const margin of [0, 1]) {
    bench.add(`bvh/updateInstancesPosition/move/margin=${margin}`, () => {
      mesh.updateInstancesPosition((entity, i) => {
        const position = initialPositions[i];
        entity.position.set(position.x + 0.1, position.y + 0.2, position.z + 0.3);
      });
    }, {
      beforeEach: () => {
        mesh = createMesh();
        seedInstances(mesh);
        mesh.computeBVH({ margin });
      },
      afterEach: () => {
        verifyBVHBounds(mesh);
        mesh.dispose();
      }
    });
    for (const moved of [false, true]) {
      bench.add(`bvh/setMatrixAt/${moved ? 'relocation' : 'stationary'}/margin=${margin}`, () => {
        for (let i = 0; i < COUNT; i++) mesh.setMatrixAt(i, matrices[i]);
      }, {
        beforeEach: () => {
          mesh = createMesh();
          seedInstances(mesh);
          if (!moved) for (let i = 0; i < COUNT; i++) mesh.setMatrixAt(i, matrices[i]);
          mesh.computeBVH({ margin });
        },
        afterEach: () => mesh.dispose()
      });
    }
  }
}
