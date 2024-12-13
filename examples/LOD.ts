import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, MeshLambertMaterial, Scene, SphereGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';
import { PRNG } from './objects/random.js';

const spawnRange = 10000;

const random = new PRNG(10000);
const camera = new PerspectiveCameraAuto(70, 0.1, 2000).translateZ(100).translateY(20);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const instancedMeshLOD = new InstancedMesh2(new SphereGeometry(5, 30, 15), new MeshLambertMaterial({ color: 'green' }), { capacity: 1000000 });

instancedMeshLOD.addLOD(new SphereGeometry(5, 30, 15), new MeshLambertMaterial({ color: 'green' }));
instancedMeshLOD.addLOD(new SphereGeometry(5, 20, 10), new MeshLambertMaterial({ color: 'yellow' }), 50);
instancedMeshLOD.addLOD(new SphereGeometry(5, 10, 5), new MeshLambertMaterial({ color: 'orange' }), 500);
instancedMeshLOD.addLOD(new SphereGeometry(5, 5, 3), new MeshLambertMaterial({ color: 'red' }), 1000);

instancedMeshLOD.addInstances(1000000, (object, index) => {
  object.position.x = random.range(-spawnRange, spawnRange);
  object.position.z = random.range(-spawnRange, spawnRange);
});

instancedMeshLOD.computeBVH();

scene.add(instancedMeshLOD, new AmbientLight(), new DirectionalLight().translateZ(3.5));
