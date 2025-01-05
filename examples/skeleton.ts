import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, AnimationMixer, Matrix4, Mesh, Scene, Vector3 } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 1000;

const camera = new PerspectiveCameraAuto().translateZ(-5).rotateY(Math.PI);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false, backgroundColor: 0x99DDFF });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const glb = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');

const dummy = glb.scene.children[0].children[0] as Mesh;
glb.scene.children[0].children[1].visible = false;
dummy.visible = false;

const indexAnimation = [0, 1, 3];

const soldiers = InstancedMesh2.createFrom<{ mixer: AnimationMixer; time: number }>(dummy, { capacity: count, createEntities: true });

soldiers.addInstances(count, (obj, index) => {
  obj.position.set(Math.random() * 2000 - 2000 / 2, Math.random() * 200 - 100, 0).divideScalar(0.01);
  obj.time = 0;
  obj.mixer = new AnimationMixer(glb.scene);
  obj.mixer.clipAction(glb.animations[indexAnimation[1]]).play();
});

let delta = 0;
const invMatrixWorld = new Matrix4();
const cameraLocalPosition = new Vector3();
soldiers.on('animate', (e) => {
  delta = e.delta;
  invMatrixWorld.copy(soldiers.matrixWorld).invert();
  cameraLocalPosition.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(invMatrixWorld);

  soldiers.updateInstancesPosition((obj) => {
    obj.translateY(e.delta * 1000);
  });
});

soldiers.onFrustumEnter = (index) => {
  const soldier = soldiers.instances[index];
  const fps = Math.max(10, 5000 - cameraLocalPosition.distanceTo(soldier.position) * 0.5);
  soldier.time += delta;

  if (soldier.time >= 1 / fps) {
    soldier.mixer.update(soldier.time);
    soldier.updateBones();
    soldier.time %= 1 / fps;
  }

  return true;
};

// init all skeleton.. should be auto?
for (const soldier of soldiers.instances) {
  soldier.mixer.setTime(0);
  soldier.updateBones();
}

glb.scene.children[0].add(soldiers);
scene.add(new AmbientLight(), glb.scene);
