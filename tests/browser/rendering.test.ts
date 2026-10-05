import { afterEach, beforeEach, expect, test } from 'vitest';
import { Matrix4, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene, WebGLRenderer, WebGLRenderTarget } from 'three';
import { InstancedMesh2 } from '../../src/index.js';

let renderer: WebGLRenderer;
let target: WebGLRenderTarget;
let scene: Scene;
let camera: OrthographicCamera;
let geometry: PlaneGeometry;
let material: MeshBasicMaterial;
let instances: InstancedMesh2;

beforeEach(() => {
  renderer = new WebGLRenderer({ antialias: false });
  renderer.setSize(64, 64);
  renderer.setClearColor(0x000000, 1);
  renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader): void => {
    throw new Error([gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertexShader), gl.getShaderInfoLog(fragmentShader)].join('\n'));
  };
  target = new WebGLRenderTarget(64, 64);
  renderer.setRenderTarget(target);
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 2;
  geometry = new PlaneGeometry(0.75, 0.75);
  material = new MeshBasicMaterial({ color: 0xffffff });
  instances = new InstancedMesh2(geometry, material, { capacity: 1, renderer });
  instances.addInstances(1, (entity) => entity.position.set(-0.5, 0, 0));
  scene.add(instances);
});

afterEach(() => {
  instances?.dispose();
  geometry?.dispose();
  material?.dispose();
  target?.dispose();
  renderer?.dispose();
  renderer?.forceContextLoss();
});

function expectPixel(x: number, rgb: number[]): void {
  const pixel = new Uint8Array(4);
  renderer.readRenderTargetPixels(target, x, 32, 1, 1, pixel);
  for (let channel = 0; channel < 3; channel++) {
    expect(Math.abs(pixel[channel] - rgb[channel])).toBeLessThanOrEqual(1);
  }
  expect(pixel[3]).toBe(255);
}

test('renders color, matrix and visibility updates through the real renderer', () => {
  instances.setColorAt(0, 0xff0000);
  renderer.render(scene, camera);
  expectPixel(16, [255, 0, 0]);
  expectPixel(48, [0, 0, 0]);

  instances.setColorAt(0, 0x0000ff);
  instances.setMatrixAt(0, new Matrix4().makeTranslation(0.5, 0, 0));
  renderer.render(scene, camera);
  expectPixel(16, [0, 0, 0]);
  expectPixel(48, [0, 0, 255]);

  instances.setVisibilityAt(0, false);
  renderer.render(scene, camera);
  expectPixel(48, [0, 0, 0]);

  instances.setVisibilityAt(0, true);
  renderer.render(scene, camera);
  expectPixel(48, [0, 0, 255]);
});

test('isolates renderer patches for a material shared with a regular mesh in either render order', () => {
  const regular = new Mesh(geometry, material);
  regular.position.x = 0.5;
  scene.add(regular);
  instances.setColorAt(0, 0xff0000);
  const originalGet = renderer.properties.get;
  const originalCompile = material.onBeforeCompile;
  const originalCacheKey = material.customProgramCacheKey;

  for (const instanceOrder of [0, 2]) {
    instances.renderOrder = instanceOrder;
    regular.renderOrder = 1;
    renderer.render(scene, camera);
    expectPixel(16, [255, 0, 0]);
    expectPixel(48, [255, 255, 255]);
    expect(renderer.properties.get).toBe(originalGet);
    expect(material.onBeforeCompile).toBe(originalCompile);
    expect(material.customProgramCacheKey).toBe(originalCacheKey);
  }
});
