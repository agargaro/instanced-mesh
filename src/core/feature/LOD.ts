import { BufferGeometry, Material, ShaderMaterial } from 'three';
import { InstancedMesh2, InstancedMesh2Params } from '../InstancedMesh2.js';

// TODO check squaured distance in comments and code

/**
 * Represents information about Level of Detail (LOD).
 * @template TData Type for additional instance data.
 */
export interface LODInfo<TData = {}> {
  /**
   * Render settings for the LOD.
   */
  render: LODRenderList<TData>;
  /**
   * Shadow rendering settings for the LOD.
   */
  shadowRender: LODRenderList<TData>;
  /**
   * List of `InstancedMesh2` associated to LODs.
   */
  objects: InstancedMesh2<TData>[];
}

/**
 * Represents a list of render levels for LOD.
 * @template TData Type for additional instance data.
 */
export interface LODRenderList<TData = {}> {
  /**
   * Array of LOD levels.
   */
  levels: LODLevel<TData>[];
  /**
   * Array of instance counts per LOD level, used internally.
   */
  count: number[];
}

/**
 * Represents a single LOD level.
 * @template TData Type for additional instance data.
 */
export interface LODLevel<TData = {}> {
  /**
   * The squared distance at which this LOD level becomes active.
   */
  distance: number;
  /**
   * Hysteresis value to prevent LOD flickering when transitioning.
   */
  hysteresis: number;
  /**
   * The `InstancedMesh2` object associated with this LOD level.
   */
  object: InstancedMesh2<TData>;
}

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2 {
    /**
     * Retrieves the index of the LOD level for a given distance.
     * @param levels The array of LOD levels.
     * @param distance The squared distance from the camera to the object.
     * @returns The index of the LOD level that should be used.
     */
    getObjectLODIndexForDistance(levels: LODLevel[], distance: number): number;
    /**
     * Sets the first LOD (using current geometry) distance and hysteresis.
     * @param distance The distance for the first LOD.
     * @param hysteresis The hysteresis value for the first LOD.
     * @returns The current `InstancedMesh2` instance.
     */
    setFirstLODDistance(distance?: number, hysteresis?: number): this;
    /**
     * Adds a new LOD level with the given geometry, material, and distance.
     * @param geometry The geometry for the LOD level.
     * @param material The material for the LOD level.
     * @param distance The distance for this LOD level.
     * @param hysteresis The hysteresis value for this LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    addLOD(geometry: BufferGeometry, material: Material | Material[], distance?: number, hysteresis?: number): this;
    /**
     * Adds a shadow-specific LOD level with the given geometry and distance.
     * @param geometry The geometry for the shadow LOD.
     * @param distance The distance for this LOD level.
     * @param hysteresis The hysteresis value for this LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    addShadowLOD(geometry: BufferGeometry, distance?: number, hysteresis?: number): this;
    /** @internal */ addLevel(renderList: LODRenderList, geometry: BufferGeometry, material: Material | Material[], distance: number, hysteresis: number): InstancedMesh2;
    /** @internal */ patchLevel(obj: InstancedMesh2): void;
  }
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
    throw new Error('Cannot create LOD for this InstancedMesh2.');
  }

  if (!this.LODinfo) {
    this.LODinfo = { render: null, shadowRender: null, objects: [this] };
  }

  if (!this.LODinfo.render) {
    this.LODinfo.render = {
      levels: [{ distance, hysteresis, object: this }],
      count: [0]
    };
  }

  return this;
};

InstancedMesh2.prototype.addLOD = function (geometry: BufferGeometry, material: Material | Material[], distance = 0, hysteresis = 0): InstancedMesh2 {
  if (this._parentLOD) {
    throw new Error('Cannot create LOD for this InstancedMesh2.');
  }

  if (!this.LODinfo?.render && distance === 0) {
    throw new Error('Cannot set distance to 0 for the first LOD. Use "setFirstLODDistance" before use "addLOD".');
  }

  this.setFirstLODDistance(0, hysteresis);

  this.addLevel(this.LODinfo.render, geometry, material, distance, hysteresis);

  return this;
};

InstancedMesh2.prototype.addShadowLOD = function (geometry: BufferGeometry, distance = 0, hysteresis = 0): InstancedMesh2 {
  if (this._parentLOD) {
    throw new Error('Cannot create LOD for this InstancedMesh2.');
  }

  if (!this.LODinfo) {
    this.LODinfo = { render: null, shadowRender: null, objects: [this] };
  }

  if (!this.LODinfo.shadowRender) {
    this.LODinfo.shadowRender = { levels: [], count: [] };
  }

  const object = this.addLevel(this.LODinfo.shadowRender, geometry, null, distance, hysteresis);
  object.castShadow = true;
  this.castShadow = true;

  return this;
};

InstancedMesh2.prototype.addLevel = function (renderList: LODRenderList, geometry: BufferGeometry, material: Material, distance: number, hysteresis: number): InstancedMesh2 {
  const objectsList = this.LODinfo.objects;
  const levels = renderList.levels;
  let index;
  let object: InstancedMesh2;
  distance = distance ** 2; // to avoid to use Math.sqrt every time

  const objIndex = objectsList.findIndex((e) => e.geometry === geometry);
  if (objIndex === -1) {
    const params: InstancedMesh2Params = { capacity: this._capacity, renderer: this._renderer };
    object = new InstancedMesh2(geometry, material ?? new ShaderMaterial(), params, this);
    object.frustumCulled = false;
    this.patchLevel(object);
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

  return object;
};

InstancedMesh2.prototype.patchLevel = function (obj: InstancedMesh2): void {
  Object.defineProperty(obj, 'matricesTexture', {
    get(this: InstancedMesh2) {
      return this._parentLOD.matricesTexture;
    }
  });

  Object.defineProperty(obj, 'colorsTexture', {
    get(this: InstancedMesh2) {
      return this._parentLOD.colorsTexture;
    }
  });

  Object.defineProperty(obj, 'uniformsTexture', {
    get(this: InstancedMesh2) {
      return this._parentLOD.uniformsTexture;
    }
  });

  Object.defineProperty(obj, 'morphTexture', { // TODO check if it's correct
    get(this: InstancedMesh2) {
      return this._parentLOD.morphTexture;
    }
  });

  Object.defineProperty(obj, 'boneTexture', {
    get(this: InstancedMesh2) {
      return this._parentLOD.boneTexture;
    }
  });
};
