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
   * The squared screen-space metric (e.g., fraction of screen height) at which this LOD should be used.
   */
  metricSquared: number;
  /**
   * The screen-space metric (e.g., fraction of screen height) at which this LOD should be used.
   */
  metric: number;
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
     * If `true`, LOD uses camera distance; otherwise it uses screen size.
     * @default undefined
     */
    _useDistanceForLOD?: boolean;
    /**
     * Retrieves the index of the LOD level for a given metric.
     * @param levels The array of LOD levels.
     * @param metric The calculated screen-space metric for the object or the squared distance from the camera to the object.
     * @param useDistSquared Whether to use the squared distance for LOD calculations.
     * @returns The index of the LOD level that should be used.
     */
    getObjectLODIndex(levels: LODLevel[], metric: number, useDistSquared: boolean): number;
    /**
     * Sets the first LOD (using current geometry) metric.
     * @returns The current `InstancedMesh2` instance.
     */
    setFirstLODMetric(): this;
    /**
     * Adds a new LOD level with the given geometry, material, and metric.
     * @param geometry The geometry for the LOD level.
     * @param material The material for the LOD level.
     * @param metric The screen-space metric (e.g., fraction of screen height) at which this LOD should be used.
     * @param hysteresis The hysteresis value for this LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    addLOD(geometry: BufferGeometry, material: Material | Material[], metric?: number, hysteresis?: number): this;
    /**
     * Adds a shadow-specific LOD level with the given geometry and metric.
     * @param geometry The geometry for the shadow LOD.
     * @param metric The screen-space metric (e.g., fraction of screen height) at which this LOD should be used.
     * @param hysteresis The hysteresis value for this LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    addShadowLOD(geometry: BufferGeometry, metric?: number, hysteresis?: number): this;
    /**
     * Updates the LOD settings for a specific level.
     * @param levelIndex The index of the LOD to update.
     * @param metric The screen-space metric (e.g., fraction of screen height) at which this LOD should be used.
     * @param hysteresis The hysteresis value to prevent LOD flickering when transitioning.
     * @returns The current `InstancedMesh2` instance.
     */
    updateLOD(levelIndex: number, metric?: number, hysteresis?: number): this;
    /**
     * Updates the shadow LOD settings for a specific level.
     * @param levelIndex The index of the LOD to update.
     * @param metric The screen-space metric (e.g., fraction of screen height) at which this LOD should be used.
     * @param hysteresis The hysteresis value to prevent LOD flickering when transitioning.
     * @returns The current `InstancedMesh2` instance.
     */
    updateShadowLOD(levelIndex: number, metric?: number, hysteresis?: number): this;
    /**
     * Updates the LOD settings for all levels.
     * @param metrics The array of screen-space metric (e.g., fraction of screen height) at which this LOD should be used.
     * @param hysteresis The hysteresis value(s) for each LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    updateAllLOD(metrics?: number[], hysteresis?: number | number[]): this;
    /**
     * Updates the shadow LOD settings for all levels.
     * @param metrics The array of screen-space metric (e.g., fraction of screen height) at which this LOD should be used.
     * @param hysteresis The hysteresis value(s) for each LOD level.
     * @returns The current `InstancedMesh2` instance.
     */
    updateAllShadowLOD(metrics?: number[], hysteresis?: number | number[]): this;
    /**
     * Removes a specific LOD level by its index.
     * If the same geometry is reused by other levels, pass removeObject=false.
     * @param levelIndex The index of the LOD level to remove.
     * @param removeObject Also remove the child InstancedMesh2 object. Default true.
     * @returns The current `InstancedMesh2` instance.
     */
    removeLOD(levelIndex: number, removeObject?: boolean): this;
    /** @internal */ addLevel(renderList: LODRenderList, geometry: BufferGeometry, material: Material | Material[], metric: number, hysteresis: number): InstancedMesh2;
    /** @internal */ patchLevel(obj: InstancedMesh2): void;
    /** @internal */ updateLevel(renderList: LODRenderList, levelIndex: number, metric: number, hysteresis: number): this;
    /** @internal */ updateAllLevels(renderList: LODRenderList, metrics: number[] | null, hysteresis?: number | number[]): this;
    /** @internal */ disposeLOD(object: InstancedMesh2);
  }
}

InstancedMesh2.prototype.getObjectLODIndex = function (levels: LODLevel[], metric: number, useDistSquared = false): number {
  const metricKey: keyof LODLevel = useDistSquared ? 'metricSquared' : 'metric';

  if (this._useDistanceForLOD) {
    for (let i = levels.length - 1; i > 0; i--) {
      const level = levels[i];
      const levelDistance = level[metricKey] - (level[metricKey] * level.hysteresis);
      if (metric >= levelDistance) return i;
    }

    return 0;
  }

  for (let i = levels.length - 1; i > 0; i--) {
    const level = levels[i];
    const screenSize = level[metricKey];
    if (metric <= screenSize) return i;
  }

  return 0;
};

