import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { MeshNormalMaterial, Scene, SphereGeometry, Vector3 } from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { InstancedMesh2 } from '../src/index.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { PRNG } from './objects/random.js';

const count = 100000;
const worldSize = 500;
const startInstances = 25;

const main = new Main({ rendererParameters: { antialias: true } }); // init renderer and other stuff
const random = new PRNG(10000);


const camera = new PerspectiveCameraAuto(70, 0.1, 5000).translateZ(500).translateY(20);
const controls = new OrbitControls(camera, main.renderer.domElement);

const scene = new Scene();

function afterCreation (obj, index) {
  obj.position.randomDirection().multiplyScalar(((random.range(0, 0.99) + 0.01) * worldSize) / 2);
  obj.dir = new Vector3().randomDirection();
}

const spheres = new InstancedMesh2<{ dir: Vector3 }>(main.renderer, count, new SphereGeometry(5), new MeshNormalMaterial());
for (let i = 0; i < startInstances; i++) {
  spheres.createInstance(afterCreation);
}


setInterval(() => {
  spheres.createInstance(afterCreation);
}, 400);

setInterval(() => {
    const index = Math.floor(random.range(0, spheres.numEntities)); 
    spheres.removeInstance(spheres.instances[index]);
  }, 500);

spheres.on('animate', (e) => {
  for (const mesh of spheres.instances) {
    if (mesh) {
      mesh.position.add(mesh.dir.setLength((e.delta || 0.01) * 2));
      mesh.updateMatrix();
    }
  }
});

scene.add(spheres);

main.createView({scene, camera, enabled: false, onAfterRender: () => {
    instancesCount.updateDisplay()
}});

scene.on('animate', (e) => controls.update(e.delta));

const gui = new GUI();
const instancesCount = gui.add(spheres, 'numEntities').name('instances total').disable();
gui.add(camera, 'far', 100, 5000, 100).name('camera far').onChange(() => camera.updateProjectionMatrix());
