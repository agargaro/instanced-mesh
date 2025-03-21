import { InstancedMesh2 } from "@three.ez/instanced-mesh";
import { Asset, Main, PerspectiveCameraAuto } from "@three.ez/main";
import { AmbientLight, Scene } from "three";
import { SpaceShip } from "./spaceship";
import { Floor } from "./floor";

await Asset.preloadAllPending();

const main = new Main({ rendererParameters: { canvas: document.getElementById("three-canvas") } });
const scene = new Scene();
const camera = new PerspectiveCameraAuto(50).rotateX(Math.PI / 4).translateZ(10).translateY(2);

main.createView({ scene, camera });

scene.add(new SpaceShip(), new Floor());
