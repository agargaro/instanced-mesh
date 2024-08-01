import * as MW from "./meshwalk.module.min";
import { Asset, Main, PerspectiveCameraAuto } from "@three.ez/main";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferGeometry,
  CameraHelper,
  DirectionalLight,
  FogExp2,
  LoopOnce,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  Raycaster,
  RepeatWrapping,
  RGBADepthPacking,
  Scene,
  SpotLight,
  SpotLightHelper,
  Texture,
  TextureLoader,
  Vector3,
} from "three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Sky } from "three/examples/jsm/objects/Sky";
import { CullingBVH, InstancedMesh2 } from "../src";
import { Terrain } from "./terrain";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";

const world = new MW.World();
const octree = new MW.Octree();
world.add(octree);

const treeNum = 300000;
const rockNum = 300000;
const plantNum = 300000;
const bushesNum = 300000;

const terrainSize = 100000;
const terrainSegments = 64;
const terrainTextureRepeat = terrainSize * 0.025;

const main = new Main({ rendererParameters: { antialias: true } }); // init renderer and other stuff
main.renderer.toneMapping = ACESFilmicToneMapping;
main.renderer.toneMappingExposure = 0.5;
main.renderer.shadowMap.enabled = true;
main.renderer.shadowMap.type = PCFSoftShadowMap;

const camera = new PerspectiveCameraAuto(70, 0.1, 10000);
camera.position.set(0, 3, 15);
const scene = new Scene();

const treeGLTF = (await Asset.load<GLTF>(GLTFLoader, 'tree.glb')).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;

const trees = new InstancedMesh2(main.renderer, count, {
  cullingType: CullingBVH,
  geometry: treeGLTF.geometry,
  material: treeGLTF.material,
  onInstanceCreation: (obj, index) => {
    sampler.sample(obj.position);
    obj.scale.setScalar(Math.random() * 0.1 + 0.1);
    obj.rotateY(Math.random() * Math.PI * 2);
  },
});
trees.cursor = "pointer";

trees.on("click", (e) => {
  trees.instances[e.intersection.instanceId].visible = false;
});

const rocks = new InstancedMesh2(main.renderer, rockNum, {
  cullingType: CullingBVH,
  geometry: rockGLTF.geometry,
  material: rockGLTF.material,
  onInstanceCreation: (obj, index) => {
    sampler.sample(obj.position);
    obj.scale.setScalar(Math.random() * 2 + 1);
    obj.rotateY(Math.random() * Math.PI * 2);
  },
});

const plants = new InstancedMesh2(main.renderer, plantNum, {
  cullingType: CullingBVH,
  geometry: plantGLTF.geometry,
  material: plantGLTF.material,
  onInstanceCreation: (obj, index) => {
    sampler.sample(obj.position);
    obj.scale.setScalar(Math.random() * 3 + 1);
    obj.rotateY(Math.random() * Math.PI * 2);
  },
});

const bushes = new InstancedMesh2(main.renderer, bushesNum, {
  cullingType: CullingBVH,
  geometry: bushGLTF.geometry,
  material: bushGLTF.material,
  onInstanceCreation: (obj, index) => {
    sampler.sample(obj.position);
    obj.scale.setScalar(Math.random() * 5 + 2);
    obj.rotateY(Math.random() * Math.PI * 2);
  },
});

// ground.castShadow = true;
ground.receiveShadow = true;

trees.castShadow = true;

rocks.castShadow = true;
rocks.receiveShadow = true;


plants.castShadow = true;
plants.receiveShadow = true;

bushes.castShadow = true;
bushes.receiveShadow = true;

const sun = new Vector3();
const sky = new Sky();
sky.scale.setScalar(450000);
const uniforms = sky.material.uniforms;
uniforms["turbidity"].value = 5;
uniforms["rayleigh"].value = 2;

sky.on("animate", (e) => {
  sun.setFromSphericalCoords(1, Math.PI / -1.9 + e.total * 0.02, Math.PI / 1.4);
  uniforms["sunPosition"].value.copy(sun);
});

scene.fog = new FogExp2("white", 0.0002);
scene.on("animate", (e) => {
  scene.fog.color.setHSL(0, 0, sun.y);
  world.fixedUpdate();
  tpsCameraControls.update(e.delta);
  animationController.update(e.delta);
});

const dirLight = new DirectionalLight();
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(4096, 4096);
dirLight.shadow.camera.left = -1500;
dirLight.shadow.camera.right = 1500;
dirLight.shadow.camera.top = 1500;
dirLight.shadow.camera.bottom = -1500;
dirLight.shadow.camera.far = 5000;
dirLight.shadow.bias = 0.02;
dirLight.shadow.camera.updateProjectionMatrix();

const helper = new CameraHelper( dirLight.shadow.camera );
scene.add( helper );

const sunOffset = new Vector3();
dirLight.on("animate", (e) => {
  dirLight.intensity = sun.y > 0.05 ? 10 : Math.max(0, (sun.y / 0.05) * 10);
  sunOffset.copy(sun).multiplyScalar(1000);
  dirLight.position.copy(camera.position).add(sunOffset);
  dirLight.target.position.copy(camera.position).sub(sunOffset);
});

scene.add(sky, trees, rocks, bushes, plants, ground, new AmbientLight(), dirLight, dirLight.target, playerObjectHolder);

main.createView({
  scene,
  camera,
  onAfterRender: () => {
    treeCount.updateDisplay();
    rocksCount.updateDisplay();
    plantsCount.updateDisplay();
    bushesCount.updateDisplay();
  },
});

const gui = new GUI();
gui
  .add(trees.instances as any, "length")
  .name("Trees instances total")
  .disable();

gui
  .add(rocks.instances as any, "length")
  .name("Rocks instances total")
  .disable();

gui
  .add(plants.instances as any, "length")
  .name("Plants instances total")
  .disable();

gui
  .add(bushes.instances as any, "length")
  .name("Bushes instances total")
  .disable();
const treeCount = gui.add(trees, "count").name("Trees instances rendered").disable();
const rocksCount = gui.add(rocks, "count").name("Rocks instances rendered").disable();
const plantsCount = gui.add(plants, "count").name("Plants instances rendered").disable();
const bushesCount = gui.add(bushes, "count").name("Bushes instances rendered").disable();
gui
  .add(camera, "far", 2000, 20000, 100)
  .name("camera far")
  .onChange(() => camera.updateProjectionMatrix());
