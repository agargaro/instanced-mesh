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
 * Enhances the InstancedMesh2 prototype with WebGPU methods.
 */
export function extendInstancedMesh2PrototypeWebGPU(): void {

  InstancedMesh2.prototype.type = 'InstancedMeshGPU';

  // WebGPU-specific member initialization
  InstancedMesh2.prototype.matricesTexture = null; // SquareDataTextureGPU
  InstancedMesh2.prototype.colorsTexture = null; // SquareDataTextureGPU
  InstancedMesh2.prototype.boneTexture = null; // SquareDataTextureGPU
  InstancedMesh2.prototype.uniformsTexture = null; // SquareDataTextureGPU
  InstancedMesh2.prototype._renderer = null; // WebGPURenderer | any
  InstancedMesh2.prototype.instanceMatrix = new StorageInstancedBufferAttribute(new Float32Array(0), 16);

  InstancedMesh2.prototype.init = async function(): Promise<void> {
    this._currentMaterial = new MeshBasicNodeMaterial();
    this.initMatricesTexture();
    this.initColorsTexture();
    // Ensure textures are updated before first render
    this.matricesTexture.update(this._renderer);
    this.colorsTexture?.update(this._renderer);
  };

  InstancedMesh2.prototype.initPositionsNode = function(): void {
    if (!this._parentLOD) {
      this.matricesTexture = new SquareDataTextureGPU(Float32Array, 4, 4, this._capacity);
    }
    // Set the node for instance matrix in the material
    if (this._currentMaterial) {
      (this._currentMaterial as any).positionNode = getInstancedMatrix(uniform(this.matricesTexture));
    }
  };

  InstancedMesh2.prototype.initColorsNode = function(): void {
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
  };

  InstancedMesh2.prototype.initBonesNode = function(): void {
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
  };

  // Ensure textures are updated before each render
  InstancedMesh2.prototype.onBeforeRender = function(renderer, scene, camera, geometry, material, group): void {
    this.onBeforeRender(renderer, scene, camera, geometry, material, group);
    this.matricesTexture.update(renderer);
    this.colorsTexture?.update(renderer);
  };

}

const _defaultCapacity = 1000;
