import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, AnimationMixer, Mesh, Scene } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 7;
const animationMaxFps = 30;

const camera = new PerspectiveCameraAuto().translateZ(-5).rotateY(Math.PI);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false, backgroundColor: 0x99DDFF });

const glb = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');

const dummy = glb.scene.children[0].children[0] as Mesh;
glb.scene.children[0].children[1].visible = false;
dummy.visible = false;

const indexAnimation = [0, 1, 3];

const soldiers = InstancedMesh2.createFrom<{ mixer: AnimationMixer }>(dummy, { capacity: count, createEntities: true });

soldiers.addInstances(count, (obj, index) => {
  obj.position.copy(dummy.position);
  obj.position.x += index * 100 - 300;
  obj.quaternion.copy(dummy.quaternion);
  obj.scale.copy(dummy.scale);

  obj.mixer = new AnimationMixer(glb.scene);
  obj.mixer.clipAction(glb.animations[indexAnimation[index % 3]]).play();
});

glb.scene.children[0].add(soldiers);
scene.add(new AmbientLight(), glb.scene);

let time = 0;

scene.on('animate', (e) => {
  time += e.delta;
  if (time < 1 / animationMaxFps) return;

  for (const soldier of soldiers.instances) {
    if ((soldier.mixer as any)._nActiveActions > 0) {
      soldier.mixer.update(time);
      soldier.updateBones();
    }
  }

  time = time % (1 / animationMaxFps);
});
