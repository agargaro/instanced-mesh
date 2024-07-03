import { Box3, BufferGeometry, Camera, DataTexture, DynamicDrawUsage, FloatType, Group, InstancedBufferAttribute, Intersection, Material, Matrix4, Mesh, Object3DEventMap, RGBAFormat, Raycaster, RedFormat, Scene, Sphere, Vector3, WebGLProgramParametersWithUniforms, WebGLRenderer } from "three";
import { InstancedEntity } from "./InstancedEntity";

export type Entity<T> = InstancedEntity & T;
export type CreateEntityCallback<T> = (obj: Entity<T>, index: number) => void;

export interface InstancedMesh2Params<T, G extends BufferGeometry, M extends Material | Material[]> {
  geometry?: G,
  material?: M,
  onInstanceCreation?: CreateEntityCallback<Entity<T>>;
  // behaviour: CullingMode;
  // verbose?: boolean;
  // bvhParams?: BVHParams;
  // createEntities?: boolean;
}

export class InstancedMesh2<
  TCustomData = {},
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material,
  TEventMap extends Object3DEventMap = Object3DEventMap
> extends Mesh<TGeometry, TMaterial, TEventMap> {

  public override type = 'InstancedMesh2';
  public isInstancedMesh2 = true;
  public instances: Entity<TCustomData>[];
  public instanceIndex: InstancedBufferAttribute;
  // public instanceIndex: GLInstancedBufferAttribute;
  public instanceTexture: DataTexture;
  public morphTexture: DataTexture = null;
  public boundingBox: Box3 = null;
  public boundingSphere: Sphere = null;
  public instancesCount: number;
  protected _matrixArray: Float32Array;
  protected _count: number;
  protected _maxCount: number;
  protected _material: TMaterial;

  // HACK TO MAKE IT WORK WITHOUT UPDATE CORE
  private isInstancedMesh = true; // must be set to use instancing rendering
  private instanceMatrix = new InstancedBufferAttribute(new Float32Array(0), 16); // must be init to avoid exception
  private instanceColor = null; // must be null to avoid exception

  public get count() { return this._count }
  public get maxCount() { return this._maxCount }

  // @ts-ignore
  public override get material() { return this._material }
  public override set material(value: TMaterial) {
    this._material = value;
    this.patchMaterials(value);
  }

  public override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
    //
  }

  /** THIS MATERIAL AND GEOMETRY CANNOT BE SHARED */
  constructor(count: number, config: InstancedMesh2Params<TCustomData, TGeometry, TMaterial>) {
    if (count === undefined) throw new Error("'count' is mandatory.");
    if (config === undefined) throw new Error("'config' is mandatory.");

    super(config.geometry, config.material);

    this.frustumCulled = false;
    this.instancesCount = count;
    this._maxCount = count;
    this._count = count;
    this._material = config.material;

    this.initIndixes(undefined);
    this.initMatricesTexture();
    this.createInstances(config.onInstanceCreation);
  }

  protected initIndixes(renderer: WebGLRenderer): void {
    // const gl = renderer.getContext();
    // const buffer = gl.createBuffer();
    const array = new Uint32Array(this._maxCount);
    // gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // gl.bufferData(gl.ARRAY_BUFFER, array, gl.STREAM_DRAW);

    for (let i = 0; i < this._maxCount; i++) {
      array[i] = i;
    }

    // this.instanceIndex = new GLInstancedBufferAttribute(buffer, gl.UNSIGNED_INT, 1, 4, array.length, array); // UNSIGNED_SHORT usare anche questo se < 65k
    this.instanceIndex = new InstancedBufferAttribute(array, 1); // UNSIGNED_SHORT usare anche questo se < 65k
    this.instanceIndex.setUsage(DynamicDrawUsage);
    this.geometry.setAttribute("instanceIndex", this.instanceIndex);
  }

  protected initMatricesTexture(): void {
    let size = Math.sqrt(this._maxCount * 4); // 4 pixels needed for 1 matrix
    size = Math.ceil(size / 4) * 4;
    size = Math.max(size, 4);

    const matrixArray = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
    this.instanceTexture = new DataTexture(matrixArray, size, size, RGBAFormat, FloatType);
    this._matrixArray = matrixArray;
    this.instanceTexture.needsUpdate = true;
  }

  protected createInstances(onInstanceCreation: CreateEntityCallback<Entity<TCustomData>>): void {
    const count = this._maxCount; // we can create only first N count
    this.instances = new Array(count);

    for (let i = 0; i < count; i++) {
      const instance = new InstancedEntity(this, i) as Entity<TCustomData>;
      this.instances[i] = instance;

      if (onInstanceCreation) {
        onInstanceCreation(instance, i);
        instance.forceUpdateMatrix();
      }
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
    if (material.isInstancedMeshPatched) return;

    const onBeforeCompile = material.onBeforeCompile;

    // use onBuild instead to access to object.. ONBUILD HAS BEEN REMOVED RIP
    material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer) => {
      if (onBeforeCompile) onBeforeCompile(shader, renderer);

      if (!shader.instancing) return;

      shader.instancing = false;
      shader.instancingColor = false; // capire
      shader.uniforms.instanceTexture = { value: this.instanceTexture };

      if (!shader.defines) shader.defines = {};
      shader.defines["USE_INSTANCING_INDIRECT"] = "";

      shader.vertexShader = shader.vertexShader.replace("#include <batching_vertex>", "#include <batching_vertex>\n#include <instanced_vertex>");
      shader.vertexShader = shader.vertexShader.replace("#include <batching_pars_vertex>", "#include <batching_pars_vertex>\n#include <instanced_pars_vertex>");
    }

    material.isInstancedMeshPatched = true;
  }

  public getMatrixAt(index: number, matrix: Matrix4): void {
    matrix.fromArray(this._matrixArray, index * 16);
  }

  public setMatrixAt(index: number, matrix: Matrix4): void {
    matrix.toArray(this._matrixArray, index * 16);
    this.instanceTexture.needsUpdate = true;
  }

  public computeBoundingBox(): void {
    const geometry = this.geometry;
    const count = this.instancesCount;

    if (this.boundingBox === null) this.boundingBox = new Box3();

    if (geometry.boundingBox === null) geometry.computeBoundingBox();

    this.boundingBox.makeEmpty();

    for (let i = 0; i < count; i++) {
      this.getMatrixAt(i, _instanceLocalMatrix);
      _box3.copy(geometry.boundingBox).applyMatrix4(_instanceLocalMatrix);
      this.boundingBox.union(_box3);
    }
  }

  public computeBoundingSphere(): void {
    const geometry = this.geometry;
    const count = this.instancesCount;

    if (this.boundingSphere === null) this.boundingSphere = new Sphere();

    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

    this.boundingSphere.makeEmpty();

    for (let i = 0; i < count; i++) {
      this.getMatrixAt(i, _instanceLocalMatrix);
      _sphere.copy(geometry.boundingSphere).applyMatrix4(_instanceLocalMatrix);
      this.boundingSphere.union(_sphere);
    }
  }

  public override copy(source: InstancedMesh2, recursive?: boolean): this {
    super.copy(source, recursive);

    this.instanceIndex.copy(source.instanceIndex);
    this.instanceTexture = source.instanceTexture.clone();

    if (source.morphTexture !== null) this.morphTexture = source.morphTexture.clone();

    //TODO copy uniform?

    this.instancesCount = source.instancesCount;
    this._count = source._maxCount;
    this._maxCount = source._maxCount;

    if (source.boundingBox !== null) this.boundingBox = source.boundingBox.clone();
    if (source.boundingSphere !== null) this.boundingSphere = source.boundingSphere.clone();

    return this;
  }

  public getMorphAt(index: number, object: Mesh): void {
    const objectInfluences = object.morphTargetInfluences;
    const array = this.morphTexture.source.data.data;
    const len = objectInfluences.length + 1; // All influences + the baseInfluenceSum
    const dataIndex = index * len + 1; // Skip the baseInfluenceSum at the beginning

    for (let i = 0; i < objectInfluences.length; i++) {
      objectInfluences[i] = array[dataIndex + i];
    }
  }

  public setMorphAt(index: number, object: Mesh): void {
    const objectInfluences = object.morphTargetInfluences;
    const len = objectInfluences.length + 1; // morphBaseInfluence + all influences

    if (this.morphTexture === null) {
      this.morphTexture = new DataTexture(new Float32Array(len * this._maxCount), len, this._maxCount, RedFormat, FloatType);
    }

    const array = this.morphTexture.source.data.data;
    let morphInfluencesSum = 0;

    for (let i = 0; i < objectInfluences.length; i++) {
      morphInfluencesSum += objectInfluences[i];
    }

    const morphBaseInfluence = this.geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;
    const dataIndex = len * index;
    array[dataIndex] = morphBaseInfluence;
    array.set(objectInfluences, dataIndex + 1);
  }

  public dispose(): this {
    this.dispatchEvent<any>({ type: 'dispose' }); // Typescript bug, need any cast

    this.instanceTexture.dispose();
    //TODO dispose uniform

    if (this.morphTexture !== null) {
      this.morphTexture.dispose();
      this.morphTexture = null;
    }

    return this;
  }

  public override raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    console.error("TO IMPLEMENT");
  }

  /** @internal @LASTREV 166 Matrix4 */
  public composeToArray(position: Vector3, scale: Vector3, quaternion: any, index: number): void {
    const te = this._matrixArray;
    const offset = index * 16;

    const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    const sx = scale.x, sy = scale.y, sz = scale.z;

    te[offset + 0] = (1 - (yy + zz)) * sx;
    te[offset + 1] = (xy + wz) * sx;
    te[offset + 2] = (xz - wy) * sx;
    te[offset + 3] = 0;

    te[offset + 4] = (xy - wz) * sy;
    te[offset + 5] = (1 - (xx + zz)) * sy;
    te[offset + 6] = (yz + wx) * sy;
    te[offset + 7] = 0;

    te[offset + 8] = (xz + wy) * sz;
    te[offset + 9] = (yz - wx) * sz;
    te[offset + 10] = (1 - (xx + yy)) * sz;
    te[offset + 11] = 0;

    te[offset + 12] = position.x;
    te[offset + 13] = position.y;
    te[offset + 14] = position.z;
    te[offset + 15] = 1;
  }

}

const _instanceLocalMatrix = new Matrix4();
const _box3 = new Box3();
const _sphere = new Sphere();
