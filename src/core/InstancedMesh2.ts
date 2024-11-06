import { Box3, BufferAttribute, BufferGeometry, Camera, Color, ColorManagement, ColorRepresentation, DataTexture, FloatType, Group, InstancedBufferAttribute, Material, Matrix4, Mesh, MeshDepthMaterial, MeshDistanceMaterial, Object3D, Object3DEventMap, RGBADepthPacking, RGFormat, RedFormat, Scene, ShaderMaterial, Sphere, WebGLRenderer } from "three";
import { createTexture_mat4, createTexture_vec4 } from "../utils/CreateTexture.js";
import { GLInstancedBufferAttribute } from "./utils/GLInstancedBufferAttribute.js";
import { InstancedEntity, UniformValue, UniformValueNoNumber } from "./InstancedEntity.js";
import { InstancedMeshBVH } from "./InstancedMeshBVH.js";
import { InstancedRenderItem } from "./utils/InstancedRenderList.js";
import { LODInfo } from "./feature/LOD.js";

// TODO: Add expand and count/maxCount when create?
// TODO: partial texture update
// TODO: Use BVH only for raycasting

// TODO SOON: sync all textures
// TODO SOON: instancedMeshLOD rendering first nearest levels, look out to transparent

// public raycastOnlyFrustum = false;
// public override customDepthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
// public override customDistanceMaterial = new MeshDistanceMaterial();

export type Entity<T> = InstancedEntity & T;
export type UpdateEntityCallback<T> = (obj: Entity<T>, index: number) => void;
export type CustomSortCallback = (list: InstancedRenderItem[]) => void;

export interface BVHParams {
  margin?: number;
  highPrecision?: boolean;
  getBBoxFromBSphere?: boolean;
  multiplier?: number; 
}

export class InstancedMesh2<
  TCustomData = {},
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[],
  TEventMap extends Object3DEventMap = Object3DEventMap
