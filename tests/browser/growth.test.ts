import { afterEach, beforeEach, expect, test } from 'vitest';
import { Bone, Float32BufferAttribute, Matrix3, Matrix4, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Skeleton, Uint16BufferAttribute, Vector2, Vector3, Vector4 } from 'three';
import { createRadixSort } from '../../src/index.js';
import { createTestScene, expectNumbers, renderedIds, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

const modes = [false, true].flatMap((lazy) => [false, true].flatMap((bvh) => [false, true].map((entities) => ({ lazy, bvh, entities }))));

test.each(modes)('growth preserves live data and GPU indices (lazy=$lazy, BVH=$bvh, entities=$entities)', ({ lazy, bvh, entities }) => {
  const material = new MeshBasicMaterial({ transparent: true });
  material.onBeforeCompile = (shader): void => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= gain;');
  };
  const mesh = ctx.mesh({ capacity: 2, renderer: lazy ? undefined : ctx.renderer, createEntities: entities }, new PlaneGeometry(0.4, 0.4), material);
  mesh.addInstances(2, (entity, id) => entity.position.x = id ? 0.5 : -0.5);
  mesh.setColorAt(0, 0xff0000);
  mesh.setColorAt(1, 0x00ff00);
  mesh.setOpacityAt(0, 0.5);
  mesh.initUniformsPerInstance({ fragment: { gain: 'float' } });
  mesh.setUniformAt(0, 'gain', 1);
  mesh.setUniformAt(1, 'gain', 0.25);
  if (bvh) mesh.computeBVH({ margin: 0.125 });
  const entity = mesh.instances?.[0];
  const matrixPrefix = mesh.matricesTexture._data.slice(0, 32);
  const colorPrefix = mesh.colorsTexture._data.slice(0, 8);
  for (const capacity of [3, 4, 5, 16, 17, 65, 257]) {
    expect(mesh.resizeBuffers(capacity)).toBe(mesh);
    expect(mesh.capacity).toBe(capacity);
    expect(mesh.instancesCount).toBe(2);
    expectNumbers(mesh.matricesTexture._data.slice(0, 32), matrixPrefix);
    expectNumbers(mesh.colorsTexture._data.slice(0, 8), colorPrefix);
    expect(mesh.getUniformAt(0, 'gain')).toBe(1);
    expect(mesh.getUniformAt(1, 'gain')).toBe(0.25);
    expect(mesh.getActiveAndVisibilityAt(0)).toBe(true);
    if (entities) expect(mesh.instances[0]).toBe(entity);
    if (bvh) expect(mesh.bvh.nodes).toHaveLength(capacity);
    ctx.render();
    ctx.render();
    ctx.pixel(16, [128, 0, 0], 2);
    ctx.pixel(48, [0, 64, 0], 2);
    expect(renderedIds(mesh).sort()).toEqual([0, 1]);
    const gl = ctx.renderer.getContext() as WebGL2RenderingContext;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instanceIndex.buffer);
    expect(gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)).toBe(capacity * 4);
    const indices = new Uint32Array(2);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, indices);
    expect(Array.from(indices).sort()).toEqual([0, 1]);
  }
  mesh.addInstances(255, (entity, id) => entity.position.x = id === 256 ? 0 : 10);
  mesh.setColorAt(256, 0x0000ff);
  mesh.setUniformAt(256, 'gain', 1);
  expect(mesh.getOpacityAt(256)).toBe(1);
  ctx.render();
  ctx.pixel(32, [0, 0, 255]);
  mesh.setVisibilityAt(0, false);
  mesh.removeInstances(1);
  mesh.resizeBuffers(513);
  const ids: number[] = [];
  mesh.addInstances(1, (entity, id) => {
    ids.push(id);
    entity.position.x = 0.5;
  });
  expect(ids).toEqual([1]);
  mesh.setColorAt(1, 0xffffff);
  mesh.setUniformAt(1, 'gain', 1);
  ctx.render();
  ctx.pixel(16, [0, 0, 0]);
  ctx.pixel(48, [255, 255, 255]);
  ctx.pixel(32, [0, 0, 255]);
});

