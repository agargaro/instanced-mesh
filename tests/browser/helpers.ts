import { expect } from 'vitest';
import { BoxGeometry, BufferGeometry, Camera, Material, MeshBasicMaterial, OrthographicCamera, Scene, WebGLRenderer, WebGLRenderTarget } from 'three';
import { InstancedMesh2, InstancedMesh2Params } from '../../src/index.js';

export interface TestScene {
  renderer: WebGLRenderer;
  target: WebGLRenderTarget;
  scene: Scene;
  camera: OrthographicCamera;
  mesh(params?: InstancedMesh2Params, geometry?: BufferGeometry, material?: Material | Material[]): InstancedMesh2;
  render(view?: Camera): void;
  pixel(x: number, rgb: number[], tolerance?: number, y?: number): void;
  dispose(): void;
}

export function createTestScene(): TestScene {
  const renderer = new WebGLRenderer({ antialias: false });
  renderer.setSize(64, 64);
  renderer.setClearColor(0x000000, 1);
  renderer.debug.onShaderError = (gl, program, vertex, fragment): void => {
    throw new Error([gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment)].join('\n'));
  };
  const target = new WebGLRenderTarget(64, 64);
  renderer.setRenderTarget(target);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.z = 2;
  camera.updateMatrixWorld();
  const meshes: InstancedMesh2[] = [];

  return {
    renderer, target, scene, camera,
    mesh(params: InstancedMesh2Params = {}, geometry: BufferGeometry = new BoxGeometry(0.5, 0.5, 0.5), material: Material | Material[] = new MeshBasicMaterial()): InstancedMesh2 {
      const mesh = new InstancedMesh2(geometry, material, { capacity: 4, renderer, ...params });
      meshes.push(mesh);
      scene.add(mesh);
      return mesh;
    },
    render(view: Camera = camera): void {
      renderer.render(scene, view);
      const gl = renderer.getContext();
      expect(gl.getError()).toBe(gl.NO_ERROR);
    },
    pixel(x: number, rgb: number[], tolerance = 1, y = 32): void {
      const data = new Uint8Array(4);
      renderer.readRenderTargetPixels(target, x, y, 1, 1, data);
      for (let i = 0; i < 3; i++) expect(Math.abs(data[i] - rgb[i])).toBeLessThanOrEqual(tolerance);
    },
    dispose(): void {
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      for (const mesh of meshes) {
        mesh.traverse((object) => {
          const child = object as InstancedMesh2;
          if (child.geometry) geometries.add(child.geometry);
          if (child.material) for (const material of Array.isArray(child.material) ? child.material : [child.material]) materials.add(material);
        });
        mesh.dispose();
      }
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      target.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}

export function expectNumbers(actual: ArrayLike<number>, expected: ArrayLike<number>, precision = 5): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) expect(actual[i]).toBeCloseTo(expected[i], precision);
}

export function renderedIds(mesh: InstancedMesh2): number[] {
  return Array.from(mesh.instanceIndex.array.slice(0, mesh.count));
}