InstancedMesh2.prototype.setFirstLODMetric = function (): InstancedMesh2 {
  if (this._parentLOD) {
    throw new Error('Cannot create LOD for this InstancedMesh2.');
  }

  if (!this.LODinfo) {
    this.LODinfo = { render: null, shadowRender: null, objects: [this] };
  }

  if (!this.LODinfo.render) {
    this.LODinfo.render = {
      levels: [this._useDistanceForLOD
        ? { metric: 0, metricSquared: 0, hysteresis: 0, object: this } // hysteresis is always 0 at first level
        : { metric: Infinity, metricSquared: Infinity, hysteresis: 0, object: this }
      ],
      count: [0]
    };
  }

  return this;
};

InstancedMesh2.prototype.addLOD = function (geometry: BufferGeometry, material: Material | Material[], metric = 0, hysteresis = 0): InstancedMesh2 {
  if (this._parentLOD) {
    throw new Error('Cannot create LOD for this InstancedMesh2.');
  }

  if (!this.LODinfo?.render && this._useDistanceForLOD && metric === 0) {
    throw new Error('Cannot set metric to 0 for the first LOD. Call "setFirstLODMetric" method before use "addLOD".');
  }
  if (!this.LODinfo?.render && !this._useDistanceForLOD && metric === Infinity) {
    throw new Error('Cannot set metric to Infinity for the first LOD. Call "setFirstLODMetric" method before use "addLOD".');
  }

  this.setFirstLODMetric();

  this.addLevel(this.LODinfo.render, geometry, material, metric, hysteresis);

  return this;
};

InstancedMesh2.prototype.addShadowLOD = function (geometry: BufferGeometry, metric = 0, hysteresis = 0): InstancedMesh2 {
  if (this._parentLOD) {
    throw new Error('Cannot create LOD for this InstancedMesh2.');
  }

  if (!this.LODinfo) {
    this.LODinfo = { render: null, shadowRender: null, objects: [this] };
  }

  if (!this.LODinfo.shadowRender) {
    this.LODinfo.shadowRender = { levels: [], count: [] };
  }

  const object = this.addLevel(this.LODinfo.shadowRender, geometry, null, metric, hysteresis);
  object.castShadow = true;
  this.castShadow = true;

  return this;
};

InstancedMesh2.prototype.addLevel = function (renderList: LODRenderList, geometry: BufferGeometry, material: Material, metric: number, hysteresis: number): InstancedMesh2 {
  const objectsList = this.LODinfo.objects;
  const levels = renderList.levels;
  let index;
  let object: InstancedMesh2;
  const metricSquared = metric ** 2; // to avoid to use Math.sqrt every time

  const objIndex = objectsList.findIndex((e) => e.geometry === geometry);
  if (objIndex === -1) {
    const params: InstancedMesh2Params = { capacity: this._capacity, renderer: this._renderer };
    object = new InstancedMesh2(geometry, material ?? new ShaderMaterial(), params, this);
    object.frustumCulled = false;
    this.patchLevel(object);
    objectsList.push(object);
    this.add(object);
  } else {
    object = objectsList[objIndex];
    if (material) object.material = material;
  }

  for (index = 0; index < levels.length; index++) {
    if (this._useDistanceForLOD) {
      if (metricSquared < levels[index].metricSquared) break;
    } else {
      if (metricSquared > levels[index].metricSquared) break;
    }
  }

  levels.splice(index, 0, { metric, metricSquared, hysteresis, object });
  renderList.count.push(0);

  return object;
};

InstancedMesh2.prototype.updateLevel = function (renderList, levelIndex, metric, hysteresis) {
  if (!renderList) throw new Error('Render list is invalid.');

  const level = renderList.levels[levelIndex];
  if (!level) throw new Error('Cannot update an empty LOD.');

  if (metric != null && !Number.isNaN(metric)) {
    const m2 = metric ** 2;
    level.metric = metric;
    level.metricSquared = m2;
  }
  if (hysteresis != null && !Number.isNaN(hysteresis))
    level.hysteresis = hysteresis;

  return this;
};

InstancedMesh2.prototype.updateLOD = function (levelIndex, metric, hysteresis) {
  const list = this?.LODinfo?.render;
  if (levelIndex === 0) throw new Error('Cannot change metric for LOD0. It is the main mesh and must stay at Infinity.'); // If user try to change first lod
  return this.updateLevel(list, levelIndex, metric, hysteresis);
};

