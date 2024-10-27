import { Main, PerspectiveCameraAuto, Tween } from '@three.ez/main';
import { Color, Euler, MeshBasicMaterial, PlaneGeometry, Scene, Vector3 } from 'three';
import { InstancedMesh2 } from '../src/index.js';

const main = new Main();
const scene = new Scene();
const camera = new PerspectiveCameraAuto().translateZ(2);

const planes = new InstancedMesh2(main.renderer, 20, new PlaneGeometry(), new MeshBasicMaterial(), undefined, true);

const tempColor = new Color();

planes.createInstances((obj, index) => {
  obj.scale.multiplyScalar(1 - index * 0.05);
  obj.color = index % 2 === 0 ? 'white' : 'black';

  const rotation = new Euler(0, 0, (Math.PI / 2) * index);
  const position = new Vector3(0, 0, 0.1 * index);
  const color = index % 2 === 0 ? 'yellow' : 'violet';

  new Tween(obj)
    .to(5000, { rotation, position, color }, {
      onUpdate: () => obj.updateMatrix(),
      onProgress: (t, k, s, e, a) => {
        if (k === 'color') obj.color = tempColor.lerpColors(s as Color, e as Color, a)
      }
    })
    .yoyoForever()
    .start();
});

scene.add(planes);
main.createView({ scene, camera, enabled: false });

// TODO: FIX COLOR AND TWEEN TIME 0
