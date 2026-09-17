import { InstancedMesh2 } from "@three.ez/instanced-mesh";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  IcosahedronGeometry,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  RingGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  SphereGeometry,
  type Camera,
  type Texture,
} from "three";
import { LIBRARY_FEATURES } from "./features";
import { prepareOutlineGeometry, bootProgress, outlineMaterial, patchCelMaterial } from "./shader";
import { buildAtlas, hashString, paintPlanet, tileOffset } from "./textures";

const COUNT = LIBRARY_FEATURES.length;
/* Hash-derived ringed worlds: a characteristic, not a default. */
const RINGED = LIBRARY_FEATURES.map((feature, index) => (hashString(feature.label) % 5 < 2 ? index : -1)).filter((index) => index >= 0);
const PLANET_ATLAS = { cols: 3, rows: 3 };
const HUD_INK = new Color("#f2f6ff");
/* One distinct hue per capability, so the sky reads as a system. */
const PLANET_HUES = ["#6fb3ff", "#ff8a5c", "#b98cff", "#5fd0c8", "#ffd479", "#ff6b6b", "#9de37a", "#7f8cff", "#f0f4ff"];

/* Additive halo texture shared by every beacon. */
function haloTexture(): Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.5)");
  gradient.addColorStop(0.3, "rgba(226, 236, 255, 0.16)");
  gradient.addColorStop(1, "rgba(226, 236, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/* The waypoint itself: a low-poly planet, one InstancedMesh2. */
export class FeatureBeacons extends InstancedMesh2<{ phase: number; spin: Vector3; home: Vector3; targetScale: number; targetColor: Color }> {
  public motion = true;
  public boot = 1;
  public discovered = new Set<number>();
  public ink!: InstancedMesh2;

  constructor() {
    const material = new MeshLambertMaterial({
      map: buildAtlas(PLANET_ATLAS.cols, PLANET_ATLAS.rows, 256, (ctx, size, _seed, index) =>
        paintPlanet(ctx, size, hashString(LIBRARY_FEATURES[index]?.label ?? `planet-${index}`))
      ),
    });
    super(new SphereGeometry(4.4, 48, 32), material, {
      createEntities: true,
      capacity: COUNT,
      allowsEuler: true,
    });
    this.frustumCulled = false;
    patchCelMaterial(material, { atlas: PLANET_ATLAS, boot: bootProgress, phosphor: HUD_INK, rim: 0.22, lift: 0.4 });
    this.initUniformsPerInstance({ fragment: { atlasOffset: "vec2" } });

    const ink = new InstancedMesh2(new SphereGeometry(4.4, 48, 32), outlineMaterial(0.08), {
      createEntities: true,
      capacity: COUNT,
      allowsEuler: true,
    });
    prepareOutlineGeometry(ink.geometry);
    ink.frustumCulled = false;
    /* After the planets, so their depth hides the hull's interior faces. */
    ink.renderOrder = 1;
    ink.addInstances(COUNT, (obj) => obj.scale.setScalar(1));
    this.ink = ink;
    this.add(ink);

    this.addInstances(COUNT, (obj, index) => {
      /* Seeded map: every world keeps its own orbit, so the system reads the
         same on every visit. */
      const seed = hashString(LIBRARY_FEATURES[index].label);
      const angle = (index / COUNT) * Math.PI * 2 + 0.35 + ((seed % 100) / 100) * 0.55;
      const radius = 190 + ((seed >>> 3) % 1000) / 1000 * 210;
      const y = 4 + ((seed >>> 7) % 100) / 100 * 16;
      obj.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      obj.home = obj.position.clone();
      obj.phase = index * 1.37;
      obj.spin = new Vector3(0.05, 0.14 + (index % 4) * 0.04, 0.03);
      obj.rotation.z = 0.12 + (index % 3) * 0.09;
      /* Worlds read clearly larger than the ship, at any orbit. */
      const targetScale = 5.8 + Math.abs(Math.sin(index * 2.7)) * 2.8;
      obj.scale.setScalar(targetScale);
      obj.targetScale = targetScale;
      obj.targetColor = new Color(PLANET_HUES[index % PLANET_HUES.length]);
      obj.color = obj.targetColor;
      const [u, v] = tileOffset(index, PLANET_ATLAS.cols, PLANET_ATLAS.rows);
      obj.setUniform("atlasOffset", new Vector2(u, v));
    });

    const tint = new Color();

    this.on("animate", (e) => {
      if (!this.motion && this.boot >= 1) return;
      const dt = Math.min(e.delta, 0.05);

      if (this.boot < 1) {
        const k = this.boot;
        const spread = 0.34 + 0.66 * k;
        this.updateInstances((obj) => {
          obj.position.set(obj.home.x * spread, obj.home.y, obj.home.z * spread);
          obj.scale.setScalar(obj.targetScale * (0.32 + 0.68 * k));
          tint.copy(HUD_INK).lerp(obj.targetColor, k);
          obj.color = tint;
        });
      } else {
        this.updateInstances((obj) => {
          obj.phase += dt;
          obj.rotation.y += obj.spin.y * dt;
          obj.rotation.x += obj.spin.x * dt;
          obj.position.y = obj.home.y + Math.sin(obj.phase * 0.55) * 1.1;
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

/* Orbital systems: every planet carries two rings and a moon — the "Orbitals"
   signature. Two more InstancedMesh2 families, updated per frame. */


export class OrbitRings extends InstancedMesh2<{ planet: number; radius: number; tilt: number; spin: number }> {
  constructor(private readonly source: FeatureBeacons) {
    super(new RingGeometry(1, 1.12, 64), new MeshLambertMaterial({
      color: 0xdfe8ff,
      emissive: 0x1c2740,
      transparent: true,
      opacity: 0.24,
      side: DoubleSide,
      depthWrite: false,
    }), { createEntities: true, capacity: RINGED.length, allowsEuler: true });

    this.frustumCulled = false;
    this.addInstances(RINGED.length, (obj, index) => {
      const planet = RINGED[index];
      obj.planet = planet;
      /* Just clear of the sphere (radius 4.4), so the ring reads as a ring. */
      obj.radius = 5.1 + Math.abs(Math.sin(planet * 2.3)) * 1.3;
      obj.tilt = 0.26 + (planet % 3) * 0.12;
      obj.spin = 0.16;
      obj.rotation.x = -Math.PI / 2 + obj.tilt;
    });

    this.on("animate", (e) => {
      const dt = Math.min(e.delta, 0.05);
      this.updateInstances((obj) => {
        const planet = source.instances[obj.planet];
        obj.position.copy(planet.position);
        obj.scale.setScalar(planet.scale.x * obj.radius);
        obj.rotation.z += obj.spin * dt;
      });
    });
  }
}

export class PlanetMoons extends InstancedMesh2<{ planet: number; radius: number; phase: number; speed: number; tilt: number }> {
  constructor(private readonly source: FeatureBeacons) {
    super(new IcosahedronGeometry(0.5, 0), new MeshLambertMaterial({ emissive: 0x123a26 }), {
      createEntities: true,
      capacity: COUNT,
    });

    this.frustumCulled = false;
    this.addInstances(COUNT, (obj, index) => {
      obj.planet = index;
      obj.radius = 5.4 + Math.abs(Math.sin(index * 1.7)) * 2.4;
      obj.phase = index * 1.31;
      obj.speed = 0.7 + (index % 4) * 0.16;
      obj.tilt = 0.22 + (index % 3) * 0.14;
      obj.scale.setScalar(0.6 + Math.abs(Math.sin(index * 3.1)) * 0.7);
      obj.color = new Color(PLANET_HUES[(index + 2) % PLANET_HUES.length]);
    });

    this.on("animate", (e) => {
      const dt = Math.min(e.delta, 0.05);
      this.updateInstances((obj) => {
        const planet = source.instances[obj.planet];
        obj.phase += obj.speed * dt;
        const r = obj.radius * planet.scale.x;
        obj.position.set(
          planet.position.x + Math.cos(obj.phase) * r,
          planet.position.y + Math.sin(obj.phase) * r * Math.sin(obj.tilt),
          planet.position.z + Math.sin(obj.phase) * r * Math.cos(obj.tilt)
        );
      });
    });
  }
}

/* Billboarded glow: additive quads that face the camera, one draw call. */
export class BeaconHalos extends InstancedMesh2 {
  constructor(private readonly source: FeatureBeacons, private readonly camera: Camera, haloSize = 30) {
    super(new PlaneGeometry(haloSize, haloSize), new MeshBasicMaterial({
      map: haloTexture(),
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    }), { createEntities: true, capacity: COUNT });

    this.frustumCulled = false;
    this.renderOrder = 2;

    this.addInstances(COUNT, (obj, index) => {
      obj.position.copy(source.instances[index].position);
    });

    this.on("animate", () => {
      this.updateInstances((obj, index) => {
        const live = source.instances[index];
        obj.position.copy(live.position);
        obj.quaternion.copy(camera.quaternion);
        obj.scale.setScalar(1 + Math.sin(live.phase * 1.6) * 0.12);
      });
    });
  }
}
