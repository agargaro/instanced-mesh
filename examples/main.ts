import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshNormalMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { CullingBVH, InstancedMesh2 } from '../src';
import { PRNG } from './random';

const main = new Main();
const count = 500000;
const animatedCount = 1;
const spawnHalfSize = 20000;
const marginBVH = spawnHalfSize / 100;
const random = new PRNG(count);

const camera = new PerspectiveCameraAuto(70).translateZ(10);
const scene = new Scene();

const instancedMesh = new InstancedMesh2<{ r: number, phi: number, theta: number }>(main.renderer, count, {
  geometry: new BoxGeometry(10, 10, 10),
  material: new MeshNormalMaterial(),
  cullingType: CullingBVH,
  bvhParams: { margin: marginBVH },
  onInstanceCreation: (object) => {
    const r = object.r = random.range(spawnHalfSize * 0.05, spawnHalfSize * 2);
    const phi = object.phi = random.range(0, Math.PI * 2);
    const theta = object.theta = random.range(0, Math.PI * 2);
    object.position.setFromSphericalCoords(r, phi, theta);
  }
});

// instancedMesh.raycastFrustum = true; // only with culling linear

instancedMesh.on('click', (e) => {
  instancedMesh.instances[e.intersection.instanceId].visible = false;
});

scene.on('animate', (e) => {
  for (let i = 0; i < animatedCount; i++) {
    const mesh = instancedMesh.instances[i];
    mesh.position.setFromSphericalCoords(mesh.r, mesh.phi + e.total * 0.01, mesh.theta + e.total * 0.01);
    mesh.updateMatrix();
  }

  // main.renderer.copyTextureToTexture(instancedMesh.instanceTexture, instancedMesh.instanceTexture,  ); // THREE.js PR to improve this?
});

scene.add(instancedMesh);

const controls = new OrbitControls(camera, main.renderer.domElement);

main.createView({ scene, camera, onAfterRender: () => spheresCount.updateDisplay() });

const gui = new GUI();
gui.add(instancedMesh, "maxCount").name('instances total').disable();
const spheresCount = gui.add(instancedMesh, 'count').name('instances rendered').disable();
gui.add(camera, 'far', 100, 5000, 20).name('camera far').onChange(() => camera.updateProjectionMatrix());
