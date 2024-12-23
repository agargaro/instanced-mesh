import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, Color, DirectionalLight, MeshLambertMaterial, Scene, SphereGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';
import { PRNG } from './objects/random.js';

const spawnRange = 10000;

const random = new PRNG(10000);
const camera = new PerspectiveCameraAuto().translateZ(100).translateY(20);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const instancedMeshLOD = new InstancedMesh2(new SphereGeometry(5, 30, 15), new MeshLambertMaterial(), { capacity: 1000000 });

instancedMeshLOD.addLOD(new SphereGeometry(5, 20, 10), new MeshLambertMaterial(), 50);
instancedMeshLOD.addLOD(new SphereGeometry(5, 10, 5), new MeshLambertMaterial(), 500);
instancedMeshLOD.addLOD(new SphereGeometry(5, 5, 3), new MeshLambertMaterial(), 1000);

instancedMeshLOD.addInstances(1000000, (object, index) => {
  object.position.x = random.range(-spawnRange, spawnRange);
  object.position.z = random.range(-spawnRange, spawnRange);
  object.color = 'white';
});

instancedMeshLOD.computeBVH();

const white = new Color('white');
instancedMeshLOD.on('pointermove', (e) => {
  const id = e.intersection.instanceId;
  if (instancedMeshLOD.getColorAt(id).equals(white)) {
    instancedMeshLOD.setColorAt(id, Math.random() * 0xffffff);
  }
});

scene.add(instancedMeshLOD, new AmbientLight(), new DirectionalLight().translateZ(3.5));
