import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { MeshNormalMaterial, Scene, SphereGeometry } from 'three';
import { InstancedMesh2 } from '../src/index.js';

const count = 1; // test 0 even if doesn't make any sense
const worldSize = 100;

const main = new Main(); // init renderer and other stuff
const camera = new PerspectiveCameraAuto(70, 0.1, 500).translateZ(100);
const scene = new Scene();

const instancedMesh = new InstancedMesh2(new SphereGeometry(), new MeshNormalMaterial());

scene.add(instancedMesh);

main.createView({ scene, camera, enabled: false });

setInterval(() => {
  instancedMesh.addInstance((obj, index) => {
    obj.position.randomDirection().multiplyScalar(((Math.random() * 0.99 + 0.01) * worldSize) / 2);
  });
}, 10);

// instancedMesh.createInstances((obj, index) => {
//   obj.position.randomDirection().multiplyScalar(((Math.random() * 0.99 + 0.01) * worldSize) / 2);
// }); // fix

// instancedMesh.computeBVH(); // FIX
