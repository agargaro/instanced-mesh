import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  Fog,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SRGBColorSpace
} from 'three';

export const main = new Main({ showStats: location.hash === '#debug' });
export const scene = new Scene();
export const fog = new Fog(0x25272c, 1, 18);
scene.fog = fog;
export const camera = new PerspectiveCameraAuto(48, 0.1, 500);

const cSize = 1024, cCells = 16;
const cCanvas = document.createElement('canvas');
cCanvas.width = cSize;
cCanvas.height = cSize;
const cCtx = cCanvas.getContext('2d')!;
for (let y = 0; y < cCells; y++)
  for (let x = 0; x < cCells; x++) {
    cCtx.fillStyle = (x + y) % 2 ? '#151b28' : '#0a0e17';
    cCtx.fillRect((x * cSize) / cCells, (y * cSize) / cCells, cSize / cCells, cSize / cCells);
    cCtx.strokeStyle = 'rgba(255,255,255,0.06)';
    cCtx.strokeRect((x * cSize) / cCells, (y * cSize) / cCells, cSize / cCells, cSize / cCells);
  }

const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap';
document.head.appendChild(fontLink);

export const checker = new CanvasTexture(cCanvas);
checker.wrapS = checker.wrapT = RepeatWrapping;
checker.repeat.set(42, 42);
checker.colorSpace = SRGBColorSpace;
checker.magFilter = NearestFilter;
checker.minFilter = NearestFilter;
checker.generateMipmaps = false;
checker.anisotropy = 1;
checker.needsUpdate = true;

export const ground = new Mesh(
  new PlaneGeometry(900, 900),
  new MeshStandardMaterial({ map: checker, roughness: 0.92 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.03;

export const light = new DirectionalLight(0xffffff, 2.4);
light.position.set(5, 10, 4);
scene.add(ground, light, new AmbientLight(0xffffff, 1));

main.createView({ scene, camera, backgroundColor: 0x25272c });
