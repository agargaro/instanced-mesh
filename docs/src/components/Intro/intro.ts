import { Asset, Main, PerspectiveCameraAuto } from "@three.ez/main";
import { ACESFilmicToneMapping, Scene } from "three";
import { Floor } from "./floor";
import { Smoke } from "./smoke";
import { SpaceShip } from "./spaceship";

await Asset.preloadAllPending();

const main = new Main({ rendererParameters: { canvas: document.getElementById("three-canvas") } });
main.renderer.toneMapping = ACESFilmicToneMapping;
main.renderer.toneMappingExposure = 0.5;

const camera = new PerspectiveCameraAuto(50).translateY(8).rotateX(Math.PI / -4);
const scene = new Scene();
const spaceship = new SpaceShip();
scene.add(spaceship, new Smoke(spaceship), new Floor());

main.createView({ scene, camera });
