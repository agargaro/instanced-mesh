import { Bench } from 'tinybench';
import { PerspectiveCamera } from 'three';
import { InstancedMesh2 } from '../../src/index.js';
import { COUNT, createMesh, seedInstances } from '../shared.js';

export function registerFrustumBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  const camera = new PerspectiveCamera(60, 1, 0.1, 1000);

  camera.position.set(64, 64, 300);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  function createCulledMesh(): InstancedMesh2 {
    const createdMesh = createMesh(COUNT, false);
    seedInstances(createdMesh);
    (createdMesh as any).instanceIndex = { array: new Uint32Array(createdMesh.capacity), _needsUpdate: false };
    return createdMesh;
  }

  bench.add('frustum/linearCulling', () => {
    mesh.performFrustumCulling(camera);
  }, {
    beforeEach: () => {
      mesh = createCulledMesh();
    }
  });

  bench.add('frustum/updateIndexArray', () => {
    mesh.updateIndexArray();
  }, {
    beforeEach: () => {
      mesh = createCulledMesh();
      (mesh as any)._indexArrayNeedsUpdate = true;
    }
  });
}
