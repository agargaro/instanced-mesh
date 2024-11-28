import { FloatType, RedFormat } from 'three';
import { resizeSquareTextureArray_mat4, resizeSquareTextureArray_vec4 } from '../../utils/ResizeSquareTextureArray.js';
import { InstancedMesh2 } from '../InstancedMesh2.js';
import { DataTexture2 } from '../utils/DataTexture2.js';

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    resizeBuffers(capacity: number): this;
    setInstancesCount(count: number): void;
  }
}

InstancedMesh2.prototype.resizeBuffers = function (capacity: number): InstancedMesh2 {
  const oldCapacity = this._capacity;
  this._capacity = capacity;

  if (this.instanceIndex) {
    const indexArray = new Uint32Array(capacity);
    indexArray.set(this._indexArray);
    this._indexArray = this.instanceIndex.array = indexArray;
  }

  this.visibilityArray.length = capacity;
  if (capacity > oldCapacity) {
    this.visibilityArray.fill(true, oldCapacity);
  }

  const matrixImage = resizeSquareTextureArray_mat4(this._matrixArray, capacity);
  if (matrixImage) {
    this.matricesTexture.dispose();
    this.matricesTexture.image = matrixImage;
    this._matrixArray = this.matricesTexture.image.data as unknown as Float32Array;
  }

  if (this.colorsTexture) {
    const colorsImage = resizeSquareTextureArray_vec4(this._colorArray, capacity);
    if (colorsImage) {
      this.colorsTexture.dispose();
      this.colorsTexture.image = colorsImage;
      this._colorArray = this.colorsTexture.image.data as unknown as Float32Array;
    }
  }

  if (this.morphTexture) { // test it
    const oldArray = this.morphTexture.image.data;
    const size = oldArray.length / oldCapacity;
    this.morphTexture.dispose();
    this.morphTexture = new DataTexture2(new Float32Array(size * capacity), size, capacity, RedFormat, FloatType);
    this.morphTexture.image.data.set(oldArray);
  }

  // TODO custom uniform texture

  return this;
};

InstancedMesh2.prototype.setInstancesCount = function (count: number): void {
  if (count > this._capacity) {
    const newCapacity = this.capacity + (this._capacity >> 1) + 512;
    this.resizeBuffers(newCapacity);
  }

  this._instancesCount = count;
  if (this.instances) this.createInstances();
};
