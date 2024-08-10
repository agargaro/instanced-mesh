import * as MW from "./meshwalk.module.min";
import { Asset, Main, PerspectiveCameraAuto } from "@three.ez/main";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferGeometry,
  CameraHelper,
  DirectionalLight,
  FogExp2,
  GreaterDepth,
  LessDepth,
  LoopOnce,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PlaneGeometry,
  Raycaster,
  RepeatWrapping,
  RGBADepthPacking,
  Scene,
  SpotLight,
  SpotLightHelper,
  Texture,
  TextureLoader,
  Vector3,
  Vector4,
} from "three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Sky } from "three/examples/jsm/objects/Sky";
import { InstancedMesh2 } from "../src";
import { Terrain } from "./terrain";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import { Grass } from "./objects/grass";
import { TerrainSurfaceSampler } from "./objects/terrainSurfaceSampler";

const world = new MW.World();
const octree = new MW.Octree();
world.add(octree);

const treeNum = 1000;
const rockNum = 1500;
const plantNum = 1500;
const bushesNum = 1500;

const terrainSize = 1000;
const terrainSegments = 64;
const terrainTextureRepeat = terrainSize * 0.075;

const main = new Main({ rendererParameters: { antialias: true } /*showStats: false (Default: true)*/ }); // init renderer and other stuff
main.renderer.toneMapping = ACESFilmicToneMapping;
main.renderer.toneMappingExposure = 0.5;
main.renderer.shadowMap.enabled = true;
main.renderer.shadowMap.type = PCFSoftShadowMap;

const camera = new PerspectiveCameraAuto(70, 0.1, 2000);
camera.position.set(0, 1, 5);
const scene = new Scene();

const raycaster = new Raycaster();

