import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, Material, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, Scene, Texture, TextureLoader } from 'three';
import 'three-hex-tiling';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { InstancedMesh2 } from '../src/index.js';

const camera = new PerspectiveCameraAuto().translateY(2).translateZ(10);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
main.createView({ scene, camera, enabled: false });

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2.2;
controls.update();

const ambientLight = new AmbientLight();
const dirLight = new DirectionalLight('white', 3);
scene.add(ambientLight, dirLight);

const gltf = await Asset.load<GLTF>(GLTFLoader, 'Pine_1.gltf');
const group = gltf.scene.children[0];
const mergedGeo = mergeGeometries(group.children.map((x) => (x as Mesh).geometry), true);

const trees = new InstancedMesh2(mergedGeo, group.children.map((x) => (x as Mesh).material as Material));
scene.add(trees);

trees.addInstances(200, (obj, index) => {
  obj.position.x = Math.random() * 400 - 200;
  obj.position.z = Math.random() * 400 - 200;
});

trees.computeBVH();

const grassNormalMap = await Asset.load<Texture>(TextureLoader, 'Grass_Normal.jpg');
grassNormalMap.wrapS = RepeatWrapping;
grassNormalMap.wrapT = RepeatWrapping;
grassNormalMap.repeat.set(500, 500);

const grassMap = await Asset.load<Texture>(TextureLoader, 'Grass.jpg');
grassMap.wrapS = RepeatWrapping;
grassMap.wrapT = RepeatWrapping;
grassMap.repeat.set(500, 500);

const ground = new Mesh(new PlaneGeometry(1000, 1000, 10, 10), new MeshStandardMaterial({ color: 0xbbbbbb, map: grassMap, normalMap: grassNormalMap, hexTiling: {} }));
ground.rotateX(-Math.PI / 2);
scene.add(ground);

const test = new MeshStandardMaterial({ hexTiling: {} });
const test2 = new MeshPhysicalMaterial({ hexTiling: {} });

test.hexTiling = null;
test2.hexTiling = null;
