import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Texture,
  WebGLRenderer,
} from "three";

export type HudCanvasMode = "native" | "dom";

/* Chromium ships the html-in-canvas APIs behind a flag; the TypeScript DOM
   lib does not know them yet, so they are declared locally. */
type DrawableCanvas = HTMLCanvasElement & {
  requestPaint?: () => void;
  onpaint?: (() => void) | null;
};

type DrawableContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, dx: number, dy: number) => void;
};

type WebGLDrawableContext = WebGL2RenderingContext & {
  texElementSubImage2D?: (
    target: number,
    level: number,
    xoffset: number,
    yoffset: number,
    element: Element,
    config?: { width: number; height: number },
  ) => void;
};

type Voice = {
  el: HTMLElement;
  curveX: number;
  curveY: number;
};

const VOICE_IDS = ["hud-telemetry", "hud-flight", "hud-chips", "hud-sound", "compass-target"] as const;

/* Cockpit curvature (DESIGN.md: perspective(1100px), rotateX ±5–7° on the
   rows, rotateY −7° on the telemetry rail). The 2D context cannot project a
   plane, so the lean is baked as the cosine of each angle. */
const CURVATURE: Record<(typeof VOICE_IDS)[number], { curveX: number; curveY: number }> = {
  "hud-telemetry": { curveX: 0, curveY: -7 },
  "hud-flight": { curveX: 5, curveY: 0 },
  "hud-chips": { curveX: 6, curveY: 0 },
  "hud-sound": { curveX: 5, curveY: 0 },
  "compass-target": { curveX: -6, curveY: 0 },
};

const MAX_DPR = 1.5;
const QUAD_DISTANCE = 10;
const QUAD_RENDER_ORDER = 999;
const FOCUS_RING_OFFSET = 3;
const FOCUS_RING_WIDTH = 2;

let hudCanvas: DrawableCanvas | null = null;
let context2d: DrawableContext | null = null;
let hudTexture: Texture | null = null;
let hudQuad: Mesh | null = null;
let hudCamera: PerspectiveCamera | null = null;
let voices: Voice[] = [];
let mode: HudCanvasMode = "dom";
let path: "2d" | "webgl" = "2d";
let pixelRatio = 1;
let quadFov = 0;
let quadAspect = 0;
let focusColor = "";
let paintRequested = false;
let webglPaint: (() => void) | null = null;
let webglAllocate: (() => void) | null = null;

function collectVoices(): Voice[] {
  const found: Voice[] = [];
  for (const id of VOICE_IDS) {
    const el = document.getElementById(id);
    if (el) found.push({ el, ...CURVATURE[id] });
  }
  return found;
}

/* Without the feature a canvas renders none of its children: put the console
   back exactly where it was and drop the empty host. */
function restoreDomConsole(canvas: HTMLCanvasElement, list: Voice[]): void {
  const parent = canvas.parentElement;
  if (parent) {
    for (const voice of list) parent.insertBefore(voice.el, canvas);
  }
  canvas.remove();
}

function resize(): void {
  if (!hudCanvas) return;
  pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const width = Math.max(1, Math.round(window.innerWidth * pixelRatio));
  const height = Math.max(1, Math.round(window.innerHeight * pixelRatio));
  if (hudCanvas.width !== width) hudCanvas.width = width;
  if (hudCanvas.height !== height) hudCanvas.height = height;
  webglAllocate?.();
}

/* The quad lives at a fixed distance in front of the camera; its size is the
   frustum slice at that depth, so the drawn texture maps 1:1 to the viewport. */
function fitQuad(): void {
  if (!hudQuad || !hudCamera) return;
  if (quadFov === hudCamera.fov && quadAspect === hudCamera.aspect) return;
  quadFov = hudCamera.fov;
  quadAspect = hudCamera.aspect;
  const height = 2 * QUAD_DISTANCE * Math.tan((hudCamera.fov * Math.PI) / 360);
  hudQuad.scale.set(height * hudCamera.aspect, height, 1);
}

function drawVoices(): void {
  if (!hudCanvas || !context2d) return;
  context2d.reset();
  context2d.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  for (const voice of voices) {
    const rect = voice.el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    context2d.save();
    if (voice.curveX !== 0 || voice.curveY !== 0) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      context2d.translate(cx, cy);
      context2d.scale(Math.cos((voice.curveY * Math.PI) / 180), Math.cos((voice.curveX * Math.PI) / 180));
      context2d.translate(-cx, -cy);
    }
    try {
      context2d.drawElementImage?.(voice.el, rect.left, rect.top);
    } catch {
      /* No snapshot recorded yet; the next paint retries. */
    }
    context2d.restore();
  }
  /* The canvas is invisible, so the browser focus ring needs a drawn twin. */
  if (focusColor && document.activeElement instanceof HTMLElement && document.activeElement.matches("#hud-sound:focus-visible")) {
    const rect = document.activeElement.getBoundingClientRect();
    context2d.save();
    context2d.strokeStyle = focusColor;
    context2d.lineWidth = FOCUS_RING_WIDTH;
    context2d.strokeRect(
      rect.left - FOCUS_RING_OFFSET,
      rect.top - FOCUS_RING_OFFSET,
      rect.width + FOCUS_RING_OFFSET * 2,
      rect.height + FOCUS_RING_OFFSET * 2,
    );
    context2d.restore();
  }
  if (hudTexture) hudTexture.needsUpdate = true;
}

