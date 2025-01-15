import { InstancedEntity } from '../InstancedEntity.js';
import { InstancedMesh2 } from '../InstancedMesh2.js';

// TODO: optimize method to fill 'holes'.
// TODO: should setInstances delete instances from BVH? if yes, change frustum culling check too

/**
 * Represents an extended entity type with custom data.
 */
export type Entity<T> = InstancedEntity & T;
/**
 * A callback function used to update or initialize an entity.
 */
export type UpdateEntityCallback<T = InstancedEntity> = (obj: Entity<T>, index: number) => void;

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2<TData = {}> {
    /**
     * Updates instances by applying a callback function to each instance. It calls `updateMatrix` for each instance.
     * @param onUpdate A callback function to update each entity.
     * @param start The starting index of the instances to update. Defaults to `0`.
     * @param count The number of instances to update. Defaults to the total instance count.
     * @returns The current `InstancedMesh2` instance.
     */
    updateInstances(onUpdate: UpdateEntityCallback<Entity<TData>>, start?: number, count?: number): this;
    /**
     * Updates instances position by applying a callback function to each instance. It calls `updateMatrixPosition` for each instance.
     * This method updates only the position attributes of the matrix.
     * @param onUpdate A callback function to update each entity.
     * @param start The starting index of the instances to update. Defaults to `0`.
     * @param count The number of instances to update. Defaults to the total instance count.
     * @returns The current `InstancedMesh2` instance.
     */
    updateInstancesPosition(onUpdate: UpdateEntityCallback<Entity<TData>>, start?: number, count?: number): this;
    /**
     * Adds new instances and optionally initializes them using a callback function.
     * @param count The number of new instances to add.
     * @param onCreation A callback function to initialize each new entity.
     * @returns The current `InstancedMesh2` instance.
     */
    addInstances(count: number, onCreation: UpdateEntityCallback<Entity<TData>>): this;
    /**
     * TODO
     * @param ids TODO
     * @returns The current `InstancedMesh2` instance.
     */
    removeInstances(ids: number[]): this;
    /**
     * TODO
     * @returns The current `InstancedMesh2` instance.
     */
    clearInstances(): this;
    /** @internal */ clearInstance(instance: InstancedEntity, index: number): InstancedEntity;
    /** @internal */ createEntities(start: number): this;
    /** @internal */ addInstance(id: number, onCreation: UpdateEntityCallback): void;
  }
}

InstancedMesh2.prototype.clearInstance = function (instance: InstancedEntity, index: number) {
  (instance as any).id = index;
  instance.position.set(0, 0, 0);
  instance.scale.set(1, 1, 1);
  instance.quaternion.set(0, 0, 0, 1);
  instance.rotation?.set(0, 0, 0);
  return instance;
};

InstancedMesh2.prototype.updateInstances = function (this: InstancedMesh2, onUpdate?: UpdateEntityCallback, start = 0, count = this._instancesCount) {
  const end = start + count;
  const instances = this.instances;
  const tempInstance = this._tempInstance;

  for (let i = start; i < end; i++) {
    const instance = instances ? instances[i] : this.clearInstance(tempInstance, i);
    onUpdate(instance, i);
    instance.updateMatrix();
  }

  return this;
};

InstancedMesh2.prototype.updateInstancesPosition = function (this: InstancedMesh2, onUpdate?: UpdateEntityCallback, start = 0, count = this._instancesCount) {
  const end = start + count;
  const instances = this.instances;
  const tempInstance = this._tempInstance;

  for (let i = start; i < end; i++) {
    const instance = instances ? instances[i] : this.clearInstance(tempInstance, i);
    onUpdate(instance, i);
    instance.updateMatrixPosition();
  }

  return this;
};

InstancedMesh2.prototype.createEntities = function (this: InstancedMesh2, start: number) {
  const end = this._instancesCount;

  if (!this.instances) {
    this.instances = new Array(end);
  } else if (this.instances.length < end) {
    this.instances.length = end;
  } else {
    return this;
  }

  // we can also revert this for and put 'break' instead of 'continue' but no it's memory consecutive
  const instances = this.instances;
  for (let i = start; i < end; i++) {
    if (instances[i]) continue;
    instances[i] = new InstancedEntity(this, i, this._allowsEuler);
  }

  return this;
};

InstancedMesh2.prototype.addInstances = function (count: number, onCreation: UpdateEntityCallback) {
  const freeIds = this._freeIds;
  if (freeIds.length > 0) {
    const freeIdsUsed = Math.min(freeIds.length, count);
    const freeidsEnd = freeIds.length - freeIdsUsed;

    for (let i = freeIds.length - 1; i >= freeidsEnd; i--) {
      this.addInstance(i, onCreation);
    }

    freeIds.length -= freeIdsUsed;
    count -= freeIdsUsed;
    if (count === 0) return this;
  }

  const start = this._instancesCount;
  const end = start + count;
  this.setInstancesCount(this._instancesCount + count);

  for (let i = start; i < end; i++) {
    this.addInstance(i, onCreation);
  }

  return this;
};

InstancedMesh2.prototype.addInstance = function (id: number, onCreation: UpdateEntityCallback) {
  this.setActiveAndVisibilityAt(id, true);
  const instance = this.instances ? this.instances[id] : this.clearInstance(this._tempInstance, id);
  onCreation(instance, id);
  instance.updateMatrix();
  this.bvh?.insert(id);
};

InstancedMesh2.prototype.removeInstances = function (ids: number[]) {
  const freeIds = this._freeIds;
  const bvh = this.bvh;

  for (const id of ids) {
    if (id < this._instancesCount && this.getActiveAt(id)) {
      this.setActiveAt(id, false);
      freeIds.push(id);
      bvh?.delete(id);
    }
  }

  for (let i = this._instancesCount - 1; i >= 0; i--) {
    if (this.getActiveAt(i)) break;
    this._instancesCount--;
  }

  return this;
};

InstancedMesh2.prototype.clearInstances = function () {
  this._instancesCount = 0;
  this._freeIds.length = 0;
  this.bvh?.clear();
  return this;
};
