/**
 * Test setup utilities for @three.ez/instanced-mesh
 *
 * Provides helpers to create InstancedMesh2 instances for testing
 * without requiring a full WebGL context.
 */

import { BoxGeometry, ColorManagement, MeshBasicMaterial, WebGLRenderer } from 'three';
import { InstancedMesh2 } from '../src/core/InstancedMesh2';
import { SquareDataTexture } from '../src/core/utils/SquareDataTexture';

// Import feature modules to ensure prototype extensions are applied
import '../src/core/feature/Capacity';
import '../src/core/feature/Instances';
import '../src/core/feature/FrustumCulling';
import '../src/core/feature/LOD';
import '../src/core/feature/Raycasting';

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
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    bufferSubData: () => {},
    deleteBuffer: () => {},
    pixelStorei: () => {},
    bindTexture: () => {},
    texSubImage2D: () => {},
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
      get: () => ({ __webglTexture: {} }),
    },
    state: {
      bindTexture: () => {},
    },
    extensions: {},
    capabilities: {},
  } as unknown as WebGLRenderer;
}

/**
 * Creates an InstancedMesh2 configured for testing
 */
export function createTestInstancedMesh(options: {
  capacity?: number;
  createEntities?: boolean;
  allowsEuler?: boolean;
} = {}): InstancedMesh2 {
  const { capacity = 100, createEntities = false, allowsEuler = false } = options;

  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshBasicMaterial({ color: 0xff0000 });
  const renderer = createMockRenderer();

  const mesh = new InstancedMesh2(geometry, material, {
    capacity,
    createEntities,
    allowsEuler,
    renderer,
  });

  // Initialize matrices texture for testing
  if (!mesh.matricesTexture) {
    mesh.matricesTexture = new SquareDataTexture(Float32Array, 4, 4, capacity);
  }

  // Setup initColorsTexture method for testing
  mesh.initColorsTexture = function() {
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
export function createTestInstancedMeshWithEntities(capacity = 100): InstancedMesh2 {
  return createTestInstancedMesh({ capacity, createEntities: true });
}

