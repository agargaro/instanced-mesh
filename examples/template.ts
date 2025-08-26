import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import {
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  Scene,
  SphereGeometry
} from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';
import { PRNG } from './objects/random.js';

const spawnRange = 30;
const random = new PRNG(10000);
const camera = new PerspectiveCameraAuto()
  .translateX(7)
  .translateY(3)
  .translateZ(7);
camera.lookAt(0, 0, 0);
const scene = new Scene();
const main = new Main();
// main.renderer.shadowMap.enabled = true;
main.renderer.shadowMap.type = PCFSoftShadowMap;
main.createView({ scene, camera, backgroundColor: 'white' });

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const materialArgs = { transparent: true, color: 'red' };
const instancedMeshLOD = new InstancedMesh2(
  new SphereGeometry(0.3, 30, 15),
  new MeshStandardMaterial(materialArgs),
  { capacity: 1000000 }
);
instancedMeshLOD.castShadow = true;
instancedMeshLOD.receiveShadow = true;
instancedMeshLOD.addLOD(
  new SphereGeometry(0.3, 3, 3),
  new MeshStandardMaterial(materialArgs),
  10
);
instancedMeshLOD.addInstances(2500, (object, index) => {
  // object.position.x = random.range(-spawnRange, spawnRange);
  // object.position.y = random.range(-spawnRange, spawnRange);
  object.position.x = index % 50 - 25;
  object.position.y = Math.floor(index / 50) - 25;
  object.position.z = 5.0;
  object.color = 'white';
});
instancedMeshLOD.computeBVH();

const dirLight = new DirectionalLight(0xffffff, 2);
dirLight.castShadow = true;
dirLight.position.set(0, 5, 0);
dirLight.shadow.mapSize.width = 512; // default
dirLight.shadow.mapSize.height = 512; // default
dirLight.shadow.camera.near = 0.5; // default
dirLight.shadow.camera.far = 500; // default
dirLight.shadow.camera.left = -5;
dirLight.shadow.camera.right = -5;
dirLight.shadow.camera.top = 5;
dirLight.shadow.camera.bottom = -5;

const dirLightHelper = new DirectionalLightHelper(
  dirLight,
  500,
  new Color(255, 0, 0)
);

scene.add(instancedMeshLOD, dirLight, dirLightHelper); // , csmHelper);
