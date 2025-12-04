/**
 * Test setup utilities for @three.ez/instanced-mesh
 *
 * Provides helpers to create InstancedMesh2 instances for testing
 * without requiring a full WebGL or WebGPU context.
 */

import { describe } from 'vitest';
import { BoxGeometry, ColorManagement, MeshBasicMaterial, WebGLRenderer } from 'three';
import { InstancedMesh2 } from '../src/core/InstancedMesh2.js';
import { SquareDataTexture } from '../src/core/utils/SquareDataTexture.js';

// Import feature modules to ensure prototype extensions are applied
import '../src/core/feature/Capacity';
import '../src/core/feature/Instances';
import '../src/core/feature/FrustumCulling';
import '../src/core/feature/LOD';
import '../src/core/feature/Raycasting';

/**
 * Renderer type for testing
 */
export type RendererType = 'webgl' | 'webgpu';

/**
 * Creates a mock WebGL2 rendering context for testing
 */
export function createMockGL(): WebGL2RenderingContext {
  return {
    UNSIGNED_INT: 5125,
    TEXTURE_2D: 3553,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    DYNAMIC_DRAW: 35048,
    NONE: 0,
    BROWSER_DEFAULT_WEBGL: 37444,
    UNPACK_FLIP_Y_WEBGL: 37440,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441,
    UNPACK_ALIGNMENT: 3317,
    UNPACK_COLORSPACE_CONVERSION_WEBGL: 37443,
    CURRENT_PROGRAM: 35725,
    TEXTURE0: 33984,
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    bufferSubData: () => {},
    deleteBuffer: () => {},
    pixelStorei: () => {},
    bindTexture: () => {},
    texSubImage2D: () => {},
    getParameter: () => null
  } as unknown as WebGL2RenderingContext;
}

/**
 * Creates a mock WebGLRenderer for testing
 */
export function createMockRenderer(): WebGLRenderer {
  const gl = createMockGL();

  return {
    getContext: () => gl,
    properties: {
      get: () => ({ __webglTexture: {} })
    },
    state: {
      bindTexture: () => {},
      useProgram: () => {},
      activeTexture: () => {}
    },
    extensions: {},
    capabilities: {
      maxTextures: 16
    },
    info: {
      render: { frame: 0 }
    },
    initTexture: () => {}
  } as unknown as WebGLRenderer;
}

/**
 * Mock WebGPU device interface for testing
 */
interface MockGPUDevice {
  queue: {
    writeBuffer: () => void;
  };
}

/**
 * Mock WebGPU renderer interface for testing
 */
interface MockWebGPURenderer {
  backend?: {
    device?: MockGPUDevice;
  };
  info: {
    render: { frame: number };
  };
  render: () => void;
  setSize: () => void;
  setPixelRatio: () => void;
  domElement: HTMLCanvasElement | null;
  shadowMap: unknown;
  debug: unknown;
  setAnimationLoop: () => void;
  getRenderTarget: () => null;
  setRenderTarget: () => void;
  clear: () => void;
  clearColor: () => void;
  clearDepth: () => void;
  clearStencil: () => void;
  dispose: () => void;
}

/**
 * Creates a mock WebGPURenderer for testing
 */
export function createMockWebGPURenderer(): MockWebGPURenderer {
  return {
    backend: {
      device: {
        queue: {
          writeBuffer: () => {}
        }
      }
    },
    info: {
      render: { frame: 0 }
    },
    render: () => {},
    setSize: () => {},
    setPixelRatio: () => {},
    // Additional Renderer interface requirements
    domElement: null as unknown as HTMLCanvasElement,
    shadowMap: {} as unknown,
    debug: {} as unknown,
    setAnimationLoop: () => {},
    getRenderTarget: () => null,
    setRenderTarget: () => {},
    clear: () => {},
    clearColor: () => {},
    clearDepth: () => {},
    clearStencil: () => {},
    dispose: () => {}
  } as unknown as MockWebGPURenderer;
}

/**
 * Options for creating test instanced mesh
 */
export interface TestInstancedMeshOptions {
  capacity?: number;
  createEntities?: boolean;
  allowsEuler?: boolean;
  rendererType?: RendererType;
}

/**
 * Creates an InstancedMesh2 configured for testing
 * @param options - Configuration options
 * @param options.capacity - Maximum instance capacity (default: 100)
 * @param options.createEntities - Whether to create entity instances (default: false)
 * @param options.allowsEuler - Whether to allow Euler rotation (default: false)
 * @param options.rendererType - Type of renderer to mock: 'webgl' or 'webgpu' (default: 'webgl')
 */
export function createTestInstancedMesh(options: TestInstancedMeshOptions = {}): InstancedMesh2 {
  const {
    capacity = 100,
    createEntities = false,
    allowsEuler = false,
    rendererType = 'webgl'
  } = options;

  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({ color: 0xff0000 });

  // Create appropriate mock renderer based on type
  const renderer = rendererType === 'webgpu'
    ? createMockWebGPURenderer()
    : createMockRenderer();

  const mesh = new InstancedMesh2(geometry, material, {
    capacity,
    createEntities,
    allowsEuler,
    renderer
  });

  // Initialize matrices texture for testing
  if (!mesh.matricesTexture) {
    mesh.matricesTexture = new SquareDataTexture(Float32Array, 4, 4, capacity);
  }

  // Setup initColorsTexture method for testing (works for both renderers)
  mesh.initColorsTexture = function () {
    if (!this.colorsTexture) {
      this.colorsTexture = new SquareDataTexture(Float32Array, 4, 1, this._capacity);
      this.colorsTexture.colorSpace = ColorManagement.workingColorSpace;
      this.colorsTexture._data.fill(1);
    }
  };

  return mesh;
}

/**
 * Creates an InstancedMesh2 with entities enabled for testing
 */
export function createTestInstancedMeshWithEntities(capacity = 100, rendererType: RendererType = 'webgl'): InstancedMesh2 {
  return createTestInstancedMesh({ capacity, createEntities: true, rendererType });
}

/**
 * Detects if the current environment supports WebGPU
 * (for use in determining which tests to run)
 */
export function isWebGPUSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'gpu' in navigator;
}

/**
 * Renderer types to test against
 */
export const RENDERER_TYPES: RendererType[] = ['webgl', 'webgpu'];

/**
 * Helper to create describe blocks for each renderer type
 * This enables parameterized testing across both WebGL and WebGPU
 */
export function describeForEachRenderer(
  name: string,
  fn: (rendererType: RendererType, createMesh: (options?: Omit<TestInstancedMeshOptions, 'rendererType'>) => InstancedMesh2) => void
): void {
  for (const rendererType of RENDERER_TYPES) {
    describe(`[${rendererType.toUpperCase()}] ${name}`, () => {
      const createMesh = (options: Omit<TestInstancedMeshOptions, 'rendererType'> = {}): InstancedMesh2 =>
        createTestInstancedMesh({ ...options, rendererType });
      fn(rendererType, createMesh);
    });
  }
}
