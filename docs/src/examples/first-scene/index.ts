import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { createApp } from './app.js';
import { BoxGeometry, MeshStandardMaterial } from 'three';

const { scene } = createApp();

const boxes = new InstancedMesh2(new BoxGeometry(), new MeshStandardMaterial());
boxes.addInstances(10, (obj, index) => {
  obj.position.random().multiplyScalar(5).subScalar(2);
});

scene.add(boxes);
