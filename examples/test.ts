import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { MeshNormalMaterial, Scene, SphereGeometry } from 'three';
import { InstancedMesh2 } from '../src/index.js';

let count = 1; // test 0 even if doesn't make any sense
const worldSize = 100;

const main = new Main(); // init renderer and other stuff
const camera = new PerspectiveCameraAuto(70, 0.1, 500).translateZ(100);
const scene = new Scene();

const instancedMesh = new InstancedMesh2(null, count, new SphereGeometry(), new MeshNormalMaterial());
instancedMesh.createInstances((obj, index) => {
  obj.position.randomDirection().multiplyScalar(((Math.random() * 0.99 + 0.01) * worldSize) / 2);
});

// instancedMesh.computeBVH(); // FIX

scene.add(instancedMesh);

main.createView({ scene, camera, enabled: false });

setInterval(() => {
  instancedMesh.resizeBuffers(++count);
  instancedMesh.instancesCount++;

  instancedMesh.instances[count - 1].position.randomDirection().multiplyScalar(((Math.random() * 0.99 + 0.01) * worldSize) / 2);
  instancedMesh.instances[count - 1].updateMatrix();

  // instancedMesh.updateInstances((obj, index) => {
  //   obj.position.randomDirection().multiplyScalar(((Math.random() * 0.99 + 0.01) * worldSize) / 2);
  // }, count - 1);
}, 100);
