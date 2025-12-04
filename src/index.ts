/**
 * @three.ez/instanced-mesh - Main Entry Point (WebGL by default)
 *
 * This is the default entry point providing full WebGL support for backwards compatibility.
 *
 * For WebGPU support, import from:
 * - '@three.ez/instanced-mesh/webgpu' for WebGPURenderer
 *
 * For renderer-agnostic code (no shader patching), import from:
 * - '@three.ez/instanced-mesh/common'
 */

// Re-export everything from WebGL entry point for backwards compatibility
export * from './index.webgl.js';
