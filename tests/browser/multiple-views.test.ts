import { afterEach, beforeEach, expect, test } from 'vitest';
import { AmbientLight, BasicShadowMap, BoxGeometry, DirectionalLight, Frustum, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, PlaneGeometry, PointLight, Scene, SpotLight } from 'three';
import { createTestScene, renderedIds, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

function image(): Uint8Array {
  const data = new Uint8Array(64 * 64 * 4);
  ctx.renderer.readRenderTargetPixels(ctx.target, 0, 0, 64, 64, data);
  return data;
}

function expectImage(actual: Uint8Array, expected: Uint8Array): void {
  let maximum = 0;
  for (let i = 0; i < actual.length; i++) maximum = Math.max(maximum, Math.abs(actual[i] - expected[i]));
  expect(maximum).toBeLessThanOrEqual(2);
}

test.each([false, true])('alternating camera types refresh culling and sparse texture updates (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ capacity: 65 }, new PlaneGeometry(0.4, 0.4));
  mesh.addInstances(65, (entity, id) => entity.position.x = id < 4 ? [-0.5, 0.5, 2.5, 3.5][id] : 10);
  for (let id = 0; id < 4; id++) mesh.setColorAt(id, [0xff0000, 0x00ff00, 0x0000ff, 0xffffff][id]);
  if (withBVH) mesh.computeBVH();
  const perspective = new PerspectiveCamera(60, 1, 0.1, 100);
  perspective.position.set(3, 0, 2);
  ctx.render();
  const first = image();
  expect(renderedIds(mesh).sort()).toEqual([0, 1]);
  ctx.render(perspective);
  expect(renderedIds(mesh).sort()).toEqual([2, 3]);
  ctx.pixel(18, [0, 0, 255]);
  ctx.pixel(46, [255, 255, 255]);
  mesh.setColorAt(2, 0xffff00);
  ctx.render();
  expectImage(image(), first);
  ctx.render(perspective);
  ctx.pixel(18, [255, 255, 0]);
  mesh.removeInstances(2);
  mesh.setVisibilityAt(3, false);
  mesh.frustumCulled = false;
  ctx.render(perspective);
  expect(renderedIds(mesh)).toEqual([]);
  ctx.pixel(18, [0, 0, 0]);
  ctx.pixel(46, [0, 0, 0]);
  ctx.render();
  expectImage(image(), first);
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
  for (const camera of [ctx.camera, perspective]) {
    for (const zoom of [0.5, 1, 2]) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      ctx.render(camera);
      const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(mesh.matrixWorld));
      const expected: number[] = [];
      for (let id = 0; id < 65; id++) {
        if (!mesh.getActiveAndVisibilityAt(id)) continue;
        const matrix = mesh.getMatrixAt(id);
        const visible = withBVH ? frustum.intersectsBox(mesh.geometry.boundingBox.clone().applyMatrix4(matrix)) : frustum.intersectsSphere(mesh.geometry.boundingSphere.clone().applyMatrix4(matrix));
        if (visible) expected.push(id);
      }
      expect(renderedIds(mesh).sort((a, b) => a - b)).toEqual(expected);
    }
  }
});

test.each([false, true])('alternating LOD cameras restore level pixels after intervening renders and growth (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ capacity: 1 }, new PlaneGeometry(0.8, 0.8), new MeshBasicMaterial({ color: 0xff0000 }));
  mesh.addInstances(1);
  mesh.addLOD(new PlaneGeometry(0.8, 0.8), new MeshBasicMaterial({ color: 0x0000ff }), 3);
  if (withBVH) mesh.computeBVH();
  const near = new PerspectiveCamera(60, 1, 0.1, 100);
  const far = new PerspectiveCamera(60, 1, 0.1, 100);
  near.position.z = 2;
  far.position.z = 5;
  for (const capacity of [1, 17, 65]) {
    if (capacity > 1) mesh.resizeBuffers(capacity);
    for (const camera of [near, far, near, far]) {
      ctx.render(camera);
      ctx.pixel(32, camera === near ? [255, 0, 0] : [0, 0, 255]);
      expect(mesh.LODinfo.render.levels.map((level) => renderedIds(level.object))).toEqual(camera === near ? [[0], []] : [[], [0]]);
    }
  }
});

const lightingModes = [false, true].flatMap((bvh) => ['directional', 'spot', 'point'].map((type) => ({ bvh, type })));

