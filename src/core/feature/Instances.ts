import { InstancedEntity } from '../InstancedEntity.js';
import { InstancedMesh2 } from '../InstancedMesh2.js';

export type Entity<T> = InstancedEntity & T;
export type UpdateEntityCallback<T = InstancedEntity> = (obj: Entity<T>, index: number) => void;

declare module '../InstancedMesh2.js' {
  interface InstancedMesh2<TData = {}> {
    /** @internal */ clearInstance(instance: InstancedEntity, index: number): InstancedEntity;
    /** @internal */ createInstances(start?: number, count?: number): this;
    updateInstances(onUpdate: UpdateEntityCallback<Entity<TData>>, start?: number, count?: number): this;
    addInstances(count: number, onCreation?: UpdateEntityCallback<Entity<TData>>): this;
    // removeInstances(count: number): void;
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
  const tempInstance = this._instance;

  for (let i = start; i < end; i++) {
    const instance = instances ? instances[i] : this.clearInstance(tempInstance, i);
    onUpdate(instance, i);
    instance.updateMatrix();
  }

  return this;
};

InstancedMesh2.prototype.createInstances = function (this: InstancedMesh2, start = 0, count = this._instancesCount): InstancedMesh2 {
  const end = start + count;

  if (!this.instances) this.instances = new Array(count);
  else this.instances.length = end;

  const instances = this.instances;
  for (let i = start; i < end; i++) {
    const instance = new InstancedEntity(this, i, this._instancesUseEuler);
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
      const instance = this.instances ? this.instances[i] : this.clearInstance(this._instance, i);
      onCreation(instance, i);
      instance.updateMatrix();
      bvh?.insert(i);
    }
  }

  return this;
};
