import { afterEach, beforeEach, expect, test } from 'vitest';
import { Box3, BoxGeometry, Camera, DoubleSide, Euler, Frustum, Matrix4, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Quaternion, Raycaster, Vector3 } from 'three';
import { BVHParams, createRadixSort, InstancedMesh2 } from '../../src/index.js';
import { createTestScene, expectNumbers, renderedIds, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

function random(seed: number): () => number {
  let state = seed >>> 0;
  return (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function frustumFor(mesh: InstancedMesh2, camera: Camera): Frustum {
  mesh.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  return new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(mesh.matrixWorld));
}

function expectedVisible(mesh: InstancedMesh2, camera: Camera, boxes: boolean): number[] {
  const frustum = frustumFor(mesh, camera);
  const ids: number[] = [];
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
  for (let id = 0; id < mesh._instancesArrayCount; id++) {
    if (!mesh.getActiveAndVisibilityAt(id)) continue;
    const matrix = mesh.getMatrixAt(id, new Matrix4());
    const intersects = boxes
      ? frustum.intersectsBox(mesh.geometry.boundingBox.clone().applyMatrix4(matrix))
      : frustum.intersectsSphere(mesh.geometry.boundingSphere.clone().applyMatrix4(matrix));
    if (intersects) ids.push(id);
  }
  return ids;
}

const cullingModes = [
  { name: 'linear', config: null },
  { name: 'BVH boxes', config: {} },
  { name: 'BVH accurate margin', config: { margin: 0.125, accurateCulling: true } }
] satisfies { name: string; config: BVHParams | null }[];

test.each(cullingModes)('$name culling handles tangency and epsilon offsets at all six frustum planes', ({ config }) => {
  const mesh = ctx.mesh({ capacity: 100 }, new BoxGeometry(0.5, 0.5, 0.5));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 9);
  const positions: Vector3[] = [];
  for (const radius of [0, 0.25, Math.sqrt(3) * 0.25]) {
    for (const epsilon of [-1e-4, 0, 1e-4]) {
      const extent = 1 + radius + epsilon;
      positions.push(new Vector3(extent, 0, -5), new Vector3(-extent, 0, -5));
      positions.push(new Vector3(0, extent, -5), new Vector3(0, -extent, -5));
      positions.push(new Vector3(0, 0, -1 + radius + epsilon), new Vector3(0, 0, -9 - radius - epsilon));
    }
  }
  positions.push(new Vector3(0, 0, 0), new Vector3(0, 0, -5), new Vector3(2, 2, -5));
  mesh.addInstances(positions.length, (entity, id) => entity.position.copy(positions[id]));
  if (config) mesh.computeBVH(config);
  const expected = expectedVisible(mesh, camera, config !== null);
  mesh.performFrustumCulling(camera);
  expect(renderedIds(mesh).sort((a, b) => a - b)).toEqual(expected);
  expect(expected).toContain(positions.length - 2);
  expect(expected).not.toContain(positions.length - 3);
  expect(expected).not.toContain(positions.length - 1);
});

test.each([false, true])('point-like instances on exact frustum boundaries are included (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ capacity: 8 }, new BoxGeometry(0, 0, 0));
  const positions = [[1, 0, -5], [-1, 0, -5], [0, 1, -5], [0, -1, -5], [0, 0, -1], [0, 0, -9]];
  mesh.addInstances(6, (entity, id) => entity.position.fromArray(positions[id]));
  if (withBVH) mesh.computeBVH();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 9);
  frustumFor(mesh, camera);
  mesh.performFrustumCulling(camera);
  expect(renderedIds(mesh).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
});

