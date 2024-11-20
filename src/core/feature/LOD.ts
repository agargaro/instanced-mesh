import { BufferGeometry, Material, ShaderMaterial } from 'three';
import { InstancedMesh2 } from '../InstancedMesh2.js';

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    getObjectLODIndexForDistance(levels: LODLevel[], distance: number): number;
    setFirstLODDistance(distance?: number, hysteresis?: number): this;
    addLOD(geometry: BufferGeometry, material: Material, distance?: number, hysteresis?: number): this;
    addShadowLOD(geometry: BufferGeometry, distance?: number, hysteresis?: number): this;
    /** @internal */ addLevel(renderList: LODRenderList, geometry: BufferGeometry, material: Material, distance: number, hysteresis: number): InstancedMesh2;
  }
}

export interface LODInfo<TCustomData = {}> {
  render: LODRenderList<TCustomData>;
  shadowRender: LODRenderList<TCustomData>;
  objects: InstancedMesh2<TCustomData>[];
}

export interface LODRenderList<TCustomData = {}> {
  levels: LODLevel<TCustomData>[];
  indexes: (Uint16Array | Uint32Array)[];
  count: number[];
}

export interface LODLevel<TCustomData = {}> {
  distance: number;
  hysteresis: number;
  object: InstancedMesh2<TCustomData>;
}

InstancedMesh2.prototype.getObjectLODIndexForDistance = function (levels: LODLevel[], distance: number): number {
  for (let i = levels.length - 1; i > 0; i--) {
    const level = levels[i];
    const levelDistance = level.distance - (level.distance * level.hysteresis);
    if (distance >= levelDistance) return i;
  }

  return 0;
};

InstancedMesh2.prototype.setFirstLODDistance = function (distance = 0, hysteresis = 0): InstancedMesh2 {
  if (this._parentLOD) {
    console.error('Cannot create LOD for this InstancedMesh2.');
    return;
  }

  if (!this.infoLOD) {
    this.infoLOD = { render: null, shadowRender: null, objects: [this] };
  }

  if (!this.infoLOD.render) {
    this.infoLOD.render = {
      levels: [{ distance, hysteresis, object: this }],
      indexes: [this._indexArray],
      count: [0]
    };
  }

  return this;
};

InstancedMesh2.prototype.addLOD = function (geometry: BufferGeometry, material: Material, distance = 0, hysteresis = 0): InstancedMesh2 {
  if (this._parentLOD) {
    console.error('Cannot create LOD for this InstancedMesh2.');
    return;
  }

  if (!this.infoLOD?.render && distance === 0) {
    console.error('Cannot set distance to 0 for the first LOD. Use "setFirstLODDistance" before use "addLOD".');
    return;
  } else {
    this.setFirstLODDistance(0, hysteresis);
  }

  this.addLevel(this.infoLOD.render, geometry, material, distance, hysteresis);

  return this;
};

InstancedMesh2.prototype.addShadowLOD = function (geometry: BufferGeometry, distance = 0, hysteresis = 0): InstancedMesh2 {
  if (this._parentLOD) {
    console.error('Cannot create LOD for this InstancedMesh2.');
    return;
  }

  if (!this.infoLOD) {
    this.infoLOD = { render: null, shadowRender: null, objects: [this] };
  }

  if (!this.infoLOD.shadowRender) {
    this.infoLOD.shadowRender = { levels: [], indexes: [], count: [] };
  }

  const object = this.addLevel(this.infoLOD.shadowRender, geometry, null, distance, hysteresis);
  object.castShadow = true;
  this.castShadow = true;

  return this;
};

InstancedMesh2.prototype.addLevel = function (renderList: LODRenderList, geometry: BufferGeometry, material: Material, distance: number, hysteresis: number): InstancedMesh2 {
  const objectsList = this.infoLOD.objects;
  const levels = renderList.levels;
  let index;
  let object: InstancedMesh2;
  distance = distance ** 2; // to avoid to use Math.sqrt every time

  const objIndex = objectsList.findIndex((e) => e.geometry === geometry);
  if (objIndex === -1) {
    object = new InstancedMesh2(this._renderer, this._maxCount, geometry, material ?? new ShaderMaterial(), this);
    objectsList.push(object);
    this.add(object); // TODO handle render order?
  } else {
    object = objectsList[objIndex];
    if (material) object.material = material;
  }

  for (index = 0; index < levels.length; index++) {
    if (distance < levels[index].distance) break;
  }

  levels.splice(index, 0, { distance, hysteresis, object });
  renderList.count.push(0);
  renderList.indexes.splice(index, 0, object._indexArray);

  return object;
};
