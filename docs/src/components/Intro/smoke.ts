import { InstancedMesh2 } from "@three.ez/instanced-mesh";
import { MeshLambertMaterial, OctahedronGeometry, Vector3 } from "three";
import { type SpaceShip } from "./spaceship";

export class Smoke extends InstancedMesh2<{ currentTime: number }> {
  private readonly spawnPoints = [new Vector3(0.52, 0.75, -1), new Vector3(-0.52, 0.75, -1)];
  private readonly spawnTime = 0.1;
  private readonly lifeTime = 3;
  private readonly speed = 4;
  private readonly scaleMultiplier = 8;
  private readonly direction = new Vector3(0, 0, 1);
  private time = 0;

  constructor(spaceship: SpaceShip) {
    super(new OctahedronGeometry(0.05, 1), new MeshLambertMaterial({ color: 0xffffff }), { createEntities: true });

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

      obj.position.addScaledVector(this.direction, this.speed * delta);
      obj.scale.addScalar(this.scaleMultiplier * delta);
    });
  }

  private addParticles(spaceship: SpaceShip, delta: number): void {
    this.time += delta;

    while (this.time >= this.spawnTime) {
      this.time -= this.spawnTime;
      if (this.time >= this.lifeTime) continue;

      this.addInstances(2, (obj, index) => {
        obj.currentTime = this.time;

        obj.position.copy(this.spawnPoints[index % 2]);
        spaceship.localToWorld(obj.position);

        obj.position.addScaledVector(this.direction, this.speed * obj.currentTime);
        obj.scale.addScalar(this.scaleMultiplier * obj.currentTime);
      });
    }
  }
}
