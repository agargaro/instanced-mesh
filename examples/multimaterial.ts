import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshBasicMaterial, MeshNormalMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const camera = new PerspectiveCameraAuto().translateZ(10);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
main.createView({ scene, camera, enabled: false });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const materials = [
  new MeshBasicMaterial({ color: 'red' }),
  new MeshNormalMaterial(),
  new MeshNormalMaterial(),
  new MeshNormalMaterial(),
  new MeshNormalMaterial(),
  new MeshNormalMaterial()
];
const boxes = new InstancedMesh2(new BoxGeometry(), materials);
scene.add(boxes);

boxes.addInstances(100000, (o) => {
  o.position.randomDirection().multiplyScalar(Math.random() * 1000 + 20);
});
