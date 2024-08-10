import { ShaderChunk } from "three";
import get_from_texture from "./chunks/get_from_texture.glsl.js";
import instanced_pars_vertex from "./chunks/instanced_pars_vertex.glsl.js";
import instanced_vertex from "./chunks/instanced_vertex.glsl.js";

ShaderChunk["get_from_texture"] = get_from_texture;
ShaderChunk["instanced_pars_vertex"] = instanced_pars_vertex;
ShaderChunk["instanced_vertex"] = instanced_vertex;

ShaderChunk.project_vertex = ShaderChunk.project_vertex.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");
ShaderChunk.worldpos_vertex = ShaderChunk.worldpos_vertex.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");
ShaderChunk.defaultnormal_vertex = ShaderChunk.defaultnormal_vertex.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");

ShaderChunk.color_pars_vertex = ShaderChunk.color_pars_vertex.replace("defined( USE_INSTANCING_COLOR )", "defined( USE_INSTANCING_COLOR ) || defined( USE_INSTANCING_COLOR_INDIRECT )");
ShaderChunk.color_vertex = ShaderChunk.color_vertex.replace("defined( USE_INSTANCING_COLOR )", "defined( USE_INSTANCING_COLOR ) || defined( USE_INSTANCING_COLOR_INDIRECT )");

ShaderChunk.common = ShaderChunk.common.concat("\n#include <get_from_texture>");
ShaderChunk.batching_pars_vertex = ShaderChunk.batching_pars_vertex.concat("\n#include <instanced_pars_vertex>");
ShaderChunk["batching_vertex"] = ShaderChunk["batching_vertex"].concat("\n#include <instanced_vertex>"); // TODO fix d.ts

// use 'getPatchedShader' function to make these example works
// examples/jsm/modifiers/CurveModifier.js
// examples/jsm/postprocessing/OutlinePass.js

export function patchShader(shader: string): string {
    return shader.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT")
        .replace("#ifdef USE_INSTANCING_COLOR", "#if defined USE_INSTANCING_COLOR || defined USE_INSTANCING_COLOR_INDIRECT")
        .replace("defined( USE_INSTANCING_COLOR )", "defined( USE_INSTANCING_COLOR ) || defined( USE_INSTANCING_COLOR_INDIRECT )");
}
