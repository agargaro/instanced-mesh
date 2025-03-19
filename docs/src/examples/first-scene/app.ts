import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { MeshStandardMaterial, TorusKnotGeometry } from 'three';

export const boxes = new InstancedMesh2(new TorusKnotGeometry(), new MeshStandardMaterial());

boxes.addInstances(9, (obj, index) => {
  obj.position.x = (index % 3 - 1) * 5;
  obj.position.y = (Math.trunc(index / 3) - 1) * 5;
  obj.quaternion.random();
  obj.color = Math.random() * 0xffffff;
});
