import { ShaderChunk } from "three";
import instanced_pars_vertex from "./chunks/instanced_pars_vertex.glsl";
import instanced_vertex from "./chunks/instanced_vertex.glsl";
import get_from_texture from "./chunks/get_from_texture.glsl";

ShaderChunk.common = ShaderChunk.common.concat(get_from_texture);
ShaderChunk["get_from_texture"] = get_from_texture;
ShaderChunk["instanced_vertex"] = instanced_vertex;
ShaderChunk["instanced_pars_vertex"] = instanced_pars_vertex;

// TODO move it
export function getPatchedShader(shader: string): string {
    return shader.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");
}

ShaderChunk.project_vertex = ShaderChunk.project_vertex.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");
ShaderChunk.worldpos_vertex = ShaderChunk.worldpos_vertex.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");
ShaderChunk.defaultnormal_vertex = ShaderChunk.defaultnormal_vertex.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");

// use 'getPatchedShader' function to make these example works
// examples/jsm/modifiers/CurveModifier.js
// examples/jsm/postprocessing/OutlinePass.js
