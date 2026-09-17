import { createRadixSort, InstancedMesh2 } from "@three.ez/instanced-mesh";
import { Color, IcosahedronGeometry, MeshBasicMaterial, Vector2, Vector3 } from "three";
import { rand } from "./random";
import { prepareOutlineGeometry, bootProgress, outlineMaterial, patchCelMaterial } from "./shader";
import { buildAtlas, paintRock, tileOffset } from "./textures";

const capacity = 460;
const ATLAS = { cols: 4, rows: 4 };
const SCHEMATIC = new Color("#dfe8ff");


export class AsteroidField extends InstancedMesh2<{ dir: Vector3; tumble: Vector3; seed: number; home: Vector3; targetScale: number; targetColor: Color }> {
  public readonly radius = 84;
  public readonly drift = 0.8;
  public motion = true;
  public boot = 1;
  public ink!: InstancedMesh2;

  constructor() {
    /* Unlit: the atlas albedo and the per-instance colour carry the rock,
       never the scene lights. `gain`/`lift`/`rim` do not apply here. Every
       unlit material in the scene skips tone mapping, so the albedo is the
       colour that reaches the screen. */
    const material = new MeshBasicMaterial({
      map: buildAtlas(ATLAS.cols, ATLAS.rows, 256, paintRock),
      toneMapped: false,
    });
    super(new IcosahedronGeometry(1, 0), material, { createEntities: true, capacity, allowsEuler: true });
    this.frustumCulled = false;
    this.castShadow = false;
    this.receiveShadow = false;
    patchCelMaterial(material, { atlas: ATLAS, boot: bootProgress, phosphor: SCHEMATIC });
    this.initUniformsPerInstance({ fragment: { atlasOffset: "vec2" } });
    this.sortObjects = true;
    this.customSort = createRadixSort(this);

    /* Every body carries its ink hull, the belt included. */
    const ink = new InstancedMesh2(new IcosahedronGeometry(1, 0), outlineMaterial(0.12), {
      createEntities: true,
      capacity,
      allowsEuler: true,
    });
    prepareOutlineGeometry(ink.geometry);
    ink.frustumCulled = false;
    ink.castShadow = false;
    ink.receiveShadow = false;
    /* After the rocks, so their depth hides the hull's interior faces. */
    ink.renderOrder = 1;
    ink.addInstances(capacity, (obj) => obj.scale.setScalar(1));
    this.ink = ink;
    this.add(ink);

    this.addInstances(capacity, (obj, index) => {
      const seed = rand(index) * 1e5;
      obj.seed = seed;

      const ring = this.radius * (0.5 + 0.5 * Math.sin(seed * 7));
      const angle = seed * 40;
      obj.position.set(Math.cos(angle) * ring, Math.sin(seed * 13) * 14, Math.sin(angle) * ring);

      const scale = 0.25 + Math.abs(Math.sin(seed * 3)) * 1.25;
      obj.scale.set(
        scale * (0.75 + Math.abs(Math.sin(seed * 2.1)) * 0.5),
        scale * (0.6 + Math.abs(Math.cos(seed * 3.3)) * 0.6),
        scale * (0.8 + Math.abs(Math.sin(seed * 4.7)) * 0.4)
      );
      obj.rotation.set(seed * 10, seed * 7, seed * 5);

      /* Neutral grey, matte: unlit, so this multiplier rides the atlas albedo
         straight to the screen. Kept near white so the rocks stay readable
         against both the black sky and a bright planet. */
      const saturation = Math.abs(Math.sin(seed * 11)) * 0.012;
      const lightness = 0.76 + Math.abs(Math.sin(seed * 17)) * 0.24;
      obj.targetColor = new Color().setHSL(0.58, saturation, lightness);
      obj.home = obj.position.clone();
      obj.targetScale = scale;
      obj.color = obj.targetColor;
      const [u, v] = tileOffset(index % (ATLAS.cols * ATLAS.rows), ATLAS.cols, ATLAS.rows);
      obj.setUniform("atlasOffset", new Vector2(u, v));

      obj.dir = new Vector3(
        Math.sin(seed * 23) * this.drift,
        Math.sin(seed * 29) * this.drift * 0.6,
        Math.cos(seed * 31) * this.drift
      );
      obj.tumble = new Vector3(
        Math.sin(seed * 2) * 0.9,
        Math.cos(seed * 3) * 1.1,
        Math.sin(seed * 5) * 0.8
      );
    });

    const tint = new Color();

    this.on("animate", (e) => {
      if (!this.motion && this.boot >= 1) return;
      const dt = Math.min(e.delta, 0.05);

      if (this.boot < 1) {
        const k = this.boot;
        const spread = 0.3 + 0.7 * k;
        this.updateInstances((obj) => {
          obj.position.set(obj.home.x * spread, obj.home.y, obj.home.z * spread);
          obj.scale.setScalar(obj.targetScale * (0.3 + 0.7 * k));
          tint.copy(SCHEMATIC).lerp(obj.targetColor, k);
          obj.color = tint;
        });
      } else {
        this.updateInstances((obj) => {
          obj.rotation.x += obj.tumble.x * dt;
          obj.rotation.y += obj.tumble.y * dt;
          obj.rotation.z += obj.tumble.z * dt;
          obj.position.addScaledVector(obj.dir, dt);
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
