import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { Scene } from 'three';
import { planes } from './app.js';

const main = new Main();
const camera = new PerspectiveCameraAuto().translateZ(2);
const scene = new Scene().add(planes);
main.createView({ scene, camera });
