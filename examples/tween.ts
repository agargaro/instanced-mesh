import { Main, PerspectiveCameraAuto, Tween } from '@three.ez/main';
import { Color, Euler, MeshBasicMaterial, PlaneGeometry, Scene, Vector3 } from 'three';
import { InstancedMesh2 } from '../src/index.js';

const main = new Main();
const scene = new Scene();
main.createView({ scene, camera: new PerspectiveCameraAuto().translateZ(2), enabled: false });
const tempColor = new Color();

const planes = new InstancedMesh2(new PlaneGeometry(), new MeshBasicMaterial(), { createInstances: true, allowsEuler: true });
scene.add(planes);

planes.addInstances(20, (obj, index) => {
  obj.scale.multiplyScalar(1 - index * 0.05);
  obj.color = index % 2 === 0 ? 'red' : 'blue';

  const rotation = new Euler(0, 0, (Math.PI / 2) * index);
  const position = new Vector3(0, 0, 0.1 * index);
  const color = index % 2 === 0 ? 'yellow' : 'violet';

  new Tween(obj)
    .to(5000, { rotation, position, color }, {
      onUpdate: () => obj.updateMatrix(),
      onProgress: (t, k, s, e, a) => {
        if (k === 'color') obj.color = tempColor.lerpColors(s as Color, e as Color, a);
      }
    })
    .yoyoForever()
    .start();
});

// TODO: FIX COLOR AND TWEEN TIME 0
