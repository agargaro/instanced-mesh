import { Bone, Matrix4, Mesh, Object3D, Skeleton } from 'three';
import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { COUNT, createMesh, positionEntity, seedInstances } from '../shared.js';
import { verifyBVHBounds } from '../verify.js';

export function registerLifecycleBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  let copy: InstancedMesh2;
  const ids = Array.from({ length: COUNT }, (_, i) => i);
  const warn = console.warn;
  let skeleton: Skeleton;
  const morph = new Mesh();
  morph.morphTargetInfluences = [0.1, 0.2, 0.3, 0.4];
  const operations: Record<string, () => void> = {
    constructor: () => { copy = createMesh(); },
    clearInstances: () => { mesh.clearInstances(); },
    'addInstances/reuse': () => { mesh.addInstances(Math.floor(COUNT / 2), positionEntity); },
    initUniformsPerInstance: () => mesh.initUniformsPerInstance({ vertex: { transform: 'mat4', color: 'vec3', opacity: 'float' } }),
    initSkeleton: () => mesh.initSkeleton(skeleton),
    'resizeBuffers/allTextures': () => { mesh.resizeBuffers(COUNT * 2); },
    'bvh/insertRange': () => mesh.bvh.insertRange(ids),
    'bvh/insert': () => { for (const id of ids) mesh.bvh.insert(id); },
    'bvh/delete': () => { for (const id of ids) mesh.bvh.delete(id); },
    'bvh/clear': () => mesh.bvh.clear(),
    'bvh/create': () => mesh.bvh.create()
  };
  for (const [name, operation] of Object.entries(operations)) {
    bench.add('lifecycle/' + name, operation, {
      beforeAll: () => { if (name === 'bvh/insertRange') console.warn = (): void => {}; },
      afterAll: () => { console.warn = warn; },
      beforeEach: () => {
        mesh = createMesh();
        seedInstances(mesh);
        if (name === 'initSkeleton' || name === 'resizeBuffers/allTextures') {
          const parent = new Object3D();
          const bones = Array.from({ length: 16 }, () => new Bone());
          for (const bone of bones) parent.add(bone);
          parent.updateMatrixWorld(true);
          skeleton = new Skeleton(bones);
        }
        if (name === 'addInstances/reuse') mesh.removeInstances(...ids.filter((i) => i % 2 === 0).slice(0, Math.floor(COUNT / 2)));
        if (name.startsWith('bvh/')) {
          mesh.computeBVH();
          if (name === 'bvh/insert' || name === 'bvh/insertRange') mesh.bvh.clear();
        }
        if (name === 'resizeBuffers/allTextures') {
          mesh.setColorAt(0, 0xff0000);
          mesh.initUniformsPerInstance({ vertex: { transform: 'mat4' } });
          mesh.computeBVH();
          mesh.initSkeleton(skeleton);
          mesh.setMorphAt(0, morph);
        }
      },
      afterEach: () => {
        mesh.skeleton?.dispose();
        mesh.dispose();
        copy?.dispose();
        copy = undefined;
      }
    });
  }
  const matrices = Array.from({ length: COUNT }, (_, i) => new Matrix4().makeTranslation(i % 128 + 20, i * 7 % 128, i * 13 % 128));
  bench.add('bvh/move/relocation', () => {
    for (let i = 0; i < COUNT; i++) mesh.bvh.move(i);
  }, {
    beforeEach: () => {
      mesh = createMesh();
      seedInstances(mesh);
      mesh.computeBVH({ margin: 0.1 });
      for (let i = 0; i < COUNT; i++) matrices[i].toArray(mesh.matricesTexture.image.data, i * 16);
    },
    afterEach: () => {
      verifyBVHBounds(mesh);
      mesh.dispose();
    }
  });
  for (const sphere of [false, true]) {
    bench.add(`bvh/computeBVH/sphere=${sphere}/sparse`, () => mesh.computeBVH({ getBBoxFromBSphere: sphere }), {
      beforeEach: () => {
        mesh = createMesh();
        seedInstances(mesh);
        mesh.removeInstances(...ids.filter((i) => i % 3 === 0));
      },
      afterEach: () => mesh.dispose()
    });
  }
}
