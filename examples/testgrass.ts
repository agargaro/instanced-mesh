import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, DirectionalLightHelper, Mesh, MeshPhongMaterial, PlaneGeometry, Scene, SphereGeometry, Vector3, Vector4 } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { Grass } from './objects/grass.js';
import { TerrainSurfaceSampler } from './objects/terrainSurfaceSampler.js';

const main = new Main();
const ground = new Mesh(new PlaneGeometry(100, 100, 5, 5), new MeshPhongMaterial());
ground.geometry.rotateX(-Math.PI / 2);
const grass = new Grass(main.renderer, 20000, 5, new TerrainSurfaceSampler(ground), new Vector4(2, 2, 1, 1));
const sphere = new Mesh(new SphereGeometry(1), new MeshPhongMaterial({ color: 'red' }))

const dirLight = new DirectionalLight('white', 2).translateZ(10).translateY(10);
const helper = new DirectionalLightHelper(dirLight);
const yAxis = new Vector3(0, 1, 0);

const camera = new PerspectiveCameraAuto(70).translateZ(5).translateY(1);
// const scene = new Scene().add(grass, ground, sphere);
const scene = new Scene().add(grass, ground, sphere, new AmbientLight('white', 0), dirLight, helper, dirLight.target);
scene.on('animate', (e) => {
  dirLight.position.applyAxisAngle(yAxis, e.delta / 10);
  dirLight.lookAt(new Vector3(0, 0, 0));
});

main.createView({ scene, camera, enabled: false });

const controls = new OrbitControls(camera, main.renderer.domElement);
scene.on(['pointerdown', 'pointerup', 'dragend'], (e) => (controls.enabled = e.type === 'pointerdown' ? e.target === scene : true));