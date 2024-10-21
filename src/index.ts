export * from './objects/InstancedEntity.js';
export * from './objects/InstancedMesh2.js';
export * from './objects/InstancedMeshBVH.js';
export * from './objects/InstancedRenderList.js';
export * from './shaders/ShaderChunk.js';
export * from './shaders/chunks/get_from_texture.glsl.js';
export * from './shaders/chunks/instanced_pars_vertex.glsl.js';
export * from './shaders/chunks/instanced_vertex.glsl.js';
export * from './utils/createTexture.js';
export * from './utils/createRadixSort.js';
export * from './objects/InstancedMeshLOD.js';

/** @internal */ 
declare module 'three' {
  export interface Material {
    isInstancedMeshPatched: boolean;
  }
}
