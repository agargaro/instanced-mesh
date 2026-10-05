import { afterEach, beforeEach, expect, test } from 'vitest';
import { BackSide, Box3, BoxGeometry, DoubleSide, Euler, FrontSide, Frustum, Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, Quaternion, Raycaster, Vector3 } from 'three';
import { createRadixSort } from '../../src/index.js';
import { createTestScene, expectNumbers, renderedIds, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

test.each([false, true])('culls visible active instances and honors callbacks (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh();
  mesh.addInstances(4, (entity, id) => entity.position.set([-0.5, 0.5, 10, 0][id], 0, 0));
  mesh.setVisibilityAt(3, false);
  if (withBVH) mesh.computeBVH({ margin: 0.2 });
  ctx.render();
  expect(renderedIds(mesh).sort()).toEqual([0, 1]);
  const visited: number[] = [];
  mesh.onFrustumEnter = (id, camera): boolean => {
    expect(camera).toBe(ctx.camera);
    visited.push(id);
    return id === 1;
  };
  ctx.render();
  expect(visited.sort()).toEqual([0, 1]);
  expect(renderedIds(mesh)).toEqual([1]);
  mesh.removeInstances(1);
  ctx.render();
  expect(mesh.count).toBe(0);
});

test.each([false, true])('linear culling agrees with transformed sphere reference (centered=%s)', (centered) => {
  const geometry = new BoxGeometry(0.2, 0.3, 0.4);
  if (!centered) geometry.translate(0.3, -0.2, 0.1);
  const mesh = ctx.mesh({ capacity: 40 }, geometry);
  mesh.position.set(0.2, 0, 0);
  mesh.addInstances(40, (entity, id) => {
    entity.position.set(Math.sin(id * 1.7) * 3, Math.cos(id * 0.4) * 3, -id / 10);
    entity.scale.set(0.5 + id % 3, 0.6, -0.8);
    entity.quaternion.setFromEuler(new Euler(id / 10, 0.2, 0.3));
  });
  mesh.setVisibilityAt(4, false);
  mesh.removeInstances(7);
  ctx.render();
  const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(ctx.camera.projectionMatrix, ctx.camera.matrixWorldInverse).multiply(mesh.matrixWorld));
  const expected: number[] = [];
  for (let id = 0; id < 40; id++) {
    if (!mesh.getActiveAndVisibilityAt(id)) continue;
    const sphere = geometry.boundingSphere.clone().applyMatrix4(mesh.getMatrixAt(id));
    if (frustum.intersectsSphere(sphere)) expected.push(id);
  }
  expect(renderedIds(mesh)).toEqual(expected);
});

test.each([false, true])('sorts near/far and custom order with and without culling (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh();
  mesh.addInstances(3, (entity, id) => entity.position.set(0, 0, [-2, 0, -1][id]));
  if (withBVH) mesh.computeBVH();
  mesh.sortObjects = true;
  expect(mesh.sortObjects).toBe(true);
  for (const culling of [true, false]) {
    mesh.perObjectFrustumCulled = culling;
    (mesh.material as any).transparent = false;
    ctx.render();
    expect(renderedIds(mesh)).toEqual([1, 2, 0]);
    (mesh.material as any).transparent = true;
    ctx.render();
    expect(renderedIds(mesh)).toEqual([0, 2, 1]);
    mesh.customSort = (items): void => {
      items.sort((a, b) => a.index - b.index);
    };
    ctx.render();
    expect(renderedIds(mesh)).toEqual([0, 1, 2]);
    mesh.customSort = null;
  }
  mesh.customSort = createRadixSort(mesh);
  mesh.resizeBuffers(32);
  ctx.render();
  expect(renderedIds(mesh)).toEqual([0, 2, 1]);
  const gl = ctx.renderer.getContext() as WebGL2RenderingContext;
  const uploaded = new Uint32Array(mesh.count);
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instanceIndex.buffer);
  gl.getBufferSubData(gl.ARRAY_BUFFER, 0, uploaded);
  expect(Array.from(uploaded)).toEqual([0, 2, 1]);
});

