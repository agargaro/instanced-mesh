import { Bone, Box3, Color, Intersection, Matrix3, Matrix4, Mesh, Object3D, Raycaster, Skeleton, Sphere, Vector2, Vector3, Vector4 } from 'three';
import { Bench } from 'tinybench';
import { InstancedMesh2 } from '../../src/index.js';
import { attachIndex, COUNT, createMesh, seedInstances } from '../shared.js';
import { referenceRayHits, verifyBounds, verifyRayHits } from '../verify.js';

export function registerAccessBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  const matrix = new Matrix4().makeTranslation(3, 5, 7);
  const position = new Vector3();
  const color = new Color(0.2, 0.4, 0.6);
  const target = new Object3D();
  const sphere = new Sphere();
  const center = new Vector3(1, 2, 3);
  let sink = 0;
  const operations: Record<string, () => void> = {
    getPositionAndMaxScaleOnAxisAt: () => {
      for (let i = 0; i < COUNT; i++) {
        sink += mesh.getPositionAndMaxScaleOnAxisAt(i, position);
      }
    },
    getMaxScaleOnAxisAt: () => {
      for (let i = 0; i < COUNT; i++) {
        sink += mesh.getMaxScaleOnAxisAt(i);
      }
    },
    applyMatrixAtToSphere: () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.applyMatrixAtToSphere(i, sphere, center, 2);
      }
    },
    copyTo: () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.copyTo(i, target);
      }
    },
    setVisibilityAt: () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.setVisibilityAt(i, !!(i % 2));
      }
    },
    getVisibilityAt: () => {
      for (let i = 0; i < COUNT; i++) {
        sink += Number(mesh.getVisibilityAt(i));
      }
    },
    setActiveAt: () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.setActiveAt(i, !!(i % 2));
      }
    },
    getActiveAt: () => {
      for (let i = 0; i < COUNT; i++) {
        sink += Number(mesh.getActiveAt(i));
      }
    },
    setActiveAndVisibilityAt: () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.setActiveAndVisibilityAt(i, !!(i % 2));
      }
    },
    getActiveAndVisibilityAt: () => {
      for (let i = 0; i < COUNT; i++) {
        sink += Number(mesh.getActiveAndVisibilityAt(i));
      }
    },
    setColorAt: () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.setColorAt(i, color);
      }
    },
    'setColorAt/hex': () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.setColorAt(i, 0x123456 + i % 256);
      }
    },
    getColorAt: () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.getColorAt(i, color);
      }
    },
    setOpacityAt: () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.setOpacityAt(i, i % 10 / 10);
      }
    },
    getOpacityAt: () => {
      for (let i = 0; i < COUNT; i++) {
        sink += mesh.getOpacityAt(i);
      }
    },
    'getMatrixAt/defaultTarget': () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.getMatrixAt(i);
      }
    },
    'getPositionAt/defaultTarget': () => {
      for (let i = 0; i < COUNT; i++) {
        mesh.getPositionAt(i);
      }
    }
  };
  for (const [name, operation] of Object.entries(operations)) {
    bench.add('access/' + name, operation, {
      beforeAll: () => {
        color.setRGB(0.2, 0.4, 0.6);
        mesh = createMesh();
        seedInstances(mesh);
        mesh.setColorAt(0, color);
        mesh.setOpacityAt(0, 0.5);
      },
      beforeEach: () => { sink = 0; },
      afterAll: () => {
        if (!Number.isFinite(sink)) throw new Error(name);
        mesh.dispose();
      }
    });
  }
  const values = { float: 0.5, vec2: new Vector2(1, 2), vec3: new Vector3(1, 2, 3), vec4: new Vector4(1, 2, 3, 4), mat3: new Matrix3(), mat4: matrix };
  for (const [type, value] of Object.entries(values)) {
    const readTarget = typeof value === 'number' ? undefined : value.clone();
    for (const write of [false, true]) {
      bench.add(`uniforms/${write ? 'set' : 'get'}UniformAt/${type}`, () => {
        for (let i = 0; i < COUNT; i++) {
          if (write) mesh.setUniformAt(i, 'value', value);
          else mesh.getUniformAt(i, 'value', readTarget);
        }
      }, {
        beforeAll: () => {
          mesh = createMesh();
          seedInstances(mesh);
          mesh.initUniformsPerInstance({ vertex: { value: type as keyof typeof values } });
          for (let i = 0; i < COUNT; i++) mesh.setUniformAt(i, 'value', value);
        },
        afterAll: () => mesh.dispose()
      });
    }
  }
  const morph = new Mesh();
  morph.morphTargetInfluences = [0.1, 0.2, 0.3, 0.4];
  for (const write of [false, true]) {
    bench.add(`morph/${write ? 'set' : 'get'}MorphAt/4-targets`, () => {
      for (let i = 0; i < COUNT; i++) {
        if (write) mesh.setMorphAt(i, morph);
        else mesh.getMorphAt(i, morph);
      }
    }, {
      beforeAll: () => {
        mesh = createMesh();
        seedInstances(mesh);
        for (let i = 0; i < COUNT; i++) mesh.setMorphAt(i, morph);
      },
      afterAll: () => mesh.dispose()
    });
  }
  for (const update of [false, true]) {
    bench.add(`skeleton/setBonesAt/16-bones/update=${update}`, () => {
      for (let i = 0; i < COUNT; i++) mesh.setBonesAt(i, update);
    }, {
      beforeAll: () => {
        mesh = createMesh();
        seedInstances(mesh);
        const parent = new Object3D();
        const bones = Array.from({ length: 16 }, () => new Bone());
        for (let i = 0;
          i < bones.length;
          i++) (i ? bones[i - 1] : parent).add(bones[i]);
        parent.updateMatrixWorld(true);
        mesh.initSkeleton(new Skeleton(bones));
      },
      afterAll: () => {
        mesh.skeleton.dispose();
        mesh.dispose();
      }
    });
  }
}