const treeGLTF = (await Asset.load<GLTF>(GLTFLoader, "tree.glb")).scene.children[0].children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const treeLeavesGLTF = (await Asset.load<GLTF>(GLTFLoader, "tree.glb")).scene.children[0].children[1] as Mesh<BufferGeometry, MeshStandardMaterial>;
const rockGLTF = (await Asset.load<GLTF>(GLTFLoader, "rock.glb")).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const plantGLTF = (await Asset.load<GLTF>(GLTFLoader, "plant.glb")).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const bushGLTF = (await Asset.load<GLTF>(GLTFLoader, "bush.glb")).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const robotGLTF = await Asset.load<GLTF>(GLTFLoader, "Robot.glb");
robotGLTF.scene.scale.set(0.4, 0.4, 0.4);
robotGLTF.scene.traverse((o) => {
  if ((o as Mesh).isMesh) {
    o.receiveShadow = true;
    o.castShadow = true;
  }
  /**
   * Head light
   */
  // if(o.name === 'Head') {
  //   const spotLight = new SpotLight(0xfff8cc, 1000, 250, Math.PI / 6, 0.8).translateZ(1.1);
  //   spotLight.castShadow = true;
  //   spotLight.shadow.mapSize.set(1024, 1024);
  //   spotLight.shadow.camera.far = 50000;
  //   spotLight.shadow.bias = 0.01;
  //   spotLight.shadow.camera.updateProjectionMatrix();

  //   const target = new Object3D();
  //   target.position.set(o.position.x, o.position.y, o.position.z + 100);
  //   spotLight.target = target;

  //   o.add(target)
  //   o.add(spotLight);
  // }
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

/**
 * Make charachter move
 */
// const keyInputControl = new MW.KeyInputControl();
// keyInputControl.addEventListener("movekeyon", () => (playerController.isRunning = true));
// keyInputControl.addEventListener("movekeyoff", () => (playerController.isRunning = false));
// keyInputControl.addEventListener("jumpkeypress", () => playerController.jump());

// keyInputControl.addEventListener("movekeychange", () => {
//   var cameraFrontAngle = tpsCameraControls.frontAngle;
//   var characterFrontAngle = keyInputControl.frontAngle;
//   playerController.direction = cameraFrontAngle + characterFrontAngle;
// });

tpsCameraControls.addEventListener("update", () => {
  if (!playerController.isRunning) return;

  // const cameraFrontAngle = tpsCameraControls.frontAngle;
  // const characterFrontAngle = keyInputControl.frontAngle;
  // playerController.direction = cameraFrontAngle + characterFrontAngle;
});

playerObjectHolder.add(robotGLTF.scene);

/**
 * Character animations
 */
const animationController = new MW.AnimationController(robotGLTF.scene, robotGLTF.animations);
animationController.motion.Robot_Jump.setLoop(LoopOnce, 0);
animationController.motion.Robot_Jump.clampWhenFinished = true;

playerController.addEventListener("startIdling", () => animationController.play("Robot_Idle"));
// playerController.addEventListener("startWalking", () => animationController.play("Robot_Running"));
// playerController.addEventListener("startJumping", () => animationController.play("Robot_Jump"));
// playerController.addEventListener("startSliding", () => animationController.play("Robot_Jump"));
// playerController.addEventListener("startFalling", () => animationController.play("Robot_Jump"));
animationController.play("Robot_Jump");

/**
 * Create instenced mesh of all the elements present in the scene
 */
const trees = new InstancedMesh2(main.renderer, treeNum, treeGLTF.geometry, treeGLTF.material);
trees.createInstances((obj, index) => {
  sampler.sample(obj.position);
  obj.scale.setScalar(Math.random() * 4 + 3);
  obj.rotateY(Math.random() * Math.PI * 2);
});
trees.computeBVH();

const treesLeaves = new InstancedMesh2(main.renderer, treeNum, treeLeavesGLTF.geometry, treeLeavesGLTF.material);
treesLeaves.sortObjects = true;
treeLeavesGLTF.material.transparent = false;
treeLeavesGLTF.material.alphaTest = 0.2;
treeLeavesGLTF.material.depthWrite = true;
for (let i = 0; i < treeNum; i++) {
  treesLeaves.setMatrixAt(i, trees.getMatrixAt(i));
}
treesLeaves.computeBVH();

const rocks = new InstancedMesh2(main.renderer, rockNum, rockGLTF.geometry, rockGLTF.material);
rocks.createInstances((obj, index) => {
  sampler.sample(obj.position);
  obj.scale.setScalar(Math.random() * 2 + 1);
  obj.rotateY(Math.random() * Math.PI * 2);
});
rocks.computeBVH();

const plants = new InstancedMesh2(main.renderer, plantNum, plantGLTF.geometry, plantGLTF.material);
plants.sortObjects = true;
plantGLTF.material.transparent = false;
plantGLTF.material.alphaTest = 0.2;
plantGLTF.material.depthWrite = true;
plants.createInstances((obj, index) => {
  sampler.sample(obj.position);
  obj.scale.setScalar(Math.random() + 2);
  obj.rotateY(Math.random() * Math.PI * 2);
});
plants.computeBVH();

const bushes = new InstancedMesh2(main.renderer, bushesNum, bushGLTF.geometry, bushGLTF.material);
bushes.sortObjects = true;
bushGLTF.material.transparent = false;
bushGLTF.material.alphaTest = 0.2;
bushGLTF.material.depthWrite = true;
bushes.createInstances((obj, index) => {
  sampler.sample(obj.position);
  obj.scale.setScalar(Math.random() * 3 + 2);
  obj.rotateX(Math.PI / 1.6);
  obj.translateZ(0.35);
});
bushes.computeBVH();

/**
 * Make all of them cast and receive shadows
 */
ground.castShadow = true;
ground.receiveShadow = true;

trees.castShadow = true;
trees.receiveShadow = true;

treesLeaves.castShadow = true;
treesLeaves.receiveShadow = true;

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

scene.fog = new FogExp2("white", 0.005);
scene.on("animate", (e) => {
  scene.fog.color.setHSL(0, 0, sun.y);
  world.fixedUpdate();
  tpsCameraControls.update(e.delta);
  animationController.update(e.delta);
});

const dirLight = new DirectionalLight();
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(4096, 4096);
dirLight.shadow.camera.left = -500;
dirLight.shadow.camera.right = 500;
dirLight.shadow.camera.top = 500;
dirLight.shadow.camera.bottom = -500;
dirLight.shadow.camera.far = 5000;
dirLight.shadow.bias = 0.01;
dirLight.shadow.camera.updateProjectionMatrix();

const sunOffset = new Vector3();
dirLight.on("animate", (e) => {
  dirLight.intensity = sun.y > 0.05 ? 10 : Math.max(0, (sun.y / 0.05) * 10);
  sunOffset.copy(sun).multiplyScalar(1000);
  dirLight.position.copy(camera.position).add(sunOffset);
  dirLight.target.position.copy(camera.position).sub(sunOffset);
});

/**
 * Generate grass using a custom MeshSurfaceSampler
 */
const xSize = 8;
const ySize = 8;
const xSizeHalf = xSize / 2;
const ySizeHalf = ySize / 2;

const terrainSampler = new TerrainSurfaceSampler(ground).build();

let i = 0;
const widthSegments = (ground.geometry as PlaneGeometry).parameters.widthSegments;
const heightSegments = (ground.geometry as PlaneGeometry).parameters.heightSegments;
const rowStart = terrainSegments / 2 - xSize - xSizeHalf;
const rowCount = xSize * 3;
const colStart = terrainSegments / 2 - ySize - ySizeHalf;
const colCount = ySize * 3;
const tileSize = 1 / (widthSegments * heightSegments * 2);

terrainSampler.randomFunction = () => {
  if (i++ % 3 === 0) {
    const row = rowStart + Math.floor(Math.random() * rowCount);
    const col = colStart + Math.floor(Math.random() * colCount);
    return tileSize * (widthSegments * row * 2 + col * 2 + Math.round(Math.random())) + 10e-7;
  } else return Math.random();
};

const grass1 = new Grass(main.renderer, 250000, 6, ground, new Vector4(terrainSegments / 2 - xSizeHalf, terrainSegments / 2 - ySizeHalf, xSize, ySize));
const grass2_1 = new Grass(main.renderer, 150000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf, terrainSegments / 2 - ySizeHalf + ySize, xSize, ySize));
const grass2_2 = new Grass(main.renderer, 150000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf, terrainSegments / 2 - ySizeHalf - ySize, xSize, ySize));
const grass2_3 = new Grass(main.renderer, 150000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf - xSize, terrainSegments / 2 - ySizeHalf, xSize, ySize));
const grass2_4 = new Grass(main.renderer, 150000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf + xSize, terrainSegments / 2 - ySizeHalf, xSize, ySize));
const grass2_5 = new Grass(main.renderer, 150000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf - xSize, terrainSegments / 2 - ySizeHalf + ySize, xSize, ySize));
const grass2_6 = new Grass(main.renderer, 150000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf - xSize, terrainSegments / 2 - ySizeHalf - ySize, xSize, ySize));
const grass2_7 = new Grass(main.renderer, 150000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf + xSize, terrainSegments / 2 - ySizeHalf + ySize, xSize, ySize));
const grass2_8 = new Grass(main.renderer, 150000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf + xSize, terrainSegments / 2 - ySizeHalf - ySize, xSize, ySize));
const grassTotalCount = {count: grass1.count + grass2_1.count + grass2_2.count + grass2_3.count + grass2_4.count + grass2_5.count + grass2_6.count + grass2_7.count + grass2_8.count};

scene.add(
  sky,
  trees,
  treesLeaves,
  rocks,
  bushes,
  plants,
  ground,
  new AmbientLight(0xffffff, 0.5),
  dirLight,
  dirLight.target,
  playerObjectHolder,
  grass1,
  grass2_1,
  grass2_2,
  grass2_3,
  grass2_4,
  grass2_5,
  grass2_6,
  grass2_7,
  grass2_8
);

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

gui
  .add(grassTotalCount as any, "count")
  .name("Bushes instances total")
  .disable();

const treeCount = gui.add(trees, "count").name("Trees instances rendered").disable();
const rocksCount = gui.add(rocks, "count").name("Rocks instances rendered").disable();
const plantsCount = gui.add(plants, "count").name("Plants instances rendered").disable();
const bushesCount = gui.add(bushes, "count").name("Bushes instances rendered").disable();
