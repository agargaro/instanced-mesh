import { InstancedEntity, InstancedMesh2 } from "@three.ez/instanced-mesh";
import { Asset, Main, PerspectiveCameraAuto } from "@three.ez/main";
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  MeshBasicMaterial,
  Object3D,
  Scene,
  SphereGeometry,
} from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { Pane } from "tweakpane";
const configs = {
  enableFollow: true,
  randomY: 0.1,
  colorsLuminance: 0.5,
  colorsSaturation: 95,
  flatFloorRange: 3,
  speed: 0.3,
};

const pane = new Pane();
pane.element.style.transform = "translateY(60px)";
const scene = new Scene();
const main = new Main({
  rendererParameters: { canvas: document.getElementById("three-canvas") },
});

const dirLight = new DirectionalLight("white", 2);
dirLight.position.set(0.5, 0.866, 0);
scene.add(dirLight);

const ambientLight = new AmbientLight("white", 0.8);
scene.add(ambientLight);

// add to pane for control
const lightFolder = pane.addFolder({ title: "Lights", expanded: true });

lightFolder.addBinding(dirLight, "position", {
  label: "Directional Light Position",
  x: { min: -10, max: 10, step: 0.1 },
  y: { min: -10, max: 10, step: 0.1 },
  z: { min: -10, max: 10, step: 0.1 },
});

lightFolder.addBinding(ambientLight, "intensity", {
  label: "Ambient Light Intensity",
  min: 0,
  max: 1,
  step: 0.01,
});
lightFolder.addBinding(ambientLight, "color", {
  label: "Ambient Light Color",
  format: "rgb",
});
lightFolder.addBinding(dirLight, "intensity", {
  label: "Directional Light Intensity",
  min: 0,

  max: 1,
  step: 0.01,
});
lightFolder.addBinding(dirLight, "color", {
  label: "Directional Light Color",
  format: "rgb",
});

// Floor setup
const floorCount = 40 * 40; // Increased count for more boxes
const floorGeometry = new BoxGeometry(1, 4, 1);
const floorMaterial = new MeshBasicMaterial();
const floor = new InstancedMesh2(floorGeometry, floorMaterial, {
  capacity: floorCount,
  createEntities: true,
});

// Create a grid of boxes
const gridSize = 40; // 20x20 grid
let currentHue = Math.random() + 0.6;
const currentColor = new Color().setHSL(currentHue, 92, 0.3);
floor.addInstances(floorCount, (obj, i) => {
  const x = (i % gridSize) - gridSize / 2;
  console.log("x:", x);
  const z = Math.floor(i / gridSize);
  console.log("z:", z);
  const y = Math.random() * 1;
  obj.position.set(x, y, z);
  obj.position.y = Math.random() * 0.1;
  obj.position.y += randomizeInstanceYPosition(obj);
  obj.color = randomizeInstanceColor();
});

floor.position.y = 8;
floor.position.z = -13;
floor.rotation.x = 0.87;

scene.on("animate", () => {
  floor.instances.forEach((instance) => {
    instance.position.z += configs.speed;
    // Reset position based on configurable coefficient
    if (instance.position.z > gridSize) {
      instance.position.z = 0;
      instance.position.y = Math.random() * 0.1;
      instance.position.y += randomizeInstanceYPosition(instance);
      currentHue = (currentHue + 0.0002) % 1;
      instance.color = randomizeInstanceColor();
    }
    instance.updateMatrix();
  });
});

scene.add(floor);

const floorFolder = pane.addFolder({ title: "Floor", expanded: true });
floorFolder.addBinding(configs, "speed", {
  label: "Speed",
  min: 0.01,
  max: 2,
  step: 0.01,
});
floorFolder.addBinding(configs, "randomY", {
  label: "Random Y",
  step: 0.01,
});

