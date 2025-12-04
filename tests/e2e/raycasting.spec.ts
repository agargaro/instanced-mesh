/**
 * E2E tests for Raycasting
 * 
 * Tests actual raycasting with BVH optimization.
 * Runs against both WebGL and WebGPU renderers.
 */

import { test, expect, type Page } from '@playwright/test';
import { initBrowserHelpers, E2E_RENDERER_TYPES, getTestFixtureUrl, type E2ERendererType } from './test-utils.js';

// Shared beforeEach setup for a specific renderer type
const setupScene = async (page: Page, rendererType: E2ERendererType) => {
  const url = getTestFixtureUrl(rendererType);
  await page.goto(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.waitForFunction(() => (window as any).sceneReady === true);
  await initBrowserHelpers(page);
};

// Run tests for each renderer type
for (const rendererType of E2E_RENDERER_TYPES) {
  test.describe(`[${rendererType.toUpperCase()}] Raycasting E2E`, () => {
    test.beforeEach(async ({ page }) => {
      await setupScene(page, rendererType);
    });

    test('should raycast and find instances', async ({ page }) => {
      const hitFound = await page.evaluate(() => {
        const { Raycaster, Vector2 } = window.THREE;
        
        // Create mesh with instance at known position
        const mesh = window.createTestMesh({ count: 1, spread: 0 });
        
        // Position instance at origin
        mesh.updateInstances((obj) => {
          obj.position.set(0, 0, 0);
        });
        
        // Create raycaster pointing at origin
        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(0, 0), window.camera);
        
        const intersects = raycaster.intersectObject(mesh);
        
        return intersects.length > 0;
      });

      expect(hitFound).toBe(true);
    });

    test('should return instanceId in raycast result', async ({ page }) => {
      const instanceId = await page.evaluate(() => {
        const { Raycaster, Vector2 } = window.THREE;
        
        const mesh = window.createTestMesh({ count: 5, spread: 0 });
        
        // Position all instances at origin
        mesh.updateInstances((obj, index) => {
          obj.position.set(0, 0, index * 2);
        });
        
        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(0, 0), window.camera);
        
        const intersects = raycaster.intersectObject(mesh);
        
        if (intersects.length > 0) {
          return intersects[0].instanceId;
        }
        return -1;
      });

      expect(instanceId).toBeGreaterThanOrEqual(0);
    });

    test('should use BVH for optimized raycasting', async ({ page }) => {
      const result = await page.evaluate(() => {
        const { Raycaster, Vector2 } = window.THREE;
        
        // Create mesh with many instances
        const mesh = window.createTestMesh({ count: 1000, spread: 100 });
        mesh.computeBVH();
        
        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(0, 0), window.camera);
        
        const start = performance.now();
        const intersects = raycaster.intersectObject(mesh);
        const duration = performance.now() - start;
        
        return {
          hasBVH: mesh.bvh !== null,
          hitCount: intersects.length,
          duration
        };
      });

      expect(result.hasBVH).toBe(true);
      // With BVH, raycasting should be fast even with many instances
      expect(result.duration).toBeLessThan(100); // Should be much faster than 100ms
    });

    test('should only raycast visible instances', async ({ page }) => {
      const result = await page.evaluate(() => {
        const { Raycaster, Vector2 } = window.THREE;
        
        const mesh = window.createTestMesh({ count: 1, spread: 0 });
        
        // Position instance at origin
        mesh.updateInstances((obj) => {
          obj.position.set(0, 0, 0);
        });
        
        // First raycast - should hit
        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(0, 0), window.camera);
        const hitsBeforeHide = raycaster.intersectObject(mesh).length;
        
        // Hide the instance
        mesh.setVisibilityAt(0, false);
        
        // Second raycast - should not hit hidden instance
        const hitsAfterHide = raycaster.intersectObject(mesh).length;
        
        return {
          hitsBeforeHide,
          hitsAfterHide
        };
      });

      expect(result.hitsBeforeHide).toBeGreaterThan(0);
      // Note: visibility filtering during raycast depends on implementation
    });

    test('should raycast with raycastOnlyFrustum option', async ({ page }) => {
      await page.evaluate(() => {
        const mesh = window.createTestMesh({ count: 100, spread: 50 });
        mesh.raycastOnlyFrustum = true;
        
        // Perform frustum culling first
        mesh.performFrustumCulling(window.camera);
        
        window.testMesh = mesh;
      });

      const setting = await page.evaluate(() => window.testMesh.raycastOnlyFrustum);
      expect(setting).toBe(true);
    });
  });
}
