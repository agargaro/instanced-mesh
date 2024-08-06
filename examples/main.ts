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
import { InstancedMesh2 } from "../src";
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

const raycaster = new Raycaster();

const treeGLTF = (await Asset.load<GLTF>(GLTFLoader, "tree.glb")).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const rockGLTF = (await Asset.load<GLTF>(GLTFLoader, "Rock_3.glb")).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const plantGLTF = (await Asset.load<GLTF>(GLTFLoader, "Plant_3.glb")).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const bushGLTF = (await Asset.load<GLTF>(GLTFLoader, "Bush_2.glb")).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const robotGLTF = await Asset.load<GLTF>(GLTFLoader, "Robot.glb");
robotGLTF.scene.traverse((o) => {
  if ((o as Mesh).isMesh) {
    o.receiveShadow = true;
    o.castShadow = true;
  }
  if(o.name === 'Head') {
    const spotLight = new SpotLight(0xfff8cc, 10000, 250, Math.PI / 6, 0.8).translateZ(1.1);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.set(1024, 1024);
    spotLight.shadow.camera.far = 50000;
    spotLight.shadow.bias = 0.1;
    spotLight.shadow.camera.updateProjectionMatrix();

    const target = new Object3D();
    target.position.set(o.position.x, o.position.y, o.position.z + 100);
    spotLight.target = target;

    o.add(target)
    o.add(spotLight);
  }
});

const grass: Texture = await Asset.load(TextureLoader, "grass.jpg");
grass.repeat.set(terrainTextureRepeat, terrainTextureRepeat);
grass.wrapS = grass.wrapT = RepeatWrapping;

const normal: Texture = await Asset.load(TextureLoader, "normal.jpg");
normal.repeat.set(terrainTextureRepeat, terrainTextureRepeat);
normal.wrapS = normal.wrapT = RepeatWrapping;

const ground = new Terrain(terrainSize, terrainSegments, grass, normal);
octree.addGraphNode(ground);
const sampler = new MeshSurfaceSampler(ground).setWeightAttribute(null).build();

raycaster.set(new Vector3(0, 500000, 0), new Vector3(0, -1, 0));
const intersection = raycaster.intersectObject(ground)[0].point;

const playerObjectHolder = new Object3D();
const playerRadius = 3;

const playerController = new MW.CharacterController(playerObjectHolder, playerRadius);
playerController.teleport(intersection.x, intersection.y + 20, intersection.z);
world.add(playerController);

const tpsCameraControls = new MW.TPSCameraControls(camera, playerObjectHolder, world, main.renderer.domElement);

const keyInputControl = new MW.KeyInputControl();
keyInputControl.addEventListener("movekeyon", () => (playerController.isRunning = true));
keyInputControl.addEventListener("movekeyoff", () => (playerController.isRunning = false));
keyInputControl.addEventListener("jumpkeypress", () => playerController.jump());

keyInputControl.addEventListener("movekeychange", () => {
  var cameraFrontAngle = tpsCameraControls.frontAngle;
  var characterFrontAngle = keyInputControl.frontAngle;
  playerController.direction = cameraFrontAngle + characterFrontAngle;
});

tpsCameraControls.addEventListener("update", () => {
  if (!playerController.isRunning) return;

  const cameraFrontAngle = tpsCameraControls.frontAngle;
  const characterFrontAngle = keyInputControl.frontAngle;
  playerController.direction = cameraFrontAngle + characterFrontAngle;
});

playerObjectHolder.add(robotGLTF.scene);

const animationController = new MW.AnimationController(robotGLTF.scene, robotGLTF.animations);
animationController.motion.Robot_Jump.setLoop(LoopOnce, 0);
animationController.motion.Robot_Jump.clampWhenFinished = true;

playerController.addEventListener("startIdling", () => animationController.play("Robot_Idle"));
playerController.addEventListener("startWalking", () => animationController.play("Robot_Running"));
playerController.addEventListener("startJumping", () => animationController.play("Robot_Jump"));
playerController.addEventListener("startSliding", () => animationController.play("Robot_Jump"));
playerController.addEventListener("startFalling", () => animationController.play("Robot_Jump"));
animationController.play("Robot_Jump");

const trees = new InstancedMesh2(main.renderer, treeNum, treeGLTF.geometry, treeGLTF.material);
trees.createInstances((obj, index) => {
  sampler.sample(obj.position);
  obj.scale.setScalar(Math.random() * 0.1 + 0.1);
  obj.rotateY(Math.random() * Math.PI * 2);
})
trees.computeBVH();
trees.cursor = "pointer";

trees.on("click", (e) => {
  trees.instances[e.intersection.instanceId].visible = false;
});

const rocks = new InstancedMesh2(main.renderer, rockNum, rockGLTF.geometry, rockGLTF.material);
rocks.createInstances((obj, index) => {
  sampler.sample(obj.position);
  obj.scale.setScalar(Math.random() * 2 + 1);
  obj.rotateY(Math.random() * Math.PI * 2);
})
rocks.computeBVH();

const plants = new InstancedMesh2(main.renderer, plantNum, plantGLTF.geometry, plantGLTF.material);
plants.createInstances((obj, index) => {
  sampler.sample(obj.position);
  obj.scale.setScalar(Math.random() * 3 + 1);
  obj.rotateY(Math.random() * Math.PI * 2);
})
plants.computeBVH();

const bushes = new InstancedMesh2(main.renderer, bushesNum, bushGLTF.geometry, bushGLTF.material);
bushes.createInstances((obj, index) => {
  sampler.sample(obj.position);
  obj.scale.setScalar(Math.random() * 5 + 2);
  obj.rotateY(Math.random() * Math.PI * 2);
})
bushes.computeBVH();


ground.castShadow = true;
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
dirLight.shadow.bias = 0.1;
dirLight.shadow.camera.updateProjectionMatrix();

const sunOffset = new Vector3();
dirLight.on("animate", (e) => {
  dirLight.intensity = sun.y > 0.05 ? 10 : Math.max(0, (sun.y / 0.05) * 10);
  sunOffset.copy(sun).multiplyScalar(1000);
  dirLight.position.copy(camera.position).add(sunOffset);
  dirLight.target.position.copy(camera.position).sub(sunOffset);
});

scene.add(sky, trees, rocks, bushes, plants, ground, new AmbientLight(0xffffff, 0.5), dirLight, dirLight.target, playerObjectHolder);

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
