/**
 * Shared E2E test utilities
 *
 * Reduces code duplication across test files by providing
 * common setup and helper functions.
 */

import type { Page } from '@playwright/test';

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
 */
export async function setupTestScene(page: Page): Promise<void> {
  await page.goto('/tests/fixtures/test-scene.html');
  await page.waitForFunction(() => window.sceneReady === true);
  await initBrowserHelpers(page);
}
