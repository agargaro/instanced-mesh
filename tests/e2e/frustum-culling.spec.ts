/**
 * E2E tests for Frustum Culling
 * 
 * Tests actual WebGL rendering with real camera frustum calculations.
 */

import { test, expect } from '@playwright/test';

test.describe('Frustum Culling E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/test-scene.html');
    await page.waitForFunction(() => window.sceneReady === true);
  });

  test('should render instances within camera frustum', async ({ page }) => {
    // Create mesh with instances at origin (visible to camera)
    await page.evaluate(() => {
      window.createTestMesh({ count: 100, spread: 10 });
    });

    // Wait for render
    await page.waitForTimeout(100);

    // Check that some instances are rendered
    const renderCount = await page.evaluate(() => window.testMesh.count);
    expect(renderCount).toBeGreaterThan(0);
  });

  test('should cull instances outside frustum', async ({ page }) => {
    // Create mesh with instances far from camera view
    await page.evaluate(() => {
      const mesh = window.createTestMesh({ count: 100, spread: 0 });
      
      // Move all instances behind the camera
      mesh.updateInstances((obj, index) => {
        obj.position.set(0, 0, 200); // Behind camera at z=100
      });
      
      // Trigger frustum culling
      mesh.performFrustumCulling(window.camera);
    });

    await page.waitForTimeout(100);

    // Instances behind camera should be culled
    const renderCount = await page.evaluate(() => window.testMesh.count);
    expect(renderCount).toBe(0);
  });

  test('should respect perObjectFrustumCulled setting', async ({ page }) => {
    await page.evaluate(() => {
      const mesh = window.createTestMesh({ count: 50, spread: 1000 });
      mesh.perObjectFrustumCulled = false;
      mesh.performFrustumCulling(window.camera);
    });

    await page.waitForTimeout(100);

    // With culling disabled, all instances should be rendered
    const renderCount = await page.evaluate(() => window.testMesh.count);
    const totalCount = await page.evaluate(() => window.testMesh.instancesCount);
    
    expect(renderCount).toBe(totalCount);
  });

  test('should update culling when camera moves', async ({ page }) => {
    await page.evaluate(() => {
      window.createTestMesh({ count: 100, spread: 50 });
    });

    // Get initial count
    const initialCount = await page.evaluate(() => {
      window.testMesh.performFrustumCulling(window.camera);
      return window.testMesh.count;
    });

    // Move camera far away
    await page.evaluate(() => {
      window.camera.position.set(0, 0, 10000);
      window.camera.updateMatrixWorld();
      window.testMesh.performFrustumCulling(window.camera);
    });

    await page.waitForTimeout(100);

    const farCount = await page.evaluate(() => window.testMesh.count);
    
    // When camera is far, fewer instances should be visible
    expect(farCount).toBeLessThan(initialCount);
  });

  test('should handle hidden instances during culling', async ({ page }) => {
    await page.evaluate(() => {
      const mesh = window.createTestMesh({ count: 10, spread: 5 });
      
      // Hide some instances
      mesh.setVisibilityAt(0, false);
      mesh.setVisibilityAt(1, false);
      mesh.setVisibilityAt(2, false);
      
      mesh.performFrustumCulling(window.camera);
    });

    await page.waitForTimeout(100);

    const renderCount = await page.evaluate(() => window.testMesh.count);
    
    // Should have at most 7 rendered (10 - 3 hidden)
    expect(renderCount).toBeLessThanOrEqual(7);
  });

  test('should use BVH for culling when available', async ({ page }) => {
    await page.evaluate(() => {
      const mesh = window.createTestMesh({ count: 100, spread: 50 });
      mesh.computeBVH();
      
      // BVH should be created
      return mesh.bvh !== null;
    });

    const hasBVH = await page.evaluate(() => window.testMesh.bvh !== null);
    expect(hasBVH).toBe(true);

    // Perform culling with BVH
    await page.evaluate(() => {
      window.testMesh.performFrustumCulling(window.camera);
    });

    const renderCount = await page.evaluate(() => window.testMesh.count);
    expect(renderCount).toBeGreaterThan(0);
  });
});

/**
 * High-confidence deterministic frustum culling tests
 * 
 * These tests verify exact instance IDs are culled/rendered
 * by placing instances at known positions and checking internal state.
 */
