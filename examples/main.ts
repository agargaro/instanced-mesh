import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshBasicMaterial, Object3D, Scene } from 'three';
import { InstancedMesh2 } from '../src';

const main = new Main();

const camera = new PerspectiveCameraAuto(70).translateZ(10);
const scene = new Scene();
const count = 100;

const instancedMesh = new InstancedMesh2(count, {
  geometry: new BoxGeometry(1, 1, 1),
  material: new MeshBasicMaterial({ color: 'blue' }),
  onInstanceCreation: (o) => o.position.randomDirection()
});

scene.add(instancedMesh)

main.createView({ scene, camera });
