import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { ACESFilmicToneMapping, AmbientLight, BufferGeometry, DirectionalLight, FogExp2, Mesh, MeshLambertMaterial, MeshStandardMaterial, PCFSoftShadowMap, PlaneGeometry, Scene, Vector3 } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { InstancedMeshLOD } from '../src/index.js';
import { PRNG } from './objects/random.js';

const count = 1000000;
const terrainSize = 50000;
const random = new PRNG(10000);

const main = new Main({ rendererParameters: { antialias: true } }); // init renderer and other stuff
main.renderer.toneMapping = ACESFilmicToneMapping;
main.renderer.toneMappingExposure = 0.5;
main.renderer.shadowMap.enabled = true;
main.renderer.shadowMap.type = PCFSoftShadowMap;

const camera = new PerspectiveCameraAuto(70, 0.1, 2000);
const scene = new Scene();

// const treeGLTF = (await Asset.load<GLTF>(GLTFLoader, 'tree.glb')).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;

// const trees = new InstancedMesh2(main.renderer, count, treeGLTF.geometry, treeGLTF.material);
// trees.castShadow = true;
// trees.cursor = 'pointer';

// trees.createInstances((obj, index) => {
//   obj.position.setX(Math.random() * terrainSize - terrainSize / 2).setZ(Math.random() * terrainSize - terrainSize / 2);
//   obj.scale.setScalar(Math.random() * 0.1 + 0.1);
//   obj.rotateY(Math.random() * Math.PI * 2).rotateZ(Math.random() * 0.3 - 0.15);
// });

// trees.computeBVH();

// trees.on('click', (e) => {
//   trees.instances[e.intersection.instanceId].visible = false;
// });



const treeHigh = (await Asset.load<GLTF>(GLTFLoader, 'tree.glb')).scene.children[0];
const treeMid = (await Asset.load<GLTF>(GLTFLoader, 'tree_mid.glb')).scene.children[0];
const treeLow = (await Asset.load<GLTF>(GLTFLoader, 'tree_far.glb')).scene.children[0];

const trunkHigh = treeHigh.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const trunkMid = treeMid.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const trunkLow = treeLow.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;

const leavesHigh = treeHigh.children[1] as Mesh<BufferGeometry, MeshStandardMaterial>;
const leavesMid = treeMid.children[1] as Mesh<BufferGeometry, MeshStandardMaterial>;
const leavesLow = treeLow.children[1] as Mesh<BufferGeometry, MeshStandardMaterial>;

leavesHigh.material.transparent = leavesMid.material.transparent = leavesLow.material.transparent = false;
leavesHigh.material.alphaTest = leavesMid.material.alphaTest = leavesLow.material.alphaTest = 0.2;
leavesHigh.material.depthWrite = leavesMid.material.depthWrite = leavesLow.material.depthWrite = true;

const trunkLOD = new InstancedMeshLOD(main.renderer, count);
trunkLOD.addLevel(trunkHigh.geometry, trunkHigh.material);
trunkLOD.addLevel(trunkMid.geometry, trunkMid.material, 100);
trunkLOD.addLevel(trunkLow.geometry, trunkLow.material, 200);
trunkLOD.levels[0].object.geometry.computeBoundingSphere(); // improve

const leavesLOD = new InstancedMeshLOD(main.renderer, count);
leavesLOD.addLevel(leavesHigh.geometry, leavesHigh.material);
// leavesLOD.addLevel(leavesMid.geometry, leavesMid.material, 500);
leavesLOD.addLevel(leavesLow.geometry, leavesLow.material, 500);
leavesLOD.levels[0].object.geometry.computeBoundingSphere(); // improve

trunkLOD.levels[0].object.castShadow = true;
trunkLOD.levels[1].object.castShadow = true;
trunkLOD.levels[2].object.castShadow = true;
leavesLOD.levels[0].object.castShadow = true;
leavesLOD.levels[1].object.castShadow = true;
// leavesLOD.levels[2].object.castShadow = true;



trunkLOD.updateInstances((obj, index) => {
  obj.position.x = random.range(-terrainSize / 2, terrainSize / 2);
  obj.position.z = random.range(-terrainSize / 2, terrainSize / 2);
  obj.scale.multiplyScalar(random.range(5, 10));
  obj.rotateY(random.range(0, Math.PI * 2)).rotateZ(random.range(-0.1, 0.1));
});

for (let i = 0; i < leavesLOD.maxCount; i++) {
  leavesLOD.setMatrixAt(i, trunkLOD.getMatrixAt(i))
}

trunkLOD.computeBVH();
leavesLOD.computeBVH(); // it would be better use only one BVH




const ground = new Mesh(new PlaneGeometry(terrainSize, terrainSize, 10, 10), new MeshLambertMaterial({ color: 0x004622 }));
// ground.interceptByRaycaster = false;
ground.receiveShadow = true;
ground.rotateX(Math.PI / -2);

const sun = new Vector3();
const sky = new Sky();
sky.scale.setScalar(450000);
const uniforms = sky.material.uniforms;
uniforms['turbidity'].value = 5;
uniforms['rayleigh'].value = 2;

sky.on('animate', (e) => {
  sun.setFromSphericalCoords(1, Math.PI / -1.9 + e.total * 0.02, Math.PI / 1.4);
  uniforms['sunPosition'].value.copy(sun);
});

scene.fog = new FogExp2('white', 0.0004);
scene.on('animate', (e) => scene.fog.color.setHSL(0, 0, sun.y));

const dirLight = new DirectionalLight();
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.left = -1500;
dirLight.shadow.camera.right = 1500;
dirLight.shadow.camera.top = 1500;
dirLight.shadow.camera.bottom = -1500;
dirLight.shadow.camera.far = 5000;
dirLight.shadow.camera.updateProjectionMatrix();

const sunOffset = new Vector3();
dirLight.on('animate', (e) => {
  dirLight.intensity = sun.y > 0.05 ? 10 : Math.max(0, (sun.y / 0.05) * 10);
  sunOffset.copy(sun).multiplyScalar(1000);
  dirLight.position.copy(camera.position).add(sunOffset);
  dirLight.target.position.copy(camera.position).sub(sunOffset);
});

scene.add(sky, trunkLOD, leavesLOD, ground, new AmbientLight(), dirLight, dirLight.target);

// main.createView({ scene, camera, onAfterRender: () => treeCount.updateDisplay() });
main.createView({ scene, camera, enabled: false });

const controls = new MapControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 10;
controls.maxDistance = 100;
controls.panSpeed = 10;
controls.target.set(-5, 20, 20);
controls.update();

const gui = new GUI();
// gui.add(trees.instances as any, 'length').name('instances total').disable();
// const treeCount = gui.add(trees, 'count').name('instances rendered').disable();
gui.add(camera, 'far', 500, 10000, 100).name('camera far').onChange(() => camera.updateProjectionMatrix());
