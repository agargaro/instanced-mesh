import { GLBufferAttribute, TypedArray } from "three";

export class GLInstancedBufferAttribute extends GLBufferAttribute {
    public isInstancedBufferAttribute = true;
    public isGLInstancedBufferAttribute = true;
    public meshPerAttribute: number;
    public array: TypedArray;

    constructor(buffer: WebGLBuffer, type: GLenum, itemSize: number, elementSize: 1 | 2 | 4, count: number, array: TypedArray, meshPerAttribute = 1) {
        super(buffer, type, itemSize, elementSize, count);
        this.meshPerAttribute = meshPerAttribute;
        this.array = array;
    }
}
