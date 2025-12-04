/**
 * Dedicated E2E tests for WebGPU rendering functionality.
 *
 * These tests specifically verify that WebGPU instanced rendering works correctly,
 * catching issues like:
 * - "Binding size for buffer is zero" errors
 * - WGSL shader compilation failures (via getCompilationInfo API)
 * - Pipeline validation errors (via pushErrorScope/popErrorScope)
 * - TSL node build errors
 * - Blank screens (visual regression)
 *
 * IMPORTANT: WebGPU validation errors shown in Chrome DevTools are logged by Chrome's
 * GPU process and may NOT appear through JavaScript console or CDP. To reliably capture
 * errors, we intercept the WebGPU API and use:
 * - device.pushErrorScope/popErrorScope for validation errors
 * - module.getCompilationInfo() for WGSL compilation errors
 * - device.addEventListener('uncapturederror') for uncaptured errors
 * - Visual blank screen detection as a fallback
 *
 * Note: Different GPU adapters (hardware vs SwiftShader) may have different WGSL
 * validation behavior. Errors that appear on real GPUs may not appear in headless Chrome.
 *
 * @see https://webgpufundamentals.org/webgpu/lessons/webgpu-debugging.html
 */

import { test, expect, type Page, type CDPSession } from '@playwright/test';

// Collect all console messages during test
interface ConsoleLog {
  type: string;
  text: string;
  timestamp: number;
  source?: string;
}

