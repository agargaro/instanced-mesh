import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { HemisphereLight, AnimationAction, AnimationMixer, Matrix4, Mesh, Scene, Vector3, Fog, PlaneGeometry, MeshStandardMaterial } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InstancedMesh2 } from '../src/index.js';
import { createSimplifiedGeometry } from './objects/createSimplifiedGeometry.js';

const camera = new PerspectiveCameraAuto(50, 0.1, 100);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false, backgroundColor: 0x99ddff });

const glb = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');
const soldierGroup = glb.scene.children[0];
const soldierScale = soldierGroup.scale.x;
const dummy = soldierGroup.children[0] as Mesh;
soldierGroup.children[1].visible = false;
dummy.visible = false;

// CREATE INSTANCEDMESH2 AND LODS
const count = 10000;
const soldiers = InstancedMesh2.createFrom<{ mixer: AnimationMixer; time: number; action: AnimationAction; speed: number }>(dummy, { capacity: count, createEntities: true });
soldiers.boneTexture.maxUpdateCalls = 1000;
console.log(soldiers.boneTexture.image.width);

const paramsLOD1 = { ratio: 0, error: 1, errorAbsolute: true, sparse: true };
soldiers.addLOD(await createSimplifiedGeometry(dummy.geometry, paramsLOD1), soldiers.material, (1 / soldierScale) * 2);

const paramsLOD2 = { ratio: 0.05, error: 1 };
soldiers.addLOD(await createSimplifiedGeometry(dummy.geometry, paramsLOD2), soldiers.material, (1 / soldierScale) * 15);

const paramsLOD3 = { ratio: 0.03, error: 1 };
soldiers.addLOD(await createSimplifiedGeometry(dummy.geometry, paramsLOD3), soldiers.material, (1 / soldierScale) * 35);

// ADD INSTANCES
soldiers.addInstances(count, (obj, index) => {
  obj.position.set(Math.random() * 100 - 50, Math.random() * -400 + 20, 0).divideScalar(soldierScale);
  obj.time = 0;
  obj.color = `hsl(${Math.random() * 360}, 50%, 66%)`;
  obj.speed = Math.random() * 0.6 + 0.8;
  obj.mixer = new AnimationMixer(glb.scene);
  obj.mixer.timeScale = obj.speed;
  obj.action = obj.mixer.clipAction(glb.animations[1]).play();
});

// ANIMATE INSTANCES
let delta = 0;
const invMatrixWorld = new Matrix4();
const cameraLocalPosition = new Vector3();
soldiers.on('animate', (e) => {
  const time = e.total + 30;
  const r = 10;
  camera.position.set(Math.sin(time / 10) * r, 3 + Math.cos(time / 5), Math.cos(time / 10) * r);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  delta = e.delta;
  invMatrixWorld.copy(soldiers.matrixWorld).invert();
  cameraLocalPosition.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(invMatrixWorld);

  soldiers.updateInstancesPosition((obj) => {
    obj.position.y += ((e.delta * 10) / soldierScale) * obj.speed;
    if (obj.position.y > 150 / soldierScale) {
      obj.position.y -= 300 / soldierScale;
    }
  });
});

// UPDATE ONLY INSTANCES INSIDE FRUSTUM SETTINGS FPS BASED ON CAMERA DISTANCE
const maxFps = 60;
const minFps = 0;
soldiers.onFrustumEnter = (index) => {
  const soldier = soldiers.instances[index];
  const cameraDistance = cameraLocalPosition.distanceTo(soldier.position) * soldierScale;
  const fps = Math.min(maxFps, Math.max(minFps, 70 - cameraDistance));
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
  soldier.mixer.setTime(Math.random());
  soldier.updateBones();
}

soldierGroup.add(soldiers);

const ground = new Mesh(new PlaneGeometry(200, 200), new MeshStandardMaterial({ color: 0x669933 }));
ground.rotation.x = -Math.PI / 2;

const hemi = new HemisphereLight(0x99ddff, 0x669933, 5);
scene.add(hemi, glb.scene, ground);
scene.fog = new Fog(0x99ddff, 90, 100);