test.each([false, true])('raycasting matches separate three.js meshes, visibility and near/far (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh();
  mesh.addInstances(3, (entity, id) => entity.position.set(id === 2 ? 3 : 0, 0, -id));
  if (withBVH) mesh.computeBVH();
  ctx.render();
  const ray = new Raycaster(new Vector3(0.07, 0.03, 5), new Vector3(0, 0, -1));
  const expected = [0, 1].flatMap((id) => {
    const reference = new Mesh(mesh.geometry, mesh.material);
    reference.matrixAutoUpdate = false;
    reference.matrix.copy(mesh.getMatrixAt(id));
    reference.updateMatrixWorld(true);
    return ray.intersectObject(reference).map((hit) => ({ id, distance: hit.distance, point: hit.point.toArray() }));
  }).sort((a, b) => a.distance - b.distance);
  const hits = ray.intersectObject(mesh);
  expect(hits.map((hit) => hit.instanceId)).toEqual(expected.map((hit) => hit.id));
  for (let i = 0; i < hits.length; i++) {
    expect(hits[i].object).toBe(mesh);
    expect(hits[i].distance).toBeCloseTo(expected[i].distance);
    expectNumbers(hits[i].point.toArray(), expected[i].point);
  }
  mesh.setVisibilityAt(0, false);
  expect(ray.intersectObject(mesh).map((hit) => hit.instanceId)).toEqual([1]);
  ray.near = 5.5;
  ray.far = 6;
  const originalRay = ray.ray;
  expect(ray.intersectObject(mesh).map((hit) => hit.instanceId)).toEqual([1]);
  expect(ray.ray).toBe(originalRay);
  expect(ray.near).toBe(5.5);
  expect(ray.far).toBe(6);
  ray.far = 5.6;
  expect(ray.intersectObject(mesh)).toEqual([]);
  mesh.removeInstances(1);
  expect(ray.intersectObject(mesh)).toEqual([]);
});

test('raycastOnlyFrustum limits linear raycasting; BVH includes instances outside the camera', () => {
  const mesh = ctx.mesh();
  mesh.addInstances(2, (entity, id) => entity.position.set(id * 3, 0, 0));
  mesh.raycastOnlyFrustum = true;
  ctx.render();
  const ray = new Raycaster(new Vector3(3.07, 0.03, 5), new Vector3(0, 0, -1));
  expect(ray.intersectObject(mesh)).toEqual([]);
  mesh.raycastOnlyFrustum = false;
  expect(ray.intersectObject(mesh).map((hit) => hit.instanceId)).toEqual([1]);
  mesh.raycastOnlyFrustum = true;
  mesh.computeBVH();
  expect(ray.intersectObject(mesh).map((hit) => hit.instanceId)).toEqual([1]);
  mesh.disposeBVH();
  expect(mesh.bvh).toBeNull();
  mesh.clearInstances();
  expect(ray.intersectObject(mesh)).toEqual([]);
});

test.each([0, 0.2])('BVH tracks movement, removal, rebuild and box intersections (margin=%s)', (margin) => {
  const mesh = ctx.mesh({ createEntities: true });
  mesh.addInstances(3, (entity, id) => entity.position.set(id * 2, 0, 0));
  mesh.computeBVH({ margin });
  const bvh = mesh.bvh;
  const intersections: number[] = [];
  expect(bvh.intersectBox(new Box3(new Vector3(-0.3, -0.3, -0.3), new Vector3(0.3, 0.3, 0.3)), (id) => {
    intersections.push(id);
    return true;
  })).toBe(true);
  expect(intersections).toEqual([0]);
  expect(bvh.intersectBox(new Box3(new Vector3(20, 20, 20), new Vector3(21, 21, 21)), () => false)).toBe(false);
  mesh.instances[0].position.x = 10;
  mesh.instances[0].updateMatrix();
  const ids: number[] = [];
  bvh.raycast(new Raycaster(new Vector3(10, 0, 3), new Vector3(0, 0, -1)), (id) => {
    ids.push(id);
  });
  expect(ids).toEqual([0]);
  mesh.autoUpdateBVH = false;
  mesh.instances[0].position.x = 11;
  mesh.instances[0].updateMatrixPosition();
  mesh.autoUpdateBVH = true;
  mesh.instances[0].position.x = 12;
  mesh.instances[0].updateMatrixPosition();
  expect(bvh.nodes[0].box[0]).toBeLessThanOrEqual(11.75);
  expect(bvh.nodes[0].box[1]).toBeGreaterThanOrEqual(12.25);
  mesh.removeInstances(1);
  bvh.move(1);
  bvh.delete(1);
  expect(bvh.nodes[1]).toBeNull();
  mesh.computeBVH();
  expect(mesh.bvh).toBe(bvh);
  expect(bvh.nodes[1]).toBeNull();
  bvh.clear();
  expect(bvh.nodes.every((node) => node === null)).toBe(true);
  bvh.insertRange([0, 2]);
  expect(bvh.nodes[0].object).toBe(0);
  expect(bvh.nodes[2].object).toBe(2);
  mesh.clearInstances();
  expect(bvh.nodes.every((node) => node === null)).toBe(true);
});

