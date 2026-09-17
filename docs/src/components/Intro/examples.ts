import { InstancedMesh2 } from "@three.ez/instanced-mesh";
import { Color, IcosahedronGeometry, MeshLambertMaterial, Vector3 } from "three";
import { prepareOutlineGeometry, bootProgress, outlineMaterial, patchCelMaterial } from "./shader";
import manifest from "../../data/examples.manifest.json";

/* The example gates mirror the docs example list, in manifest order. */
export const EXAMPLE_COUNT = Math.min(8, manifest.length);

const RING = 250;
const EXAMPLE_HUES = ["#ffb347", "#66e0ff", "#ff8ad4", "#ffe066", "#ffd479", "#8fb8ff", "#ff9f6b", "#9ecbff"];

/* A polygon crystal per example: fly to it to open the demo. */
export class ExampleGates extends InstancedMesh2<{ phase: number; home: Vector3; spin: Vector3; targetScale: number; targetColor: Color }> {
  public motion = true;
  public boot = 1;
  public discovered = new Set<number>();
  public ink!: InstancedMesh2;

  constructor() {
    const material = new MeshLambertMaterial({ emissive: 0x3a2a12 });
    super(new IcosahedronGeometry(2.6, 0), material, {
      createEntities: true,
      capacity: EXAMPLE_COUNT,
      allowsEuler: true,
    });
    this.frustumCulled = false;
    patchCelMaterial(material, { boot: bootProgress, phosphor: new Color("#f2f6ff"), rim: 0.3 });

    const ink = new InstancedMesh2(new IcosahedronGeometry(2.6, 0), outlineMaterial(0.16), {
      createEntities: true,
      capacity: EXAMPLE_COUNT,
      allowsEuler: true,
    });
    prepareOutlineGeometry(ink.geometry);
    ink.frustumCulled = false;
    /* After the crystals, so their depth hides the hull's interior faces. */
    ink.renderOrder = 1;
    ink.addInstances(EXAMPLE_COUNT, (obj) => obj.scale.setScalar(1));
    this.ink = ink;
    this.add(ink);

    this.addInstances(EXAMPLE_COUNT, (obj, index) => {
      const angle = (index / EXAMPLE_COUNT) * Math.PI * 2 + 0.2;
      const radius = RING * (0.9 + 0.12 * Math.sin(index * 1.7));
      const y = 5 + Math.abs(Math.sin(index * 2.3)) * 12;
      obj.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      obj.home = obj.position.clone();
      obj.phase = index * 0.9;
      obj.spin = new Vector3(0.1 + index * 0.01, 0.18, 0.06);
      obj.scale.setScalar(1);
      obj.targetScale = 1;
      obj.targetColor = new Color(EXAMPLE_HUES[index % EXAMPLE_HUES.length]);
      obj.color = obj.targetColor;
    });

    const tint = new Color();
    const bootTint = new Color("#f2f6ff");

    this.on("animate", (e) => {
      if (!this.motion && this.boot >= 1) return;
      const dt = Math.min(e.delta, 0.05);

      if (this.boot < 1) {
        const k = this.boot;
        const spread = 0.3 + 0.7 * k;
        this.updateInstances((obj) => {
          obj.position.set(obj.home.x * spread, obj.home.y, obj.home.z * spread);
          obj.scale.setScalar(obj.targetScale * (0.3 + 0.7 * k));
          tint.copy(bootTint).lerp(obj.targetColor, k);
          obj.color = tint;
        });
      } else {
        this.updateInstances((obj) => {
          obj.phase += dt;
          obj.position.y = obj.home.y + Math.sin(obj.phase * 0.7) * 1.2;
          obj.rotation.x += obj.spin.x * dt;
          obj.rotation.y += obj.spin.y * dt;
          obj.rotation.z += obj.spin.z * dt;
        });
      }

      this.syncInk();
    });

    /* Reduced motion never enters the animate branch: place the hulls now. */
    this.syncInk();
  }

  /* Matrices are only written to the texture through updateInstances. */
  private syncInk(): void {
    this.ink.updateInstances((twin, index) => {
      const obj = this.instances[index];
      twin.position.copy(obj.position);
      twin.rotation.copy(obj.rotation);
      twin.scale.copy(obj.scale);
    });
  }
}
