import { box3ToArray, BVH, BVHNode, FloatArray, HybridBuilder, onFrustumIntersectionCallback, onFrustumIntersectionLODCallback, onIntersectionCallback, onIntersectionRayCallback, vec3ToArray, WebGLCoordinateSystem } from 'bvh.js';
import { Box3, Matrix4, Raycaster, Sphere, Vector3 } from 'three';
import { InstancedMesh2 } from './InstancedMesh2.js';
import { InstancedMeshLOD, LODLevel } from './InstancedMeshLOD.js';
import { getRawSphereFromMatrix_centeredGeometry, SphereTarget } from '../utils/matrixUtils.js';

export class InstancedMeshBVH {
    public target: InstancedMesh2 | InstancedMeshLOD;
    public geoBoundingBox: Box3;
    public bvh: BVH<{}, number>;
    public map = new Map<number, BVHNode<{}, number>>();
    protected _arrayType: typeof Float32Array | typeof Float64Array;
    protected _margin: number;
    protected _origin: FloatArray;
    protected _dir: FloatArray;
    protected _boxArray: FloatArray;
    protected _cameraPos: FloatArray;
    protected _levels: FloatArray; // TODO improve this
    protected _getBoxFromSphere: boolean; // works only if geometry is centered for now
    protected _geoBoundingSphere: Sphere = null;
    protected _sphereTarget: SphereTarget = null;

    constructor(target: InstancedMesh2 | InstancedMeshLOD, margin = 0, highPrecision = false, getBoxFromSphere = false) {
        this._margin = margin;
        this.target = target;

        const geometry = (target as InstancedMeshLOD).isInstancedMeshLOD ?
        (target as InstancedMeshLOD).levels[(target as InstancedMeshLOD).levels.length - 1].object.geometry : // TODO improve this
        (target as InstancedMesh2).geometry;

        if (!geometry.boundingBox) geometry.computeBoundingBox();
        this.geoBoundingBox = geometry.boundingBox;

        if (getBoxFromSphere) {
            if (!geometry.boundingSphere) geometry.computeBoundingSphere();
            this._geoBoundingSphere = geometry.boundingSphere;
            this._sphereTarget = { centerX: 0, centerY: 0, centerZ: 0, maxScale: 0 };
        }

        this._arrayType = highPrecision ? Float64Array : Float32Array;
        this.bvh = new BVH(new HybridBuilder(highPrecision), WebGLCoordinateSystem);
        this._origin = new this._arrayType(3);
        this._dir = new this._arrayType(3);
        this._cameraPos = new this._arrayType(3);
        this._getBoxFromSphere = getBoxFromSphere;
    }

    public create(): void {
        const count = this.target.instancesCount;
        const boxes: FloatArray[] = new Array(count);
        const objects: Uint32Array = new Uint32Array(count); // TODO could be opt if instances are less than 65k

        this.clear();

        for (let i = 0; i < count; i++) {
            boxes[i] = this.getBox(i, new this._arrayType(6));
            objects[i] = i;
        }

        this.bvh.createFromArray(objects as unknown as number[], boxes, (node) => {
            this.map.set(node.object, node);
        });
    }

    public insert(id: number): void {
        const node = this.bvh.insert(id, this.getBox(id, new this._arrayType(6)), this._margin);
        this.map.set(id, node);
    }

    public insertRange(ids: number[]): void {
        const count = ids.length;
        const boxes: FloatArray[] = new Array(count);

        for (let i = 0; i < count; i++) {
            boxes[i] = this.getBox(ids[i], new this._arrayType(6));
        }

        this.bvh.insertRange(ids, boxes, this._margin, (node) => {
            this.map.set(node.object, node);
        });
    }

    public move(id: number): void {
        const node = this.map.get(id);
        if (!node) return;
        this.getBox(id, node.box); // this also updates box
        this.bvh.move(node, this._margin);
    }

    public delete(id: number): void {
        const node = this.map.get(id);
        if (!node) return;
        this.bvh.delete(node);
        this.map.delete(id);
    }

    public clear(): void {
        this.bvh.clear();
        this.map = new Map();
    }

    public frustumCulling(projScreenMatrix: Matrix4, onFrustumIntersection: onFrustumIntersectionCallback<{}, number>): void {
        if (this._margin > 0) {

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
        if (this._levels?.length !== levels.length) { // TODO improve
            this._levels = new this._arrayType(levels.length);
        }

        const levelsArray = this._levels;
        for (let i = 0; i < levels.length; i++) {
            levelsArray[i] = levels[i].distance;
        }

        const camera = this._cameraPos;
        camera[0] = cameraPosition.x;
        camera[1] = cameraPosition.y;
        camera[2] = cameraPosition.z;

        if (this._margin > 0) {

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

        this.bvh.rayIntersections(dir, origin, onIntersection, raycaster.near, raycaster.far);
    }

    public intersectBox(target: Box3, onIntersection: onIntersectionCallback<number>): boolean {
        if (!this._boxArray) this._boxArray = new this._arrayType(6);
        const array = this._boxArray;
        box3ToArray(target, array);
        return this.bvh.intersectsBox(array, onIntersection);
    }

    protected getBox(id: number, array: FloatArray): FloatArray {
        // TODO add check if geometry is centered. adjust ref using this._matrixArray insteaad of this.target._matrixArray
        if (this._getBoxFromSphere) {
            const { centerX, centerY, centerZ, maxScale } = getRawSphereFromMatrix_centeredGeometry(id, this.target._matrixArray, this._sphereTarget);
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
