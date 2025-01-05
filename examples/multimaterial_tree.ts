import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, Material, Mesh, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, Scene, Texture, TextureLoader } from 'three';
import 'three-hex-tiling';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { InstancedMesh2 } from '../src/index.js';

const camera = new PerspectiveCameraAuto().translateY(2).translateZ(10);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
main.createView({ scene, camera, enabled: false, backgroundColor: 'skyblue' });

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2.2;
controls.update();

const ambientLight = new AmbientLight();
const dirLight = new DirectionalLight('white', 3);
scene.add(ambientLight, dirLight);

const pineGltf = await Asset.load<GLTF>(GLTFLoader, 'pine.glb');
const pineGroup = pineGltf.scene.children[0];
const pineMergedGeo = mergeGeometries(pineGroup.children.map((x) => (x as Mesh).geometry), true);

const pineLowGltf = await Asset.load<GLTF>(GLTFLoader, 'pine_low.glb');
const pineLowGroup = pineLowGltf.scene.children[0];
const pineLowMergedGeo = mergeGeometries(pineLowGroup.children.map((x) => (x as Mesh).geometry), true);
// REMOVE THIS FIX AND FIX THE MODEL
pineLowMergedGeo.scale(pineLowGroup.scale.x, pineLowGroup.scale.y, pineLowGroup.scale.z);
pineLowMergedGeo.rotateX(pineLowGroup.rotation.x);
pineLowMergedGeo.rotateY(pineLowGroup.rotation.y);
pineLowMergedGeo.rotateZ(pineLowGroup.rotation.z);
pineLowMergedGeo.translate(pineLowGroup.position.x, pineLowGroup.position.y, pineLowGroup.position.z);

const trees = new InstancedMesh2(pineMergedGeo, pineGroup.children.map((x) => (x as Mesh).material as Material), { capacity: 2000 });
trees.addLOD(pineLowMergedGeo, pineLowGroup.children.map((x) => (x as Mesh).material as Material), 10);

scene.add(trees);

trees.addInstances(2000, (obj, index) => {
  obj.position.x = Math.random() * 400 - 200;
  obj.position.z = Math.random() * 400 - 200;
});

trees.computeBVH();

const grassNormalMap = await Asset.load<Texture>(TextureLoader, 'grass_normal.jpg');
grassNormalMap.wrapS = RepeatWrapping;
grassNormalMap.wrapT = RepeatWrapping;
grassNormalMap.repeat.set(500, 500);

const grassMap = await Asset.load<Texture>(TextureLoader, 'grass.jpg');
grassMap.wrapS = RepeatWrapping;
grassMap.wrapT = RepeatWrapping;
grassMap.repeat.set(500, 500);

const ground = new Mesh(new PlaneGeometry(1000, 1000, 10, 10), new MeshStandardMaterial({ color: 0xbbbbbb, map: grassMap, normalMap: grassNormalMap, hexTiling: {} }));
ground.rotateX(-Math.PI / 2);
scene.add(ground);
