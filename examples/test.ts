import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshNormalMaterial, Scene } from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const maxCount = 10000000;
const main = new Main(); // init renderer and other stuff
const camera = new PerspectiveCameraAuto(50, 0.1, 5000).translateZ(200);
const scene = new Scene();
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

main.createView({
  scene, camera, onAfterRender: () => {
    capacity.updateDisplay();
    instancesCount.updateDisplay();
    renderedCount.updateDisplay();
  }
});

const boxes = new InstancedMesh2(new BoxGeometry(), new MeshNormalMaterial());
boxes.on('click', (e) => boxes.setVisibilityAt(e.intersection.instanceId, false));
boxes.computeBVH({ getBBoxFromBSphere: true });
scene.add(boxes);

const event = boxes.on('animate', () => {
  boxes.addInstances(625, (obj, index) => {
    obj.position.randomDirection().multiplyScalar(Math.random() * 1000000 + 200);
    obj.scale.random().multiplyScalar(Math.random() * 10 + 5);
    obj.quaternion.random();
  });

  if (boxes.instancesCount >= maxCount) boxes.off('animate', event);
});

const gui = new GUI();
const capacity = gui.add(boxes, 'capacity').name('capacity').disable();
const instancesCount = gui.add(boxes, 'instancesCount').name('instances count').disable();
const renderedCount = gui.add(boxes, 'count').name('instances rendered').disable();
