import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { MeshStandardMaterial, TorusKnotGeometry } from 'three';

const geo = new TorusKnotGeometry();
const mat = new MeshStandardMaterial()
export const torusKnots = new InstancedMesh2(geo, mat, { createEntities: true });

torusKnots.addInstances(9, (obj, index) => {
  obj.position.x = (index % 3 - 1) * 5;
  obj.position.y = (Math.trunc(index / 3) - 1) * 5;
  obj.quaternion.random();
});

torusKnots.instances[2].color = 'red';
torusKnots.instances[4].color = 'green';
torusKnots.instances[6].color = 'blue';
