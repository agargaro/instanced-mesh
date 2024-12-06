import { ShaderChunk } from 'three';
import instanced_pars_vertex from './chunks/instanced_pars_vertex.glsl.js';
import instanced_vertex from './chunks/instanced_vertex.glsl.js';
import instanced_color_pars_fragment from './chunks/instanced_color_pars_fragment.glsl.js';
import instanced_color_fragment from './chunks/instanced_color_fragment.glsl.js';

ShaderChunk['instanced_pars_vertex'] = instanced_pars_vertex;
ShaderChunk['instanced_vertex'] = instanced_vertex;
ShaderChunk['instanced_color_pars_fragment'] = instanced_color_pars_fragment;
ShaderChunk['instanced_color_fragment'] = instanced_color_fragment;

ShaderChunk.project_vertex = ShaderChunk.project_vertex.replace('#ifdef USE_INSTANCING', '#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT');
ShaderChunk.worldpos_vertex = ShaderChunk.worldpos_vertex.replace('#ifdef USE_INSTANCING', '#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT');
ShaderChunk.defaultnormal_vertex = ShaderChunk.defaultnormal_vertex.replace('#ifdef USE_INSTANCING', '#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT');

ShaderChunk.batching_pars_vertex = ShaderChunk.batching_pars_vertex.concat('\n#include <instanced_pars_vertex>');
ShaderChunk['batching_vertex'] = ShaderChunk['batching_vertex'].concat('\n#include <instanced_vertex>');

ShaderChunk.color_pars_fragment = ShaderChunk.color_pars_fragment.concat('\n#include <instanced_color_pars_fragment>');
ShaderChunk.color_fragment = ShaderChunk.color_fragment.concat('\n#include <instanced_color_fragment>');

// FIX don't override like this
ShaderChunk['morphinstance_vertex'] = ShaderChunk['morphinstance_vertex'].replaceAll('gl_InstanceID', 'instanceIndex');

// use 'getPatchedShader' function to make these example works
// examples/jsm/modifiers/CurveModifier.js
// examples/jsm/postprocessing/OutlinePass.js

export function patchShader(shader: string): string {
  return shader.replace('#ifdef USE_INSTANCING', '#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT')
    .replace('#ifdef USE_INSTANCING_COLOR', '#if defined USE_INSTANCING_COLOR || defined USE_INSTANCING_COLOR_INDIRECT')
    .replace('defined( USE_INSTANCING_COLOR )', 'defined( USE_INSTANCING_COLOR ) || defined( USE_INSTANCING_COLOR_INDIRECT )');
}
