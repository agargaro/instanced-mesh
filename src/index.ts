export * from './core/InstancedEntity.js';
export * from './core/InstancedMesh2.js';
export * from './core/InstancedMeshBVH.js';
export * from './core/feature/FrustumCulling.js';
export * from './core/feature/Raycasting.js';
export * from './core/utils/GLInstancedBufferAttribute.js';
export * from './core/utils/InstancedRenderList.js';

export * from './shaders/ShaderChunk.js';
export * from './shaders/chunks/get_from_texture.glsl.js';
export * from './shaders/chunks/instanced_pars_vertex.glsl.js';
export * from './shaders/chunks/instanced_vertex.glsl.js';

export * from './utils/CreateTexture.js';
export * from './utils/MatrixUtils.js';
export * from './utils/SortingUtils.js';

/** @internal */ 
declare module 'three' {
  export interface Material {
    isInstancedMeshPatched: boolean;
  }
}
