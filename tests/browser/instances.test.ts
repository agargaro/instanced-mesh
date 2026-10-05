import { afterEach, beforeEach, expect, test } from 'vitest';
import { Box3, Color, Euler, Matrix4, MeshBasicMaterial, Object3D, PlaneGeometry, Quaternion, Sphere, Vector3 } from 'three';
import { InstancedMesh2 } from '../../src/index.js';
import { createTestScene, expectNumbers, renderedIds, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

test('rejects missing constructor inputs and uses default capacity', () => {
  const mesh = ctx.mesh({ capacity: 0 });
  expect(mesh.capacity).toBe(1000);
  expect(mesh.instancesCount).toBe(0);
  expect(() => new InstancedMesh2(null, mesh.material)).toThrow('geometry');
  expect(() => new InstancedMesh2(mesh.geometry, null)).toThrow('material');
});

test.each([false, true])('adds, removes, reuses and updates active instances (entities=%s)', (createEntities) => {
  const mesh = ctx.mesh({ createEntities, capacity: 2 });
  expect(mesh.addInstances(3, (entity, id) => entity.position.set(id, 2, 3))).toBe(mesh);
  expect(mesh.capacity).toBeGreaterThanOrEqual(3);
  expect(mesh.instancesCount).toBe(3);
  expect(mesh.getPositionAt(2).toArray()).toEqual([2, 2, 3]);
  expect(mesh.removeInstances(1, 1, 99)).toBe(mesh);
  expect(mesh.instancesCount).toBe(2);
  const visited: number[] = [];
  expect(mesh.updateInstances((entity, id) => {
    visited.push(id);
    entity.position.set(id, 0, 0);
    entity.scale.set(2, 3, 4);
  })).toBe(mesh);
  expect(visited).toEqual([0, 2]);
  expect(mesh.updateInstancesPosition((entity, id) => entity.position.set(id + 1, 2, 3))).toBe(mesh);
  expect(mesh.getMatrixAt(2).elements).toEqual(new Matrix4().makeScale(2, 3, 4).setPosition(3, 2, 3).elements);
  const reused: number[] = [];
  mesh.addInstances(1, (_entity, id) => reused.push(id));
  expect(reused).toEqual([1]);
  expect(mesh.getMatrixAt(1).elements).toEqual(new Matrix4().elements);
  mesh.removeInstances(2, 1);
  expect(mesh.instancesCount).toBe(1);
  mesh.resizeBuffers(1);
  expect(mesh.capacity).toBe(1);
  expect(mesh.clearInstances()).toBe(mesh);
  expect(mesh.instancesCount).toBe(0);
  ctx.render();
  expect(mesh.count).toBe(0);
  mesh.addInstances(1);
  expect(mesh.getMatrixAt(0).elements).toEqual(new Matrix4().elements);
});

test.each([-1, 1.5, NaN, Infinity])('rejects invalid capacity %s without changing data', (capacity) => {
  const mesh = ctx.mesh();
  mesh.addInstances(1);
  const data = mesh.matricesTexture._data;
  expect(() => mesh.resizeBuffers(capacity)).toThrow(RangeError);
  expect(mesh.capacity).toBe(4);
  expect(mesh.matricesTexture._data).toBe(data);
});

test('shrinking protects active IDs; regrowing preserves matrices, colors and uniforms on the GPU', () => {
  const mesh = ctx.mesh({ capacity: 8 });
  mesh.addInstances(8, (entity, id) => entity.position.set(id === 7 ? 0.5 : 10, 0, 0));
  mesh.setColorAt(7, 0xff0000);
  mesh.initUniformsPerInstance({ fragment: { amount: 'float' } });
  mesh.setUniformAt(7, 'amount', 0.75);
  mesh.removeInstances(0, 1, 2, 3, 4, 5, 6);
  expect(() => mesh.resizeBuffers(1)).toThrow('active instance IDs');
  ctx.render();
  ctx.pixel(48, [255, 0, 0]);
  mesh.resizeBuffers(32);
  expect(mesh.getUniformAt(7, 'amount')).toBe(0.75);
  expect(mesh.getColorAt(7).getHex()).toBe(0xff0000);
  ctx.render();
  ctx.pixel(48, [255, 0, 0]);
  mesh.clearInstances();
  mesh.resizeBuffers(0);
  expect(mesh.capacity).toBe(0);
  mesh.addInstances(1, (entity) => entity.position.set(-0.5, 0, 0));
  ctx.render();
  expect(mesh.count).toBe(1);
});

test('visibility and activity select the uploaded instance indices', () => {
  const mesh = ctx.mesh();
  mesh.addInstances(4);
  mesh.perObjectFrustumCulled = false;
  expect(mesh.perObjectFrustumCulled).toBe(false);
  mesh.setVisibilityAt(1, false);
  mesh.setActiveAt(2, false);
  mesh.setActiveAndVisibilityAt(3, false);
  ctx.render();
  expect(renderedIds(mesh)).toEqual([0]);
  expect(mesh.getActiveAndVisibilityAt(1)).toBe(false);
  expect(mesh.getVisibilityAt(1)).toBe(false);
  expect(mesh.getActiveAt(2)).toBe(false);
  ctx.render();
  expect(renderedIds(mesh)).toEqual([0]);
  mesh.setActiveAndVisibilityAt(3, true);
  ctx.render();
  expect(renderedIds(mesh)).toEqual([0, 3]);
});

test.each([false, true])('entity transforms agree with Object3D (Euler=%s)', (allowsEuler) => {
  const mesh = ctx.mesh({ createEntities: true, allowsEuler });
  mesh.addInstances(1);
  const entity = mesh.instances[0];
  const reference = new Object3D();
  const q = new Quaternion().setFromEuler(new Euler(0.2, -0.4, 0.3));
  entity.applyQuaternion(q).rotateX(0.3).rotateY(0.4).rotateZ(-0.2);
  reference.applyQuaternion(q).rotateX(0.3).rotateY(0.4).rotateZ(-0.2);
  entity.rotateOnWorldAxis(new Vector3(0, 1, 0), 0.1).translateX(1).translateY(2).translateZ(3);
  reference.rotateOnWorldAxis(new Vector3(0, 1, 0), 0.1).translateX(1).translateY(2).translateZ(3);
  entity.scale.set(-2, 3, 4);
  reference.scale.copy(entity.scale);
  entity.updateMatrix();
  reference.updateMatrix();
  expectNumbers(entity.matrix.elements, reference.matrix.elements);
  const applied = new Matrix4().makeTranslation(5, 0, 0);
  entity.applyMatrix4(applied);
  reference.applyMatrix4(applied);
  entity.updateMatrix();
  reference.updateMatrix();
  expectNumbers(entity.matrix.elements, reference.matrix.elements);
  const copy = new Object3D();
  entity.copyTo(copy);
  copy.updateMatrix();
  expectNumbers(copy.matrix.elements, reference.matrix.elements);
  mesh.copyTo(0, copy);
  copy.updateMatrix();
  expectNumbers(copy.matrix.elements, reference.matrix.elements);
  mesh.position.set(2, 1, 0);
  mesh.updateMatrixWorld();
  expectNumbers(entity.matrixWorld.elements, reference.matrix.clone().premultiply(mesh.matrixWorld).elements);
  if (allowsEuler) {
    entity.rotation.set(0.1, 0.2, 0.3, 'ZYX');
    expectNumbers(entity.quaternion.toArray(), new Quaternion().setFromEuler(entity.rotation).toArray());
    entity.quaternion.identity();
    expectNumbers(entity.rotation.toArray().slice(0, 3) as number[], [0, 0, 0]);
  }
  entity.visible = false;
  entity.active = false;
  expect(entity.visible).toBe(false);
  expect(entity.active).toBe(false);
  entity.active = true;
  entity.color = new Color(0x00ff00);
  entity.opacity = 0.25;
  expect(entity.color.getHex()).toBe(0x00ff00);
  expect(entity.opacity).toBe(0.25);
  expect(entity.remove()).toBe(entity);
  expect(mesh.instancesCount).toBe(0);
});

test('bounds match independently transformed geometry and ignore deleted instances', () => {
  const mesh = ctx.mesh();
  mesh.geometry.translate(0.3, -0.2, 0.1);
  mesh.addInstances(3, (entity, id) => {
    entity.position.set(id * 2, -id, id);
    entity.scale.set(-2, 3, 0.5);
    entity.quaternion.setFromEuler(new Euler(0.2, 0.3, 0.4));
  });
  mesh.removeInstances(1);
  mesh.setVisibilityAt(2, false);
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
  const box = new Box3();
  const sphere = new Sphere();
  for (const id of [0, 2]) {
    const matrix = mesh.getMatrixAt(id, new Matrix4());
    box.union(mesh.geometry.boundingBox.clone().applyMatrix4(matrix));
    sphere.union(mesh.geometry.boundingSphere.clone().applyMatrix4(matrix));
  }
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  expectNumbers(mesh.boundingBox.min.toArray(), box.min.toArray());
  expectNumbers(mesh.boundingBox.max.toArray(), box.max.toArray());
  expectNumbers(mesh.boundingSphere.center.toArray(), sphere.center.toArray());
  expect(mesh.boundingSphere.radius).toBeCloseTo(sphere.radius);
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  mesh.clearInstances();
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  expect(mesh.boundingBox.isEmpty()).toBe(true);
  expect(mesh.boundingSphere.isEmpty()).toBe(true);
});

test('initializes renderer buffers lazily and isolates reused geometry', () => {
  const mesh = ctx.mesh({ renderer: undefined });
  mesh.addInstances(1);
  expect(mesh.instanceIndex).toBeNull();
  ctx.render();
  expect(mesh.instanceIndex).not.toBeNull();
  ctx.render();
  ctx.pixel(32, [255, 255, 255]);
  const other = ctx.mesh({}, mesh.geometry, new MeshBasicMaterial({ color: 0xff0000 }));
  other.addInstances(1, (entity) => entity.position.set(0.5, 0, 0));
  expect(other.geometry).not.toBe(mesh.geometry);
  expect(other.instanceIndex).not.toBe(mesh.instanceIndex);
  other.geometry = mesh.geometry;
  expect(other.geometry.getAttribute('instanceIndex')).toBe(other.instanceIndex);
  const sameGeometry = other.geometry;
  other.geometry = sameGeometry;
  ctx.render();
  ctx.pixel(48, [255, 0, 0]);
});

test('large capacity growth accommodates every requested instance', () => {
  const mesh = ctx.mesh({ capacity: 1 });
  mesh.addInstances(3000);
  expect(mesh.capacity).toBeGreaterThanOrEqual(3000);
  expect(mesh.instancesCount).toBe(3000);
  expect(mesh.getMatrixAt(2999).elements).toEqual(new Matrix4().elements);
});

test.each([false, true])('initializes multi-material meshes after their final visible group (lastVisible=%s)', (lastVisible) => {
  const geometry = new PlaneGeometry(0.6, 0.6);
  geometry.clearGroups();
  geometry.addGroup(0, 3, 0);
  geometry.addGroup(3, 3, 1);
  const materials = [new MeshBasicMaterial(), new MeshBasicMaterial({ visible: lastVisible })];
  const mesh = ctx.mesh({ renderer: undefined }, geometry, materials);
  mesh.addInstances(1);
  mesh.setColorAt(0, 0xff0000);
  ctx.render();
  expect(mesh.instanceIndex).not.toBeNull();
  ctx.render();
  expect(mesh.count).toBe(1);
  ctx.pixel(28, [255, 0, 0], 1, 36);
});

test('shrinking internal instance ranges removes BVH nodes including ranges with holes', () => {
  const mesh = ctx.mesh();
  mesh.addInstances(4);
  mesh.removeInstances(2);
  mesh.computeBVH();
  mesh.setInstancesArrayCount(1);
  expect(mesh.bvh.nodes[1]).toBeNull();
  expect(mesh.bvh.nodes[3]).toBeNull();
  expect(mesh.bvh.nodes[0]).not.toBeNull();
  const plain = ctx.mesh();
  plain.addInstances(3);
  plain.setInstancesArrayCount(1);
  expect(plain._instancesArrayCount).toBe(1);
});

test('reusing several deleted IDs resets their transforms and respects a smaller add count', () => {
  const mesh = ctx.mesh({ createEntities: true });
  mesh.addInstances(4, (entity, id) => entity.position.set(id, id, id));
  mesh.removeInstances(1, 3);
  mesh.addInstances(1);
  expect(mesh.getActiveAt(3)).toBe(true);
  expect(mesh.getActiveAt(1)).toBe(false);
  mesh.addInstances(1);
  expect(mesh.getActiveAt(1)).toBe(true);
  expect(mesh.getMatrixAt(1).elements).toEqual(new Matrix4().elements);
  expect(mesh.instancesCount).toBe(4);
});

test('disposes every allocated instance texture', () => {
  const mesh = ctx.mesh();
  mesh.addInstances(1);
  mesh.setColorAt(0, 0xff0000);
  mesh.initUniformsPerInstance({ fragment: { amount: 'float' } });
  const textures = [mesh.matricesTexture, mesh.colorsTexture, mesh.uniformsTexture];
  const disposed = new Set<unknown>();
  for (const texture of textures) texture.addEventListener('dispose', () => {
    disposed.add(texture);
  });
  mesh.dispose();
  expect(disposed.size).toBe(3);
});

test.fails('clone preserves instance data and renders independently (known SquareDataTexture clone constructor regression)', () => {
  const mesh = ctx.mesh();
  mesh.addInstances(1);
  let cloned: InstancedMesh2;
  expect(() => {
    cloned = mesh.clone(false);
  }).not.toThrow();
  try {
    expect(cloned.instancesCount).toBe(1);
    expect(cloned.getActiveAt(0)).toBe(true);
    expect(cloned.matricesTexture).not.toBe(mesh.matricesTexture);
  } finally {
    cloned?.dispose();
    cloned?.geometry.dispose();
  }
});
