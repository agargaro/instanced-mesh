/**
 * @three.ez/instanced-mesh - Common/Base exports (renderer-agnostic)
 *
 * This entry point provides only the renderer-agnostic code without any
 * shader patching or renderer-specific prototype extensions.
 *
 * For full functionality, import from:
 * - '@three.ez/instanced-mesh' or '@three.ez/instanced-mesh/webgl' for WebGLRenderer
 * - '@three.ez/instanced-mesh/webgpu' for WebGPURenderer
 */

export * from './core/InstancedEntity.js';
export * from './core/InstancedMesh2.js';
export * from './core/InstancedMeshBVH.js';

export * from './core/feature/Capacity.js';
export * from './core/feature/FrustumCulling.js';
export * from './core/feature/Instances.js';
export * from './core/feature/LOD.js';
export * from './core/feature/Morph.js';
export * from './core/feature/Raycasting.js';
export * from './core/feature/Skeleton.js';
export * from './core/feature/Uniforms.js';

export * from './core/utils/InstancedRenderList.js';
export * from './core/utils/SquareDataTexture.js';

export * from './utils/SortingUtils.js';
export * from './utils/CreateFrom.js';


