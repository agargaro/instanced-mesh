/**
 * WebGL-specific prototype extensions for InstancedMesh2.
 * This file adds WebGL-specific rendering methods using Material.onBeforeCompile
 * and GLInstancedBufferAttribute for efficient buffer updates.
 */

import { BufferAttribute, BufferGeometry, Camera, Material, Scene, WebGLProgramParametersWithUniforms, WebGLRenderer } from 'three';
import { InstancedMesh2, InstanceIndexAttribute } from './InstancedMesh2.js';
import { GLInstancedBufferAttribute } from './utils/GLInstancedBufferAttribute.js';
import { patchProperties, unpatchProperties } from './utils/PropertiesOverride.js';

// Extend InstancedMesh2 prototype with WebGL-specific properties
declare module './InstancedMesh2.js' {
  interface InstancedMesh2 {
    /** @internal WebGL-specific */ _customProgramCacheKeyBase: () => string;
    /** @internal WebGL-specific */ _onBeforeCompileBase: (parameters: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer) => void;
    /** @internal WebGL-specific */ _definesBase: { [key: string]: any };
  }
}

// Store original methods for WebGL-specific implementations
const _customProgramCacheKeyBase = new WeakMap<InstancedMesh2, () => string>();
const _onBeforeCompileBase = new WeakMap<InstancedMesh2, (parameters: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer) => void>();
const _definesBase = new WeakMap<InstancedMesh2, { [key: string]: any }>();

/**
 * WebGL-specific implementation of initIndexAttribute using GLInstancedBufferAttribute
 */
InstancedMesh2.prototype.initIndexAttribute = function (this: InstancedMesh2): void {
  const renderer = this._renderer as WebGLRenderer;
  if (!renderer) {
    this.count = 0;
    return;
  }

  const gl = renderer.getContext() as WebGL2RenderingContext;
  const capacity = this._capacity;
  const array = new Uint32Array(capacity);

  for (let i = 0; i < capacity; i++) {
    array[i] = i;
  }

  this.instanceIndex = new GLInstancedBufferAttribute(gl, gl.UNSIGNED_INT, 1, 4, array) as unknown as InstanceIndexAttribute;
  this._geometry.setAttribute('instanceIndex', this.instanceIndex as unknown as BufferAttribute);
};

/**
 * WebGL-specific onBeforeShadow implementation
 */
InstancedMesh2.prototype.onBeforeShadow = function (
  this: InstancedMesh2,
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  shadowCamera: Camera,
  geometry: BufferGeometry,
  depthMaterial: Material,
  group: any
): void {
  patchMaterial(this, renderer, depthMaterial);
  updateTextures(this, renderer, depthMaterial);

  const frame = renderer.info.render.frame;
  if (this.instanceIndex && this.autoUpdate && !this.frustumCullingAlreadyPerformed(frame, camera, shadowCamera)) {
    this.performFrustumCulling(shadowCamera, camera);
  }

  if (this.count === 0) return;

  const instanceIndex = this.instanceIndex as unknown as GLInstancedBufferAttribute;
  instanceIndex.update(renderer, this.count);
  bindTextures(this, renderer, depthMaterial);
};

/**
 * WebGL-specific onBeforeRender implementation
 */
InstancedMesh2.prototype.onBeforeRender = function (
  this: InstancedMesh2,
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  geometry: BufferGeometry,
  material: Material,
  group: any
): void {
  patchMaterial(this, renderer, material);
  updateTextures(this, renderer, material);

  if (!this.instanceIndex) {
    this._renderer = renderer;
    return;
  }

  const frame = renderer.info.render.frame;
  if (this.autoUpdate && !this.frustumCullingAlreadyPerformed(frame, camera, null)) {
    this.performFrustumCulling(camera);
  }

  if (this.count === 0) return;

  const instanceIndex = this.instanceIndex as unknown as GLInstancedBufferAttribute;
  instanceIndex.update(renderer, this.count);
  bindTextures(this, renderer, material);
};

/**
 * WebGL-specific onAfterShadow implementation
 */
InstancedMesh2.prototype.onAfterShadow = function (
  this: InstancedMesh2,
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  shadowCamera: Camera,
  geometry: BufferGeometry,
  depthMaterial: Material,
  group: any
): void {
  unpatchMaterial(this, renderer, depthMaterial);
};

/**
 * WebGL-specific onAfterRender implementation
 */
InstancedMesh2.prototype.onAfterRender = function (
  this: InstancedMesh2,
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  geometry: BufferGeometry,
  material: Material,
  group: any
): void {
  unpatchMaterial(this, renderer, material);
  if (this.instanceIndex || (group && !this.isLastGroup(group.materialIndex))) return;
  this.initIndexAttribute();
};

// Helper functions for WebGL material patching

function customProgramCacheKey(mesh: InstancedMesh2): string {
  const base = _customProgramCacheKeyBase.get(mesh);
  return `ez_${!!mesh.colorsTexture}_${mesh._useOpacity}_${!!mesh.boneTexture}_${!!mesh.uniformsTexture}_${base?.call(mesh._currentMaterial) ?? ''}`;
}

