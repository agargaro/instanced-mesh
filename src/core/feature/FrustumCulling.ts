import { BVHNode } from "bvh.js";
import { Camera, Frustum, Material, Matrix4, Sphere, Vector3, WebGLRenderer } from "three";
import { getMaxScaleOnAxisAt, getPositionAt } from "../../utils/MatrixUtils.js";
import { sortOpaque, sortTransparent } from "../../utils/SortingUtils.js";
import { InstancedMesh2, LODLevel } from "../InstancedMesh2.js";
import { InstancedRenderList } from "../utils/InstancedRenderList.js";

// TODO: fix shadowMap LOD sorting objects?
// TODO SOON: set all visibility to false before compputing... if shadowLOD has different geometries is important.

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    performFrustumCulling(renderer: WebGLRenderer, camera: Camera, cameraLOD?: Camera): void;

    /** @internal */ frustumCulling(camera: Camera): void;
    /** @internal */ updateIndexArray(): void;
    /** @internal */ updateRenderList(): void;
    /** @internal */ BVHCulling(): void;
    /** @internal */ linearCulling(): void;

    /** @internal */ frustumCullingLOD(levels: LODLevel[], camera: Camera, cameraLOD: Camera): void;
    /** @internal */ BVHCullingLOD(levels: LODLevel[], sortObjects: boolean): void;
    /** @internal */ linearCullingLOD(levels: LODLevel[], sortObjects: boolean): void;
  }
}

const _frustum = new Frustum();
const _renderList = new InstancedRenderList();
const _projScreenMatrix = new Matrix4();
const _invMatrixWorld = new Matrix4();
const _forward = new Vector3();
const _cameraPos = new Vector3();
const _cameraLODPos = new Vector3();
const _position = new Vector3();
const _sphere = new Sphere();

InstancedMesh2.prototype.performFrustumCulling = function (renderer: WebGLRenderer, camera: Camera, cameraLOD = camera): void {
  const isShadowRendering = camera !== cameraLOD;
  const levels = !isShadowRendering ? this.levels : (this.shadowLevels ?? this.levels);

  if (levels?.length > 0) this.frustumCullingLOD(levels, camera, cameraLOD);
  else if (!this._LOD) this.frustumCulling(camera);

  this.instanceIndex.update(renderer, this._count);
}

InstancedMesh2.prototype.frustumCulling = function (camera: Camera): void {
  const sortObjects = this._sortObjects;
  const perObjectFrustumCulled = this._perObjectFrustumCulled;
  const array = this._indexArray;

  this.instanceIndex._needsUpdate = true; // TODO improve

  if (!perObjectFrustumCulled && !sortObjects) {
    this.updateIndexArray();
    return;
  }

  if (sortObjects) {
    _invMatrixWorld.copy(this.matrixWorld).invert();
    _cameraPos.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_invMatrixWorld);
    _forward.set(0, 0, -1).transformDirection(camera.matrixWorld).transformDirection(_invMatrixWorld);
  }

  if (!perObjectFrustumCulled) {

    this.updateRenderList();

  } else {

    _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.matrixWorld);

    if (this.bvh) this.BVHCulling();
    else this.linearCulling();

  }

  if (sortObjects) {
    const customSort = this.customSort;

    if (customSort === null) {
      _renderList.list.sort(!(this.material as Material)?.transparent ? sortOpaque : sortTransparent);
    } else {
      customSort(_renderList.list);
    }

    const list = _renderList.list;
    const count = list.length;
    for (let i = 0; i < count; i++) {
      array[i] = list[i].index;
    }

    this._count = count;
    _renderList.reset();
  }
}

InstancedMesh2.prototype.updateIndexArray = function (): void {
  if (!this._visibilityChanged) return;

  const array = this._indexArray;
  const instancesCount = this.instancesCount;
  let count = 0;

  for (let i = 0; i < instancesCount; i++) {
    if (this.getVisibilityAt(i)) {
      array[count++] = i;
    }
  }

  this._count = count;
  this._visibilityChanged = false;
}

InstancedMesh2.prototype.updateRenderList = function (): void {
  const instancesCount = this.instancesCount;

  for (let i = 0; i < instancesCount; i++) {
    if (this.getVisibilityAt(i)) {
      const matrix = this.getMatrixAt(i); // TODO improve avoiding copy
      const depth = _position.setFromMatrixPosition(matrix).sub(_cameraPos).dot(_forward);
      _renderList.push(depth, i);
    }
  }
}

InstancedMesh2.prototype.BVHCulling = function (): void {
  const array = this._indexArray;
  const matrixArray = this._matrixArray;
  const instancesCount = this.instancesCount;
  const sortObjects = this._sortObjects;
  let count = 0;

  this.bvh.frustumCulling(_projScreenMatrix, (node: BVHNode<{}, number>) => {
    const index = node.object;

    if (index < instancesCount && this.getVisibilityAt(index)) {
      if (sortObjects) {
        getPositionAt(index, matrixArray, _position);
        const depth = _position.sub(_cameraPos).dot(_forward); // instancedMesh can be less precise than sphere.center
        _renderList.push(depth, index);
      } else {
        array[count++] = index;
      }
    }
  });

  this._count = count;
}

