import { BVHNode } from 'bvh.js';
import { Camera, Frustum, Material, Matrix4, Sphere, Vector3 } from 'three';
import { sortOpaque, sortTransparent } from '../../utils/SortingUtils.js';
import { InstancedMesh2 } from '../InstancedMesh2.js';
import { InstancedRenderItem, InstancedRenderList } from '../utils/InstancedRenderList.js';
import { LODRenderList } from './LOD.js';

// TODO: fix shadowMap LOD sorting objects?

/**
 * A custom sorting callback for render items.
 */
export type CustomSortCallback = (list: InstancedRenderItem[]) => void;

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    /**
     * Performs frustum culling and manages LOD visibility.
     * @param camera The main camera used for rendering.
     * @param cameraLOD An optional camera for LOD calculations. Defaults to the main camera.
     */
    performFrustumCulling(camera: Camera, cameraLOD?: Camera): void;

    /** @internal */ frustumCulling(camera: Camera): void;
    /** @internal */ updateIndexArray(): void;
    /** @internal */ updateRenderList(): void;
    /** @internal */ BVHCulling(): void;
    /** @internal */ linearCulling(): void;

    /** @internal */ frustumCullingLOD(LODrenderList: LODRenderList, objects: InstancedMesh2[], camera: Camera, cameraLOD: Camera): void;
    /** @internal */ BVHCullingLOD(LODrenderList: LODRenderList, indexes: Uint32Array[], sortObjects: boolean): void;
    /** @internal */ linearCullingLOD(LODrenderList: LODRenderList, indexes: Uint32Array[], sortObjects: boolean): void;
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

InstancedMesh2.prototype.performFrustumCulling = function (camera: Camera, cameraLOD = camera): void {
  const info = this.LODinfo;
  const isShadowRendering = camera !== cameraLOD;
  let LODrenderList: LODRenderList;

  if (info) {
    LODrenderList = !isShadowRendering ? info.render : (info.shadowRender ?? info.render);

    // Hide all LODs except this one. They will be shown after frustum culling if at least one instance is visible.
    for (const object of info.objects) {
      if (object === this) object._count = 0;
      else object.visible = false;
    }
  }

  if (LODrenderList?.levels.length > 0) this.frustumCullingLOD(LODrenderList, info.objects, camera, cameraLOD);
  else if (!this._parentLOD) this.frustumCulling(camera);

  this.instanceIndex.update(this._renderer, this._count);
};

InstancedMesh2.prototype.frustumCulling = function (camera: Camera): void {
  const sortObjects = this._sortObjects;
  const perObjectFrustumCulled = this._perObjectFrustumCulled;
  const array = this.instanceIndex.array;

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
      _renderList.array.sort(!(this._material as Material)?.transparent ? sortOpaque : sortTransparent);
    } else {
      customSort(_renderList.array);
    }

    const list = _renderList.array;
    const count = list.length;
    for (let i = 0; i < count; i++) {
      array[i] = list[i].index;
    }

    this._count = count;
    _renderList.reset();
  }
};

InstancedMesh2.prototype.updateIndexArray = function (): void {
  if (!this._indexArrayNeedsUpdate) return;

  const array = this.instanceIndex.array;
  const instancesCount = this._instancesCount;
  let count = 0;

  for (let i = 0; i < instancesCount; i++) {
    if (this.getVisibilityAt(i)) {
      array[count++] = i;
    }
  }

  this._count = count;
  this._indexArrayNeedsUpdate = false;
};

InstancedMesh2.prototype.updateRenderList = function (): void {
  const instancesCount = this._instancesCount;

  for (let i = 0; i < instancesCount; i++) {
    if (this.getVisibilityAt(i)) {
      const depth = this.getPositionAt(i).sub(_cameraPos).dot(_forward);
      _renderList.push(depth, i);
    }
  }
};

InstancedMesh2.prototype.BVHCulling = function (): void {
  const array = this.instanceIndex.array;
  const instancesCount = this._instancesCount;
  const sortObjects = this._sortObjects;
  let count = 0;

  this.bvh.frustumCulling(_projScreenMatrix, (node: BVHNode<{}, number>) => {
    const index = node.object;

    if (index < instancesCount && this.getVisibilityAt(index)) {
      if (sortObjects) {
        const depth = this.getPositionAt(index).sub(_cameraPos).dot(_forward);
        _renderList.push(depth, index);
      } else {
        array[count++] = index;
      }
    }
  });

  this._count = count;
};

