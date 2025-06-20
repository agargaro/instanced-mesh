import { BufferGeometry, ColorManagement, DataTexture, Material, Object3DEventMap } from 'three';
import { SquareDataTextureGPU } from './utils/SquareDataTexture.js';
import { MeshBasicNodeMaterial, StorageInstancedBufferAttribute, WebGPURenderer, InstanceNode } from 'three/webgpu';
import { getColorTexture } from '../shaders/tsl/nodes.js';
import { InstancedMesh2 } from './InstancedMesh2.js';


/**
 * Parameters for configuring an `InstancedMeshGPU` instance.
 */
export interface InstancedMeshGPUParams {
  /**
   * Determines the maximum number of instances that buffers can hold.
   * The buffers will be expanded automatically if necessary.
   * @default 1000
   */
  capacity?: number;
  /**
   * Determines whether to create an array of `InstancedEntity` to easily manipulate instances at the cost of more memory.
   * @default false
   */
  createEntities?: boolean;
  /**
   * Determines whether `InstancedEntity` can use the `rotation` property.
   * If `true` `quaternion` and `rotation` will be synchronized, affecting performance.
   * @default false
   */
  allowsEuler?: boolean;
  /**
   * WebGL renderer instance.
   * If not provided, buffers will be initialized during the first render, resulting in no instances being rendered initially.
   * @default null
   */
  renderer?: WebGPURenderer;
}

/**
 * Alternative `InstancedMesh` class to support additional features like frustum culling, fast raycasting, LOD and more.
 * @template TData Type for additional instance data.
 * @template TGeometry Type extending `BufferGeometry`.
 * @template TMaterial Type extending `Material` or an array of `Material`.
 * @template TEventMap Type extending `Object3DEventMap`.
 */
export class InstancedMeshGPU<
  TData = {},
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[],
  TEventMap extends Object3DEventMap = Object3DEventMap
> extends InstancedMesh2<TGeometry, TMaterial, TEventMap> {
  /**
   * The number of instances rendered in the last frame.
   */
  public declare count: number;
  /**
   * @defaultValue `InstancedMesh2`
   */
  public override readonly type = 'InstancedMeshGPU' as any;
  /**
   * Indicates if this is an `InstancedMeshGPU`.
   */
  public readonly isInstancedMeshGPU = true;
  /**
   * Texture storing matrices for instances.
   */
  public override matricesTexture: SquareDataTextureGPU;
  /**
   * Texture storing colors for instances.
   */
  public override colorsTexture: SquareDataTextureGPU = null;
  /**
   * Texture storing morph target influences for instances.
   */
  public override morphTexture: DataTexture = null;
  /**
   * Texture storing bones for instances.
   */
  public override boneTexture: SquareDataTextureGPU = null;
  /**
   * Texture storing custom uniforms per instance.
   */
  public override uniformsTexture: SquareDataTextureGPU = null;

  /** @internal */ override _renderer: WebGPURenderer | any = null;

  /**
   * Material for TSL nodes system
   */
  protected override _currentMaterial: MeshBasicNodeMaterial = null;

  /** @internal */ override instanceMatrix = new StorageInstancedBufferAttribute(new Float32Array(0), 16); // must be init to avoid exception

  private _adapter: GPUAdapter;
  private _device: GPUDevice;
  private _context: any;

  /** @internal */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  constructor(geometry: TGeometry, material: TMaterial, params?: InstancedMeshGPUParams, LOD?: InstancedMeshGPU);
  constructor(geometry: TGeometry, material: TMaterial, params?: InstancedMeshGPUParams);
  /**
   * @remarks Geometry cannot be shared. If reused, it will be cloned.
   * @param geometry An instance of `BufferGeometry`.
   * @param material A single or an array of `Material`.
   * @param params Optional configuration parameters object. See `InstancedMeshGPUParams` for details.
   */
  constructor(geometry: TGeometry, material: TMaterial, params: InstancedMeshGPUParams = {}, LOD?: InstancedMeshGPU) {
    if (!geometry) throw new Error('"geometry" is mandatory.');
    if (!material) throw new Error('"material" is mandatory.');

    const { allowsEuler, renderer, createEntities } = params;

    super(geometry, material);

    const capacity = params.capacity > 0 ? params.capacity : _defaultCapacity;
    this._renderer = renderer;
    this._capacity = capacity;
    this._createEntities = createEntities;
    this.initMatricesTexture();
  }

  /**
   * Initializes the `InstancedMeshGPU` instance.
   * This method is called automatically when the instance is created.
   */
  public async init(): Promise<void> {
    this._adapter = await navigator.gpu.requestAdapter();
    this._device = await this._adapter.requestDevice();
    this._context = this._renderer.domElement.getContext('webgpu');

    this._currentMaterial.colorNode = getColorTexture(this.colorsTexture);
  }

  protected override initMatricesTexture(): void {
    if (!this._parentLOD) {
      this.matricesTexture = new SquareDataTextureGPU(Float32Array, 4, 4, this._capacity);
    }
  }

  protected override initColorsTexture(): void {
    if (!this._parentLOD) {
      this.colorsTexture = new SquareDataTextureGPU(Float32Array, 4, 1, this._capacity);
      this.colorsTexture.colorSpace = ColorManagement.workingColorSpace;
      this.colorsTexture._data.fill(1);
      this.materialsNeedsUpdate();
    }
  }

}

const _defaultCapacity = 1000;