InstancedMesh2.prototype.linearCulling = function (): void {
  const array = this._indexArray;
  const matrixArray = this._matrixArray;
  const bSphere = this.geometry.boundingSphere;
  const radius = bSphere.radius;
  const center = bSphere.center;
  const instancesCount = this.instancesCount;
  const geometryCentered = center.x === 0 && center.y === 0 && center.z === 0;
  const sortObjects = this._sortObjects;
  let count = 0;

  _frustum.setFromProjectionMatrix(_projScreenMatrix);

  for (let i = 0; i < instancesCount; i++) {
    if (!this.getVisibilityAt(i)) continue;

    if (geometryCentered) {
      getPositionAt(i, matrixArray, _sphere.center);
      _sphere.radius = radius * getMaxScaleOnAxisAt(i, matrixArray);
    } else {
      const matrix = this.getMatrixAt(i); // TODO: can be a little improved
      _sphere.center.copy(center).applyMatrix4(matrix);
      _sphere.radius = radius * matrix.getMaxScaleOnAxis();
    }

    if (_frustum.intersectsSphere(_sphere)) {
      if (sortObjects) {
        const depth = _position.subVectors(_sphere.center, _cameraPos).dot(_forward);
        _renderList.push(depth, i);
      } else {
        array[count++] = i;
      }
    }
  }

  this._count = count;
}

InstancedMesh2.prototype.frustumCullingLOD = function (levels: LODLevel[], camera: Camera, cameraLOD: Camera): void {
  const count = this._countIndexes;
  const isShadowRendering = camera !== cameraLOD;
  const sortObjects = !isShadowRendering && this._sortObjects;

  for (let i = 0; i < levels.length; i++) {
    count[i] = 0;

    if (levels[i].object.instanceIndex) {
      levels[i].object.instanceIndex._needsUpdate = true; // TODO improve
    }
  }

  _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.matrixWorld);
  _invMatrixWorld.copy(this.matrixWorld).invert();
  _cameraPos.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_invMatrixWorld);
  _cameraLODPos.setFromMatrixPosition(cameraLOD.matrixWorld).applyMatrix4(_invMatrixWorld);

  if (this.bvh) this.BVHCullingLOD(levels, sortObjects);
  else this.linearCullingLOD(levels, sortObjects);

  if (sortObjects) {
    const customSort = this.customSort;
    const list = _renderList.list;
    const indexes = this._indexes;
    let levelIndex = 0;
    let levelDistance = levels[1].distance;

    if (customSort === null) {
      list.sort(!(levels[0].object.material as Material)?.transparent ? sortOpaque : sortTransparent);
    } else {
      customSort(list);
    }

    for (let i = 0, l = list.length; i < l; i++) {
      const item = list[i];

      if (item.depth > levelDistance) { // > or >= ? capire in base all'altro algoritmo
        levelIndex++;
        levelDistance = levels[levelIndex + 1]?.distance ?? Infinity;
        // for fixa
      }

      indexes[levelIndex][count[levelIndex]++] = item.index; // TODO COUNT ARRAY QUI NON SERVE
    }

    _renderList.reset();
  }

  for (let i = 0; i < levels.length; i++) {
    const object = levels[i].object;
    object.visible = i === 0 || count[i] > 0;
    object._count = count[i];
  }
}

InstancedMesh2.prototype.BVHCullingLOD = function (levels: LODLevel[], sortObjects: boolean): void {
  const matrixArray = this._matrixArray;
  const instancesCount = this.instancesCount;
  const count = this._countIndexes; // reuse the same? also uintarray?
  const indexes = this._indexes;
  const visibilityArray = this.visibilityArray;

  if (sortObjects) { // todo refactor

    this.bvh.frustumCulling(_projScreenMatrix, (node: BVHNode<{}, number>) => {
      const index = node.object;
      if (index < instancesCount && visibilityArray[index]) {
        const distance = getPositionAt(index, matrixArray, _position).distanceToSquared(_cameraLODPos);
        _renderList.push(distance, index);
      }
    });

  } else {

    this.bvh.frustumCullingLOD(_projScreenMatrix, _cameraLODPos, levels, (node: BVHNode<{}, number>, level: number) => {
      const index = node.object;
      if (index < instancesCount && visibilityArray[index]) {

        if (level === null) {
          const distance = getPositionAt(index, matrixArray, _position).distanceToSquared(_cameraLODPos); // distance can be get by BVH
          level = this.getObjectLODIndexForDistance(levels, distance);
        }

        indexes[level][count[level]++] = index;
      }
    });

  }
}

InstancedMesh2.prototype.linearCullingLOD = function (levels: LODLevel[], sortObjects: boolean): void {
  const matrixArray = this._matrixArray;
  const bSphere = this.geometry.boundingSphere; // TODO check se esiste?
  const radius = bSphere.radius;
  const center = bSphere.center;
  const instancesCount = this.instancesCount;
  const geometryCentered = center.x === 0 && center.y === 0 && center.z === 0;

  _frustum.setFromProjectionMatrix(_projScreenMatrix);

  const count = this._countIndexes;
  const indexes = this._indexes;

  for (let i = 0; i < instancesCount; i++) {
    if (!this.visibilityArray[i]) continue; // opt anche nell'altra classe

    if (geometryCentered) {
      getPositionAt(i, matrixArray, _sphere.center);
      _sphere.radius = radius * getMaxScaleOnAxisAt(i, matrixArray);
    } else {
      const matrix = this.getMatrixAt(i); // opt instancedMesh getting only pos and scale
      _sphere.center.copy(center).applyMatrix4(matrix);
      _sphere.radius = radius * matrix.getMaxScaleOnAxis();
    }

    if (_frustum.intersectsSphere(_sphere)) {
      const distance = _sphere.center.distanceToSquared(_cameraLODPos);

      if (sortObjects) {
        _renderList.push(distance, i);
      } else {
        const levelIndex = this.getObjectLODIndexForDistance(levels, distance);
        indexes[levelIndex][count[levelIndex]++] = i;
      }
    }
  }
}
