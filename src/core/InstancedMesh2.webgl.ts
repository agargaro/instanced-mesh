import { ColorManagement, WebGLProgramParametersWithUniforms, WebGLRenderer } from 'three';

import { InstancedMesh2 } from '../core/InstancedMesh2.common.js';
import { SquareDataTexture } from './utils/SquareDataTexture.js';


/**
 * @internal
 * Enhances the InstancedMesh2 prototype with WebGL methods.
 */
export function extendInstancedMesh2PrototypeWebGL(): void {
  // WebGL-specific member initialization
  InstancedMesh2.prototype.matricesTexture = null;
  InstancedMesh2.prototype.colorsTexture = null;
  InstancedMesh2.prototype.boneTexture = null;
  InstancedMesh2.prototype.uniformsTexture = null;
  InstancedMesh2.prototype._renderer = null;
  // instanceMatrix is already initialized in .common, but can be overridden if needed

  InstancedMesh2.prototype.init = function(): void {
    this.initMatricesTexture();
    this.initColorsTexture();
    // Ensure textures are updated before first render
    this.matricesTexture.update(this._renderer);
    this.colorsTexture?.update(this._renderer);
  };

  InstancedMesh2.prototype.initMatricesTexture = function(): void {
    if (!this._parentLOD) {
      // Only initialize if not already set
      if (!this.matricesTexture) {
        this.matricesTexture = new SquareDataTexture(Float32Array, 4, 4, this._capacity);
      }
    }
  };

  InstancedMesh2.prototype.initColorsTexture = function(): void {
    if (!this._parentLOD) {
      if (!this.colorsTexture) {
        this.colorsTexture = new SquareDataTexture(Float32Array, 4, 1, this._capacity);
        this.colorsTexture.colorSpace = ColorManagement.workingColorSpace;
        this.colorsTexture._data.fill(1);
        this.materialsNeedsUpdate();
      }
    }
  };

  InstancedMesh2.prototype.onBeforeCompile = function(shader: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer): void {
    if (this._onBeforeCompileBase) this._onBeforeCompileBase.call(this._currentMaterial, shader, renderer);

    shader.instancing = false;

    shader.defines ??= {};
    shader.defines['USE_INSTANCING_INDIRECT'] = '';

    shader.uniforms.matricesTexture = { value: this.matricesTexture };

    if (this.uniformsTexture) {
      shader.uniforms.uniformsTexture = { value: this.uniformsTexture };
      const { vertex, fragment } = this.uniformsTexture.getUniformsGLSL('uniformsTexture', 'instanceIndex', 'uint');
      shader.vertexShader = shader.vertexShader.replace('void main() {', vertex);
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', fragment);
    }

    if (this.colorsTexture && shader.fragmentShader.includes('#include <color_pars_fragment>')) {
      shader.defines['USE_INSTANCING_COLOR_INDIRECT'] = '';
      shader.uniforms.colorsTexture = { value: this.colorsTexture };
      shader.vertexShader = shader.vertexShader.replace('<color_vertex>', '<instanced_color_vertex>');

      if (shader.vertexColors) {
        shader.defines['USE_VERTEX_COLOR'] = '';
      }

      if (this._useOpacity) {
        shader.defines['USE_COLOR_ALPHA'] = '';
      } else {
        shader.defines['USE_COLOR'] = '';
      }
    }

    if (this.boneTexture) {
      shader.defines['USE_SKINNING'] = '';
      shader.defines['USE_INSTANCING_SKINNING'] = '';
      shader.uniforms.bindMatrix = { value: this.bindMatrix };
      shader.uniforms.bindMatrixInverse = { value: this.bindMatrixInverse };
      shader.uniforms.bonesPerInstance = { value: this.skeleton.bones.length };
      shader.uniforms.boneTexture = { value: this.boneTexture };
    }
  };
}