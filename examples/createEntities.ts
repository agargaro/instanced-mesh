import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { MeshNormalMaterial, Scene, SphereGeometry, Vector3 } from 'three';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 100000;
const worldSize = 20000;

const main = new Main({ rendererParameters: { antialias: true } }); // init renderer and other stuff
const camera = new PerspectiveCameraAuto(70, 0.1, 500);
const scene = new Scene();

const spheres = new InstancedMesh2<{ dir: Vector3 }>(main.renderer, count, new SphereGeometry(), new MeshNormalMaterial());

spheres.createInstances((obj, index) => {
  obj.position.randomDirection().multiplyScalar(((Math.random() * 0.99 + 0.01) * worldSize) / 2);
  obj.dir = new Vector3().randomDirection();
});

spheres.on('animate', (e) => {
  for (const mesh of spheres.instances) {
    mesh.position.add(mesh.dir.setLength((e.delta || 0.01) * 2));
    mesh.updateMatrix();
  }
});

scene.add(spheres);

main.createView({scene, camera, enabled: false, onAfterRender: () => spheresCount.updateDisplay() });

const controls = new FlyControls(camera, main.renderer.domElement);
controls.rollSpeed = Math.PI / 10;
controls.movementSpeed = 50;
scene.on('animate', (e) => controls.update(e.delta));

const gui = new GUI();
gui.add(spheres.instances as any, 'length').name('instances total').disable();
const spheresCount = gui.add(spheres, 'count').name('instances rendered').disable();
gui.add(camera, 'far', 100, 5000, 100).name('camera far').onChange(() => camera.updateProjectionMatrix());
