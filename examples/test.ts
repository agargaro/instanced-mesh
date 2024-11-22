// import { Main, PerspectiveCameraAuto } from '@three.ez/main';
// import { MeshNormalMaterial, Scene, SphereGeometry } from 'three';
// import { createTexture_mat4, InstancedMesh2 } from '../src/index.js';

// const count = 2;
// const worldSize = 10;

// const main = new Main(); // init renderer and other stuff
// const camera = new PerspectiveCameraAuto(70, 0.1, 500).translateZ(10);
// const scene = new Scene();

// const spheres = new InstancedMesh2(main.renderer, count, new SphereGeometry(), new MeshNormalMaterial());
// spheres.createInstances((obj, index) => {
//   obj.position.randomDirection().multiplyScalar(((Math.random() * 0.99 + 0.01) * worldSize) / 2);
// });

// scene.add(spheres);

// main.createView({ scene, camera, enabled: false });

// setTimeout(() => {
//   const newCount = 8;

//   spheres._maxCount = newCount;
//   spheres.instancesCount = newCount;

//   spheres.instanceIndex.array = new Uint32Array(newCount);
//   spheres._indexArray = spheres.instanceIndex.array;

//   spheres.visibilityArray = new Array(newCount).fill(true);

//   const kek = createTexture_mat4(newCount); // fix creating only image and not texture
//   spheres.matricesTexture.image = kek.image;
//   spheres.matricesTexture.needsUpdate = true;
//   spheres._matrixArray = kek.image.data as unknown as Float32Array;

//   spheres.createInstances((obj, index) => {
//     obj.position.randomDirection().multiplyScalar(((Math.random() * 0.99 + 0.01) * worldSize) / 2);
//   });
// }, 1000);
