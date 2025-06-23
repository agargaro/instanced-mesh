import { WebGLProgramParametersWithUniforms, WebGLRenderer } from 'three';

import { InstancedMesh2 } from '@three.ez/main';


/**
 * @internal
 * Enhances the InstancedMesh2 prototype with WebGL methods.
 */
export function extendInstancedMesh2PrototypeWebGL(): void {
    
  InstancedMesh2.prototype.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer): void => {
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