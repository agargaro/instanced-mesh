import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, type Intersection, MeshLambertMaterial, Scene, SphereGeometry } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const main = new Main();
const camera = new PerspectiveCameraAuto().translateZ(20);
const scene = new Scene();
main.createView({ scene, camera });

const spheres = new InstancedMesh2(new SphereGeometry(1, 8, 4), new MeshLambertMaterial());

spheres.addInstances(50000, (obj, index) => {
  obj.position.set(Math.random() * 200 - 100, Math.random() * 200 - 100, Math.random() * 100 - 50);
  obj.color = Math.random() * 0xffffff;
});

spheres.computeBVH();

const intersections: Intersection[] = [];
spheres.on('animate', () => {
  intersections.length = 0;
  spheres.raycast(main.raycaster, intersections);

  if (intersections.length > 0) {
    spheres.removeInstances(intersections[0].instanceId);
  }
});

// Ignore this, it's from three.ez/main package to avoid auto raycasting.
spheres.interceptByRaycaster = false;
scene.add(spheres);

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const ambientLight = new AmbientLight('white', 0.8);
const dirLight = new DirectionalLight('white', 2);
dirLight.position.set(0.5, 0.866, 0);
camera.add(dirLight, ambientLight);
