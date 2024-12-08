import { Main, PerspectiveCameraAuto, Tween } from '@three.ez/main';
import { Color, Euler, MeshBasicMaterial, PlaneGeometry, Scene, Vector3 } from 'three';

const main = new Main();
const scene = new Scene();
const camera = new PerspectiveCameraAuto().translateZ(2);


main.createView({ scene, camera, enabled: false });

// TODO: FIX COLOR AND TWEEN TIME 0