test.each([false, true])('automatic growth preserves high IDs, holes and radix workspace (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ capacity: 1 }, new PlaneGeometry(0.3, 0.3));
  mesh.addInstances(1, (entity) => entity.position.x = -0.5);
  mesh.setColorAt(0, 0xff0000);
  if (withBVH) mesh.computeBVH();
  mesh.sortObjects = true;
  mesh.customSort = createRadixSort(mesh);
  ctx.render();
  mesh.addInstances(3000, (entity, id) => entity.position.set(id === 3000 ? 0.5 : 10, 0, -id * 0.001));
  mesh.setColorAt(3000, 0x00ff00);
  ctx.render();
  ctx.pixel(16, [255, 0, 0]);
  ctx.pixel(48, [0, 255, 0]);
  expect(renderedIds(mesh)).toEqual([0, 3000]);
  expect(mesh.getColorAt(2999).getHex()).toBe(0xffffff);
  mesh.removeInstances(10, 2000);
  mesh.resizeBuffers(mesh.capacity + 1);
  const reused: number[] = [];
  mesh.addInstances(2, (_entity, id) => reused.push(id));
  expect(reused).toEqual([2000, 10]);
  expect(mesh.getMatrixAt(2000).elements).toEqual(new Matrix4().elements);
});

test.each([false, true])('LOD child growth preserves every level index and shared textures (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ capacity: 3 }, new PlaneGeometry(0.4, 0.4));
  mesh.addInstances(3, (entity, id) => entity.position.set((id - 1) * 0.5, 0, -id * 2));
  mesh.setColorAt(0, 0xff0000);
  mesh.setColorAt(1, 0x00ff00);
  mesh.setColorAt(2, 0x0000ff);
  mesh.addLOD(new PlaneGeometry(0.4, 0.4), new MeshBasicMaterial(), 3);
  mesh.addLOD(new PlaneGeometry(0.4, 0.4), new MeshBasicMaterial(), 5);
  mesh.initUniformsPerInstance({ fragment: { gain: 'float' } });
  mesh.setUniformAt(2, 'gain', 0.75);
  if (withBVH) mesh.computeBVH();
  const levels = mesh.LODinfo.render.levels.map((level) => level.object);
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 2;
  for (const capacity of [4, 17, 65, 257]) {
    levels[2].resizeBuffers(capacity);
    ctx.render(camera);
    expect(levels.map(renderedIds)).toEqual([[0], [1], [2]]);
    for (const level of levels) {
      expect(level.capacity).toBe(capacity);
      expect(level.instanceIndex.array).toHaveLength(capacity);
      expect(level.matricesTexture).toBe(mesh.matricesTexture);
      expect(level.colorsTexture).toBe(mesh.colorsTexture);
      expect(level.uniformsTexture).toBe(mesh.uniformsTexture);
      expect(level.availabilityArray).toBe(mesh.availabilityArray);
    }
    expect(mesh.getUniformAt(2, 'gain')).toBe(0.75);
  }
});

test.each([false, true])('growth preserves several morph targets and renders new high-ID weights (relative=%s)', (relative) => {
  const geometry = new PlaneGeometry(0.3, 0.3);
  const positions = geometry.getAttribute('position');
  geometry.morphTargetsRelative = relative;
  geometry.morphAttributes.position = [1, -1].map((offset) => {
    const data: number[] = [];
    for (let i = 0; i < positions.count; i++) data.push(relative ? offset : positions.getX(i) + offset, relative ? 0 : positions.getY(i), 0);
    return new Float32BufferAttribute(data, 3);
  });
  const mesh = ctx.mesh({ capacity: 1 }, geometry);
  mesh.addInstances(1, (entity) => entity.position.x = -0.5);
  const source = new Mesh(geometry);
  source.morphTargetInfluences = [1, 0];
  mesh.setMorphAt(0, source);
  const output = new Mesh(geometry);
  for (const capacity of [2, 3, 17, 65]) {
    mesh.resizeBuffers(capacity);
    expect(mesh.morphTexture.image.height).toBe(capacity);
    expect(mesh.getMorphAt(0, output).morphTargetInfluences).toEqual([1, 0]);
    ctx.render();
    ctx.pixel(16, [0, 0, 0]);
    ctx.pixel(48, [255, 255, 255]);
  }
  mesh.addInstances(64, (entity, id) => entity.position.x = id === 64 ? 0.5 : 10);
  source.morphTargetInfluences = [0, 1];
  mesh.setMorphAt(64, source);
  mesh.setColorAt(64, 0xff0000);
  ctx.render();
  ctx.pixel(16, [255, 0, 0]);
  ctx.pixel(48, [255, 255, 255]);
});

