import { BVHNode } from "bvh.js";
import { Box3, BufferAttribute, BufferGeometry, Camera, Color, ColorManagement, ColorRepresentation, DataTexture, FloatType, Frustum, Group, InstancedBufferAttribute, Intersection, Material, Matrix4, Mesh, MeshDepthMaterial, MeshDistanceMaterial, Object3D, Object3DEventMap, RGBADepthPacking, RGFormat, Ray, Raycaster, RedFormat, Scene, ShaderMaterial, Sphere, Vector3, WebGLRenderer } from "three";
import { createTexture_mat4, createTexture_vec4 } from "../utils/createTexture.js";
import { GLInstancedBufferAttribute } from "./GLInstancedBufferAttribute.js";
import { InstancedEntity, UniformValue, UniformValueNoNumber } from "./InstancedEntity.js";
import { InstancedMeshBVH } from "./InstancedMeshBVH.js";
import { InstancedMeshLOD } from "./InstancedMeshLOD.js";
import { InstancedRenderItem, InstancedRenderList } from "./InstancedRenderList.js";

// TODO: Add expand and count/maxCount when create?
// TODO: partial texture update
// TODO: Use BVH only for raycasting
// TODO: patchGeometry method

export type Entity<T> = InstancedEntity & T;
export type UpdateEntityCallback<T> = (obj: Entity<T>, index: number) => void;
export type CustomSortCallback = (list: InstancedRenderItem[]) => void;

export interface BVHParams {
  margin?: number;
  highPrecision?: boolean;
}

export class InstancedMesh2<
  TCustomData = {},
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[],
  TEventMap extends Object3DEventMap = Object3DEventMap
