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
    /**
     * Update a single **render** LOD level.
     * - Accepts **world-space** distance; it will be squared internally.
     * - If `distance` is omitted, only `hysteresis` is updated.
     * - No-ops when render LODs are not present.
     * @param levelIndex Index of the LOD level to update.
     * @param distance The distance for this LOD level.
     * @param hysteresis The hysteresis value for this LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    setLODDistance(
      levelIndex: number,
      distance?: number,
      hysteresis?: number
    ): this;
    /**
     * Update a single **shadow** LOD level.
     * - Accepts **world-space** distance; it will be squared internally.
     * - If `distance` is omitted, only `hysteresis` is updated.
     * - No-ops when shadow LODs are not present.
     * @param levelIndex Index of the shadow LOD level to update.
     * @param distance The distance for this LOD level.
     * @param hysteresis The hysteresis value for this LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    setShadowLODDistance(
      levelIndex: number,
      distance?: number,
      hysteresis?: number
    ): this;
    /**
     * Batch update **render** LOD distances.
     * - No-op when render LODs are not present.
     * @param distance The distance for this LOD level.
     * @param hysteresis The hysteresis value for this LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    setLODProfile(distances: number[], hysteresis?: number | number[]): this;
    /**
     * Batch update **shadow** LOD distances.
     * - No-op when shadow LODs are not present.
     * @param distance The distance for this LOD level.
     * @param hysteresis The hysteresis value for this LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    setShadowLODProfile(
      distances: number[],
      hysteresis?: number | number[]
    ): this;
    /** @internal */ addLevel(renderList: LODRenderList, geometry: BufferGeometry, material: Material | Material[], distance: number, hysteresis: number): InstancedMesh2;
    /** @internal */ patchLevel(obj: InstancedMesh2): void;
    /** @internal */ changeLevel(renderList: LODRenderList, levelIndex: number, distance?: number, hysteresis?: number): this;
    /** @internal */ setLODs(renderList: LODRenderList, distances: number[], hysteresis?: number | number[]): this;
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

 InstancedMesh2.prototype.changeLevel = function (
    renderList,
    levelIndex,
    distance,
    hysteresis
  ) {
    if (!renderList || !renderList.levels) throw new Error("Invalid LOD list.");
    const levels = renderList.levels;
    if (levelIndex < 0 || levelIndex >= levels.length)
      throw new Error("Level index OOB");

    const entry = levels[levelIndex];

    if (distance != null) {
      const d2 = distance ** 2;
      if (Number.isNaN(d2)) throw new Error("Distance is NaN");
      entry.distance = d2;
    }
    if (hysteresis != null) entry.hysteresis = hysteresis;
    return this;
  };

  InstancedMesh2.prototype.setLODDistance = function (
    levelIndex,
    distance,
    hysteresis
  ) {
    return this.changeLevel(
      this.LODinfo.render,
      levelIndex,
      distance,
      hysteresis
    );
  };

  InstancedMesh2.prototype.setShadowLODDistance = function (
    levelIndex,
    distance,
    hysteresis
  ) {
    return this.changeLevel(
      this?.LODinfo?.shadowRender,
      levelIndex,
      distance,
      hysteresis
    );
  };

  InstancedMesh2.prototype.setLODs = function (
    renderList,
    distances,
    hysteresis
  ) {
    if (!renderList || !renderList.levels) throw new Error("Invalid LOD list.");
    const levels = renderList.levels;
    const n = Math.min(levels.length, distances?.length ?? 0);
    if (n === 0) return this;

    for (let i = 0; i < n; i++) {
      const d = distances[i];
      if (d == null || Number.isNaN(d)) {
        throw new Error(`LOD distance at index ${i} is invalid (${d}).`);
      }
      if (i > 0 && !(d > distances[i - 1])) {
        throw new Error(
          `LOD distances must be strictly increasing: d[${i - 1}]=${
            distances[i - 1]
          } < d[${i}]=${d}`
        );
      }
    }

    for (let i = 0; i < n; i++) {
      const h = Array.isArray(hysteresis) ? hysteresis[i] : hysteresis;
      this.changeLevel(renderList, i, distances[i], h);
    }

    return this;
  };

  InstancedMesh2.prototype.setLODProfile = function (distances, hysteresis) {
    const list = this?.LODinfo?.render;
    if (!list || !list.levels || list.levels.length === 0) return this;
    return this.setLODs(list, distances, hysteresis);
  };

  InstancedMesh2.prototype.setShadowLODProfile = function (
    distances,
    hysteresis
  ) {
    const list = this?.LODinfo?.shadowRender;
    if (!list || !list.levels || list.levels.length === 0) return this;
    return this.setLODs(list, distances, hysteresis);
  };

InstancedMesh2.prototype.patchLevel = function (obj: InstancedMesh2): void {
  Object.defineProperty(obj, '_lastRenderInfo', {
    get(this: InstancedMesh2) {
      return this._parentLOD._lastRenderInfo;
    }
  });

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

  Object.defineProperty(obj, 'skeleton', {
    get(this: InstancedMesh2) {
      return this._parentLOD.skeleton;
    }
  });

  Object.defineProperty(obj, 'bindMatrixInverse', {
    get(this: InstancedMesh2) {
      return this._parentLOD.bindMatrixInverse;
    }
  });

  Object.defineProperty(obj, 'bindMatrix', {
    get(this: InstancedMesh2) {
      return this._parentLOD.bindMatrix;
    }
  });
};