export function registerBoundsAndRayBenchmarks(bench: Bench): void {
  let mesh: InstancedMesh2;
  for (const name of ['computeBoundingBox', 'computeBoundingSphere'] as const) {
    bench.add(`bounds/${name}/first-call`, () => mesh[name](), {
      beforeEach: () => {
        mesh = createMesh();
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.boundingBox = null;
        mesh.geometry.boundingSphere = null;
        seedInstances(mesh);
      },
      afterEach: () => {
        verifyBounds(mesh, name === 'computeBoundingBox' ? 'box' : 'sphere');
        mesh.geometry.dispose();
        mesh.dispose();
      }
    });
  }
  for (const sparse of [false, true]) {
    for (const name of ['computeBoundingBox', 'computeBoundingSphere'] as const) {
      bench.add(`bounds/${name}/${sparse ? 'sparse' : 'dense'}`, () => mesh[name](), {
        beforeAll: () => {
          mesh = createMesh();
          seedInstances(mesh);
          if (sparse) mesh.removeInstances(...Array.from({ length: Math.floor(COUNT / 2) }, (_, i) => i * 2));
          mesh[name]();
        },
        afterAll: () => {
          verifyBounds(mesh, name === 'computeBoundingBox' ? 'box' : 'sphere');
          mesh.dispose();
        }
      });
    }
  }
  const hits: Intersection[] = [];
  let expectedHits: Intersection[];
  const ray = new Raycaster(new Vector3(0, 0, 300), new Vector3(0, 0, -1), 0, 1000);
  const box = new Box3(new Vector3(-5, -5, -5), new Vector3(50, 50, 50));
  let intersections = 0;
  const visit = (): void => {
    intersections++;
  };
  for (const bvh of [false, true]) {
    for (const hit of [false, true]) {
      bench.add(`raycast/${bvh ? 'bvh' : 'linear'}/${hit ? 'hit' : 'miss'}`, () => mesh.raycast(ray, hits), {
        beforeAll: () => {
          mesh = createMesh();
          seedInstances(mesh);
          attachIndex(mesh);
          mesh.computeBoundingSphere();
          if (bvh) mesh.computeBVH();
          ray.ray.origin.x = hit ? 0 : -1000;
          expectedHits = referenceRayHits(mesh, ray);
        },
        beforeEach: () => { hits.length = 0; },
        afterAll: () => {
          verifyRayHits(hits, expectedHits);
          mesh.dispose();
        }
      });
    }
  }
  for (const name of ['raycast', 'intersectBox'] as const) {
    let expectedCandidates: Set<number>;
    bench.add('bvh/query/' + name, () => {
      if (name === 'raycast') mesh.bvh.raycast(ray, visit);
      else mesh.bvh.intersectBox(box, () => {
        visit();
        return false;
      });
    }, {
      beforeAll: () => {
        mesh = createMesh();
        seedInstances(mesh);
        mesh.computeBVH();
        ray.ray.origin.x = 0;
        expectedCandidates = new Set();
        const matrix = new Matrix4();
        const bounds = new Box3();
        for (let i = 0; i < COUNT; i++) {
          matrix.fromArray(mesh.matricesTexture.image.data, i * 16);
          bounds.copy(mesh.geometry.boundingBox).applyMatrix4(matrix);
          if (name === 'raycast' ? ray.ray.intersectsBox(bounds) : box.intersectsBox(bounds)) expectedCandidates.add(i);
        }
      },
      beforeEach: () => { intersections = 0; },
      afterAll: () => {
        if (intersections !== expectedCandidates.size) throw new Error('Incorrect BVH candidate count: ' + name);
        const actual = new Set<number>();
        if (name === 'raycast') mesh.bvh.raycast(ray, (id) => {
          actual.add(id);
        });
        else mesh.bvh.intersectBox(box, (id) => {
          actual.add(id);
          return false;
        });
        if (actual.size !== expectedCandidates.size || [...actual].some((id) => !expectedCandidates.has(id))) throw new Error('Incorrect BVH candidate IDs: ' + name);
        mesh.dispose();
      }
    });
  }
}
