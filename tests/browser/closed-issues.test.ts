import { afterEach, beforeEach, expect, test } from 'vitest';
import { CanvasTexture, DoubleSide, Float32BufferAttribute, HalfFloatType, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Raycaster, Scene, Vector3 } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createTestScene, renderedIds, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

test.each([false, true])('issue 162: canvas reuploads retain orientation after instance texture streaming (flipY=%s)', (flipY) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 8;
  const drawing = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.flipY = flipY;
  const label = new Mesh(new PlaneGeometry(0.7, 1.5), new MeshBasicMaterial({ map: texture }));
  label.position.x = 0.5;
  label.renderOrder = 1;
  ctx.scene.add(label);
  const mesh = ctx.mesh({}, new PlaneGeometry(0.3, 0.3));
  mesh.addInstances(1, (entity) => entity.position.x = -0.5);
  mesh.setColorAt(0, 0xffffff);
  mesh.renderOrder = 0;
  try {
    for (let frame = 0; frame < 4; frame++) {
      const colors = frame % 2 ? ['#00ff00', '#ffff00'] : ['#ff0000', '#0000ff'];
      const values = frame % 2 ? [[0, 255, 0], [255, 255, 0]] : [[255, 0, 0], [0, 0, 255]];
      drawing.fillStyle = colors[0];
      drawing.fillRect(0, 0, 8, 4);
      drawing.fillStyle = colors[1];
      drawing.fillRect(0, 4, 8, 4);
      texture.needsUpdate = true;
      mesh.setColorAt(0, frame % 2 ? 0x00ff00 : 0xff0000);
      mesh.setMatrixAt(0, new Matrix4().makeTranslation(-0.5, frame % 2 ? 0.1 : 0, 0));
      ctx.render();
      expect(mesh.count).toBe(1);
      ctx.pixel(48, values[flipY ? 0 : 1], 1, 44);
      ctx.pixel(48, values[flipY ? 1 : 0], 1, 20);
      mesh.setColorAt(0, 0xffffff);
      ctx.render();
      ctx.pixel(48, values[flipY ? 0 : 1], 1, 44);
    }
  } finally {
    texture.dispose();
    label.geometry.dispose();
    label.material.dispose();
  }
});

test.each([false, true])('issues 149/118: lazy offscreen LOD initialization survives camera entry, clear and reuse (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ renderer: undefined, capacity: 1 }, new PlaneGeometry(0.5, 0.5), new MeshBasicMaterial({ color: 0xff0000 }));
  mesh.addInstances(1, (entity) => entity.position.x = 10);
  mesh.addLOD(new PlaneGeometry(0.5, 0.5), new MeshBasicMaterial({ color: 0x0000ff }), 3);
  if (withBVH) mesh.computeBVH();
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  for (let frame = 0; frame < 3; frame++) ctx.render(camera);
  ctx.pixel(32, [0, 0, 0]);
  camera.position.x = 10;
  for (let frame = 0; frame < 3; frame++) ctx.render(camera);
  expect(mesh.instanceIndex).not.toBeNull();
  ctx.pixel(32, [255, 0, 0]);
  camera.position.z = 5;
  ctx.render(camera);
  ctx.pixel(32, [0, 0, 255]);
  mesh.clearInstances();
  ctx.render(camera);
  expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual([[], []]);
  ctx.pixel(32, [0, 0, 0]);
  if (withBVH) expect(mesh.bvh.nodes.every((node) => node === null)).toBe(true);
  mesh.resizeBuffers(17);
  mesh.addInstances(1, (entity) => entity.position.x = 10);
  ctx.render(camera);
  expect(renderedIds(mesh.LODinfo.render.levels[1].object)).toEqual([0]);
  ctx.pixel(32, [0, 0, 255]);
});

test.each([3, 4])('issue 159: vertex color channel count %s compiles with instance color and opacity', (channels) => {
  const geometry = new PlaneGeometry(0.5, 0.5);
  const data: number[] = [];
  for (let vertex = 0; vertex < geometry.attributes.position.count; vertex++) data.push(...(channels === 4 ? [1, 1, 1, 0.5] : [1, 1, 1]));
  geometry.setAttribute('color', new Float32BufferAttribute(data, channels));
  const material = new MeshBasicMaterial({ vertexColors: true, transparent: true });
  const mesh = ctx.mesh({}, geometry, material);
  mesh.addInstances(1);
  mesh.setColorAt(0, 0xff0000);
  mesh.setOpacityAt(0, 0.5);
  ctx.render();
  expect(mesh.count).toBe(1);
  ctx.pixel(32, channels === 4 ? [64, 0, 0] : [128, 0, 0], 2);
  mesh.resizeBuffers(65);
  mesh.setColorAt(0, 0x0000ff);
  ctx.render();
  ctx.pixel(32, channels === 4 ? [0, 0, 64] : [0, 0, 128], 2);
});

