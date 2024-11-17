import { GLBufferAttribute, TypedArray, WebGLRenderer } from 'three';

export class GLInstancedBufferAttribute extends GLBufferAttribute {
  public isInstancedBufferAttribute = true;
  public isGLInstancedBufferAttribute = true;
  public meshPerAttribute: number;
  public array: TypedArray;
  /** @internal */ public _needsUpdate = false;

  constructor(gl: WebGL2RenderingContext, type: GLenum, itemSize: number, elementSize: 1 | 2 | 4, array: TypedArray, meshPerAttribute = 1) {
    const buffer = gl.createBuffer();
    super(buffer, type, itemSize, elementSize, array.length / itemSize);

    this.meshPerAttribute = meshPerAttribute;
    this.array = array;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW);
  }

  public update(renderer: WebGLRenderer, count: number): void {
    if (!this._needsUpdate) return;

    const gl = renderer.getContext();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.array, 0, count);

    this._needsUpdate = false;
  }

  public clone(): this {
    return this;
  }
}