test.each([false, true])('BVH bounds agree with reference bounds (sphere=%s)', (getBBoxFromBSphere) => {
  const mesh = ctx.mesh({}, new BoxGeometry(0.2, 0.3, 0.4));
  mesh.addInstances(1);
  mesh.computeBVH({ getBBoxFromBSphere });
  for (let i = 0; i < 25; i++) {
    const matrix = new Matrix4().compose(new Vector3(i / 7, -i / 3, i / 9), new Quaternion().setFromEuler(new Euler(i / 10, 0.2, 0.3)), new Vector3(-2, 3, 0.5));
    mesh.setMatrixAt(0, matrix);
    const stored = mesh.getMatrixAt(0, new Matrix4());
    const sphere = getBBoxFromBSphere ? mesh.geometry.boundingSphere.clone().applyMatrix4(stored) : null;
    const box = sphere ? sphere.getBoundingBox(new Box3()) : mesh.geometry.boundingBox.clone().applyMatrix4(stored);
    expectNumbers(mesh.bvh.nodes[0].box, [box.min.x, box.max.x, box.min.y, box.max.y, box.min.z, box.max.z]);
  }
});

test('BVH falls back to precise boxes for geometry away from the origin', () => {
  const mesh = ctx.mesh({}, new BoxGeometry().translate(10, 0, 0));
  mesh.addInstances(1);
  mesh.computeBVH({ getBBoxFromBSphere: true });
  expectNumbers(mesh.bvh.nodes[0].box, [9.5, 10.5, -0.5, 0.5, -0.5, 0.5]);
});

test.each([true, false])('BVH margin culling distinguishes accurate and conservative bounds (%s)', (accurateCulling) => {
  const mesh = ctx.mesh({}, new BoxGeometry(0.1, 0.1, 0.1));
  mesh.addInstances(1, (entity) => entity.position.set(1.2, 0, 0));
  mesh.computeBVH({ margin: 0.5, accurateCulling });
  mesh.updateMatrixWorld(true);
  mesh.performFrustumCulling(ctx.camera);
  expect(mesh.count).toBe(accurateCulling ? 0 : 1);
});

test('raycaster parameters survive a scaled mesh transform', () => {
  const mesh = ctx.mesh();
  mesh.addInstances(1);
  mesh.scale.setScalar(2);
  mesh.position.x = 1;
  mesh.updateMatrixWorld();
  const ray = new Raycaster(new Vector3(1.07, 0.03, 5), new Vector3(0, 0, -1), 4, 6);
  const original = ray.ray;
  expect(ray.intersectObject(mesh).map((hit) => hit.instanceId)).toEqual([0]);
  expect(ray.ray).toBe(original);
  expect(ray.near).toBe(4);
  expect(ray.far).toBe(6);
});

test('BVH insertion after creation and growth initializes nodes for reused IDs', () => {
  const mesh = ctx.mesh({ capacity: 2 });
  mesh.addInstances(2);
  mesh.computeBVH();
  mesh.removeInstances(1);
  mesh.addInstances(1);
  expect(mesh.bvh.nodes[1].object).toBe(1);
  mesh.addInstances(5, (entity, id) => entity.position.set(id, 0, 0));
  expect(mesh.bvh.nodes.length).toBe(mesh.capacity);
  expect(mesh.bvh.nodes[6].object).toBe(6);
  mesh.clearInstances();
  mesh.resizeBuffers(1);
  expect(mesh.bvh.nodes.length).toBe(1);
});

