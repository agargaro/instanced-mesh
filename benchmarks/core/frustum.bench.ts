import { BoxGeometry, MeshBasicMaterial, PerspectiveCamera } from 'three';
import { Bench } from 'tinybench';
import { InstancedMesh2, createRadixSort } from '../../src/index.js';
import { attachIndex, COUNT, createMesh, seedInstances } from '../shared.js';
import { verifyCulling } from '../verify.js';

export function registerFrustumBenchmarks(bench: Bench): void {
  const camera = new PerspectiveCamera(60, 1, 0.1, 1000);
  const shadow = new PerspectiveCamera(60, 1, 0.1, 1000);
  shadow.position.set(64, 64, 300);
  shadow.lookAt(64, 64, 0);
  shadow.updateMatrixWorld();
  registerVisibilityBenchmarks(bench, camera);
  registerTransformedBenchmark(bench, camera);
  registerLODBenchmarks(bench, camera, shadow);
  registerIndexBenchmarks(bench, camera);
}

function registerVisibilityBenchmarks(bench: Bench, camera: PerspectiveCamera): void {
  let mesh: InstancedMesh2;
  for (const bvh of [false, true]) {
    for (const visibility of ['all', 'partial', 'none', 'sparse']) {
      for (const sorting of ['none', 'opaque', 'transparent', 'radix']) {
        bench.add(`frustum/${bvh ? 'bvh' : 'linear'}/${visibility}/${sorting}`, () => mesh.performFrustumCulling(camera), {
          beforeAll: () => {
            mesh = createMesh();
            seedInstances(mesh);
            attachIndex(mesh);
            camera.position.set(64, 64, 300);
            camera.lookAt(visibility === 'none' ? 64 : 0, 64, visibility === 'none' ? 600 : 0);
            camera.fov = visibility === 'partial' ? 15 : 90;
            camera.updateProjectionMatrix();
            camera.updateMatrixWorld();
            if (visibility === 'sparse') {
              for (let i = 0;
                i < COUNT;
                i += 3) mesh.setVisibilityAt(i, false);
              mesh.removeInstances(...Array.from({ length: Math.floor(COUNT / 4) }, (_, i) => i * 4));
            }
            mesh.sortObjects = sorting !== 'none';
            mesh.material = new MeshBasicMaterial({ transparent: sorting === 'transparent' });
            if (sorting === 'radix') mesh.customSort = createRadixSort(mesh);
            if (bvh) mesh.computeBVH({ margin: 0.1 });
            mesh.performFrustumCulling(camera);
          },
          afterAll: () => {
            verifyCulling(mesh, camera);
            (mesh.material as MeshBasicMaterial).dispose();
            mesh.dispose();
          }
        });
      }
    }
  }
}

function registerTransformedBenchmark(bench: Bench, camera: PerspectiveCamera): void {
  let mesh: InstancedMesh2;
  bench.add('frustum/transformed/nonCentered/callback', () => mesh.performFrustumCulling(camera), {
    beforeAll: () => {
      mesh = new InstancedMesh2(new BoxGeometry().translate(3, 2, 1), new MeshBasicMaterial(), { capacity: COUNT });
      seedInstances(mesh);
      attachIndex(mesh);
      mesh.position.set(-10, 20, -30);
      mesh.scale.set(2, 0.5, 3);
      mesh.rotation.y = 0.2;
      mesh.updateMatrixWorld(true);
      mesh.onFrustumEnter = (id): boolean => id % 2 === 0;
      camera.position.set(64, 64, 300);
      camera.lookAt(0, 0, 0);
      camera.fov = 60;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    },
    afterAll: () => {
      verifyCulling(mesh, camera);
      mesh.dispose();
    }
  });
}

function registerLODBenchmarks(bench: Bench, camera: PerspectiveCamera, shadow: PerspectiveCamera): void {
  let mesh: InstancedMesh2;
  for (const bvh of [false, true]) {
    for (const distance of [false, true]) {
      const sorting = false;
      for (const shadows of [false, true]) {
        bench.add(`lod/${bvh ? 'bvh' : 'linear'}/${distance ? 'distance' : 'screen'}/sort=${sorting}/shadow=${shadows}`, () => {
          mesh.performFrustumCulling(shadows ? shadow : camera, camera);
        }, {
          beforeAll: () => {
            mesh = new InstancedMesh2(new BoxGeometry(), new MeshBasicMaterial(), { capacity: COUNT, useDistanceForLOD: distance });
            seedInstances(mesh);
            mesh.geometry.computeBoundingSphere();
            mesh.addLOD(mesh.geometry.clone(), mesh.material, distance ? 180 : 0.02);
            mesh.addLOD(mesh.geometry.clone(), mesh.material, distance ? 270 : 0.005);
            mesh.addShadowLOD(mesh.geometry, distance ? 0 : Infinity);
            mesh.addShadowLOD(mesh.LODinfo.objects[2].geometry, distance ? 220 : 0.01);
            for (const object of mesh.LODinfo.objects) attachIndex(object);
            mesh.sortObjects = sorting;
            camera.position.set(64, 64, 300);
            camera.lookAt(0, 0, 0);
            camera.fov = 60;
            camera.updateProjectionMatrix();
            camera.updateMatrixWorld();
            if (bvh) mesh.computeBVH();
            mesh.performFrustumCulling(shadows ? shadow : camera, camera);
          },
          afterAll: () => {
            verifyCulling(mesh, shadows ? shadow : camera, shadows ? mesh.LODinfo.shadowRender : mesh.LODinfo.render, camera);
            for (const object of mesh.LODinfo.objects) object.geometry.dispose();
            (mesh.material as MeshBasicMaterial).dispose();
            mesh.dispose();
          }
        });
      }
    }
  }
}

function registerIndexBenchmarks(bench: Bench, camera: PerspectiveCamera): void {
  let mesh: InstancedMesh2;
  for (const dirty of [false, true]) {
    bench.add(`frustum/updateIndexArray/dirty=${dirty}`, () => {
      for (let i = 0; i < (dirty ? 1 : COUNT); i++) mesh.updateIndexArray();
    }, {
      beforeAll: () => {
        mesh = createMesh();
        seedInstances(mesh);
        attachIndex(mesh);
        mesh.updateIndexArray();
      },
      beforeEach: () => { (mesh as any)._indexArrayNeedsUpdate = dirty; },
      afterAll: () => mesh.dispose()
    });
  }
  bench.add('frustum/sortWithoutCulling', () => mesh.performFrustumCulling(camera), {
    beforeAll: () => {
      mesh = createMesh();
      seedInstances(mesh);
      attachIndex(mesh);
      mesh.perObjectFrustumCulled = false;
      mesh.sortObjects = true;
    },
    afterAll: () => mesh.dispose()
  });
  bench.add('frustum/empty', () => {
    for (let i = 0; i < COUNT; i++) mesh.performFrustumCulling(camera);
  }, {
    beforeAll: () => {
      mesh = createMesh();
      attachIndex(mesh);
    },
    afterAll: () => mesh.dispose()
  });
  bench.add('lod/getObjectLODIndex', () => {
    for (let i = 0; i < COUNT; i++) mesh.getObjectLODIndex(mesh.LODinfo.render.levels, i % 300, false);
  }, {
    beforeAll: () => {
      mesh = createMesh();
      mesh.addLOD(mesh.geometry, mesh.material, 100);
      mesh.addLOD(mesh.geometry, mesh.material, 200);
    },
    afterAll: () => mesh.dispose()
  });
}
