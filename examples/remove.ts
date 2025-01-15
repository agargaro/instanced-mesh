import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, DirectionalLight, MeshLambertMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const camera = new PerspectiveCameraAuto().translateZ(10);
camera.add(new DirectionalLight('white', 3));
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
main.createView({ scene, camera, backgroundColor: 'skyblue' });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const boxes = new InstancedMesh2(new BoxGeometry(), new MeshLambertMaterial());
scene.add(boxes);

boxes.addInstances(20, (obj, index) => {
  obj.position.randomDirection().multiplyScalar(Math.random() * 5);
  obj.quaternion.random();
  obj.color = Math.random() * 0xfffff;
});

boxes.computeBVH();

boxes.on('click', (e) => {
  boxes.removeInstances(e.intersection.instanceId);
});
