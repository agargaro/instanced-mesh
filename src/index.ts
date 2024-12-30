import { type InstancedMesh2 } from './core/InstancedMesh2.js';

export * from './core/InstancedEntity.js';
export * from './core/InstancedMesh2.js';
export * from './core/InstancedMeshBVH.js';
export * from './core/feature/Capacity.js';
export * from './core/feature/FrustumCulling.js';
export * from './core/feature/Instances.js';
export * from './core/feature/LOD.js';
export * from './core/feature/Raycasting.js';
export * from './core/feature/Uniforms.js';
export * from './core/utils/GLInstancedBufferAttribute.js';
export * from './core/utils/InstancedRenderList.js';

export * from './shaders/ShaderChunk.js';
export * from './shaders/chunks/instanced_pars_vertex.glsl.js';
export * from './shaders/chunks/instanced_color_pars_vertex.glsl.js';
export * from './shaders/chunks/instanced_vertex.glsl.js';
export * from './shaders/chunks/instanced_color_vertex.glsl.js';

export * from './utils/SortingUtils.js';

/** @internal */
declare module 'three' {
  export interface Material {
    ez_patchOwner: InstancedMesh2;
  }
}