/* The WebGL fast path uploads each element snapshot straight into the
   renderer's texture; it only runs on a browser that ships
   texElementSubImage2D + updateElementGeometry (none does today). */
function initWebGLPath(renderer: WebGLRenderer, list: Voice[]): boolean {
  const gl = renderer.getContext() as WebGLDrawableContext;
  const updateGeometry = (
    HTMLCanvasElement.prototype as unknown as {
      updateElementGeometry?: (element: Element, options?: { canvasTransform?: DOMMatrix }) => void;
    }
  ).updateElementGeometry;
  if (typeof gl.texElementSubImage2D !== "function" || typeof updateGeometry !== "function") return false;
  try {
    const source = new DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    source.colorSpace = SRGBColorSpace;
    source.generateMipmaps = false;
    source.minFilter = LinearFilter;
    source.magFilter = LinearFilter;
    renderer.initTexture(source);
    const glTexture = (renderer.properties.get(source) as { __webglTexture?: WebGLTexture }).__webglTexture;
    if (!glTexture) return false;
    webglAllocate = () => {
      if (!hudCanvas) return;
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, hudCanvas.width, hudCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    };
    webglPaint = () => {
      if (!hudCanvas) return;
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      for (const voice of list) {
        const rect = voice.el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;
        gl.texElementSubImage2D?.(
          gl.TEXTURE_2D,
          0,
          Math.round(rect.left * pixelRatio),
          Math.round((window.innerHeight - rect.bottom) * pixelRatio),
          voice.el,
          {
            width: Math.max(1, Math.round(rect.width * pixelRatio)),
            height: Math.max(1, Math.round(rect.height * pixelRatio)),
          },
        );
        updateGeometry.call(hudCanvas, voice.el, { canvasTransform: new DOMMatrix().translate(rect.left, rect.top) });
      }
    };
    webglAllocate();
    hudTexture = source;
    path = "webgl";
    return true;
  } catch {
    return false;
  }
}

/* Redraws ride the console's own cadence: an automatic paint event (a voice
   changed, was hidden, or left the tree) leaves the last texture in place,
   and the next sync requests a fresh one. */
function requestHudPaint(): void {
  paintRequested = true;
  hudCanvas?.requestPaint?.();
}

function handleResize(): void {
  resize();
  fitQuad();
  requestHudPaint();
}

/* Browser hit-testing of drawable descendants needs updateElementGeometry,
   which no shipped Chromium has yet: forward the sound toggle by hand. */
function forwardSoundClick(event: PointerEvent): void {
  if (event.button !== 0) return;
  const sound = voices.find((voice) => voice.el.id === "hud-sound")?.el as HTMLButtonElement | undefined;
  if (!sound) return;
  if (event.target instanceof Element && event.target.closest("#hud-sound")) return;
  const rect = sound.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
  event.stopImmediatePropagation();
  sound.click();
}

export function initHudCanvas({
  scene,
  camera: sceneCamera,
  renderer,
}: {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
}): HudCanvasMode {
  const canvas = document.getElementById("hud-drawable") as DrawableCanvas | null;
  if (!canvas) return mode;
  voices = collectVoices();

  const drawElementImage = (CanvasRenderingContext2D.prototype as unknown as { drawElementImage?: unknown }).drawElementImage;
  if (typeof drawElementImage !== "function") {
    restoreDomConsole(canvas, voices);
    return mode;
  }

  hudCanvas = canvas;
  hudCamera = sceneCamera;
  scene.add(sceneCamera);
  resize();

  if (!initWebGLPath(renderer, voices)) {
    context2d = canvas.getContext("2d") as DrawableContext | null;
    if (!context2d) {
      hudCanvas = null;
      restoreDomConsole(canvas, voices);
      return mode;
    }
    hudTexture = new CanvasTexture(canvas);
    hudTexture.colorSpace = SRGBColorSpace;
    hudTexture.generateMipmaps = false;
    hudTexture.minFilter = LinearFilter;
    hudTexture.magFilter = LinearFilter;
    path = "2d";
  }

  hudQuad = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({ map: hudTexture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }),
  );
  hudQuad.position.set(0, 0, -QUAD_DISTANCE);
  hudQuad.renderOrder = QUAD_RENDER_ORDER;
  hudQuad.frustumCulled = false;
  sceneCamera.add(hudQuad);
  fitQuad();

  focusColor = getComputedStyle(document.documentElement).getPropertyValue("--sd-hud-accent").trim() || focusColor;

  canvas.onpaint = () => {
    if (!paintRequested) return;
    paintRequested = false;
    if (path === "webgl") webglPaint?.();
    else drawVoices();
  };
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("pointerdown", forwardSoundClick, { capture: true });

  document.documentElement.dataset.hudCanvas = "native";
  mode = "native";
  requestHudPaint();
  return mode;
}

export function syncHudCanvas(): void {
  if (mode !== "native" || !hudCanvas) return;
  fitQuad();
  requestHudPaint();
}
