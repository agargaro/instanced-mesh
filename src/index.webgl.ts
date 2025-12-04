/**
 * @three.ez/instanced-mesh - WebGL Entry Point
 *
 * This entry point includes all WebGL-specific functionality:
 * - GLInstancedBufferAttribute for efficient buffer updates
 * - Material patching via onBeforeCompile
 * - GLSL shader chunk modifications
 *
 * Usage:
 * ```typescript
 * import { InstancedMesh2 } from '@three.ez/instanced-mesh/webgl';
 * ```
 */

// Import WebGL-specific implementations first (order matters for prototype patching)
import './shaders/ShaderChunk.js'; // Patches GLSL chunks
import './core/InstancedMesh2.webgl.js'; // WebGL prototype extensions

// Re-export everything from common (renderer-agnostic code)
export * from './index.common.js';

// Export WebGL-specific utilities
export * from './core/utils/GLInstancedBufferAttribute.js';
export * from './core/utils/PropertiesOverride.js';

// Export GLSL shader chunks
export * from './shaders/ShaderChunk.js';
export * from './shaders/chunks/instanced_color_pars_vertex.glsl';
export * from './shaders/chunks/instanced_color_vertex.glsl';
export * from './shaders/chunks/instanced_pars_vertex.glsl';
export * from './shaders/chunks/instanced_skinning_pars_vertex.glsl';
export * from './shaders/chunks/instanced_vertex.glsl';

