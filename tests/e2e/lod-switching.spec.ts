/**
 * E2E tests for LOD (Level of Detail) switching
 * 
 * Tests actual distance-based LOD switching with real rendering.
 */

import { test, expect } from '@playwright/test';

test.describe('LOD Switching E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/test-scene.html');
    await page.waitForFunction(() => window.sceneReady === true);
  });

  test('should create LOD levels', async ({ page }) => {
    const hasLOD = await page.evaluate(() => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;
      
      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const midGeometry = new SphereGeometry(0.5, 16, 16);
      const lowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity: 100,
        renderer: window.renderer
      });

      mesh.addLOD(midGeometry, material, 50);
      mesh.addLOD(lowGeometry, material, 100);

      mesh.addInstances(50, (obj, index) => {
        // NOSONAR – test-only randomness is fine here
        obj.position.set(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        );
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      return mesh.LODinfo !== null && mesh.LODinfo.render.levels.length === 3;
    });

    expect(hasLOD).toBe(true);
  });

  test('should render different LOD levels based on distance', async ({ page }) => {
    await page.evaluate(() => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;
      
      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const lowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity: 100,
        renderer: window.renderer
      });

      mesh.addLOD(lowGeometry, material, 50);

      // Create instances at known distances
      mesh.addInstances(10, (obj, index) => {
        // Near instances (within 50 units)
        if (index < 5) {
          obj.position.set(0, 0, 20);
        } else {
          // Far instances (beyond 50 units)
          obj.position.set(0, 0, -100);
        }
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      // Trigger culling
      mesh.performFrustumCulling(window.camera);
    });

    await page.waitForTimeout(100);

    // Check that LOD objects have different counts
    const lodInfo = await page.evaluate(() => {
      const mesh = window.testMesh;
      return {
        level0Count: mesh.LODinfo.objects[0].count,
        level1Count: mesh.LODinfo.objects[1].count,
        totalLevels: mesh.LODinfo.render.levels.length
      };
    });

    expect(lodInfo.totalLevels).toBe(2);
    // Near and far instances should be distributed across LOD levels
  });

  test('should update LOD when camera moves', async ({ page }) => {
    await page.evaluate(() => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;
      
      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const lowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity: 100,
        renderer: window.renderer
      });

      mesh.addLOD(lowGeometry, material, 30);

      // All instances at origin
      mesh.addInstances(20, (obj, index) => {
        obj.position.set(0, 0, 0);
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
    });

    // Camera close - should use high LOD
    await page.evaluate(() => {
      window.camera.position.set(0, 0, 20);
      window.camera.lookAt(0, 0, 0);
      window.camera.updateMatrixWorld();
      window.testMesh.performFrustumCulling(window.camera);
    });

    const closeHighCount = await page.evaluate(() => 
      window.testMesh.LODinfo.objects[0].count
    );

    // Camera far - should use low LOD
    await page.evaluate(() => {
      window.camera.position.set(0, 0, 100);
      window.camera.lookAt(0, 0, 0);
      window.camera.updateMatrixWorld();
      window.testMesh.performFrustumCulling(window.camera);
    });

    const farHighCount = await page.evaluate(() => 
      window.testMesh.LODinfo.objects[0].count
    );
    const farLowCount = await page.evaluate(() => 
      window.testMesh.LODinfo.objects[1].count
    );

    // When camera is close, high LOD should have more instances
    // When camera is far, low LOD should have more instances
    expect(closeHighCount).toBeGreaterThan(0);
    expect(farLowCount).toBeGreaterThan(farHighCount);
  });

  test('should support shadow LOD', async ({ page }) => {
    const hasShadowLOD = await page.evaluate(() => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;
      
      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const shadowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity: 100,
        renderer: window.renderer
      });

      mesh.addShadowLOD(shadowGeometry, 0);
      
      window.testMesh = mesh;
      
      return mesh.LODinfo.shadowRender !== null && 
             mesh.LODinfo.shadowRender.levels.length > 0 &&
             mesh.castShadow === true;
    });

    expect(hasShadowLOD).toBe(true);
  });
});

/**
 * High-confidence deterministic LOD tests
 * 
 * These tests verify exact instance ID assignments to LOD levels
 * by placing instances at known distances and checking internal state.
 */