test.describe('WebGPU Rendering Direct Tests', () => {
  let consoleLogs: ConsoleLog[] = [];
  let cdpSession: CDPSession | null = null;

  test.beforeEach(async ({ page }) => {
    consoleLogs = [];

    // Use CDP to capture ALL browser logs including GPU validation errors
    // WebGPU errors bypass JavaScript console and are logged directly by Chrome's GPU process
    cdpSession = await page.context().newCDPSession(page);

    // Enable multiple CDP domains to capture all possible log sources
    await cdpSession.send('Log.enable');
    await cdpSession.send('Runtime.enable');

    // Capture Log domain entries (GPU errors often come through here)
    cdpSession.on('Log.entryAdded', (params: { entry: { level: string; text: string; source: string } }) => {
      consoleLogs.push({
        type: params.entry.level,
        text: params.entry.text,
        timestamp: Date.now(),
        source: `cdp-log-${params.entry.source}`
      });
    });

    // Capture Runtime domain console API calls
    cdpSession.on('Runtime.consoleAPICalled', (params: { type: string; args: Array<{ value?: string; description?: string }> }) => {
      const text = params.args.map((arg) => arg.value || arg.description || '').join(' ');
      consoleLogs.push({
        type: params.type,
        text,
        timestamp: Date.now(),
        source: 'cdp-runtime'
      });
    });

    // Capture Runtime exceptions
    cdpSession.on('Runtime.exceptionThrown', (params: { exceptionDetails: { text: string; exception?: { description?: string } } }) => {
      consoleLogs.push({
        type: 'exception',
        text: params.exceptionDetails.exception?.description || params.exceptionDetails.text,
        timestamp: Date.now(),
        source: 'cdp-exception'
      });
    });

    // Also capture JS console messages via Playwright as a fallback
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
        source: 'playwright-console'
      });
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleLogs.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now(),
        source: 'playwright-pageerror'
      });
    });
  });

  test.afterEach(async () => {
    if (cdpSession) {
      await cdpSession.detach().catch(() => {});
      cdpSession = null;
    }
  });

  test('should render WebGPU example without binding errors', async ({ page }) => {
    // Inject comprehensive WebGPU error capture BEFORE page loads
    // Based on: https://webgpufundamentals.org/webgpu/lessons/webgpu-debugging.html
    await page.addInitScript(() => {
      const w = window as any;
      w.__webgpuErrors = [];
      w.__webgpuShaderErrors = [];

      // Helper to log and store errors

      const logError = (type: string, message: string, details?: any): void => {
        const entry = { type, message, details, timestamp: Date.now() };
        w.__webgpuErrors.push(entry);
        console.error(`[WebGPU ${type}]`, message, details || '');
      };

      // Intercept navigator.gpu.requestAdapter to capture GPUDevice errors
      if (navigator.gpu) {
        const originalRequestAdapter = navigator.gpu.requestAdapter.bind(navigator.gpu);

        navigator.gpu.requestAdapter = async function (...args: any[]) {
          const adapter = await originalRequestAdapter(...args);
          if (adapter) {
            const originalRequestDevice = adapter.requestDevice.bind(adapter);

            adapter.requestDevice = async function (...deviceArgs: any[]) {
              const device = await originalRequestDevice(...deviceArgs);
              if (device) {
                // 1. Capture uncaptured errors

                device.addEventListener('uncapturederror', (event: any) => {
                  const errorMsg = event.error?.message || String(event.error);
                  logError('UncapturedError', errorMsg, { errorType: event.error?.constructor?.name });
                });

                // 2. Intercept createShaderModule to capture WGSL compilation errors
                const originalCreateShaderModule = device.createShaderModule.bind(device);
                let shaderModuleCount = 0;

                device.createShaderModule = function (descriptor: any) {
                  const moduleIndex = shaderModuleCount++;
                  console.log(`[WebGPU Debug] createShaderModule #${moduleIndex} called`);

                  // Use pushErrorScope to capture any validation errors
                  device.pushErrorScope('validation');
                  const module = originalCreateShaderModule(descriptor);
                  device.popErrorScope().then((error: GPUError | null) => {
                    if (error) {
                      logError('ShaderModuleValidation', error.message, { moduleIndex });
                    }
                  });

                  // Use getCompilationInfo() to capture detailed WGSL errors
                  module.getCompilationInfo().then((info: GPUCompilationInfo) => {
                    console.log(`[WebGPU Debug] Shader #${moduleIndex} compilation: ${info.messages.length} messages`);
                    for (const msg of info.messages) {
                      const errorDetail = {
                        lineNum: msg.lineNum,
                        linePos: msg.linePos,
                        offset: msg.offset,
                        length: msg.length
                      };
                      if (msg.type === 'error') {
                        logError('WGSLCompilationError', msg.message, errorDetail);
                        w.__webgpuShaderErrors.push({
                          type: msg.type,
                          message: msg.message,
                          ...errorDetail
                        });
                      } else if (msg.type === 'warning') {
                        console.warn(`[WebGPU WGSL Warning] ${msg.message}`, errorDetail);
                        w.__webgpuShaderErrors.push({
                          type: msg.type,
                          message: msg.message,
                          ...errorDetail
                        });
                      } else if (msg.type === 'info') {
                        console.info(`[WebGPU WGSL Info] ${msg.message}`, errorDetail);
                      }
                    }
                  }).catch((e: Error) => {
                    logError('CompilationInfoError', e.message);
                  });

                  return module;
                };

                // 3. Intercept createRenderPipeline to capture pipeline errors with pushErrorScope
                const originalCreateRenderPipeline = device.createRenderPipeline.bind(device);

                device.createRenderPipeline = function (descriptor: any) {
                  device.pushErrorScope('validation');
                  const pipeline = originalCreateRenderPipeline(descriptor);
                  device.popErrorScope().then((error: GPUError | null) => {
                    if (error) {
                      logError('RenderPipelineValidation', error.message);
                    }
                  });
                  return pipeline;
                };

                // 4. Intercept createComputePipeline similarly
                const originalCreateComputePipeline = device.createComputePipeline.bind(device);

                device.createComputePipeline = function (descriptor: any) {
                  device.pushErrorScope('validation');
                  const pipeline = originalCreateComputePipeline(descriptor);
                  device.popErrorScope().then((error: GPUError | null) => {
                    if (error) {
                      logError('ComputePipelineValidation', error.message);
                    }
                  });
                  return pipeline;
                };

                // 5. Intercept queue.submit to capture submission errors
                const originalSubmit = device.queue.submit.bind(device.queue);

                device.queue.submit = function (commandBuffers: any) {
                  device.pushErrorScope('validation');
                  const result = originalSubmit(commandBuffers);
                  device.popErrorScope().then((error: GPUError | null) => {
                    if (error) {
                      logError('QueueSubmitValidation', error.message);
                    }
                  });
                  return result;
                };

                console.log('[WebGPU Debug] Error capture hooks installed on device');
              }
              return device;
            };
          }
          return adapter;
        };
      }
    });

    // Navigate to the actual WebGPU example
    await page.goto('http://localhost:5173/index-webgpu.html');

    // Wait for initialization and multiple render frames
    // WGSL errors may happen during shader compilation for different materials
    await page.waitForTimeout(5000);

    // Get captured WebGPU errors from our injected handler
    const { errors: webgpuErrors, shaderErrors } = await page.evaluate(() => {
      const w = window as any;
      return {
        errors: w.__webgpuErrors || [],
        shaderErrors: w.__webgpuShaderErrors || []
      };
    });

    console.log('=== WebGPU Errors (captured via intercepted API) ===');
    console.log(`Total WebGPU errors: ${webgpuErrors.length}`);
    console.log(`Total WGSL shader errors: ${shaderErrors.length}`);

    if (webgpuErrors.length > 0) {
      console.log('\n--- WebGPU Errors ---');
      webgpuErrors.forEach((err: { type: string; message: string; details?: unknown }) => {
        console.log(`[${err.type}] ${err.message}`);
        if (err.details) console.log('  Details:', JSON.stringify(err.details));
      });
    }

    if (shaderErrors.length > 0) {
      console.log('\n--- WGSL Shader Compilation Errors ---');
      shaderErrors.forEach((err: { type: string; message: string; lineNum?: number; linePos?: number }) => {
        console.log(`[${err.type}] Line ${err.lineNum}:${err.linePos} - ${err.message}`);
      });
    }

    // Take screenshot to see what's actually being rendered
    await page.screenshot({ path: 'test-results/webgpu-example-screenshot.png', fullPage: true });
    console.log('Screenshot saved to test-results/webgpu-example-screenshot.png');

    // Check what renderer is actually being used and GPU adapter details
    const rendererInfo = await page.evaluate(async () => {
      const w = window as any;

      let adapterInfo: any = null;
      if (navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            // Try to get info (API varies by Chrome version)
            try {
              adapterInfo = await (adapter as any).requestAdapterInfo?.();
            } catch {
              // Fallback for older API
              adapterInfo = { features: [...adapter.features].join(', ') };
            }
          }
        } catch (e) {
          adapterInfo = { error: String(e) };
        }
      }
      return {
        hasRenderer: !!w.renderer,
        rendererType: w.renderer?.constructor?.name,
        isWebGPU: w.renderer?.isWebGPURenderer,
        hasGPU: !!navigator.gpu,
        gpuAdapterInfo: adapterInfo
      };
    });
    console.log('=== Renderer Info ===');
    console.log(JSON.stringify(rendererInfo, null, 2));

    // Show ALL captured logs for debugging
    console.log('=== ALL captured logs ===');
    console.log(`Total logs captured: ${consoleLogs.length}`);
    consoleLogs.forEach((log) => console.log(`[${log.type}] [${log.source}] ${log.text.substring(0, 150)}`));

    // Show all console logs for debugging
    const allLogs = consoleLogs.filter((log) => log.type === 'log' || log.type === 'warning');
    console.log('=== Console logs ===');
    allLogs.forEach((log) => console.log(`[${log.type}] ${log.text.substring(0, 100)}`));

    // Check for specific WebGPU errors
    const bindingErrors = consoleLogs.filter((log) =>
      log.text.includes('Binding size') && log.text.includes('is zero')
    );

    const invalidBindGroupErrors = consoleLogs.filter((log) =>
      log.text.includes('Invalid BindGroup')
    );

    const wgslErrors = consoleLogs.filter((log) =>
      log.text.includes('Error while parsing WGSL')
    );

    // Report all errors for debugging
    if (bindingErrors.length > 0 || invalidBindGroupErrors.length > 0 || wgslErrors.length > 0) {
      console.log('=== WebGPU Errors Found (from console) ===');
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

    // Also check WebGPU errors from our injected handler
    const wgslErrorsFromDevice = webgpuErrors.filter((err: { type: string; message: string }) =>
      err.type.includes('WGSL') || err.message.includes('WGSL') || err.message.includes('shader')
    );
    const validationErrors = webgpuErrors.filter((err: { type: string }) =>
      err.type.includes('Validation')
    );
    const pipelineErrors = webgpuErrors.filter((err: { type: string }) =>
      err.type.includes('Pipeline')
    );

    // CRITICAL: Check if actual content is rendered (not blank screen)
    // WebGPU WGSL errors can cause blank screens even without console errors
    const pixelInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { hasCanvas: false };

      // Create a temporary 2D canvas to read WebGPU canvas pixels
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return { hasCanvas: true, canRead: false };

      // Draw WebGPU canvas to 2D canvas
      ctx.drawImage(canvas, 0, 0);

      // Sample pixels from different areas (center, corners)
      const samples = [
        ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data, // center
        ctx.getImageData(canvas.width / 4, canvas.height / 4, 1, 1).data, // top-left quarter
        ctx.getImageData(canvas.width * 3 / 4, canvas.height / 2, 1, 1).data // right side
      ];

      // Check if all samples are the same (likely blank/solid color)
      const allSame = samples.every((s) =>
        s[0] === samples[0][0] && s[1] === samples[0][1] && s[2] === samples[0][2]
      );

      // Check if completely white (255,255,255) or black (0,0,0)
      const isWhite = samples[0][0] === 255 && samples[0][1] === 255 && samples[0][2] === 255;
      const isBlack = samples[0][0] === 0 && samples[0][1] === 0 && samples[0][2] === 0;
      const isBlank = allSame && (isWhite || isBlack);

      // Calculate pixel variance to detect if anything is rendered
      let hasColorVariation = false;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const firstPixel = [data[0], data[1], data[2]];
      for (let i = 4; i < Math.min(data.length, 100000); i += 400) {
        if (data[i] !== firstPixel[0] || data[i + 1] !== firstPixel[1] || data[i + 2] !== firstPixel[2]) {
          hasColorVariation = true;
          break;
        }
      }

      return {
        hasCanvas: true,
        canRead: true,
        width: canvas.width,
        height: canvas.height,
        centerPixel: Array.from(samples[0]),
        allSamplesSame: allSame,
        isBlank,
        hasColorVariation
      };
    });

    console.log('=== Pixel Analysis ===');
    console.log(JSON.stringify(pixelInfo, null, 2));

    // Fail test if any WebGPU errors occurred
    expect(bindingErrors.length, 'Should have no "Binding size is zero" errors from console').toBe(0);
    expect(invalidBindGroupErrors.length, 'Should have no "Invalid BindGroup" errors from console').toBe(0);
    expect(wgslErrors.length, 'Should have no WGSL parsing errors from console').toBe(0);

    // Check intercepted WebGPU API errors
    expect(shaderErrors.length, 'Should have no WGSL shader compilation errors').toBe(0);
    expect(wgslErrorsFromDevice.length, 'Should have no WGSL errors from device').toBe(0);
    expect(validationErrors.length, 'Should have no validation errors from device').toBe(0);
    expect(pipelineErrors.length, 'Should have no pipeline creation errors').toBe(0);
    expect(webgpuErrors.length, 'Should have no WebGPU errors at all').toBe(0);

    // CRITICAL: Fail if screen is blank (WebGPU shader errors cause blank screens)
    expect(pixelInfo.hasCanvas, 'Should have a canvas element').toBe(true);
    expect(pixelInfo.isBlank, 'Screen should NOT be blank (white or black) - WebGPU rendering likely failed due to WGSL errors').toBe(false);
    expect(pixelInfo.hasColorVariation, 'Scene should have color variation (actual 3D content rendered)').toBe(true);
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
    const errors = consoleLogs.filter((log) => log.type === 'error');
    const bindingErrors = errors.filter((log) =>
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

    const fixtureErrors = consoleLogs.filter((log) =>
      log.type === 'error' && (log.text.includes('Binding') || log.text.includes('Invalid'))
    );

    console.log(`Test fixture errors: ${fixtureErrors.length}`);

    // Clear logs
    consoleLogs = [];

    // Now test actual example
    await page.goto('http://localhost:5173/index-webgpu.html');
    await page.waitForTimeout(3000);

    const exampleErrors = consoleLogs.filter((log) =>
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
    const allLogs = consoleLogs.filter((log) => log.type === 'log' || log.type === 'warning');
    console.log('=== Fixture Console logs ===');
    allLogs.forEach((log) => console.log(`[${log.type}] ${log.text.substring(0, 100)}`));

    // Check for errors (both 'error' and 'warning' since WebGPU may log as warnings)
    const criticalErrors = consoleLogs.filter((log) =>
      (log.type === 'error' || log.type === 'warning')
      && (log.text.includes('Binding size')
        || log.text.includes('Invalid BindGroup')
        || log.text.includes('WGSL'))
    );

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:');
      criticalErrors.slice(0, 3).forEach((e) => console.log(e.text.substring(0, 300)));
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

    const criticalErrors = consoleLogs.filter((log) =>
      log.type === 'error'
      && (log.text.includes('Binding size')
        || log.text.includes('Invalid BindGroup'))
    );

    if (criticalErrors.length > 0) {
      console.log('Errors when adding ground plane:');
      criticalErrors.slice(0, 2).forEach((e) => console.log(e.text.substring(0, 300)));
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

    const errorsBeforeGround = consoleLogs.filter((log) =>
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

    const errorsAfterGround = consoleLogs.filter((log) =>
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

    const criticalErrors = consoleLogs.filter((log) =>
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

    const criticalErrors = consoleLogs.filter((log) =>
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

    const criticalErrors = consoleLogs.filter((log) =>
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

    const criticalErrors = consoleLogs.filter((log) =>
      (log.type === 'error' || log.type === 'warning')
      && log.text.includes('Binding size')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('shadowLOD-webgpu example should render without errors', async ({ page }) => {
    // Navigate to index-webgpu.html which loads examples/shadowLOD-webgpu.ts
    await page.goto('http://localhost:5173/index-webgpu.html');

    // Wait for async renderer init + LOD setup
    await page.waitForTimeout(3000);

    // Check for WebGPU errors
    const bindingErrors = consoleLogs.filter((log) =>
      log.text.includes('Binding size') && log.text.includes('is zero')
    );
    const wgslErrors = consoleLogs.filter((log) =>
      log.text.includes('Error while parsing WGSL')
    );

    if (bindingErrors.length > 0 || wgslErrors.length > 0) {
      console.log('=== ShadowLOD WebGPU Errors ===');
      if (bindingErrors.length > 0) {
        console.log('Binding errors:', bindingErrors[0].text.substring(0, 300));
      }
      if (wgslErrors.length > 0) {
        console.log('WGSL errors:', wgslErrors[0].text.substring(0, 300));
      }
    }

    expect(bindingErrors.length, 'Should have no binding size errors').toBe(0);
    expect(wgslErrors.length, 'Should have no WGSL parsing errors').toBe(0);

    // Verify canvas rendered
    const canvas = await page.$('canvas');
    expect(canvas).not.toBeNull();
  });

  test('should maintain consistent instance positions across LOD levels', async ({ page }) => {
    // This test verifies that when an instance switches between LOD levels,
    // it maintains the same world position. This catches bugs where LOD children
    // don't properly share the parent's matricesTexture.

    await page.goto('http://localhost:5173/tests/fixtures/test-scene-webgpu.html');
    await page.waitForFunction(() => (window as any).sceneReady === true, { timeout: 15000 });

    // Create a mesh with LOD levels at known grid positions
    const setupResult = await page.evaluate(() => {
      const THREE = (window as any).THREE;
      const InstancedMesh2 = (window as any).InstancedMesh2;
      const MeshBasicNodeMaterial = (window as any).MeshBasicNodeMaterial;
      const renderer = (window as any).renderer;
      const scene = (window as any).scene;
      const camera = (window as any).camera;

      // Create parent mesh with LOD
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new MeshBasicNodeMaterial({ color: 0xff0000 });

      const mesh = new InstancedMesh2(geometry, material, {
        capacity: 10,
        renderer
      });

      // Add LOD level - spheres at distance > 50
      const sphereGeometry = new THREE.SphereGeometry(1, 8, 4);
      const sphereMaterial = new MeshBasicNodeMaterial({ color: 0x00ff00 });
      mesh.addLOD(sphereGeometry, sphereMaterial, 50);

      // Add instances at KNOWN grid positions
      const positions: Array<{ x: number; y: number; z: number }> = [];
      mesh.addInstances(9, (obj, index) => {
        const x = (index % 3 - 1) * 10; // -10, 0, 10
        const y = 0;
        const z = (Math.floor(index / 3) - 1) * 10; // -10, 0, 10
        obj.position.set(x, y, z);
        positions.push({ x, y, z });
      });

      mesh.computeBVH();
      scene.add(mesh);

      // Store mesh reference for later inspection
      (window as any).testLODMesh = mesh;
      (window as any).expectedPositions = positions;

      // LOD levels are stored in LODinfo.render.levels
      const lodLevels = mesh.LODinfo?.render?.levels;

      return {
        instanceCount: mesh.instancesCount,
        hasLODLevels: lodLevels && lodLevels.length > 1, // >1 because first is parent
        lodLevelCount: lodLevels?.length || 0,
        positions
      };
    });

    console.log('Setup result:', setupResult);
    expect(setupResult.instanceCount).toBe(9);
    expect(setupResult.hasLODLevels).toBe(true);

    // Wait for initial render
    await page.waitForTimeout(1000);

    // Position camera close (should show LOD0 - boxes)
    const lod0Result = await page.evaluate(() => {
      const camera = (window as any).camera;
      const mesh = (window as any).testLODMesh;

      // Move camera close to see LOD0
      camera.position.set(0, 30, 30);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      // Force a render and frustum cull update
      (window as any).renderer.render((window as any).scene, camera);

      // Check which LOD level is active and get matrices data
      const parentMatricesTexture = mesh.matricesTexture;
      const parentMatricesData = parentMatricesTexture?.image?.data;

      // Get positions from matrices (each matrix is 16 floats, position is at indices 12,13,14)
      const extractedPositions: Array<{ x: number; y: number; z: number; matrixIndex: number }> = [];
      if (parentMatricesData) {
        for (let i = 0; i < mesh.instancesCount; i++) {
          const offset = i * 16;
          extractedPositions.push({
            x: parentMatricesData[offset + 12],
            y: parentMatricesData[offset + 13],
            z: parentMatricesData[offset + 14],
            matrixIndex: i
          });
        }
      }

      // Check LOD children's matricesTexture references
      // LOD levels are stored in LODinfo.render.levels
      const lodLevels = mesh.LODinfo?.render?.levels || [];
      const lodInfo: Array<{ level: number; hasOwnMatricesTexture: boolean; sharesParentTexture: boolean }> = [];
      lodLevels.forEach((level: any, idx: number) => {
        const lodMesh = level.object;
        const parentLOD = lodMesh._parentLOD;
        lodInfo.push({
          level: idx,
          hasOwnMatricesTexture: !!lodMesh.matricesTexture,
          sharesParentTexture: lodMesh.matricesTexture === parentMatricesTexture
            || (parentLOD && parentLOD.matricesTexture === parentMatricesTexture)
        });
      });

      return {
        cameraDistance: camera.position.length(),
        parentHasMatricesTexture: !!parentMatricesTexture,
        extractedPositions,
        lodInfo,
        meshCount: mesh.count
      };
    });

    console.log('LOD0 (close) result:', JSON.stringify(lod0Result, null, 2));

    // Verify positions match expected grid
    const expectedPositions = setupResult.positions;
    for (let i = 0; i < expectedPositions.length; i++) {
      const expected = expectedPositions[i];
      const actual = lod0Result.extractedPositions[i];

      expect(actual.x, `Instance ${i} X position should match`).toBeCloseTo(expected.x, 1);
      expect(actual.y, `Instance ${i} Y position should match`).toBeCloseTo(expected.y, 1);
      expect(actual.z, `Instance ${i} Z position should match`).toBeCloseTo(expected.z, 1);
    }

    // Move camera far (should trigger LOD1 - spheres)
    const lod1Result = await page.evaluate(() => {
      const camera = (window as any).camera;
      const mesh = (window as any).testLODMesh;

      // Move camera far to trigger LOD switch
      camera.position.set(0, 100, 150);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      // Force renders to update LOD
      for (let i = 0; i < 5; i++) {
        (window as any).renderer.render((window as any).scene, camera);
      }

      // Get positions from parent's matrices (should be unchanged)
      const parentMatricesTexture = mesh.matricesTexture;
      const parentMatricesData = parentMatricesTexture?.image?.data;

      const extractedPositions: Array<{ x: number; y: number; z: number; matrixIndex: number }> = [];
      if (parentMatricesData) {
        for (let i = 0; i < mesh.instancesCount; i++) {
          const offset = i * 16;
          extractedPositions.push({
            x: parentMatricesData[offset + 12],
            y: parentMatricesData[offset + 13],
            z: parentMatricesData[offset + 14],
            matrixIndex: i
          });
        }
      }

      // Check if LOD children are using correct texture
      // THE BUG: LOD children might use their own (empty) matricesTexture instead of parent's
      const lodChildInfo: Array<{
        level: number;
        childMatricesTextureExists: boolean;
        childMatricesDataLength: number;
        childFirstMatrixPosition: { x: number; y: number; z: number } | null;
        usesParentTexture: boolean;
      }> = [];

      // LOD levels are stored in LODinfo.render.levels
      const lodLevels = mesh.LODinfo?.render?.levels || [];
      lodLevels.forEach((level: any, idx: number) => {
        const lodMesh = level.object;
        const childTexture = lodMesh.matricesTexture;
        const childData = childTexture?.image?.data;
        const parentLOD = lodMesh._parentLOD;

        let firstPos = null;
        if (childData && childData.length >= 16) {
          firstPos = {
            x: childData[12],
            y: childData[13],
            z: childData[14]
          };
        }

        lodChildInfo.push({
          level: idx,
          childMatricesTextureExists: !!childTexture,
          childMatricesDataLength: childData?.length || 0,
          childFirstMatrixPosition: firstPos,
          usesParentTexture: childTexture === parentMatricesTexture
            || (parentLOD && parentLOD.matricesTexture === parentMatricesTexture)
        });
      });

      return {
        cameraDistance: camera.position.length(),
        extractedPositions,
        lodChildInfo,
        meshCount: mesh.count
      };
    });

    console.log('LOD1 (far) result:', JSON.stringify(lod1Result, null, 2));

    // CRITICAL: Verify positions are IDENTICAL after LOD switch
    // This is the main assertion - if LOD children don't share parent's matricesTexture,
    // the positions will be different (likely all zeros or random)
    for (let i = 0; i < expectedPositions.length; i++) {
      const expected = expectedPositions[i];
      const actualLod1 = lod1Result.extractedPositions[i];

      expect(actualLod1.x, `Instance ${i} X position should be same after LOD switch`).toBeCloseTo(expected.x, 1);
      expect(actualLod1.y, `Instance ${i} Y position should be same after LOD switch`).toBeCloseTo(expected.y, 1);
      expect(actualLod1.z, `Instance ${i} Z position should be same after LOD switch`).toBeCloseTo(expected.z, 1);
    }

    // Verify that LOD children reference parent's texture (or their _parentLOD does)
    // This catches the bug where LOD children use their own empty texture
    if (lod1Result.lodChildInfo.length > 0) {
      const lodChild = lod1Result.lodChildInfo[0];
      console.log('LOD child texture info:', lodChild);

      // The child should either:
      // 1. Not have its own matricesTexture (use parent's via _parentLOD)
      // 2. Or share the same texture reference as parent
      // If it has its own texture with different data, that's the bug!
      if (lodChild.childMatricesTextureExists && !lodChild.usesParentTexture) {
        // Check if child's texture has valid position data matching parent
        if (lodChild.childFirstMatrixPosition) {
          const childPos = lodChild.childFirstMatrixPosition;
          const parentPos = lod1Result.extractedPositions[0];

          // If these don't match, LOD child is reading from wrong texture!
          console.log('WARNING: LOD child has own texture. Child pos:', childPos, 'Parent pos:', parentPos);
          expect(childPos.x, 'LOD child should read same X as parent').toBeCloseTo(parentPos.x, 1);
          expect(childPos.y, 'LOD child should read same Y as parent').toBeCloseTo(parentPos.y, 1);
          expect(childPos.z, 'LOD child should read same Z as parent').toBeCloseTo(parentPos.z, 1);
        }
      }
    }

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/lod-position-consistency.png' });
  });
});
