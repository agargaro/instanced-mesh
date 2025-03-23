import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, BoxGeometry, Color, DirectionalLight, MeshLambertMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { InstancedMesh2 } from '../src/index.js';
import { PRNG } from './objects/random.js';

const config = { useBVH: true };

const main = new Main();
const random = new PRNG(150000);
const white = new Color('white');
const camera = new PerspectiveCameraAuto(70, 0.1, 30).translateZ(3);
const scene = new Scene();
scene.continuousRaycasting = true;

const geometry = new BoxGeometry(0.1, 0.1, 0.1);
const material = new MeshLambertMaterial();
const instancedMesh = new InstancedMesh2(geometry, material);

instancedMesh.addInstances(150000, (object, index) => {
  object.position.setFromSphericalCoords(random.range(0.5, 30), random.range(0, Math.PI * 2), random.range(0, Math.PI * 2));
  object.quaternion.random();
  object.color = 'white';
});

instancedMesh.on('pointerintersection', (e) => {
  const id = e.intersection.instanceId;

  if (instancedMesh.getColorAt(id).equals(white)) {
    instancedMesh.setColorAt(id, random.next() * 0xffffff);
  }
});

instancedMesh.raycastOnlyFrustum = true;
instancedMesh.computeBVH();

const dirLight = new DirectionalLight();
camera.add(dirLight);

scene.add(instancedMesh, new AmbientLight());

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.autoRotate = true;

scene.on('animate', (e) => controls.update());

main.createView({ scene, camera, backgroundColor: 'white', onAfterRender: () => spheresCount.updateDisplay() });

const bvh = instancedMesh.bvh;

const gui = new GUI();
gui.add(instancedMesh, 'capacity').disable();
const spheresCount = gui.add(instancedMesh, 'count').name('instances rendered').disable();
gui.add(config, 'useBVH').name('use BVH').onChange((value) => instancedMesh.bvh = value ? bvh : null);
gui.add(instancedMesh, 'raycastOnlyFrustum').name('raycastOnlyFrustum (if no BVH)');
