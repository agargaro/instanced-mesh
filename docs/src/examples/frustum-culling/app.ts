import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { MeshStandardMaterial, TorusKnotGeometry } from 'three';

const geo = new TorusKnotGeometry();
const mat = new MeshStandardMaterial()
export const torusKnots = new InstancedMesh2(geo, mat);

torusKnots.perObjectFrustumCulled = true; // default is true

torusKnots.onFrustumEnter = (index, camera) => {
  // render only if not too far away
  return torusKnots.getPositionAt(index).distanceTo(camera.position) <= 25;
};

torusKnots.addInstances(25, (obj, index) => {
  obj.position.x = (index % 5 - 2) * 5;
  obj.position.y = (Math.trunc(index / 5) - 2) * 5;
  obj.quaternion.random();
  obj.color = Math.random() * 0xffffff;
});
