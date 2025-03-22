import { ShaderChunk } from 'three';
import instanced_pars_vertex from './chunks/instanced_pars_vertex.glsl.js';
import instanced_color_pars_vertex from './chunks/instanced_color_pars_vertex.glsl.js';
import instanced_vertex from './chunks/instanced_vertex.glsl.js';
import instanced_color_vertex from './chunks/instanced_color_vertex.glsl.js';
import instanced_skinning_pars_vertex from './chunks/instanced_skinning_pars_vertex.glsl.js';

ShaderChunk['instanced_pars_vertex'] = instanced_pars_vertex;
ShaderChunk['instanced_color_pars_vertex'] = instanced_color_pars_vertex;
ShaderChunk['instanced_vertex'] = instanced_vertex;
ShaderChunk['instanced_color_vertex'] = instanced_color_vertex;

/**
 * Patches the given shader string by adding a condition for indirect instancing support.
 * @param shader The shader code to modify.
 * @returns The modified shader code with the additional instancing condition.
 */
export function patchShader(shader: string): string {
  return shader.replace('#ifdef USE_INSTANCING', '#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT');
}

ShaderChunk.project_vertex = patchShader(ShaderChunk.project_vertex);
ShaderChunk.worldpos_vertex = patchShader(ShaderChunk.worldpos_vertex);
ShaderChunk.defaultnormal_vertex = patchShader(ShaderChunk.defaultnormal_vertex);

ShaderChunk.batching_pars_vertex = ShaderChunk.batching_pars_vertex.concat('\n#include <instanced_pars_vertex>');
ShaderChunk.color_pars_vertex = ShaderChunk.color_pars_vertex.concat('\n#include <instanced_color_pars_vertex>');
ShaderChunk['batching_vertex'] = ShaderChunk['batching_vertex'].concat('\n#include <instanced_vertex>');

ShaderChunk.skinning_pars_vertex = instanced_skinning_pars_vertex;

// TODO FIX don't override like this, create a new shaderChunk to make it works also with older three.js version
if (ShaderChunk['morphinstance_vertex']) {
  ShaderChunk['morphinstance_vertex'] = ShaderChunk['morphinstance_vertex'].replaceAll('gl_InstanceID', 'instanceIndex');
}

// use 'getPatchedShader' function to make these example works
// examples/jsm/modifiers/CurveModifier.js
// examples/jsm/postprocessing/OutlinePass.js