test.each([false, true].flatMap((bvh) => [FrontSide, BackSide, DoubleSide].map((side) => ({ bvh, side }))))('group raycasting respects draw ranges and material sides (BVH=$bvh, side=$side)', ({ bvh, side }) => {
  const geometry = new PlaneGeometry(0.6, 0.6);
  geometry.clearGroups();
  geometry.addGroup(3, 3, 1);
  geometry.addGroup(0, 3, 0);
  const materials = [new MeshBasicMaterial({ side }), new MeshBasicMaterial({ side: DoubleSide })];
  const mesh = ctx.mesh({}, geometry, materials);
  mesh.addInstances(2, (entity, id) => entity.position.x = id ? 0.5 : -0.5);
  mesh.raycastOnlyFrustum = false;
  if (bvh) mesh.computeBVH();
  for (const [start, count] of [[0, 6], [0, 3], [3, 3], [0, 0]]) {
    mesh.geometry.setDrawRange(start, count);
    for (const z of [-2, 2]) {
      for (const x of [-0.6, -0.4, 0.4, 0.6]) {
        const ray = new Raycaster(new Vector3(x, 0.07, z), new Vector3(0, 0, -Math.sign(z)));
        const expected: { id: number; face: number; material: number; distance: number; point: number[] }[] = [];
        for (let id = 0; id < 2; id++) {
          const native = new Mesh(mesh.geometry, materials);
          native.matrixAutoUpdate = false;
          native.matrix.copy(mesh.getMatrixAt(id));
          native.updateMatrixWorld(true);
          for (const hit of ray.intersectObject(native)) expected.push({ id, face: hit.faceIndex, material: hit.face.materialIndex, distance: hit.distance, point: hit.point.toArray() });
        }
        const actual = ray.intersectObject(mesh).map((hit) => ({ id: hit.instanceId, face: hit.faceIndex, material: hit.face.materialIndex, distance: hit.distance, point: hit.point.toArray() }));
        expect(actual).toEqual(expected);
      }
    }
  }
});

test.fails.each([false, true])('raycasting transformed meshes returns world-space points and distances (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh();
  mesh.addInstances(1, (entity) => entity.position.set(0.1, 0.2, 0.3));
  mesh.position.set(0.25, -0.5, 1);
  mesh.scale.set(1.5, 0.75, 2);
  mesh.updateMatrixWorld(true);
  if (withBVH) mesh.computeBVH();
  const native = new Mesh(mesh.geometry, mesh.material);
  native.matrixAutoUpdate = false;
  native.matrix.copy(mesh.matrixWorld).multiply(mesh.getMatrixAt(0));
  native.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(0.42, -0.34, 5), new Vector3(0, 0, -1));
  const original = ray.ray;
  const expected = ray.intersectObject(native);
  const actual = ray.intersectObject(mesh);
  expect(actual.length).toBe(expected.length);
  expect(actual.length).toBeGreaterThan(0);
  expect(ray.ray).toBe(original);
  for (let i = 0; i < expected.length; i++) {
    expect(actual[i].distance).toBeCloseTo(expected[i].distance, 5);
    expectNumbers(actual[i].point.toArray(), expected[i].point.toArray());
    expect(actual[i].object).toBe(mesh);
    expect(actual[i].instanceId).toBe(0);
  }
});

function checkRaycastingAfterCulling(withBVH: boolean): void {
  const mesh = ctx.mesh();
  mesh.addInstances(3, (entity, id) => entity.position.x = (id - 1) * 3);
  mesh.raycastOnlyFrustum = false;
  if (withBVH) mesh.computeBVH();
  ctx.render();
  expect(renderedIds(mesh)).toEqual([1]);
  for (let id = 0; id < 3; id++) {
    const ray = new Raycaster(new Vector3((id - 1) * 3 + 0.05, 0.03, 5), new Vector3(0, 0, -1));
    const hits = ray.intersectObject(mesh);
    expect(hits.map((hit) => hit.instanceId)).toEqual([id]);
  }
}

test('BVH raycasting after culling neither loses IDs nor duplicates hits', () => {
  checkRaycastingAfterCulling(true);
});

