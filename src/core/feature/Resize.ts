import { resizeSquareTextureArray_mat4, resizeSquareTextureArray_vec4 } from '../../utils/ResizeSquareTextureArray.js';
import { InstancedMesh2 } from '../InstancedMesh2.js';

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    resize(count: number): void;
    // addInstances(count: number): void;
    // removeInstances(count: number): void;
  }
}

InstancedMesh2.prototype.resize = function (count: number): void {
  this._maxCount = count;

  if (this.instanceIndex) {
    const indexArray = new Uint32Array(count);
    indexArray.set(this._indexArray);
    this._indexArray = this.instanceIndex.array = indexArray;
  }

  const oldVisibilityCount = this.visibilityArray.length;
  this.visibilityArray.length = count;
  if (count > oldVisibilityCount) {
    this.visibilityArray.fill(true, oldVisibilityCount);
  }

  this.matricesTexture.dispose();
  this.matricesTexture.image = resizeSquareTextureArray_mat4(this._matrixArray, count);
  this._matrixArray = this.matricesTexture.image.data as unknown as Float32Array;

  if (this.colorsTexture) {
    this.colorsTexture.dispose();
    this.colorsTexture.image = resizeSquareTextureArray_vec4(this._colorArray, count);
    this._colorArray = this.colorsTexture.image.data as unknown as Float32Array;
  }

  // TODO custom uniform texture

  if (this.instances) {
    const currentCount = this.instances.length;
    this.createInstances(null, currentCount, count - currentCount);
  }
};
