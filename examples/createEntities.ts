import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BufferGeometry, MeshNormalMaterial, Scene, SphereGeometry, Vector3 } from 'three';
import { FlyControls } from 'three/examples/jsm/Addons.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 50000;
const spawnSize = 2000;
const rand = Math.random;

const main = new Main();
const scene = new Scene();
const camera = new PerspectiveCameraAuto();
const controls = new FlyControls(camera, main.renderer.domElement);
controls.rollSpeed = 0.2;
controls.movementSpeed = 50;
scene.on('animate', (e) => controls.update(e.delta));

const spheres = new InstancedMesh2<{ dir: Vector3 }, BufferGeometry, MeshNormalMaterial>(new SphereGeometry(1, 32, 16), new MeshNormalMaterial(), { capacity: count, createInstances: true });
spheres.addLOD(new SphereGeometry(1, 16, 8), spheres.material, 50);
spheres.addLOD(new SphereGeometry(1, 8, 4), spheres.material, 200);
spheres.addLOD(new SphereGeometry(1, 4, 2), spheres.material, 500);

spheres.addInstances(count, (obj, index) => {
  obj.position.setX(rand() * spawnSize).setY(rand() * spawnSize).setZ(rand() * spawnSize).subScalar(spawnSize / 2);
  obj.dir = new Vector3().randomDirection();
});

spheres.on('animate', (e) => {
  spheres.updateInstancesPosition((mesh) => {
    mesh.position.add(mesh.dir.setLength((e.delta || 0.01) * 10));
  });
});

scene.add(spheres);

const gui = new GUI();
gui.add(spheres, 'instancesCount').name('instances total').disable();
const spheresCount1 = gui.add(spheres.LODinfo.objects[0], 'count').name('instances rendered LOD 1').disable();
const spheresCount2 = gui.add(spheres.LODinfo.objects[1], 'count').name('instances rendered LOD 2').disable();
const spheresCount3 = gui.add(spheres.LODinfo.objects[2], 'count').name('instances rendered LOD 3').disable();
const spheresCount4 = gui.add(spheres.LODinfo.objects[3], 'count').name('instances rendered LOD 4').disable();
gui.add(camera, 'far', 100, 4000, 100).name('camera far').onChange(() => camera.updateProjectionMatrix());

main.createView({
  scene, camera, enabled: false, onAfterRender: () => {
    spheresCount1.updateDisplay();
    spheresCount2.updateDisplay();
    spheresCount3.updateDisplay();
    spheresCount4.updateDisplay();
  }
});
