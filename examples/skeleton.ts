import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AnimationMixer, BufferGeometry, DirectionalLight, Fog, HemisphereLight, Interpolant, Matrix4, Mesh, MeshStandardMaterial, PlaneGeometry, PropertyMixer, Scene, Vector3 } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createSimplifiedGeometry } from './objects/createSimplifiedGeometry.js';
import { createInstancedMesh2From } from '../src/index.js';

const excludedBones = new Set([
  'mixamorigLeftHand', 'mixamorigLeftHandThumb1', 'mixamorigLeftHandThumb2', 'mixamorigLeftHandThumb3',
  'mixamorigLeftHandIndex1', 'mixamorigLeftHandIndex2', 'mixamorigLeftHandIndex3',
  'mixamorigLeftHandMiddle1', 'mixamorigLeftHandMiddle2', 'mixamorigLeftHandMiddle3',
  'mixamorigLeftHandRing1', 'mixamorigLeftHandRing2', 'mixamorigLeftHandRing3',
  'mixamorigLeftHandPinky1', 'mixamorigLeftHandPinky2', 'mixamorigLeftHandPinky3',
  'mixamorigRightHand', 'mixamorigRightHandThumb1', 'mixamorigRightHandThumb2', 'mixamorigRightHandThumb3',
  'mixamorigRightHandIndex1', 'mixamorigRightHandIndex2', 'mixamorigRightHandIndex3',
  'mixamorigRightHandMiddle1', 'mixamorigRightHandMiddle2', 'mixamorigRightHandMiddle3',
  'mixamorigRightHandRing1', 'mixamorigRightHandRing2', 'mixamorigRightHandRing3',
  'mixamorigRightHandPinky1', 'mixamorigRightHandPinky2', 'mixamorigRightHandPinky3',
  'mixamorigLeftFoot', 'mixamorigLeftToeBase', 'mixamorigRightFoot', 'mixamorigRightToeBase'
]);

const camera = new PerspectiveCameraAuto(50, 0.1, 100);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false, backgroundColor: 0x99ddff });

const glb = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');
const soldierGroup = glb.scene.children[0];
const soldierScale = soldierGroup.scale.x;
const dummy = soldierGroup.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
soldierGroup.children[1].visible = false;
dummy.removeFromParent();

const mixer = new AnimationMixer(glb.scene);
const action = mixer.clipAction(glb.animations[1]).play();

// SIMPLIFY ACTION FOR LODs
const propertyBindings = (action as any)._propertyBindings as PropertyMixer[];
const interpolants = (action as any)._interpolants as Interpolant[];
const propertyBindingsLOD: PropertyMixer[] = [];
const interpolantsLOD: Interpolant[] = [];

for (let i = 0; i < propertyBindings.length; i++) {
  const boneName = propertyBindings[i].binding.node.name as string;

  if (!excludedBones.has(boneName)) {
    propertyBindingsLOD.push(propertyBindings[i]);
    interpolantsLOD.push(interpolants[i]);
  }
}

const geometry = dummy.geometry;
dummy.geometry = await createSimplifiedGeometry(geometry, { ratio: 0.1, error: 1, lockBorder: true });

// CREATE INSTANCEDMESH2 AND LODS
const count = 5000;
const soldiers = createInstancedMesh2From<{ time: number; speed: number; offset: number }>(dummy, { capacity: count, createEntities: true });

soldiers.addLOD(await createSimplifiedGeometry(geometry, { ratio: 0.07, error: 1 }), dummy.material, (1 / soldierScale) * 10);
soldiers.addLOD(await createSimplifiedGeometry(geometry, { ratio: 0.05, error: 1 }), dummy.material, (1 / soldierScale) * 30);
soldiers.addLOD(await createSimplifiedGeometry(geometry, { ratio: 0.03, error: 1 }), dummy.material, (1 / soldierScale) * 50);
soldiers.addLOD(await createSimplifiedGeometry(geometry, { ratio: 0.02, error: 1, prune: true }), dummy.material, (1 / soldierScale) * 70);

// ADD INSTANCES
soldiers.addInstances(count, (obj, index) => {
  obj.position.set(Math.random() * 100 - 50, Math.random() * -200 + 100, 0).divideScalar(soldierScale);
  obj.color = `hsl(${Math.random() * 360}, 50%, 75%)`;
  obj.time = 0;
  obj.offset = Math.random() * 5;
  obj.speed = Math.random() * 0.5 + 1;
});

// INIT SKELETON DATA
for (const soldier of soldiers.instances) {
  mixer.setTime(soldier.offset);
  soldier.updateBones();
}

// ANIMATE INSTANCES
let delta = 0;
let total = 0;
const radiusMovement = 15;
const invMatrixWorld = new Matrix4();
const cameraLocalPosition = new Vector3();
scene.on('animate', (e) => {
  delta = e.delta;
  total = e.total;
  const time = e.total * 2 + 30;
  camera.position.set(Math.sin(time / 10) * radiusMovement, 3 + Math.cos(time / 5), Math.cos(time / 10) * radiusMovement);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  invMatrixWorld.copy(soldiers.matrixWorld).invert();
  cameraLocalPosition.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(invMatrixWorld);
});

// UPDATE ONLY INSTANCES INSIDE FRUSTUM SETTINGS FPS BASED ON CAMERA DISTANCE
const maxFps = 60;
const minFps = 5;
soldiers.onFrustumEnter = (index, camera, cameraLOD, LODindex) => {
  const soldier = soldiers.instances[index];
  const cameraDistance = cameraLocalPosition.distanceTo(soldier.position) * soldierScale;
  const fps = Math.min(maxFps, Math.max(minFps, 70 - cameraDistance));
  soldier.time += delta;

  if (soldier.time >= 1 / fps) {
    soldier.time %= 1 / fps;

    if (LODindex === 0) {
      (mixer as any)._bindings = propertyBindings;
      (mixer as any)._nActiveBindings = propertyBindings.length;
      (action as any)._propertyBindings = propertyBindings;
      (action as any)._interpolants = interpolants;
      mixer.setTime(total * soldier.speed + soldier.offset);
      soldier.updateBones();
    } else {
      // use simplified action
      (mixer as any)._bindings = propertyBindingsLOD;
      (mixer as any)._nActiveBindings = propertyBindingsLOD.length;
      (action as any)._propertyBindings = propertyBindingsLOD;
      (action as any)._interpolants = interpolantsLOD;
      mixer.setTime(total * soldier.speed + soldier.offset);
      soldier.updateBones(true, excludedBones);
    }
  }

  return true;
};

const hemi = new HemisphereLight(0x99ddff, 0x669933, 5);
const dirLight = new DirectionalLight('white', 5);
const ground = new Mesh(new PlaneGeometry(200, 200), new MeshStandardMaterial({ color: 0x082000 }));
ground.rotation.x = -Math.PI / 2;

soldierGroup.add(soldiers);
scene.add(hemi, dirLight, glb.scene, ground);
scene.fog = new Fog(0x99ddff, 90, 100);
