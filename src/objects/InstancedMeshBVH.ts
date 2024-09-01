import { BVH, BVHNode, FloatArray, HybridBuilder, WebGLCoordinateSystem } from 'bvh.js';
import { Box3, Matrix4, Raycaster } from 'three';
import { InstancedMesh2 } from './InstancedMesh2.js';

export class InstancedMeshBVH {
    public target: InstancedMesh2;
    public geoBoundingBox: Box3;
    public bvh: BVH<unknown, number>;
    public map = new Map<number, BVHNode<unknown, number>>();
    protected _arrayType: typeof Float32Array | typeof Float64Array;
    protected _margin: number;

    constructor(target: InstancedMesh2, margin = 0, highPrecision = false) {
        this._margin = margin;
        this.target = target;
        if (!target.geometry.boundingBox) target.geometry.computeBoundingBox();
        this.geoBoundingBox = target.geometry.boundingBox;
        this._arrayType = highPrecision ? Float64Array : Float32Array;
        this.bvh = new BVH(new HybridBuilder(highPrecision), WebGLCoordinateSystem);
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

    public frustumCulling(projScreenMatrix: Matrix4, onFrustumIntersected: (index: number) => void): void {
        this.bvh.frustumCulling(projScreenMatrix.elements, (node, frustum, mask) => {
            if (frustum.isIntersected(node.box, mask, this._margin)) {
                onFrustumIntersected(node.object);
            }
        });
    }

    public frustumCullingConservative(): void {
        throw new Error("Not implemented yet.");
    }

    public raycast(raycaster: Raycaster, result: number[]): void {
        const ray = raycaster.ray;

        _origin[0] = ray.origin.x;
        _origin[1] = ray.origin.y;
        _origin[2] = ray.origin.z;

        _dir[0] = ray.direction.x;
        _dir[1] = ray.direction.y;
        _dir[2] = ray.direction.z;

        this.bvh.intersectRay(_dir, _origin, raycaster.near, raycaster.far, result);
    }

    protected getBox(id: number, array: FloatArray): FloatArray {
        _box3.copy(this.geoBoundingBox).applyMatrix4(this.target.getMatrixAt(id));

        const min = _box3.min;
        const max = _box3.max;

        array[0] = min.x;
        array[1] = max.x;
        array[2] = min.y;
        array[3] = max.y;
        array[4] = min.z;
        array[5] = max.z;

        return array;
    }
}

const _origin = new Float64Array(3);
const _dir = new Float64Array(3);
const _box3 = new Box3();
