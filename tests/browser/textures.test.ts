import { afterEach, beforeEach, expect, test } from 'vitest';
import { Color, Float32BufferAttribute, Matrix3, Matrix4, MeshBasicMaterial, PlaneGeometry, Vector2, Vector3, Vector4 } from 'three';
import { getSquareTextureInfo, getSquareTextureSize, SquareDataTexture, UniformValue, UniformValueObj } from '../../src/index.js';
import { createTestScene, expectNumbers, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

test.each(['vertex', 'fragment'] as const)('packs all uniform types and renders them from the %s shader', (stage) => {
  const material = new MeshBasicMaterial();
  material.onBeforeCompile = (shader): void => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', 'diffuseColor.rgb = tint * gain + vec3(offset, 0.0) + extra.xyz + vec3(basis[0][0] - 1.0, transform[0][0] - 1.0, 0.0);');
  };
  const mesh = ctx.mesh({ createEntities: true }, new PlaneGeometry(0.6, 0.6), material);
  mesh.addInstances(2, (entity, id) => entity.position.set(id === 0 ? -0.5 : 0.5, 0, 0));
  mesh.initUniformsPerInstance({ [stage]: { gain: 'float', tint: 'vec3', offset: 'vec2', extra: 'vec4', basis: 'mat3', transform: 'mat4' } });
  const values: Record<string, UniformValue> = { gain: 1, tint: new Vector3(1, 0, 0), offset: new Vector2(), extra: new Vector4(0, 0, 0, 0), basis: new Matrix3(), transform: new Matrix4() };
  const targets: Record<string, UniformValueObj> = { tint: new Vector3(), offset: new Vector2(), extra: new Vector4(), basis: new Matrix3(), transform: new Matrix4() };
  for (let id = 0; id < 2; id++) {
    for (const name in values) mesh.instances[id].setUniform(name, values[name]);
  }
  mesh.instances[1].setUniform('tint', new Color(0x00ff00));
  expect(mesh.instances[0].getUniform('gain')).toBe(1);
  for (const name in targets) {
    const result = mesh.instances[0].getUniform(name, targets[name]) as UniformValueObj;
    expect(result).toBe(targets[name]);
    expectNumbers((result as { toArray(): number[] }).toArray(), (values[name] as { toArray(): number[] }).toArray());
  }
  ctx.render();
  ctx.pixel(16, [255, 0, 0]);
  ctx.pixel(48, [0, 255, 0]);
  mesh.setUniformAt(1, 'gain', 0.5);
  mesh.setUniformAt(1, 'tint', new Vector3(0, 0, 1));
  ctx.render();
  ctx.pixel(16, [255, 0, 0]);
  ctx.pixel(48, [0, 0, 128], 2);
  mesh.resizeBuffers(64);
  ctx.render();
  ctx.pixel(48, [0, 0, 128], 2);
});

test.each(['float', 'vec2', 'vec3', 'vec4'] as const)('renders a standalone %s uniform', (type) => {
  const material = new MeshBasicMaterial();
  const expression = { float: 'vec3(value, 0.0, 0.0)', vec2: 'vec3(value, 0.0)', vec3: 'value', vec4: 'value.rgb' }[type];
  material.onBeforeCompile = (shader): void => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `diffuseColor.rgb = ${expression};`);
  };
  const mesh = ctx.mesh({}, new PlaneGeometry(0.6, 0.6), material);
  mesh.addInstances(1);
  mesh.initUniformsPerInstance({ fragment: { value: type } });
  const values = { float: 1, vec2: new Vector2(1, 0), vec3: new Vector3(1, 0, 0), vec4: new Vector4(1, 0, 0, 1) };
  mesh.setUniformAt(0, 'value', values[type]);
  ctx.render();
  ctx.pixel(32, [255, 0, 0]);
});

test('deduplicates uniforms shared by shader stages and rejects invalid schemas', () => {
  const mesh = ctx.mesh();
  expect(() => mesh.getUniformAt(0, 'value')).toThrow('initUniformsPerInstance');
  expect(() => mesh.setUniformAt(0, 'value', 1)).toThrow('initUniformsPerInstance');
  expect(() => mesh.initUniformsPerInstance({ fragment: { value: 'invalid' as any } })).toThrow('Invalid uniform type');
  mesh.initUniformsPerInstance({ vertex: { tint: 'vec3', a: 'float', b: 'float', c: 'vec2' }, fragment: { tint: 'vec3', d: 'vec4' } });
  mesh.setUniformAt(0, 'a', 0.1);
  mesh.setUniformAt(0, 'b', 0.2);
  mesh.setUniformAt(0, 'c', new Vector2(0.3, 0.4));
  mesh.setUniformAt(0, 'd', new Vector4(0.5, 0.6, 0.7, 0.8));
  expect(mesh.getUniformAt(0, 'a')).toBeCloseTo(0.1);
  expect(mesh.getUniformAt(0, 'b')).toBeCloseTo(0.2);
  expectNumbers((mesh.getUniformAt(0, 'c', new Vector2()) as Vector2).toArray(), [0.3, 0.4]);
  expectNumbers((mesh.getUniformAt(0, 'd', new Vector4()) as Vector4).toArray(), [0.5, 0.6, 0.7, 0.8]);
});

