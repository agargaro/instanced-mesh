import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AnimationMixer, DirectionalLight, HemisphereLight, Scene, SkinnedMesh } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 3;

const camera = new PerspectiveCameraAuto().translateZ(-5).rotateY(Math.PI);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false, backgroundColor: 0x99DDFF });

const hemi = new HemisphereLight(0x99DDFF, 0x669933, 1 / 3);
const light = new DirectionalLight(0xffffff, 1);
light.position.set(200, 1000, 50);

const glb = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');
const dummy = glb.scene.children[0].children[0] as SkinnedMesh;

dummy.visible = false;
glb.scene.children[0].children[1].visible = false;

const soldiers = new InstancedMesh2(dummy.geometry, dummy.material, { capacity: count });

soldiers.addInstances(count, (obj, index) => {
  obj.position.copy(dummy.position);
  obj.position.x += index * 100 - 100;
  obj.quaternion.copy(dummy.quaternion);
  obj.scale.copy(dummy.scale);
});

const mixer = new AnimationMixer(glb.scene);
const action = mixer.clipAction(glb.animations[0]);
action.play();

// const mixer2 = new AnimationMixer(glb.scene);
// const action2 = mixer2.clipAction(glb.animations[1]);
// action2.play();

// const mixer3 = new AnimationMixer(glb.scene);
// const action3 = mixer3.clipAction(glb.animations[3]);
// action3.play();

mixer.update(0);
soldiers.setSkeletonAt(0, dummy.skeleton);
soldiers.setSkeletonAt(1, dummy.skeleton);
soldiers.setSkeletonAt(2, dummy.skeleton);
// mixer2.update(0);
// soldiers.setSkeletonAt(1, dummy.skeleton);
// mixer3.update(0);
// soldiers.setSkeletonAt(2, dummy.skeleton);

const offset = [1, 1, 1];

scene.on('animate', (e) => {
  debugger
  mixer.setTime(e.total * offset[0]);
  soldiers.setSkeletonAt(0, dummy.skeleton);
  mixer.setTime(e.total * offset[1]);
  soldiers.setSkeletonAt(1, dummy.skeleton);
  mixer.setTime(e.total * offset[2]);
  soldiers.setSkeletonAt(2, dummy.skeleton);
  // mixer2.setTime(e.total);
  // soldiers.setSkeletonAt(1, dummy.skeleton);
  // mixer3.setTime(e.total);
  // soldiers.setSkeletonAt(2, dummy.skeleton);
});

glb.scene.children[0].add(soldiers);
scene.add(light, hemi, glb.scene);