InstancedMesh2.prototype.updateShadowLOD = function (levelIndex, metric, hysteresis) {
  return this.updateLevel(this.LODinfo?.shadowRender, levelIndex, metric, hysteresis);
};

InstancedMesh2.prototype.updateAllLevels = function (renderList, metrics, hysteresis) {
  if (!renderList?.levels) throw new Error('Invalid LOD list.');
  const levels = renderList.levels;
  const isRender = this.LODinfo?.render === renderList;

  const start = isRender ? 1 : 0; // for shadowLOD
  if (isRender) {
    levels[0].metric = this._useDistanceForLOD ? 0 : Infinity;
    levels[0].metricSquared = this._useDistanceForLOD ? 0 : Infinity;
  }
  const hasMetrics = metrics?.length > 0;

  let _metrics = [];
  if (hasMetrics) { // Only when metrics provided
    _metrics = (isRender && (metrics[0] === Infinity || metrics[0] === 0)) // If user give 0 for first metric, handle this w/o throw error
      ? metrics.slice(1, Math.min(levels.length, metrics.length))
      : metrics.slice(0, Math.min(levels.length - start, metrics.length));
    if (this._useDistanceForLOD) {
      // Validate
      _metrics.every((_d, i) => {
        if (i > 0 && _d <= _metrics[i - 1]) throw new Error(`LOD metrics must be strictly increasing: d[${i - 1}]=${_metrics[i - 1]} < d[${i}]=${_d}`);
        return true;
      });
    } else {
      // Validate
      _metrics.every((_d, i) => {
        if (i > 0 && _d >= _metrics[i - 1]) throw new Error(`LOD metrics must be strictly decreasing: d[${i - 1}]=${_metrics[i - 1]} > d[${i}]=${_d}`);
        return true;
      });
    }
  }

  // apply: if no metrics, update only hysteresis for all levels
  const total = hasMetrics ? _metrics.length : (levels.length - start);

  for (let i = 0; i < total; i++) {
    const _d = hasMetrics ? _metrics[i] : undefined;
    const _h = Array.isArray(hysteresis) ? hysteresis[i] : hysteresis;

    this.updateLevel(renderList, start + i, _d, _h);
  }

  return this;
};

InstancedMesh2.prototype.updateAllLOD = function (metrics, hysteresis) {
  return this.updateAllLevels(this.LODinfo?.render, metrics, hysteresis);
};

InstancedMesh2.prototype.updateAllShadowLOD = function (metrics, hysteresis) {
  return this.updateAllLevels(this.LODinfo?.shadowRender, metrics, hysteresis);
};

InstancedMesh2.prototype.disposeLOD = function (object: InstancedMesh2) {
  object.geometry.dispose();
  const mat = object.material;
  if (Array.isArray(mat)) for (const m of mat) m.dispose();
  else mat.dispose();
};

InstancedMesh2.prototype.removeLOD = function (levelIndex, removeObject = true) {
  const info = this.LODinfo;
  const list = info?.render;
  if (!list?.levels) throw new Error('Invalid LOD list.');

  const n = list.levels.length;
  if (levelIndex < 0 || levelIndex >= n) throw new Error('Level index OOB');
  if (n > 1 && levelIndex === 0) throw new Error('Cannot remove LOD0 while others exist');

  // Remove whole list if only LOD0 remains
  const [removed] = list.levels.splice(levelIndex, 1);
  list.count?.splice?.(levelIndex, 1);
  if (list.levels.length <= 1) info.render = null;

  const obj = removed.object;

  // Mirror remove on shadow list if that index exists
  const shadow = this.LODinfo?.shadowRender;
  if (shadow?.levels && levelIndex < shadow.levels.length) {
    shadow.levels.splice(levelIndex, 1);
    shadow.count?.splice?.(levelIndex, 1);
    if (shadow.levels.length === 0) this.LODinfo.shadowRender = null;
  }

  // Remove LOD object
  if (removeObject && obj !== this) {
    try {
      this.remove(obj);
      const idx = info.objects?.indexOf(obj) ?? -1;
      if (idx !== -1) info.objects.splice(idx, 1);
      this.disposeLOD(obj);
    } catch (e) {
      console.error(e);
    }
  }
  return this;
};

InstancedMesh2.prototype.patchLevel = function (obj: InstancedMesh2): void {
  Object.defineProperty(obj, 'renderOrder', {
    get(this: InstancedMesh2) {
      return this._parentLOD.renderOrder; // TODO reduce overdraw with renderOrder
    }
  });

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
