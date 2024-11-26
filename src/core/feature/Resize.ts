import { DataTexture, FloatType, RedFormat } from 'three';
import { resizeSquareTextureArray_mat4, resizeSquareTextureArray_vec4 } from '../../utils/ResizeSquareTextureArray.js';
import { InstancedMesh2 } from '../InstancedMesh2.js';

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2<TCustomData = {}> {
    resizeBuffers(count: number): this;
    // addInstances(count: number, onInstanceCreation?: UpdateEntityCallback<Entity<TCustomData>>): this;
    // removeInstances(count: number): void;
  }
}

InstancedMesh2.prototype.resizeBuffers = function (count: number): InstancedMesh2 {
  const oldCount = this._maxCount;
  this._maxCount = count;

  if (this.instanceIndex) {
    const indexArray = new Uint32Array(count);
    indexArray.set(this._indexArray);
    this._indexArray = this.instanceIndex.array = indexArray;
  }

  this.visibilityArray.length = count;
  if (count > oldCount) {
    this.visibilityArray.fill(true, oldCount);
  }

  this.matricesTexture.dispose();
  this.matricesTexture.image = resizeSquareTextureArray_mat4(this._matrixArray, count);
  this._matrixArray = this.matricesTexture.image.data as unknown as Float32Array;

  if (this.colorsTexture) {
    this.colorsTexture.dispose();
    this.colorsTexture.image = resizeSquareTextureArray_vec4(this._colorArray, count);
    this._colorArray = this.colorsTexture.image.data as unknown as Float32Array;
  }

  if (this.morphTexture) { // test it
    const oldArray = this.morphTexture.image.data;
    const size = oldArray.length / oldCount;
    this.morphTexture.dispose();
    this.morphTexture = new DataTexture(new Float32Array(size * count), size, count, RedFormat, FloatType);
    this.morphTexture.image.data.set(oldArray);
  }

  // TODO custom uniform texture

  if (this.instances) { // capire meglio se le vogliamo già creare
    this.createInstances(null, oldCount, count - oldCount);
  }

  return this;
};

// InstancedMesh2.prototype.addInstances = function (count: number, onInstanceCreation?: UpdateEntityCallback<Entity<any>>): InstancedMesh2 {
//   return this;
// };
