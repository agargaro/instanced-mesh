import { Bone, Color, Matrix4, Mesh, Object3D, Quaternion, Skeleton, Vector3 } from 'three';
import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { COUNT, createMesh, seedInstances } from '../shared.js';

export function registerEntityBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  const target = new Object3D();
  const matrix = new Matrix4().makeTranslation(0.1, 0.2, 0.3);
  const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.01);
  const axis = new Vector3(0, 1, 0);
  const color = new Color(0.2, 0.4, 0.6);
  let sink = 0;
  const morph = new Mesh();
  morph.morphTargetInfluences = [0.1, 0.2, 0.3, 0.4];
  const operations: Record<string, () => void> = {
    setMatrixIdentity: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.setMatrixIdentity();
      }
    },
    updateMatrix: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.updateMatrix();
      }
    },
    updateMatrixPosition: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.updateMatrixPosition();
      }
    },
    copyTo: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.copyTo(target);
      }
    },
    applyMatrix4: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.applyMatrix4(matrix);
      }
    },
    applyQuaternion: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.applyQuaternion(quaternion);
      }
    },
    rotateOnAxis: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.rotateOnAxis(axis, 0.01);
      }
    },
    rotateOnWorldAxis: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.rotateOnWorldAxis(axis, 0.01);
      }
    },
    rotateX: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.rotateX(0.01);
      }
    },
    rotateY: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.rotateY(0.01);
      }
    },
    rotateZ: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.rotateZ(0.01);
      }
    },
    translateOnAxis: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.translateOnAxis(axis, 0.1);
      }
    },
    translateX: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.translateX(0.1);
      }
    },
    translateY: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.translateY(0.1);
      }
    },
    translateZ: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.translateZ(0.1);
      }
    },
    matrix: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        target.matrix.copy(entity.matrix);
      }
    },
    matrixWorld: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        target.matrix.copy(entity.matrixWorld);
      }
    },
    'visible/get': () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        sink += Number(entity.visible);
      }
    },
    'visible/set': () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.visible = entity.id % 2 === 0;
      }
    },
    'active/get': () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        sink += Number(entity.active);
      }
    },
    'active/set': () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.active = true;
      }
    },
    'color/get': () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        sink += entity.color.r;
      }
    },
    'color/set': () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.color = color;
      }
    },
    'opacity/get': () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        sink += entity.opacity;
      }
    },
    'opacity/set': () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.opacity = 0.5;
      }
    },
    getUniform: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        sink += entity.getUniform('value') as number;
      }
    },
    setUniform: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.setUniform('value', 0.5);
      }
    },
    'morph/set': () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.morph = morph;
      }
    },
    updateBones: () => {
      for (let i = 0; i < COUNT; i++) {
        const entity = mesh.instances[i];
        entity.updateBones(false);
      }
    }
  };
  for (const bvh of [false, true]) {
    for (const [name, operation] of Object.entries(operations)) {
      if (bvh && name !== 'updateMatrix' && name !== 'updateMatrixPosition') continue;
      bench.add(`entity/${name}/bvh=${bvh}`, operation, {
        beforeAll: () => {
          mesh = createMesh(COUNT, true);
          seedInstances(mesh);
          mesh.setColorAt(0, color);
          mesh.setOpacityAt(0, 0.5);
          mesh.initUniformsPerInstance({ vertex: { value: 'float' } });
          if (name === 'updateBones') {
            const parent = new Object3D();
            const bones = Array.from({ length: 16 }, () => new Bone());
            for (const bone of bones) parent.add(bone);
            parent.updateMatrixWorld(true);
            mesh.initSkeleton(new Skeleton(bones));
          }
          if (bvh) mesh.computeBVH({ margin: 1 });
        },
        beforeEach: () => {
          sink = 0;
          if (name.startsWith('translate') || name === 'applyMatrix4') {
            for (const entity of mesh.instances) entity.position.set(0, 0, 0);
          }
          if (name.startsWith('rotate') || name === 'applyQuaternion') {
            for (const entity of mesh.instances) entity.quaternion.identity();
          }
        },
        afterAll: () => {
          if (!Number.isFinite(sink)) throw new Error('Invalid entity result');
          mesh.skeleton?.dispose();
          mesh.dispose();
        }
      });
    }
  }
  bench.add('entity/remove', () => {
    for (let i = 0; i < COUNT; i++) mesh.instances[i].remove();
  }, {
    beforeEach: () => {
      mesh = createMesh(COUNT, true);
      seedInstances(mesh);
    },
    afterEach: () => {
      if (mesh.instancesCount !== 0) throw new Error('Entity removal lost count');
      mesh.dispose();
    }
  });
}