function onBeforeCompile(mesh: InstancedMesh2, shader: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer): void {
  const base = _onBeforeCompileBase.get(mesh);
  if (base) base.call(mesh._currentMaterial, shader, renderer);

  shader.defines = { ...shader.defines };
  shader.defines['USE_INSTANCING_INDIRECT'] = '';

  shader.uniforms.matricesTexture = { value: mesh.matricesTexture };

  if (mesh.uniformsTexture) {
    shader.uniforms.uniformsTexture = { value: mesh.uniformsTexture };
    const { vertex, fragment } = mesh.uniformsTexture.getUniformsGLSL('uniformsTexture', 'instanceIndex', 'uint');
    shader.vertexShader = shader.vertexShader.replace('void main() {', vertex);
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', fragment);
  }

  if (mesh.colorsTexture && shader.fragmentShader.includes('#include <color_pars_fragment>')) {
    shader.defines['USE_INSTANCING_COLOR_INDIRECT'] = '';
    shader.uniforms.colorsTexture = { value: mesh.colorsTexture };
    shader.vertexShader = shader.vertexShader.replace('<color_vertex>', '<instanced_color_vertex>');

    if (shader.vertexColors) {
      shader.defines['USE_VERTEX_COLOR'] = '';
    }

    if (mesh._useOpacity) {
      shader.defines['USE_COLOR_ALPHA'] = '';
    } else {
      shader.defines['USE_COLOR'] = '';
    }
  }

  if (mesh.boneTexture) {
    shader.defines['USE_SKINNING'] = '';
    shader.defines['USE_INSTANCING_SKINNING'] = '';
    shader.uniforms.bindMatrix = { value: mesh.bindMatrix };
    shader.uniforms.bindMatrixInverse = { value: mesh.bindMatrixInverse };
    shader.uniforms.bonesPerInstance = { value: mesh.skeleton.bones.length };
    shader.uniforms.boneTexture = { value: mesh.boneTexture };
  }
}

function patchMaterial(mesh: InstancedMesh2, renderer: WebGLRenderer, material: Material): void {
  mesh._currentMaterial = material;
  _customProgramCacheKeyBase.set(mesh, material.customProgramCacheKey);
  _onBeforeCompileBase.set(mesh, material.onBeforeCompile);
  _definesBase.set(mesh, material.defines);

  material.customProgramCacheKey = () => customProgramCacheKey(mesh);
  material.onBeforeCompile = (shader, r) => onBeforeCompile(mesh, shader, r);
  patchProperties(mesh, renderer, material);
}

function unpatchMaterial(mesh: InstancedMesh2, renderer: WebGLRenderer, material: Material): void {
  mesh._currentMaterial = null;
  unpatchProperties(renderer);

  const definesBase = _definesBase.get(mesh);
  const onBeforeCompileBase = _onBeforeCompileBase.get(mesh);
  const customProgramCacheKeyBase = _customProgramCacheKeyBase.get(mesh);

  material.defines = definesBase;
  material.onBeforeCompile = onBeforeCompileBase;
  material.customProgramCacheKey = customProgramCacheKeyBase;

  _onBeforeCompileBase.delete(mesh);
  _customProgramCacheKeyBase.delete(mesh);
  _definesBase.delete(mesh);
}

function updateTextures(mesh: InstancedMesh2, renderer: WebGLRenderer, material: Material): void {
  const materialProperties = renderer.properties.get(material) as any;

  mesh.matricesTexture.update(renderer, materialProperties, 'matricesTexture');
  mesh.colorsTexture?.update(renderer, materialProperties, 'colorsTexture');
  mesh.uniformsTexture?.update(renderer, materialProperties, 'uniformsTexture');
  mesh.boneTexture?.update(renderer, materialProperties, 'boneTexture');
}

function bindTextures(mesh: InstancedMesh2, renderer: WebGLRenderer, material: Material): void {
  const materialProperties = renderer.properties.get(material) as any;
  const materialUniforms = materialProperties.uniforms;
  if (!materialUniforms) return;

  const currentProgramProperties = materialProperties.currentProgram;
  const currentProgram = currentProgramProperties?.program;
  if (!currentProgram) return;

  const gl = renderer.getContext() as WebGL2RenderingContext;
  const programUniforms = currentProgramProperties.getUniforms().map;

  const activeProgram = gl.getParameter(gl.CURRENT_PROGRAM);
  renderer.state.useProgram(currentProgram);

  mesh.matricesTexture.bindToProgram(renderer, gl, programUniforms, materialUniforms, 'matricesTexture');
  mesh.colorsTexture?.bindToProgram(renderer, gl, programUniforms, materialUniforms, 'colorsTexture');
  mesh.uniformsTexture?.bindToProgram(renderer, gl, programUniforms, materialUniforms, 'uniformsTexture');
  mesh.boneTexture?.bindToProgram(renderer, gl, programUniforms, materialUniforms, 'boneTexture');

  renderer.state.useProgram(activeProgram);
}
