import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, BoxGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, Scene } from 'three';
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

const boxes = new InstancedMesh2(new BoxGeometry(), material, { capacity: 1 });
const boxes2 = new InstancedMesh2(new BoxGeometry(), material2);
const boxes3 = new InstancedMesh2(new BoxGeometry(), material2);

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

const box = new Mesh(new BoxGeometry(), material).translateX(2).translateY(2);
const box2 = new Mesh(new BoxGeometry(), material2).translateX(2).translateY(0.5);
const box3 = new Mesh(new BoxGeometry(), material2).translateX(2).translateY(-1);
const overrideMaterial = new MeshBasicMaterial();

scene.add(box, boxes, box2, boxes2, boxes3, box3, new AmbientLight());

setInterval(() => {
  scene.overrideMaterial = scene.overrideMaterial !== overrideMaterial ? overrideMaterial : null;
  boxes.addInstances(1, (obj, index) => {
    obj.position.x = index - 5;
    obj.position.y = -1.5;
  });
}, 1000);
