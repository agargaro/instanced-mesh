import { afterEach, beforeEach, expect, test } from 'vitest';
import { MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, PlaneGeometry } from 'three';
import { createTestScene, renderedIds, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

test.each([false, true])('renders distance LOD materials and shared texture updates (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({}, new PlaneGeometry(0.6, 0.6), new MeshBasicMaterial({ color: 0xff0000 }));
  mesh.addInstances(1);
  mesh.addLOD(new PlaneGeometry(0.6, 0.6), new MeshBasicMaterial({ color: 0x00ff00 }), 3);
  if (withBVH) mesh.computeBVH({ margin: 0.1 });
  const child = mesh.LODinfo.render.levels[1].object;
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  ctx.render(camera);
  expect(mesh.count).toBe(1);
  expect(child.count).toBe(0);
  ctx.pixel(32, [255, 0, 0]);
  camera.position.z = 4;
  ctx.render(camera);
  expect(mesh.count).toBe(0);
  expect(child.count).toBe(1);
  ctx.pixel(32, [0, 255, 0]);
  mesh.setColorAt(0, 0xffffff);
  mesh.initUniformsPerInstance({ fragment: { amount: 'float' } });
  mesh.setUniformAt(0, 'amount', 1);
  mesh.renderOrder = 5;
  expect(child.renderOrder).toBe(5);
  expect(child.matricesTexture).toBe(mesh.matricesTexture);
  expect(child.colorsTexture).toBe(mesh.colorsTexture);
  expect(child.uniformsTexture).toBe(mesh.uniformsTexture);
  expect(child.availabilityArray).toBe(mesh.availabilityArray);
  expect(child.resizeBuffers(16)).toBe(child);
  expect(mesh.capacity).toBe(16);
  expect(child.capacity).toBe(16);
  ctx.render(camera);
  ctx.pixel(32, [0, 255, 0]);
  mesh.clearInstances();
  expect(mesh.count).toBe(0);
  expect(child.count).toBe(0);
});

test.each([false, true])('selects screen-size LOD with both camera types (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ useDistanceForLOD: false }, new PlaneGeometry(0.6, 0.6), new MeshBasicMaterial({ color: 0xff0000 }));
  mesh.addInstances(1);
  mesh.addLOD(new PlaneGeometry(0.6, 0.6), new MeshBasicMaterial({ color: 0x00ff00 }), 0.2);
  if (withBVH) mesh.computeBVH();
  const child = mesh.LODinfo.render.levels[1].object;
  const perspective = new PerspectiveCamera(60, 1, 0.1, 100);
  perspective.position.z = 10;
  ctx.render(perspective);
  expect(child.count).toBe(1);
  ctx.pixel(32, [0, 255, 0]);
  perspective.position.z = 1;
  ctx.render(perspective);
  expect(mesh.count).toBe(1);
  ctx.pixel(32, [255, 0, 0]);
  const ortho = new OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
  ortho.position.z = 2;
  ctx.render(ortho);
  expect(child.count).toBe(1);
  ortho.zoom = 10;
  ortho.updateProjectionMatrix();
  ctx.render(ortho);
  expect(mesh.count).toBe(1);
  expect(child.count).toBe(0);
});

test('LOD validation rejects unsupported cameras, metrics and nested levels', () => {
  const mesh = ctx.mesh();
  expect(() => mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial())).toThrow('metric');
  expect(() => mesh.updateLOD(0, 1)).toThrow('LOD0');
  expect(() => mesh.updateLOD(1, 1)).toThrow('Render list');
  expect(() => mesh.updateShadowLOD(0, 1)).toThrow('Render list');
  expect(() => mesh.updateAllLOD([1])).toThrow('Invalid LOD list');
  expect(() => mesh.updateAllShadowLOD([1])).toThrow('Invalid LOD list');
  expect(() => mesh.removeLOD(0)).toThrow('Invalid LOD list');
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 3);
  const child = mesh.LODinfo.render.levels[1].object;
  expect(() => child.setFirstLODMetric(1)).toThrow('Cannot create LOD');
  expect(() => child.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 5)).toThrow('Cannot create LOD');
  expect(() => child.addShadowLOD(new PlaneGeometry())).toThrow('Cannot create LOD');
  expect(() => mesh.performFrustumCulling(ctx.camera)).toThrow('orthographic');
  expect(() => mesh.updateLOD(5, 1)).toThrow('empty LOD');
  expect(() => mesh.removeLOD(-1)).toThrow('OOB');
  expect(() => mesh.removeLOD(99)).toThrow('OOB');
  expect(() => mesh.removeLOD(0)).toThrow('LOD0');
  const screen = ctx.mesh({ useDistanceForLOD: false });
  expect(() => screen.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), Infinity)).toThrow('Infinity');
});

