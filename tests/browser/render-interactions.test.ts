import { afterEach, beforeEach, expect, test } from 'vitest';
import { AmbientLight, Material, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshNormalMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene } from 'three';
import { createTestScene, renderedIds, TestScene } from './helpers.js';

let ctx: TestScene;
const extraMaterials: Material[] = [];
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.scene.overrideMaterial = null;
  ctx.dispose();
  for (const material of extraMaterials) material.dispose();
  extraMaterials.length = 0;
});

function pixels(): Uint8Array {
  const data = new Uint8Array(64 * 64 * 4);
  ctx.renderer.readRenderTargetPixels(ctx.target, 0, 0, 64, 64, data);
  return data;
}

function expectImage(actual: Uint8Array, expected: Uint8Array): void {
  let maximum = 0;
  let differences = 0;
  for (let i = 0; i < actual.length; i++) {
    const difference = Math.abs(actual[i] - expected[i]);
    maximum = Math.max(maximum, difference);
    if (difference > 1) differences++;
  }
  expect({ maximum, differences }).toEqual({ maximum: expect.any(Number), differences: 0 });
  expect(maximum).toBeLessThanOrEqual(1);
}

function groupedPlane(): PlaneGeometry {
  const geometry = new PlaneGeometry(0.7, 0.7);
  geometry.clearGroups();
  geometry.addGroup(0, 3, 0);
  geometry.addGroup(3, 3, 1);
  return geometry;
}

test.each([false, true])('renderOrder controls overlapping opaque and transparent draws (multimaterial=%s)', (multi) => {
  for (const transparent of [false, true]) {
    const red = new MeshBasicMaterial({ color: 0xff0000, transparent, opacity: transparent ? 0.5 : 1, depthTest: false, depthWrite: false });
    const blue = new MeshBasicMaterial({ color: 0x0000ff, transparent, opacity: transparent ? 0.5 : 1, depthTest: false, depthWrite: false });
    const a = ctx.mesh({}, groupedPlane(), multi ? [red, red] : red);
    const b = ctx.mesh({}, groupedPlane(), multi ? [blue, blue] : blue);
    a.addInstances(1);
    b.addInstances(1);
    for (const reverse of [false, true, false]) {
      a.renderOrder = reverse ? 2 : -2;
      b.renderOrder = 0;
      ctx.render();
      ctx.pixel(28, transparent ? reverse ? [128, 0, 64] : [64, 0, 128] : reverse ? [255, 0, 0] : [0, 0, 255], 2, 36);
      ctx.pixel(36, transparent ? reverse ? [128, 0, 64] : [64, 0, 128] : reverse ? [255, 0, 0] : [0, 0, 255], 2, 28);
    }
    a.visible = b.visible = false;
  }
});

test('opaque draws precede transparent draws regardless of renderOrder', () => {
  const opaque = ctx.mesh({}, new PlaneGeometry(0.7, 0.7), new MeshBasicMaterial({ color: 0xff0000, depthTest: false, depthWrite: false }));
  const transparent = ctx.mesh({}, new PlaneGeometry(0.7, 0.7), new MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5, depthTest: false, depthWrite: false }));
  opaque.addInstances(1);
  transparent.addInstances(1);
  opaque.renderOrder = 100;
  transparent.renderOrder = -100;
  ctx.render();
  expect(opaque.count).toBe(1);
  expect(transparent.count).toBe(1);
  ctx.pixel(32, [128, 0, 128], 2);
});

test.each([false, true])('sorting overlapping colored instances produces correct opaque/transparent pixels (BVH=%s)', (withBVH) => {
  const material = new MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false });
  const mesh = ctx.mesh({}, new PlaneGeometry(0.7, 0.7), material);
  mesh.addInstances(2, (entity, id) => entity.position.z = id ? -1 : 0);
  mesh.setColorAt(0, 0xff0000);
  mesh.setColorAt(1, 0x0000ff);
  mesh.sortObjects = true;
  if (withBVH) mesh.computeBVH();
  ctx.render();
  expect(renderedIds(mesh)).toEqual([1, 0]);
  ctx.pixel(32, [128, 0, 64], 2);
  material.transparent = false;
  material.opacity = 1;
  material.depthWrite = true;
  material.needsUpdate = true;
  ctx.render();
  expect(renderedIds(mesh)).toEqual([0, 1]);
  ctx.pixel(32, [255, 0, 0]);
});

const overrides = [
  { name: 'basic', create: (): Material => new MeshBasicMaterial({ color: 0x0000ff }) },
  { name: 'normal', create: (): Material => new MeshNormalMaterial() },
  { name: 'depth', create: (): Material => new MeshDepthMaterial() },
  { name: 'standard', create: (): Material => new MeshStandardMaterial({ color: 0x00ff00 }) }
];

