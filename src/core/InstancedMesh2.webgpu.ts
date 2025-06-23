import { ColorManagement } from 'three';
import { MeshBasicNodeMaterial, StorageInstancedBufferAttribute, WebGPURenderer } from 'three/webgpu';

import { getBoneMatrix, getColorTexture, getInstancedMatrix } from '../shaders/tsl/nodes.js';
import { InstancedMesh2, InstancedMesh2Params } from './InstancedMesh2.common.js';
import { uniform } from 'three/tsl';

import { SquareDataTextureGPU } from './utils/SquareDataTexture.js';


/**
 * Parameters for configuring an `InstancedMeshGPU` instance.
 */
export interface InstancedMeshGPUParams extends Omit<InstancedMesh2Params, 'renderer'> {
  capacity?: number;
  
  createEntities?: boolean;
  
  allowsEuler?: boolean;
  
  renderer?: WebGPURenderer;
}


/**
 * @internal
 * Enhances the InstancedMesh2 prototype with WebGL methods.
 */
export function extendInstancedMesh2PrototypeWebGL(): void {

  InstancedMesh2.prototype.type = 'InstancedMeshGPU';
  InstancedMesh2.prototype.isInstancedMeshGPU = true;
  
  InstancedMesh2.prototype.matricesTexture = null; // SquareDataTextureGPU
  InstancedMesh2.prototype.colorsTexture = null; //SquareDataTextureGPU
  InstancedMesh2.prototype.boneTexture = null; // SquareDataTextureGPU;
  InstancedMesh2.prototype.uniformsTexture = null; //SquareDataTextureGPU

  InstancedMesh2.prototype._renderer = null; //WebGPURenderer | any
  InstancedMesh2.prototype.instanceMatrix = new StorageInstancedBufferAttribute(new Float32Array(0), 16);

  InstancedMesh2.prototype._material = null; //MeshBasicNodeMaterial
  InstancedMesh2.prototype._currentMaterial = null; //MeshBasicNodeMaterial

  InstancedMesh2.prototype.init = async function(): Promise<void> {
    // this._adapter = await navigator.gpu.requestAdapter();
    // this._device = await this._adapter.requestDevice();
    // this._context = this._renderer.domElement.getContext('webgpu');
    this.initMatricesTexture();
    this.initColorsTexture();
    // Ensure textures are updated before first render
    this.matricesTexture.update(this._renderer);
    this.colorsTexture?.update(this._renderer);
  }

  InstancedMesh2.prototype.initMatricesTexture = function(): void {
    if (!this._parentLOD) {
      this.matricesTexture = new SquareDataTextureGPU(Float32Array, 4, 4, this._capacity);
    }
    // Set the node for instance matrix in the material
    if (this._currentMaterial) {
      (this._currentMaterial as any).matricesTexture = getInstancedMatrix(uniform(this.matricesTexture));
    }
  }

  InstancedMesh2.prototype.initColorsTexture = function(): void {
    if (!this._parentLOD) {
      this.colorsTexture = new SquareDataTextureGPU(Float32Array, 4, 1, this._capacity);
      this.colorsTexture.colorSpace = ColorManagement.workingColorSpace;
      this.colorsTexture._data.fill(1);
      this.materialsNeedsUpdate();
    }
    // Set the node for instance color in the material
    if (this._currentMaterial) {
      (this._currentMaterial as any).colorNode = getColorTexture(uniform(this.colorsTexture));
    }
  }

  InstancedMesh2.prototype.initBoneTexture = function(): void {
    if (!this._parentLOD) {
      this.boneTexture = new SquareDataTextureGPU(Float32Array, 4, 4, this._capacity);
      this.boneTexture.colorSpace = ColorManagement.workingColorSpace;
      this.boneTexture._data.fill(1);
      this.materialsNeedsUpdate();
    }
    // Set the node for bone matrix in the material
    if (this._currentMaterial) {
      (this._currentMaterial as any).boneMatrixNode = getBoneMatrix(uniform(this.boneTexture));
    }
  }

  // Ensure textures are updated before each render
  InstancedMesh2.prototype.onBeforeRender = function(renderer, scene, camera, geometry, material, group): void {
    super.onBeforeRender(renderer, scene, camera, geometry, material, group);
    this.matricesTexture.update(renderer);
    this.colorsTexture?.update(renderer);
  }
}

const _defaultCapacity = 1000;
