import { InstancedMesh2 } from '../src/index.js';
import { Main, OrthographicCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshBasicMaterial, Scene } from 'three';

const count = 5;
const camera = new OrthographicCameraAuto(count).translateZ(10);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, backgroundColor: 'skyblue' });

const boxes = new InstancedMesh2(new BoxGeometry(), new MeshBasicMaterial(), { capacity: count, createEntities: true });
scene.add(boxes);

boxes.addInstances(count, (obj, index) => obj.position.setX(index));

setTimeout(() => {
  const instanceSecond = boxes.instances[1];
  instanceSecond.remove();
}, 500);

setTimeout(() => {
  const instanceThird = boxes.instances[2];
  instanceThird.remove();
}, 1000);
