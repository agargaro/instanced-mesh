import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AnimationMixer, DirectionalLight, Fog, HemisphereLight, Mesh, MeshStandardMaterial, PlaneGeometry, Scene } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 1024;
const spawnSize = 10000;
const timeOffsets = new Float32Array(count);
for (let i = 0; i < count; i++) {
  timeOffsets[i] = Math.random() * 3;
}

const camera = new PerspectiveCameraAuto(50, 10, 20000);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false, backgroundColor: 0x99DDFF });

const hemi = new HemisphereLight(0x99DDFF, 0x669933, 1 / 3);
const light = new DirectionalLight(0xffffff, 1);
light.position.set(200, 1000, 50);

const ground = new Mesh(new PlaneGeometry(1000000, 1000000), new MeshStandardMaterial({ color: 0x669933 }));
ground.rotation.x = -Math.PI / 2;

const glb = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Horse.glb');
const dummy = glb.scene.children[0] as Mesh;

const horses = new InstancedMesh2(dummy.geometry, dummy.material, { capacity: count });

horses.addInstances(count, (obj, index) => {
  obj.position.set(spawnSize * Math.random() - spawnSize / 2, 0, spawnSize * Math.random() - spawnSize / 2);
  obj.color = `hsl(${Math.random() * 360}, 50%, 66%)`;
});

const mixer = new AnimationMixer(glb.scene);
const action = mixer.clipAction(glb.animations[0]);
action.play();

scene.on('animate', (e) => {
  const time = e.total * 2;
  const r = 3000;
  camera.position.set(Math.sin(time / 10) * r, 1500 + 1000 * Math.cos(time / 5), Math.cos(time / 10) * r);
  camera.lookAt(0, 0, 0);

  for (let i = 0; i < horses.instancesCount; i++) {
    mixer.setTime(time + timeOffsets[i]);
    horses.setMorphAt(i, dummy);
  }
});

scene.add(light, hemi, horses, ground);
scene.fog = new Fog(0x99DDFF, 5000, 10000);

// in più.. animare solo quelli nella view. capire lod e ombre
