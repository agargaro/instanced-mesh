import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, MeshNormalMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { CullingBVH, InstancedMesh2 } from '../src';
import { PRNG } from './random';

const main = new Main();
const count = 200000;
const random = new PRNG(count);

const camera = new PerspectiveCameraAuto(70).translateZ(10);
const scene = new Scene();

const instancedMesh = new InstancedMesh2(main.renderer, count, {
  geometry: new BoxGeometry(),
  material: new MeshNormalMaterial(),
  cullingType: CullingBVH,
  onInstanceCreation: (o) => o.position.randomDirection().multiplyScalar(random.range(5, 2000)),
});

instancedMesh.raycastFrustum = true; // only with culling linear

instancedMesh.on('click', (e) => {
  instancedMesh.instances[e.intersection.instanceId].visible = false;
});

scene.add(instancedMesh);

main.createView({ scene, camera, onAfterRender: () => spheresCount.updateDisplay() });

const controls = new OrbitControls(camera, main.renderer.domElement);
// scene.on(['pointerdown', 'pointerup', 'dragend'], (e) => (controls.enabled = e.type === 'pointerdown' ? e.target === scene : true));

const gui = new GUI();
gui.add(instancedMesh, "maxCount").name('instances total').disable();
const spheresCount = gui.add(instancedMesh, 'count').name('instances rendered').disable();
gui.add(camera, 'far', 100, 5000, 100).name('camera far').onChange(() => camera.updateProjectionMatrix());