test.each(overrides)('$name override material matches native meshes and restores shared hooks across groups', ({ create }) => {
  const base = new MeshBasicMaterial({ color: 0xff0000 });
  const a = ctx.mesh({}, groupedPlane(), [base, base]);
  const b = ctx.mesh({}, new PlaneGeometry(0.3, 0.3), new MeshBasicMaterial({ color: 0x00ff00 }));
  a.addInstances(1, (entity) => entity.position.x = -0.5);
  a.setColorAt(0, 0xffffff);
  a.initUniformsPerInstance({ fragment: { unused: 'float' } });
  a.setUniformAt(0, 'unused', 0.25);
  b.addInstances(1, (entity) => entity.position.x = 0.5);
  const regular = new Mesh(new PlaneGeometry(0.2, 0.2), base);
  regular.position.y = 0.65;
  ctx.scene.add(regular);
  const light = new AmbientLight(0xffffff, 1);
  ctx.scene.add(light);
  const override = create();
  extraMaterials.push(override);
  override.defines = { CUSTOM_TEST_DEFINE: 1 };
  const compile = override.onBeforeCompile;
  const key = override.customProgramCacheKey;
  const defines = override.defines;
  const propertiesGet = ctx.renderer.properties.get;
  const reference = new Scene();
  reference.add(light.clone());
  reference.overrideMaterial = override;
  const referenceA = new Mesh(a.geometry, base);
  referenceA.position.x = -0.5;
  const referenceB = new Mesh(b.geometry, b.material);
  referenceB.position.x = 0.5;
  reference.add(referenceA, referenceB, regular.clone());
  try {
    for (const reverse of [false, true, false]) {
      a.renderOrder = reverse ? 3 : -3;
      b.renderOrder = reverse ? -3 : 3;
      regular.renderOrder = 0;
      referenceA.renderOrder = a.renderOrder;
      referenceB.renderOrder = b.renderOrder;
      ctx.scene.overrideMaterial = override;
      ctx.render();
      const actual = pixels();
      expect(override.onBeforeCompile).toBe(compile);
      expect(override.customProgramCacheKey).toBe(key);
      expect(override.defines).toBe(defines);
      expect(defines).toEqual({ CUSTOM_TEST_DEFINE: 1 });
      expect(ctx.renderer.properties.get).toBe(propertiesGet);
      ctx.renderer.render(reference, ctx.camera);
      expectImage(actual, pixels());
      ctx.scene.overrideMaterial = null;
      ctx.render();
      ctx.pixel(16, [255, 0, 0]);
      ctx.pixel(48, [0, 255, 0]);
      ctx.pixel(32, [255, 0, 0], 1, 52);
    }
  } finally {
    regular.geometry.dispose();
  }
});

test.each([false, true])('mixed visible opaque/transparent groups retain native group rendering (lazy=%s)', (lazy) => {
  const geometry = groupedPlane();
  const materials = [new MeshBasicMaterial({ color: 0xff0000 }), new MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5, depthWrite: false })];
  const mesh = ctx.mesh({ renderer: lazy ? undefined : ctx.renderer }, geometry, materials);
  mesh.addInstances(1, (entity) => entity.position.x = 0.25);
  const reference = new Scene();
  const native = new Mesh(mesh.geometry, materials);
  native.position.x = 0.25;
  reference.add(native);
  for (const visible of [[true, true], [false, true], [true, false], [false, false], [true, true]]) {
    materials[0].visible = visible[0];
    materials[1].visible = visible[1];
    ctx.render();
    ctx.render();
    const actual = pixels();
    ctx.renderer.render(reference, ctx.camera);
    expectImage(actual, pixels());
  }
});

test.each([false, true])('LOD renderOrder affects pixels and follows parent updates (transparent=%s)', (transparent) => {
  const lodMaterial = new MeshBasicMaterial({ color: 0xff0000, transparent, opacity: transparent ? 0.5 : 1, depthTest: false, depthWrite: false });
  const mesh = ctx.mesh({}, new PlaneGeometry(1, 1), lodMaterial);
  mesh.addInstances(1);
  mesh.addLOD(new PlaneGeometry(1, 1), lodMaterial, 3);
  const blocker = ctx.mesh({}, new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: 0x0000ff, transparent, opacity: transparent ? 0.5 : 1, depthTest: false, depthWrite: false }));
  blocker.addInstances(1);
  blocker.renderOrder = 0;
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  for (const distance of [2, 4, 2]) {
    camera.position.z = distance;
    for (const order of [-5, 5]) {
      mesh.renderOrder = order;
      ctx.render(camera);
      expect(mesh.LODinfo.render.levels[1].object.renderOrder).toBe(order);
      expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual(distance === 2 ? [[0], []] : [[], [0]]);
      ctx.pixel(32, transparent ? order > 0 ? [128, 0, 64] : [64, 0, 128] : order > 0 ? [255, 0, 0] : [0, 0, 255], 2);
    }
  }
});