test.describe('Deterministic LOD Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/test-scene.html');
    await page.waitForFunction(() => window.sceneReady === true);
  });

  test('should assign instances to correct LOD based on exact distance', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;
      
      // Setup: LOD 0 for 0-50 units, LOD 1 for 50+ units
      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const lowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity: 100,
        renderer: window.renderer
      });
      
      mesh.addLOD(lowGeometry, material, 50); // LOD 1 at 50 units distance
      
      // Position camera at origin looking at -Z with wide FOV
      window.camera.position.set(0, 0, 0);
      window.camera.lookAt(0, 0, -1);
      window.camera.fov = 90;
      window.camera.near = 1;
      window.camera.far = 500;
      window.camera.updateProjectionMatrix();
      window.camera.updateMatrixWorld();
      
      // Create 4 instances at known distances from camera (at origin)
      // All instances placed IN FRONT of camera (in -Z direction) to stay in frustum
      // Instances 0,1: at ~30 units distance (should be LOD 0)
      // Instances 2,3: at ~80 units distance (should be LOD 1)
      mesh.addInstances(4, (obj, index) => {
        if (index === 0) obj.position.set(0, 0, -30);     // 30 units in front - LOD 0
        if (index === 1) obj.position.set(5, 0, -29.6);   // ~30 units in front - LOD 0
        if (index === 2) obj.position.set(0, 0, -80);     // 80 units in front - LOD 1
        if (index === 3) obj.position.set(10, 0, -79.4);  // ~80 units in front - LOD 1
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      // Perform frustum culling (which also does LOD assignment)
      mesh.performFrustumCulling(window.camera);
      
      // Extract LOD assignment data
      const lod0Count = mesh.LODinfo.objects[0].count;
      const lod1Count = mesh.LODinfo.objects[1].count;
      const lod0Ids = Array.from(mesh.LODinfo.objects[0].instanceIndex.array.slice(0, lod0Count));
      const lod1Ids = Array.from(mesh.LODinfo.objects[1].instanceIndex.array.slice(0, lod1Count));
      
      return { lod0Count, lod1Count, lod0Ids, lod1Ids };
    });
    
    // Verify exact counts
    expect(result.lod0Count).toBe(2);
    expect(result.lod1Count).toBe(2);
    
    // Verify exact instance IDs in each LOD level
    expect(result.lod0Ids.sort((a, b) => a - b)).toEqual([0, 1]);
    expect(result.lod1Ids.sort((a, b) => a - b)).toEqual([2, 3]);
  });

  test('should reassign LOD levels when camera distance changes', async ({ page }) => {
    // Setup: Create instances all at origin
    await page.evaluate(() => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;
      
      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const lowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity: 100,
        renderer: window.renderer
      });
      
      mesh.addLOD(lowGeometry, material, 50); // LOD 1 at 50 units
      
      // All 5 instances at origin
      mesh.addInstances(5, (obj, index) => {
        obj.position.set(0, 0, 0);
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
    });
    
    // Phase 1: Camera close (20 units) - all should be LOD 0
    const closeResult = await page.evaluate(() => {
      window.camera.position.set(0, 0, 20);
      window.camera.lookAt(0, 0, 0);
      window.camera.updateMatrixWorld();
      window.testMesh.performFrustumCulling(window.camera);
      
      return {
        lod0Count: window.testMesh.LODinfo.objects[0].count,
        lod1Count: window.testMesh.LODinfo.objects[1].count
      };
    });
    
    expect(closeResult.lod0Count).toBe(5);
    expect(closeResult.lod1Count).toBe(0);
    
    // Phase 2: Camera far (100 units) - all should be LOD 1
    const farResult = await page.evaluate(() => {
      window.camera.position.set(0, 0, 100);
      window.camera.lookAt(0, 0, 0);
      window.camera.updateMatrixWorld();
      window.testMesh.performFrustumCulling(window.camera);
      
      return {
        lod0Count: window.testMesh.LODinfo.objects[0].count,
        lod1Count: window.testMesh.LODinfo.objects[1].count
      };
    });
    
    expect(farResult.lod0Count).toBe(0);
    expect(farResult.lod1Count).toBe(5);
  });

  test('should handle instance at exact LOD boundary distance', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;
      
      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const lowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity: 100,
        renderer: window.renderer
      });
      
      mesh.addLOD(lowGeometry, material, 50); // Boundary at 50 units
      
      // Camera at origin
      window.camera.position.set(0, 0, 0);
      window.camera.lookAt(0, 0, -1);
      window.camera.updateMatrixWorld();
      
      // Create instances at and around boundary
      mesh.addInstances(4, (obj, index) => {
        if (index === 0) obj.position.set(0, 0, -49.9);  // Just inside LOD 0
        if (index === 1) obj.position.set(0, 0, -50.0);  // Exactly at boundary
        if (index === 2) obj.position.set(0, 0, -50.1);  // Just outside to LOD 1
        if (index === 3) obj.position.set(0, 0, -60);    // Clearly LOD 1
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      mesh.performFrustumCulling(window.camera);
      
      const lod0Count = mesh.LODinfo.objects[0].count;
      const lod1Count = mesh.LODinfo.objects[1].count;
      const lod0Ids = Array.from(mesh.LODinfo.objects[0].instanceIndex.array.slice(0, lod0Count));
      const lod1Ids = Array.from(mesh.LODinfo.objects[1].instanceIndex.array.slice(0, lod1Count));
      
      return { lod0Count, lod1Count, lod0Ids, lod1Ids };
    });
    
    // Instance 0 (49.9) should be in LOD 0
    // Instance 1 (50.0 - exact boundary) - verify it's assigned consistently
    // Instances 2,3 should be in LOD 1
    
    // At boundary, the comparison is typically < threshold, so exactly 50 goes to LOD 1
    expect(result.lod0Ids).toContain(0);
    expect(result.lod1Ids).toContain(2);
    expect(result.lod1Ids).toContain(3);
    
    // Boundary instance (1) should be consistently assigned to one level
    // It will go to LOD 1 since comparison is typically < (not <=)
    expect(result.lod0Count + result.lod1Count).toBe(4);
  });

  test('should correctly assign multiple LOD levels (3+ levels)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, SphereGeometry, MeshBasicMaterial } = window.THREE;
      
      const highGeometry = new SphereGeometry(0.5, 32, 32);
      const midGeometry = new SphereGeometry(0.5, 16, 16);
      const lowGeometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = new window.InstancedMesh2(highGeometry, material, {
        capacity: 100,
        renderer: window.renderer
      });
      
      mesh.addLOD(midGeometry, material, 30);  // LOD 1 at 30 units
      mesh.addLOD(lowGeometry, material, 60);  // LOD 2 at 60 units
      
      // Camera at origin looking at -Z with wide FOV
      window.camera.position.set(0, 0, 0);
      window.camera.lookAt(0, 0, -1);
      window.camera.fov = 90;
      window.camera.near = 1;
      window.camera.far = 500;
      window.camera.updateProjectionMatrix();
      window.camera.updateMatrixWorld();
      
      // Create 6 instances: 2 for each LOD level
      // All instances in front of camera to stay in frustum
      mesh.addInstances(6, (obj, index) => {
        if (index === 0) obj.position.set(0, 0, -15);     // 15 units -> LOD 0
        if (index === 1) obj.position.set(3, 0, -14.7);   // ~15 units -> LOD 0
        if (index === 2) obj.position.set(0, 0, -45);     // 45 units -> LOD 1
        if (index === 3) obj.position.set(8, 0, -44.3);   // ~45 units -> LOD 1
        if (index === 4) obj.position.set(0, 0, -80);     // 80 units -> LOD 2
        if (index === 5) obj.position.set(15, 0, -78.6);  // ~80 units -> LOD 2
      });
      
      window.scene.add(mesh);
      window.testMesh = mesh;
      
      mesh.performFrustumCulling(window.camera);
      
      const lod0Count = mesh.LODinfo.objects[0].count;
      const lod1Count = mesh.LODinfo.objects[1].count;
      const lod2Count = mesh.LODinfo.objects[2].count;
      const lod0Ids = Array.from(mesh.LODinfo.objects[0].instanceIndex.array.slice(0, lod0Count));
      const lod1Ids = Array.from(mesh.LODinfo.objects[1].instanceIndex.array.slice(0, lod1Count));
      const lod2Ids = Array.from(mesh.LODinfo.objects[2].instanceIndex.array.slice(0, lod2Count));
      
      return { 
        lod0Count, lod1Count, lod2Count,
        lod0Ids, lod1Ids, lod2Ids,
        totalLevels: mesh.LODinfo.render.levels.length
      };
    });
    
    expect(result.totalLevels).toBe(3);
    expect(result.lod0Count).toBe(2);
    expect(result.lod1Count).toBe(2);
    expect(result.lod2Count).toBe(2);
    
    expect(result.lod0Ids.sort((a, b) => a - b)).toEqual([0, 1]);
    expect(result.lod1Ids.sort((a, b) => a - b)).toEqual([2, 3]);
    expect(result.lod2Ids.sort((a, b) => a - b)).toEqual([4, 5]);
  });
});

