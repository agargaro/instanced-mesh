import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { MeshNormalMaterial, Scene, SphereGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const main = new Main(); // init renderer and other stuff
const camera = new PerspectiveCameraAuto().translateZ(1100);
const scene = new Scene();
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();
main.createView({ scene, camera, enabled: false });

const instancedMesh = new InstancedMesh2(new SphereGeometry(1, 16, 8), new MeshNormalMaterial());
scene.add(instancedMesh);

setInterval(() => {
  instancedMesh.addInstance((obj, index) => {
    obj.position.randomDirection().multiplyScalar(Math.random() * 1000 + 50);
  });
}, 10);
