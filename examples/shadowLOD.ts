import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, BoxGeometry, DirectionalLight, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, PlaneGeometry, Scene, SphereGeometry, TorusGeometry, TorusKnotGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InstancedMesh2 } from '../src/index.js';

const count = 200000;
const terrainSize = 3000;

const main = new Main(); // init renderer and other stuff
main.renderer.shadowMap.enabled = true;

const camera = new PerspectiveCameraAuto(50).translateX(100).translateY(100).translateZ(100);
const scene = new Scene();

const materials = [
  new MeshBasicMaterial({ color: 'red' }),
  new MeshNormalMaterial(),
  new MeshNormalMaterial(),
  new MeshNormalMaterial(),
  new MeshNormalMaterial(),
  new MeshNormalMaterial()
];

const instancedMesh = new InstancedMesh2(new BoxGeometry(), materials, { capacity: count });
instancedMesh.castShadow = true;

// instancedMesh.addLOD(new SphereGeometry(1, 8, 4), new MeshPhongMaterial({ color: 0x00e6e6 }), 100);
instancedMesh.addLOD(new TorusKnotGeometry(0.8, 0.2, 32, 8), new MeshPhongMaterial({ color: 0x00e6e6 }), 100);
instancedMesh.addShadowLOD(new BoxGeometry(2, 2, 2));
instancedMesh.addShadowLOD(new TorusKnotGeometry(0.8, 0.2, 32, 8), 80);
instancedMesh.addShadowLOD(new TorusGeometry(0.8, 0.2, 32, 8), 110);

instancedMesh.addInstances(count, (obj, index) => {
  // obj.position.setX(Math.random() * terrainSize - terrainSize / 2).setZ(Math.random() * terrainSize - terrainSize / 2);

  // Deterministic placement: simple XY grid, spread evenly
  const gridSize = Math.ceil(Math.sqrt(count));
  const spacing = terrainSize / gridSize;
  const x = (index % gridSize) * spacing - terrainSize / 2 + spacing / 2;
  const z = Math.floor(index / gridSize) * spacing - terrainSize / 2 + spacing / 2;
  obj.position.set(x, 0, z);
  
});

instancedMesh.computeBVH();

const ground = new Mesh(new PlaneGeometry(terrainSize, terrainSize, 10, 10), new MeshPhongMaterial());
ground.receiveShadow = true;
ground.translateY(-1);
ground.rotateX(Math.PI / -2);

const dirLight = new DirectionalLight();
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
dirLight.shadow.camera.updateProjectionMatrix();

dirLight.position.set(0, 30, 50);

scene.on('animate', (e) => {
  controls.update();
});

scene.add(instancedMesh, ground, new AmbientLight(), dirLight);

main.createView({ scene, camera, enabled: false, backgroundColor: 0xd3d3d3 });

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 10;
controls.maxDistance = 100;
controls.target.set(0, 0, 0);
controls.update();
controls.autoRotate = true;
