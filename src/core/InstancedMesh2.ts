import { Box3, BufferAttribute, BufferGeometry, Camera, Color, ColorManagement, ColorRepresentation, DataTexture, FloatType, Group, InstancedBufferAttribute, Material, Matrix4, Mesh, MeshDepthMaterial, MeshDistanceMaterial, Object3D, Object3DEventMap, RGBADepthPacking, RedFormat, Scene, Sphere, WebGLRenderer } from 'three';
import { CustomSortCallback } from './feature/FrustumCulling.js';
import { Entity } from './feature/Instances.js';
import { LODInfo } from './feature/LOD.js';
import { InstancedEntity } from './InstancedEntity.js';
import { BVHParams, InstancedMeshBVH } from './InstancedMeshBVH.js';
import { GLInstancedBufferAttribute } from './utils/GLInstancedBufferAttribute.js';
import { SquareDataTexture } from './utils/SquareDataTexture.js';

// TODO if bvh present, can override?
// TODO: Use BVH only for raycasting
// TODO LOD: instancedMeshLOD rendering first nearest levels, look out to transparent
// TODO LOD: shared customDepthMaterial and customDistanceMaterial?
// TODO LOD: BVH and handle raycastOnlyFrustum?;
// TODO LOD: sync all textures private property (colorsArray, colorsTexture, etc) to prevent to create unnecesary textures

/**
 * Parameters for configuring an `InstancedMesh2` instance.
 */
export interface InstancedMesh2Params {
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
  createInstances?: boolean;
  /**
   * Determines whether `InstancedEntity` can use the `rotation` property.
   * If **true** `quaternion` and `rotation` will be synchronized, affecting performance.
   * @default false
   */
  allowsEuler?: boolean;
  /**
   * WebGL renderer instance.
   * If not provided, buffers will be initialized during the first render, resulting in no instances being rendered initially.
   */
  renderer?: WebGLRenderer;
}

export class InstancedMesh2<
  TData = {},
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[],
  TEventMap extends Object3DEventMap = Object3DEventMap
