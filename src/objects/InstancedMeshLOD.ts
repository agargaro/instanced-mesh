import { BVHNode } from "bvh.js";
import { BufferGeometry, Camera, Color, ColorRepresentation, DataTexture, Frustum, Material, Matrix4, Object3D, Sphere, Vector3, WebGLRenderer } from "three";
import { createTexture_mat4, createTexture_vec4 } from "../utils/createTexture.js";
import { BVHParams, Entity, InstancedMesh2, UpdateEntityCallback } from "./InstancedMesh2.js";
import { InstancedMeshBVH } from "./InstancedMeshBVH.js";
import { InstancedRenderItem, InstancedRenderList } from "./InstancedRenderList.js";

export interface LODLevel<TCustomData = {}> {
  distance: number;
  hysteresis: number;
  object: InstancedMesh2<TCustomData>;
}

// TODO SOON: instancedMeshLOD rendering first nearest levels, look out to transparent
// TODO SOON: fix shadow
// TODO SOON: shared matrices and BVH

export class InstancedMeshLOD<TCustomData = {}> extends Object3D {
  public isInstancedMeshLOD = true;
  public instancesCount: number; // TODO handle update from dynamic to static
  public perObjectFrustumCulled = true;
  public sortObjects = false; // TODO should this be true?
  public customSort: (list: InstancedRenderItem[]) => void = null;
  public visibilityArray: boolean[];
  public matricesTexture: DataTexture;
  public colorsTexture: DataTexture = null;
  public morphTexture: DataTexture = null;
  public instances: Entity<TCustomData>[];
  /** @internal */ public _matrixArray: Float32Array;
  /** @internal */ public _colorArray: Float32Array;
  protected _renderer: WebGLRenderer;
  protected _maxCount: number;
  protected _indexes: Uint32Array[] = []; // TODO can be also uin16
  protected _countIndexes: number[] = [];

  // HACK TO MAKE IT WORK WITHOUT UPDATE CORE
  private readonly isLOD = true;
  public autoUpdate = true;
  public levels: LODLevel<TCustomData>[] = [];

  public bvh: InstancedMeshBVH;
  // public raycastOnlyFrustum = false;

  // public override customDepthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  // public override customDistanceMaterial = new MeshDistanceMaterial();

  public get maxCount() { return this._maxCount }

  constructor(renderer: WebGLRenderer, count: number) {
    super();
    this._renderer = renderer;
    this.instancesCount = count;
    this._maxCount = count;

    this.visibilityArray = new Array(count).fill(true);

    this.matricesTexture = createTexture_mat4(count);
    this._matrixArray = this.matricesTexture.image.data as unknown as Float32Array;
  }

  public addLevel(geometry: BufferGeometry, material: Material, distance = 0, hysteresis = 0): this {
    const levels = this.levels;
    const object = new InstancedMesh2<TCustomData>(this._maxCount, geometry, material, this);
    distance = Math.abs(distance ** 2); // to avoid to use Math.sqrt every time
    let index;

    for (index = 0; index < levels.length; index++) {
      if (distance < levels[index].distance) break;
    }

    levels.splice(index, 0, { distance, hysteresis, object });

    this._countIndexes.push(0);
    this._indexes.splice(index, 0, object._indexArray);

    this.add(object);
    return this;
  }

  public removeLevel(): this {
    throw new Error("'removeLevel' is not implemented yet.");
  }

  public getObjectIndexForDistance(distance: number): number {
    const levels = this.levels;

    for (let i = levels.length - 1; i > 0; i--) {
      const level = levels[i];
      const levelDistance = level.distance - (level.distance * level.hysteresis);
      if (distance >= levelDistance) return i;
    }

    return 0;
  }

  public update(camera: Camera): void {
    if (!this.perObjectFrustumCulled) return; // TODO ovviamente bisogna ricalcolare tutte le distanze
    this.frustumCulling(camera);
  }

  public updateInstances(onUpdate: UpdateEntityCallback<Entity<TCustomData>>): void {
    this.levels[0].object.updateInstances(onUpdate); // TODO meglio
  }

  public computeBVH(config: BVHParams = {}): void {
    if (!this.bvh) this.bvh = new InstancedMeshBVH(this, config.margin, config.highPrecision);
    this.bvh.clear();
    this.bvh.create();
  }

  public setMatrixAt(id: number, matrix: Matrix4): void {
    matrix.toArray(this._matrixArray, id * 16);

    if (this.instances) {
      const instance = this.instances[id];
      matrix.decompose(instance.position, instance.quaternion, instance.scale);
    }

    this.matricesTexture.needsUpdate = true; // TODO 
    // this.bvh?.move(id);
  }

  public getMatrixAt(id: number, matrix = _tempMat4): Matrix4 {
    return matrix.fromArray(this._matrixArray, id * 16);
  }

  public setVisibilityAt(id: number, visible: boolean): void {
    this.visibilityArray[id] = visible;
  }

  public getVisibilityAt(id: number): boolean {
    return this.visibilityArray[id];
  }

  public setColorAt(id: number, color: ColorRepresentation): void {
    if (this.colorsTexture === null) {
      this.colorsTexture = createTexture_vec4(this._maxCount); // we use vec4 because createTexture_vec3 doesn't exist
      this._colorArray = this.colorsTexture.image.data as unknown as Float32Array;
    }

    if ((color as Color).isColor) {
      (color as Color).toArray(this._colorArray, id * 4); // even if is vec3, we need 4 because RGB format is removed from three.js
    } else {
      _tempCol.set(color).toArray(this._colorArray, id * 4);
    }

    this.colorsTexture.needsUpdate = true; // TODO 
  }

