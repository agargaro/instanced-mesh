import { BufferGeometry, ColorManagement, DataTexture, Material, Object3DEventMap } from 'three';
import { SquareDataTextureGPU } from './utils/SquareDataTexture.js';
import { MeshBasicNodeMaterial, StorageInstancedBufferAttribute, WebGPURenderer } from 'three/webgpu';
import { getBoneMatrix, getColorTexture, getInstancedMatrix } from '../shaders/tsl/nodes.js';
import { InstancedMesh2, InstancedMesh2Params } from './InstancedMesh2.js';
import { uniform, uniformTexture } from 'three/tsl';


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
 * Alternative `InstancedMesh` class to support additional features like frustum culling, fast raycasting, LOD and more.
 * @template TGeometry Type extending `BufferGeometry`.
 * @template TMaterial Type extending `Material` or an array of `Material`.
 * @template TEventMap Type extending `Object3DEventMap`.
 */
export class InstancedMeshGPU<
  TData = {},
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[],
  TEventMap extends Object3DEventMap = Object3DEventMap
> extends InstancedMesh2<TData, TGeometry, TMaterial, TEventMap> {
  
  public override readonly type = 'InstancedMeshGPU' as any;
  
  public readonly isInstancedMeshGPU = true;
  
  public override matricesTexture: SquareDataTextureGPU;
  
  public override colorsTexture: SquareDataTextureGPU = null;
  
  public override boneTexture: SquareDataTextureGPU = null;
  
  public override uniformsTexture: SquareDataTextureGPU = null;

  override _renderer: WebGPURenderer | any = null;

  override _material: MeshBasicNodeMaterial = null;
  override _currentMaterial: MeshBasicNodeMaterial = null;

  override instanceMatrix = new StorageInstancedBufferAttribute(new Float32Array(0), 16);

  private _adapter: GPUAdapter;
  private _device: GPUDevice;
  private _context: any;

  constructor(geometry: TGeometry, material: MeshBasicNodeMaterial, params: InstancedMeshGPUParams = {}, LOD?: InstancedMeshGPU) {
    if (!geometry) throw new Error('"geometry" is mandatory.');
    if (!material) throw new Error('"material" is mandatory.');

    this._currentMaterial = material;
    this._material = material;
    super(geometry, null, null, LOD);
    this.init();
  }

  public async init(): Promise<void> {
    this._adapter = await navigator.gpu.requestAdapter();
    this._device = await this._adapter.requestDevice();
    this._context = this._renderer.domElement.getContext('webgpu');
    this.initMatricesTexture();
    this.initColorsTexture();
    // Ensure textures are updated before first render
    this.matricesTexture.update(this._renderer);
    this.colorsTexture?.update(this._renderer);
  }

  protected override initMatricesTexture(): void {
    if (!this._parentLOD) {
      this.matricesTexture = new SquareDataTextureGPU(Float32Array, 4, 4, this._capacity);
    }
    // Set the node for instance matrix in the material
    if (this._currentMaterial) {
      (this._currentMaterial as any).matricesTexture = getInstancedMatrix(uniform(this.matricesTexture);
    }
  }

  protected override initColorsTexture(): void {
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

  protected initBoneTexture(): void {
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
  public override onBeforeRender(renderer, scene, camera, geometry, material, group): void {
    super.onBeforeRender(renderer, scene, camera, geometry, material, group);
    this.matricesTexture.update(renderer);
    this.colorsTexture?.update(renderer);

    // Ensure the material is a node material and set up the node graph
    if (material && material.isNodeMaterial) {
      // Set the instance matrix node for vertex transformation
      material.positionNode = getInstancedMatrix(this.matricesTexture);
      // Set the color node for fragment color
      material.colorNode = getColorTexture(this.colorsTexture);
    }
  }
}

const _defaultCapacity = 1000;
