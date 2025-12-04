/**
 * Shared E2E test utilities
 *
 * Reduces code duplication across test files by providing
 * common setup and helper functions.
 * 
 * Supports both WebGL and WebGPU renderer testing.
 * 
 * IMPORTANT: Each renderer type has its own dedicated test fixture.
 * WebGPU tests use test-scene-webgpu.html and MUST use WebGPU renderer.
 * WebGL tests use test-scene.html and MUST use WebGL renderer.
 * There is NO FALLBACK - if the expected renderer fails, the test fails.
 */

import type { Page } from '@playwright/test';

/**
 * Renderer type for E2E tests
 */
export type E2ERendererType = 'webgl' | 'webgpu';

/**
 * E2E renderer types to test against
 * 
 * Both WebGL and WebGPU are tested. WebGPU is enabled via Chrome launch args
 * in playwright.config.ts.
 * 
 * IMPORTANT: There is NO fallback between renderers!
 * If WebGPU initialization fails, tests FAIL - they don't silently use WebGL.
 * This ensures we catch WebGPU-specific bugs rather than hiding them.
 */
export const E2E_RENDERER_TYPES: E2ERendererType[] = ['webgl', 'webgpu'];

/**
 * Get the test fixture URL for a specific renderer type
 */
export function getTestFixtureUrl(rendererType: E2ERendererType): string {
  switch (rendererType) {
    case 'webgpu':
      return '/tests/fixtures/test-scene-webgpu.html';
    case 'webgl':
    default:
      return '/tests/fixtures/test-scene.html';
  }
}

/**
 * Helper functions to be used inside page.evaluate()
 * These are defined as strings to be injected into the browser context
 */

// Standard geometries and materials setup
export const BROWSER_HELPERS = `
  window.testHelpers = {
    // Create standard geometries
    createGeometries: () => {
      const { BoxGeometry, SphereGeometry } = window.THREE;
      return {
        box: new BoxGeometry(1, 1, 1),
        highSphere: new SphereGeometry(0.5, 32, 32),
        midSphere: new SphereGeometry(0.5, 16, 16)
      };
    },

    // Create standard material
    createMaterial: (color = 0x00ff00) => {
      const { MeshBasicMaterial } = window.THREE;
      return new MeshBasicMaterial({ color });
    },

    // Create InstancedMesh2 with standard options
    createMesh: (geometry, material, capacity = 100) => {
      return new window.InstancedMesh2(geometry, material, {
        capacity,
        renderer: window.renderer
      });
    },

    // Create a LOD-enabled mesh
    createLODMesh: (lodDistance = 50, capacity = 100) => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;

      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const lowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });

      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity,
        renderer: window.renderer
      });

      mesh.addLOD(lowGeometry, material, lodDistance);
      return mesh;
    },

    // Create a 3-level LOD mesh
    createMultiLODMesh: (midDistance = 30, farDistance = 60, capacity = 100) => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;

      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const midGeometry = new SphereGeometry(0.5, 16, 16);
      const lowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });

      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity,
        renderer: window.renderer
      });

      mesh.addLOD(midGeometry, material, midDistance);
      mesh.addLOD(lowGeometry, material, farDistance);
      return mesh;
    },

    // Setup camera at position looking at target
    setupCamera: (position, target = { x: 0, y: 0, z: 0 }, options = {}) => {
      const { fov = 75, near = 0.1, far = 1000 } = options;
      window.camera.position.set(position.x, position.y, position.z);
      window.camera.lookAt(target.x, target.y, target.z);
      if (fov !== undefined) window.camera.fov = fov;
      if (near !== undefined) window.camera.near = near;
      if (far !== undefined) window.camera.far = far;
      window.camera.updateProjectionMatrix();
      window.camera.updateMatrixWorld();
    },

    // Extract LOD info from mesh
    getLODInfo: (mesh, levelCount = 2) => {
      const result = { counts: [], ids: [] };
      for (let i = 0; i < levelCount; i++) {
        const count = mesh.LODinfo.objects[i].count;
        const ids = Array.from(mesh.LODinfo.objects[i].instanceIndex.array.slice(0, count));
        result.counts.push(count);
        result.ids.push(ids);
      }
      return result;
    },

    // Extract rendered instance info from mesh
    getRenderedInfo: (mesh) => {
      const count = mesh.count;
      const ids = Array.from(mesh.instanceIndex.array.slice(0, count));
      return { count, ids };
    },

    // Add mesh to scene and store reference
    addToScene: (mesh) => {
      window.scene.add(mesh);
      window.testMesh = mesh;
      return mesh;
    }
  };
`;