test.each([true, false])('updates metrics, hysteresis and ordering (distance=%s)', (distance) => {
  const mesh = ctx.mesh({ useDistanceForLOD: distance });
  const metrics = distance ? [3, 6] : [0.6, 0.3];
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), metrics[1]);
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), metrics[0]);
  const levels = mesh.LODinfo.render.levels;
  expect(levels.map((level) => level.metric)).toEqual([distance ? 0 : Infinity, ...metrics]);
  mesh.updateLOD(1, metrics[0], 0.1);
  expect(levels[1].hysteresis).toBe(0.1);
  mesh.updateLOD(1, NaN, NaN);
  expect(levels[1].metric).toBe(metrics[0]);
  expect(levels[1].hysteresis).toBe(0.1);
  mesh.updateAllLOD([distance ? 0 : Infinity, ...metrics], [0.2, 0.3]);
  expect(levels.slice(1).map((level) => level.hysteresis)).toEqual([0.2, 0.3]);
  mesh.updateAllLOD(undefined, 0.25);
  expect(levels.slice(1).map((level) => level.hysteresis)).toEqual([0.25, 0.25]);
  expect(() => mesh.updateAllLOD([...metrics].reverse())).toThrow(distance ? 'increasing' : 'decreasing');
  expect(mesh.getObjectLODIndex(levels, distance ? 1 : 1, false)).toBe(0);
  expect(mesh.getObjectLODIndex(levels, distance ? 100 : 0.01, true)).toBe(2);
  mesh.addShadowLOD(mesh.geometry, metrics[0]);
  mesh.addShadowLOD(levels[2].object.geometry, metrics[1]);
  mesh.updateShadowLOD(0, metrics[0], 0.1);
  mesh.updateAllShadowLOD(metrics, 0.2);
  mesh.updateAllShadowLOD(undefined, [0.3, 0.4]);
  expect(mesh.LODinfo.shadowRender.levels.map((level) => level.hysteresis)).toEqual([0.3, 0.4]);
});

test.each([false, true])('sorted distance LOD and callbacks distribute indices (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh();
  mesh.addInstances(3, (entity, id) => entity.position.set(0, 0, -id * 2));
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 3);
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 5);
  if (withBVH) mesh.computeBVH();
  mesh.sortObjects = true;
  mesh.onFrustumEnter = (id): boolean => id !== 2;
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[0], [1], []]);
  mesh.customSort = (items): void => {
    items.sort((a, b) => a.depth - b.depth);
  };
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[0], [1], []]);
  mesh.sortObjects = false;
  mesh.onFrustumEnter = (_id, view, lodView, level): boolean => {
    expect(view).toBe(camera);
    expect(lodView).toBe(camera);
    return level === 2;
  };
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[], [], [2]]);
});

test('removes LOD resources and supports retaining reusable child objects', () => {
  const mesh = ctx.mesh();
  mesh.addLOD(new PlaneGeometry(), [new MeshBasicMaterial()], 2);
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 4);
  mesh.addShadowLOD(mesh.geometry);
  mesh.addShadowLOD(mesh.LODinfo.render.levels[1].object.geometry, 2);
  const retained = mesh.LODinfo.render.levels[2].object;
  mesh.removeLOD(2, false);
  expect(mesh.children).toContain(retained);
  const removed = mesh.LODinfo.render.levels[1].object;
  let disposed = 0;
  removed.geometry.addEventListener('dispose', () => {
    disposed++;
  });
  mesh.removeLOD(1);
  expect(disposed).toBe(1);
  expect(mesh.children).not.toContain(removed);
  expect(mesh.LODinfo.objects).not.toContain(removed);
  expect(mesh.LODinfo.render).toBeNull();
  mesh.setFirstLODMetric(0);
  mesh.removeLOD(0);
  expect(mesh.LODinfo.render).toBeNull();
  expect(mesh.LODinfo.shadowRender).toBeNull();
});