test('growth preserves bone poses across texture boundaries and uploads newly added poses', () => {
  const geometry = new PlaneGeometry(0.3, 0.3);
  const count = geometry.attributes.position.count;
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  const weights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) weights[i * 4] = 1;
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(weights, 4));
  const mesh = ctx.mesh({ capacity: 1 }, geometry);
  mesh.addInstances(1, (entity) => entity.position.x = -0.5);
  const bone = new Bone();
  const parent = new Object3D();
  parent.add(bone);
  parent.updateMatrixWorld(true);
  const skeleton = new Skeleton([bone]);
  try {
    mesh.initSkeleton(skeleton);
    bone.position.x = 1;
    mesh.setBonesAt(0);
    for (const capacity of [2, 3, 17, 65]) {
      mesh.resizeBuffers(capacity);
      expectNumbers(mesh.boneTexture._data.slice(0, 16), new Matrix4().makeTranslation(1, 0, 0).elements);
      ctx.render();
      ctx.pixel(48, [255, 255, 255]);
      ctx.pixel(16, [0, 0, 0]);
    }
    mesh.addInstances(64, (entity, id) => entity.position.x = id === 64 ? 0.5 : 10);
    bone.position.x = -1;
    mesh.setBonesAt(64);
    mesh.setColorAt(64, 0x00ff00);
    ctx.render();
    ctx.pixel(16, [0, 255, 0]);
    ctx.pixel(48, [255, 255, 255]);
  } finally {
    skeleton.dispose();
  }
});

test.each(['vertex', 'fragment'] as const)('growth uploads packed uniforms at row boundaries in the %s shader', (stage) => {
  const material = new MeshBasicMaterial();
  material.onBeforeCompile = (shader): void => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', 'diffuseColor.rgb = tint * gain + vec3(offset, 0.0) + extra.rgb + vec3(basis[1][2], transform[3][1], 0.0);');
  };
  const mesh = ctx.mesh({ capacity: 1 }, new PlaneGeometry(0.25, 0.25), material);
  mesh.initUniformsPerInstance({ [stage]: { gain: 'float', tint: 'vec3', offset: 'vec2', extra: 'vec4', basis: 'mat3', transform: 'mat4' } });
  mesh.addInstances(1, (entity) => entity.position.x = -0.5);
  const set = (id: number, tint: Vector3): void => {
    mesh.setUniformAt(id, 'gain', 1);
    mesh.setUniformAt(id, 'tint', tint);
    mesh.setUniformAt(id, 'offset', new Vector2());
    mesh.setUniformAt(id, 'extra', new Vector4());
    mesh.setUniformAt(id, 'basis', new Matrix3());
    mesh.setUniformAt(id, 'transform', new Matrix4());
  };
  set(0, new Vector3(1, 0, 0));
  ctx.render();
  for (const capacity of [2, 5, 17, 65]) {
    const start = mesh._instancesArrayCount;
    mesh.resizeBuffers(capacity);
    mesh.addInstances(capacity - start, (entity, id) => entity.position.x = id === capacity - 1 ? 0.5 : 10);
    for (let id = start; id < capacity; id++) set(id, new Vector3(0, 1, 0));
    if (start > 1) mesh.setMatrixAt(start - 1, new Matrix4().makeTranslation(10, 0, 0));
    ctx.render();
    ctx.pixel(16, [255, 0, 0]);
    ctx.pixel(48, [0, 255, 0]);
    mesh.setUniformAt(capacity - 1, 'tint', new Vector3(0, 0, 0));
    mesh.setUniformAt(capacity - 1, 'basis', new Matrix3().set(1, 0, 0, 0, 1, 0, 0, 0.5, 1));
    mesh.setUniformAt(capacity - 1, 'transform', new Matrix4().makeTranslation(0, 0.25, 0));
    ctx.render();
    ctx.pixel(16, [255, 0, 0]);
    ctx.pixel(48, [128, 64, 0], 2);
  }
});

test.each([false, true])('growth preserves pending writes before the first upload and after clear (BVH=%s)', (withBVH) => {
  const mesh = ctx.mesh({ capacity: 1, createEntities: true }, new PlaneGeometry(0.4, 0.4));
  mesh.addInstances(1);
  mesh.setColorAt(0, 0xff0000);
  if (withBVH) mesh.computeBVH();
  mesh.resizeBuffers(17);
  mesh.resizeBuffers(65);
  mesh.instances[0].position.x = -0.5;
  mesh.instances[0].updateMatrixPosition();
  ctx.render();
  ctx.pixel(16, [255, 0, 0]);
  ctx.pixel(48, [0, 0, 0]);
  mesh.clearInstances();
  mesh.resizeBuffers(257);
  mesh.addInstances(2, (entity, id) => entity.position.x = id ? 0.5 : -0.5);
  mesh.setColorAt(0, 0x0000ff);
  mesh.setColorAt(1, 0x00ff00);
  mesh.setVisibilityAt(0, false);
  ctx.render();
  ctx.pixel(16, [0, 0, 0]);
  ctx.pixel(48, [0, 255, 0]);
  mesh.setVisibilityAt(0, true);
  ctx.render();
  ctx.pixel(16, [0, 0, 255]);
  expect(renderedIds(mesh).sort()).toEqual([0, 1]);
});
