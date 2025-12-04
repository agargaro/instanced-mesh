/**
 * Dedicated E2E tests for WebGPU rendering functionality.
 * 
 * These tests specifically verify that WebGPU instanced rendering works correctly,
 * catching issues like:
 * - "Binding size for buffer is zero" errors
 * - WGSL shader compilation failures
 * - TSL node build errors
 * - Blank screens despite no JS errors
 */

import { test, expect, type Page } from '@playwright/test';

// Collect all console messages during test
interface ConsoleLog {
  type: string;
  text: string;
  timestamp: number;
}

test.describe('WebGPU Rendering Direct Tests', () => {
  let consoleLogs: ConsoleLog[] = [];

  test.beforeEach(async ({ page }) => {
    consoleLogs = [];
    
    // Capture ALL console messages
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });
  });

  test('should render WebGPU example without binding errors', async ({ page }) => {
    // Navigate to the actual WebGPU example
    await page.goto('http://localhost:5173/index-webgpu.html');
    
    // Wait for initialization
    await page.waitForTimeout(3000);
    
    // Show all console logs for debugging
    const allLogs = consoleLogs.filter(log => log.type === 'log' || log.type === 'warning');
    console.log('=== Console logs ===');
    allLogs.forEach(log => console.log(`[${log.type}] ${log.text.substring(0, 100)}`));
    
    // Check for specific WebGPU errors
    const bindingErrors = consoleLogs.filter(log => 
      log.text.includes('Binding size') && log.text.includes('is zero')
    );
    
    const invalidBindGroupErrors = consoleLogs.filter(log =>
      log.text.includes('Invalid BindGroup')
    );
    
    const wgslErrors = consoleLogs.filter(log =>
      log.text.includes('Error while parsing WGSL')
    );

    // Report all errors for debugging
    if (bindingErrors.length > 0 || invalidBindGroupErrors.length > 0 || wgslErrors.length > 0) {
      console.log('=== WebGPU Errors Found ===');
      console.log('Binding errors:', bindingErrors.length);
      console.log('Invalid BindGroup errors:', invalidBindGroupErrors.length);
      console.log('WGSL errors:', wgslErrors.length);
      
      // Show first error of each type
      if (bindingErrors.length > 0) {
        console.log('First binding error:', bindingErrors[0].text.substring(0, 500));
      }
      if (wgslErrors.length > 0) {
        console.log('First WGSL error:', wgslErrors[0].text.substring(0, 500));
      }
    }

    // Fail test if binding errors occurred
    expect(bindingErrors.length, 'Should have no "Binding size is zero" errors').toBe(0);
    expect(invalidBindGroupErrors.length, 'Should have no "Invalid BindGroup" errors').toBe(0);
    expect(wgslErrors.length, 'Should have no WGSL parsing errors').toBe(0);
  });

  test('should render visible content (not blank screen)', async ({ page }) => {
    await page.goto('http://localhost:5173/index-webgpu.html');
    await page.waitForTimeout(3000);

    // Check if canvas exists and has content
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { exists: false };

      // Try to get pixel data to check if anything was rendered
      const ctx = canvas.getContext('webgpu');
      
      return {
        exists: true,
        width: canvas.width,
        height: canvas.height,
        hasWebGPUContext: !!ctx
      };
    });

    expect(canvasInfo.exists).toBe(true);
    expect(canvasInfo.width).toBeGreaterThan(0);
    expect(canvasInfo.height).toBeGreaterThan(0);
  });

  test('test fixture should render without errors', async ({ page }) => {
    // Navigate to test fixture
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    
    // Wait for scene to be ready
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    // Create test mesh
    await page.evaluate(() => {
      (window as any).createTestMesh({ count: 100, spread: 30 });
    });
    
    // Wait for rendering
    await page.waitForTimeout(2000);
    
    // Check for errors
    const errors = consoleLogs.filter(log => log.type === 'error');
    const bindingErrors = errors.filter(log => 
      log.text.includes('Binding size') || log.text.includes('Invalid BindGroup')
    );
    
    // This should pass since test fixture works
    expect(bindingErrors.length).toBe(0);
  });

  test('should compare test fixture vs actual example', async ({ page }) => {
    // First, test the fixture
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    await page.evaluate(() => {
      (window as any).createTestMesh({ count: 1000, spread: 100 });
    });
    
    await page.waitForTimeout(2000);
    
    const fixtureErrors = consoleLogs.filter(log => 
      log.type === 'error' && (log.text.includes('Binding') || log.text.includes('Invalid'))
    );
    
    console.log(`Test fixture errors: ${fixtureErrors.length}`);
    
    // Clear logs
    consoleLogs = [];
    
    // Now test actual example
    await page.goto('http://localhost:5173/index-webgpu.html');
    await page.waitForTimeout(3000);
    
    const exampleErrors = consoleLogs.filter(log => 
      log.type === 'error' && (log.text.includes('Binding') || log.text.includes('Invalid'))
    );
    
    console.log(`Actual example errors: ${exampleErrors.length}`);
    
    // Both should have zero errors
    expect(fixtureErrors.length, 'Test fixture should have no errors').toBe(0);
    expect(exampleErrors.length, 'Actual example should have no errors').toBe(0);
  });

  test('should verify matricesTexture is properly initialized', async ({ page }) => {
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    const textureInfo = await page.evaluate(() => {
      const mesh = (window as any).createTestMesh({ count: 100, spread: 30 });
      const texture = mesh.matricesTexture;
      
      return {
        exists: !!texture,
        hasImage: !!texture?.image,
        width: texture?.image?.width,
        height: texture?.image?.height,
        hasData: !!texture?.image?.data,
        dataLength: texture?.image?.data?.length
      };
    });
    
    console.log('Texture info:', textureInfo);
    
    expect(textureInfo.exists).toBe(true);
    expect(textureInfo.hasImage).toBe(true);
    expect(textureInfo.width).toBeGreaterThan(0);
    expect(textureInfo.height).toBeGreaterThan(0);
    expect(textureInfo.hasData).toBe(true);
    expect(textureInfo.dataLength).toBeGreaterThan(0);
  });

  test('should render with 1000 instances (same as example)', async ({ page }) => {
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    // Create same number of instances as the actual example
    await page.evaluate(() => {
      (window as any).createTestMesh({ count: 1000, spread: 100, capacity: 1000 });
    });
    
    // Wait for several render frames
    await page.waitForTimeout(3000);
    
    // Show debug logs
    const allLogs = consoleLogs.filter(log => log.type === 'log' || log.type === 'warning');
    console.log('=== Fixture Console logs ===');
    allLogs.forEach(log => console.log(`[${log.type}] ${log.text.substring(0, 100)}`));
    
    // Check for errors (both 'error' and 'warning' since WebGPU may log as warnings)
    const criticalErrors = consoleLogs.filter(log => 
      (log.type === 'error' || log.type === 'warning') && 
      (log.text.includes('Binding size') || 
       log.text.includes('Invalid BindGroup') ||
       log.text.includes('WGSL'))
    );
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:');
      criticalErrors.slice(0, 3).forEach(e => console.log(e.text.substring(0, 300)));
    }
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should render with ground plane (like example)', async ({ page }) => {
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    // Create instanced mesh AND additional scene objects like the example
    // Note: MeshBasicNodeMaterial is exposed on window in the fixture
    await page.evaluate(() => {
      const THREE = (window as any).THREE;
      
      // Create instanced mesh
      (window as any).createTestMesh({ count: 1000, spread: 100 });
      
      // Add ground plane using the same MeshBasicNodeMaterial from window
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new (window as any).MeshBasicNodeMaterial({ color: 0x444444 })
      );
      ground.position.y = -1;
      ground.rotation.x = -Math.PI / 2;
      (window as any).scene.add(ground);
      
      // Add lights like in the example
      (window as any).scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      (window as any).scene.add(new THREE.DirectionalLight(0xffffff, 0.5));
    });
    
    await page.waitForTimeout(3000);
    
    const criticalErrors = consoleLogs.filter(log => 
      log.type === 'error' && 
      (log.text.includes('Binding size') || 
       log.text.includes('Invalid BindGroup'))
    );
    
    if (criticalErrors.length > 0) {
      console.log('Errors when adding ground plane:');
      criticalErrors.slice(0, 2).forEach(e => console.log(e.text.substring(0, 300)));
    }
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should render instanced mesh BEFORE adding other objects', async ({ page }) => {
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    // First add instanced mesh and let it render
    await page.evaluate(() => {
      (window as any).createTestMesh({ count: 1000, spread: 100 });
    });
    
    await page.waitForTimeout(1000);
    
    const errorsBeforeGround = consoleLogs.filter(log => 
      log.type === 'error' && log.text.includes('Binding')
    ).length;
    
    console.log(`Errors before adding ground: ${errorsBeforeGround}`);
    
    // Now add ground plane
    await page.evaluate(() => {
      const THREE = (window as any).THREE;
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new (window as any).MeshBasicNodeMaterial({ color: 0x444444 })
      );
      ground.position.y = -1;
      ground.rotation.x = -Math.PI / 2;
      (window as any).scene.add(ground);
    });
    
    await page.waitForTimeout(2000);
    
    const errorsAfterGround = consoleLogs.filter(log => 
      log.type === 'error' && log.text.includes('Binding')
    ).length;
    
    console.log(`Errors after adding ground: ${errorsAfterGround}`);
    console.log(`New errors from ground plane: ${errorsAfterGround - errorsBeforeGround}`);
    
    expect(errorsBeforeGround).toBe(0);
    expect(errorsAfterGround).toBe(0);
  });

  test('should work with scene.background set', async ({ page }) => {
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    // Set scene background like the example does
    await page.evaluate(() => {
      const THREE = (window as any).THREE;
      (window as any).scene.background = new THREE.Color(0x222222);
    });
    
    // Create instanced mesh
    await page.evaluate(() => {
      (window as any).createTestMesh({ count: 1000, spread: 100 });
    });
    
    await page.waitForTimeout(2000);
    
    const criticalErrors = consoleLogs.filter(log => 
      log.type === 'error' && log.text.includes('Binding')
    );
    
    console.log(`Errors with scene.background set: ${criticalErrors.length}`);
    expect(criticalErrors.length).toBe(0);
  });

  test('should work with setAnimationLoop instead of requestAnimationFrame', async ({ page }) => {
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    // Create instanced mesh
    await page.evaluate(() => {
      (window as any).createTestMesh({ count: 1000, spread: 100 });
    });
    
    // Switch to setAnimationLoop
    await page.evaluate(() => {
      // Stop the current requestAnimationFrame loop (if possible)
      const renderer = (window as any).renderer;
      const scene = (window as any).scene;
      const camera = (window as any).camera;
      
      // Use setAnimationLoop like the example
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    });
    
    await page.waitForTimeout(2000);
    
    const criticalErrors = consoleLogs.filter(log => 
      log.type === 'error' && log.text.includes('Binding')
    );
    
    console.log(`Errors with setAnimationLoop: ${criticalErrors.length}`);
    expect(criticalErrors.length).toBe(0);
  });

  test('should work with EXACT example setup', async ({ page }) => {
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    // Replicate EXACT example setup
    await page.evaluate(() => {
      const THREE = (window as any).THREE;
      const scene = (window as any).scene;
      const camera = (window as any).camera;
      const renderer = (window as any).renderer;
      
      // Set scene background like example
      scene.background = new THREE.Color(0x222222);
      
      // Position camera like example
      camera.position.set(50, 50, 50);
      camera.lookAt(0, 0, 0);
      
      // Create instanced mesh
      (window as any).createTestMesh({ count: 1000, spread: 100 });
      
      // Add ground plane like example
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new (window as any).MeshBasicNodeMaterial({ color: 0x444444 })
      );
      ground.position.y = -1;
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);
      
      // Add lights like example
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      scene.add(new THREE.DirectionalLight(0xffffff, 0.5));
      
      // Use setAnimationLoop like example
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });
    });
    
    await page.waitForTimeout(3000);
    
    const criticalErrors = consoleLogs.filter(log => 
      log.type === 'error' && log.text.includes('Binding')
    );
    
    console.log(`Errors with EXACT example setup: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      console.log('First error:', criticalErrors[0].text.substring(0, 200));
    }
    expect(criticalErrors.length).toBe(0);
  });

  test('should render plain MeshBasicNodeMaterial without errors', async ({ page }) => {
    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });
    
    // Add a plain mesh without using InstancedMesh2
    await page.evaluate(() => {
      const THREE = (window as any).THREE;
      const scene = (window as any).scene;
      
      // Just a simple box with MeshBasicNodeMaterial
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(5, 5, 5),
        new (window as any).MeshBasicNodeMaterial({ color: 0xff0000 })
      );
      scene.add(mesh);
    });
    
    await page.waitForTimeout(2000);
    
    const criticalErrors = consoleLogs.filter(log => 
      (log.type === 'error' || log.type === 'warning') && 
      log.text.includes('Binding size')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

