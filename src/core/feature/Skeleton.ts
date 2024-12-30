import { Matrix4, Skeleton } from 'three';
import { InstancedMesh2 } from '../InstancedMesh2.js';
import { SquareDataTexture } from '../utils/SquareDataTexture.js';

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    getSkeletonAt(id: number, skeleton?: Skeleton): Skeleton;
    setSkeletonAt(id: number, skeleton: Skeleton): void;
  }
}

const _offsetMatrix = new Matrix4();
const _identityMatrix = new Matrix4();

InstancedMesh2.prototype.getSkeletonAt = function (id: number, skeleton?: Skeleton): Skeleton {
  throw new Error('\'getSkeletonAt\' not implemented yet.');
};

InstancedMesh2.prototype.setSkeletonAt = function (id: number, skeleton: Skeleton): void {
  const bones = skeleton.bones;

  if (this.boneTexture === null && !this._parentLOD) {
    const size = bones.length;
    this._bonesCount = size;
    this.boneTexture = new SquareDataTexture(Float32Array, 4, 4 * size, this._capacity);
    this.isSkinnedMesh = true;
  }

  const boneInverses = skeleton.boneInverses;
  const boneArray = this.boneTexture._data;
  const boneOffset = id * bones.length;

  for (let i = 0, l = bones.length; i < l; i++) {
    const matrix = bones[i] ? bones[i].matrixWorld : _identityMatrix;
    _offsetMatrix.multiplyMatrices(matrix, boneInverses[i]);
    _offsetMatrix.toArray(boneArray, (boneOffset + i) * 16);
  }

  this.boneTexture.enqueueUpdate(id);
};
