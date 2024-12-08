import { DataTexture, FloatType, RedFormat } from 'three';
import { InstancedMesh2 } from '../InstancedMesh2.js';

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    resizeBuffers(capacity: number): this;
    setInstancesCount(count: number): void;
  }
}

InstancedMesh2.prototype.resizeBuffers = function (capacity: number): InstancedMesh2 {
  const oldCapacity = this._capacity;
  this._capacity = capacity;
  const minCapacity = Math.min(capacity, oldCapacity);

  const indexArray = new Uint32Array(capacity);
  indexArray.set(new Uint32Array(this._indexArray.buffer, 0, minCapacity)); // safely copy TODO method
  this._indexArray = indexArray;
  if (this.instanceIndex) {
    this.instanceIndex.array = indexArray;
  }

  this.visibilityArray.length = capacity;
  if (capacity > oldCapacity) {
    this.visibilityArray.fill(true, oldCapacity);
  }

  this.matricesTexture.resize(capacity);
  this._matrixArray = this.matricesTexture.image.data as unknown as Float32Array; // TODO decide if we want to remove this

  if (this.colorsTexture) {
    this.colorsTexture.resize(capacity);
    this._colorArray = this.colorsTexture.image.data as unknown as Float32Array;
    if (capacity > oldCapacity) {
      this._colorArray.fill(1, oldCapacity * 4);
    }
  }

  if (this.morphTexture) { // test it
    const oldArray = this.morphTexture.image.data;
    const size = oldArray.length / oldCapacity;
    this.morphTexture.dispose();
    this.morphTexture = new DataTexture(new Float32Array(size * capacity), size, capacity, RedFormat, FloatType);
    this.morphTexture.image.data.set(oldArray); // FIX if reduce
  }

  this.uniformsTexture?.resize(capacity);

  return this;
};

InstancedMesh2.prototype.setInstancesCount = function (count: number): void {
  if (count > this._capacity) {
    let newCapacity = this._capacity + (this._capacity >> 1) + 512;
    while (newCapacity < count) {
      newCapacity += (newCapacity >> 1) + 512;
    }

    this.resizeBuffers(newCapacity);
  }

  this._instancesCount = count;
  if (this.instances) this.createInstances();
};