> extends Mesh<TGeometry, TMaterial, TEventMap> {

  public override type = 'InstancedMesh2';
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
  public perObjectFrustumCulled = true;
  public sortObjects = false;
  public customSort: CustomSortCallback = null;
  public raycastOnlyFrustum = false;
  public visibilityArray: boolean[];
  /** @internal */ public _indexArray: Uint16Array | Uint32Array;
  /** @internal */ public _matrixArray: Float32Array;
  /** @internal */ public _colorArray: Float32Array = null;
  /** @internal */ public _count: number;
  protected _maxCount: number;
  protected _material: TMaterial;
  protected _uniformsSetCallback = new Map<string, (id: number, value: UniformValue) => void>();
  protected _LOD: InstancedMeshLOD = null;

  public override customDepthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  public override customDistanceMaterial = new MeshDistanceMaterial();

  // HACK TO MAKE IT WORK WITHOUT UPDATE CORE
  private readonly isInstancedMesh = true; // must be set to use instancing rendering
  private readonly instanceMatrix = new InstancedBufferAttribute(new Float32Array(0), 16); // must be init to avoid exception
  private readonly instanceColor = null; // must be null to avoid exception

  public get count() { return this._count }
  public get maxCount() { return this._maxCount }

  // @ts-expect-error it's defined as a property, but is overridden as an accessor.
  public override get material() { return this._material }
  public override set material(value: TMaterial) {
    this._material = value;
    this.patchMaterials(value);
  }

  public override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
    if (!this.instanceIndex) return;
    if (!this._LOD) this.frustumCulling(camera);
    this.instanceIndex.update(renderer, this._count);
  }

  public override onAfterRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
    if (!this.instanceIndex) this.initIndexAttribute(renderer);
  }

  override onBeforeShadow(renderer: WebGLRenderer, scene: Scene, camera: Camera, shadowCamera: Camera, geometry: BufferGeometry, depthMaterial: Material, group: Group): void {
    this.onBeforeRender(renderer, null, shadowCamera, geometry, depthMaterial, group);
  }

  /** THIS MATERIAL AND GEOMETRY CANNOT BE SHARED */
  constructor(renderer: WebGLRenderer, count: number, geometry: TGeometry, material?: TMaterial, LOD?: InstancedMeshLOD) {
    if (!count || count < 0) throw new Error("'count' must be greater than 0.");
    if (!geometry) throw new Error("'geometry' is mandatory.");

    super(geometry, material);

    if (this.geometry.getAttribute("instanceIndex")) throw new Error('Cannot reuse already patched geometry.');

    this.instancesCount = count;
    this._maxCount = count;
    this._count = count;
    this._material = material;
    this._LOD = LOD;
    this.visibilityArray = this._LOD ? LOD.visibilityArray : new Array(count).fill(true);

    this.initIndexArray();
    this.initIndexAttribute(renderer);
    this.initMatricesTexture();

    this.patchMaterial(this.customDepthMaterial); // TODO check if with LOD can reuse it
    this.patchMaterial(this.customDistanceMaterial);
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
      const tempAttribute = new InstancedBufferAttribute(new Uint32Array(0), 1); // UNSIGNED_SHORT usare anche questo se < 65k
      this.geometry.setAttribute("instanceIndex", tempAttribute);
      this._count = 0;
      return;
    }

    const array = this._indexArray;
    const gl = renderer.getContext() as WebGL2RenderingContext;

    this.instanceIndex = new GLInstancedBufferAttribute(gl, gl.UNSIGNED_INT, 1, 4, array); // UNSIGNED_SHORT usare anche questo se < 65k
    this.geometry.setAttribute("instanceIndex", this.instanceIndex as unknown as BufferAttribute);
  }

  protected initMatricesTexture(): void {
    this.matricesTexture = this._LOD ? this._LOD.matricesTexture : createTexture_mat4(this._maxCount);
    this._matrixArray = this.matricesTexture.image.data as unknown as Float32Array;
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

    (_instance as any).owner = this;

    for (let i = 0; i < count; i++) {
      (_instance as any).id = i;
      _instance.position.set(0, 0, 0);
      _instance.scale.set(1, 1, 1);
      _instance.quaternion.set(0, 0, 0, 1);

      onUpdate(_instance as Entity<TCustomData>, i);
      _instance.updateMatrix();
    }
  }

  public createInstances(onInstanceCreation?: UpdateEntityCallback<Entity<TCustomData>>): void {
    const count = this._maxCount; // TODO we can create only first N count ?
    const instances = this.instances = new Array(count);

    for (let i = 0; i < count; i++) {
      const instance = new InstancedEntity(this, i) as Entity<TCustomData>;
      instances[i] = instance;

      if (onInstanceCreation) {
        onInstanceCreation(instance, i);
        instance.updateMatrix();
      }
    }
  }

  public computeBVH(config: BVHParams = {}): void {
    if (!this.bvh) this.bvh = new InstancedMeshBVH(this, config.margin, config.highPrecision);
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

    this.matricesTexture.needsUpdate = true; // TODO 
    this.bvh?.move(id);
  }

  public getMatrixAt(id: number, matrix = _tempMat4): Matrix4 {
    return matrix.fromArray(this._matrixArray, id * 16);
  }

  public setVisibilityAt(id: number, visible: boolean): void {
    this.visibilityArray[id] = visible;
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

    this.colorsTexture.needsUpdate = true; // TODO 
  }

  public getColorAt(id: number, color = _tempCol): Color {
    return color.fromArray(this._colorArray, id * 4);
  }

  public setUniformAt(id: number, name: string, value: UniformValue): void { // TODO support multimaterial?
    let setCallback = this._uniformsSetCallback.get(name);

    if (!setCallback) {
      const texture = (this.material as ShaderMaterial).uniforms[name].value as DataTexture;
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
      // TODO try to use createTexture_float instead?
      this.morphTexture = new DataTexture(new Float32Array(len * this._maxCount), len, this._maxCount, RedFormat, FloatType);
    }

    const array = this.morphTexture.source.data.data;
    let morphInfluencesSum = 0;

    for (const objectInfluence of objectInfluences) {
      morphInfluencesSum += objectInfluence;
    }

    const morphBaseInfluence = this.geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;
    const dataIndex = len * index;
    array[dataIndex] = morphBaseInfluence;
    array.set(objectInfluences, dataIndex + 1);
  }

  public copyTo(id: number, target: Object3D): void {
    this.getMatrixAt(id, target.matrix).decompose(target.position, target.quaternion, target.scale);
  }

  public override raycast(raycaster: Raycaster, result: Intersection[]): void {
    if (this.material === undefined) return;

    const raycastFrustum = this.raycastOnlyFrustum && this.perObjectFrustumCulled && !this.bvh;
    _mesh.geometry = this.geometry;
    _mesh.material = this.material;

    const originalRay = raycaster.ray;
    const originalNear = raycaster.near;
    const originalFar = raycaster.far;

    _invMatrixWorld.copy(this.matrixWorld).invert();

    _worldScale.setFromMatrixScale(this.matrixWorld);
    _direction.copy(raycaster.ray.direction).multiply(_worldScale);
    const scaleFactor = _direction.length();

    raycaster.ray = _ray.copy(raycaster.ray).applyMatrix4(_invMatrixWorld);
    raycaster.near /= scaleFactor;
    raycaster.far /= scaleFactor;

    if (this.bvh) {

      this.bvh.raycast(raycaster, (instanceId) => this.checkObjectIntersection(raycaster, instanceId, result));
      // TODO test with three-mesh-bvh

    } else {

      if (this.boundingSphere === null) this.computeBoundingSphere();
      _sphere.copy(this.boundingSphere);
      if (!raycaster.ray.intersectsSphere(_sphere)) return;

      const instancesToCheck = this._indexArray;
      const checkCount = raycastFrustum ? this._count : this.instancesCount;

      for (let i = 0; i < checkCount; i++) {
        this.checkObjectIntersection(raycaster, instancesToCheck[i], result);
      }

    }

    result.sort(ascSortIntersection);

    raycaster.ray = originalRay;
    raycaster.near = originalNear;
    raycaster.far = originalFar;
  }

  protected checkObjectIntersection(raycaster: Raycaster, objectIndex: number, result: Intersection[]): void {
    if (objectIndex > this.instancesCount || !this.getVisibilityAt(objectIndex)) return;

    this.getMatrixAt(objectIndex, _mesh.matrixWorld);

    _mesh.raycast(raycaster, _intersections);

    for (const intersect of _intersections) {
      intersect.instanceId = objectIndex;
      intersect.object = this;
      result.push(intersect);
    }

    _intersections.length = 0;
  }

  protected frustumCulling(camera: Camera): void {
    const sortObjects = this.sortObjects;
    const perObjectFrustumCulled = this.perObjectFrustumCulled;
    const array = this._indexArray;

    this.instanceIndex._needsUpdate = true; // TODO improve

    if (!perObjectFrustumCulled) {

      this.updateIndexArray();

    } else {

      _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(this.matrixWorld);

      if (sortObjects) {
        _invMatrixWorld.copy(this.matrixWorld).invert();
        _cameraPos.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_invMatrixWorld);
        _forward.set(0, 0, -1).transformDirection(camera.matrixWorld).transformDirection(_invMatrixWorld);
      }

      if (this.bvh) this.BVHCulling();
      else this.linearCulling();
    }

    if (sortObjects) {
      const customSort = this.customSort;

      if (customSort === null) {
        _renderList.list.sort(!(this.material as Material)?.transparent ? sortOpaque : sortTransparent);
      } else {
        customSort(_renderList.list);
      }

      const list = _renderList.list;
      for (let i = 0, l = list.length; i < l; i++) {
        array[i] = list[i].index;
      }

      this._count = list.length;
      _renderList.reset();

    }
  }

  protected updateIndexArray(): void {
    // TODO: recompute only if at least one obj visibility changes or if sort is active
    // TODO: FIX if sorted 

    const array = this._indexArray;
    const instancesCount = this.instancesCount;
    let count = 0;

    for (let i = 0; i < instancesCount; i++) {
      if (!this.getVisibilityAt(i)) continue;
      array[count++] = i;
    }

    this._count = count;
  }

  protected BVHCulling(): void {
    const array = this._indexArray;
    const instancesCount = this.instancesCount;
    const sortObjects = this.sortObjects;
    let count = 0;

    this.bvh.frustumCulling(_projScreenMatrix, (node: BVHNode<{}, number>) => {
      const index = node.object;

      if (index < instancesCount && this.getVisibilityAt(index)) {
        if (sortObjects) {
          _position.setFromMatrixPosition(this.getMatrixAt(index))
          const depth = _position.sub(_cameraPos).dot(_forward); // this can be less precise than sphere.center
          _renderList.push(depth, index);
        } else {
          array[count++] = index;
        }
      }
    });

    this._count = count;
  }

  protected linearCulling(): void {
    const array = this._indexArray;
    const bSphere = this.geometry.boundingSphere;
    const radius = bSphere.radius;
    const center = bSphere.center;
    const instancesCount = this.instancesCount;
    const geometryCentered = center.x === 0 && center.y === 0 && center.z === 0;
    const sortObjects = this.sortObjects;
    let count = 0;

    _frustum.setFromProjectionMatrix(_projScreenMatrix);

    for (let i = 0; i < instancesCount; i++) {
      if (!this.getVisibilityAt(i)) continue;

      const matrix = this.getMatrixAt(i); // we can optimize this a little avoiding copy? what about using instances if available?
      if (geometryCentered) _sphere.center.copy(_position.setFromMatrixPosition(matrix));
      else _sphere.center.copy(center).applyMatrix4(matrix);
      _sphere.radius = radius * matrix.getMaxScaleOnAxis();

      if (_frustum.intersectsSphere(_sphere)) {
        if (sortObjects) {
          const depth = _position.subVectors(_sphere.center, _cameraPos).dot(_forward);
          _renderList.push(depth, i);
        } else {
          array[count++] = i;
        }
      }
    }

    this._count = count;
  }

  public computeBoundingBox(): void { // if bvh present, can override? TODO
    const geometry = this.geometry;
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
    const geometry = this.geometry;
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

    this.instanceIndex.copy(source.instanceIndex);
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
const _frustum = new Frustum();
const _projScreenMatrix = new Matrix4();
const _intersections: Intersection[] = [];
const _mesh = new Mesh();
const _ray = new Ray();
const _direction = new Vector3();
const _worldScale = new Vector3();
const _invMatrixWorld = new Matrix4();
const _renderList = new InstancedRenderList();
const _forward = new Vector3();
const _cameraPos = new Vector3();
const _position = new Vector3();
const _tempMat4 = new Matrix4();
const _tempCol = new Color();
const _tempMesh = new Mesh();
const _instance = new InstancedEntity(undefined, -1);

function ascSortIntersection(a: Intersection, b: Intersection): number {
  return a.distance - b.distance;
}

function sortOpaque(a: InstancedRenderItem, b: InstancedRenderItem) {
  return a.depth - b.depth;
}

function sortTransparent(a: InstancedRenderItem, b: InstancedRenderItem) {
  return b.depth - a.depth;
}
