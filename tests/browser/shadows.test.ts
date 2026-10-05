import { afterEach, beforeEach, expect, test } from 'vitest';
import { AmbientLight, BasicShadowMap, BoxGeometry, DirectionalLight, Mesh, MeshLambertMaterial, PerspectiveCamera, PlaneGeometry, PointLight } from 'three';
import { createTestScene, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

const cases = [
  { type: 'directional', position: [-2, 0, 4], knownFailure: false },
  { type: 'point', position: [-2, 0, 0.5], knownFailure: false },
  { type: 'point', position: [-2, 0, 4], knownFailure: true }
] as const;

for (const { type, position, knownFailure } of cases) {
  const check = knownFailure ? test.fails : test;
  check(`renders ${type} shadow LOD at ${position.join(',')} through real shadow programs${knownFailure ? ' (known cubemap culling regression)' : ''}`, () => {
    ctx.renderer.shadowMap.enabled = true;
    ctx.renderer.shadowMap.type = BasicShadowMap;
    const mesh = ctx.mesh({}, new BoxGeometry(0.2, 0.2, 0.2));
    mesh.addInstances(1, (entity) => entity.position.set(-0.5, 0, 0));
    mesh.addShadowLOD(new BoxGeometry(0.6, 0.6, 0.2), 0);
    mesh.addShadowLOD(mesh.geometry, 10);
    mesh.computeBVH({ margin: 0.1 });
    const receiverGeometry = new PlaneGeometry(4, 4);
    const receiverMaterial = new MeshLambertMaterial();
    const receiver = new Mesh(receiverGeometry, receiverMaterial);
    receiver.position.z = -0.5;
    receiver.receiveShadow = true;
    const light = type === 'directional' ? new DirectionalLight(0xffffff, 1) : new PointLight(0xffffff, 30);
    light.position.set(position[0], position[1], position[2]);
    light.castShadow = true;
    light.shadow.mapSize.set(128, 128);
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 20;
    const camera = new PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 2;
    ctx.scene.add(receiver, light, new AmbientLight(0xffffff, 0.2));
    const originalGet = ctx.renderer.properties.get;
    try {
      ctx.render(camera);
      const shadowed = new Uint8Array(64 * 64 * 4);
      ctx.renderer.readRenderTargetPixels(ctx.target, 0, 0, 64, 64, shadowed);
      for (const object of mesh.LODinfo.objects) object.castShadow = false;
      ctx.render(camera);
      const unshadowed = new Uint8Array(shadowed.length);
      ctx.renderer.readRenderTargetPixels(ctx.target, 0, 0, 64, 64, unshadowed);
      let darker = 0;
      for (let i = 0; i < shadowed.length; i += 4) if (unshadowed[i] - shadowed[i] > 20) darker++;
      expect(darker).toBeGreaterThan(10);
      expect(ctx.renderer.properties.get).toBe(originalGet);
      expect(light.shadow.map).not.toBeNull();
    } finally {
      receiverGeometry.dispose();
      receiverMaterial.dispose();
      light.dispose();
    }
  });
}

test.each([false, true])('buffer growth preserves directional shadow LOD pixels and shared resources (BVH=%s)', (withBVH) => {
  ctx.renderer.shadowMap.enabled = true;
  ctx.renderer.shadowMap.type = BasicShadowMap;
  const mesh = ctx.mesh({ capacity: 1 }, new BoxGeometry(0.2, 0.2, 0.2));
  mesh.addInstances(1, (entity) => entity.position.x = -0.5);
  mesh.addShadowLOD(new BoxGeometry(0.6, 0.6, 0.2), 0);
  mesh.addShadowLOD(mesh.geometry, 10);
  if (withBVH) mesh.computeBVH();
  const receiver = new Mesh(new PlaneGeometry(4, 4), new MeshLambertMaterial());
  receiver.position.z = -0.5;
  receiver.receiveShadow = true;
  const light = new DirectionalLight(0xffffff, 1);
  light.position.set(-2, 0, 4);
  light.castShadow = true;
  light.shadow.mapSize.set(128, 128);
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 20;
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  ctx.scene.add(receiver, light, new AmbientLight(0xffffff, 0.2));
  const image = (): Uint8Array => {
    const data = new Uint8Array(64 * 64 * 4);
    ctx.renderer.readRenderTargetPixels(ctx.target, 0, 0, 64, 64, data);
    return data;
  };
  try {
    ctx.render(camera);
    const baseline = image();
    for (const capacity of [2, 17, 65, 257]) {
      mesh.resizeBuffers(capacity);
      ctx.render(camera);
      expect(image()).toEqual(baseline);
      for (const object of mesh.LODinfo.objects) {
        expect(object.capacity).toBe(capacity);
        expect(object.instanceIndex.array.length).toBe(capacity);
        expect(object.matricesTexture).toBe(mesh.matricesTexture);
      }
    }
    for (const object of mesh.LODinfo.objects) object.castShadow = false;
    ctx.render(camera);
    const unshadowed = image();
    let darker = 0;
    for (let i = 0; i < baseline.length; i += 4) if (unshadowed[i] - baseline[i] > 20) darker++;
    expect(darker).toBeGreaterThan(10);
    for (const object of mesh.LODinfo.objects) object.castShadow = true;
    ctx.render(camera);
    expect(image()).toEqual(baseline);
  } finally {
    receiver.geometry.dispose();
    receiver.material.dispose();
    light.dispose();
  }
});
