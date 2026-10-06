import { afterEach, beforeEach, expect, test } from 'vitest';
import { Bone, BoxGeometry, Color, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, Object3D, Skeleton, SkinnedMesh } from 'three';
import { createInstancedMesh2From, createRadixSort, InstancedRenderList, patchShader } from '../../src/index.js';
import { createTestScene, expectNumbers, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

test('creates an instanced mesh from a regular mesh with the supplied configuration', () => {
  const original = new Mesh(new BoxGeometry(0.5, 0.5, 0.5), new MeshBasicMaterial());
  const converted = createInstancedMesh2From(original, { renderer: ctx.renderer, capacity: 8, createEntities: true });
  try {
    expect(converted.capacity).toBe(8);
    expect(converted.geometry).toBe(original.geometry);
    expect(converted.material).toBe(original.material);
    converted.addInstances(1);
    expect(converted.instances[0].owner).toBe(converted);
    ctx.scene.add(converted);
    ctx.render();
    ctx.pixel(32, [255, 255, 255]);
  } finally {
    converted.dispose();
    converted.geometry.dispose();
    original.material.dispose();
  }
});

test.each([false, true])('converts native InstancedMesh transforms and colors (colors=%s)', (withColor) => {
  const original = new InstancedMesh(new BoxGeometry(0.5, 0.5, 0.5), new MeshBasicMaterial(), 2);
  original.setMatrixAt(0, new Matrix4().makeTranslation(-0.5, 0, 0));
  original.setMatrixAt(1, new Matrix4().makeTranslation(0.5, 0, 0));
  original.position.y = 0.1;
  if (withColor) {
    original.setColorAt(0, new Color(0xff0000));
    original.setColorAt(1, new Color(0x00ff00));
  }
  const converted = createInstancedMesh2From(original, { renderer: ctx.renderer, capacity: 1 });
  try {
    expect(converted.geometry).not.toBe(original.geometry);
    expect(converted.capacity).toBe(2);
    expect(converted.instancesCount).toBe(2);
    expectNumbers(converted.getPositionAt(0).toArray(), [-0.5, 0, 0]);
    expectNumbers(converted.position.toArray(), original.position.toArray());
    ctx.scene.add(converted);
    ctx.render();
    ctx.pixel(16, withColor ? [255, 0, 0] : [255, 255, 255]);
    ctx.pixel(48, withColor ? [0, 255, 0] : [255, 255, 255]);
  } finally {
    converted.dispose();
    converted.geometry.dispose();
    original.dispose();
    original.geometry.dispose();
    original.material.dispose();
  }
});

test('converts a skinned mesh and shares its skeleton while isolating geometry', () => {
  const original = new SkinnedMesh(new BoxGeometry(), new MeshBasicMaterial());
  const parent = new Object3D();
  const bone = new Bone();
  parent.add(bone);
  parent.updateMatrixWorld(true);
  const skeleton = new Skeleton([bone]);
  original.bind(skeleton);
  const converted = createInstancedMesh2From(original, { renderer: ctx.renderer });
  try {
    expect(converted.geometry).not.toBe(original.geometry);
    expect(converted.skeleton).toBe(skeleton);
    expect(converted.boneTexture).not.toBeNull();
  } finally {
    converted.dispose();
    converted.geometry.dispose();
    original.geometry.dispose();
    original.material.dispose();
    skeleton.dispose();
  }
});

test('conversion handles instanced attributes without mutating source geometry', () => {
  const original = new InstancedMesh(new BoxGeometry(), new MeshBasicMaterial(), 1);
  original.geometry.setAttribute('custom', new InstancedBufferAttribute(new Float32Array([1]), 1));
  const converted = createInstancedMesh2From(original, { renderer: ctx.renderer, capacity: 1 });
  expect(original.geometry.getAttribute('custom')).not.toBeUndefined();
  expect(converted.geometry).not.toBe(original.geometry);
  converted.dispose();
  converted.geometry.dispose();
  original.dispose();
  original.geometry.dispose();
  original.material.dispose();
});

test('render-list pooling resets contents while reusing items', () => {
  const list = new InstancedRenderList();
  list.push(3, 7);
  list.push(1, 4);
  const item = list.array[0];
  expect(list.array.map((entry) => entry.index)).toEqual([7, 4]);
  list.reset();
  expect(list.array).toEqual([]);
  list.push(9, 2);
  expect(list.array[0]).toBe(item);
  expect(list.array[0].depth).toBe(9);
  expect(list.array[0].index).toBe(2);
});

test('radix sorting handles empty, singleton and equal-depth lists', () => {
  const mesh = ctx.mesh();
  const sort = createRadixSort(mesh);
  const list = new InstancedRenderList();
  sort(list.array);
  expect(list.array).toEqual([]);
  list.push(1, 3);
  sort(list.array);
  expect(list.array[0].index).toBe(3);
  list.push(1, 5);
  sort(list.array);
  expect(list.array.map((entry) => entry.index).sort()).toEqual([3, 5]);
});

test('patchShader preserves surrounding GLSL and unrelated shader code', () => {
  expect(patchShader('before\n#ifdef USE_INSTANCING\nafter')).toBe('before\n#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT\nafter');
  expect(patchShader('void main() {}')).toBe('void main() {}');
});
