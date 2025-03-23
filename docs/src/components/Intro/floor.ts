import { InstancedMesh2 } from "@three.ez/instanced-mesh";
import { BoxGeometry, Color, MeshLambertMaterial } from "three";
import { rand } from "./random";

const capacity = 800;

export class Floor extends InstancedMesh2<{ multiplier: number; startTime: number; }> {
  public floorSpeed = 7;
  public scaleSpeed = 0.7;
  private readonly maxHeight = 15;

  constructor() {
    super(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), { capacity, createEntities: true });
    this.matricesTexture.partialUpdate = false;

    const col = Math.sqrt(capacity / 2);
    const halfCol = col / 2;

    this.addInstances(capacity, (obj, index) => {
      obj.position.x = index % col - halfCol;
      obj.position.z = -Math.floor(index / col);
      
      const repeteadIndex = index % (col ** 2);
      obj.multiplier = this.maxHeight * this.easeInSine((Math.abs(obj.position.x) + 3) / (halfCol + 3));
      obj.startTime = (obj.position.x + 10) * repeteadIndex;
      obj.scale.y = Math.abs(Math.sin(obj.startTime)) * obj.multiplier;

      const seed = obj.position.x * repeteadIndex;
      const hue = (repeteadIndex / col ** 2) + rand(seed) * 0.15;
      const saturation = 0.5 + rand(seed) * 0.5;
      const lightness = 0.45 + rand(seed) * 0.1;
      obj.color = new Color().setHSL(hue, saturation, lightness);
    });

    this.on('animate', (e) => {
      const time = e.total * this.scaleSpeed;
      this.updateInstances((obj) => {
        obj.scale.y = Math.abs(Math.sin(obj.startTime + time)) * obj.multiplier;
      });

      this.position.z += e.delta * this.floorSpeed;
      if (this.position.z > col) {
        this.position.z %= col;
      }
    });
  }

  private easeInSine(x: number): number {
    return 1 - Math.cos((x * Math.PI) / 2);
  }
}
