import { createRadixSort, InstancedMesh2 } from "@three.ez/instanced-mesh";
import { MeshLambertMaterial, OctahedronGeometry, Vector3 } from "three";
import { type SpaceShip } from "./spaceship";

export class Smoke extends InstancedMesh2<{ currentTime: number, dir: Vector3 }> {
  private readonly spawnPoints = [new Vector3(0.52, 0.75, -1), new Vector3(-0.52, 0.75, -1)];
  private readonly spawnTime = 0.005;
  private readonly lifeTime = 1;
  private readonly speed = 3;
  private readonly scaleMultiplier = 3;
  private readonly opacityMultiplier = 1;
  private readonly direction = new Vector3(0, 0.2, 1).normalize();
  private readonly dirDisplacement = 0.1;
  private time = 0;

  constructor(spaceship: SpaceShip) {
    const material = new MeshLambertMaterial({ emissive: 0x999999, transparent: true, depthWrite: false });
    super(new OctahedronGeometry(0.03, 1), material, { createEntities: true, capacity: 500 });
    this.frustumCulled = false;

    this.sortObjects = true;
    this.customSort = createRadixSort(this);

    this.on("animate", (e) => {
      this.updateParticles(e.delta);
      this.addParticles(spaceship, e.delta);
    });
  }

  private updateParticles(delta: number): void {
    this.updateInstances((obj) => {
      obj.currentTime += delta;

      if (obj.currentTime >= this.lifeTime) {
        obj.remove();
        return;
      }

      obj.position.addScaledVector(obj.dir, this.speed * delta);
      obj.scale.addScalar(this.scaleMultiplier * delta);
      obj.opacity -= delta * this.opacityMultiplier;
    });
  }

  private addParticles(spaceship: SpaceShip, delta: number): void {
    const dirDisplacement = this.dirDisplacement;
    const halfDirDisplacement = dirDisplacement / 2;
    this.time += delta;

    while (this.time >= this.spawnTime) {
      this.time -= this.spawnTime;
      if (this.time >= this.lifeTime) continue;

      this.addInstances(2, (obj, index) => {
        obj.currentTime = this.time;
        if (!obj.dir) {
          obj.dir = this.direction.clone();
          obj.dir.x += Math.random() * dirDisplacement - halfDirDisplacement;
          obj.dir.y += Math.random() * dirDisplacement - halfDirDisplacement;
          obj.dir.z += Math.random() * dirDisplacement - halfDirDisplacement;
        }

        obj.position.copy(this.spawnPoints[index % 2]);
        spaceship.localToWorld(obj.position);

        obj.position.addScaledVector(obj.dir, this.speed * obj.currentTime);
        obj.scale.addScalar(this.scaleMultiplier * obj.currentTime);
        obj.opacity = 1 - obj.currentTime * this.opacityMultiplier;
      });
    }
  }
}
