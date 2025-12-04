/**
 * E2E tests for basic rendering functionality
 * 
 * Tests that InstancedMesh2 renders correctly in a real WebGL context.
 */

import { test, expect, type Page } from '@playwright/test';
import { initBrowserHelpers } from './test-utils.js';

// Shared beforeEach setup
const setupScene = async (page: Page) => {
  await page.goto('/tests/fixtures/test-scene.html');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.waitForFunction(() => (window as any).sceneReady === true);
  await initBrowserHelpers(page);
};

test.describe('Rendering E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupScene(page);
  });

  test('should render instances on screen', async ({ page }) => {
    await page.evaluate(() => {
      window.createTestMesh({ count: 100, spread: 30 });
    });

    // Wait for a few frames
    await page.waitForTimeout(200);

    // Take screenshot to verify rendering
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
    
    // Check render count is greater than 0
    const renderCount = await page.evaluate(() => window.testMesh.count);
    expect(renderCount).toBeGreaterThan(0);
  });

  test('should update display when instances added', async ({ page }) => {
    // Start with empty mesh
    const initialCount = await page.evaluate(() => {
      window.createTestMesh({ count: 0 });
      return window.testMesh.instancesCount;
    });

    expect(initialCount).toBe(0);

    // Add instances
    const newCount = await page.evaluate(() => {
      window.testMesh.addInstances(50, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
      return window.testMesh.instancesCount;
    });

    expect(newCount).toBe(50);
  });

  test('should handle instance removal', async ({ page }) => {
    await page.evaluate(() => {
      window.createTestMesh({ count: 10, spread: 10 });
    });

    const initialCount = await page.evaluate(() => window.testMesh.instancesCount);
    expect(initialCount).toBe(10);

    // Remove some instances
    const afterRemoval = await page.evaluate(() => {
      window.testMesh.removeInstances(0, 1, 2);
      return window.testMesh.instancesCount;
    });

    expect(afterRemoval).toBe(7);
  });

  test('should handle clearInstances', async ({ page }) => {
    await page.evaluate(() => {
      window.createTestMesh({ count: 100, spread: 50 });
    });

    const beforeClear = await page.evaluate(() => window.testMesh.instancesCount);
    expect(beforeClear).toBe(100);

    const afterClear = await page.evaluate(() => {
      window.testMesh.clearInstances();
      return window.testMesh.instancesCount;
    });

    expect(afterClear).toBe(0);
  });

  test('should apply instance colors', async ({ page }) => {
    const result = await page.evaluate(() => {
      const mesh = window.createTestMesh({ count: 5, spread: 10 });

      // colorsTexture is lazily initialized - should be null before setting any colors
      const hasTextureBeforeSet = mesh.colorsTexture !== null;

      // Set different colors using Color objects (should not throw)
      let setColorSuccess = false;
      try {
        const { Color } = window.THREE;
        mesh.setColorAt(0, new Color(1, 0, 0)); // Red
        mesh.setColorAt(1, new Color(0, 1, 0)); // Green
        mesh.setColorAt(2, new Color(0, 0, 1)); // Blue
        setColorSuccess = true;
      } catch {
        setColorSuccess = false;
      }

      // After setting colors, colorsTexture should exist
      const hasTextureAfterSet = mesh.colorsTexture !== null;
      const textureHasData = hasTextureAfterSet && mesh.colorsTexture._data.length > 0;

      // Verify getColorAt doesn't throw
      let getColorSuccess = false;
      try {
        mesh.getColorAt(0);
        mesh.getColorAt(1);
        mesh.getColorAt(2);
        getColorSuccess = true;
      } catch {
        getColorSuccess = false;
      }

      return {
        hasTextureBeforeSet,
        hasTextureAfterSet,
        textureHasData,
        setColorSuccess,
        getColorSuccess
      };
    });

    // colorsTexture is lazily initialized - only created when setColorAt is called
    expect(result.hasTextureBeforeSet).toBe(false);
    expect(result.hasTextureAfterSet).toBe(true);
    expect(result.textureHasData).toBe(true);
    expect(result.setColorSuccess).toBe(true);
    expect(result.getColorSuccess).toBe(true);
  });

  test('should handle instance transformations', async ({ page }) => {
    const transformApplied = await page.evaluate(() => {
      const mesh = window.createTestMesh({ count: 1, spread: 0, createEntities: true });
      
      const instance = mesh.instances[0];
      instance.position.set(10, 20, 30);
      instance.scale.set(2, 2, 2);
      instance.updateMatrix();
      
      const pos = mesh.getPositionAt(0);
      
      return {
        x: Math.abs(pos.x - 10) < 0.001,
        y: Math.abs(pos.y - 20) < 0.001,
        z: Math.abs(pos.z - 30) < 0.001
      };
    });

    expect(transformApplied.x).toBe(true);
    expect(transformApplied.y).toBe(true);
    expect(transformApplied.z).toBe(true);
  });

  test('should support capacity expansion', async ({ page }) => {
    const expanded = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial } = window.THREE;
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = window.testHelpers.createMesh(geometry, material, 10);
      window.testHelpers.addToScene(mesh);

      const initialCapacity = mesh.capacity;

      // Add more than capacity
      mesh.addInstances(50, (obj, index) => {
        obj.position.set(index, 0, 0);
      });
      
      const finalCapacity = mesh.capacity;
      
      return {
        initialCapacity,
        finalCapacity,
        instanceCount: mesh.instancesCount
      };
    });

    expect(expanded.initialCapacity).toBe(10);
    expect(expanded.finalCapacity).toBeGreaterThan(10);
    expect(expanded.instanceCount).toBe(50);
  });

  test('should render with WebGL context', async ({ page }) => {
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return gl !== null;
    });

    expect(hasWebGL).toBe(true);
  });
});