test.each(['partial', 'full', 'bounded'] as const)('updates real GPU textures using %s uploads and restores unpack state', (mode) => {
  const mesh = ctx.mesh({ capacity: 32 }, new PlaneGeometry(0.6, 0.6));
  mesh.addInstances(8, (entity, id) => entity.position.set(id === 0 ? -0.5 : id === 7 ? 0.5 : 10, 0, 0));
  mesh.setColorAt(0, 0xff0000);
  mesh.setColorAt(7, 0x00ff00);
  mesh.matricesTexture.partialUpdate = mode !== 'full';
  mesh.colorsTexture.partialUpdate = mode !== 'full';
  mesh.matricesTexture.maxUpdateCalls = mode === 'bounded' ? 0 : Infinity;
  mesh.colorsTexture.maxUpdateCalls = mode === 'bounded' ? 0 : Infinity;
  ctx.render();
  ctx.pixel(16, [255, 0, 0]);
  ctx.pixel(48, [0, 255, 0]);
  const gl = ctx.renderer.getContext();
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 8);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  mesh.setColorAt(0, 0x0000ff);
  mesh.setColorAt(7, 0xff0000);
  mesh.setMatrixAt(0, new Matrix4().makeTranslation(-0.5, 0.1, 0));
  mesh.setMatrixAt(7, new Matrix4().makeTranslation(0.5, 0.1, 0));
  ctx.render();
  ctx.pixel(16, [0, 0, 255]);
  ctx.pixel(48, [255, 0, 0]);
  expect(gl.getParameter(gl.UNPACK_ALIGNMENT)).toBe(8);
  expect(gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL)).toBe(true);
  expect(gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL)).toBe(true);
  let updates = 0;
  mesh.colorsTexture.onUpdate = (): void => {
    updates++;
  };
  ctx.render();
  expect(updates).toBe(0);
  mesh.setColorAt(0, 0x00ff00);
  ctx.render();
  expect(updates).toBe(1);
  ctx.pixel(16, [0, 255, 0]);
});

test.each([false, true])('renders instance opacity with and without preexisting colors (%s)', (withColor) => {
  const material = new MeshBasicMaterial({ transparent: true });
  const mesh = ctx.mesh({}, new PlaneGeometry(0.6, 0.6), material);
  mesh.addInstances(1);
  expect(mesh.getOpacityAt(0)).toBe(1);
  if (withColor) mesh.setColorAt(0, 0xff0000);
  mesh.setOpacityAt(0, 0.5);
  mesh.setOpacityAt(0, 0.25);
  expect(mesh.getOpacityAt(0)).toBe(0.25);
  ctx.render();
  ctx.pixel(32, withColor ? [64, 0, 0] : [64, 64, 64], 2);
});

test('combines vertex colors with per-instance colors on the GPU', () => {
  const geometry = new PlaneGeometry(0.6, 0.6);
  geometry.setAttribute('color', new Float32BufferAttribute(new Array(geometry.getAttribute('position').count * 3).fill(1), 3));
  const mesh = ctx.mesh({}, geometry, new MeshBasicMaterial({ vertexColors: true }));
  mesh.addInstances(1);
  mesh.setColorAt(0, new Color(0x00ff00));
  ctx.render();
  expect(mesh.count).toBe(1);
  ctx.pixel(32, [0, 255, 0]);
});

test.each([Float32Array, Uint32Array, Int32Array])('creates texture formats and preserves data during resize (%s)', (arrayType) => {
  expect(getSquareTextureSize(5, 4)).toBe(8);
  for (const channels of [1, 2, 3, 4] as const) {
    const info = getSquareTextureInfo(arrayType, channels, 1, 5);
    expect(info.size).toBe(3);
    expect(info.array).toBeInstanceOf(arrayType);
    expect(info.array).toHaveLength(9 * (channels === 3 ? 4 : channels));
    const texture = new SquareDataTexture(arrayType, channels, 1, 5);
    texture._data[0] = 42;
    const original = texture._data;
    texture.resize(6);
    expect(texture._data).toBe(original);
    texture.resize(100);
    expect(texture._data[0]).toBe(42);
    texture.resize(1);
    expect(texture._data[0]).toBe(42);
    texture.dispose();
  }
});
