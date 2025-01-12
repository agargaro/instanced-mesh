import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshNormalMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const camera = new PerspectiveCameraAuto().translateZ(10);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
main.createView({ scene, camera });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const boxes = new InstancedMesh2(new BoxGeometry(), new MeshNormalMaterial());
scene.add(boxes);

boxes.addInstances(100, (obj, index) => {
  obj.position.randomDirection().multiplyScalar(Math.random() * 5);
});