test.each(lightingModes)('multiple shadow lights match native caster images across cameras (BVH=$bvh, type=$type)', ({ bvh, type }) => {
  ctx.renderer.shadowMap.enabled = true;
  ctx.renderer.shadowMap.type = BasicShadowMap;
  const geometry = new BoxGeometry(0.35, 0.35, 0.2);
  const material = new MeshLambertMaterial({ color: 0xffffff });
  const mesh = ctx.mesh({ capacity: 4 }, geometry, material);
  mesh.addInstances(2, (entity, id) => entity.position.x = id ? 0.5 : -0.5);
  mesh.castShadow = true;
  if (bvh) mesh.computeBVH();
  const receiver = new Mesh(new PlaneGeometry(6, 6), new MeshLambertMaterial());
  receiver.position.z = -0.5;
  receiver.receiveShadow = true;
  const lights = [new DirectionalLight(0xffffff, 1), type === 'spot' ? new SpotLight(0xffffff, 30, 0, 0.6) : type === 'point' ? new PointLight(0xffffff, 30) : new DirectionalLight(0xffffff, 1)];
  for (let index = 0; index < lights.length; index++) {
    const light = lights[index];
    light.position.set(index ? 2 : -2, 0, 4);
    light.castShadow = true;
    light.shadow.mapSize.set(128, 128);
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 20;
    ctx.scene.add(light);
    if ('target' in light) ctx.scene.add(light.target);
  }
  const ambient = new AmbientLight(0xffffff, 0.2);
  ctx.scene.add(receiver, ambient);
  const reference = new Scene();
  const natives = [0, 1].map((id) => {
    const native = new Mesh(mesh.geometry, material);
    native.matrixAutoUpdate = false;
    native.matrix.copy(mesh.getMatrixAt(id));
    native.castShadow = true;
    reference.add(native);
    return native;
  });
  const referenceReceiver = new Mesh(receiver.geometry, receiver.material);
  referenceReceiver.position.copy(receiver.position);
  referenceReceiver.receiveShadow = true;
  reference.add(referenceReceiver);
  const cameras = [new PerspectiveCamera(60, 1, 0.1, 100), new PerspectiveCamera(60, 1, 0.1, 100)];
  cameras[0].position.z = 2;
  cameras[1].position.set(0.3, 0.2, 3);
  cameras[1].lookAt(0, 0, 0);
  const get = ctx.renderer.properties.get;
  const lighting = [ambient, ...lights, ...lights.flatMap((light) => 'target' in light ? [light.target] : [])];
  try {
    for (const camera of [cameras[0], cameras[1], cameras[0]]) {
      for (const enabled of [[true, true], [true, false], [false, true]]) {
        for (let index = 0; index < 2; index++) lights[index].visible = enabled[index];
        ctx.scene.add(...lighting);
        ctx.render(camera);
        const actual = image();
        reference.add(...lighting);
        ctx.renderer.render(reference, camera);
        expectImage(actual, image());
        expect(ctx.renderer.properties.get).toBe(get);
        ctx.scene.add(...lighting);
      }
    }
    ctx.render(cameras[0]);
    const shadowed = image();
    mesh.castShadow = false;
    ctx.render(cameras[0]);
    const unshadowed = image();
    let darker = 0;
    for (let i = 0; i < shadowed.length; i += 4) if (unshadowed[i] - shadowed[i] > 15) darker++;
    expect(darker).toBeGreaterThan(5);
    mesh.castShadow = true;
    mesh.resizeBuffers(17);
    mesh.setVisibilityAt(0, false);
    natives[0].visible = false;
    ctx.render(cameras[0]);
    const actual = image();
    reference.add(...lighting);
    ctx.renderer.render(reference, cameras[0]);
    expectImage(actual, image());
  } finally {
    receiver.geometry.dispose();
    receiver.material.dispose();
    for (const light of lights) light.dispose();
  }
});

for (const withBVH of [false, true]) {
  const check = withBVH ? test : test.fails;
  check(`two lights select shadow LOD independently of intervening main-camera renders (BVH=${withBVH})`, () => {
    ctx.renderer.shadowMap.enabled = true;
    ctx.renderer.shadowMap.type = BasicShadowMap;
    const geometry = new BoxGeometry(0.2, 0.2, 0.2);
    const shadowGeometry = new BoxGeometry(0.6, 0.6, 0.2);
    const material = new MeshLambertMaterial();
    const mesh = ctx.mesh({ capacity: 1 }, geometry, material);
    mesh.addInstances(1, (entity) => entity.position.x = -0.5);
    mesh.addShadowLOD(shadowGeometry, 0);
    mesh.addShadowLOD(geometry, 3);
    if (withBVH) mesh.computeBVH();
    const receiver = new Mesh(new PlaneGeometry(6, 6), new MeshLambertMaterial());
    receiver.position.z = -0.5;
    receiver.receiveShadow = true;
    const lights = [new DirectionalLight(0xffffff, 1), new DirectionalLight(0xffffff, 1)];
    for (let index = 0; index < 2; index++) {
      lights[index].position.set(index ? 2 : -2, 0, 4);
      lights[index].castShadow = true;
      lights[index].shadow.mapSize.set(128, 128);
      lights[index].shadow.camera.near = 0.1;
      lights[index].shadow.camera.far = 20;
    }
    const ambient = new AmbientLight(0xffffff, 0.2);
    const lighting = [ambient, ...lights, ...lights.map((light) => light.target)];
    ctx.scene.add(receiver, ...lighting);
    const reference = new Scene();
    const native = new Mesh(mesh.geometry, material);
    native.position.x = -0.5;
    const shadowMaterial = new MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    const caster = new Mesh(shadowGeometry, shadowMaterial);
    caster.position.x = -0.5;
    caster.castShadow = true;
    const nativeReceiver = new Mesh(receiver.geometry, receiver.material);
    nativeReceiver.position.z = -0.5;
    nativeReceiver.receiveShadow = true;
    reference.add(native, caster, nativeReceiver);
    const near = new PerspectiveCamera(60, 1, 0.1, 100);
    const far = new PerspectiveCamera(60, 1, 0.1, 100);
    near.position.z = 2;
    far.position.z = 5;
    try {
      for (const camera of [near, far, near, far]) {
        caster.geometry = camera === near ? shadowGeometry : geometry;
        ctx.scene.add(...lighting);
        ctx.render(camera);
        const actual = image();
        reference.add(...lighting);
        ctx.renderer.render(reference, camera);
        expectImage(actual, image());
      }
      mesh.resizeBuffers(65);
      ctx.scene.add(...lighting);
      ctx.render(near);
      const actual = image();
      caster.geometry = shadowGeometry;
      reference.add(...lighting);
      ctx.renderer.render(reference, near);
      expectImage(actual, image());
    } finally {
      receiver.geometry.dispose();
      receiver.material.dispose();
      shadowMaterial.dispose();
      for (const light of lights) light.dispose();
    }
  });
}
