import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { DirectionalLight, MeshLambertMaterial, OctahedronGeometry, Scene, SpotLight } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { InstancedMesh2 } from '../src/index.js';
import { PRNG } from './objects/random.js';

const config = {
  count: 200000,
  animatedCount: 2000,
  spawnRadius: 100000,
  marginBVH: 100
}

const main = new Main();
const random = new PRNG(config.count);

const camera = new PerspectiveCameraAuto(70, 0.1, 10000).translateZ(10);
const scene = new Scene();

const geometry = new OctahedronGeometry(1, 2);
const material = new MeshLambertMaterial({ flatShading: true });
const instancedMesh = new InstancedMesh2<{ r: number, phi: number, theta: number }>(main.renderer, config.count, geometry, material);

instancedMesh.createInstances((object) => {
  const r = object.r = random.range(config.spawnRadius * 0.05, config.spawnRadius);
  const phi = object.phi = random.range(0, Math.PI * 2);
  const theta = object.theta = random.range(0, Math.PI * 2);
  object.position.setFromSphericalCoords(r, phi, theta);
  object.scale.multiplyScalar(random.range(1, 50))
});

instancedMesh.computeBVH({ margin: config.marginBVH });

instancedMesh.on('click', (e) => {
  instancedMesh.instances[e.intersection.instanceId].visible = false;
});

instancedMesh.cursor = 'pointer';

const dirLight = new DirectionalLight('white', 0.1);
const spotLight = new SpotLight('white', 75000, 0, Math.PI / 6, 0.5, 1.4);
camera.add(dirLight, spotLight);

scene.add(instancedMesh, dirLight.target, spotLight.target);

scene.on('animate', (e) => {
  camera.getWorldDirection(spotLight.target.position).multiplyScalar(100).add(camera.position);
  camera.getWorldDirection(dirLight.target.position).multiplyScalar(100).add(camera.position);

  for (let i = 0; i < config.animatedCount; i++) {
    const mesh = instancedMesh.instances[i];
    mesh.position.setFromSphericalCoords(mesh.r, mesh.phi + e.total * 0.01, mesh.theta + e.total * 0.01);
    mesh.updateMatrix();
  }
});

const controls = new MapControls(camera, main.renderer.domElement);
controls.panSpeed = 100;

main.createView({ scene, camera, onAfterRender: () => spheresCount.updateDisplay() });

const gui = new GUI();
gui.add(instancedMesh, "maxCount").name('instances max count').disable();
const spheresCount = gui.add(instancedMesh, 'count').name('instances rendered').disable();
gui.add(config, "count", 0, instancedMesh.maxCount).name('instances count').onChange((v) => instancedMesh.instancesCount = v);
gui.add(config, "animatedCount", 0, 10000).name('instances animated');
gui.add(camera, 'far', 100, config.spawnRadius, 20).name('camera far').onChange(() => camera.updateProjectionMatrix());
