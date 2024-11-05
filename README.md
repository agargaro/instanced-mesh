<div align="center">
  
  <h1>Three.ez - InstancedMesh2</h1>
  <p>
    <em>Simplify your <b>three.js</b> application development with <b>three.ez</b>!</em>
  </p>

  <img src="public/banner.png" alt="three-ez-banner" /> <br />

  [![npm](https://img.shields.io/npm/v/@three.ez/instanced-mesh)](https://www.npmjs.com/package/@three.ez/instanced-mesh)
  [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=agargaro_instanced-mesh&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=agargaro_instanced-mesh)
  [![DeepScan grade](https://deepscan.io/api/teams/21196/projects/27990/branches/896898/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=21196&pid=27990&bid=896898)
  [![Stars](https://badgen.net/github/stars/three-ez/instanced-mesh)](https://github.com/three-ez/instanced-mesh)
  [![BundlePhobia](https://badgen.net/bundlephobia/min/@three.ez/instanced-mesh)](https://bundlephobia.com/package/@three.ez/instanced-mesh)
  [![Discord](https://img.shields.io/discord/1150091562227859457)](https://discord.gg/MVTwrdX3JM)

</div>

`InstancedMesh2` is an alternative version of `InstancedMesh` that offers advantages:
- *frustum culling for each instance*
- *sorting*
- *visibility for each instance*
- *each instance can have an object similar to `Object3D` to simplify its use*
- *spatial indexing [(*BVH*)](https://en.wikipedia.org/wiki/Bounding_volume_hierarchy) for fast raycasting and frustum culling*
- *LOD*
- *shadow LOD*

```ts
import { InstancedMesh2 } from '@three.ez/instanced-mesh';

const myInstancedMesh = new InstancedMesh2(renderer, count, geometry, material);

myInstancedMesh.updateInstances((obj, index) => {
  obj.position.z = index;
  obj.rotateY(Math.PI);
});

myInstancedMesh.computeBVH();
```

This library has two dependencies: 
- `three.js r159+`
- [`bvh.js`](https://github.com/agargaro/BVH.js)

## Live Examples

These examples use `vite`, and some mobile devices may run out of memory.

- [1kk static trees](https://stackblitz.com/edit/three-ezinstancedmesh2-1kk-static-trees?file=src%2Fmain.ts&embed=1&hideDevTools=1&view=preview)
- [Instances array dynamic](https://stackblitz.com/edit/three-ezinstancedmesh2-instances-array-dynamic?file=src%2Fmain.ts&embed=1&hideDevTools=1&view=preview)
- [Sorting](https://stackblitz.com/edit/three-ezinstancedmesh2-sorting?file=src%2Fmain.ts&embed=1&hideDevTools=1&view=preview)
- [Custom material](https://stackblitz.com/edit/three-ezinstancedmesh2-custom-material?file=src%2Fmain.ts&embed=1&hideDevTools=1&view=preview)
- [Dynamic BVH (no vite)](https://stackblitz.com/edit/three-ezinstancedmesh2-dynamic-bvh?file=index.ts&embed=1&hideDevTools=1&view=preview)
- [Fast raycasting](https://stackblitz.com/edit/three-ezinstancedmesh2-fast-raycasting?file=src%2Fmain.ts&embed=1&hideDevTools=1&view=preview)
- [LOD](https://stackblitz.com/edit/three-ezinstancedmesh2-fast-raycasting?file=src%2Fmain.ts&embed=1&hideDevTools=1&view=preview)
- Shadow LOD (soon)

More examples will be added soon...

## Frustum Culling

Avoiding rendering objects outside the camera frustum can drastically improve performance (especially for complex geometries). <br /> <br />
***Frustum culling by default is performed by iterating all instances***, [but it is possible to speed up this process by creating a spatial indexing data structure **(BVH)**](#spatial-indexing-data-structure-dynamic-bvh). <br /> <br />
By default `perObjectFrustumCulled` is **true**.

## Sorting

Sorting should be used to decrease overdraw and render transparent objects. <br /> <br />
By default `sortObjects` is **false**.

```ts
import { createRadixSort } from '@three.ez/instanced-mesh';

myInstancedMesh.sortObjects = true;
myInstancedMesh.customSort = createRadixSort(myInstancedMesh);
```

## Visibility

Set the visibility status of each instance like this:

```ts
myInstancedMesh.setVisibilityAt(false, 0);
myInstancedMesh.instances[0].visible = false; // if instances array is created
```

## Instances Array

It is possible to create an array of ***InstancedEntity (Object3D-like)*** in order to easily change the visibility, apply transformations and add custom data to each instance, ***using more memory***.

```ts
myInstancedMesh.createInstances((obj, index) => {
  obj.position.random();
});

myInstancedMesh.instances[0].visible = false;

myInstancedMesh.instances[1].userData = {};

myInstancedMesh.instances[2].position.random();
myInstancedMesh.instances[2].quaternion.random();
myInstancedMesh.instances[2].scale.random();
myInstancedMesh.instances[2].updateMatrix(); // necessary after transformations

myInstancedMesh.instances[3].rotateX(Math.PI);
myInstancedMesh.instances[3].updateMatrix(); // necessary after transformations
```     

## Spatial Indexing Data Structure (Dynamic BVH)

To speed up raycasting and frustum culling, a spatial indexing data structure can be created to contain the boundingBoxes of all instances. <br />
This works very well if the instances are mostly static (updating a BVH can be expensive) and scattered in world space.

```ts
// call this function after all instances have been valued
myInstancedMesh.computeBVH({ margin: 0, highPrecision: false });
```

If all instances are static set the margin to 0. <br /> <br />
***Setting a margin makes BVH updating faster***, but may make raycasting and frustum culling slightly slower.

## LOD 

Work in progress...

## Shadow LOD 

Work in progress...

## Raycasting tips

If you are not using a BVH, you can set the `raycastOnlyFrustum` property to **true** to avoid iterating over all instances.

It's also highly recommended to use [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) to create a geometry BVH.

## API

<details>
  <summary>InstancedMesh2</summary>
  
  ```ts
  export type Entity<T> = InstancedEntity & T;
  export type UpdateEntityCallback<T> = (obj: Entity<T>, index: number) => void;

  export interface BVHParams {
      margin?: number;
      highPrecision?: boolean;
  }

  export declare class InstancedMesh2<TCustomData = {}, TGeometry extends BufferGeometry = BufferGeometry, TMaterial extends Material | Material[] = Material, TEventMap extends Object3DEventMap = Object3DEventMap> extends Mesh<TGeometry, TMaterial, TEventMap> {
      type: 'InstancedMesh2';
      isInstancedMesh2: true;
      instances: Entity<TCustomData>[];
      instanceIndex: GLInstancedBufferAttribute;
      matricesTexture: DataTexture;
      colorsTexture: DataTexture;
      morphTexture: DataTexture;
      boundingBox: Box3;
      boundingSphere: Sphere;
      instancesCount: number;
      bvh: InstancedMeshBVH;
      perObjectFrustumCulled: boolean;
      sortObjects: boolean;
      customSort: any;
      raycastOnlyFrustum: boolean;
      visibilityArray: boolean[];
      customDepthMaterial: MeshDepthMaterial;
      customDistanceMaterial: MeshDistanceMaterial;
      get count(): number;
      get maxCount(): number;
      get material(): TMaterial;
      set material(value: TMaterial);
      /** THIS MATERIAL AND GEOMETRY CANNOT BE SHARED */
      constructor(renderer: WebGLRenderer, count: number, geometry: TGeometry, material?: TMaterial);
      updateInstances(onUpdate: UpdateEntityCallback<Entity<TCustomData>>): void;
      createInstances(onInstanceCreation?: UpdateEntityCallback<Entity<TCustomData>>): void;
      computeBVH(config?: BVHParams): void;
      disposeBVH(): void;
      setMatrixAt(id: number, matrix: Matrix4): void;
      getMatrixAt(id: number, matrix?: Matrix4): Matrix4;
      setVisibilityAt(id: number, visible: boolean): void;
      getVisibilityAt(id: number): boolean;
      setColorAt(id: number, color: ColorRepresentation): void;
      getColorAt(id: number, color?: Color): Color;
      setUniformAt(id: number, name: string, value: UniformValue): void;
      getMorphAt(index: number, object: Mesh): void;
      setMorphAt(index: number, object: Mesh): void;
      raycast(raycaster: Raycaster, result: Intersection[]): void;
      computeBoundingBox(): void;
      computeBoundingSphere(): void;
      copy(source: InstancedMesh2, recursive?: boolean): this;
      dispose(): this;
  }
  ```

</details>

<details>
  <summary>InstancedEntity</summary>
  
  ```ts
  export type UniformValueNoNumber = Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4;
  export type UniformValue = number | UniformValueNoNumber;

  export declare class InstancedEntity {
      isInstanceEntity: true;
      readonly id: number;
      readonly owner: InstancedMesh2;
      position: Vector3;
      scale: Vector3;
      quaternion: Quaternion;
      get visible(): boolean;
      set visible(value: boolean);
      get color(): Color;
      set color(value: ColorRepresentation);
      get matrix(): Matrix4;
      get matrixWorld(): Matrix4;
      constructor(owner: InstancedMesh2<any, any, any>, index: number);
      updateMatrix(): void;
      setUniform(name: string, value: UniformValue): void;
      copyTo(target: Mesh): void;
      applyMatrix4(m: Matrix4): this;
      applyQuaternion(q: Quaternion): this;
      rotateOnAxis(axis: Vector3, angle: number): this;
      rotateOnWorldAxis(axis: Vector3, angle: number): this;
      rotateX(angle: number): this;
      rotateY(angle: number): this;
      rotateZ(angle: number): this;
      translateOnAxis(axis: Vector3, distance: number): this;
      translateX(distance: number): this;
      translateY(distance: number): this;
      translateZ(distance: number): this;
  }
  ```

</details>

<details>
  <summary>Utils</summary>
  
  ```ts
  export declare function patchShader(shader: string): string;

  export declare function createRadixSort(target: InstancedMesh2): typeof radixSort<InstancedRenderItem>;

  export declare function createTexture_float(count: number): DataTexture;
  export declare function createTexture_vec2(count: number): DataTexture;
  export declare function createTexture_vec3(count: number): DataTexture;
  export declare function createTexture_vec4(count: number): DataTexture;
  export declare function createTexture_mat3(count: number): DataTexture;
  export declare function createTexture_mat4(count: number): DataTexture;
  ```

</details>

## How Does It Work?

It works similarly to `BatchedMesh`: ***matrices, colors, etc.*** are stored in `Texture` instead of `InstancedAttribute`. <br />
The only `InstancedAttribute` is used to store the indices of the instances to be rendered. <br /> <br />
***If you create a custom material, you will need to use `Texture` instead of `InstancedBufferAttribute` (don't worry, there are utility methods).***

## Installation

You can install it via npm using the following command:

```bash
npm install @three.ez/instanced-mesh
```

Or you can import it from CDN:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",
    "@three.ez/instanced-mesh": "https://cdn.jsdelivr.net/npm/@three.ez/instanced-mesh/index.js",
    "bvh.js": "https://cdn.jsdelivr.net/npm/bvh.js/index.js"
  }
}
</script>
```

## Questions?

If you have questions or need assistance, you can ask on our [discord server](https://discord.gg/MVTwrdX3JM).

## Future Work

- Dynamic count

## Like it?

If you find this project helpful, I would greatly appreciate it if you could leave a star on this repository! <br />
This helps me know that you appreciate my work and encourages me to continue improving it. <br />
Thank you so much for your support! 🌟

## Special thanks to

- [gkjohnson](https://github.com/gkjohnson)
- [manthrax](https://github.com/manthrax)
- [jungle_hacker](https://github.com/lambocorp)

## References

- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)
- [ErinCatto_DynamicBVH](https://box2d.org/files/ErinCatto_DynamicBVH_Full.pdf)
- [BatchedMesh](https://threejs.org/docs/#api/en/objects/BatchedMesh)
