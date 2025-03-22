import { Asset, Main, PerspectiveCameraAuto } from "@three.ez/main";
import { AmbientLight, OrthographicCamera, Scene } from "three";
import { SpaceShip } from "./spaceship";
import { Pane } from "tweakpane";

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
const camera = new PerspectiveCameraAuto().translateZ(10);
cameraFolder.addBinding(camera, "fov", { min: 1, max: 179 });
cameraFolder.addBinding(camera, "position", { x: {}, y: {}, z: {} });
cameraFolder.addBinding(camera, "rotation", { x: {}, y: {}, z: {} });

main.createView({ scene, camera });

scene.add(new SpaceShip(), new AmbientLight(0xffffff, 0.5));
