import { createRadixSort, InstancedMesh2 } from "@three.ez/instanced-mesh";
import { BoxGeometry, Color, MeshLambertMaterial, PointLight, SpotLight } from "three";

type CustomData = { multiplier: number; startTime: number; };

const capacity = 800;

export class Floor extends InstancedMesh2<CustomData> {
  public speed = 10;
  private maxHeight = 15;

  constructor() {
    super(new BoxGeometry(1, 1, 1), new MeshLambertMaterial(), { capacity, createEntities: true });
    this.perObjectFrustumCulled = false;

    const col = Math.sqrt(capacity / 2);
    const halfCol = col / 2;

    this.addInstances(capacity, (obj, index) => {
      obj.position.x = index % col - halfCol;
      obj.position.y = Math.floor(index / col) - (halfCol / 2);

      const repeteadIndex = index % (col ** 2);
      obj.multiplier = this.maxHeight * this.easeInSine((Math.abs(obj.position.x) + 1) / (halfCol + 1));
      obj.startTime = obj.position.x * repeteadIndex;

      obj.scale.z = Math.abs(Math.sin(obj.startTime)) * obj.multiplier;
      // obj.color = new Color().setHSL(1, 1, Math.max(0.3, Math.abs(Math.sin(repeteadIndex))));
      obj.color = new Color().setHSL(Math.floor(repeteadIndex / col) / col, 0.5, 0.5);
    });

    this.on('animate', (e) => {
      const time = e.total * 0.7;
      this.updateInstances((obj, index) => {
        obj.scale.z = Math.abs(Math.sin(obj.startTime + time)) * obj.multiplier;
      });

      this.position.y -= e.delta * this.speed;
      if (this.position.y < -col) {
        this.position.y += col;
      }
    });
  }

  private easeInSine(x: number): number {
    return 1 - Math.cos((x * Math.PI) / 2);
  }
}
