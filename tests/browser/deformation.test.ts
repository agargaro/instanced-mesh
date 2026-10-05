import { afterEach, beforeEach, expect, test } from 'vitest';
import { Bone, DetachedBindMode, Float32BufferAttribute, Matrix4, Mesh, Object3D, PlaneGeometry, ShaderChunk, Skeleton, Uint16BufferAttribute, Vector3 } from 'three';
import { getMorphInstanceVertexChunk } from '../../src/shaders/ShaderChunkUtils.js';
import { createTestScene, expectNumbers, TestScene } from './helpers.js';

let ctx: TestScene;
beforeEach(() => {
  ctx = createTestScene();
});
afterEach(() => {
  ctx.dispose();
});

test.each([false, true])('renders and retrieves independent morph weights (relative=%s)', (relative) => {
  const geometry = new PlaneGeometry(0.6, 0.6);
  const positions = geometry.getAttribute('position');
  const data: number[] = [];
  for (let i = 0; i < positions.count; i++) data.push(relative ? 1 : positions.getX(i) + 1, relative ? 0 : positions.getY(i), relative ? 0 : positions.getZ(i));
  geometry.morphAttributes.position = [new Float32BufferAttribute(data, 3)];
  geometry.morphTargetsRelative = relative;
  const mesh = ctx.mesh({ createEntities: true }, geometry);
  mesh.addInstances(2, (entity, id) => entity.position.set(id === 0 ? -0.5 : 10, 0, 0));
  const source = new Mesh(geometry);
  const output = new Mesh(geometry);
  source.morphTargetInfluences[0] = 0;
  mesh.setMorphAt(0, source);
  source.morphTargetInfluences[0] = 0.25;
  mesh.instances[1].morph = source;
  expect(mesh.getMorphAt(1, output)).toBe(output);
  expect(output.morphTargetInfluences).toEqual([0.25]);
  const originalChunk = ShaderChunk.morphtarget_pars_vertex;
  ctx.render();
  ctx.pixel(16, [255, 255, 255]);
  ctx.pixel(48, [0, 0, 0]);
  source.morphTargetInfluences[0] = 1;
  mesh.instances[0].morph = source;
  ctx.render();
  ctx.pixel(16, [0, 0, 0]);
  ctx.pixel(48, [255, 255, 255]);
  expect(ShaderChunk.morphtarget_pars_vertex).toBe(originalChunk);
  expect(typeof getMorphInstanceVertexChunk()).toBe('string');
  mesh.resizeBuffers(16);
  expect(mesh.getMorphAt(0, output).morphTargetInfluences).toEqual([1]);
  ctx.render();
  ctx.pixel(48, [255, 255, 255]);
  mesh.removeInstances(1);
  mesh.resizeBuffers(1);
  expect(mesh.getMorphAt(0, output).morphTargetInfluences).toEqual([1]);
});

test.fails('getMorphAt without a target returns the current weights (known missing temporary mesh influences)', () => {
  const mesh = ctx.mesh({ createEntities: true });
  mesh.addInstances(1);
  const source = new Mesh();
  source.morphTargetInfluences = [0.25];
  mesh.setMorphAt(0, source);
  expect(() => mesh.instances[0].morph).not.toThrow();
  expect(mesh.instances[0].morph.morphTargetInfluences).toEqual([0.25]);
});

test.each([false, true])('renders independent bone poses and uploaded updates (autoUpdate=%s)', (automatic) => {
  const geometry = new PlaneGeometry(0.6, 0.6);
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  const weights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) weights[i * 4] = 1;
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(weights, 4));
  const mesh = ctx.mesh({ createEntities: true }, geometry);
  mesh.addInstances(2, (entity, id) => entity.position.set(id === 0 ? -0.5 : 10, 0, 0));
  expect(() => mesh.setBonesAt(0)).toThrow('initSkeleton');
  const parent = new Object3D();
  const bone = new Bone();
  bone.name = 'root';
  parent.add(bone);
  parent.updateMatrixWorld(true);
  const skeleton = new Skeleton([bone]);
  mesh.initSkeleton(skeleton, !automatic);
  const texture = mesh.boneTexture;
  mesh.initSkeleton(skeleton);
  expect(mesh.boneTexture).toBe(texture);
  expect(bone.matrixAutoUpdate).toBe(automatic);
  expect(bone.matrixWorldAutoUpdate).toBe(automatic);
  mesh.instances[0].updateBones();
  bone.position.x = 0.25;
  mesh.instances[1].updateBones();
  expectNumbers(texture._data.slice(16, 32), new Matrix4().makeTranslation(0.25, 0, 0).elements);
  ctx.render();
  ctx.pixel(16, [255, 255, 255]);
  bone.position.x = 1;
  mesh.setBonesAt(0);
  ctx.render();
  ctx.pixel(16, [0, 0, 0]);
  ctx.pixel(48, [255, 255, 255]);
  bone.position.x = 2;
  mesh.setBonesAt(0, true, new Set(['root']));
  expectNumbers(texture._data.slice(0, 16), new Matrix4().makeTranslation(1, 0, 0).elements);
  bone.matrixWorld.makeTranslation(0.75, 0, 0);
  mesh.setBonesAt(0, false);
  expectNumbers(texture._data.slice(0, 16), bone.matrixWorld.elements);
  mesh.resizeBuffers(32);
  expectNumbers(mesh.boneTexture._data.slice(0, 16), bone.matrixWorld.elements);
  skeleton.dispose();
});

test('bone matrices agree with Matrix4 multiplication for a hierarchy and inverse bind pose', () => {
  const mesh = ctx.mesh();
  mesh.addInstances(1);
  const parent = new Object3D();
  const root = new Bone();
  const child = new Bone();
  root.position.set(1, 2, 3);
  child.position.set(0, 1, 0);
  parent.add(root);
  root.add(child);
  parent.updateMatrixWorld(true);
  const skeleton = new Skeleton([root, child]);
  mesh.initSkeleton(skeleton);
  root.position.set(2, 3, 4);
  root.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), 0.4);
  child.scale.set(2, 3, 4);
  mesh.setBonesAt(0);
  for (let i = 0; i < 2; i++) {
    const expected = new Matrix4().multiplyMatrices(skeleton.bones[i].matrixWorld, skeleton.boneInverses[i]);
    expectNumbers(mesh.boneTexture._data.slice(i * 16, (i + 1) * 16), expected.elements);
  }
  mesh.position.set(3, 2, 1);
  mesh.updateMatrixWorld(true);
  expectNumbers(mesh.bindMatrixInverse.elements, mesh.matrixWorld.clone().invert().elements);
  mesh.bindMode = DetachedBindMode;
  mesh.bindMatrix.makeTranslation(1, 0, 0);
  mesh.updateMatrixWorld(true);
  expectNumbers(mesh.bindMatrixInverse.elements, mesh.bindMatrix.clone().invert().elements);
  skeleton.dispose();
});
