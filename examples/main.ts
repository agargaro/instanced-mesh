import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshBasicMaterial, Object3D, Scene } from 'three';
import { InstancedMesh2 } from '../src';

const main = new Main();

const camera = new PerspectiveCameraAuto(70).translateZ(10);
const scene = new Scene();
const count = 100;

const instancedMesh = new InstancedMesh2(count, new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 'blue' }));
scene.add(instancedMesh)

const dolly = new Object3D();

for (let i = 0; i < count; i++) {
  dolly.position.randomDirection();
  dolly.updateMatrix();
  instancedMesh.setMatrixAt(i, dolly.matrix);
}

main.createView({ scene, camera });
