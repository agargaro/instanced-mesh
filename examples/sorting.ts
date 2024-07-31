import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshNormalMaterial, Scene, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { InstancedMesh2 } from '../src';
import { createRadixSort } from '../src/utils/createRadixSort';

const config = {
  count: 20000,
  animatedCount: 0,
  marginBVH: 5,
  customSort: false
}

const main = new Main();

const camera = new PerspectiveCameraAuto(70).translateZ(5);
const scene = new Scene();

const instancedMesh = new InstancedMesh2(main.renderer, config.count, {
  geometry: new BoxGeometry(0.1, 0.1, 0.1),
  material: new MeshNormalMaterial({ transparent: true, opacity: 0.2, depthWrite: false }),
  bvh: { margin: config.marginBVH },
  sortObjects: true,
  onInstanceCreation: (object) => {
    object.position.random().multiplyScalar(5).subScalar(2.5);
    object.quaternion.random();
  }
});

scene.add(instancedMesh);

const axis = new Vector3(1, 0, 0);
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;

scene.on('animate', (e) => {
  controls.update();

  for (let i = 0; i < config.animatedCount; i++) {
    const mesh = instancedMesh.instances[i];
    mesh.rotateOnAxis(axis, e.delta);
    mesh.updateMatrix();
  }
});

main.createView({ scene, camera, enabled: false, backgroundColor: 'white', onAfterRender: () => spheresCount.updateDisplay() });

const radixSort = createRadixSort(instancedMesh);

const gui = new GUI();
gui.add(instancedMesh, "maxCount").name('instances max count').disable();
const spheresCount = gui.add(instancedMesh, 'count').name('instances rendered').disable();
gui.add(config, "count", 0, instancedMesh.maxCount).name('instances count').onChange((v) => instancedMesh.instancesCount = v);
gui.add(config, "animatedCount", 0, 20000).name('instances animated');
gui.add(instancedMesh, "sortObjects").name('sort objects');
gui.add(instancedMesh.material, "opacity", 0, 1).name('opacity').onChange(v => {
  instancedMesh.material.transparent = v < 1;
  instancedMesh.material.depthWrite = v == 1;
  instancedMesh.material.opacity = v;
});
gui.add(config, "customSort").name('custom sort').onChange(v => {
  instancedMesh.customSort = v ? radixSort : null;
});
