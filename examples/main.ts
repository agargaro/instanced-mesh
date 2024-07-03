import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, MeshLambertMaterial, Scene, SphereGeometry, SpotLight } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { InstancedMesh2 } from '../src';

const main = new Main();

const camera = new PerspectiveCameraAuto(70).translateZ(10);
const scene = new Scene();

const instancedMesh = new InstancedMesh2(200000, {
  geometry: new SphereGeometry(0.5, 32, 16),
  material: new MeshLambertMaterial({ color: 'blue' }),
  onInstanceCreation: (o) => o.position.randomDirection().multiplyScalar(Math.random() * 50000)
});

scene.add(instancedMesh, new AmbientLight(), new SpotLight('white', 1000));

instancedMesh.on('animate', () => instancedMesh.updateCulling(camera));

main.createView({ scene, camera, backgroundColor: 'gray' });

const controls = new OrbitControls(camera, main.renderer.domElement);
scene.on(['pointerdown', 'pointerup', 'dragend'], (e) => (controls.enabled = e.type === 'pointerdown' ? e.target === scene : true));