test.each(cullingModes)('$name culling agrees with independent bounds across cameras, transforms and zoom changes', ({ config }) => {
  const sample = random(0xc0111);
  const mesh = ctx.mesh({ capacity: 160 }, new BoxGeometry(0.2, 0.3, 0.4).translate(0.15, -0.1, 0.05));
  mesh.position.set(-0.5, 0.3, -1);
  mesh.rotation.set(0.2, -0.3, 0.4);
  mesh.scale.set(1.5, 0.7, 2);
  mesh.addInstances(160, (entity) => {
    entity.position.set((sample() - 0.5) * 20, (sample() - 0.5) * 20, (sample() - 0.5) * 20);
    entity.scale.set(sample() * 2 - 1, sample() + 0.1, -(sample() + 0.1));
    entity.quaternion.setFromEuler(new Euler(sample(), sample(), sample()));
  });
  mesh.removeInstances(3, 17, 60, 110, 159);
  mesh.setVisibilityAt(4, false);
  mesh.setVisibilityAt(9, false);
  if (config) mesh.computeBVH(config);
  const cameras = [new PerspectiveCamera(50, 1.7, 0.5, 30), new OrthographicCamera(-4, 4, 3, -3, 0.5, 30)];
  for (const camera of cameras) {
    camera.position.set(3, 2, 6);
    camera.lookAt(0, 0, -1);
    for (const zoom of [0.5, 1, 3]) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      const expected = expectedVisible(mesh, camera, config !== null);
      mesh.performFrustumCulling(camera);
      expect(renderedIds(mesh).sort((a, b) => a - b)).toEqual(expected);
    }
  }
  mesh.onFrustumEnter = (id): boolean => id % 2 === 0;
  const expected = expectedVisible(mesh, cameras[0], config !== null).filter((id) => id % 2 === 0);
  mesh.performFrustumCulling(cameras[0]);
  expect(renderedIds(mesh).sort((a, b) => a - b)).toEqual(expected);
});

test.each([false, true])('culling recovers from empty, all hidden and removed ranges without stale indices (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ capacity: 1 });
  if (withBVH) mesh.computeBVH();
  ctx.render();
  expect(mesh.count).toBe(0);
  mesh.addInstances(5, (entity, id) => entity.position.set(id % 2 ? 10 : 0, 0, 0));
  ctx.render();
  expect(renderedIds(mesh).sort()).toEqual([0, 2, 4]);
  for (const id of [0, 2, 4]) mesh.setVisibilityAt(id, false);
  ctx.render();
  expect(renderedIds(mesh)).toEqual([]);
  mesh.removeInstances(0, 1, 2, 3, 4);
  ctx.render();
  expect(mesh.count).toBe(0);
  mesh.addInstances(2, (entity) => entity.position.set(0, 0, 0));
  ctx.render();
  expect(renderedIds(mesh).sort()).toEqual([3, 4]);
  mesh.clearInstances();
  mesh.resizeBuffers(1);
  mesh.addInstances(1);
  ctx.render();
  expect(renderedIds(mesh)).toEqual([0]);
});

test.each([false, true])('rendering updates culling as the same camera moves between frames (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh();
  mesh.addInstances(2, (entity, id) => entity.position.set(id * 3, 0, 0));
  if (withBVH) mesh.computeBVH();
  ctx.render();
  expect(renderedIds(mesh)).toEqual([0]);
  ctx.camera.position.x = 3;
  ctx.render();
  expect(renderedIds(mesh)).toEqual([1]);
  ctx.camera.position.x = 0;
  ctx.render();
  expect(renderedIds(mesh)).toEqual([0]);
});

test.each([false, true])('radix sort preserves membership and numeric depth order over seeded distributions (transparent=%s)', (transparent) => {
  const material = new MeshBasicMaterial({ transparent });
  const mesh = ctx.mesh({ capacity: 1 }, new BoxGeometry(), material);
  const sort = createRadixSort(mesh);
  const sample = random(0x50a7);
  const distributions = [
    [], [0], [3, 3, 3], [2, 1, 0, -1, -2], [-2, -1, 0, 1, 2],
    [1e30, -1e30, 0, 1e29, -1e29],
    Array.from({ length: 1024 }, () => Math.floor(sample() * 128) - 64),
    Array.from({ length: 2048 }, () => (sample() - 0.5) * 1e6)
  ];
  for (const depths of distributions) {
    mesh.resizeBuffers(Math.max(1, depths.length));
    const items = depths.map((depth, index) => ({ depth, index, depthSort: 0 }));
    const expected = [...depths].sort((a, b) => transparent ? b - a : a - b);
    const originals = new Set(items);
    sort(items);
    expect(items.map((item) => item.depth)).toEqual(expected);
    expect(new Set(items)).toEqual(originals);
    expect(items.map((item) => item.index).sort((a, b) => a - b)).toEqual(depths.map((_depth, index) => index));
    sort(items);
    expect(items.map((item) => item.depth)).toEqual(expected);
  }
  material.transparent = !transparent;
  const items = [-2, 0, 1].map((depth, index) => ({ depth, index, depthSort: 0 }));
  sort(items);
  expect(items.map((item) => item.depth)).toEqual(transparent ? [-2, 0, 1] : [1, 0, -2]);
});

