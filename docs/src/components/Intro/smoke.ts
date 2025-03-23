import { InstancedMesh2 } from "@three.ez/instanced-mesh";
import { MeshLambertMaterial, OctahedronGeometry, Vector3 } from "three";
import type { SpaceShip } from "./spaceship";

export class Smoke extends InstancedMesh2<{ time: number }> {
  public multiplayerScalar = 4;
  public spawnTime = 0.2;
  public direction = new Vector3(0, 0, 1);
  public lifeTime = 3;
  public currentTime = 0;
  public speed = 2;

  constructor(private spaceship: SpaceShip) {
    super(
      new OctahedronGeometry(0.05, 1),
      new MeshLambertMaterial({ color: 0xffffff }),
      { createEntities: true },
    );

    const spawnPoints = [
      new Vector3(0.52, 0.75, -1),
      new Vector3(-0.52, 0.75, -1),
    ];

    this.on("animate", (e) => {
      this.updateInstances((obj, index) => {
        obj.time += e.delta;
        if (obj.time >= this.lifeTime) {
          this.removeInstances(index);
          return;
        }

        obj.position.addScaledVector(
          this.direction,
          this.speed * e.delta * Math.random() * 1.1,
        );
        obj.scale.addScalar(e.delta * this.multiplayerScalar);
      });

      this.currentTime += e.delta;
      if (this.currentTime >= this.spawnTime) {
        this.currentTime -= this.spawnTime;

        this.addInstances(2, (obj, index) => {
          obj.time = this.currentTime;
          obj.position.copy(spawnPoints[index % 2]);
          this.spaceship.localToWorld(obj.position);
          obj.position.addScaledVector(this.direction, this.speed * obj.time);
          obj.scale.addScalar(obj.time * this.multiplayerScalar);
        });
      }
    });
  }
}
