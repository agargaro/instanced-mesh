export * from "./shaders/ShaderChunk";
export * from './objects/InstancedMesh2';
export * from './core/GLInstancedBufferAttribute';

declare module 'three/src/materials/Material' {
  export interface Material {
    isInstancedMeshPatched: boolean;
  }
}
