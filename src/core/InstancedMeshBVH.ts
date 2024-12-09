import { box3ToArray, BVH, BVHNode, HybridBuilder, onFrustumIntersectionCallback, onFrustumIntersectionLODCallback, onIntersectionCallback, onIntersectionRayCallback, vec3ToArray, WebGLCoordinateSystem } from 'bvh.js';
import { Box3, Matrix4, Raycaster, Sphere, Vector3 } from 'three';
import { getSphereFromMatrix_centeredGeometry, SphereTarget } from '../utils/MatrixUtils.js';
import { LODLevel } from './feature/LOD.js';
import { InstancedMesh2 } from './InstancedMesh2.js';

// TODO getBoxFromSphere updated if change geometry (and create accessor)

export interface BVHParams {
  margin?: number;
  getBBoxFromBSphere?: boolean;
  accurateCulling?: boolean;
}

export class InstancedMeshBVH {
  public target: InstancedMesh2;
  public geoBoundingBox: Box3;
  public bvh: BVH<{}, number>;
  public nodesMap = new Map<number, BVHNode<{}, number>>();
  public accurateCulling: boolean;
  protected LODsMap = new Map<LODLevel[], Float32Array>();
  protected _margin: number;
  protected _origin: Float32Array;
  protected _dir: Float32Array;
  protected _boxArray: Float32Array;
  protected _cameraPos: Float32Array;
  protected _getBoxFromSphere: boolean;
  protected _geoBoundingSphere: Sphere = null;
  protected _sphereTarget: SphereTarget = null;

  constructor(target: InstancedMesh2, margin = 0, getBoxFromSphere = false, accurateCulling = true) {
    this.target = target;
    this.accurateCulling = accurateCulling;
    this._margin = margin;

    const geometry = target._geometry;

    if (!geometry.boundingBox) geometry.computeBoundingBox();
    this.geoBoundingBox = geometry.boundingBox;

    if (getBoxFromSphere) {
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();

      const center = geometry.boundingSphere.center;
      if (center.x === 0 && center.y === 0 && center.z === 0) {
        this._geoBoundingSphere = geometry.boundingSphere;
        this._sphereTarget = { centerX: 0, centerY: 0, centerZ: 0, maxScale: 0 };
      } else {
        console.warn('"getBoxFromSphere" is ignored because geometry is not centered.');
        getBoxFromSphere = false;
      }
    }

    this.bvh = new BVH(new HybridBuilder(), WebGLCoordinateSystem);
    this._origin = new Float32Array(3);
    this._dir = new Float32Array(3);
    this._cameraPos = new Float32Array(3);
    this._getBoxFromSphere = getBoxFromSphere;
  }

  public create(): void {
    const count = this.target._instancesCount;
    const boxes: Float32Array[] = new Array(count); // test if single array and recreation inside node creation is faster due to memory location
    const objects: Uint32Array = new Uint32Array(count);

    this.clear();

    for (let i = 0; i < count; i++) {
      boxes[i] = this.getBox(i, new Float32Array(6));
      objects[i] = i;
    }

    this.bvh.createFromArray(objects as unknown as number[], boxes, (node) => {
      this.nodesMap.set(node.object, node);
    }, this._margin);
  }

  public insert(id: number): void {
    const node = this.bvh.insert(id, this.getBox(id, new Float32Array(6)), this._margin);
    this.nodesMap.set(id, node);
  }

  public insertRange(ids: number[]): void {
    const count = ids.length;
    const boxes: Float32Array[] = new Array(count);

    for (let i = 0; i < count; i++) {
      boxes[i] = this.getBox(ids[i], new Float32Array(6));
    }

    this.bvh.insertRange(ids, boxes, this._margin, (node) => {
      this.nodesMap.set(node.object, node);
    });
  }

  public move(id: number): void {
    const node = this.nodesMap.get(id);
    if (!node) return;
    this.getBox(id, node.box as Float32Array); // this also updates box
    this.bvh.move(node, this._margin);
  }

  public delete(id: number): void {
    const node = this.nodesMap.get(id);
    if (!node) return;
    this.bvh.delete(node);
    this.nodesMap.delete(id);
  }

  public clear(): void {
    this.bvh.clear();
    this.nodesMap = new Map();
  }

  public frustumCulling(projScreenMatrix: Matrix4, onFrustumIntersection: onFrustumIntersectionCallback<{}, number>): void {
    if (this._margin > 0 && this.accurateCulling) {
      this.bvh.frustumCulling(projScreenMatrix.elements, (node, frustum, mask) => {
        if (frustum.isIntersectedMargin(node.box, mask, this._margin)) {
          onFrustumIntersection(node);
        }
      });
    } else {
      this.bvh.frustumCulling(projScreenMatrix.elements, onFrustumIntersection);
    }
  }

  public frustumCullingLOD(projScreenMatrix: Matrix4, cameraPosition: Vector3, levels: LODLevel[], onFrustumIntersection: onFrustumIntersectionLODCallback<{}, number>): void {
    if (!this.LODsMap.has(levels)) {
      this.LODsMap.set(levels, new Float32Array(levels.length));
    }

    const levelsArray = this.LODsMap.get(levels);
    for (let i = 0; i < levels.length; i++) {
      levelsArray[i] = levels[i].distance;
    }

    const camera = this._cameraPos;
    camera[0] = cameraPosition.x;
    camera[1] = cameraPosition.y;
    camera[2] = cameraPosition.z;

    if (this._margin > 0 && this.accurateCulling) {
      this.bvh.frustumCullingLOD(projScreenMatrix.elements, camera, levelsArray, (node, level, frustum, mask) => {
        if (frustum.isIntersectedMargin(node.box, mask, this._margin)) {
          onFrustumIntersection(node, level);
        }
      });
    } else {
      this.bvh.frustumCullingLOD(projScreenMatrix.elements, camera, levelsArray, onFrustumIntersection);
    }
  }

  public raycast(raycaster: Raycaster, onIntersection: onIntersectionRayCallback<number>): void {
    const ray = raycaster.ray;
    const origin = this._origin;
    const dir = this._dir;

    vec3ToArray(ray.origin, origin);
    vec3ToArray(ray.direction, dir);

    // should we add margin check? maybe is not worth it
    this.bvh.rayIntersections(dir, origin, onIntersection, raycaster.near, raycaster.far);
  }

  public intersectBox(target: Box3, onIntersection: onIntersectionCallback<number>): boolean {
    if (!this._boxArray) this._boxArray = new Float32Array(6);
    const array = this._boxArray;
    box3ToArray(target, array);
    return this.bvh.intersectsBox(array, onIntersection);
  }

  protected getBox(id: number, array: Float32Array): Float32Array {
    if (this._getBoxFromSphere) {
      const matrixArray = this.target.matricesTexture._data as Float32Array;
      const { centerX, centerY, centerZ, maxScale } = getSphereFromMatrix_centeredGeometry(id, matrixArray, this._sphereTarget);
      const radius = this._geoBoundingSphere.radius * maxScale;
      array[0] = centerX - radius;
      array[1] = centerX + radius;
      array[2] = centerY - radius;
      array[3] = centerY + radius;
      array[4] = centerZ - radius;
      array[5] = centerZ + radius;
    } else {
      _box3.copy(this.geoBoundingBox).applyMatrix4(this.target.getMatrixAt(id));
      box3ToArray(_box3, array);
    }

    return array;
  }
}

const _box3 = new Box3();
