import assert from 'node:assert/strict';
import { Box3, Camera, Frustum, Intersection, Material, Matrix4, Mesh, PerspectiveCamera, Raycaster, Sphere, Vector3 } from 'three';
import { InstancedMesh2, LODRenderList } from '../src/index.js';

export function verifySortedDepths(actual: { index: number; depth: number }[], depths: Float32Array, transparent: boolean): void {
  assert.equal(actual.length, depths.length, 'Sorting lost entries');
  assert.equal(new Set(actual.map((entry) => entry.index)).size, depths.length, 'Sorting duplicated IDs');
  const expected = Array.from(depths).sort((a, b) => transparent ? b - a : a - b);
  for (let i = 0; i < actual.length; i++) {
    assert.equal(actual[i].depth, depths[actual[i].index], 'Sorting corrupted ID/depth pairs');
    assert.equal(actual[i].depth, expected[i], 'Invalid radix order');
  }
}

export function verifyBounds(mesh: InstancedMesh2, kind: 'box' | 'sphere'): void {
  const matrix = new Matrix4();
  const box = new Box3();
  const expectedBox = new Box3();
  const sphere = new Sphere();
  const expectedSphere = new Sphere();
  for (let i = 0; i < (mesh as any)._instancesArrayCount; i++) {
    if (!mesh.getActiveAt(i)) continue;
    matrix.fromArray(mesh.matricesTexture.image.data, i * 16);
    if (kind === 'box') expectedBox.union(box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix));
    else {
      sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(matrix);
      expectedSphere.union(sphere);
      assert.ok(mesh.boundingSphere.center.distanceTo(sphere.center) + sphere.radius <= mesh.boundingSphere.radius + 1e-4, 'Sphere does not contain an active instance');
    }
  }
  if (kind === 'box') {
    if (expectedBox.isEmpty()) {
      assert.ok(mesh.boundingBox.isEmpty());
      return;
    }
    assert.ok(mesh.boundingBox.min.distanceTo(expectedBox.min) < 1e-4, 'Incorrect box minimum');
    assert.ok(mesh.boundingBox.max.distanceTo(expectedBox.max) < 1e-4, 'Incorrect box maximum');
  } else if (expectedSphere.isEmpty()) {
    assert.ok(mesh.boundingSphere.isEmpty(), 'Sphere for an empty population must be empty');
  } else {
    assert.ok(Number.isFinite(mesh.boundingSphere.radius), 'Nonfinite sphere radius');
    assert.ok(mesh.boundingSphere.center.distanceTo(expectedSphere.center) < 1e-4, 'Incorrect sphere center');
    assert.ok(Math.abs(mesh.boundingSphere.radius - expectedSphere.radius) < 1e-4, 'Incorrect sphere radius');
  }
}

export function verifyBVHBounds(mesh: InstancedMesh2): void {
  const matrix = new Matrix4();
  const box = new Box3();
  for (let i = 0; i < (mesh as any)._instancesArrayCount; i++) {
    if (!mesh.getActiveAt(i)) continue;
    matrix.fromArray(mesh.matricesTexture.image.data, i * 16);
    box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix);
    const node = mesh.bvh.nodes[i]?.box;
    assert.ok(node, 'Missing active BVH node');
    assert.ok(node[0] <= box.min.x + 1e-4 && node[1] >= box.max.x - 1e-4 && node[2] <= box.min.y + 1e-4 && node[3] >= box.max.y - 1e-4 && node[4] <= box.min.z + 1e-4 && node[5] >= box.max.z - 1e-4, 'BVH bounds do not contain the transformed geometry');
  }
}

export function verifyCulling(mesh: InstancedMesh2, camera: Camera, lod?: LODRenderList, cameraLOD = camera): void {
  const expected = referenceVisibleIDs(mesh, camera);
  const actual = lod
    ? lod.levels.flatMap(({ object }, i) => {
        assert.equal(object.count, lod.count[i], 'LOD count does not match render list');
        return Array.from(object.instanceIndex.array.slice(0, object.count));
      })
    : Array.from(mesh.instanceIndex.array.slice(0, mesh.count));
  assert.equal(actual.length, expected.size, 'Unexpected visible count');
  assert.deepEqual(new Set(actual), expected, 'Unexpected visible IDs');
  if (lod) verifyLODMembership(mesh, lod, cameraLOD);
  else verifyNativeOrder(mesh, camera, actual);
}