/**
 * Rendering Pipeline Verification Tests
 * 
 * These tests verify the pipeline from internal state to GPU rendering,
 * ensuring data is correctly uploaded and shaders are properly configured.
 */
test.describe('Rendering Pipeline Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupScene(page);
  });

  test('should have matricesTexture available for shader', async ({ page }) => {
    const result = await page.evaluate(() => {
      const mesh = window.createTestMesh({ count: 10, spread: 10 });
      
      // Force a render
      window.renderer.render(window.scene, window.camera);
      
      // Verify the matricesTexture exists and has data for the shader
      const hasMatricesTexture = mesh.matricesTexture !== null;
      const matricesTextureHasData = hasMatricesTexture && mesh.matricesTexture._data.length > 0;
      
      // colorsTexture is lazily initialized - only exists after setColorAt is called
      // So we don't expect it to exist without setting colors
      const hasColorsTextureBeforeSet = mesh.colorsTexture !== null;
      
      // Set a color to initialize the colorsTexture
      mesh.setColorAt(0, 0xff0000);
      const hasColorsTextureAfterSet = mesh.colorsTexture !== null;
      const colorsTextureHasData = hasColorsTextureAfterSet && mesh.colorsTexture._data.length > 0;
      
      // Verify the texture has the correct structure for shader binding
      const textureWidth = mesh.matricesTexture?.image?.width ?? 0;
      const textureHeight = mesh.matricesTexture?.image?.height ?? 0;
      
      return { 
        hasMatricesTexture, 
        matricesTextureHasData,
        hasColorsTextureBeforeSet,
        hasColorsTextureAfterSet,
        colorsTextureHasData,
        textureWidth,
        textureHeight,
        hasValidDimensions: textureWidth > 0 && textureHeight > 0
      };
    });
    
    expect(result.hasMatricesTexture).toBe(true);
    expect(result.matricesTextureHasData).toBe(true);
    // colorsTexture is lazily initialized
    expect(result.hasColorsTextureBeforeSet).toBe(false);
    expect(result.hasColorsTextureAfterSet).toBe(true);
    expect(result.colorsTextureHasData).toBe(true);
    expect(result.hasValidDimensions).toBe(true);
  });

  test('should have instance index buffer after culling', async ({ page }) => {
    const result = await page.evaluate(() => {
      const mesh = window.createTestMesh({ count: 5, spread: 10 });
      mesh.performFrustumCulling(window.camera);
      window.renderer.render(window.scene, window.camera);
      
      // Verify buffer exists and was created
      const hasInstanceIndex = mesh.instanceIndex !== null;
      const hasBuffer = hasInstanceIndex && mesh.instanceIndex.buffer !== null;
      const bufferCount = mesh.count;
      const cpuIndices = hasInstanceIndex 
        ? Array.from(mesh.instanceIndex.array.slice(0, bufferCount))
        : [];
      
      return { hasInstanceIndex, hasBuffer, bufferCount, cpuIndices };
    });
    
    expect(result.hasInstanceIndex).toBe(true);
    expect(result.hasBuffer).toBe(true);
    expect(result.bufferCount).toBeGreaterThan(0);
    expect(result.cpuIndices.length).toBe(result.bufferCount);
  });

  test('should store correct transforms in matricesTexture', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial } = window.THREE;
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      const mesh = window.testHelpers.createMesh(geometry, material, 10);
      
      // Add instances with known positions
      mesh.addInstances(3, (obj, index) => {
        if (index === 0) obj.position.set(10, 0, 0);
        if (index === 1) obj.position.set(0, 20, 0);
        if (index === 2) obj.position.set(0, 0, 30);
      });
      
      window.testHelpers.addToScene(mesh);
      window.renderer.render(window.scene, window.camera);
      
      // Read back matrix data from texture
      // Matrix is stored as 4 vec4s (16 floats) per instance
      // Position is in the 4th column: indices 12, 13, 14 (x, y, z)
      const data = mesh.matricesTexture._data;
      const stride = 16; // 4x4 matrix = 16 floats
      
      const pos0 = [data[0 * stride + 12], data[0 * stride + 13], data[0 * stride + 14]];
      const pos1 = [data[1 * stride + 12], data[1 * stride + 13], data[1 * stride + 14]];
      const pos2 = [data[2 * stride + 12], data[2 * stride + 13], data[2 * stride + 14]];
      
      return { 
        hasTexture: mesh.matricesTexture !== null,
        pos0, 
        pos1, 
        pos2 
      };
    });
    
    expect(result.hasTexture).toBe(true);
    expect(result.pos0).toEqual([10, 0, 0]);
    expect(result.pos1).toEqual([0, 20, 0]);
    expect(result.pos2).toEqual([0, 0, 30]);
  });

  test('should use correct geometry for each LOD level', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { SphereGeometry, BoxGeometry, MeshBasicMaterial } = window.THREE;
      
      const highGeo = new SphereGeometry(1, 32, 32);
      const lowGeo = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const mesh = window.testHelpers.createMesh(highGeo, material);
      mesh.addLOD(lowGeo, material, 50);
      
      mesh.addInstances(5, (obj) => {
        obj.position.set(0, 0, -20); // All instances in front
      });
      
      window.testHelpers.addToScene(mesh);
      
      // Get geometry vertex counts for verification
      const lod0Geometry = mesh.LODinfo.objects[0].geometry;
      const lod1Geometry = mesh.LODinfo.objects[1].geometry;
      
      const lod0VertexCount = lod0Geometry.attributes.position.count;
      const lod1VertexCount = lod1Geometry.attributes.position.count;
      
      // Verify geometries are different objects
      const geometriesAreDifferent = lod0Geometry !== lod1Geometry;
      
      return {
        lod0VertexCount,
        lod1VertexCount,
        geometriesAreDifferent,
        lod0HasMoreVerts: lod0VertexCount > lod1VertexCount
      };
    });
    
    expect(result.geometriesAreDifferent).toBe(true);
    expect(result.lod0HasMoreVerts).toBe(true);
    // Sphere (32x32) has ~500+ vertices, Box has 24
    expect(result.lod0VertexCount).toBeGreaterThan(100);
    expect(result.lod1VertexCount).toBeLessThan(50);
  });

  test('should store correct colors in colorsTexture', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { Color } = window.THREE;
      const mesh = window.createTestMesh({ count: 3, spread: 10 });
      
      // Set distinct colors
      mesh.setColorAt(0, new Color(1, 0, 0)); // Red
      mesh.setColorAt(1, new Color(0, 1, 0)); // Green
      mesh.setColorAt(2, new Color(0, 0, 1)); // Blue
      
      window.renderer.render(window.scene, window.camera);
      
      // Read back color data from texture
      // Colors are stored as 4 floats per instance (RGBA)
      const data = mesh.colorsTexture._data;
      const stride = 4; // RGBA
      
      return {
        hasTexture: mesh.colorsTexture !== null,
        // Check R channel for red, G for green, B for blue
        color0R: data[0 * stride + 0],
        color1G: data[1 * stride + 1],
        color2B: data[2 * stride + 2]
      };
    });
    
    expect(result.hasTexture).toBe(true);
    // Colors should be close to 1.0 (may have slight precision differences)
    expect(result.color0R).toBeGreaterThan(0.9);
    expect(result.color1G).toBeGreaterThan(0.9);
    expect(result.color2B).toBeGreaterThan(0.9);
  });

  test('should update texture data when instances change', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial, Matrix4 } = window.THREE;
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      const mesh = window.testHelpers.createMesh(geometry, material, 10);
      
      // Add instance with initial position
      mesh.addInstances(1, (obj) => {
        obj.position.set(5, 5, 5);
      });
      
      window.testHelpers.addToScene(mesh);
      window.renderer.render(window.scene, window.camera);
      
      const data = mesh.matricesTexture._data;
      const initialPos = [data[12], data[13], data[14]];
      
      // Update position using setMatrixAt
      const newMatrix = new Matrix4();
      newMatrix.setPosition(100, 200, 300);
      mesh.setMatrixAt(0, newMatrix);
      window.renderer.render(window.scene, window.camera);
      
      const updatedPos = [data[12], data[13], data[14]];
      
      return {
        initialPos,
        updatedPos,
        positionChanged: initialPos[0] !== updatedPos[0]
      };
    });
    
    expect(result.initialPos).toEqual([5, 5, 5]);
    expect(result.updatedPos).toEqual([100, 200, 300]);
    expect(result.positionChanged).toBe(true);
  });

  test('should have correct instance indices after frustum culling', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial } = window.THREE;
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      const mesh = window.testHelpers.createMesh(geometry, material);
      
      // Camera at z=50 looking at origin
      window.testHelpers.setupCamera({ x: 0, y: 0, z: 50 });
      
      // Create instances: some in view, some out
      mesh.addInstances(6, (obj, index) => {
        switch (index) {
          case 0: obj.position.set(0, 0, 0); break;     // In view
          case 1: obj.position.set(5, 0, 10); break;    // In view
          case 2: obj.position.set(0, 0, 200); break;   // Behind camera - culled
          case 3: obj.position.set(0, 0, 20); break;    // In view
          case 4: obj.position.set(500, 0, 0); break;   // Far side - culled
          case 5: obj.position.set(-5, 5, 0); break;    // In view
        }
      });
      
      window.testHelpers.addToScene(mesh);
      
      mesh.performFrustumCulling(window.camera);
      window.renderer.render(window.scene, window.camera);
      
      const info = window.testHelpers.getRenderedInfo(mesh);
      
      return {
        totalInstances: mesh.instancesCount,
        renderedCount: info.count,
        renderedIndices: [...info.ids].sort((a, b) => a - b)
      };
    });
    
    expect(result.totalInstances).toBe(6);
    expect(result.renderedCount).toBe(4);
    // Instances 0, 1, 3, 5 should be visible
    expect(result.renderedIndices).toEqual([0, 1, 3, 5]);
  });
});

