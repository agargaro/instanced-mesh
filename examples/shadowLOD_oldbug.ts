import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, BoxGeometry, DirectionalLight, Material, Mesh, MeshPhongMaterial, PlaneGeometry, Scene } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 20;
const terrainSize = 30;

const main = new Main(); // init renderer and other stuff
main.renderer.shadowMap.enabled = true;

const camera = new PerspectiveCameraAuto(50).translateX(100).translateY(100).translateZ(100);
const scene = new Scene();

const gltf = await Asset.load<GLTF>(GLTFLoader, 'tree.glb');
const treeGroup = gltf.scene;
const mergedGeo = mergeGeometries(treeGroup.children.map((x) => (x as Mesh).geometry), true);
const materials = treeGroup.children.map((x) => (x as Mesh).material as Material);

const instancedMesh = new InstancedMesh2(mergedGeo, materials, { capacity: count, renderer: main.renderer });
instancedMesh.addShadowLOD(new BoxGeometry(3, 10, 3));

instancedMesh.addInstances(count, (obj, index) => {
  obj.position.setX(Math.random() * terrainSize - terrainSize / 2).setZ(Math.random() * terrainSize - terrainSize / 2);
});

instancedMesh.computeBVH();

const ground = new Mesh(new PlaneGeometry(terrainSize, terrainSize, 10, 10), new MeshPhongMaterial());
ground.receiveShadow = true;
ground.translateY(-1);
ground.rotateX(Math.PI / -2);

const dirLight = new DirectionalLight();
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
dirLight.shadow.camera.updateProjectionMatrix();

dirLight.position.set(0, 30, 50);

scene.on('animate', (e) => {
  controls.update();
});

scene.add(instancedMesh, ground, new AmbientLight(), dirLight);

main.createView({ scene, camera, enabled: false, backgroundColor: 0xd3d3d3 });

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 10;
controls.maxDistance = 100;
controls.target.set(0, 0, 0);
controls.update();
controls.autoRotate = true;