test.each([false, true])('culls off-center LOD geometry with scale and callbacks (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ useDistanceForLOD: false }, new PlaneGeometry(0.6, 0.6).translate(0.2, 0, 0));
  mesh.addInstances(2, (entity, id) => {
    entity.position.set(id === 0 ? 0 : 10, 0, 0);
    entity.scale.setScalar(0.5);
  });
  mesh.addLOD(new PlaneGeometry(0.6, 0.6), new MeshBasicMaterial(), 0.5);
  if (withBVH) mesh.computeBVH({ margin: 0.2 });
  const child = mesh.LODinfo.render.levels[1].object;
  mesh.onFrustumEnter = (id): boolean => id === 0;
  ctx.render();
  expect(renderedIds(child)).toEqual([0]);
  mesh.onFrustumEnter = (): boolean => false;
  ctx.render();
  expect(child.count).toBe(0);
  expect(mesh.count).toBe(0);
});

test('distance LOD selects an instance whose bounds straddle a threshold', () => {
  const mesh = ctx.mesh();
  mesh.addInstances(1, (entity) => entity.position.z = -1);
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 3);
  mesh.computeBVH({ margin: 0.2 });
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  ctx.render(camera);
  expect(renderedIds(mesh.LODinfo.render.levels[1].object)).toEqual([0]);
  const child = mesh.LODinfo.render.levels[1].object;
  child.initUniformsPerInstance({ fragment: { ignored: 'float' } });
  expect(child.uniformsTexture).toBeNull();
});

test('removing a level disposes a single material and the child geometry', () => {
  const mesh = ctx.mesh();
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 3);
  const child = mesh.LODinfo.render.levels[1].object;
  let disposed = 0;
  (child.material as MeshBasicMaterial).addEventListener('dispose', () => {
    disposed++;
  });
  mesh.removeLOD(1);
  expect(disposed).toBe(1);
});

test.fails.each([false, true])('sorted LOD skips empty intermediate levels (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh();
  mesh.addInstances(1, (entity) => entity.position.z = -10);
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 3);
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 5);
  if (withBVH) mesh.computeBVH();
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[], [], [0]]);
  mesh.sortObjects = true;
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[], [], [0]]);
});

test.fails.each([false, true])('transparent sorting preserves distance LOD membership (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({}, new PlaneGeometry(), new MeshBasicMaterial({ transparent: true }));
  mesh.addInstances(3, (entity, id) => entity.position.z = -id * 2);
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial({ transparent: true }), 3);
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial({ transparent: true }), 5);
  if (withBVH) mesh.computeBVH();
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[0], [1], [2]]);
  mesh.sortObjects = true;
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[0], [1], [2]]);
});

for (const sorted of [false, true]) {
  const check = sorted ? test.fails : test;
  check.each([false, true])(`distance LOD includes the exact threshold and epsilon neighbors (sorted=${sorted}, BVH=%s)`, (withBVH) => {
    const mesh = ctx.mesh();
    mesh.addInstances(3, (entity, id) => entity.position.set(0, 0, [-0.9999, -1, -1.0001][id]));
    mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 3);
    if (withBVH) mesh.computeBVH();
    mesh.sortObjects = sorted;
    const camera = new PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 2;
    ctx.render(camera);
    expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object).sort())).toEqual([[0], [1, 2]]);
  });
}

test.each([false, true])('LOD metrics change between frames without stale BVH level thresholds (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh();
  mesh.addInstances(3, (entity, id) => entity.position.set((id - 1) * 0.3, 0, -id * 2));
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 3);
  mesh.addLOD(new PlaneGeometry(), new MeshBasicMaterial(), 5);
  if (withBVH) mesh.computeBVH();
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[0], [1], [2]]);
  mesh.updateAllLOD([0, 7, 9]);
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object).sort())).toEqual([[0, 1, 2], [], []]);
  mesh.updateAllLOD([0, 1, 3]);
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object).sort())).toEqual([[], [0], [1, 2]]);
  mesh.setVisibilityAt(1, false);
  mesh.removeInstances(2);
  mesh.resizeBuffers(65);
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[], [0], []]);
});
