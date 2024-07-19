import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { BoxGeometry, DoubleSide, NearestFilter, PlaneGeometry, Scene, Texture, TextureLoader, Vector2, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { CullingBVH, CullingLinear, InstancedMesh2 } from '../src';
import { TileMaterial } from './tileMaterial';

const main = new Main({ rendererParameters: { antialias: true } }); // init renderer and other stuff
const camera = new PerspectiveCameraAuto(70).translateX(-44).translateY(-8).translateZ(-8);
const scene = new Scene();

const texture = await Asset.load<Texture>(TextureLoader, 'texture.png');
texture.magFilter = NearestFilter;

const vec2 = new Vector2();

const side = 256;
const count = side ** 2;
const height = 20;
const plantsPos: Vector3[] = [];

const grass = [0, 15], stone = [1, 15], snow = [2, 11], plant = [14, 10];

const boxes = new InstancedMesh2(main.renderer, count, {
    cullingType: CullingBVH,
    geometry: new BoxGeometry(),
    material: new TileMaterial(count, texture, 32, 32),
    onInstanceCreation: (obj, index) => {
        obj.position.x = (index % side) - side / 2;
        obj.position.z = Math.floor(index / side) - side / 2;
        const noise = Math.sin(obj.position.x * obj.position.z * 0.0005);
        obj.position.y = Math.floor(Math.max(-1, Math.sin(obj.position.x * 0.04) + Math.sin(obj.position.z * 0.04) + noise) * height / 2);

        const cube = obj.position.y - noise * 8 > height * 0.8 ? snow : (obj.position.y - noise * 8 > 0 ? stone : grass);
        obj.setUniform('offsetTexture', vec2.set(cube[0], cube[1]));

        if (cube === grass && Math.random() <= 0.05) plantsPos.push(obj.position);
    },
});

const plantsCount = plantsPos.length * 2;

const plants = new InstancedMesh2(main.renderer, plantsCount, {
    cullingType: CullingBVH,
    geometry: new PlaneGeometry(),
    material: new TileMaterial(plantsCount, texture, 32, 32, { transparent: true, side: DoubleSide, depthWrite: false }),
    sortObjects: true,
    onInstanceCreation: (obj, index) => {
        obj.position.copy(plantsPos[Math.floor(index / 2)]);
        obj.position.y += 1;
        if (index % 2 === 0) obj.rotateY(Math.PI / 2);

        obj.setUniform('offsetTexture', vec2.set(plant[0], plant[1]));
    },
});

scene.add(boxes, plants);

main.createView({
    scene, camera, enabled: false, backgroundColor: 0xBDDDF1, onAfterRender: () => {
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
