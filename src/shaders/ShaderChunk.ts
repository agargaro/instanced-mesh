import { ShaderChunk } from "three";
import instanced_pars_vertex from "./chunks/instanced_pars_vertex.glsl";
import instanced_vertex from "./chunks/instanced_vertex.glsl";

ShaderChunk["instanced_vertex"] = instanced_vertex;
ShaderChunk["instanced_pars_vertex"] = instanced_pars_vertex;

ShaderChunk.project_vertex = ShaderChunk.project_vertex.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");
ShaderChunk.worldpos_vertex = ShaderChunk.worldpos_vertex.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");
ShaderChunk.defaultnormal_vertex = ShaderChunk.worldpos_vertex.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");

// examples/jsm/modifiers/CurveModifier.js
// examples/jsm/postprocessing/OutlinePass.js
