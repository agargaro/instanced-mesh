# three.ez - InstancedMesh2

[![npm](https://img.shields.io/npm/v/@three.ez/instanced-mesh)](https://www.npmjs.com/package/@three.ez/instanced-mesh)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=three-ez_instanced-mesh&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=three-ez_instanced-mesh)
[![DeepScan grade](https://deepscan.io/api/teams/21196/projects/27592/branches/883543/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=21196&pid=27592&bid=883543)
[![Stars](https://badgen.net/github/stars/three-ez/instanced-mesh)](https://github.com/three-ez/instanced-mesh)
[![BundlePhobia](https://badgen.net/bundlephobia/min/@three.ez/instanced-mesh)](https://bundlephobia.com/package/@three.ez/instanced-mesh)
[![Discord](https://img.shields.io/discord/1150091562227859457)](https://discord.gg/MVTwrdX3JM)

`InstancedMesh2` is an alternative version of `InstancedMesh` that offers advantages:
- frustum culling for each instance
- visibility for each instance
- each instance has an object similar to Object3D
- sorting
- BVH spatial indexing for fast raycasting and frustum culling

## HOW DOES IT WORK?

It works similarly to `BatchedMesh`: 
Data (matrices, colors, etc.) are stored in `Texture` instead of `InstancedAttribute`.
The one `InstancedAttribute` is used to store the indices of the instances to be rendered.

```typescript
import { CullingBVH, InstancedMesh2 } from '@three.ez/instanced-mesh';

const myInstancedMesh = new InstancedMesh2(renderer, count, {
  geometry: geometry, // mandatory. default: undefined
  material: material, // default: undefined
  perObjectCulling: true, // default: true
  sortObjects: false, // default: false
  bvh: {}, // default: { margin: 0, highPrecision: false }
  onInstanceCreation: (obj, index) => {
    obj.position.random();
    obj.scale.setScalar(2);
    obj.quaternion.random();
  }
});
```

This library has only one dependency: `three.js r159+`.

## 🔑 Key Features 

### 🛠️ Meshes Instances
Each instance has its own object accessible through the `instances` property. <br />
You can easily modify visibility, apply transformations, and add custom data to each mesh instance.

```typescript
myInstancedMesh.instances[0].visible = false;

myInstancedMesh.instances[1].customData = {};

myInstancedMesh.instances[2].position.random();
myInstancedMesh.instances[2].quaternion.random();
myInstancedMesh.instances[2].scale.random();
myInstancedMesh.instances[2].updateMatrix(); // necessary after transformations

myInstancedMesh.instances[3].rotateX(Math.PI);
myInstancedMesh.instances[3].updateMatrix(); // necessary after transformations
```     

### 🎥 Frustum Culling
InstancedMesh2 offers three different strategies for frustum culling:
- **CullingNone**: Frustum culling is disabled, suitable if all instances are always visible in the camera's frustum.
- **CullingLinear**: Individual frustum culling for each instance, necessary if most meshes are animated.
- **CullingBVH**: Fast frustum culling (and raycasting) using a BVH, ideal for low animated instances (you can only modify instances in `onInstanceCreation` callback).

```typescript
const myInstancedMesh = new InstancedMesh2(renderer, count, {
  cullingType: CullingLinear, // specify cullingType here 
});
``` 

## ⬇️ Installation

You can install it via npm using the following command:

```bash
npm install @three.ez/instanced-mesh
```

Or you can import it from CDN:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.166.1/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.166.1/examples/jsm/",
    "@three.ez/instanced-mesh": "https://cdn.jsdelivr.net/npm/@three.ez/instanced-mesh/index.js",
    "bvh.js": "https://cdn.jsdelivr.net/npm/bvh.js/index.js"
  }
}
</script>
```

## 🧑‍💻 Live Examples

These examples use `vite`, and some mobile devices may run out of memory.

- [CullingStatic 1kk Forest](https://stackblitz.com/edit/three-ez-instancedmesh2-cullingstatic-1kk-forest?file=src%2Fmain.ts)
- [CullingDynamic 150k](https://stackblitz.com/edit/three-ez-instancedmesh2-cullingdynamic-150k?file=src%2Fmain.ts)
<!-- - [CullingStatic Custom Attribute](https://stackblitz.com/edit/three-ez-instancedmesh2-cullingstatic-custom-attribute?file=src%2Fmain.ts) -->

## 🤝 Contributing

Any help is highly appreciated. If you would like to contribute to this package or report problems, feel free to open a bug or pull request.

## ❔ Questions?

If you have questions or need assistance, you can ask on our [discord server](https://discord.gg/MVTwrdX3JM).

## 👀 Future Work

- LOD system
- New frustum culling using BVH and cached node parameters
- Remove renderer from constructor parameters

## ⭐ Like it?

If you find this project helpful, I would greatly appreciate it if you could leave a star on this repository! <br />
This helps me know that you appreciate my work and encourages me to continue improving it. <br />
Thank you so much for your support! 🌟

## Special thanks to

- [gkjohnson](https://github.com/gkjohnson) and his work on [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) and [BatchedMesh](https://threejs.org/docs/#api/en/objects/BatchedMesh)
- [manthrax](https://github.com/manthrax)
- [jungle_hacker](https://github.com/lambocorp)
