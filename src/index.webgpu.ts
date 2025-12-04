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

// Import WebGPU-specific implementations first (order matters for prototype patching)
import './core/InstancedMesh2.webgpu.js'; // WebGPU prototype extensions

// Re-export everything from common (renderer-agnostic code)
export * from './index.common.js';

// Export TSL nodes for advanced usage
export * from './shaders/tsl/nodes.js';