test.each([false, true])('issue 148: real Reflector nested rendering agrees with native geometry (lazy=%s)', (lazy) => {
  const material = new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide });
  const mesh = ctx.mesh({ renderer: lazy ? undefined : ctx.renderer }, new PlaneGeometry(0.4, 0.4), material);
  mesh.addInstances(1, (entity) => entity.position.x = -0.5);
  const mirror = new Reflector(new PlaneGeometry(4, 4), { textureWidth: 64, textureHeight: 64, multisample: 0, color: 0xffffff });
  mirror.position.z = -0.5;
  ctx.scene.add(mirror);
  const reference = new Scene();
  const native = new Mesh(mesh.geometry, material);
  native.position.x = -0.5;
  const referenceMirror = new Reflector(new PlaneGeometry(4, 4), { textureWidth: 64, textureHeight: 64, multisample: 0, color: 0xffffff });
  referenceMirror.position.z = -0.5;
  reference.add(native, referenceMirror);
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  const get = ctx.renderer.properties.get;
  const capture = (target = ctx.target): Uint8Array | Uint16Array => {
    const data = target.texture.type === HalfFloatType ? new Uint16Array(64 * 64 * 4) : new Uint8Array(64 * 64 * 4);
    ctx.renderer.readRenderTargetPixels(target, 0, 0, 64, 64, data);
    expect(ctx.renderer.getContext().getError()).toBe(ctx.renderer.getContext().NO_ERROR);
    return data;
  };
  try {
    for (const x of [-0.5, 0.5, -0.5]) {
      mesh.setMatrixAt(0, new Matrix4().makeTranslation(x, 0, 0));
      native.position.x = x;
      ctx.render(camera);
      ctx.render(camera);
      expect(mesh.instanceIndex).not.toBeNull();
      expect(ctx.renderer.getRenderTarget()).toBe(ctx.target);
      expect(ctx.renderer.properties.get).toBe(get);
      const actual = capture();
      const reflected = capture(mirror.getRenderTarget());
      ctx.renderer.render(reference, camera);
      expect(capture()).toEqual(actual);
      expect(capture(referenceMirror.getRenderTarget())).toEqual(reflected);
      expect(reflected.some((value, index) => index % 4 === 0 && value > 0x3800)).toBe(true);
    }
  } finally {
    mirror.dispose();
    mirror.geometry.dispose();
    referenceMirror.dispose();
    referenceMirror.geometry.dispose();
  }
});

test.each([false, true])('issue 114: alternating raycasts on separate meshes retain hit ownership and independent colors (BVH=%s)', (withBVH) => {
  const a = ctx.mesh({}, new PlaneGeometry(0.4, 0.4));
  const b = ctx.mesh({}, new PlaneGeometry(0.4, 0.4));
  a.addInstances(1, (entity) => entity.position.x = -0.5);
  b.addInstances(1, (entity) => entity.position.x = 0.5);
  a.setColorAt(0, 0xff0000);
  b.setColorAt(0, 0x0000ff);
  if (withBVH) {
    a.computeBVH();
    b.computeBVH();
  }
  ctx.render();
  for (const x of [-0.5, 0.5, -0.5, 0.5]) {
    const ray = new Raycaster(new Vector3(x, 0.03, 2), new Vector3(0, 0, -1));
    const expected = x < 0 ? a : b;
    const hits = ray.intersectObjects([a, b]);
    expect(hits).toHaveLength(1);
    expect(hits[0].object).toBe(expected);
    expect(hits[0].instanceId).toBe(0);
    expect(hits[0].distance).toBeCloseTo(2);
    expect(hits[0].point.x).toBeCloseTo(x);
  }
  a.setColorAt(0, 0x00ff00);
  ctx.render();
  ctx.pixel(16, [0, 255, 0]);
  ctx.pixel(48, [0, 0, 255]);
  b.setVisibilityAt(0, false);
  ctx.render();
  const miss = new Raycaster(new Vector3(0.5, 0.03, 2), new Vector3(0, 0, -1));
  expect(miss.intersectObjects([a, b])).toEqual([]);
  ctx.pixel(16, [0, 255, 0]);
  ctx.pixel(48, [0, 0, 0]);
});
