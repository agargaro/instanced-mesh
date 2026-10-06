import { Color, InstancedMesh, Matrix4, MeshBasicMaterial, PerspectiveCamera, Vector3 } from 'three';
import { Bench } from 'tinybench';
import { InstancedMesh2, createInstancedMesh2From, createRadixSort } from '../../src/index.js';
import { attachIndex, COUNT, createMesh, seedInstances } from '../shared.js';
import { verifyCulling } from '../verify.js';

export function registerSupplementalBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  const matrix = new Matrix4();
  const camera = new PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(64, 64, 300);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  let found = 0;
  const visit = (): void => {
    found++;
  };
  for (const accurate of [false, true]) {
    bench.add(`bvh/frustumCulling/margin/accurate=${accurate}`, () => mesh.bvh.frustumCulling(matrix, visit), {
      beforeAll: () => {
        mesh = createMesh();
        seedInstances(mesh);
        mesh.computeBVH({ margin: 1, accurateCulling: accurate });
      },
      beforeEach: () => { found = 0; },
      afterAll: () => {
        if (found === 0) throw new Error('BVH traversal produced no candidates');
        mesh.dispose();
      }
    });
  }
  for (const partial of [false, true]) {
    bench.add(`texture/enqueueUpdate/partial=${partial}`, () => {
      for (let i = 0; i < COUNT; i++) mesh.matricesTexture.enqueueUpdate(i);
    }, {
      beforeAll: () => {
        mesh = createMesh();
        seedInstances(mesh);
        mesh.matricesTexture.partialUpdate = partial;
      },
      beforeEach: () => { (mesh.matricesTexture as any)._rowToUpdate.fill(false); },
      afterAll: () => mesh.dispose()
    });
  }
  for (const cached of [false, true]) {
    bench.add(`frustum/frustumCullingAlreadyPerformed/cached=${cached}`, () => {
      for (let i = 0; i < COUNT; i++) mesh.frustumCullingAlreadyPerformed(cached ? 0 : i, camera, null);
    }, {
      beforeAll: () => {
        mesh = createMesh();
        (mesh as any)._lastRenderInfo = { frame: 0, camera, shadowCamera: null };
      },
      afterAll: () => mesh.dispose()
    });
  }
  bench.add('matrices/updateMatrixWorld', () => {
    for (let i = 0; i < COUNT; i++) mesh.updateMatrixWorld(true);
  }, {
    beforeAll: () => {
      mesh = createMesh();
      seedInstances(mesh);
    },
    afterAll: () => mesh.dispose()
  });
  let sort: ReturnType<typeof createRadixSort>;
  bench.add('sorting/createRadixSort/factory', () => {
    sort = createRadixSort(mesh);
  }, {
    beforeAll: () => { mesh = createMesh(); },
    afterAll: () => {
      if (typeof sort !== 'function') throw new Error('Missing sorter');
      mesh.dispose();
    }
  });
  let source: InstancedMesh;
  const color = new Color(0.2, 0.3, 0.4);
  for (const colored of [false, true]) {
    bench.add(`lifecycle/createInstancedMesh2From/colors=${colored}`, () => {
      mesh = createInstancedMesh2From(source, { capacity: COUNT });
    }, {
      beforeAll: () => {
        const fixture = createMesh();
        seedInstances(fixture);
        source = new InstancedMesh(fixture.geometry.clone(), new MeshBasicMaterial(), COUNT);
        for (let i = 0; i < COUNT; i++) {
          source.setMatrixAt(i, fixture.getMatrixAt(i));
          if (colored) source.setColorAt(i, color);
        }
        fixture.dispose();
      },
      afterEach: () => {
        if (mesh.instancesCount !== COUNT) throw new Error('Conversion lost instances');
        mesh.geometry.dispose();
        mesh.dispose();
      },
      afterAll: () => {
        source.geometry.dispose();
        (source.material as MeshBasicMaterial).dispose();
        source.dispose();
      }
    });
  }
  const position = new Vector3();
  bench.add('frustum/movingCamera', () => mesh.performFrustumCulling(camera), {
    beforeAll: () => {
      mesh = createMesh();
      seedInstances(mesh);
      attachIndex(mesh);
    },
    beforeEach: () => {
      position.set(camera.position.x === 64 ? 80 : 64, 64, 300);
      camera.position.copy(position);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
    },
    afterAll: () => {
      verifyCulling(mesh, camera);
      mesh.dispose();
    }
  });
}
