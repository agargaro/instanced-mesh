export * from './objects/GLInstancedBufferAttribute';
export * from './objects/InstancedEntity';
export * from './objects/InstancedMesh2';
export * from './objects/InstancedMeshBVH';
export * from "./shaders/ShaderChunk";
export * from "./shaders/chunks/instanced_pars_vertex.glsl";
export * from "./shaders/chunks/instanced_vertex.glsl";

declare module 'three/src/materials/Material' {
  export interface Material {
    /** @internal */ isInstancedMeshPatched: boolean;
  }
}