> extends Mesh<TGeometry, TMaterial, TEventMap> {

  public override readonly type = 'InstancedMesh2';
  public readonly isInstancedMesh2 = true;
  public instances: Entity<TCustomData>[] = null;
  public instanceIndex: GLInstancedBufferAttribute;
  public matricesTexture: DataTexture;
  public colorsTexture: DataTexture = null;
  public morphTexture: DataTexture = null;
  public boundingBox: Box3 = null;
  public boundingSphere: Sphere = null;
  public instancesCount: number; // TODO handle update from dynamic to static
  public bvh: InstancedMeshBVH = null;
  public customSort: CustomSortCallback = null;
  public raycastOnlyFrustum = false;
  public visibilityArray: boolean[];
  public infoLOD: LODInfo<TCustomData> = null; // TODO rename
  /** @internal */ public _indexArray: Uint16Array | Uint32Array;
  /** @internal */ public _matrixArray: Float32Array;
  /** @internal */ public _colorArray: Float32Array = null;
  /** @internal */ public _count: number;
  /** @internal */ public _perObjectFrustumCulled = true;
  /** @internal */ public _sortObjects = false;
  /** @internal */ public _maxCount: number;
  /** @internal */ public _visibilityChanged = false;
  /** @internal */  _geometry: TGeometry;
  /** @internal */  _material: TMaterial;
  protected _uniformsSetCallback = new Map<string, (id: number, value: UniformValue) => void>();
  protected _parentLOD: InstancedMesh2;
  protected readonly _instancesUseEuler: boolean;
  protected readonly _instance: InstancedEntity;

  public override customDepthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  public override customDistanceMaterial = new MeshDistanceMaterial();

  // HACK TO MAKE IT WORK WITHOUT UPDATE CORE
  private readonly isInstancedMesh = true; // must be set to use instancing rendering
  private readonly instanceMatrix = new InstancedBufferAttribute(new Float32Array(0), 16); // must be init to avoid exception
  private readonly instanceColor = null; // must be null to avoid exception

  public get count() { return this._count }
  public get maxCount() { return this._maxCount }

  public get perObjectFrustumCulled() { return this._perObjectFrustumCulled }
  public set perObjectFrustumCulled(value: boolean) {
    this._perObjectFrustumCulled = value;
    this._visibilityChanged = true;
  }

  public get sortObjects() { return this._sortObjects }
  public set sortObjects(value: boolean) {
    this._sortObjects = value;
    this._visibilityChanged = true;
  }

  // @ts-expect-error it's defined as a property, but is overridden as an accessor.
  public override get geometry() { return this._geometry }
  public override set geometry(value: TGeometry) {
    this._geometry = value;
    this.patchGeometry(value);
  }

  // @ts-expect-error it's defined as a property, but is overridden as an accessor.
  public override get material() { return this._material }
  public override set material(value: TMaterial) {
    this._material = value;
    this.patchMaterials(value);
  }

  /** MATERIAL CANNOT BE SHARED AND GEOMETRY IS CLONED IF ALREADY PATCHED */
  constructor(renderer: WebGLRenderer, count: number, geometry?: TGeometry, material?: TMaterial, LOD?: InstancedMesh2, instancesUseEuler = false) {
    if (!count || count < 0) throw new Error("'count' must be greater than 0.");

    super(geometry, material);

    this._instancesUseEuler = instancesUseEuler;
    this._instance = new InstancedEntity(this, -1, instancesUseEuler);
    this.instancesCount = count;
    this._maxCount = count;
    this._count = count;
    this._geometry = geometry;
    this._material = material;
    this._parentLOD = LOD;
    this.visibilityArray = LOD?.visibilityArray ?? new Array(count).fill(true);

    this.initIndexArray();
    this.initIndexAttribute(renderer);
    this.initMatricesTexture();

    this.patchMaterial(this.customDepthMaterial); // TODO check if with LOD can reuse it
    this.patchMaterial(this.customDistanceMaterial);
  }

  public override onBeforeShadow(renderer: WebGLRenderer, scene: Scene, camera: Camera, shadowCamera: Camera, geometry: BufferGeometry, depthMaterial: Material, group: Group): void {
    if (this.instanceIndex) this.performFrustumCulling(renderer, shadowCamera, camera);
  }

  public override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
    if (this.instanceIndex) this.performFrustumCulling(renderer, camera);
  }

  public override onAfterRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
    if (!this.instanceIndex) this.initIndexAttribute(renderer);
  }

  protected initIndexArray(): void {
    const count = this._maxCount;
    const array = new Uint32Array(count); // use uint16 if less 32k

    for (let i = 0; i < count; i++) {
      array[i] = i;
    }

    this._indexArray = array;
  }

  protected initIndexAttribute(renderer: WebGLRenderer): void {
    if (!renderer) {
      this._count = 0;
      return;
    }

    const array = this._indexArray;
    const gl = renderer.getContext() as WebGL2RenderingContext;

    this.instanceIndex = new GLInstancedBufferAttribute(gl, gl.UNSIGNED_INT, 1, 4, array); // UNSIGNED_SHORT usare anche questo se < 65k
    this._geometry?.setAttribute("instanceIndex", this.instanceIndex as unknown as BufferAttribute);
  }

  protected initMatricesTexture(): void {
    this.matricesTexture = this._parentLOD ? this._parentLOD.matricesTexture : createTexture_mat4(this._maxCount);
    this._matrixArray = this.matricesTexture.image.data as unknown as Float32Array;
  }

  protected patchGeometry(geometry: TGeometry): void {
    if (geometry.hasAttribute("instanceIndex")) {
      geometry = geometry.clone();
      geometry.deleteAttribute("instanceIndex");
    }

    if (this.instanceIndex) {
      geometry.setAttribute("instanceIndex", this.instanceIndex as unknown as BufferAttribute);
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
      shader.defines["USE_INSTANCING_INDIRECT"] = "";

      if (this.colorsTexture !== null) {
        if (!shader.fragmentShader.includes("#include <color_pars_fragment>")) return;

        shader.uniforms.colorsTexture = { value: this.colorsTexture };
        shader.defines["USE_INSTANCING_COLOR_INDIRECT"] = "";
        shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#define USE_COLOR\n#include <common>");
        // NOTE that '#defined USE_COLOR' is defined only in fragment shader to make it work.
      }
    }

    material.isInstancedMeshPatched = true;
  }

  public updateInstances(onUpdate: UpdateEntityCallback<Entity<TCustomData>>): void {
    const count = this.instancesCount;
    const instances = this.instances;

    if (instances) {
      const instances = this.instances;

      for (let i = 0; i < count; i++) {
        const instance = instances[i];
        onUpdate(instance, i);
        instance.updateMatrix();
      }

      return;
    }

    const instance = this._instance;

    for (let i = 0; i < count; i++) {
      (instance as any).id = i;
      instance.position.set(0, 0, 0);
      instance.scale.set(1, 1, 1);
      instance.quaternion.set(0, 0, 0, 1);
      instance.rotation?.set(0, 0, 0);

      onUpdate(instance as Entity<TCustomData>, i);
      instance.updateMatrix();
    }
  }

  public createInstances(onInstanceCreation?: UpdateEntityCallback<Entity<TCustomData>>): void {
    const count = this._maxCount; // TODO we can create only first N count ?
    const instancesUseEuler = this._instancesUseEuler;
    const instances = this.instances = new Array(count);

    for (let i = 0; i < count; i++) {
      const instance = new InstancedEntity(this, i, instancesUseEuler) as Entity<TCustomData>;
      instances[i] = instance;

      if (onInstanceCreation) {
        onInstanceCreation(instance, i);
        instance.updateMatrix();
      }
    }
  }

  public computeBVH(config: BVHParams = {}): void {
    if (!this.bvh) this.bvh = new InstancedMeshBVH(this, config.margin, config.highPrecision, config.getBBoxFromBSphere);
    this.bvh.clear();
    this.bvh.create();
  }

  public disposeBVH(): void {
    this.bvh = null;
  }

  public setMatrixAt(id: number, matrix: Matrix4): void {
    matrix.toArray(this._matrixArray, id * 16);

    if (this.instances) {
      const instance = this.instances[id];
      matrix.decompose(instance.position, instance.quaternion, instance.scale);
    }

    this.matricesTexture.needsUpdate = true;
    this.bvh?.move(id);
  }

  public getMatrixAt(id: number, matrix = _tempMat4): Matrix4 {
    return matrix.fromArray(this._matrixArray, id * 16);
  }

  public setVisibilityAt(id: number, visible: boolean): void {
    this.visibilityArray[id] = visible;
    this._visibilityChanged = true;
  }

  public getVisibilityAt(id: number): boolean {
    return this.visibilityArray[id];
  }

  public setColorAt(id: number, color: ColorRepresentation): void {
    if (this.colorsTexture === null) {
      this.colorsTexture = createTexture_vec4(this._maxCount);
      this.colorsTexture.colorSpace = ColorManagement.workingColorSpace;
      this._colorArray = this.colorsTexture.image.data as unknown as Float32Array;
      this._colorArray.fill(1);
    }

    if ((color as Color).isColor) {
      (color as Color).toArray(this._colorArray, id * 4);
    } else {
      _tempCol.set(color).toArray(this._colorArray, id * 4);
    }

    this.colorsTexture.needsUpdate = true; 
  }

  public getColorAt(id: number, color = _tempCol): Color {
    return color.fromArray(this._colorArray, id * 4);
  }

  public setUniformAt(id: number, name: string, value: UniformValue): void { // TODO support multimaterial?
    const texture = (this._material as ShaderMaterial).uniforms[name].value as DataTexture; // TODO fix type
    let setCallback = this._uniformsSetCallback.get(name);

    if (!setCallback) {
      const array = texture.image.data;

      if (texture.format === RedFormat) {
        setCallback = (id: number, value: UniformValue) => { array[id] = value as number };
      } else {
        const size = texture.format === RGFormat ? 2 : 4; // 3 is not supported
        setCallback = (id: number, value: UniformValue) => { (value as UniformValueNoNumber).toArray(array, id * size) };
      }

      this._uniformsSetCallback.set(name, setCallback);
    }

    setCallback(id, value);
    texture.needsUpdate = true;
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
      this.morphTexture = new DataTexture(new Float32Array(len * this._maxCount), len, this._maxCount, RedFormat, FloatType);
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
  }

  public copyTo(id: number, target: Object3D): void {
    this.getMatrixAt(id, target.matrix).decompose(target.position, target.quaternion, target.scale);
  }

  public computeBoundingBox(): void { // if bvh present, can override? TODO
    const geometry = this._geometry;
    const count = this.instancesCount;

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
    const count = this.instancesCount;

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

    //TODO copy uniform?

    this.instancesCount = source.instancesCount;
    this._count = source._maxCount;
    this._maxCount = source._maxCount;

    if (source.boundingBox !== null) this.boundingBox = source.boundingBox.clone();
    if (source.boundingSphere !== null) this.boundingSphere = source.boundingSphere.clone();

    return this;
  }

  public dispose(): this {
    this.dispatchEvent<any>({ type: 'dispose' }); // TODO fix d.ts

    this.matricesTexture.dispose();
    this.matricesTexture = null;

    //TODO dispose uniform

    if (this.colorsTexture !== null) {
      this.colorsTexture.dispose();
      this.colorsTexture = null;
    }

    if (this.morphTexture !== null) {
      this.morphTexture.dispose();
      this.morphTexture = null;
    }

    return this;
  }
}

const _box3 = new Box3();
const _sphere = new Sphere();
const _tempMat4 = new Matrix4();
const _tempCol = new Color();
const _tempMesh = new Mesh();
