import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AnimationMixer, BoxGeometry, Color, DirectionalLight, Fog, HemisphereLight, Mesh, MeshStandardMaterial, PlaneGeometry, Scene, VSMShadowMap } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InstancedMesh2 } from '../src/index.js';

const offset = 5000;
const timeOffsets = new Float32Array(4096);
for (let i = 0; i < 4096; i++) {
  timeOffsets[i] = Math.random() * 3;
}

const camera = new PerspectiveCameraAuto(60, 10, 20000);
const scene = new Scene();
const main = new Main();
main.createView({ scene, camera, enabled: false, backgroundColor: 0x99DDFF });

main.renderer.shadowMap.enabled = true;
main.renderer.shadowMap.type = VSMShadowMap;

const hemi = new HemisphereLight(0x99DDFF, 0x669933, 1 / 3);
const light = new DirectionalLight(0xffffff, 1);
light.position.set(200, 1000, 50);
light.castShadow = true;
light.shadow.camera.left = -5000;
light.shadow.camera.right = 5000;
light.shadow.camera.top = 5000;
light.shadow.camera.bottom = -5000;
light.shadow.camera.far = 2000;
light.shadow.bias = -0.01;
light.shadow.camera.updateProjectionMatrix();

const ground = new Mesh(new PlaneGeometry(1000000, 1000000), new MeshStandardMaterial({ color: 0x669933 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.add(light, hemi, ground);
scene.fog = new Fog(0x99DDFF, 5000, 10000);

const glb = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Horse.glb'); // TODO infer type?
const dummy = glb.scene.children[0] as Mesh;

const mesh = new InstancedMesh2(dummy.geometry, dummy.material, { capacity: 4096 });
mesh.instancesCount = 4096; // FIX TODO @@@@@@@@@@
mesh.castShadow = true;

for (let x = 0, i = 0; x < 64; x++) {
  for (let y = 0; y < 64; y++) {
    dummy.position.set(offset - 300 * x + 200 * Math.random(), 0, offset - 300 * y);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new Color(`hsl(${Math.random() * 360}, 50%, 66%)`));
    i++;
  }
}

scene.add(mesh);

const mixer = new AnimationMixer(glb.scene);
const action = mixer.clipAction(glb.animations[0]);
action.play();

scene.on('animate', (e) => {
  const time = e.total;

  const r = 3000;
  camera.position.set(Math.sin(time / 10) * r, 1500 + 1000 * Math.cos(time / 5), Math.cos(time / 10) * r);
  camera.lookAt(0, 0, 0);

  for (let i = 0; i < 4096; i++) {
    mixer.setTime(time + timeOffsets[i]);
    mesh.setMorphAt(i, dummy);
  }
});

// in più.. animare solo quelli nella view. capire lod e ombre

mesh.addShadowLOD(new BoxGeometry(50, 200, 200));
mesh.addLOD(new BoxGeometry(50, 200, 200), new MeshStandardMaterial(), 5000);
