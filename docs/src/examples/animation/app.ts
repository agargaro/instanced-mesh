import { InstancedMesh2, type InstancedMesh2Params as Params } from '@three.ez/instanced-mesh';
import { MeshStandardMaterial, TorusKnotGeometry } from 'three';

const geo = new TorusKnotGeometry();
const mat = new MeshStandardMaterial()
const options: Params = { createEntities: true };
export const torusKnots = new InstancedMesh2(geo, mat, options);

torusKnots.addInstances(9, (obj, index) => {
  obj.position.x = (index % 3 - 1) * 5;
  obj.position.y = (Math.trunc(index / 3) - 1) * 5;
  obj.quaternion.random();
  obj.color = Math.random() * 0xffffff;
});

torusKnots.on('animate', (e) => {
  torusKnots.updateInstances((instance) => {
    instance.rotateZ(e.delta);
  });
});
