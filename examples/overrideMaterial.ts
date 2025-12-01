import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, BoxGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const camera = new PerspectiveCameraAuto().translateZ(10);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
main.createView({ scene, camera });
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const material = new MeshLambertMaterial({ emissive: 0x009900 });
const material2 = new MeshLambertMaterial({ emissive: 0x000099 });

// const boxes = new InstancedMesh2(new BoxGeometry(), material, { capacity: 1, renderer: main.renderer });
// const boxes2 = new InstancedMesh2(new BoxGeometry(), material2, { renderer: main.renderer });
// const boxes3 = new InstancedMesh2(new BoxGeometry(), material2, { renderer: main.renderer });

const boxes = new InstancedMesh2(new BoxGeometry(), material, { capacity: 1 });
const boxes2 = new InstancedMesh2(new BoxGeometry(), material2);
const boxes3 = new InstancedMesh2(new BoxGeometry(), material2);

boxes.addInstances(1, (obj, index) => {
  obj.position.x = index - 5;
  obj.position.y = 1.5;
});

boxes2.addInstances(3, (obj, index) => {
  obj.position.x = index - 5;
  obj.position.y = 0;
});

boxes3.addInstances(5, (obj, index) => {
  obj.position.x = index - 5;
  obj.position.y = -1.5;
});

boxes.frustumCulled = false;
boxes2.frustumCulled = false;
boxes3.frustumCulled = false;

boxes.matricesTexture.name = 'boxes';
boxes2.matricesTexture.name = 'boxes2';
boxes3.matricesTexture.name = 'boxes3';

boxes.name = 'boxes';
boxes2.name = 'boxes2';
boxes3.name = 'boxes3';

boxes.material.name = 'material1';
boxes2.material.name = 'material2';

const box = new Mesh(new BoxGeometry(), material).translateX(-7).translateY(1.5);
const box2 = new Mesh(new BoxGeometry(), material2).translateX(-7);
const box3 = new Mesh(new BoxGeometry(), material2).translateX(-7).translateY(-1.5);
const overrideMaterial = new MeshLambertMaterial();
overrideMaterial.name = 'overrideMaterial';

scene.add(box, boxes, box2, boxes2, boxes3, box3, new AmbientLight());

scene.activeSmartRendering();

setInterval(() => {
  scene.overrideMaterial = scene.overrideMaterial === overrideMaterial ? null : overrideMaterial;

  scene.needsRender = true;

  boxes.addInstances(1, (obj, index) => {
    obj.position.x = index - 5;
    obj.position.y = 1.5;
    obj.color = Math.random() * 0xffffff;
  });

  boxes2.addInstances(1, (obj, index) => {
    obj.position.x = index - 5;
    obj.position.y = 0;
    obj.color = Math.random() * 0xffffff;
  });

  boxes3.addInstances(1, (obj, index) => {
    obj.position.x = index - 5;
    obj.position.y = -1.5;
    obj.color = Math.random() * 0xffffff;
  });
}, 1000);