function referenceVisibleIDs(mesh: InstancedMesh2, camera: Camera): Set<number> {
  const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(mesh.matrixWorld));
  const matrix = new Matrix4();
  const box = new Box3();
  const sphere = new Sphere();
  const expected = new Set<number>();
  for (let i = 0; i < (mesh as any)._instancesArrayCount; i++) {
    if (!mesh.getActiveAndVisibilityAt(i)) continue;
    matrix.fromArray(mesh.matricesTexture.image.data, i * 16);
    const visible = mesh.bvh
      ? frustum.intersectsBox(box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix))
      : frustum.intersectsSphere(sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(matrix));
    if (visible && (!mesh.onFrustumEnter || mesh.onFrustumEnter(i, camera))) expected.add(i);
  }
  return expected;
}

function referenceLODLevel(lod: LODRenderList, distanceLOD: boolean, distance: number, radius: number, projection: number): number {
  const metric = radius / (distance * projection);
  let result = 0;
  for (let i = 1; i < lod.levels.length; i++) {
    const level = lod.levels[i];
    const selected = distanceLOD
      ? distance * distance >= level.metricSquared * (1 - level.hysteresis)
      : metric <= level.metric;
    if (selected) result = i;
  }
  return result;
}

function verifyLODMembership(mesh: InstancedMesh2, lod: LODRenderList, cameraLOD: Camera): void {
  const matrix = new Matrix4();
  const sphere = new Sphere();
  const cameraPosition = new Vector3().setFromMatrixPosition(cameraLOD.matrixWorld).applyMatrix4(mesh.matrixWorld.clone().invert());
  const distanceLOD = (mesh as any)._useDistanceForLOD;
  const projection = Math.tan((cameraLOD as PerspectiveCamera).fov * Math.PI / 360);
  for (let levelIndex = 0; levelIndex < lod.levels.length; levelIndex++) {
    const object = lod.levels[levelIndex].object;
    for (const id of object.instanceIndex.array.slice(0, object.count)) {
      matrix.fromArray(mesh.matricesTexture.image.data, id * 16);
      sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(matrix);
      const distance = sphere.center.distanceTo(cameraPosition);
      const expectedLevel = referenceLODLevel(lod, distanceLOD, distance, sphere.radius, projection);
      assert.equal(levelIndex, expectedLevel, 'Incorrect LOD membership for instance ' + id);
    }
  }
}

function verifyNativeOrder(mesh: InstancedMesh2, camera: Camera, actual: number[]): void {
  const matrix = new Matrix4();
  if (!mesh.sortObjects || mesh.customSort) return;
  const view = new Matrix4().multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld);
  let previous = (mesh.material as any).transparent ? Infinity : -Infinity;
  for (const id of actual) {
    matrix.fromArray(mesh.matricesTexture.image.data, id * 16);
    const elements = matrix.elements;
    const v = view.elements;
    const depth = -(v[2] * elements[12] + v[6] * elements[13] + v[10] * elements[14] + v[14]);
    if ((mesh.material as any).transparent) assert.ok(depth <= previous + 1e-6);
    else assert.ok(depth >= previous - 1e-6);
    previous = depth;
  }
}

export function referenceRayHits(mesh: InstancedMesh2, ray: Raycaster): Intersection[] {
  const reference = new Mesh(mesh.geometry, mesh.material as Material);
  const expected: Intersection[] = [];
  for (let i = 0; i < (mesh as any)._instancesArrayCount; i++) {
    if (!mesh.getActiveAndVisibilityAt(i)) continue;
    reference.matrixWorld.fromArray(mesh.matricesTexture.image.data, i * 16).premultiply(mesh.matrixWorld);
    const hits: Intersection[] = [];
    reference.raycast(ray, hits);
    for (const hit of hits) {
      hit.instanceId = i;
      expected.push(hit);
    }
  }
  return expected;
}

export function verifyRayHits(actual: Intersection[], expected: Intersection[]): void {
  const order = (a: Intersection, b: Intersection): number => a.instanceId - b.instanceId || a.distance - b.distance;
  actual.sort(order);
  expected.sort(order);
  assert.deepEqual(actual.map((hit) => hit.instanceId), expected.map((hit) => hit.instanceId));
  for (let i = 0; i < expected.length; i++) assert.ok(Math.abs(actual[i].distance - expected[i].distance) < 1e-5);
}