test('radix sorting treats material arrays as opaque and handles close depths within the key resolution', () => {
  const mesh = ctx.mesh({}, new BoxGeometry(), [new MeshBasicMaterial({ transparent: true })]);
  const items = [1 + 2e-6, 1, 1 + 1e-6].map((depth, index) => ({ depth, index, depthSort: 0 }));
  createRadixSort(mesh)(items);
  expect(items.map((item) => item.depth)).toEqual([1, 1 + 1e-6, 1 + 2e-6]);
});

test.each([false, true])('sorted rendering filters holes and uploads numeric ordering after camera transforms (BVH=%s)', (withBVH) => {
  const sample = random(0x7a115);
  const mesh = ctx.mesh({ capacity: 256 });
  mesh.addInstances(256, (entity) => entity.position.set((sample() - 0.5) * 8, (sample() - 0.5) * 8, -sample() * 15));
  mesh.position.set(0.2, -0.3, 0);
  mesh.rotation.set(0.1, 0.4, 0.2);
  mesh.sortObjects = true;
  mesh.removeInstances(5, 20, 40, 80);
  mesh.setVisibilityAt(3, false);
  if (withBVH) mesh.computeBVH();
  const camera = new PerspectiveCamera(65, 1, 0.1, 100);
  camera.position.set(2, 1, 4);
  camera.lookAt(0, 0, -4);
  for (const transparent of [false, true]) {
    (mesh.material as MeshBasicMaterial).transparent = transparent;
    for (const custom of [false, true]) {
      mesh.customSort = custom ? createRadixSort(mesh) : null;
      ctx.render(camera);
      const expected = expectedVisible(mesh, camera, withBVH);
      const inverse = mesh.matrixWorld.clone().invert();
      const origin = new Vector3().setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inverse);
      const forward = new Vector3(0, 0, -1).transformDirection(camera.matrixWorld).transformDirection(inverse);
      const depth = (id: number): number => {
        const center = mesh.geometry.boundingSphere.center.clone().applyMatrix4(mesh.getMatrixAt(id));
        return center.sub(origin).dot(forward);
      };
      expected.sort((a, b) => transparent ? depth(b) - depth(a) : depth(a) - depth(b));
      expect(renderedIds(mesh)).toEqual(expected);
      const gl = ctx.renderer.getContext() as WebGL2RenderingContext;
      const uploaded = new Uint32Array(mesh.count);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instanceIndex.buffer);
      gl.getBufferSubData(gl.ARRAY_BUFFER, 0, uploaded);
      expect(Array.from(uploaded)).toEqual(expected);
    }
  }
});

