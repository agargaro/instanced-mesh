import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, Color, DirectionalLight, MeshStandardMaterial, Scene, SphereGeometry } from 'three';
import { InstancedMesh2 } from '../src/index.js';

const main = new Main();
const scene = new Scene();
const instancedMesh = new InstancedMesh2(new SphereGeometry(), new MeshStandardMaterial({ color: 'black' }));
instancedMesh.initUniformsPerInstance<MeshStandardMaterial>(({ metalness: 'float', roughness: 'float', emissive: 'vec3' }));
scene.add(instancedMesh, new AmbientLight(), new DirectionalLight().translateZ(15));

instancedMesh.addInstances(5, (obj, index) => {
  obj.position.randomDirection().multiplyScalar(4);
  obj.setUniform('metalness', Math.random());
  obj.setUniform('roughness', Math.random());
  obj.setUniform('emissive', new Color(0xffffff * Math.random()));
});

main.createView({ scene, camera: new PerspectiveCameraAuto().translateZ(15) });
