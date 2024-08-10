import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { Color, Matrix4, MeshBasicMaterial, OctahedronGeometry, Scene, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InstancedMesh2 } from '../src/index.js';
import { PRNG } from './random.js';

const count = 10;
const spawnRadius = 10;

const main = new Main();
const random = new PRNG(count);

const camera = new PerspectiveCameraAuto(70).translateZ(10);
const scene = new Scene();

const instancedMesh = new InstancedMesh2(main.renderer, count, new OctahedronGeometry(1, 2), new MeshBasicMaterial());

const matrix = new Matrix4();
const vec3 = new Vector3();
const color = new Color();

for (let i = 0; i < count; i++) {
    const r = random.range(spawnRadius * 0.05, spawnRadius);
    const phi = random.range(0, Math.PI * 2);
    const theta = random.range(0, Math.PI * 2);
    vec3.setFromSphericalCoords(r, phi, theta);

    instancedMesh.setMatrixAt(i, matrix.setPosition(vec3));
    instancedMesh.setColorAt(i, color.setHex(Math.random() * 0xffffff));
}

instancedMesh.computeBVH();

instancedMesh.on('click', (e) => {
    instancedMesh.setVisibilityAt(e.intersection.instanceId, false);
});

scene.add(instancedMesh);

const controls = new OrbitControls(camera, main.renderer.domElement);

main.createView({ scene, camera });
