import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { ACESFilmicToneMapping, AmbientLight, BufferGeometry, DirectionalLight, FogExp2, Mesh, MeshStandardMaterial, PCFSoftShadowMap, PlaneGeometry, RepeatWrapping, Scene, Texture, TextureLoader, Vector3, Vector4 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { Grass } from './objects/grass';
import { Terrain } from './terrain';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { InstancedMesh2 } from '../src';
import { TerrainSurfaceSampler } from './objects/terrainSurfaceSampler';

const main = new Main();
main.renderer.toneMapping = ACESFilmicToneMapping;
main.renderer.toneMappingExposure = 0.5;
main.renderer.shadowMap.enabled = true;
main.renderer.shadowMap.type = PCFSoftShadowMap;

const camera = new PerspectiveCameraAuto(70, 0.1, 10000).translateZ(10).translateY(10);
const scene = new Scene();

const terrainSize = 1000;
const terrainSegments = 64;
const terrainTextureRepeat = terrainSize * 0.25;

const grass: Texture = await Asset.load(TextureLoader, "grass.jpg");
grass.repeat.set(terrainTextureRepeat, terrainTextureRepeat);
grass.wrapS = grass.wrapT = RepeatWrapping;
const normal: Texture = await Asset.load(TextureLoader, "normal.jpg");
normal.repeat.set(terrainTextureRepeat, terrainTextureRepeat);
normal.wrapS = normal.wrapT = RepeatWrapping;
const ground = new Terrain(terrainSize, terrainSegments, grass, normal);
ground.receiveShadow = true;
ground.castShadow = true;

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

scene.fog = new FogExp2('white', 0.004);
scene.on('animate', (e) => scene.fog.color.setHSL(0, 0, sun.y));

const dirLight = new DirectionalLight();
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(4096, 4096);
dirLight.shadow.camera.left = -750;
dirLight.shadow.camera.right = 750;
dirLight.shadow.camera.top = 750;
dirLight.shadow.camera.bottom = -750;
dirLight.shadow.camera.far = 5000;
dirLight.shadow.camera.updateProjectionMatrix();
dirLight.shadow.bias = 0.2;

const sunOffset = new Vector3();
dirLight.on('animate', (e) => {
    dirLight.intensity = sun.y > 0.05 ? 10 : Math.max(0, (sun.y / 0.05) * 10);
    sunOffset.copy(sun).multiplyScalar(1000);
    dirLight.position.copy(camera.position).add(sunOffset);
    dirLight.target.position.copy(camera.position).sub(sunOffset);
});

const xSize = 8;
const ySize = 8;
const xSizeHalf = xSize / 2;
const ySizeHalf = ySize / 2;

scene.add(
    sky, ground, new AmbientLight(), dirLight, dirLight.target,
    new Grass(main.renderer, 200000, 6, ground, new Vector4(terrainSegments / 2 - xSizeHalf, terrainSegments / 2 - ySizeHalf, xSize, ySize)),
    new Grass(main.renderer, 100000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf, terrainSegments / 2 - ySizeHalf + ySize, xSize, ySize)),
    new Grass(main.renderer, 100000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf, terrainSegments / 2 - ySizeHalf - ySize, xSize, ySize)),
    new Grass(main.renderer, 100000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf - xSize, terrainSegments / 2 - ySizeHalf, xSize, ySize)),
    new Grass(main.renderer, 100000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf + xSize, terrainSegments / 2 - ySizeHalf, xSize, ySize)),
    new Grass(main.renderer, 100000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf - xSize, terrainSegments / 2 - ySizeHalf + ySize, xSize, ySize)),
    new Grass(main.renderer, 100000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf - xSize, terrainSegments / 2 - ySizeHalf - ySize, xSize, ySize)),
    new Grass(main.renderer, 100000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf + xSize, terrainSegments / 2 - ySizeHalf + ySize, xSize, ySize)),
    new Grass(main.renderer, 100000, 1, ground, new Vector4(terrainSegments / 2 - xSizeHalf + xSize, terrainSegments / 2 - ySizeHalf - ySize, xSize, ySize)),
);

const treeGLTF = (await Asset.load<GLTF>(GLTFLoader, 'tree.glb')).scene.children[0] as Mesh<BufferGeometry, MeshStandardMaterial>;
const trees = new InstancedMesh2(main.renderer, 2000, treeGLTF.geometry, treeGLTF.material);
trees.castShadow = true;
trees.receiveShadow = true;

/** schifo */

const sampler = new TerrainSurfaceSampler(ground).build();

let i = 0;
const widthSegments = ((ground.geometry as PlaneGeometry).parameters).widthSegments;
const heightSegments = ((ground.geometry as PlaneGeometry).parameters).heightSegments;
const rowStart = terrainSegments / 2 - xSize - xSizeHalf;
const rowCount = xSize * 3;
const colStart = terrainSegments / 2 - ySize - ySizeHalf;
const colCount = ySize * 3;
const tileSize = 1 / (widthSegments * heightSegments * 2);

sampler.randomFunction = () => {
    if (i++ % 3 === 0) {
        const row = rowStart + Math.floor(Math.random() * rowCount);
        const col = colStart + Math.floor(Math.random() * colCount);
        return tileSize * ((widthSegments * row * 2 + col * 2) + Math.round(Math.random())) + 10e-7;
    }
    else return Math.random();
}

trees.createInstances((obj, index) => {
    sampler.sample(obj.position);
    obj.scale.setScalar(Math.random() * 0.01 + 0.01);
    obj.rotateY(Math.random() * Math.PI * 2).rotateZ(Math.random() * 0.3 - 0.15);
});

trees.computeBVH();

scene.add(trees);

const controls = new OrbitControls(camera, main.renderer.domElement);

main.createView({ scene, camera, enabled: false });
