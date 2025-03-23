import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { MeshNormalMaterial, Scene, SphereGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { createRadixSort, InstancedMesh2 } from '../src/index.js';

const config = {
  count: 20000,
  customSort: true
};

const main = new Main();
const camera = new PerspectiveCameraAuto().translateZ(10);
const scene = new Scene();

const material = new MeshNormalMaterial({ transparent: true, opacity: 0.5, depthWrite: false });
const instancedMesh = new InstancedMesh2(new SphereGeometry(1, 16, 8), material, { capacity: config.count, createEntities: true });

instancedMesh.addInstances(config.count, (object) => {
  object.position.random().multiplyScalar(100).subScalar(50);
});

instancedMesh.sortObjects = true;
const radixSort = createRadixSort(instancedMesh);
instancedMesh.customSort = radixSort;

scene.add(instancedMesh);

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.autoRotate = true;

scene.on('animate', (e) => controls.update());

main.createView({ scene, camera, enabled: false, backgroundColor: 'white', onAfterRender: () => spheresCount.updateDisplay() });

const gui = new GUI();
gui.add(instancedMesh, 'capacity').name('instances capacity').disable();
const spheresCount = gui.add(instancedMesh, 'count').name('instances rendered').disable();
gui.add(instancedMesh, 'perObjectFrustumCulled');
gui.add(instancedMesh, 'sortObjects');
gui.add(instancedMesh.material, 'opacity', 0, 1).onChange((v) => {
  instancedMesh.material.transparent = v < 1;
  instancedMesh.material.depthWrite = v === 1;
  instancedMesh.material.opacity = v;
  instancedMesh.material.needsUpdate = true;
});
gui.add(config, 'customSort').name('custom sort').onChange((v) => {
  instancedMesh.customSort = v ? radixSort : null;
});
