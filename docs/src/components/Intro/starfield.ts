import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from "three";
import { rand } from "./random";

const COUNT = 3000;

export class Starfield extends Points {
  constructor() {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const seed = rand(i) * 1e5;
      const theta = seed * 40;
      const phi = Math.acos(2 * (rand(i + 1) - 0.5));
      const r = 320 + Math.sin(seed * 9) * 140;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

    super(geometry, new PointsMaterial({
      color: 0xdbe6ff,
      size: 2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      toneMapped: false,
    }));

    this.frustumCulled = false;
  }
}