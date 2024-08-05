import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { Matrix4, MeshNormalMaterial, OctahedronGeometry, Scene, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { InstancedMesh2 } from '../src';
import { PRNG } from './random';

const count = 200000;
const spawnRadius = 10000;

const main = new Main();
const random = new PRNG(count);

const camera = new PerspectiveCameraAuto(70, 0.1, 10000).translateZ(10);
const scene = new Scene();

const instancedMesh = new InstancedMesh2(main.renderer, count, new OctahedronGeometry(1, 2), new MeshNormalMaterial({ flatShading: true }));
instancedMesh.computeBVH();

const matrix = new Matrix4();
const vec3 = new Vector3();

for (let i = 0; i < count; i++) {
    const r = random.range(spawnRadius * 0.05, spawnRadius);
    const phi = random.range(0, Math.PI * 2);
    const theta = random.range(0, Math.PI * 2);
    vec3.setFromSphericalCoords(r, phi, theta);

    instancedMesh.setMatrixAt(i, matrix.setPosition(vec3));
}

instancedMesh.on('click', (e) => {
    instancedMesh.setVisibilityAt(e.intersection.instanceId, false);
});

scene.add(instancedMesh);

const controls = new OrbitControls(camera, main.renderer.domElement);

main.createView({ scene, camera });
