import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { createNoise2D } from 'simplex-noise';
import { AmbientLight, BoxGeometry, Color, DirectionalLight, NearestFilter, NearestMipMapLinearFilter, PlaneGeometry, Scene, Texture, TextureLoader, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InstancedMesh2 } from '../src/index.js';
import { TileLambertMaterial } from './objects/tileLambertMaterial.js';

const noise2D = createNoise2D();
const main = new Main({ rendererParameters: { antialias: false } });
const camera = new PerspectiveCameraAuto();
const scene = new Scene();
scene.continuousRaycasting = true;
main.createView({ scene, camera, backgroundColor: 0xbdddf1 });

const controls = new OrbitControls(camera, main.renderer.domElement);
camera.position.set(0, 15, 0);
controls.target.set(30, 0, -30);
controls.autoRotate = true;
scene.on('animate', () => controls.update());

const map = await Asset.load<Texture>(TextureLoader, 'texture.png');
map.magFilter = NearestFilter;
map.minFilter = NearestMipMapLinearFilter;

const dirLight = new DirectionalLight('white', 2);
dirLight.position.set(0.5, 0.866, 0);
const ambientLight = new AmbientLight('white', 0.8);

const side = 256;
const count = side ** 2;

const cubeOffset = {
  grass: new Vector2(0, 15), stone: new Vector2(1, 15), snow: new Vector2(2, 11),
  plant: new Vector2(14, 10), flower1: new Vector2(12, 15), flower2: new Vector2(13, 15)
};

const boxes = new InstancedMesh2(new BoxGeometry(), new TileLambertMaterial(32, 32, { map }), { capacity: count });
const plants = new InstancedMesh2(new PlaneGeometry(), new TileLambertMaterial(32, 32, { map, alphaTest: 0.9 }));

scene.add(boxes, plants, ambientLight, dirLight);

boxes.initUniformsPerInstance({ fragment: { offset: 'vec2' } });
plants.initUniformsPerInstance({ fragment: { offset: 'vec2' } });

boxes.addInstances(count, (box, index) => {
  box.color = 'white';
  box.position.x = (index % side) - side / 2;
  box.position.z = Math.floor(index / side) - side / 2;
  const noiseY = noise2D(box.position.x / 150, box.position.z / 150);
  box.position.y = Math.floor(noiseY * 20);

  const noiseOffset = box.position.y + noise2D(box.position.x / 50, box.position.y / 50) * 2;
  const boxOffset = noiseOffset > 10 ? cubeOffset.snow : (noiseOffset > -5 ? cubeOffset.stone : cubeOffset.grass);
  box.setUniform('offset', boxOffset);

  if (boxOffset === cubeOffset.grass && Math.random() <= 0.1) {
    const rand = Math.random();
    const plantOffset = rand > 0.5 ? cubeOffset.plant : rand > 0.25 ? cubeOffset.flower1 : cubeOffset.flower2;

    plants.addInstances(4, (plant, index) => { // this is just a demo, is not the best way
      plant.position.copy(box.position);
      plant.position.y += 1;
      plant.rotateY(Math.PI / 2 * index);
      plant.setUniform('offset', plantOffset);
    });
  }
});

boxes.computeBVH();
plants.computeBVH();

plants.interceptByRaycaster = false;

const white = new Color('white');
boxes.on('pointerintersection', (e) => {
  const id = e.intersection.instanceId;
  if (boxes.getColorAt(id).equals(white)) {
    boxes.setColorAt(id, Math.random() * 0xffffff);
  }
});
