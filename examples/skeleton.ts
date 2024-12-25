import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AnimationMixer, DirectionalLight, HemisphereLight, Scene, SkinnedMesh } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 100000;
const spawnSize = 100000;

const camera = new PerspectiveCameraAuto().translateZ(10);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false, backgroundColor: 0x99DDFF });

const hemi = new HemisphereLight(0x99DDFF, 0x669933, 1 / 3);
const light = new DirectionalLight(0xffffff, 1);
light.position.set(200, 1000, 50);

const glb = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');
const dummy = glb.scene.children[0].children[0] as SkinnedMesh;

// dummy.visible = false;
// glb.scene.children[0].children[1].visible = false;

// const soldiers = new InstancedMesh2(dummy.geometry, dummy.material, { capacity: count });

// soldiers.addInstances(count, (obj, index) => {
//   obj.scale.copy(glb.scene.children[0].scale);
//   obj.quaternion.copy(glb.scene.children[0].quaternion);
//   obj.position.set(spawnSize * Math.random() - spawnSize / 2, 0, spawnSize * Math.random() - spawnSize / 2);
//   obj.color = `hsl(${Math.random() * 360}, 50%, 66%)`;
// });

const mixer = new AnimationMixer(glb.scene);
const action = mixer.clipAction(glb.animations[1]);
action.play();

scene.on('animate', (e) => {
  //   for (let i = 0; i < soldiers.instancesCount; i++) {
  mixer.update(e.delta);
  //     soldiers.setSkeletonAt(i, dummy.skeleton);
  //   }
});

scene.add(light, hemi, glb.scene);
// scene.add(light, hemi, soldiers, glb.scene);

// soldiers.skeleton = { update: () => { } };
