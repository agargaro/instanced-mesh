import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { Main, PerspectiveCameraAuto, Utils } from '@three.ez/main';
import { AmbientLight, BoxGeometry, DirectionalLight, MeshStandardMaterial, Scene } from 'three';

const main = new Main();
const scene = new Scene();
const camera = new PerspectiveCameraAuto().translateZ(20);

const boxes = new InstancedMesh2(new BoxGeometry(), new MeshStandardMaterial());
boxes.computeBVH();

scene.on('click', (e) => {
  if (e.target === boxes) {
    boxes.removeInstances(e.intersection.instanceId);
  } else {
    const position = Utils.getSceneIntersection(main.raycaster.ray, camera, camera.position.z)

    boxes.addInstances(1, (obj) => {
      obj.position.copy(position);
      obj.quaternion.random();
      obj.color = Math.random() * 0xffffff;
    });
  }
});

scene.on('keydown', (e) => {
  if (e.code === 'Enter') boxes.clearInstances();
});

scene.add(boxes);

const ambientLight = new AmbientLight('white', 0.8);
const dirLight = new DirectionalLight('white', 2);
dirLight.position.set(0.5, 0.866, 0);
camera.add(ambientLight, dirLight);

main.createView({ scene, camera, backgroundColor: 0x222222 });
