import { Matrix4, Skeleton, Vector3, Vector4 } from 'three';
import { InstancedMesh2 } from '../InstancedMesh2.js';
import { SquareDataTexture } from '../utils/SquareDataTexture.js';

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    getSkeletonAt(id: number, skeleton?: Skeleton): Skeleton;
    setSkeletonAt(id: number, skeleton: Skeleton): void;
    bind(skeleton: Skeleton, bindMatrix: Matrix4): void;
    normalizeSkinWeights(): void;
    applyBoneTransform(index: number, vector: Vector3): Vector3;
  }
}

const _offsetMatrix = new Matrix4();
const _identityMatrix = new Matrix4();
const _basePosition = new Vector3();
const _skinIndex = new Vector4();
const _skinWeight = new Vector4();
const _matrix4 = new Matrix4();
const _vector3 = new Vector3();

InstancedMesh2.prototype.getSkeletonAt = function (id: number, skeleton?: Skeleton) {
  throw new Error('\'getSkeletonAt\' not implemented yet.');
};

InstancedMesh2.prototype.setSkeletonAt = function (id: number, skeleton: Skeleton) {
  const bones = skeleton.bones;

  if (this.boneTexture === null && !this._parentLOD) {
    const size = bones.length;
    this.skeleton = skeleton;
    this.bindMatrix = new Matrix4();
    this.bindMatrixInverse = new Matrix4();
    this.boneTexture = new SquareDataTexture(Float32Array, 4, 4 * size, this._capacity);
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

InstancedMesh2.prototype.bind = function (skeleton: Skeleton, bindMatrix: Matrix4) {
  this.skeleton = skeleton;

  if (bindMatrix === undefined) {
    this.updateMatrixWorld(true);
    this.skeleton.calculateInverses();
    bindMatrix = this.matrixWorld;
  }

  this.bindMatrix.copy(bindMatrix);
  this.bindMatrixInverse.copy(bindMatrix).invert();
};

InstancedMesh2.prototype.normalizeSkinWeights = function () {
  const vector = new Vector4();
  const skinWeight = this.geometry.attributes.skinWeight;

  for (let i = 0, l = skinWeight.count; i < l; i++) {
    vector.fromBufferAttribute(skinWeight, i);
    const scale = 1.0 / vector.manhattanLength();

    if (scale !== Infinity) {
      vector.multiplyScalar(scale);
    } else {
      vector.set(1, 0, 0, 0); // do something reasonable
    }

    skinWeight.setXYZW(i, vector.x, vector.y, vector.z, vector.w);
  }
};

InstancedMesh2.prototype.applyBoneTransform = function (index: number, vector: Vector3) {
  const skeleton = this.skeleton;
  const geometry = this.geometry;

  _skinIndex.fromBufferAttribute(geometry.attributes.skinIndex, index);
  _skinWeight.fromBufferAttribute(geometry.attributes.skinWeight, index);

  _basePosition.copy(vector).applyMatrix4(this.bindMatrix);

  vector.set(0, 0, 0);

  for (let i = 0; i < 4; i++) {
    const weight = _skinWeight.getComponent(i);

    if (weight !== 0) {
      const boneIndex = _skinIndex.getComponent(i);

      _matrix4.multiplyMatrices(skeleton.bones[boneIndex].matrixWorld, skeleton.boneInverses[boneIndex]);

      vector.addScaledVector(_vector3.copy(_basePosition).applyMatrix4(_matrix4), weight);
    }
  }

  return vector.applyMatrix4(this.bindMatrixInverse);
};
