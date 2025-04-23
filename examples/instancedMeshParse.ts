import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { Color, IcosahedronGeometry, InstancedMesh, Matrix4, MeshBasicMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const camera = new PerspectiveCameraAuto().translateZ(1);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
main.createView({ scene, camera });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const amount = 20;
const count = Math.pow(amount, 3);
const matrix = new Matrix4();
const color = new Color();
const geometry = new IcosahedronGeometry(0.5, 3);
const material = new MeshBasicMaterial();
const im = new InstancedMesh(geometry, material, count);

let i = 0;
const offset = (amount - 1) / 2;

for (let x = 0; x < amount; x++) {
  for (let y = 0; y < amount; y++) {
    for (let z = 0; z < amount; z++) {
      color.setHex(Math.random() * 0xffffff);
      matrix.setPosition(offset - x, offset - y, offset - z);
      im.setMatrixAt(i, matrix);
      im.setColorAt(i, color);
      i++;
    }
  }
}

scene.add(im);

function parseToInstancedMesh2(): void {
  if (im.parent !== scene) return;
  im.removeFromParent();
  const im2 = InstancedMesh2.createFrom(im);
  scene.add(im2);
}

setTimeout(parseToInstancedMesh2, 1000);