test.each([0, 0.2])('BVH mutations preserve boxes and query membership against independent references (margin=%s)', (margin) => {
  const sample = random(0xbab1);
  const mesh = ctx.mesh({ capacity: 64, createEntities: true });
  mesh.addInstances(48, (entity) => {
    entity.position.set((sample() - 0.5) * 8, (sample() - 0.5) * 8, -sample() * 8);
    entity.scale.set(0.5 + sample(), -0.5 - sample(), 0.5 + sample());
    entity.quaternion.setFromEuler(new Euler(sample(), sample(), sample()));
  });
  mesh.computeBVH({ margin });
  for (let round = 0; round < 12; round++) {
    const removed = round % 10;
    mesh.removeInstances(removed);
    expect(mesh.bvh.nodes[removed]).toBeNull();
    mesh.addInstances(1, (entity) => entity.position.set((sample() - 0.5) * 8, 0, -sample() * 8));
    expect(mesh.bvh.nodes[removed].object).toBe(removed);
    const id = 20 + round;
    mesh.instances[id].position.add(new Vector3(0.1, -0.2, 0.3));
    mesh.instances[id].updateMatrixPosition();
    mesh.setMatrixAt(id + 1, new Matrix4().compose(new Vector3(sample(), sample(), -sample() * 5), new Quaternion().setFromEuler(new Euler(0.4, 0.7, 0.3)), new Vector3(-1, 2, 0.5)));
    frustumFor(mesh, ctx.camera);
    mesh.performFrustumCulling(ctx.camera);
    expect(renderedIds(mesh).sort((a, b) => a - b)).toEqual(expectedVisible(mesh, ctx.camera, true));
    for (let index = 0; index < 48; index++) {
      const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.getMatrixAt(index));
      const actual = mesh.bvh.nodes[index].box;
      expect(actual[0]).toBeLessThanOrEqual(box.min.x + 1e-5);
      expect(actual[1]).toBeGreaterThanOrEqual(box.max.x - 1e-5);
      expect(actual[2]).toBeLessThanOrEqual(box.min.y + 1e-5);
      expect(actual[3]).toBeGreaterThanOrEqual(box.max.y - 1e-5);
      expect(actual[4]).toBeLessThanOrEqual(box.min.z + 1e-5);
      expect(actual[5]).toBeGreaterThanOrEqual(box.max.z - 1e-5);
    }
    const query = new Box3(new Vector3(-1, -1, -6), new Vector3(1, 1, -2));
    const expected: number[] = [];
    for (let index = 0; index < 48; index++) {
      const bounds = mesh.bvh.nodes[index].box;
      const box = new Box3(new Vector3(bounds[0], bounds[2], bounds[4]), new Vector3(bounds[1], bounds[3], bounds[5]));
      if (query.intersectsBox(box)) expected.push(index);
    }
    const found: number[] = [];
    mesh.bvh.intersectBox(query, (index) => {
      found.push(index);
      return false;
    });
    expect(found.sort((a, b) => a - b)).toEqual(expected);
    const ray = new Raycaster(new Vector3(0.1, 0.1, 2), new Vector3(0, 0, -1));
    const accelerated = ray.intersectObject(mesh).map((hit) => [hit.instanceId, hit.distance]);
    const bvh = mesh.bvh;
    mesh.disposeBVH();
    mesh.computeBoundingSphere();
    mesh.perObjectFrustumCulled = false;
    mesh.performFrustumCulling(ctx.camera);
    const linear = ray.intersectObject(mesh).map((hit) => [hit.instanceId, hit.distance]);
    expect(accelerated).toEqual(linear);
    mesh.bvh = bvh;
    mesh.perObjectFrustumCulled = true;
  }
  mesh.resizeBuffers(128);
  expect(mesh.bvh.nodes.length).toBe(128);
  mesh.computeBVH();
  mesh.performFrustumCulling(ctx.camera);
  expect(renderedIds(mesh).sort((a, b) => a - b)).toEqual(expectedVisible(mesh, ctx.camera, true));
});

test('BVH movement at decimal coordinates does not accumulate bound drift', () => {
  const mesh = ctx.mesh({ capacity: 1, createEntities: true }, new BoxGeometry(1, 1, 1).translate(-1000, 0, 0));
  mesh.addInstances(1, (entity) => entity.position.set(1000.1, 0, 0));
  mesh.computeBVH();
  for (let i = 0; i < 10000; i++) mesh.instances[0].updateMatrixPosition();
  const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.getMatrixAt(0));
  expectNumbers(mesh.bvh.nodes[0].box, new Float32Array([box.min.x, box.max.x, box.min.y, box.max.y, box.min.z, box.max.z]));
});

test.each([0, 0.2])('BVH raycasting agrees with native meshes for parallel, boundary, inside and near/far rays (margin=%s)', (margin) => {
  const mesh = ctx.mesh({ capacity: 9 }, new BoxGeometry(0.5, 0.5, 0.5), new MeshBasicMaterial({ side: DoubleSide }));
  mesh.addInstances(9, (entity, id) => entity.position.set((id % 3 - 1) * 2, (Math.floor(id / 3) - 1) * 2, 0));
  mesh.setVisibilityAt(0, false);
  mesh.removeInstances(8);
  mesh.computeBVH({ margin });
  const cases = [
    { origin: [0.1, 0.1, 2], direction: [0, 0, -1], near: 0, far: Infinity },
    { origin: [0.25, 0.1, 2], direction: [0, 0, -1], near: 0, far: Infinity },
    { origin: [-0.25, -0.25, 2], direction: [0, 0, -1], near: 0, far: Infinity },
    { origin: [0, 0, 0], direction: [1, 0, 0], near: 0, far: Infinity },
    { origin: [0.1, 0.1, 0.25], direction: [0, 0, -1], near: 0, far: 0.5 },
    { origin: [-4, 0.1, 0.1], direction: [1, 0, 0], near: 0, far: Infinity },
    { origin: [0.1, -4, 0.1], direction: [0, 1, 0], near: 0, far: Infinity },
    { origin: [0.1, 0.1, 2], direction: [0, 0, -1], near: 1.75, far: 1.75 },
    { origin: [0.1, 0.1, 2], direction: [0, 0, -1], near: 0, far: 1.749 },
    { origin: [0.1, 0.1, 2], direction: [0, 0, -1], near: 2.251, far: Infinity },
    { origin: [10, 10, 2], direction: [0, 0, -1], near: 0, far: Infinity }
  ];
  for (const { origin, direction, near, far } of cases) {
    const ray = new Raycaster(new Vector3().fromArray(origin), new Vector3().fromArray(direction).normalize(), near, far);
    const expected: { id: number; distance: number; face: number; point: number[] }[] = [];
    for (let id = 0; id < 9; id++) {
      if (!mesh.getActiveAndVisibilityAt(id)) continue;
      const reference = new Mesh(mesh.geometry, mesh.material);
      reference.matrixAutoUpdate = false;
      reference.matrix.copy(mesh.getMatrixAt(id));
      reference.updateMatrixWorld(true);
      for (const hit of ray.intersectObject(reference)) expected.push({ id, distance: hit.distance, face: hit.faceIndex, point: hit.point.toArray() });
    }
    const actual = ray.intersectObject(mesh).map((hit) => ({ id: hit.instanceId, distance: hit.distance, face: hit.faceIndex, point: hit.point.toArray() }));
    const compare = (a: typeof expected[number], b: typeof expected[number]): number => a.id - b.id || a.face - b.face;
    expect(actual.sort(compare)).toEqual(expected.sort(compare));
    expect(ray.near).toBe(near);
    expect(ray.far).toBe(far);
  }
});

