import assert from 'node:assert/strict';
import { Box3, BoxGeometry, DataTexture, FloatType, Matrix4, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, Raycaster, RedFormat, ShaderChunk, Vector3, WebGLRenderer } from 'three';
import { InstancedMesh2 } from '../src/index.js';
import { compareResults } from '../benchmarks/compare.js';

let passed = 0;
function check(name: string, run: () => void): void {
  run();
  passed++;
  console.log('PASS ' + name);
}

const gl = { UNSIGNED_INT: 5125, ARRAY_BUFFER: 34962, DYNAMIC_DRAW: 35048, createBuffer: () => ({}), bindBuffer: () => {}, bufferData: () => {}, bufferSubData: () => {} };
const renderer = { getContext: () => gl } as unknown as WebGLRenderer;
function mesh(capacity = 8, withRenderer = false, createEntities = false): InstancedMesh2 {
  return new InstancedMesh2(new BoxGeometry(), new MeshBasicMaterial(), { capacity, renderer: withRenderer ? renderer : undefined, createEntities });
}
function currentBox(object: InstancedMesh2, id = 0): number[] {
  const box = new Box3().copy(object.geometry.boundingBox).applyMatrix4(object.getMatrixAt(id));
  return Array.from(new Float32Array([box.min.x, box.max.x, box.min.y, box.max.y, box.min.z, box.max.z]));
}

check('BVH stationary decimal position and repeated movement', () => {
  const object = new InstancedMesh2(new BoxGeometry().translate(-1000, 0, 0), new MeshBasicMaterial(), { capacity: 1, createEntities: true });
  object.addInstances(1, (entity) => entity.position.set(1000.1, 0, 0));
  object.computeBVH();
  for (let i = 0; i < 40000; i++) object.instances[0].updateMatrixPosition();
  assert.deepEqual(Array.from(object.bvh.nodes[0].box), currentBox(object));
  let hits = 0;
  object.bvh.raycast(new Raycaster(new Vector3(0.1, 0, 5), new Vector3(0, 0, -1)), () => hits++);
  assert.equal(hits, 1);
  for (let i = 0; i < 1000; i++) {
    object.instances[0].position.x = 1000 + (i % 7) * 0.1;
    object.instances[0].updateMatrixPosition();
    assert.deepEqual(Array.from(object.bvh.nodes[0].box), currentBox(object));
  }
});

check('BVH recovers after automatic updates are disabled', () => {
  for (const margin of [0, 0.2]) {
    const object = mesh(2, false, true);
    object.addInstances(1);
    object.computeBVH({ margin });
    object.autoUpdateBVH = false;
    object.instances[0].position.x = 100;
    object.instances[0].updateMatrixPosition();
    object.autoUpdateBVH = true;
    object.instances[0].position.x = 101.1;
    object.instances[0].updateMatrixPosition();
    const box = object.bvh.nodes[0].box;
    const expected = currentBox(object);
    assert.ok(box[0] <= expected[0] && box[1] >= expected[1]);
  }
});

check('optimized affine boxes agree with transformed corner bounds', () => {
  const object = new InstancedMesh2(new BoxGeometry(2, 3, 4).translate(1, -2, 3), new MeshBasicMaterial(), { capacity: 1 });
  object.addInstances(1);
  object.computeBVH();
  for (let i = 0; i < 300; i++) {
    const matrix = new Matrix4().set(Math.sin(i) * 3, 0.7, -0.2, i / 7, 0.4, Math.cos(i) * 2, 0.3, -i / 9, -0.6, 0.2, Math.sin(i + 2), 0.1, 0, 0, 0, 1);
    object.setMatrixAt(0, matrix);
    const expected = currentBox(object);
    const actual = object.bvh.nodes[0].box;
    for (let j = 0; j < 6; j++) assert.ok(Math.abs(actual[j] - expected[j]) <= Math.max(1, Math.abs(expected[j])) * 1e-6);
  }
});

check('BVH capacity, deletion, reused IDs and clear', () => {
  const object = mesh(2);
  object.addInstances(2);
  object.computeBVH();
  object.addInstances(4);
  assert.equal(object.bvh.nodes.length, object.capacity);
  object.removeInstances(1, 4);
  assert.equal(object.bvh.nodes[1], null);
  object.addInstances(2);
  assert.ok(object.bvh.nodes[1]);
  assert.ok(object.bvh.nodes[4]);
  object.clearInstances();
  assert.ok(object.bvh.nodes.every((node) => node === null));
});

