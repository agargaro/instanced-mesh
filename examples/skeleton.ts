import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AnimationMixer, DirectionalLight, HemisphereLight, Scene, SkinnedMesh } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 7;

const camera = new PerspectiveCameraAuto().translateZ(-5).rotateY(Math.PI);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false, backgroundColor: 0x99DDFF });

const hemi = new HemisphereLight(0x99DDFF, 0x669933, 1 / 3);
const light = new DirectionalLight(0xffffff, 1);
light.position.set(200, 1000, 50);

const glb = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');

const dummy = glb.scene.children[0].children[0] as SkinnedMesh;
glb.scene.children[0].children[1].visible = false;
dummy.visible = false;

dummy.skeleton.bones.forEach((bone) => {
  bone.matrixAutoUpdate = false;
  bone.matrixWorldAutoUpdate = false;
});

const soldiers = new InstancedMesh2<{ mixer: AnimationMixer }>(dummy.geometry, dummy.material, { capacity: count, createInstances: true });

soldiers.addInstances(count, (obj, index) => {
  obj.position.copy(dummy.position);
  obj.position.x += index * 100 - 300;
  obj.quaternion.copy(dummy.quaternion);
  obj.scale.copy(dummy.scale);

  const mixer = new AnimationMixer(glb.scene);
  mixer.clipAction(glb.animations[index % 2]).play();
  obj.mixer = mixer;
});

for (let i = 0; i < count; i++) {
  soldiers.setSkeletonAt(i, dummy.skeleton);
}

scene.on('animate', (e) => {
  const instances = soldiers.instances;

  for (let i = 0; i < count; i++) {
    instances[i].mixer.setTime(e.total);

    dummy.skeleton.bones.forEach((bone) => { // auto?
      bone.updateMatrix();
      bone.matrixWorld.multiplyMatrices(bone.parent.matrixWorld, bone.matrix);
    });

    soldiers.setSkeletonAt(i, dummy.skeleton);
  }
});

glb.scene.children[0].add(soldiers);
scene.add(light, hemi, glb.scene);
