import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, Color, DirectionalLight, EquirectangularReflectionMapping, MeshStandardMaterial, Scene, TorusKnotGeometry } from 'three';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const main = new Main({ showStats: false });
const scene = new Scene();
const camera = new PerspectiveCameraAuto().translateZ(30);
const dirLigth = new DirectionalLight();

const url = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr';
new RGBELoader().load(url, (texture) => {
  texture.mapping = EquirectangularReflectionMapping;
  scene.environment = texture;
});

const instancedMesh = new InstancedMesh2(new TorusKnotGeometry(1, 0.4, 128, 32), new MeshStandardMaterial(), { createInstances: true, capacity: 50 });

instancedMesh.initUniformsPerInstance(({ metalness: 'float', roughness: 'float', emissive: 'vec3' }));

instancedMesh.addInstances(50, (obj) => {
  obj.position.random().multiplyScalar(20).subScalar(10);
  obj.quaternion.random();
  obj.setUniform('metalness', Math.random());
  obj.setUniform('roughness', Math.random());
  obj.setUniform('emissive', new Color(0xffffff * Math.random()));
});

instancedMesh.on('animate', (e) => {
  instancedMesh.updateInstances((obj) => obj.rotateX(e.delta));
});

scene.add(instancedMesh, new AmbientLight('white', 1));
camera.add(dirLigth, dirLigth.target);

main.createView({ scene, camera });
