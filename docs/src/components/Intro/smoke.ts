import { InstancedMesh2 } from "@three.ez/instanced-mesh";
import { Color, MeshBasicMaterial, OctahedronGeometry, Vector3 } from "three";
import { bootProgress, patchCelMaterial } from "./shader";
import { type SpaceShip } from "./spaceship";

/* Cream cartoon puffs: particles are born large and shrink to nothing, which
   reads as a jet of exhaust rather than a cloud of smoke. */
export class Smoke extends InstancedMesh2<{ currentTime: number; dir: Vector3 }> {
  /* Exactly on the two nozzle clusters (measured on the model). */
  private readonly spawnPoints = [new Vector3(0.77, 0.71, -1.3), new Vector3(-0.77, 0.71, -1.3)];
  private readonly spawnTime = 0.058;
  private readonly lifeTime = 0.72;
  private readonly speed = 2.4;
  private readonly startScale = 0.95;
  private readonly direction = new Vector3(0, -0.02, -1).normalize();
  private readonly dirDisplacement = 0.18;
  private readonly scratchDir = new Vector3();
  private thrust = 0;
  private time = 0;
  private side = 0;

  constructor(spaceship: SpaceShip) {
    const material = new MeshBasicMaterial({
      color: 0x5fe0ff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      toneMapped: false,
    });
    patchCelMaterial(material, { boot: bootProgress, phosphor: new Color("#f6f1e6"), rim: 0.18 });
    super(new OctahedronGeometry(0.42, 1), material, { createEntities: true, capacity: 1100 });
    this.frustumCulled = false;

    this.on("animate", (e) => {
      this.updateParticles(e.delta);
      this.addParticles(spaceship, e.delta);
    });
  }

  /** Drives the plume: 0 idle, 1 full throttle. */
  setThrust(t: number): void {
    this.thrust = Math.min(1, Math.max(0, t));
  }

  private updateParticles(delta: number): void {
    this.updateInstances((obj) => {
      obj.currentTime += delta;

      if (obj.currentTime >= this.lifeTime) {
        obj.remove();
        return;
      }

      const progress = obj.currentTime / this.lifeTime;
      obj.position.addScaledVector(obj.dir, this.speed * delta);
      obj.scale.setScalar(this.startScale * (1 - progress) * (0.7 + this.thrust * 0.85) + 0.04);
      obj.opacity = Math.pow(1 - progress, 1.8) * 0.68;
    });
  }

  private addParticles(spaceship: SpaceShip, delta: number): void {
    /* No idle plume: the engines only puff once the throttle bites. */
    if (this.thrust <= 0.02) {
      this.time = 0;
      return;
    }

    const dirDisplacement = this.dirDisplacement;
    const halfDirDisplacement = dirDisplacement / 2;
    this.time += delta * (0.6 + this.thrust);

    while (this.time >= this.spawnTime) {
      this.time -= this.spawnTime;
      if (this.time >= this.lifeTime) continue;

      this.addInstances(2, (obj) => {
        /* Alternating nozzles: entity ids from the free list need not. */
        const side = this.side;
        this.side ^= 1;
        obj.currentTime = this.time;
        /* Recomputed on every spawn: entity reuse must not keep a stale dir. */
        if (!obj.dir) obj.dir = new Vector3();
        this.scratchDir.copy(this.direction).setX(side === 0 ? 0.42 : -0.42).setY(-0.12).applyQuaternion(spaceship.quaternion);
        obj.dir.copy(this.scratchDir);
        obj.dir.x += Math.random() * dirDisplacement - halfDirDisplacement;
        obj.dir.y += Math.random() * dirDisplacement - halfDirDisplacement;
        obj.dir.z += Math.random() * dirDisplacement - halfDirDisplacement;

        obj.position.copy(this.spawnPoints[side]);
        spaceship.localToWorld(obj.position);

        const progress = obj.currentTime / this.lifeTime;
        obj.position.addScaledVector(obj.dir, (this.speed + this.thrust * 4.5) * obj.currentTime);
        obj.scale.setScalar(this.startScale * (1 - progress) * (0.7 + this.thrust * 0.85) + 0.04);
        obj.opacity = Math.pow(1 - progress, 1.8) * 0.7;
      });
    }
  }
}
