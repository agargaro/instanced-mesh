import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import { rand } from "./random";

/* Deterministic string hash so a planet's surface is seeded by its title. */
export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type TilePainter = (ctx: CanvasRenderingContext2D, size: number, seed: number, index: number) => void;

/* One canvas atlas for a whole instanced family: each instance samples its own
   tile through the per-instance `atlasOffset` uniform. */
export function buildAtlas(cols: number, rows: number, tileSize: number, paint: TilePainter): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = cols * tileSize;
  canvas.height = rows * tileSize;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      ctx.save();
      ctx.translate(col * tileSize, row * tileSize);
      ctx.beginPath();
      ctx.rect(0, 0, tileSize, tileSize);
      ctx.clip();
      paint(ctx, tileSize, hashString(`${index}:${col}:${row}`), index);
      ctx.restore();
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Atlas offset for tile `index` in a `cols` x `rows` grid. */
export function tileOffset(index: number, cols: number, rows: number): [number, number] {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return [col / cols, (rows - 1 - row) / rows];
}

/* Rock tile: mottled grey-blue body, speckles, craters, hairline cracks. */
function noise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const h = (ix: number, iy: number) => rand(seed + ix * 57.13 + iy * 131.7);
  const a = h(xi, yi);
  const b = h(xi + 1, yi);
  const c = h(xi, yi + 1);
  const d = h(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function fbm(x: number, y: number, seed: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += noise2(x * freq, y * freq, seed + o * 17.7) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum;
}

/* Rock: mottled regolith, cratered bowls with a soft rim, fissures, fine grain.
   Matte by contract — no specular highlights, only light and shadow. */
export function paintRock(ctx: CanvasRenderingContext2D, size: number, seed: number): void {
  const base = 60 + Math.floor(rand(seed) * 26);
  const field = Math.max(48, Math.floor(size / 2.6));
  const noise = ctx.createImageData(field, field);
  const data = noise.data;
  for (let y = 0; y < field; y++) {
    for (let x = 0; x < field; x++) {
      /* Sampled on a cylinder so the field is periodic in u: no seam. */
      const angle = (x / field) * Math.PI * 2;
      const cx = Math.cos(angle) * 2.4;
      const cy = Math.sin(angle) * 2.4;
      const vh = (y / field) * 5;
      const mottle = fbm(cx * 2.4 + vh * 0.35, cy * 2.4 + vh * 0.35, seed, 4);
      const ridge = Math.abs(fbm(cx * 5 + vh * 0.8 + 11, cy * 5 + vh * 0.8 + 7, seed + 3, 3) - 0.5) * 2;
      let v = base + (mottle - 0.5) * 48 - ridge * 12;
      v = Math.max(32, Math.min(118, v));
      const i = (y * field + x) * 4;
      data[i] = v * 0.94;
      data[i + 1] = v * 0.99;
      data[i + 2] = v * 1.14;
      data[i + 3] = 255;
    }
  }
  const buffer = document.createElement("canvas");
  buffer.width = buffer.height = field;
  buffer.getContext("2d")?.putImageData(noise, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(buffer, 0, 0, size, size);

  for (let c = 0; c < 5; c++) {
    const cx = rand(seed + c * 71.3) * size;
    const cy = rand(seed + c * 83.7) * size;
    const r = size * (0.05 + rand(seed + c * 97.1) * 0.08);
    const bowl = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.08, cx, cy, r);
    bowl.addColorStop(0, "rgba(16, 20, 30, 0.62)");
    bowl.addColorStop(0.68, "rgba(22, 26, 38, 0.34)");
    bowl.addColorStop(0.9, "rgba(158, 168, 188, 0.16)");
    bowl.addColorStop(1, "rgba(158, 168, 188, 0)");
    ctx.fillStyle = bowl;
    for (const dx of [-size, 0, size]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(10, 12, 18, 0.5)";
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    ctx.lineWidth = 0.8 + rand(seed + i * 101.3) * 1.7;
    ctx.beginPath();
    let x = rand(seed + i * 41.3) * size;
    let y = rand(seed + i * 43.9) * size;
    ctx.moveTo(x, y);
    for (let step = 0; step < 6; step++) {
      x += (rand(seed + i * 47.1 + step) - 0.5) * size * 0.24;
      y += (rand(seed + i * 53.7 + step) - 0.5) * size * 0.24;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 900; i++) {
    const x = rand(seed + i * 3.1) * size;
    const y = rand(seed + i * 7.7) * size;
    const a = 0.05 + rand(seed + i * 11.9) * 0.12;
    ctx.fillStyle = `rgba(0, 0, 0, ${a.toFixed(3)})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
}

/* Planet tile: seeded from the capability title, so every planet is its own
   world — one flat base, drifting blob continents, a polar cap. */
export function paintPlanet(ctx: CanvasRenderingContext2D, size: number, seed: number): void {
  const hue = rand(seed) * 360;
  const cool = rand(seed + 1.7) > 0.5;
  const surface = (lightness: number, saturation: number) =>
    `hsl(${cool ? hue : (hue + 40) % 360}, ${saturation}%, ${lightness}%)`;

  /* One flat base colour; all variation comes from the blobs below. */
  ctx.fillStyle = surface(30 + rand(seed + 2.3) * 12, 18 + rand(seed + 3.1) * 22);
  ctx.fillRect(0, 0, size, size);

  const blobs = 10 + Math.floor(rand(seed + 19.1) * 9);
  for (let i = 0; i < blobs; i++) {
    const x = rand(seed + i * 23.7) * size;
    const y = rand(seed + i * 27.9) * size;
    const r = size * (0.06 + rand(seed + i * 31.3) * 0.2);
    ctx.fillStyle = surface(38 + rand(seed + i * 33.9) * 26, 22 + rand(seed + i * 37.1) * 30);
    /* Wrapped in u so the texture tiles across the sphere's seam. */
    for (const dx of [-size, 0, size]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, y, r * (1 + rand(seed + i * 39.7) * 0.8), r * 0.6, rand(seed + i * 41.3) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const capHeight = size * (0.06 + rand(seed + 43.1) * 0.08);
  ctx.fillStyle = "rgba(226, 244, 255, 0.5)";
  ctx.fillRect(0, 0, size, capHeight);
  ctx.fillRect(0, size - capHeight, size, capHeight);

  for (let i = 0; i < 900; i++) {
    const x = rand(seed + i * 47.9) * size;
    const y = rand(seed + i * 53.3) * size;
    ctx.fillStyle = rand(seed + i * 59.7) > 0.5 ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.07)";
    ctx.fillRect(x, y, 1.5, 1.5);
    if (x < 2) ctx.fillRect(x + size, y, 1.5, 1.5);
    if (x > size - 2) ctx.fillRect(x - size, y, 1.5, 1.5);
  }
}
