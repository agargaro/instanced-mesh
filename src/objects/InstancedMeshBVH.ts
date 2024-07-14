import { BVH, HybridBuilder, WebGLCoordinateSystem } from 'bvh.js';
import { BVHNode, FloatArray } from 'bvh.js/core/BVHNode';
import { Box3, Matrix4, Raycaster } from 'three';
import { InstancedEntity } from './InstancedEntity';
import { InstancedMesh2 } from './InstancedMesh2';

type NodeData = {};
type LeafData = InstancedEntity; // consider to use only index instead?

export class InstancedMeshBVH {
    public target: InstancedMesh2;
    public geoBoundingBox: Box3;
    public bvh: BVH<NodeData, LeafData>;
    public map = new WeakMap<InstancedEntity, BVHNode<NodeData, LeafData>>();

    constructor(target: InstancedMesh2<any, any, any>, margin = 0) {
        this.target = target;
        target.geometry.computeBoundingBox();
        this.geoBoundingBox = target.geometry.boundingBox;
        this.bvh = new BVH(new HybridBuilder(margin), WebGLCoordinateSystem);
    }

    public createFromArray(): void {
        const instances = this.target.instances;
        const count = this.target.instancesCount;
        const boxes: FloatArray[] = new Array(count); // TODO change to float64Array?
        const objects: InstancedEntity[] = new Array(count); // we need to clone it because items are swapped

        this.clear();

        for (let i = 0; i < count; i++) {
            const instance = instances[i];
            boxes[i] = this.getBox(instance); // this creates float64array
            objects[i] = instance;
        }

        this.bvh.createFromArray(objects, boxes, (node) => {
            this.map.set(node.object, node);
        });
    }

    public insert(object: InstancedEntity): void {
        const node = this.bvh.insert(object, this.getBox(object));
        this.map.set(object, node);
    }

    public insertRange(objects: InstancedEntity[]): void {
        const count = objects.length;
        const boxes: FloatArray[] = new Array(count);

        for (let i = 0; i < count; i++) {
            boxes[i] = this.getBox(objects[i]); // this creates float64array
        }

        this.bvh.insertRange(objects, boxes, (node) => {
            this.map.set(node.object, node);
        });
    }

    public move(object: InstancedEntity): void {
        const node = this.map.get(object);
        if (!node) return;
        this.getBox(object, node.box); // update box
        this.bvh.move(node);
    }

    public delete(object: InstancedEntity): void {
        const node = this.map.get(object);
        if (!node) return;
        this.bvh.delete(node);
        this.map.delete(object);
    }

    public clear(): void {
        this.bvh.clear();
        this.map = new WeakMap<InstancedEntity, BVHNode<NodeData, LeafData>>();
    }

    public frustumCulling(projScreenMatrix: Matrix4, result: InstancedEntity[]): void {
        this.bvh.frustumCulling(projScreenMatrix.elements, result);
    }

    public frustumCullingConservative(): void {
        throw new Error("Not implemented yet."); // TODO
    }

    public raycast(raycaster: Raycaster, result: InstancedEntity[]): void {
        // TODO conver ray to local space

        const ray = raycaster.ray;

        _origin[0] = ray.origin.x;
        _origin[1] = ray.origin.y;
        _origin[2] = ray.origin.z;

        _dir[0] = ray.direction.x;
        _dir[1] = ray.direction.y;
        _dir[2] = ray.direction.z;

        this.bvh.intersectRay(_dir, _origin, raycaster.near, raycaster.far, result);
    }

    protected getBox(object: InstancedEntity, array: FloatArray = new Float64Array(6)): FloatArray { // TODO refactor removing optional param
        _box3.copy(this.geoBoundingBox).applyMatrix4(object.matrix);

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
