import { DataTexture, FloatType, RedFormat } from 'three';
import { resizeSquareTextureArray_mat4, resizeSquareTextureArray_vec4 } from '../../utils/ResizeSquareTextureArray.js';
import { InstancedEntity } from '../InstancedEntity.js';
import { Entity, InstancedMesh2, UpdateEntityCallback } from '../InstancedMesh2.js';

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2<TCustomData = {}> {
    resizeBuffers(capacity: number): this;
    setInstancesCount(count: number): void;
    addInstance(onInstanceCreation?: UpdateEntityCallback<Entity<TCustomData>>): this;
    // addInstances(count: number, onInstanceCreation?: UpdateEntityCallback<Entity<TCustomData>>): this;
    // removeInstances(count: number): void;
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

  this.matricesTexture.dispose();
  this.matricesTexture.image = resizeSquareTextureArray_mat4(this._matrixArray, capacity);
  this._matrixArray = this.matricesTexture.image.data as unknown as Float32Array;

  if (this.colorsTexture) {
    this.colorsTexture.dispose();
    this.colorsTexture.image = resizeSquareTextureArray_vec4(this._colorArray, capacity);
    this._colorArray = this.colorsTexture.image.data as unknown as Float32Array;
  }

  if (this.morphTexture) { // test it
    const oldArray = this.morphTexture.image.data;
    const size = oldArray.length / oldCapacity;
    this.morphTexture.dispose();
    this.morphTexture = new DataTexture(new Float32Array(size * capacity), size, capacity, RedFormat, FloatType);
    this.morphTexture.image.data.set(oldArray);
  }

  // TODO custom uniform texture

  if (this.instances) { // capire meglio se le vogliamo già creare
    this.createInstances(null, oldCapacity, capacity - oldCapacity);
  }

  return this;
};

InstancedMesh2.prototype.setInstancesCount = function (count: number): void {
  if (count > this._capacity) {
    const newCapacity = this.capacity + (this._capacity >> 1) + 64;
    this.resizeBuffers(newCapacity);
  }

  this._instancesCount = count;
};

InstancedMesh2.prototype.addInstance = function (onInstanceCreation?: UpdateEntityCallback<InstancedEntity>): InstancedMesh2 {
  this.setInstancesCount(this._instancesCount + 1);

  if (onInstanceCreation) {
    const index = this._instancesCount - 1;
    let instance: InstancedEntity;

    if (this.instances) {
      instance = this.instances[index];
    } else {
      instance = this._instance;
      (instance as any).id = index;
      instance.position.set(0, 0, 0);
      instance.scale.set(1, 1, 1);
      instance.quaternion.set(0, 0, 0, 1);
      instance.rotation?.set(0, 0, 0);
    }

    onInstanceCreation(instance, index);
    instance.updateMatrix();
  }

  return this;
};

// InstancedMesh2.prototype.addInstances = function (count: number, onInstanceCreation?: UpdateEntityCallback<Entity<any>>): InstancedMesh2 {
//   setInstancesCount
//   return this;
// };
