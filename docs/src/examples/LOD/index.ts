import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
} from 'three';
import { MapControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { PRNG } from './random.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const spawnRange = 10000;
const count = 1000000;

const random = new PRNG(10000);
const main = new Main({ backgroundColor: new Color(0x1a1a2e) });
const camera = new PerspectiveCameraAuto(70, 0.1, 4000)
  .translateZ(200)
  .translateY(50);
const scene = new Scene();
const controls = new MapControls(camera, main.renderer.domElement);
controls.maxDistance = 1500;
controls.maxPolarAngle = Math.PI / 2.05;

// Ground plane for reference
const ground = new Mesh(
  new PlaneGeometry(20000, 20000),
  new MeshLambertMaterial({ color: 'gray' })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const instancedMesh = new InstancedMesh2(
  new SphereGeometry(5, 30, 15),
  new MeshLambertMaterial({ color: 'limegreen' }),
  { capacity: count }
);
instancedMesh.addLOD(
  new SphereGeometry(5, 20, 10),
  new MeshLambertMaterial({ color: 'yellowgreen' }),
  100
);
instancedMesh.addLOD(
  new SphereGeometry(5, 10, 5),
  new MeshLambertMaterial({ color: 'gold' }),
  500
);
instancedMesh.addLOD(
  new SphereGeometry(5, 5, 3),
  new MeshLambertMaterial({ color: 'orangered' }),
  1000
);
instancedMesh.addLOD(
  new SphereGeometry(5, 1, 1),
  new MeshLambertMaterial({ color: 'darkred' }),
  1500
);

instancedMesh.updateInstances((object, index) => {
  object.position.set(
    random.range(-spawnRange, spawnRange),
    random.range(5, 50),
    random.range(-spawnRange, spawnRange)
  );
});

instancedMesh.computeBVH();

scene.add(camera, instancedMesh, new AmbientLight('white', 0.3));

const dirLight = new DirectionalLight('white', 2)
  .translateZ(100)
  .translateY(20);
camera.add(dirLight, dirLight.target);

main.createView({ scene, camera, enabled: false });

const gui = new GUI();
gui
  .add(camera, 'far', 100, 5000, 100)
  .name('camera far')
  .onChange(() => camera.updateProjectionMatrix());

document.getElementById('loading').remove();
