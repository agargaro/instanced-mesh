import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, BoxGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshNormalMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const camera = new PerspectiveCameraAuto().translateZ(10);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
main.createView({ scene, camera });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const material = new MeshLambertMaterial();
const material2 = new MeshLambertMaterial();
const material3 = new MeshLambertMaterial();

const boxes = new InstancedMesh2(new BoxGeometry(), material, { capacity: 1 });
const boxes2 = new InstancedMesh2(new BoxGeometry(), material2);
const boxes3 = new InstancedMesh2(new BoxGeometry(), material3);

boxes.addInstances(1, (obj, index) => {
  obj.position.x = index - 5;
  obj.position.y = -1.5;
});

boxes2.addInstances(5, (obj, index) => {
  obj.position.x = index - 5;
  obj.position.y = 1.5;
});

boxes3.addInstances(5, (obj, index) => {
  obj.position.x = index - 5;
  obj.position.y = 0;
});

scene.add(boxes, boxes2, boxes3, new AmbientLight());

const overrideMaterial = new MeshBasicMaterial();

setInterval(() => {
  scene.overrideMaterial = scene.overrideMaterial !== overrideMaterial ? overrideMaterial : null;
  boxes.addInstances(1, (obj, index) => {
    obj.position.x = index - 5;
    obj.position.y = -1.5;
  });
}, 1000);
