import { InstancedMesh2, type InstancedMesh2Params as Params } from '@three.ez/instanced-mesh';
import { Tween } from '@three.ez/main';
import { Euler, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three';

const geo = new PlaneGeometry();
const mat = new MeshBasicMaterial()
const options: Params = { createEntities: true, allowsEuler: true };
export const planes = new InstancedMesh2(geo, mat, options);

planes.addInstances(20, (obj, index) => {
  obj.scale.multiplyScalar(1 - index * 0.05);
  obj.color = index % 2 === 0 ? 'white' : 'black';

  const rotation = new Euler(0, 0, (Math.PI / 2) * index);
  const position = new Vector3(0, 0, 0.1 * index);

  new Tween(obj)
    .to(7000, { rotation, position }, { onUpdate: () => obj.updateMatrix() })
    .yoyoForever()
    .start();
});