  public getColorAt(id: number, color = _tempCol): Color {
    return color.fromArray(this._colorArray, id * 4);
  }

  protected frustumCulling(camera: Camera): void {
    const levels = this.levels;
    const count = this._countIndexes;

    for (let i = 0; i < levels.length; i++) {
      count[i] = 0;
    }

    _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.matrixWorld);
    _invMatrixWorld.copy(this.matrixWorld).invert();
    _cameraPos.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_invMatrixWorld);

    if (this.bvh) this.BVHCulling();
    else this.linearCulling();

    if (this.sortObjects) {
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
      object.visible = count[i] > 0;
      object._count = count[i];
    }
  }

  protected BVHCulling(): void {
    const instancesCount = this.instancesCount;
    const count = this._countIndexes; // reuse the same? also uintarray?
    const indexes = this._indexes;
    const visibilityArray = this.visibilityArray;

    if (this.sortObjects) { // todo refactor

      this.bvh.frustumCulling(_projScreenMatrix, (node: BVHNode<{}, number>) => {
        const index = node.object;
        if (index < instancesCount && visibilityArray[index]) {
          const distance = this.getPositionAt(index).distanceToSquared(_cameraPos);
          _renderList.push(distance, index);
        }
      });

    } else {

      this.bvh.frustumCullingLOD(_projScreenMatrix, _cameraPos, this.levels, (node: BVHNode<{}, number>, level: number) => {
        const index = node.object;
        if (index < instancesCount && visibilityArray[index]) {

          if (level === null) {
            const distance = this.getPositionAt(index).distanceToSquared(_cameraPos); // distance can be get by BVH
            level = this.getObjectIndexForDistance(distance);
          }

          indexes[level][count[level]++] = index;
        }
      });

    }
  }

  protected linearCulling(): void {
    const sortObjects = this.sortObjects;
    const bSphere = this.levels[this.levels.length - 1].object.geometry.boundingSphere; // TODO check se esiste?
    const radius = bSphere.radius;
    const center = bSphere.center;
    const instancesCount = this.instancesCount;
    const geometryCentered = center.x === 0 && center.y === 0 && center.z === 0;

    _frustum.setFromProjectionMatrix(_projScreenMatrix);

    const count = this._countIndexes;
    const indexes = this._indexes;

    for (let i = 0; i < instancesCount; i++) {
      if (!this.visibilityArray[i]) continue; // opt anche nell'altra classe

      if (geometryCentered) { //TODO try to use custom sphere implementation
        _sphere.center.copy(this.getPositionAt(i));
        _sphere.radius = radius * this.getMaxScaleOnAxisAt(i);
      } else {
        const matrix = this.getMatrixAt(i); // opt this getting only pos and scale
        _sphere.center.copy(center).applyMatrix4(matrix);
        _sphere.radius = radius * matrix.getMaxScaleOnAxis();
      }

      if (_frustum.intersectsSphere(_sphere)) {
        const distance = _sphere.center.distanceToSquared(_cameraPos);

        if (sortObjects) {
          _renderList.push(distance, i);
        } else {
          const levelIndex = this.getObjectIndexForDistance(distance);
          indexes[levelIndex][count[levelIndex]++] = i;
        }
      }
    }
  }

  protected getPositionAt(index: number): Vector3 {
    const array = this._matrixArray;
    const offset = index * 16;
    _position.x = array[offset + 12];
    _position.y = array[offset + 13];
    _position.z = array[offset + 14];
    return _position;
  }

  protected getMaxScaleOnAxisAt(index: number): number {
    const te = this._matrixArray;
    const offset = index * 16;

    const te0 = te[offset + 0];
    const te1 = te[offset + 1];
    const te2 = te[offset + 2];

    const scaleXSq = te0 * te0 + te1 * te1 + te2 * te2;
    const te4 = te[offset + 4];
    const te5 = te[offset + 5];
    const te6 = te[offset + 6];

    const scaleYSq = te4 * te4 + te5 * te5 + te6 * te6;
    const te8 = te[offset + 8];
    const te9 = te[offset + 9];
    const te10 = te[offset + 10];
    const scaleZSq = te8 * te8 + te9 * te9 + te10 * te10;

    return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq)); // can be improved?

  }

  // TODO edit raycast

}

// const _box3 = new Box3();
const _sphere = new Sphere();
const _frustum = new Frustum();
const _projScreenMatrix = new Matrix4();
// const _intersections: Intersection[] = [];
// const _mesh = new Mesh();
// const _ray = new Ray();
// const _direction = new Vector3();
// const _worldScale = new Vector3();
const _invMatrixWorld = new Matrix4();
const _renderList = new InstancedRenderList();
// const _forward = new Vector3();
const _cameraPos = new Vector3();
const _position = new Vector3();
const _tempMat4 = new Matrix4();
const _tempCol = new Color();
// const _instance = new InstancedEntity(undefined, -1);


// // move it and use the same for instancedMesh2
// function ascSortIntersection(a: Intersection, b: Intersection): number {
//   return a.distance - b.distance;
// }

function sortOpaque(a: InstancedRenderItem, b: InstancedRenderItem) {
  return a.depth - b.depth;
}

function sortTransparent(a: InstancedRenderItem, b: InstancedRenderItem) {
  return b.depth - a.depth;
}
