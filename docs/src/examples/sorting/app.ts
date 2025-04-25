import { createRadixSort, InstancedMesh2 } from '@three.ez/instanced-mesh';
import { MeshStandardMaterial, SphereGeometry } from 'three';

const geo = new SphereGeometry();
const mat = new MeshStandardMaterial({ transparent: true, depthWrite: false })
export const spheres = new InstancedMesh2(geo, mat);

spheres.sortObjects = true; // default is false
spheres.customSort = createRadixSort(spheres);

spheres.addInstances(50, (obj, index) => {
  obj.position.random().multiplyScalar(15).subScalar(7.5);
  obj.color = Math.random() * 0xffffff;
  obj.opacity = 0.4;
});
