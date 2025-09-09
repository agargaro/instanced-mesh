import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';
import { execa } from 'execa';

// ===== Config =====
const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const EXAMPLES_GLOB = process.env.EXAMPLES_GLOB || 'src/pages/examples/**/index.{astro,md,mdx}';
const OUT_DIR = process.env.OUT_DIR || 'public/examples/previews';
const THUMBS_DIR = process.env.THUMBS_DIR || 'public/examples/thumbs';
const MANIFEST_PATH = process.env.MANIFEST_PATH || 'src/data/examples.manifest.json';

const VIEWPORT = {
  width: Number(process.env.VIEWPORT_W || 1024),
  height: Number(process.env.VIEWPORT_H || 576) // 16:9
};

const READY_TIMEOUT_MS = Number(process.env.READY_TIMEOUT_MS || 60000); // 60s
const CAPTURE_SECS = Number(process.env.CAPTURE_SECS || 3);            // durata animazione
const FPS = Number(process.env.FPS || 12);                              // frame rate animazione
const QUALITY_JPG = Number(process.env.QUALITY_JPG || 82);

// ===== Utils =====
async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }

function slugFromFile(f) {
  // src/pages/examples/particles/index.astro -> particles
  const parts = f.split(path.sep);
  const idx = parts.indexOf('examples');
  return parts[idx + 1];
}

async function routesFromFiles() {
  const files = await globby(EXAMPLES_GLOB);
  return files.map(f => ({
    slug: slugFromFile(f),
    url: `${BASE_URL}/examples/${slugFromFile(f)}/`
  }));
}

async function waitReady(page) {
  // intercetto l’evento custom e i flag più comuni
  await page.addInitScript(() => {
    window.__EX_SHOT = { ready: false };
    window.addEventListener('exampleshot:ready', () => { window.__EX_SHOT.ready = true; }, { once: true });
  });

  try {
    await page.waitForFunction(() => {
      return (
        window.__EX_SHOT?.ready === true ||
        window.__EXAMPLE_READY === true ||
        document.documentElement.getAttribute('data-example-ready') === 'true' ||
        !!document.querySelector('[data-example-ready], canvas[data-ready="true"], canvas')
      );
    }, { timeout: READY_TIMEOUT_MS });
  } catch (_) {
    // timeout: va bene, useremo il fallback (dopo 60s scattiamo comunque)
  }

  // piccola stabilizzazione
  await page.waitForTimeout(300);
}

async function recordFrames(page, framesDir, totalFrames) {
  await ensureDir(framesDir);
  for (let i = 0; i < totalFrames; i++) {
    const buf = await page.screenshot({ type: 'png' });
    const p = path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`);
    await fs.writeFile(p, buf);
    // pacing
    const delay = 1000 / FPS;
    await page.waitForTimeout(delay);
  }
}

async function encodeWithFFmpeg(inPattern, outGif, outWebp) {
  // GIF (palette per qualità migliore)
  await execa(ffmpegPath, [
    '-y',
    '-framerate', String(FPS),
    '-i', inPattern,
    '-vf', `fps=${FPS},scale=${VIEWPORT.width}:${VIEWPORT.height}:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
    '-loop', '0',
    outGif
  ]);

  // WebP animata (di solito molto più leggera)
  await execa(ffmpegPath, [
    '-y',
    '-framerate', String(FPS),
    '-i', inPattern,
    '-vf', `fps=${FPS},scale=${VIEWPORT.width}:${VIEWPORT.height}:flags=lanczos`,
    '-loop', '0',
    '-an',
    '-c:v', 'libwebp',
    '-q:v', '65',            // più alto = più piccolo
    '-preset', 'picture',
    outWebp
  ]);
}

async function generateOne(page, route) {
  const { slug, url } = route;
  const framesDir = path.join('.tmp_frames', slug);
  const posterJpg = path.join(THUMBS_DIR, `${slug}.jpg`);
  const animGif = path.join(OUT_DIR, `${slug}.gif`);
  const animWebp = path.join(OUT_DIR, `${slug}.webp`);

  await ensureDir(OUT_DIR);
  await ensureDir(THUMBS_DIR);

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(()=>{});
  await waitReady(page);

  // cattura animazione
  const totalFrames = Math.max(1, Math.floor(CAPTURE_SECS * FPS));
  await recordFrames(page, framesDir, totalFrames);

  // poster = primo frame -> jpg
  const first = path.join(framesDir, 'frame_0000.png');
  const buf = await fs.readFile(first);
  await sharp(buf).resize(VIEWPORT.width, VIEWPORT.height, { fit: 'cover' })
    .jpeg({ mozjpeg: true, quality: QUALITY_JPG })
    .toFile(posterJpg);

  // encoding animazioni
  const inPattern = path.join(framesDir, 'frame_%04d.png');
  await encodeWithFFmpeg(inPattern, animGif, animWebp);

  // cleanup frames temporanei
  await fs.rm(framesDir, { recursive: true, force: true });

  return {
    slug,
    title: slug.replace(/[-_]/g, ' '),
    url: url.replace(BASE_URL, ''), // path relativo
    posterJpg: `/${posterJpg.replace(/^public\//, '')}`,
    animGif: `/${animGif.replace(/^public\//, '')}`,
    animWebp: `/${animWebp.replace(/^public\//, '')}`
  };
}

async function main() {
  const routes = await routesFromFiles();

  const browser = await chromium.launch({
    headless: true,
    // flags utili in CI con WebGL
    args: ['--use-gl=swiftshader', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: VIEWPORT });

  const manifest = [];
  for (const r of routes) {
    console.log('→', r.url);
    try {
      const entry = await generateOne(page, r);
      manifest.push(entry);
      console.log('  ✓', r.slug);
    } catch (e) {
      console.error('  ✗', r.slug, e?.message || e);
    }
  }

  await browser.close();

  await ensureDir(path.dirname(MANIFEST_PATH));
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ Manifest aggiornato: ${MANIFEST_PATH} (${manifest.length} elementi)`);
}

main().catch(err => { console.error(err); process.exit(1); });