floorFolder.addBinding(floor, "position", {
  label: "Position",
  x: { step: 0.1 },
  y: { step: 0.1 },
  z: { step: 0.1 },
});
floorFolder.addBinding(floor, "rotation", {
  label: "Rotation",
  x: { min: -Math.PI, max: Math.PI, step: 0.01 },
  y: { min: -Math.PI, max: Math.PI, step: 0.01 },
  z: { min: -Math.PI, max: Math.PI, step: 0.01 },
});
floorFolder.addBinding(floor, "scale", {
  label: "Scale",
  x: { min: 0.1, max: 10, step: 0.1 },
  y: { min: 0.1, max: 10, step: 0.1 },
  z: { min: 0.1, max: 10, step: 0.1 },
});

// Spaceship setup
const load = await Asset.load<Object3D>(
  GLTFLoader,
  "./instanced-mesh/low_poly_space_ship.glb"
);
const spaceship = load.scene.children[0];

scene.add(spaceship);
spaceship.rotation.set(-0.5, 0, Math.PI);
spaceship.scale.set(0.4, 0.4, 0.4);
const spaceshipFolder = pane.addFolder({
  title: "Space Ship Rotation",
  expanded: true,
});
spaceshipFolder.addBinding(spaceship, "position", {
  label: "Position",
  x: { min: -10, max: 10, step: 0.1 },
  y: { min: -10, max: 10, step: 0.1 },
  z: { min: -10, max: 10, step: 0.1 },
});
spaceshipFolder.addBinding(spaceship, "rotation", {
  label: "Rotation",
  x: { min: -Math.PI, max: Math.PI, step: 0.01 },
  y: { min: -Math.PI, max: Math.PI, step: 0.01 },
  z: { min: -Math.PI, max: Math.PI, step: 0.01 },
});
spaceshipFolder.addBinding(spaceship, "scale", {
  label: "Scale",
  x: { min: 0.1, max: 10, step: 0.1 },
  y: { min: 0.1, max: 10, step: 0.1 },
  z: { min: 0.1, max: 10, step: 0.1 },
});
spaceshipFolder.addBinding(spaceship, "visible");
spaceshipFolder.addBinding(configs, "enableFollow", { label: "Enable Follow" });

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
missiles.userData.visibleCount = 0;
scene.add(missiles);

function randomizeInstanceYPosition(instance: InstancedEntity) {
  if (Math.abs(instance.position.x) < configs.flatFloorRange) {
    return Math.min(Math.random() * 0.5, 4);
  } else {
    return Math.min(Math.random() * Math.abs(instance.position.x) * 0.5, 4);
  }
}

function randomizeInstanceColor() {
  return new Color().setHSL(
    currentHue,
    Math.random() * configs.colorsSaturation,
    Math.random() * configs.colorsLuminance
  );
}

// Add color controls to the floor folder
floorFolder.addBinding(configs, "colorsLuminance", {
  label: "Color Luminance",
  min: 0,
  max: 1,
  step: 0.01,
});
floorFolder.addBinding(configs, "colorsSaturation", {
  label: "Color Saturation",
  min: 0,
  max: 100,
  step: 1,
});
floorFolder.addBinding(configs, "flatFloorRange", {
  label: "Flat Floor Range",
  min: 0,
  max: gridSize,
  step: 1,
});

function shootMissile() {
  if (missiles.userData.visibleCount < missileCount) {
    const missile = missiles.instances[missiles.userData.visibleCount++];
    missile.position.copy(spaceship.position);
    missile.visible = true;
    missile.updateMatrix();
    alert("Missile fired");
  }
}

// window.addEventListener("pointerdown", shootMissile);

// Animation loop
scene.on("animate", (e) => {
  if (configs.enableFollow) {
    spaceship.position.y += (pointer.y - spaceship.position.y) * 0.1;
    spaceship.position.x += (pointer.x - spaceship.position.x) * 0.1;

    spaceship.rotation.y = (pointer.x - spaceship.position.x) * 0.3;
    spaceship.rotation.x = (pointer.y - spaceship.position.y) * 0.2 - 0.5;
  }
});

main.createView({
  scene,
  camera: new PerspectiveCameraAuto(70).translateZ(10),
});
