import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BufferGeometry, BufferGeometryLoader, MeshNormalMaterial, Scene, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { InstancedMesh2 } from '../src/index.js';
import { createRadixSort } from '../src/utils/createRadixSort.js';

const config = {
  count: 10000,
  animatedCount: 0,
  customSort: true
}

const modelPath = 'https://threejs.org/examples/models/json/suzanne_buffergeometry.json';
const geometry = await Asset.load<BufferGeometry>(BufferGeometryLoader, modelPath);
geometry.computeVertexNormals();

const main = new Main();
const camera = new PerspectiveCameraAuto(70).translateZ(100);
const scene = new Scene();

const material = new MeshNormalMaterial();
const instancedMesh = new InstancedMesh2(main.renderer, config.count, geometry, material);

instancedMesh.createInstances((object) => {
  object.position.random().multiplyScalar(100).subScalar(50);
  object.quaternion.random();
});

instancedMesh.sortObjects = false;
const radixSort = createRadixSort(instancedMesh);
instancedMesh.customSort = radixSort;

scene.add(instancedMesh);

const axis = new Vector3(1, 0, 0);
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.autoRotate = true;

scene.on('animate', e => {
  controls.update();

  for (let i = 0; i < config.animatedCount; i++) {
    const mesh = instancedMesh.instances[i];
    mesh.rotateOnAxis(axis, e.delta);
    mesh.updateMatrix();
  }
});

main.createView({ scene, camera, enabled: false, backgroundColor: 'white', onAfterRender: () => spheresCount.updateDisplay() });

const gui = new GUI();
gui.add(instancedMesh, "maxCount").name('instances max count').disable();
const spheresCount = gui.add(instancedMesh, 'count').name('instances rendered').disable();
gui.add(config, "count", 0, instancedMesh.maxCount).name('instances count').onChange((v) => instancedMesh.instancesCount = v);
gui.add(config, "animatedCount", 0, 10000).name('instances animated');
gui.add(instancedMesh, "perObjectFrustumCulled");
gui.add(instancedMesh, "sortObjects");
gui.add(instancedMesh.material, "opacity", 0, 1).onChange((v) => {
  instancedMesh.material.transparent = v < 1;
  instancedMesh.material.depthWrite = v === 1;
  instancedMesh.material.opacity = v;
  instancedMesh.material.needsUpdate = true;
});
gui.add(config, "customSort").name('custom sort').onChange((v) => {
  instancedMesh.customSort = v ? radixSort : null;
});