test.each([false, true])('override material applies to every LOD and is removable between frames (multimaterial=%s)', (multi) => {
  const red = new MeshBasicMaterial({ color: 0xff0000 });
  const green = new MeshBasicMaterial({ color: 0x00ff00 });
  const mesh = ctx.mesh({}, groupedPlane(), multi ? [red, red] : red);
  mesh.addInstances(1);
  mesh.addLOD(groupedPlane(), multi ? [green, green] : green, 3);
  const override = new MeshBasicMaterial({ color: 0x0000ff });
  extraMaterials.push(override);
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  for (const distance of [2, 4, 2, 4]) {
    camera.position.z = distance;
    ctx.scene.overrideMaterial = override;
    ctx.render(camera);
    ctx.pixel(32, [0, 0, 255]);
    ctx.scene.overrideMaterial = null;
    ctx.render(camera);
    ctx.pixel(32, distance === 2 ? [255, 0, 0] : [0, 255, 0]);
  }
});

test.fails.each([false, true])('transparent override sorts original opaque instances back to front (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({}, new PlaneGeometry(0.7, 0.7), new MeshBasicMaterial());
  mesh.addInstances(2, (entity, id) => entity.position.z = -id);
  mesh.setColorAt(0, 0xff0000);
  mesh.setColorAt(1, 0x0000ff);
  mesh.sortObjects = true;
  if (withBVH) mesh.computeBVH();
  const override = new MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false });
  extraMaterials.push(override);
  ctx.scene.overrideMaterial = override;
  ctx.render();
  ctx.pixel(32, [128, 0, 64], 2);
  expect(renderedIds(mesh)).toEqual([1, 0]);
});

test.fails.each([false, true])('transparent material arrays sort overlapping instance colors correctly (mixed=%s)', (mixed) => {
  const materials = [
    new MeshBasicMaterial({ transparent: !mixed, opacity: mixed ? 1 : 0.5, depthWrite: mixed }),
    new MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false })
  ];
  const mesh = ctx.mesh({}, groupedPlane(), materials);
  mesh.addInstances(2, (entity, id) => entity.position.z = -id);
  mesh.setColorAt(0, 0xff0000);
  mesh.setColorAt(1, 0x0000ff);
  mesh.sortObjects = true;
  ctx.render();
  ctx.pixel(36, [128, 0, 64], 2, 28);
  ctx.pixel(28, mixed ? [255, 0, 0] : [128, 0, 64], 2, 36);
});

test.each([false, true])('override transitions restore patches even for empty and hidden instance ranges (multi=%s)', (multi) => {
  const base = new MeshBasicMaterial({ color: 0xff0000 });
  const mesh = ctx.mesh({}, groupedPlane(), multi ? [base, base] : base);
  mesh.frustumCulled = false;
  mesh.addInstances(1);
  const override = new MeshBasicMaterial({ color: 0x00ff00 });
  extraMaterials.push(override);
  const get = ctx.renderer.properties.get;
  const compile = override.onBeforeCompile;
  const key = override.customProgramCacheKey;
  ctx.scene.overrideMaterial = override;
  for (const visible of [true, false, true]) {
    mesh.setVisibilityAt(0, visible);
    ctx.render();
    ctx.pixel(32, visible ? [0, 255, 0] : [0, 0, 0]);
    expect(ctx.renderer.properties.get).toBe(get);
    expect(override.onBeforeCompile).toBe(compile);
    expect(override.customProgramCacheKey).toBe(key);
  }
  mesh.clearInstances();
  ctx.render();
  ctx.pixel(32, [0, 0, 0]);
  expect(ctx.renderer.properties.get).toBe(get);
  mesh.resizeBuffers(17);
  mesh.addInstances(1);
  ctx.scene.overrideMaterial = null;
  ctx.render();
  ctx.pixel(32, [255, 0, 0]);
});

test.each([false, true])('reordered and repeated geometry groups match native rendering (lazy=%s)', (lazy) => {
  const geometry = groupedPlane();
  geometry.clearGroups();
  geometry.addGroup(3, 3, 1);
  geometry.addGroup(0, 3, 0);
  geometry.addGroup(0, 3, 0);
  const materials = [new MeshBasicMaterial({ color: 0xff0000 }), new MeshBasicMaterial({ color: 0x0000ff })];
  const mesh = ctx.mesh({ renderer: lazy ? undefined : ctx.renderer }, geometry, materials);
  mesh.addInstances(1, (entity) => entity.position.x = 0.25);
  const reference = new Scene();
  const native = new Mesh(mesh.geometry, materials);
  native.position.x = 0.25;
  reference.add(native);
  ctx.render();
  ctx.render();
  const actual = pixels();
  ctx.renderer.render(reference, ctx.camera);
  expectImage(actual, pixels());
});

test.fails('unused trailing materials do not prevent lazy instance-buffer initialization', () => {
  const geometry = groupedPlane();
  geometry.clearGroups();
  geometry.addGroup(0, 6, 0);
  const mesh = ctx.mesh({ renderer: undefined }, geometry, [new MeshBasicMaterial({ color: 0xff0000 }), new MeshBasicMaterial()]);
  mesh.addInstances(1, (entity) => entity.position.x = 0.5);
  ctx.render();
  ctx.render();
  expect(mesh.instanceIndex).not.toBeNull();
  ctx.pixel(48, [255, 0, 0]);
  ctx.pixel(16, [0, 0, 0]);
});
