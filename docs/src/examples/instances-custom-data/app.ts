import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { MeshStandardMaterial, TorusKnotGeometry } from 'three';

type CustomData = { startScale: number };

const geo = new TorusKnotGeometry();
const mat = new MeshStandardMaterial()
export const torusKnots = new InstancedMesh2<CustomData>(geo, mat, { createEntities: true });

torusKnots.addInstances(9, (obj, index) => {
  obj.position.x = (index % 3 - 1) * 5;
  obj.position.y = (Math.trunc(index / 3) - 1) * 5;
  obj.quaternion.random();
  obj.color = Math.random() * 0xffffff;

  obj.startScale = Math.random();
  obj.scale.setScalar(obj.startScale);
});

torusKnots.on('animate', (e) => {
  torusKnots.updateInstances((instance) => {
    instance.rotateZ(e.delta);
    instance.scale.setScalar(Math.abs(Math.sin(instance.startScale + e.total)));
  });
});