test.fails('linear raycasting after culling neither loses IDs nor duplicates hits', () => {
  checkRaycastingAfterCulling(false);
});

test.each([false, true])('sorting without culling includes offscreen IDs but filters hidden and removed ones (transparent=%s)', (transparent) => {
  const mesh = ctx.mesh({}, new PlaneGeometry(0.3, 0.3), new MeshBasicMaterial({ transparent }));
  mesh.addInstances(5, (entity, id) => entity.position.set(id ? 10 : 0, 0, -id));
  mesh.setVisibilityAt(1, false);
  mesh.removeInstances(3);
  mesh.perObjectFrustumCulled = false;
  mesh.sortObjects = true;
  ctx.render();
  expect(renderedIds(mesh)).toEqual(transparent ? [4, 2, 0] : [0, 2, 4]);
  const gl = ctx.renderer.getContext() as WebGL2RenderingContext;
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instanceIndex.buffer);
  const uploaded = new Uint32Array(mesh.count);
  gl.getBufferSubData(gl.ARRAY_BUFFER, 0, uploaded);
  expect(Array.from(uploaded)).toEqual(renderedIds(mesh));
  ctx.pixel(32, [255, 255, 255]);
  mesh.setVisibilityAt(1, true);
  ctx.render();
  expect(renderedIds(mesh)).toEqual(transparent ? [4, 2, 1, 0] : [0, 1, 2, 4]);
});

test.each([false, true])('manual culling updates GPU indices when automatic culling is disabled (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({}, new PlaneGeometry(0.4, 0.4));
  mesh.addInstances(2, (entity, id) => entity.position.x = id ? 0.5 : -0.5);
  mesh.setColorAt(0, 0xff0000);
  mesh.setColorAt(1, 0x00ff00);
  if (withBVH) mesh.computeBVH();
  mesh.onFrustumEnter = (id): boolean => id === 0;
  ctx.render();
  ctx.pixel(16, [255, 0, 0]);
  ctx.pixel(48, [0, 0, 0]);
  mesh.autoUpdate = false;
  mesh.onFrustumEnter = (id): boolean => id === 1;
  ctx.render();
  expect(renderedIds(mesh)).toEqual([0]);
  ctx.pixel(16, [255, 0, 0]);
  ctx.pixel(48, [0, 0, 0]);
  mesh.performFrustumCulling(ctx.camera);
  ctx.render();
  expect(renderedIds(mesh)).toEqual([1]);
  ctx.pixel(16, [0, 0, 0]);
  ctx.pixel(48, [0, 255, 0]);
  mesh.autoUpdate = true;
  mesh.onFrustumEnter = null;
  ctx.render();
  expect(renderedIds(mesh).sort()).toEqual([0, 1]);
  ctx.pixel(16, [255, 0, 0]);
  ctx.pixel(48, [0, 255, 0]);
});

test.each([false, true])('BVH preserves precomputed geometry bounds and matches independent boxes (sphere=%s)', (sphere) => {
  const geometry = new BoxGeometry(0.3, 0.4, 0.5);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const box = geometry.boundingBox;
  const boundSphere = geometry.boundingSphere;
  const mesh = ctx.mesh({}, geometry);
  mesh.addInstances(2, (entity, id) => {
    entity.position.set(id * 0.5, -0.2, -id);
    entity.scale.set(-2, 0.5, 3);
    entity.quaternion.setFromEuler(new Euler(0.2, 0.4, -0.1));
  });
  mesh.computeBVH({ getBBoxFromBSphere: sphere });
  expect(geometry.boundingBox).toBe(box);
  expect(geometry.boundingSphere).toBe(boundSphere);
  for (let id = 0; id < 2; id++) {
    const matrix = mesh.getMatrixAt(id);
    const reference = sphere ? boundSphere.clone().applyMatrix4(matrix).getBoundingBox(new Box3()) : box.clone().applyMatrix4(matrix);
    expectNumbers(mesh.bvh.nodes[id].box, [reference.min.x, reference.max.x, reference.min.y, reference.max.y, reference.min.z, reference.max.z]);
  }
  ctx.render();
  expect(renderedIds(mesh).sort()).toEqual([0, 1]);
});
