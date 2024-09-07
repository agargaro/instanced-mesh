import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, MeshLambertMaterial, Scene, SphereGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createRadixSort, InstancedMesh2, InstancedMeshLOD } from '../src/index.js';

const main = new Main();

const camera = new PerspectiveCameraAuto(70).translateZ(3.5).translateY(1);
const controls = new OrbitControls(camera, main.renderer.domElement);

const scene = new Scene();

const instancedMeshLOD = new InstancedMeshLOD(main.renderer, 500000);

instancedMeshLOD.addLevel(new SphereGeometry(1, 30, 15), new MeshLambertMaterial({ color: 'yellow' }));
instancedMeshLOD.addLevel(new SphereGeometry(1, 20, 10), new MeshLambertMaterial({ color: 'orange' }), 15);
instancedMeshLOD.addLevel(new SphereGeometry(1, 10, 5), new MeshLambertMaterial({ color: 'green' }), 75);
instancedMeshLOD.addLevel(new SphereGeometry(1, 5, 3), new MeshLambertMaterial({ color: 'red' }), 150);

instancedMeshLOD.levels[3].object.geometry.computeBoundingSphere(); // improve

// instancedMeshLOD.sortObjects = true;
// const radixSort = createRadixSort(instancedMeshLOD.levels[0].object);
// instancedMeshLOD.customSort = radixSort;

// const instancedMeshLOD = new InstancedMesh2(main.renderer, 7000, new SphereGeometry(1, 32, 16), new MeshLambertMaterial({ color: 'green' }));
// instancedMeshLOD.perObjectFrustumCulled = false;

instancedMeshLOD.updateInstances((object, index) => {
  object.position.z = Math.random() * 5000 - 2500;
  object.position.x = Math.random() * 5000 - 2500;
});

instancedMeshLOD.computeBVH();

scene.add(instancedMeshLOD, new AmbientLight(), new DirectionalLight().translateZ(3.5));

main.createView({ scene, camera, enabled: false });

scene.on('animate', (e) => console.log(`triangles: ${main.renderer.info.render.triangles}, drawCall: ${main.renderer.info.render.calls}`));
