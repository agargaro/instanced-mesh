import { Box3, BufferGeometry, Camera, DataTexture, DynamicDrawUsage, FloatType, Group, InstancedBufferAttribute, Material, Matrix4, Mesh, RGBAFormat, Scene, Sphere, WebGLProgramParametersWithUniforms, WebGLRenderer } from "three";
import { WebGLTextures } from "three/src/renderers/webgl/WebGLTextures";

export class TBD<T = {}, G extends BufferGeometry = BufferGeometry, M extends Material | Material[] = Material> extends Mesh<G, M> {
  public isInstancedMesh2 = true; // settiiamo i default
  public instanceIndex: InstancedBufferAttribute;
  // public instanceIndex: GLInstancedBufferAttribute;
  public instanceTexture: DataTexture;
  public morphTexture: DataTexture = null;
  public boundingBox: Box3 = null;
  public boundingSphere: Sphere = null;
  protected _count: number;
  protected _maxCount: number;
  protected _material: M;

  // HACK TO MAKE IT WORK WITHOUT UPDATE CORE
  private isInstancedMesh = true; // must be set to use instancing rendering
  private instanceMatrix = new InstancedBufferAttribute(new Float32Array(0), 16); // must be init to avoid exception
  private instanceColor = null; // must be null to avoid exception

  public get count() { return this._count }
  public get maxCount() { return this._maxCount }

  // @ts-ignore
  public override get material() { return this._material }
  public override set material(value: M) {
    this._material = value;
    this.patchMaterials(value);
  }

  public override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
    //
  }

  /** THIS MATERIAL AND GEOMETRY CANNOT BE SHARED */
  constructor(count: number, geometry?: G, material?: M) {
    super(geometry, material);

    this._material = material;
    this._maxCount = count;
    this._count = count;
    this.frustumCulled = false;

    this.initIndixes(undefined);
    this.initMatricesTexture();
  }

  protected initIndixes(renderer: WebGLRenderer): void {
    // const gl = renderer.getContext();
    // const buffer = gl.createBuffer();
    const array = new Uint32Array(this.count);
    // gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // gl.bufferData(gl.ARRAY_BUFFER, array, gl.STREAM_DRAW);

    for (let i = 0; i < this.count; i++) {
      array[i] = i;
    }

    // this.instanceIndex = new GLInstancedBufferAttribute(buffer, gl.UNSIGNED_INT, 1, 4, array.length, array); // UNSIGNED_SHORT usare anche questo se < 65k
    this.instanceIndex = new InstancedBufferAttribute(array, 1); // UNSIGNED_SHORT usare anche questo se < 65k
    this.instanceIndex.setUsage(DynamicDrawUsage);
    this.geometry.setAttribute("instanceIndex", this.instanceIndex);
  }

  protected initMatricesTexture(): void {
    let size = Math.sqrt(this.count * 4); // 4 pixels needed for 1 matrix
    size = Math.ceil(size / 4) * 4;
    size = Math.max(size, 4);

    const matricesArray = new Float32Array(size * size * 4); // 4 floats per RGBA pixel
    this.instanceTexture = new DataTexture(matricesArray, size, size, RGBAFormat, FloatType);
  }

  protected patchMaterials(material: M): void {
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
    const matrixArray = this.instanceTexture.image.data;
    matrix.fromArray(matrixArray, index * 16);
  }

  public setMatrixAt(index: number, matrix: Matrix4): void {
    const matrixArray = this.instanceTexture.image.data;
    matrix.toArray(matrixArray, index * 16);
    this.instanceTexture.needsUpdate = true;
  }

  public computeBoundingBox(): void {
    const geometry = this.geometry;
    const count = this.count;

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
    const count = this.count;

    if (this.boundingSphere === null) this.boundingSphere = new Sphere();

    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();

    this.boundingSphere.makeEmpty();

    for (let i = 0; i < count; i++) {
      this.getMatrixAt(i, _instanceLocalMatrix);
      _sphere.copy(geometry.boundingSphere).applyMatrix4(_instanceLocalMatrix);
      this.boundingSphere.union(_sphere);
    }
  }

}

const _instanceLocalMatrix = new Matrix4();
const _box3 = new Box3();
const _sphere = new Sphere();
let textures: WebGLTextures;