test('BVH affine bounds match transformed corners for shear, zero scales and reflections', () => {
  const mesh = ctx.mesh({}, new BoxGeometry(0.5, 0.75, 1).translate(0.2, -0.3, 0.4));
  mesh.addInstances(1);
  mesh.computeBVH();
  const matrices = [
    new Matrix4().makeScale(0, 0, 0),
    new Matrix4().makeScale(0, -2, 3).setPosition(0.1, 0.2, 0.3),
    new Matrix4().set(1, 0.7, -0.2, 1.1, 0.4, -2, 0.3, -2.2, -0.6, 0.2, 0.5, 3.3, 0, 0, 0, 1)
  ];
  for (const matrix of matrices) {
    mesh.setMatrixAt(0, matrix);
    const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.getMatrixAt(0));
    expectNumbers(mesh.bvh.nodes[0].box, new Float32Array([box.min.x, box.max.x, box.min.y, box.max.y, box.min.z, box.max.z]));
  }
});

test.each([0, 0.2])('sphere-derived BVH boxes use maximum absolute scale during culling (margin=%s)', (margin) => {
  const sample = random(0x5fea);
  const mesh = ctx.mesh({ capacity: 64 });
  mesh.addInstances(64, (entity) => {
    entity.position.set((sample() - 0.5) * 6, (sample() - 0.5) * 6, -sample() * 6);
    entity.scale.set(-sample() * 2, sample(), sample() * 3);
    entity.quaternion.setFromEuler(new Euler(sample(), sample(), sample()));
  });
  mesh.computeBVH({ margin, getBBoxFromBSphere: true });
  const frustum = frustumFor(mesh, ctx.camera);
  const expected: number[] = [];
  for (let id = 0; id < 64; id++) {
    const box = mesh.geometry.boundingSphere.clone().applyMatrix4(mesh.getMatrixAt(id)).getBoundingBox(new Box3());
    if (frustum.intersectsBox(box)) expected.push(id);
  }
  mesh.performFrustumCulling(ctx.camera);
  expect(renderedIds(mesh).sort((a, b) => a - b)).toEqual(expected);
});

test.each([false, true])('multiple meshes and cameras cannot leak the shared sorting list (BVH=%s)', (withBVH) => {
  const a = ctx.mesh();
  const b = ctx.mesh();
  a.addInstances(3, (entity, id) => entity.position.set(0, 0, -id));
  b.addInstances(2, (entity, id) => entity.position.set(3, 0, -id));
  a.sortObjects = b.sortObjects = true;
  a.frustumCulled = b.frustumCulled = false;
  if (withBVH) {
    a.computeBVH();
    b.computeBVH();
  }
  ctx.render();
  expect(renderedIds(a)).toEqual([0, 1, 2]);
  expect(renderedIds(b)).toEqual([]);
  ctx.camera.position.x = 3;
  ctx.render();
  expect(renderedIds(a)).toEqual([]);
  expect(renderedIds(b)).toEqual([0, 1]);
  ctx.camera.position.x = 0;
  ctx.render();
  expect(renderedIds(a)).toEqual([0, 1, 2]);
});
