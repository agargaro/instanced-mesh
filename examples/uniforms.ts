import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { Color, EquirectangularReflectionMapping, MeshStandardMaterial, Scene, TorusKnotGeometry } from 'three';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '../src/index.js';

const main = new Main({ showStats: false }); //  FIX stats
const scene = new Scene();

const url = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr';
new RGBELoader().load(url, (texture) => {
  texture.mapping = EquirectangularReflectionMapping;
  scene.environment = texture;
});

const instancedMesh = new InstancedMesh2(new TorusKnotGeometry(1, 0.4, 128, 32), new MeshStandardMaterial(), { createEntities: true });
scene.add(instancedMesh);

instancedMesh.initUniformsPerInstance({ fragment: { metalness: 'float', roughness: 'float', emissive: 'vec3' } });

instancedMesh.addInstances(50, (obj, index) => {
  obj.position.random().multiplyScalar(20).subScalar(10);
  obj.quaternion.random();
  obj.setUniform('metalness', Math.random());
  obj.setUniform('roughness', Math.random());
  obj.setUniform('emissive', new Color(0xffffff * Math.random()));
});

instancedMesh.on('animate', (e) => {
  instancedMesh.updateInstances((obj) => obj.rotateX(e.delta));
});

main.createView({ scene, camera: new PerspectiveCameraAuto().translateZ(50) });
