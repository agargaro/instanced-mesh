import { InstancedMesh2 } from '../src/index.js';
import { Main, OrthographicCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshBasicMaterial, Scene } from 'three';

const count = 100;

const camera = new OrthographicCameraAuto(count + count * 0.1).translateZ(10);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
main.createView({ scene, camera, backgroundColor: 'skyblue' });

const boxes = new InstancedMesh2(new BoxGeometry(), new MeshBasicMaterial(), { capacity: count });
scene.add(boxes);

boxes.addInstances(count, (obj, index) => obj.position.setX(index - count / 2));

setTimeout(() => {
  boxes.removeInstances(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
}, 200);

setTimeout(() => {
  boxes.addInstances(5, (obj, index) => obj.position.setX(index - count / 2).setY(10));
}, 400);

setTimeout(() => {
  boxes.removeInstances(20, 21, 22, 23, 24, 25, 26, 27, 28, 29);
}, 600);

setTimeout(() => {
  boxes.addInstances(5, (obj, index) => obj.position.setX(index - count / 2).setY(10));
}, 800);

boxes.on('click', (e) => {
  boxes.removeInstances(e.intersection.instanceId);
});

boxes.computeBVH();