> extends Mesh<TGeometry, TMaterial, TEventMap> {
  public override readonly type = 'InstancedMesh2';
  public readonly isInstancedMesh2 = true;
  public instances: Entity<TData>[] = null;
  public instanceIndex: GLInstancedBufferAttribute;
  public matricesTexture: SquareDataTexture;
  public colorsTexture: SquareDataTexture = null;
  public morphTexture: DataTexture = null;
  public uniformsTexture: SquareDataTexture = null;
  public boundingBox: Box3 = null;
  public boundingSphere: Sphere = null;
  public bvh: InstancedMeshBVH = null;
  public customSort: CustomSortCallback = null;
  public raycastOnlyFrustum = false;
  public visibilityArray: boolean[];
  public LODinfo: LODInfo<TData> = null;
  /** @internal */ _renderer: WebGLRenderer = null;
  /** @internal */ _instancesCount = 0;
  /** @internal */ _count = 0;
  /** @internal */ _perObjectFrustumCulled = true;
  /** @internal */ _sortObjects = false;
  /** @internal */ _capacity: number;
  /** @internal */ _indexArrayNeedsUpdate = false;
  /** @internal */ _geometry: TGeometry;
  /** @internal */ _material: TMaterial;
  /** @internal */ _parentLOD: InstancedMesh2;
  protected readonly _allowsEuler: boolean;
  protected readonly _tempInstance: InstancedEntity;
  protected _useOpacity = false;

  public override customDepthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  public override customDistanceMaterial = new MeshDistanceMaterial();

  // HACK TO MAKE IT WORK WITHOUT UPDATE CORE
  private readonly isInstancedMesh = true; // must be set to use instancing rendering
  private readonly instanceMatrix = new InstancedBufferAttribute(new Float32Array(0), 16); // must be init to avoid exception
  private readonly instanceColor = null; // must be null to avoid exception

  public get capacity(): number { return this._capacity; }
  public get count(): number { return this._count; }

  public get instancesCount(): number { return this._instancesCount; }
  public set instancesCount(value: number) { this.setInstancesCount(value); }

  public get perObjectFrustumCulled(): boolean { return this._perObjectFrustumCulled; }
  public set perObjectFrustumCulled(value: boolean) {
    this._perObjectFrustumCulled = value;
    this._indexArrayNeedsUpdate = true;
  }

  public get sortObjects(): boolean { return this._sortObjects; }
  public set sortObjects(value: boolean) {
    this._sortObjects = value;
    this._indexArrayNeedsUpdate = true;
  }

  // @ts-expect-error it's defined as a property, but is overridden as an accessor.
  public override get geometry(): TGeometry { return this._geometry; }
  public override set geometry(value: TGeometry) {
    this._geometry = value;
    this.patchGeometry(value);
  }

  // @ts-expect-error it's defined as a property, but is overridden as an accessor.
  public override get material(): TMaterial { return this._material; }
  public override set material(value: TMaterial) {
    this._material = value;
    this.patchMaterials(value);
  }

  /** MATERIAL CANNOT BE SHARED AND GEOMETRY IS CLONED IF ALREADY PATCHED */
  constructor(geometry: TGeometry, material: TMaterial, params: InstancedMesh2Params = {}, LOD?: InstancedMesh2) {
    if (!geometry) throw new Error('"geometry" is mandatory.');
    if (!material) throw new Error('"material" is mandatory.');

    const { allowsEuler, renderer, createInstances } = params;

    super(geometry, material);

    const capacity = params.capacity > 0 ? params.capacity : _defaultCapacity;
    this._renderer = renderer;
    this._capacity = capacity;
    this._geometry = geometry;
    this._material = material;
    this._allowsEuler = allowsEuler ?? false;
    this._tempInstance = new InstancedEntity(this, -1, allowsEuler);
    this._parentLOD = LOD;
    this.visibilityArray = LOD?.visibilityArray ?? new Array(capacity).fill(true);
    this.frustumCulled = false;

    this.initIndexAttribute();
    this.initMatricesTexture();

    this.patchMaterial(this.customDepthMaterial);
    this.patchMaterial(this.customDistanceMaterial);

    if (createInstances) this.createInstances();
  }

  public override onBeforeShadow(renderer: WebGLRenderer, scene: Scene, camera: Camera, shadowCamera: Camera, geometry: BufferGeometry, depthMaterial: Material, group: Group): void {
    if (this.instanceIndex) this.performFrustumCulling(shadowCamera, camera);
  }

  public override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
    this.matricesTexture.update(renderer);
    this.colorsTexture?.update(renderer);
    this.uniformsTexture?.update(renderer);
    if (this.instanceIndex) this.performFrustumCulling(camera);
    else this._renderer = renderer;
  }

  public override onAfterRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
    if (!this.instanceIndex) this.initIndexAttribute();
  }

  protected initIndexAttribute(): void {
    if (!this._renderer) {
      this._count = 0;
      return;
    }

    const gl = this._renderer.getContext() as WebGL2RenderingContext;
    const capacity = this._capacity;
    const array = new Uint32Array(capacity);

    for (let i = 0; i < capacity; i++) {
      array[i] = i;
    }

    this.instanceIndex = new GLInstancedBufferAttribute(gl, gl.UNSIGNED_INT, 1, 4, array);
    this._geometry?.setAttribute('instanceIndex', this.instanceIndex as unknown as BufferAttribute);
  }

  protected initMatricesTexture(): void {
    if (this._parentLOD) {
      this.matricesTexture = this._parentLOD.matricesTexture;
    } else {
      this.matricesTexture = new SquareDataTexture(Float32Array, 4, 4, this._capacity);
    }
  }

  protected initColorsTexture(): void {
    this.colorsTexture = new SquareDataTexture(Float32Array, 4, 1, this._capacity);
    this.colorsTexture.colorSpace = ColorManagement.workingColorSpace;
    this.colorsTexture._data.fill(1);
  }

  protected patchGeometry(geometry: TGeometry): void {
    if (geometry.hasAttribute('instanceIndex')) {
      geometry = geometry.clone();
      geometry.deleteAttribute('instanceIndex');
    }

    if (this.instanceIndex) {
      geometry.setAttribute('instanceIndex', this.instanceIndex as unknown as BufferAttribute);
    }
  }

  protected patchMaterials(material: TMaterial): void {
    if (!material) return;

    if ((material as Material).isMaterial) {
      this.patchMaterial(material as Material);
      return;
    }

    for (const m of material as Material[]) {
      this.patchMaterial(m);
    }
  }

  protected patchMaterial(material: Material): void {
    if (material.isInstancedMeshPatched) throw new Error('Cannot reuse already patched material.');

    const onBeforeCompile = material.onBeforeCompile.bind(material);

    material.onBeforeCompile = (shader, renderer) => {
      if (onBeforeCompile) onBeforeCompile(shader, renderer);

      if (!shader.instancing) return;

      shader.instancing = false;
      shader.instancingColor = false;
      shader.uniforms.matricesTexture = { value: this.matricesTexture };

      if (!shader.defines) shader.defines = {};
      shader.defines['USE_INSTANCING_INDIRECT'] = '';

      if (this.uniformsTexture) {
        // create varying vInstanceIndex
        if (!shader.vertexShader.includes('varying uint vInstanceIndex')) {
          shader.vertexShader = shader.vertexShader.replace('void main() {', 'flat varying uint vInstanceIndex;\n void main() {\n vInstanceIndex = instanceIndex;');
          shader.fragmentShader = shader.fragmentShader.replace('void main() {', 'flat varying uint vInstanceIndex;\n void main() {');
        }

        shader.uniforms.uniformsTexture = { value: this.uniformsTexture };
        const uniformsFragmentGLSL = this.uniformsTexture.getUniformsFragmentGLSL('uniformsTexture', 'vInstanceIndex');
        shader.fragmentShader = shader.fragmentShader.replace('void main() {', uniformsFragmentGLSL);
      }

      if (this.colorsTexture) {
        if (!shader.fragmentShader.includes('#include <color_pars_fragment>')) return;

        shader.uniforms.colorsTexture = { value: this.colorsTexture };

        if (this._useOpacity) {
          shader.defines['USE_INSTANCING_COLOR_ALPHA_INDIRECT'] = '';
        } else {
          shader.defines['USE_INSTANCING_COLOR_INDIRECT'] = '';
        }
      }
    };

    material.isInstancedMeshPatched = true;
  }

  public computeBVH(config: BVHParams = {}): void {
    if (!this.bvh) this.bvh = new InstancedMeshBVH(this, config.margin, config.getBBoxFromBSphere, config.accurateCulling);
    this.bvh.clear();
    this.bvh.create();
  }

  public disposeBVH(): void {
    this.bvh = null;
  }

  public setMatrixAt(id: number, matrix: Matrix4): void {
    matrix.toArray(this.matricesTexture._data, id * 16);

    if (this.instances) {
      const instance = this.instances[id];
      matrix.decompose(instance.position, instance.quaternion, instance.scale);
    }

    this.matricesTexture.enqueueUpdate(id);
    this.bvh?.move(id);
  }

  public getMatrixAt(id: number, matrix = _tempMat4): Matrix4 {
    return matrix.fromArray(this.matricesTexture._data, id * 16);
  }

  public setVisibilityAt(id: number, visible: boolean): void {
    this.visibilityArray[id] = visible;
    this._indexArrayNeedsUpdate = true;
  }

  public getVisibilityAt(id: number): boolean {
    return this.visibilityArray[id];
  }

  public setColorAt(id: number, color: ColorRepresentation): void {
    if (this.colorsTexture === null) {
      this.initColorsTexture();
    }

    if ((color as Color).isColor) {
      (color as Color).toArray(this.colorsTexture._data, id * 4);
    } else {
      _tempCol.set(color).toArray(this.colorsTexture._data, id * 4);
    }

    this.colorsTexture.enqueueUpdate(id);
  }

  public getColorAt(id: number, color = _tempCol): Color {
    return color.fromArray(this.colorsTexture._data, id * 4);
  }

  public setOpacityAt(id: number, value: number): void {
    if (this.colorsTexture === null) {
      this.initColorsTexture();
    }

    this._useOpacity = true;
    this.colorsTexture._data[id * 4 + 3] = value;
    this.colorsTexture.enqueueUpdate(id);
  }

  public getOpacityAt(id: number): number {
    return this.colorsTexture._data[id * 4 + 3];
  }

  public getMorphAt(index: number, object = _tempMesh): Mesh {
    const objectInfluences = object.morphTargetInfluences;
    const array = this.morphTexture.source.data.data;
    const len = objectInfluences.length + 1; // All influences + the baseInfluenceSum
    const dataIndex = index * len + 1; // Skip the baseInfluenceSum at the beginning

    for (let i = 0; i < objectInfluences.length; i++) {
      objectInfluences[i] = array[dataIndex + i];
    }

    return object;
  }

  public setMorphAt(index: number, object: Mesh): void {
    const objectInfluences = object.morphTargetInfluences;
    const len = objectInfluences.length + 1; // morphBaseInfluence + all influences

    if (this.morphTexture === null) {
      this.morphTexture = new DataTexture(new Float32Array(len * this._capacity), len, this._capacity, RedFormat, FloatType);
    }

    const array = this.morphTexture.source.data.data;
    let morphInfluencesSum = 0;

    for (const objectInfluence of objectInfluences) {
      morphInfluencesSum += objectInfluence;
    }

    const morphBaseInfluence = this._geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;
    const dataIndex = len * index;
    array[dataIndex] = morphBaseInfluence;
    array.set(objectInfluences, dataIndex + 1);
    this.morphTexture.needsUpdate = true;
  }

  public copyTo(id: number, target: Object3D): void {
    this.getMatrixAt(id, target.matrix).decompose(target.position, target.quaternion, target.scale);
  }

  public computeBoundingBox(): void {
    const geometry = this._geometry;
    const count = this._instancesCount;

    if (this.boundingBox === null) this.boundingBox = new Box3();
    if (geometry.boundingBox === null) geometry.computeBoundingBox();

    const geoBoundingBox = geometry.boundingBox;
    const boundingBox = this.boundingBox;

    boundingBox.makeEmpty();

    for (let i = 0; i < count; i++) {
      _box3.copy(geoBoundingBox).applyMatrix4(this.getMatrixAt(i));
      boundingBox.union(_box3);
    }
  }

  public computeBoundingSphere(): void {
    const geometry = this._geometry;
    const count = this._instancesCount;

    if (this.boundingSphere === null) this.boundingSphere = new Sphere();
    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

    const geoBoundingSphere = geometry.boundingSphere;
    const boundingSphere = this.boundingSphere;

    boundingSphere.makeEmpty();

    for (let i = 0; i < count; i++) {
      _sphere.copy(geoBoundingSphere).applyMatrix4(this.getMatrixAt(i));
      boundingSphere.union(_sphere);
    }
  }

  public override copy(source: InstancedMesh2, recursive?: boolean): this {
    super.copy(source, recursive);

    // this.instanceIndex.copy(source.instanceIndex);
    this.matricesTexture = source.matricesTexture.clone();

    // this._matricesTexture = source._matricesTexture.clone();
    // this._matricesTexture.image.data = this._matricesTexture.image.data.slice();

    if (source.colorsTexture !== null) this.colorsTexture = source.colorsTexture.clone();
    if (source.morphTexture !== null) this.morphTexture = source.morphTexture.clone();

    // TODO copy uniform?

    this._instancesCount = source._instancesCount;
    this._count = source._capacity;
    this._capacity = source._capacity;

    if (source.boundingBox !== null) this.boundingBox = source.boundingBox.clone();
    if (source.boundingSphere !== null) this.boundingSphere = source.boundingSphere.clone();

    return this;
  }

  public dispose(): this {
    this.dispatchEvent<any>({ type: 'dispose' });

    this.matricesTexture.dispose();
    this.colorsTexture?.dispose();
    this.morphTexture?.dispose();
    this.uniformsTexture?.dispose();

    return this;
  }
}

const _defaultCapacity = 1000;
const _box3 = new Box3();
const _sphere = new Sphere();
const _tempMat4 = new Matrix4();
const _tempCol = new Color();
const _tempMesh = new Mesh();
