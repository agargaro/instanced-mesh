import { InstancedMesh2, type InstancedMesh2Params as Params } from '@three.ez/instanced-mesh';
import { Tween } from '@three.ez/main';
import { Color, Euler, MeshBasicMaterial, PlaneGeometry } from 'three';

const geo = new PlaneGeometry();
const mat = new MeshBasicMaterial()
const options: Params = { createEntities: true, allowsEuler: true };
export const planes = new InstancedMesh2(geo, mat, options);

planes.addInstances(20, (obj, index) => {
  obj.position.z -= index;
  obj.scale.setScalar(2 + index * 2);
  obj.color = new Color().setHSL(0, 0, index % 2 === 1 ? index / 19 : (19 - index) / 19);

  const rotation = new Euler(0, 0, (Math.PI / 2) * (19 - index));

  new Tween(obj)
    .to(4000, { rotation }, { easing: 'easeInOutCubic', onUpdate: obj.updateMatrix })
    .yoyoForever()
    .start();
});
