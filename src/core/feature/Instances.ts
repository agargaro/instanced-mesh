import { InstancedEntity } from '../InstancedEntity.js';
import { InstancedMesh2 } from '../InstancedMesh2.js';

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
     * Updates instances by applying a callback function to each instance.
     * @param onUpdate A callback function to update each entity.
     * @param start The starting index of the instances to update. Defaults to 0.
     * @param count The number of instances to update. Defaults to the total instance count.
     * @returns The current `InstancedMesh2` instance.
     */
    updateInstances(onUpdate: UpdateEntityCallback<Entity<TData>>, start?: number, count?: number): this;
    /**
     * Updates instances position by applying a callback function to each instance.
     * This method updates only the position attributes of the matrix.
     * @param onUpdate A callback function to update each entity.
     * @param start The starting index of the instances to update. Defaults to 0.
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
    addInstances(count: number, onCreation?: UpdateEntityCallback<Entity<TData>>): this;
    /**
     * TODO
     * @param ids
     * @returns
     */
    removeInstances(ids: number[]): number[]; // TODO also addInstances should return indexes?
    /**
     * TODO
     */
    optimize(): void;
    /** @internal */ clearInstance(instance: InstancedEntity, index: number): InstancedEntity;
    /** @internal */ createEntities(start?: number, count?: number): this;
  }
}

InstancedMesh2.prototype.clearInstance = function (instance: InstancedEntity, index: number): InstancedEntity {
  (instance as any).id = index;
  instance.position.set(0, 0, 0);
  instance.scale.set(1, 1, 1);
  instance.quaternion.set(0, 0, 0, 1);
  instance.rotation?.set(0, 0, 0);
  return instance;
};

InstancedMesh2.prototype.updateInstances = function (this: InstancedMesh2, onUpdate?: UpdateEntityCallback, start = 0, count = this._instancesCount): InstancedMesh2 {
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

InstancedMesh2.prototype.updateInstancesPosition = function (this: InstancedMesh2, onUpdate?: UpdateEntityCallback, start = 0, count = this._instancesCount): InstancedMesh2 {
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

InstancedMesh2.prototype.createEntities = function (this: InstancedMesh2, start = 0, count = this._instancesCount): InstancedMesh2 {
  const end = start + count;

  if (!this.instances) this.instances = new Array(count);
  else this.instances.length = end;

  const instances = this.instances;
  for (let i = start; i < end; i++) {
    const instance = new InstancedEntity(this, i, this._allowsEuler);
    instances[i] = instance;
  }

  return this;
};

InstancedMesh2.prototype.addInstances = function (count: number, onCreation?: UpdateEntityCallback): InstancedMesh2 {
  const start = this._instancesCount;
  const end = start + count;
  const bvh = this.bvh;

  this.setInstancesCount(this._instancesCount + count);

  if (onCreation) {
    for (let i = start; i < end; i++) {
      const instance = this.instances ? this.instances[i] : this.clearInstance(this._tempInstance, i);
      onCreation(instance, i);
      instance.updateMatrix();
      bvh?.insert(i);
    }
  }

  return this;
};
