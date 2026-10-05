import { afterEach, beforeEach, expect, test } from 'vitest';
import { Matrix4, MeshBasicMaterial, PlaneGeometry } from 'three';
import { createTestScene, TestScene } from './helpers.js';

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

const modes = [false, true].flatMap((multi) => [Infinity, 1, 0].map((limit) => ({ multi, limit })));

test.each(modes)('batched texture rows match full uploads and CPU colors (multi=$multi, limit=$limit)', ({ multi, limit }) => {
  const material = new MeshBasicMaterial({ transparent: true, depthWrite: false });
  material.onBeforeCompile = (shader): void => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= gain;');
  };
  const geometry = new PlaneGeometry(0.09, 0.16);
  if (multi) {
    geometry.clearGroups();
    geometry.addGroup(0, 3, 0);
    geometry.addGroup(3, 3, 1);
  }
  const mesh = ctx.mesh({ capacity: 128 }, geometry, multi ? [material, material] : material);
  mesh.addInstances(128, (entity, id) => entity.position.set((id % 16 + 0.5) / 8 - 1, (Math.floor(id / 16) + 0.5) / 4 - 1, 0));
  mesh.initUniformsPerInstance({ fragment: { gain: 'float' } });
  for (let id = 0; id < 128; id++) {
    mesh.setColorAt(id, 0xffffff);
    mesh.setUniformAt(id, 'gain', 1);
  }
  const textures = [mesh.matricesTexture, mesh.colorsTexture, mesh.uniformsTexture];
  for (const texture of textures) texture.maxUpdateCalls = limit;
  ctx.render();
  const gl = ctx.renderer.getContext();
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 8);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
  const changed = [0, 1, 11, 12, 13, 24, 25, 60, 127];
  const channels = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let phase = 0; phase < 3; phase++) {
    for (const texture of textures) texture.partialUpdate = true;
    for (const id of changed) {
      const color = [0xff0000, 0x00ff00, 0x0000ff][(id + phase) % 3];
      mesh.setColorAt(id, color);
      mesh.setOpacityAt(id, phase === 1 ? 0.5 : 1);
      mesh.setUniformAt(id, 'gain', phase === 2 ? 0.25 : 1);
      const x = (id % 16 + 0.5) / 8 - 1;
      const y = (Math.floor(id / 16) + 0.5) / 4 - 1;
      mesh.setMatrixAt(id, new Matrix4().makeTranslation(x + (phase === 1 ? 0.005 : 0), y, 0));
    }
    ctx.render();
    for (let id = 0; id < 128; id++) {
      const factor = changed.includes(id) ? phase === 1 ? 0.5 : phase === 2 ? 0.25 : 1 : 1;
      const color = changed.includes(id) ? channels[(id + phase) % 3] : [1, 1, 1];
      ctx.pixel((id % 16) * 4 + 2, color.map((channel) => Math.round(channel * factor * 255)), 2, Math.floor(id / 16) * 8 + 4);
    }
    const partial = image();
    expect(gl.getParameter(gl.UNPACK_ALIGNMENT)).toBe(8);
    expect(gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL)).toBe(true);
    expect(gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(true);
    expect(gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL)).toBe(gl.BROWSER_DEFAULT_WEBGL);
    let updates = 0;
    for (const texture of textures) {
      texture.onUpdate = (): void => {
        updates++;
      };
    }
    ctx.render();
    expect(updates).toBe(0);
    expect(image()).toEqual(partial);
    for (const texture of textures) {
      texture.partialUpdate = false;
      texture.enqueueUpdate(0);
    }
    ctx.render();
    expect(image()).toEqual(partial);
    expect(updates).toBe(3);
  }
});

test.each([false, true])('shared material keeps differently sized texture bindings isolated over repeated passes (multi=%s)', (multi) => {
  const material = new MeshBasicMaterial();
  material.onBeforeCompile = (shader): void => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= gain;');
  };
  const meshes = [1, 65].map((capacity, index) => {
    const geometry = new PlaneGeometry(0.4, 0.4);
    if (multi) {
      geometry.clearGroups();
      geometry.addGroup(0, 3, 0);
      geometry.addGroup(3, 3, 1);
    }
    const mesh = ctx.mesh({ capacity }, geometry, multi ? [material, material] : material);
    mesh.addInstances(capacity, (entity, id) => entity.position.x = id === capacity - 1 ? index ? 0.5 : -0.5 : 10);
    mesh.setColorAt(capacity - 1, index ? 0x0000ff : 0xff0000);
    mesh.initUniformsPerInstance({ fragment: { gain: 'float' } });
    mesh.setUniformAt(capacity - 1, 'gain', 1);
    return mesh;
  });
  const get = ctx.renderer.properties.get;
  const compile = material.onBeforeCompile;
  const cacheKey = material.customProgramCacheKey;
  for (const reverse of [false, true, false]) {
    meshes[0].renderOrder = reverse ? 1 : -1;
    meshes[1].renderOrder = 0;
    meshes[0].setUniformAt(0, 'gain', reverse ? 0.5 : 1);
    meshes[1].setUniformAt(64, 'gain', reverse ? 0.25 : 1);
    ctx.render();
    ctx.pixel(16, reverse ? [128, 0, 0] : [255, 0, 0], 2);
    ctx.pixel(48, reverse ? [0, 0, 64] : [0, 0, 255], 2);
    expect(ctx.renderer.properties.get).toBe(get);
    expect(material.onBeforeCompile).toBe(compile);
    expect(material.customProgramCacheKey).toBe(cacheKey);
  }
});
