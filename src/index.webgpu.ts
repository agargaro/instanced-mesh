/**
 * @three.ez/instanced-mesh - WebGPU Entry Point
 *
 * This entry point includes all WebGPU-specific functionality:
 * - TSL (Three.js Shading Language) nodes for material customization
 * - Standard InstancedBufferAttribute with dynamic updates
 * - No GLSL shader modifications (uses TSL instead)
 *
 * Usage:
 * ```typescript
 * import { InstancedMesh2 } from '@three.ez/instanced-mesh/webgpu';
 * ```
 */

// Re-export everything from common FIRST (defines prototype methods like addLevel)
export * from './index.common.js';

// Import WebGPU-specific implementations AFTER common (overrides prototype methods)
import './core/InstancedMesh2.webgpu.js'; // WebGPU prototype extensions

// Export TSL nodes for advanced usage
export * from './shaders/tsl/nodes.js';

