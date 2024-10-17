import { Main, PerspectiveCameraAuto } from "@three.ez/main";
import { DirectionalLight, MeshPhongMaterial, Scene, SphereGeometry } from "three";
import { InstancedMesh2 } from "../src/index.js";

const main = new Main();

const spheres = new InstancedMesh2(main.renderer, 99 * 99, new SphereGeometry(0.4), new MeshPhongMaterial({ color: 'cyan' }));
spheres.perObjectFrustumCulled = false;

spheres.updateInstances((obj, index) => {
    obj.position.x = index % 99 - 49;
    obj.position.y = Math.trunc(index / 99) - 49;
});

spheres.on('click', (e) => spheres.setVisibilityAt(e.intersection.instanceId, false));

const camera = new PerspectiveCameraAuto(70).translateZ(5);
const dirLight = new DirectionalLight().translateZ(5);
const scene = new Scene().add(spheres, dirLight);
main.createView({ scene, camera, backgroundColor: 'white' });