check('orthographic cameras only reject distance LOD', () => {
  const object = mesh(2, true);
  object.addInstances(1);
  const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
  camera.position.z = 10;
  camera.updateMatrixWorld();
  assert.doesNotThrow(() => object.performFrustumCulling(camera));
  object.addLOD(new BoxGeometry(), new MeshBasicMaterial(), 10);
  assert.throws(() => object.performFrustumCulling(camera), /Distance-based LOD/);
  assert.doesNotThrow(() => object.performFrustumCulling(camera, new PerspectiveCamera()));
});

check('morph shader patch is local and geometry sharing isolates indices', () => {
  const object = mesh(2, true);
  object.morphTexture = new DataTexture(new Float32Array(4), 2, 2);
  const chunk = ShaderChunk.morphinstance_vertex;
  const shader = { uniforms: {}, defines: {}, vertexShader: '#include <morphinstance_vertex>\nvoid main() {}', fragmentShader: '' };
  (object as any)._onBeforeCompile(shader, renderer);
  assert.equal(ShaderChunk.morphinstance_vertex, chunk);
  assert.ok(shader.vertexShader.includes('instanceIndex'));
  const other = new InstancedMesh2(object.geometry, object.material, { renderer, capacity: 2 });
  assert.notEqual(other.geometry, object.geometry);
  assert.notEqual(other.instanceIndex, object.instanceIndex);
  assert.equal(other.geometry.getAttribute('instanceIndex'), other.instanceIndex);
});

check('capacity shrink preserves active IDs and can regrow with morph data', () => {
  const object = mesh(8);
  object.addInstances(8);
  object.computeBVH();
  object.morphTexture = new DataTexture(new Float32Array(16).fill(0.25), 2, 8, RedFormat, FloatType);
  const matrices = object.matricesTexture._data;
  const morphData = object.morphTexture.image.data;
  assert.throws(() => object.resizeBuffers(2), /active instance IDs/);
  assert.equal(object.capacity, 8);
  assert.equal(object.instancesCount, 8);
  assert.equal(object.bvh.nodes.length, 8);
  assert.equal(object.matricesTexture._data, matrices);
  assert.equal(object.morphTexture.image.data, morphData);
  object.removeInstances(1, 2, 3, 4, 5, 6);
  assert.equal(object.instancesCount, 2);
  assert.throws(() => object.resizeBuffers(2), /active instance IDs/);
  assert.ok(object.bvh.nodes[7]);
  object.removeInstances(7);
  object.resizeBuffers(2);
  assert.equal(object.instancesCount, 1);
  assert.equal(object.bvh.nodes.length, 2);
  assert.equal(object.morphTexture.image.data.length, 4);
  assert.ok(Array.from(object.morphTexture.image.data).every((value) => value === 0.25));
  object.addInstances(3, (entity, id) => entity.position.set(id, 0, 0));
  assert.equal(object.instancesCount, 4);
  assert.equal(object.getActiveAt(3), true);
  assert.ok(object.bvh.nodes[3]);
  assert.throws(() => object.resizeBuffers(-1), RangeError);
});

check('capacity shrink through LOD preserves shared data and rejects active ID loss', () => {
  const object = mesh(8, true);
  object.addInstances(8);
  object.addLOD(new BoxGeometry(), new MeshBasicMaterial(), 10);
  const child = object.LODinfo.objects[1];
  assert.throws(() => child.resizeBuffers(2), /active instance IDs/);
  assert.ok(object.LODinfo.objects.every((level) => level.capacity === 8));
  object.removeInstances(2, 3, 4, 5, 6, 7);
  child.resizeBuffers(2);
  assert.equal(object.instancesCount, 2);
  for (const level of object.LODinfo.objects) {
    assert.equal(level.capacity, 2);
    assert.equal(level.instanceIndex.array.length, 2);
    assert.equal(level.availabilityArray, object.availabilityArray);
    assert.equal(level.matricesTexture, object.matricesTexture);
  }
  object.addInstances(1);
  assert.equal(object.instancesCount, 3);
  assert.equal(object.getActiveAt(2), true);
});

check('benchmark comparison uses throughput and rejects missing or invalid results', () => {
  const result = (name: string, value: number): { name: string; value: number; unit: string } => ({ name, value, unit: 'ops/sec' });
  assert.equal(compareResults([result('case', 100)], [result('case', 200)])[0].alert, false);
  assert.equal(compareResults([result('case', 100)], [result('case', 80)])[0].alert, true);
  assert.equal(compareResults([result('case', 115)], [result('case', 100)])[0].alert, false);
  assert.throws(() => compareResults([result('case', 100)], []));
  assert.throws(() => compareResults([result('case', 100)], [result('other', 100)]));
  assert.throws(() => compareResults([result('case', 100)], [result('case', Number.NaN)]));
});

console.log(`${passed} regression checks passed.`);
