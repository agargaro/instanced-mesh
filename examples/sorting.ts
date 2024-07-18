import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshNormalMaterial, Scene, Vector3 } from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { CullingLinear, InstancedMesh2, RenderListItem } from '../src';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { radixSort } from 'three/examples/jsm/utils/SortUtils';

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
  cullingType: CullingLinear,
  bvhParams: { margin: config.marginBVH },
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
  instancedMesh.customSort = v ? sortFunction : null;
});

const options = {
  get: el => el.depth,
  aux: new Array(config.count),
  reversed: null
};

// https://github.com/mrdoob/three.js/blob/master/examples/webgl_mesh_batch.html#L291
function sortFunction(list: RenderListItem[]): void {
  options.reversed = instancedMesh.material.transparent;

  let minZ = Infinity;
  let maxZ = - Infinity;

  for (const { depth } of list) {
    if (depth > maxZ) maxZ = depth;
    if (depth < minZ) minZ = depth;
  }

  // convert depth to unsigned 32 bit range
  const depthDelta = maxZ - minZ;
  const factor = (2 ** 32 - 1) / depthDelta; // UINT32_MAX / z range
  for (const item of list) {
    item.depth = (item.depth - minZ) * factor;
  }

  // perform a fast-sort using the hybrid radix sort function
  radixSort(list, options);
}
