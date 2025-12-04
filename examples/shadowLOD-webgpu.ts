import { AmbientLight, BoxGeometry, DirectionalLight, Mesh, PerspectiveCamera, PlaneGeometry, Scene, SphereGeometry, TorusGeometry, TorusKnotGeometry } from 'three';
import { WebGPURenderer, MeshBasicNodeMaterial, MeshPhongNodeMaterial, MeshNormalNodeMaterial } from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InstancedMesh2 } from '../src/index.webgpu.js';
import Stats from 'stats-gl';

// NOTE: WebGPU buffer approach has a UBO limit of ~1000 instances
// For larger counts, texture-based instancing is needed (not yet implemented)
const count = 1000;
const terrainSize = 100;

async function init(): Promise<void> {
  // Create WebGPU renderer
  const renderer = new WebGPURenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Initialize WebGPU
  await renderer.init();

  // Initialize stats-gl with GPU tracking for WebGPU
  const stats = new Stats({
    trackGPU: true,
    trackHz: true,
    trackCPT: false,
    logsPerSecond: 4,
    graphsPerSecond: 30,
    samplesLog: 40,
    samplesGraph: 10,
    precision: 2,
    horizontal: true,
    minimal: false,
    mode: 0
  });
  document.body.appendChild(stats.dom);
  stats.init(renderer);

  const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
  camera.position.set(100, 100, 100);

  const scene = new Scene();

  // Use NodeMaterials for WebGPU compatibility
  const materials = [
    new MeshBasicNodeMaterial({ color: 0xff0000 }),
    new MeshNormalNodeMaterial(),
    new MeshNormalNodeMaterial(),
    new MeshNormalNodeMaterial(),
    new MeshNormalNodeMaterial(),
    new MeshNormalNodeMaterial()
  ];

  const instancedMesh = new InstancedMesh2(new BoxGeometry(), materials, { capacity: count, renderer });
  instancedMesh.castShadow = true;

  // Add LOD levels with NodeMaterials
  instancedMesh.addLOD(new SphereGeometry(1, 8, 4), new MeshPhongNodeMaterial({ color: 0x00e6e6 }), 100);
  instancedMesh.addShadowLOD(new BoxGeometry(2, 2, 2));
  instancedMesh.addShadowLOD(new TorusKnotGeometry(0.8, 0.2, 32, 8), 80);
  instancedMesh.addShadowLOD(new TorusGeometry(0.8, 0.2, 32, 8), 110);

  instancedMesh.addInstances(count, (obj, index) => {
    obj.position.setX(Math.random() * terrainSize - terrainSize / 2).setZ(Math.random() * terrainSize - terrainSize / 2);
  });

  instancedMesh.computeBVH();

  const ground = new Mesh(new PlaneGeometry(terrainSize, terrainSize, 10, 10), new MeshPhongNodeMaterial({ color: 0x888888 }));
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

  scene.add(instancedMesh, ground, new AmbientLight(), dirLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minDistance = 10;
  controls.maxDistance = 200;
  controls.target.set(0, 0, 0);
  controls.update();
  controls.autoRotate = true;

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
    stats.update();
  });
}

init().catch(console.error);