InstancedMesh2.prototype.linearCulling = function (): void {
  const array = this.instanceIndex.array;
  const bSphere = this._geometry.boundingSphere;
  const radius = bSphere.radius;
  const center = bSphere.center;
  const instancesCount = this._instancesCount;
  const geometryCentered = center.x === 0 && center.y === 0 && center.z === 0;
  const sortObjects = this._sortObjects;
  let count = 0;

  _frustum.setFromProjectionMatrix(_projScreenMatrix);

  for (let i = 0; i < instancesCount; i++) {
    if (!this.getVisibilityAt(i)) continue;

    if (geometryCentered) {
      const maxScale = this.getPositionAndMaxScaleOnAxisAt(i, _sphere.center);
      _sphere.radius = radius * maxScale;
    } else {
      this.applyMatrixToSphereAt(i, _sphere, center, radius);
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
};

InstancedMesh2.prototype.frustumCullingLOD = function (LODrenderList: LODRenderList, objects: InstancedMesh2[], camera: Camera, cameraLOD: Camera): void {
  const { count, levels } = LODrenderList;
  const isShadowRendering = camera !== cameraLOD;
  const sortObjects = !isShadowRendering && this._sortObjects; // sort is disabled when render shadows

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

  const indexes = LODrenderList.levels.map((x) => x.object.instanceIndex.array) as Uint32Array[];

  if (this.bvh) this.BVHCullingLOD(LODrenderList, indexes, sortObjects);
  else this.linearCullingLOD(LODrenderList, indexes, sortObjects);

  if (sortObjects) {
    const customSort = this.customSort;
    const list = _renderList.array;
    let levelIndex = 0;
    let levelDistance = levels[1].distance;

    if (customSort === null) {
      list.sort(!(levels[0].object._material as Material)?.transparent ? sortOpaque : sortTransparent); // TODO improve multimaterial handling
    } else {
      customSort(list);
    }

    for (let i = 0, l = list.length; i < l; i++) {
      const item = list[i];

      if (item.depth > levelDistance) {
        levelIndex++;
        levelDistance = levels[levelIndex + 1]?.distance ?? Infinity; // improve this condition and use for of instead
      }

      indexes[levelIndex][count[levelIndex]++] = item.index;
    }

    _renderList.reset();
  }

  for (let i = 0; i < levels.length; i++) {
    const object = levels[i].object;
    object.visible = object === this || count[i] > 0;
    object._count = count[i];
  }
};

InstancedMesh2.prototype.BVHCullingLOD = function (LODrenderList: LODRenderList, indexes: Uint32Array[], sortObjects: boolean): void {
  const { count, levels } = LODrenderList;
  const instancesCount = this._instancesCount;

  if (sortObjects) {
    this.bvh.frustumCulling(_projScreenMatrix, (node: BVHNode<{}, number>) => {
      const index = node.object;
      if (index < instancesCount && this.getVisibilityAt(index)) {
        const distance = this.getPositionAt(index).distanceToSquared(_cameraLODPos);
        _renderList.push(distance, index);
      }
    });
  } else {
    this.bvh.frustumCullingLOD(_projScreenMatrix, _cameraLODPos, levels, (node: BVHNode<{}, number>, level: number) => {
      const index = node.object;
      if (index < instancesCount && this.getVisibilityAt(index)) {
        if (level === null) {
          const distance = this.getPositionAt(index).distanceToSquared(_cameraLODPos); // distance can be get by BVH, but is not the distance from center
          level = this.getObjectLODIndexForDistance(levels, distance);
        }

        indexes[level][count[level]++] = index;
      }
    });
  }
};

InstancedMesh2.prototype.linearCullingLOD = function (LODrenderList: LODRenderList, indexes: Uint32Array[], sortObjects: boolean): void {
  const { count, levels } = LODrenderList;
  const bSphere = this._geometry.boundingSphere;
  const radius = bSphere.radius;
  const center = bSphere.center;
  const instancesCount = this._instancesCount;
  const geometryCentered = center.x === 0 && center.y === 0 && center.z === 0;

  _frustum.setFromProjectionMatrix(_projScreenMatrix);

  for (let i = 0; i < instancesCount; i++) {
    if (!this.getVisibilityAt(i)) continue; // TODO check getVisibilityAt performance vs access to direct array

    if (geometryCentered) {
      const maxScale = this.getPositionAndMaxScaleOnAxisAt(i, _sphere.center);
      _sphere.radius = radius * maxScale;
    } else {
      this.applyMatrixToSphereAt(i, _sphere, center, radius);
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
};
