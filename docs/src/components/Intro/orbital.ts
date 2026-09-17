import { InstancedMesh2 } from "@three.ez/instanced-mesh";
import {
  Color,
  MeshBasicMaterial,
  Quaternion,
  Shape,
  ShapeGeometry,
  Vector3,
  type Camera,
} from "three";

const INK = new Color("#f2f6ff");
const AMBER = new Color("#ffb347");
const Z_AXIS = new Vector3(0, 0, 1);

export type OrbitalTarget = { position: Vector3; kind: "feature" | "example" };

/* A flat chevron pointing +Y, used as the edge indicator. */
function chevronGeometry(): ShapeGeometry {
  const shape = new Shape();
  shape.moveTo(-0.5, -0.42);
  shape.lineTo(0, 0.5);
  shape.lineTo(0.5, -0.42);
  shape.lineTo(0, 0.02);
  shape.closePath();
  return new ShapeGeometry(shape);
}

/* Edge indicators: one discreet chevron per objective, pinned to the screen
   border in the target's direction, vanishing once the objective is found. */
export class OrbitalIndicators extends InstancedMesh2<{ target: OrbitalTarget; index: number }> {
  private readonly view = new Vector3();
  private readonly forward = new Vector3();
  private readonly right = new Vector3();
  readonly up = new Vector3();
  readonly quaternion = new Quaternion();

  constructor(private readonly targets: OrbitalTarget[], private readonly camera: Camera) {
    super(chevronGeometry(), new MeshBasicMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }), { createEntities: true, capacity: targets.length });

    this.frustumCulled = false;
    this.renderOrder = 10;

    this.addInstances(targets.length, (obj, index) => {
      obj.target = targets[index];
      obj.index = index;
      obj.color = targets[index].kind === "feature" ? INK : AMBER;
      obj.opacity = 0;
    });
  }

  /** `discovered` is indexed like the targets array. */
  update(discovered: boolean[], time: number): void {
    const camera = this.camera;
    const dist = 2.6;
    const halfHeight = Math.tan(((camera as { fov?: number }).fov ?? 50) * Math.PI / 360) * dist * 0.9;
    const halfWidth = halfHeight * ((camera as { aspect?: number }).aspect ?? 1.6);

    this.forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    this.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    this.up.set(0, 1, 0).applyQuaternion(camera.quaternion);

    this.updateInstances((obj) => {
      if (discovered[obj.index]) {
        obj.opacity = 0;
        obj.scale.setScalar(0.0001);
        return;
      }

      this.view.copy(obj.target.position).sub(camera.position).applyQuaternion(this.quaternion.copy(camera.quaternion).invert());

      const inFront = this.view.z < 0;
      let nx = inFront ? this.view.x : -this.view.x;
      let ny = inFront ? this.view.y : -this.view.y;
      const length = Math.hypot(nx, ny);

      if (inFront && length < halfHeight * 0.25) {
        obj.opacity = 0;
        obj.scale.setScalar(0.0001);
        return;
      }

      if (length > 0.0001) {
        nx /= length;
        ny /= length;
      } else {
        ny = 1;
        nx = 0;
      }

      /* Land exactly on the screen-edge ellipse in the target's direction. */
      const scaleToEdge = 1 / Math.max(Math.abs(nx) / halfWidth, Math.abs(ny) / halfHeight);
      obj.position
        .copy(camera.position)
        .addScaledVector(this.forward, dist)
        .addScaledVector(this.right, nx * scaleToEdge)
        .addScaledVector(this.up, ny * scaleToEdge);

      this.quaternion.copy(camera.quaternion).multiply(new Quaternion().setFromAxisAngle(Z_AXIS, Math.atan2(nx, ny)));
      obj.quaternion.copy(this.quaternion);

      const pulse = 1 + Math.sin(time * 2.2 + obj.index) * 0.08;
      obj.scale.setScalar(0.26 * pulse);
      obj.opacity = 0.55;
    });
  }
}
