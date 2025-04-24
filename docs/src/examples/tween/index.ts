import { Main, OrthographicCameraAuto } from '@three.ez/main';
import { Scene } from 'three';
import { planes } from './app.js';

const main = new Main();
const camera = new OrthographicCameraAuto(70, false).translateZ(2);
const scene = new Scene().add(planes);
main.createView({ scene, camera, backgroundColor: 0x222222 });
