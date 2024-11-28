import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { DirectionalLight, MeshLambertMaterial, OctahedronGeometry, Scene, SpotLight, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { InstancedMesh2 } from '../src/index.js';
import { PRNG } from './objects/random.js';

const config = {
  count: 50000,
  animatedCount: 50000,
  spawnRadius: 3000,
  marginBVH: 75
};

const random = new PRNG(config.count);
const main = new Main();
const camera = new PerspectiveCameraAuto(70, 0.1, config.spawnRadius / 2).translateZ(10);
const scene = new Scene();

scene.continuousRaycasting = true;

const geometry = new OctahedronGeometry(1, 2);
const material = new MeshLambertMaterial({ flatShading: true });
const instancedMesh = new InstancedMesh2<{ dir: Vector3 }>({ geometry, material, capacity: config.count });

instancedMesh.createInstances((object) => {
  object.dir = new Vector3().randomDirection();
  object.position.randomDirection().multiplyScalar(random.range(0.05, 1) * config.spawnRadius);
  object.scale.multiplyScalar(random.range(1, 5));
});

instancedMesh.computeBVH({ margin: config.marginBVH, getBBoxFromBSphere: true, accurateCulling: false });

instancedMesh.on('click', (e) => {
  instancedMesh.instances[e.intersection.instanceId].visible = false;
});

instancedMesh.cursor = 'pointer';

const dirLight = new DirectionalLight('white', 0.1);
const spotLight = new SpotLight('white', 3000, 0, Math.PI / 6, 0.5, 1.4);
camera.add(dirLight, spotLight);

scene.add(instancedMesh, dirLight.target, spotLight.target);

scene.on('animate', (e) => {
  controls.update(e.delta);

  camera.getWorldDirection(spotLight.target.position).multiplyScalar(100).add(camera.position);
  camera.getWorldDirection(dirLight.target.position).multiplyScalar(100).add(camera.position);

  if (e.delta === 0) return;

  const speed = e.delta * 10;
  for (let i = 0; i < config.animatedCount; i++) {
    const mesh = instancedMesh.instances[i];
    mesh.position.add(mesh.dir.setLength(speed));
    mesh.updateMatrixPosition();
  }
});

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.panSpeed = 100;

main.createView({ scene, camera, onAfterRender: () => spheresCount.updateDisplay() });

const gui = new GUI();
gui.add(instancedMesh, 'capacity').name('instances max count').disable();
const spheresCount = gui.add(instancedMesh, 'count').name('instances rendered').disable();
gui.add(config, 'count', 0, instancedMesh.capacity).name('instances count').onChange((v) => instancedMesh.instancesCount = v);
gui.add(config, 'animatedCount', 0, 50000).name('instances animated');
gui.add(camera, 'far', 100, config.spawnRadius, 20).name('camera far').onChange(() => camera.updateProjectionMatrix());