/**
 * Initialize browser helpers in the page
 */
export async function initBrowserHelpers(page: Page): Promise<void> {
  await page.evaluate(BROWSER_HELPERS);
}

/**
 * Common test setup that injects helpers and waits for scene ready
 * @param rendererType - The renderer type to use (webgl or webgpu)
 * @throws If the renderer fails to initialize (no fallback!)
 */
export async function setupTestScene(page: Page, rendererType: E2ERendererType = 'webgl'): Promise<void> {
  const url = getTestFixtureUrl(rendererType);
  await page.goto(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 30000 });
  
  // Check for renderer initialization errors - DO NOT ALLOW SILENT FAILURES!
  await assertRendererInitialized(page, rendererType);
  
  await initBrowserHelpers(page);
}

/**
 * Get the actual renderer type being used
 * NOTE: This should ALWAYS match the expected type - no fallback is allowed!
 */
export async function getActualRendererType(page: Page): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await page.evaluate(() => (window as any).rendererType || 'unknown');
}

/**
 * Assert that the renderer initialized successfully with the expected type.
 * 
 * IMPORTANT: This function FAILS THE TEST if:
 * 1. The renderer encountered an error
 * 2. The actual renderer type doesn't match the expected type
 * 
 * There is NO FALLBACK - WebGPU tests must use WebGPU, WebGL tests must use WebGL.
 * This prevents bugs from being silently hidden when one renderer fails.
 * 
 * @param page - Playwright page object
 * @param expectedType - The renderer type that should be active
 * @throws If renderer failed or wrong type is active
 */
export async function assertRendererInitialized(page: Page, expectedType: E2ERendererType): Promise<void> {
  const result = await page.evaluate(() => {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rendererType: (window as any).rendererType || 'unknown',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rendererError: (window as any).rendererError || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hasRenderer: !!(window as any).renderer
    };
  });

  // Check for initialization error
  if (result.rendererError) {
    throw new Error(
      `${expectedType.toUpperCase()} renderer initialization FAILED: ${result.rendererError}\n` +
      'DO NOT add fallback code - fix the underlying issue instead!'
    );
  }

  // Check renderer type matches expected
  if (result.rendererType === 'error') {
    throw new Error(
      `${expectedType.toUpperCase()} renderer is in error state. Check console for details.`
    );
  }

  if (result.rendererType !== expectedType) {
    throw new Error(
      `Expected ${expectedType} renderer but got ${result.rendererType}.\n` +
      'Each test fixture must use its designated renderer - NO FALLBACK ALLOWED!'
    );
  }

  if (!result.hasRenderer) {
    throw new Error(
      `${expectedType.toUpperCase()} renderer object is null/undefined after initialization.`
    );
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    THREE: unknown;
    InstancedMesh2: unknown;
    renderer: unknown;
    scene: unknown;
    camera: unknown;
    testMesh: unknown;
    sceneReady: boolean;
    rendererType: string;
    createTestMesh: (options?: unknown) => unknown;
    testHelpers: {
      createGeometries: () => unknown;
      createMaterial: (color?: number) => unknown;
      createMesh: (geometry: unknown, material: unknown, capacity?: number) => unknown;
      createLODMesh: (lodDistance?: number, capacity?: number) => unknown;
      createMultiLODMesh: (midDistance?: number, farDistance?: number, capacity?: number) => unknown;
      setupCamera: (position: { x: number; y: number; z: number }, target?: { x: number; y: number; z: number }, options?: unknown) => void;
      getLODInfo: (mesh: unknown, levelCount?: number) => { counts: number[]; ids: number[][] };
      getRenderedInfo: (mesh: unknown) => { count: number; ids: number[] };
      addToScene: (mesh: unknown) => unknown;
    };
  }
}