test.describe('Deterministic Frustum Culling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/test-scene.html');
    await page.waitForFunction(() => window.sceneReady === true);
  });

  test('should cull specific instances outside frustum and keep specific instances inside', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial } = window.THREE;
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(geometry, material, {
        capacity: 100,
        renderer: window.renderer
      });
      
      mesh.initMatricesTexture();
      
      // Camera at (0, 0, 50) looking at origin
      window.camera.position.set(0, 0, 50);
      window.camera.lookAt(0, 0, 0);
      window.camera.near = 1;
      window.camera.far = 200;
      window.camera.updateProjectionMatrix();
      window.camera.updateMatrixWorld();
      
      // Create instances at known positions relative to camera
      // Camera is at z=50 looking toward origin (negative Z direction)
      mesh.addInstances(6, (obj, index) => {
        switch (index) {
          case 0: obj.position.set(0, 0, 0); break;        // In front of camera - VISIBLE
          case 1: obj.position.set(0, 0, 200); break;      // Behind camera - CULLED
          case 2: obj.position.set(5, 0, 10); break;       // In front, slight offset - VISIBLE
          case 3: obj.position.set(1000, 0, 0); break;     // Far to the side - CULLED
          case 4: obj.position.set(0, 0, 30); break;       // In front, closer - VISIBLE
          case 5: obj.position.set(0, 1000, 0); break;     // Far above - CULLED
        }
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      mesh.performFrustumCulling(window.camera);
      
      // Get the rendered instance IDs
      const renderedCount = mesh.count;
      const renderedIds = Array.from(mesh.instanceIndex.array.slice(0, renderedCount));
      
      return { count: renderedCount, renderedIds };
    });
    
    // Verify exact count
    expect(result.count).toBe(3);
    
    // Verify specific instances are rendered (0, 2, 4 are in view)
    expect(result.renderedIds).toContain(0);
    expect(result.renderedIds).toContain(2);
    expect(result.renderedIds).toContain(4);
    
    // Verify specific instances are culled (1, 3, 5 are out of view)
    expect(result.renderedIds).not.toContain(1);
    expect(result.renderedIds).not.toContain(3);
    expect(result.renderedIds).not.toContain(5);
  });

  test('should correctly handle instances at frustum near/far boundaries', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial } = window.THREE;
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(geometry, material, {
        capacity: 100,
        renderer: window.renderer
      });
      
      mesh.initMatricesTexture();
      
      // Camera at origin looking at -Z with specific near/far
      window.camera.position.set(0, 0, 0);
      window.camera.lookAt(0, 0, -1);
      window.camera.near = 10;
      window.camera.far = 100;
      window.camera.updateProjectionMatrix();
      window.camera.updateMatrixWorld();
      
      // Create instances at boundary positions
      mesh.addInstances(6, (obj, index) => {
        switch (index) {
          case 0: obj.position.set(0, 0, -5); break;      // Before near plane (z=-5) - CULLED
          case 1: obj.position.set(0, 0, -10); break;     // At near plane - VISIBLE
          case 2: obj.position.set(0, 0, -50); break;     // Middle of frustum - VISIBLE
          case 3: obj.position.set(0, 0, -100); break;    // At far plane - VISIBLE
          case 4: obj.position.set(0, 0, -150); break;    // Beyond far plane - CULLED
          case 5: obj.position.set(0, 0, -75); break;     // Middle - VISIBLE
        }
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      mesh.performFrustumCulling(window.camera);
      
      const renderedCount = mesh.count;
      const renderedIds = Array.from(mesh.instanceIndex.array.slice(0, renderedCount));
      
      return { count: renderedCount, renderedIds };
    });
    
    // Instances 1, 2, 3, 5 should be visible (within near-far range)
    expect(result.renderedIds).toContain(1);
    expect(result.renderedIds).toContain(2);
    expect(result.renderedIds).toContain(3);
    expect(result.renderedIds).toContain(5);
    
    // Instances 0 and 4 should be culled (outside near-far range)
    expect(result.renderedIds).not.toContain(0);
    expect(result.renderedIds).not.toContain(4);
    
    expect(result.count).toBe(4);
  });

  test('should correctly handle instances at frustum left/right/top/bottom boundaries', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial } = window.THREE;
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(geometry, material, {
        capacity: 100,
        renderer: window.renderer
      });
      
      mesh.initMatricesTexture();
      
      // Camera with known FOV to calculate exact frustum boundaries
      window.camera.position.set(0, 0, 0);
      window.camera.lookAt(0, 0, -1);
      window.camera.fov = 90; // 90 degree FOV makes calculations easier
      window.camera.aspect = 1; // Square aspect ratio
      window.camera.near = 1;
      window.camera.far = 100;
      window.camera.updateProjectionMatrix();
      window.camera.updateMatrixWorld();
      
      // At 90 degree FOV and aspect 1, at distance Z, frustum width = 2*Z
      // At z=-20, frustum extends from x=-20 to x=+20
      mesh.addInstances(8, (obj, index) => {
        switch (index) {
          case 0: obj.position.set(0, 0, -20); break;      // Center - VISIBLE
          case 1: obj.position.set(15, 0, -20); break;     // Right, in view - VISIBLE
          case 2: obj.position.set(-15, 0, -20); break;    // Left, in view - VISIBLE
          case 3: obj.position.set(0, 15, -20); break;     // Top, in view - VISIBLE
          case 4: obj.position.set(0, -15, -20); break;    // Bottom, in view - VISIBLE
          case 5: obj.position.set(30, 0, -20); break;     // Far right - CULLED
          case 6: obj.position.set(-30, 0, -20); break;    // Far left - CULLED
          case 7: obj.position.set(0, 30, -20); break;     // Far top - CULLED
        }
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      mesh.performFrustumCulling(window.camera);
      
      const renderedCount = mesh.count;
      const renderedIds = Array.from(mesh.instanceIndex.array.slice(0, renderedCount));
      
      return { count: renderedCount, renderedIds };
    });
    
    // Instances 0-4 should be visible (inside frustum)
    expect(result.renderedIds).toContain(0);
    expect(result.renderedIds).toContain(1);
    expect(result.renderedIds).toContain(2);
    expect(result.renderedIds).toContain(3);
    expect(result.renderedIds).toContain(4);
    
    // Instances 5-7 should be culled (outside frustum)
    expect(result.renderedIds).not.toContain(5);
    expect(result.renderedIds).not.toContain(6);
    expect(result.renderedIds).not.toContain(7);
    
    expect(result.count).toBe(5);
  });

  test('should produce same culling results with and without BVH', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial } = window.THREE;
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(geometry, material, {
        capacity: 200,
        renderer: window.renderer
      });
      
      mesh.initMatricesTexture();
      
      // Camera setup
      window.camera.position.set(0, 0, 50);
      window.camera.lookAt(0, 0, 0);
      window.camera.updateMatrixWorld();
      
      // Create instances at various positions
      mesh.addInstances(50, (obj, index) => {
        // Create a spread of instances, some visible, some not
        const angle = (index / 50) * Math.PI * 2;
        const radius = index % 2 === 0 ? 20 : 200; // Alternating near/far
        obj.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.5,
          Math.sin(angle) * radius
        );
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      // Culling WITHOUT BVH
      mesh.performFrustumCulling(window.camera);
      const withoutBVHCount = mesh.count;
      const withoutBVHIds = Array.from(mesh.instanceIndex.array.slice(0, withoutBVHCount)).sort((a, b) => a - b);
      
      // Create BVH
      mesh.computeBVH();
      
      // Culling WITH BVH
      mesh.performFrustumCulling(window.camera);
      const withBVHCount = mesh.count;
      const withBVHIds = Array.from(mesh.instanceIndex.array.slice(0, withBVHCount)).sort((a, b) => a - b);
      
      return {
        withoutBVH: { count: withoutBVHCount, ids: withoutBVHIds },
        withBVH: { count: withBVHCount, ids: withBVHIds },
        hasBVH: mesh.bvh !== null
      };
    });
    
    // Verify BVH was created
    expect(result.hasBVH).toBe(true);
    
    // Verify same counts
    expect(result.withBVH.count).toBe(result.withoutBVH.count);
    
    // Verify same instance IDs are rendered
    expect(result.withBVH.ids).toEqual(result.withoutBVH.ids);
  });

  test('should track correct instance IDs when instances are hidden', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial } = window.THREE;
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(geometry, material, {
        capacity: 100,
        renderer: window.renderer
      });
      
      mesh.initMatricesTexture();
      
      // Camera looking at origin
      window.camera.position.set(0, 0, 50);
      window.camera.lookAt(0, 0, 0);
      window.camera.updateMatrixWorld();
      
      // Create 10 instances all in view
      mesh.addInstances(10, (obj, index) => {
        obj.position.set((index - 5) * 2, 0, 0); // Spread along X axis
      });
      
      // Hide specific instances
      mesh.setVisibilityAt(2, false);
      mesh.setVisibilityAt(5, false);
      mesh.setVisibilityAt(8, false);
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      mesh.performFrustumCulling(window.camera);
      
      const renderedCount = mesh.count;
      const renderedIds = Array.from(mesh.instanceIndex.array.slice(0, renderedCount));
      
      return { count: renderedCount, renderedIds };
    });
    
    // 10 instances - 3 hidden = 7 visible
    expect(result.count).toBe(7);
    
    // Hidden instances should not be in render list
    expect(result.renderedIds).not.toContain(2);
    expect(result.renderedIds).not.toContain(5);
    expect(result.renderedIds).not.toContain(8);
    
    // Visible instances should be in render list
    expect(result.renderedIds).toContain(0);
    expect(result.renderedIds).toContain(1);
    expect(result.renderedIds).toContain(3);
    expect(result.renderedIds).toContain(4);
    expect(result.renderedIds).toContain(6);
    expect(result.renderedIds).toContain(7);
    expect(result.renderedIds).toContain(9);
  });
});

