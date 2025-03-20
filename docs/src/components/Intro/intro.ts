import { GLTFLoader } from "three/examples/jsm/Addons.js";

import {
  Scene,
  Mesh,
  BoxGeometry,
  ConeGeometry,
  SphereGeometry,
  MeshBasicMaterial,
  Object3D,
} from "three";
import { Asset, Main, PerspectiveCameraAuto } from "@three.ez/main";
import { InstancedMesh2 } from "@three.ez/instanced-mesh";
import {Pane} from 'tweakpane';
import { s } from "@astrojs/starlight/expressive-code/hast";
import { exp } from "three/tsl";

const pane = new Pane();
pane.element.style.transform = 'translateY(60px)';
const scene = new Scene();
const main = new Main({
  rendererParameters: { canvas: document.getElementById("three-canvas") },
});

// Floor setup
const floorCount = 4;
const floorGeometry = new BoxGeometry(1, 1, 1);
const floorMaterial = new MeshBasicMaterial({ color: 0x222244 });
const floor = new InstancedMesh2(floorGeometry, floorMaterial, {
  capacity: floorCount,
  createEntities: true,
});

floor.addInstances(floorCount, (obj, i) => {
    obj.position.set(((i % 20) - 10) * 1.1, -5, Math.floor(i / 20) * 1.1);
});

scene.add(floor);

// Add floor controls to GUI
const floorFolder = pane.addFolder({title: 'Floor', expanded: true});
floorFolder.addBinding(floor, 'position', {
    label: 'Position',
    x: {min: -10, max: 10, step: 0.1},
    y: {min: -10, max: 10, step: 0.1},
    z: {min: -10, max: 10, step: 0.1}
});
floorFolder.addBinding(floor, 'rotation', {
    label: 'Rotation',
    x: {min: -Math.PI, max: Math.PI, step: 0.01},
    y: {min: -Math.PI, max: Math.PI, step: 0.01},
    z: {min: -Math.PI, max: Math.PI, step: 0.01}
});
floorFolder.addBinding(floor, 'scale', {
    label: 'Scale',
    x: {min: 0.1, max: 10, step: 0.1},
    y: {min: 0.1, max: 10, step: 0.1},
    z: {min: 0.1, max: 10, step: 0.1}
});

// Spaceship setup
const load = await Asset.load<Object3D>(
  GLTFLoader,
  "./instanced-mesh/low_poly_space_ship.glb"
);
const spaceship = load.scene.children[0];
window.spaceship = spaceship;

// helper function to rotate spaceship

// spaceship.rotateX(Math.PI);
// animate space shi
scene.add(spaceship);
const configs = {
 enableFollow : false}

// set spaceship rotation
// TODO - simplify this 
spaceship.rotation.set(-0.50, 0, Math.PI);
spaceship.scale.set(0.4, 0.4, 0.4);
// ADD SPACE SHIP ROTATION IN GUI 
const spaceshipFolder = pane.addFolder({title: 'Space Ship Rotation', expanded: true});
spaceshipFolder.addBinding(spaceship, 'position', {label: 'Position', x: {min: -10, max: 10, step: 0.1}, y: {min: -10, max: 10, step: 0.1}, z: {min: -10, max: 10, step: 0.1}});
spaceshipFolder.addBinding(spaceship, 'rotation', {label: 'Rotation', x: {min: -Math.PI, max: Math.PI, step: 0.01}, y: {min: -Math.PI, max: Math.PI, step: 0.01}, z: {min: -Math.PI, max: Math.PI, step: 0.01}});
spaceshipFolder.addBinding(spaceship, 'scale', {label: 'Scale', x: {min: 0.1, max: 10, step: 0.1}, y: {min: 0.1, max: 10, step: 0.1}, z: {min: 0.1, max: 10, step: 0.1}});
spaceshipFolder.addBinding(spaceship, 'visible');
spaceshipFolder.addBinding(configs, 'enableFollow', {label: 'Enable Follow'});

// Pointer movement
const pointer = { y: 0, x: 0 };
window.addEventListener("pointermove", (e) => {
  pointer.y = -(e.clientY / window.innerHeight - 0.5) * 10;
  pointer.x = (e.clientX / window.innerWidth - 0.5) * 10;
});

// Missiles setup using InstancedMesh2
const missileCount = 100;
const missileGeometry = new SphereGeometry(0.05);
const missileMaterial = new MeshBasicMaterial({ color: 0xffcc00 });
const missiles = new InstancedMesh2(missileGeometry, missileMaterial, {
  capacity: missileCount,
  createEntities: true,
});
//   missiles.visibleCount = 0;
// scene.add(missiles);

function shootMissile() {
  // if (missiles.visibleCount < missileCount) {
  //   const missile = missiles.instances[missiles.visibleCount++];
  //   missile.position.copy(spaceship.position);
  //   missile.visible = true;
  //   missile.updateMatrix();
  // }
}

window.addEventListener("pointerdown", shootMissile);

// Animation loop
scene.on("animate", (e) => {


if( configs.enableFollow){
  spaceship.position.y += (pointer.y - spaceship.position.y) * 0.1;
  spaceship.position.x += (pointer.x - spaceship.position.x) * 0.1;
// the max rotation for y is 0.5
// the center must be the spaceship position

spaceship.rotation.y = (pointer.x - spaceship.position.x) * 0.3;
spaceship.rotation.x = ((pointer.y - spaceship.position.y) * 0.2) - 0.5;
}
  // for (let i = 0; i < missiles.visibleCount; i++) {
  //   const missile = missiles.instances[i];
  //   missile.position.z -= 0.2;

  //   floor.instances.forEach((instance) => {
  //     if (instance.position.distanceTo(missile.position) < 1) {
  //       instance.position.y = -4.5;
  //       instance.updateMatrix();
  //       floor.setColorAt(instance.index, new Color(0x8888ff));
  //     }
  //   });

  //   if (missile.position.z < -10) {
  //     missile.visible = false;
  //     missiles.visibleCount--;
  //     [missiles.instances[i], missiles.instances[missiles.visibleCount]] = [
  //       missiles.instances[missiles.visibleCount],
  //       missiles.instances[i],
  //     ];
  //     missile.updateMatrix();
  //   } else {
  //     missile.updateMatrix();
  //   }
  // }

  floor.instances.forEach((instance) => {
    if (instance.position.y > -5) {
      instance.position.y += (-5 - instance.position.y) * 0.1;
      instance.updateMatrix();
    }
    if (instance.position.x > 5) {
      instance.position.x += (-5 - instance.position.x) * 0.1;
      instance.updateMatrix();
    }
  });
});

main.createView({
  scene,
  camera: new PerspectiveCameraAuto(70).translateZ(10),
});
