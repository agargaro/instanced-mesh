import { Asset, Main, PerspectiveCameraAuto } from "@three.ez/main";
import { AmbientLight, OrthographicCamera, Scene, Vector3 } from "three";
import { SpaceShip } from "./spaceship";
import { Pane } from "tweakpane";
import { Smoke } from "./smoke";

await Asset.preloadAllPending();

window.pane = new Pane();
pane.element.style.transform = "translateY(60px)";

const cameraFolder = pane.addFolder({
  title: "camera",
  expanded: true,
});

const main = new Main({
  rendererParameters: { canvas: document.getElementById("three-canvas") },
});
const scene = new Scene();
const camera = new PerspectiveCameraAuto().translateZ(10).translateY(10);
camera.lookAt(new Vector3(0, 0, 0));

cameraFolder.addBinding(camera, "fov", { min: 1, max: 179 });
cameraFolder.addBinding(camera, "position", { x: {}, y: {}, z: {} });
cameraFolder.addBinding(camera, "rotation", { x: {}, y: {}, z: {} });

const spaceship = new SpaceShip();
const smoke = new Smoke(spaceship);

scene.add(smoke);

main.createView({ scene, camera });

scene.add(spaceship, new AmbientLight(0xffffff, 0.5));
