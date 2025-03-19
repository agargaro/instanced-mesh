import { Scene, DirectionalLight, AmbientLight } from 'three';
import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { torusKnots } from './app.js';

const main = new Main();
const camera = new PerspectiveCameraAuto().translateZ(20);
const scene = new Scene().add(torusKnots);
main.createView({ scene, camera });

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const ambientLight = new AmbientLight('white', 0.8);
scene.add(ambientLight);

const dirLight = new DirectionalLight('white', 2);
dirLight.position.set(0.5, 0.866, 0);
camera.add(dirLight);
