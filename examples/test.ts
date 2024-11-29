import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshNormalMaterial, Scene } from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const main = new Main(); // init renderer and other stuff
const camera = new PerspectiveCameraAuto().translateZ(200);
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

const instancedMesh = new InstancedMesh2(new BoxGeometry(), new MeshNormalMaterial(), { capacity: undefined });
instancedMesh.on('click', (e) => instancedMesh.setVisibilityAt(e.intersection.instanceId, false));
scene.add(instancedMesh);

scene.on('animate', () => {
  if (instancedMesh.instancesCount >= 1000000) return;

  instancedMesh.addInstances(625, (obj, index) => {
    obj.position.randomDirection().multiplyScalar(Math.random() * 100000 + 200);
    obj.scale.random().multiplyScalar(Math.random() * 5 + 1);
    obj.quaternion.random();
  });

  if (instancedMesh.instancesCount === 625) { // FIX
    instancedMesh.computeBVH({ getBBoxFromBSphere: true }); // fix if count is 0
  }
});

const gui = new GUI();
const capacity = gui.add(instancedMesh, 'capacity').name('capacity').disable();
const instancesCount = gui.add(instancedMesh, 'instancesCount').name('instances count').disable();
const renderedCount = gui.add(instancedMesh, 'count').name('instances rendered').disable();