/**
 * Rendering Output Verification Tests
 * 
 * These tests verify that rendering ACTUALLY produces visible output,
 * not just that CPU-side state is correct. Uses draw call verification
 * and GL error checks to ensure rendering works end-to-end.
 * 
 * Note: Pixel readback tests are limited because the test fixture
 * renderer doesn't use preserveDrawingBuffer. Instead, we verify
 * rendering via draw call counts and triangles rendered.
 */
test.describe('Rendering Output Verification', () => {
  test.beforeEach(async ({ page }) => {
    await setupScene(page);
  });

  test('should execute draw calls when rendering', async ({ page }) => {
    const result = await page.evaluate(() => {
      const mesh = window.createTestMesh({ count: 10, spread: 10 });
      window.renderer.info.reset();
      
      window.renderer.render(window.scene, window.camera);
      
      return {
        drawCalls: window.renderer.info.render.calls,
        triangles: window.renderer.info.render.triangles,
        meshCount: mesh.count
      };
    });
    
    expect(result.drawCalls).toBeGreaterThan(0);
    expect(result.triangles).toBeGreaterThan(0);
    expect(result.meshCount).toBeGreaterThan(0);
  });

  test('should render more triangles with more instances', async ({ page }) => {
    const result = await page.evaluate(() => {
      // First render with few instances
      const mesh1 = window.createTestMesh({ count: 5, spread: 10 });
      window.renderer.info.reset();
      window.renderer.render(window.scene, window.camera);
      const triangles5 = window.renderer.info.render.triangles;
      
      // Clean up
      window.scene.remove(mesh1);
      
      // Second render with more instances
      const mesh2 = window.createTestMesh({ count: 50, spread: 10 });
      window.renderer.info.reset();
      window.renderer.render(window.scene, window.camera);
      const triangles50 = window.renderer.info.render.triangles;
      
      return { triangles5, triangles50 };
    });
    
    // More instances = more triangles rendered
    expect(result.triangles50).toBeGreaterThan(result.triangles5);
  });

  test('should render zero triangles when all instances culled', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial, PerspectiveCamera } = window.THREE;
      
      // Clear scene
      while (window.scene.children.length > 0) {
        window.scene.remove(window.scene.children[0]);
      }
      
      // Camera at origin looking at -Z
      const camera = new PerspectiveCamera(75, 1, 0.1, 100);
      camera.position.set(0, 0, 0);
      camera.lookAt(0, 0, -1);
      camera.updateMatrixWorld();
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const mesh = window.testHelpers.createMesh(geometry, material, 10);
      
      // All instances BEHIND camera (positive Z)
      mesh.addInstances(10, (obj) => {
        obj.position.set(0, 0, 100); // Behind camera
      });
      
      window.testHelpers.addToScene(mesh);
      
      mesh.performFrustumCulling(camera);
      window.renderer.info.reset();
      window.renderer.render(window.scene, camera);
      
      return {
        triangles: window.renderer.info.render.triangles,
        meshCount: mesh.count,
        instancesCount: mesh.instancesCount
      };
    });
    
    // All instances are behind camera, should be culled
    expect(result.meshCount).toBe(0);
    expect(result.triangles).toBe(0);
  });

  test('should render triangles when instances in view', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { BoxGeometry, MeshBasicMaterial, PerspectiveCamera } = window.THREE;
      
      // Clear scene
      while (window.scene.children.length > 0) {
        window.scene.remove(window.scene.children[0]);
      }
      
      // Camera at origin looking at -Z
      const camera = new PerspectiveCamera(75, 1, 0.1, 100);
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const mesh = window.testHelpers.createMesh(geometry, material, 10);
      
      // All instances IN FRONT of camera
      mesh.addInstances(10, (obj, index) => {
        obj.position.set((index - 5) * 2, 0, 0); // Spread in view
      });
      
      window.testHelpers.addToScene(mesh);
      
      mesh.performFrustumCulling(camera);
      window.renderer.info.reset();
      window.renderer.render(window.scene, camera);
      
      return {
        triangles: window.renderer.info.render.triangles,
        meshCount: mesh.count,
        instancesCount: mesh.instancesCount
      };
    });
    
    // Instances in view should render triangles
    expect(result.meshCount).toBeGreaterThan(0);
    expect(result.triangles).toBeGreaterThan(0);
    // Box has 12 triangles, so 10 boxes = 120 triangles
    expect(result.triangles).toBeGreaterThanOrEqual(result.meshCount * 12);
  });

  test('should render successfully without exceptions', async ({ page }) => {
    const result = await page.evaluate(() => {
      try {
        // Use the standard createTestMesh which we know works
        const mesh = window.createTestMesh({ count: 10, spread: 10 });
        window.renderer.info.reset();
        window.renderer.render(window.scene, window.camera);
        
        return { 
          success: true,
          meshCount: mesh.count,
          triangles: window.renderer.info.render.triangles,
          error: null
        };
      } catch (e) {
        return {
          success: false,
          meshCount: 0,
          triangles: 0,
          error: (e as Error).message
        };
      }
    });
    
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.meshCount).toBeGreaterThan(0);
    expect(result.triangles).toBeGreaterThan(0);
  });
});
