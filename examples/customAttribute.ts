import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, DoubleSide, NearestFilter, PlaneGeometry, Scene, Texture, TextureLoader, Vector2, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { InstancedMesh2 } from '../src';
import { TileMaterial } from './objects/tileMaterial';

const main = new Main(); // init renderer and other stuff
const camera = new PerspectiveCameraAuto(70).translateX(-44).translateY(-8).translateZ(-8);
const scene = new Scene();

const texture = await Asset.load<Texture>(TextureLoader, 'texture.png');
texture.magFilter = NearestFilter;

const side = 256;
const count = side ** 2;
const height = 20;
const plantsPos: Vector3[] = [];

const grass = new Vector2(0, 15),
  flower1 = new Vector2(12, 15),
  flower2 = new Vector2(13, 15),
  stone = new Vector2(1, 15),
  snow = new Vector2(2, 11),
  plant = new Vector2(14, 10);

const boxes = new InstancedMesh2(main.renderer, count, new BoxGeometry(), new TileMaterial(count, texture, 32, 32));

boxes.createInstances((obj, index) => {
  obj.position.x = (index % side) - side / 2;
  obj.position.z = Math.floor(index / side) - side / 2;
  const noise = Math.sin(obj.position.x * obj.position.z * 0.0005);
  obj.position.y = Math.floor((Math.max(-1, Math.sin(obj.position.x * 0.04) + Math.sin(obj.position.z * 0.04) + noise) * height) / 2);

  const cube = obj.position.y - noise * 8 > height * 0.8 ? snow : obj.position.y - noise * 8 > 0 ? stone : grass;
  obj.setUniform('offsetTexture', cube);

  if (cube === grass && Math.random() <= 0.2) plantsPos.push(obj.position);
});

boxes.computeBVH();

const plantsCount = plantsPos.length * 2;

const plants = new InstancedMesh2(main.renderer, plantsCount, new PlaneGeometry(),  new TileMaterial(plantsCount, texture, 32, 32, { side: DoubleSide })); // alphaTest doesnt' work

plants.createInstances((obj, index) => {
  obj.position.copy(plantsPos[Math.floor(index / 2)]);
  obj.position.y += 1;
  if (index % 2 === 0) obj.rotateY(Math.PI / 2);

  const value = Math.floor(index / 2) % 6;
  const cube = value > 1 ? plant : value === 1 ? flower1 : flower2;
  obj.setUniform('offsetTexture', cube);
});

plants.computeBVH();

scene.add(boxes, plants);

main.createView({ scene, camera, enabled: false, backgroundColor: 0xbdddf1, onAfterRender: () => {
    boxesRenderedCount.updateDisplay();
    plantsRenderedCount.updateDisplay();
  }
});

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.target.set(-42, -8, -9);
controls.minDistance = 2;
controls.maxDistance = 5;
controls.update();

const gui = new GUI();
gui.add(boxes.instances as any, 'length').name('boxes instances total').disable();
const boxesRenderedCount = gui.add(boxes, 'count').name('boxes instances rendered').disable();
gui.add(plants.instances as any, 'length').name('plants instances total').disable();
const plantsRenderedCount = gui.add(plants, 'count').name('plants instances rendered').disable();
