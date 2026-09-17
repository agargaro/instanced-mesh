import { loadPending, Main, PerspectiveCameraAuto } from "@three.ez/main";
import { ACESFilmicToneMapping, Color, DirectionalLight, HemisphereLight, REVISION, Scene, Vector3 } from "three";
import { AsteroidField } from "./asteroids";
import { BeaconHalos, FeatureBeacons, OrbitRings, PlanetMoons } from "./beacons";
import { EXAMPLE_COUNT, ExampleGates } from "./examples";
import { LIBRARY_FEATURES } from "./features";
import { initHudCanvas, syncHudCanvas } from "./hudcanvas";
import { OrbitalIndicators, type OrbitalTarget } from "./orbital";
import { bootProgress } from "./shader";
import { Smoke } from "./smoke";
import { SpaceShip } from "./spaceship";
import { Starfield } from "./starfield";

const EZ_MAIN_VERSION = "0.5.12";

await loadPending();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/* Renderer: the splash canvas is an opaque deep-space viewport.       */
/* ------------------------------------------------------------------ */

const canvas = document.getElementById("three-canvas") as HTMLCanvasElement;
const main = new Main({
  rendererParameters: { canvas },
  disableContextMenu: true,
  showStats: false,
});
main.renderer.toneMapping = ACESFilmicToneMapping;
main.renderer.toneMappingExposure = 0.5;

const deepSpace = getComputedStyle(document.documentElement).getPropertyValue("--sd-deep-space").trim();
main.renderer.setClearColor(new Color(deepSpace || 0x0b1120));

/* The canvas is decorative and the control chips are aria-hidden, so the
   experience gets a real text briefing: visually hidden, read by AT. */
const splashHelp = document.createElement("p");
splashHelp.id = "splash-help";
splashHelp.textContent =
  "Interactive 3D space scene. Press W or S to throttle the ship, A or D to yaw, " +
  "and move the pointer to steer the aim. Fly close to a glowing beacon or example " +
  "gate to unlock it.";
Object.assign(splashHelp.style, {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: "0",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: "0",
});
canvas.insertAdjacentElement("afterend", splashHelp);
canvas.parentElement?.setAttribute("aria-describedby", "splash-help");

const camera = new PerspectiveCameraAuto(50);
camera.position.set(0, 15, 46);

const scene = new Scene();

/* ------------------------------------------------------------------ */
/* World (placeholder): ship + asteroid belt + engine dust + stars.    */
/* ------------------------------------------------------------------ */

/* Deep-space lighting: a warm key, a cold rim, and a dim sky wash so
   the unlit-looking rocks and the hull read against the void. */
const keyLight = new DirectionalLight(0xdbe6ff, 2.6);
keyLight.position.set(60, 80, 40);
const rimLight = new DirectionalLight(0x3f6cff, 2.2);
rimLight.position.set(-70, -40, -60);
const skyWash = new HemisphereLight(0x9fc0ff, 0x0b1120, 1.4);

const spaceship = new SpaceShip();
const asteroids = new AsteroidField();
const smoke = new Smoke(spaceship);
const stars = new Starfield();
asteroids.motion = !reducedMotion;
scene.add(skyWash, keyLight, rimLight, stars, asteroids, smoke, spaceship);

/* ------------------------------------------------------------------ */
/* Discovery layer: one beacon per library capability, plus the        */
/* compass that points the pilot at them.                              */
/* ------------------------------------------------------------------ */

const beacons = new FeatureBeacons();
const halos = new BeaconHalos(beacons, camera, 15);
const exampleGates = new ExampleGates();
const planetRings = new OrbitRings(beacons);
const planetMoons = new PlanetMoons(beacons);
beacons.motion = !reducedMotion;
exampleGates.motion = !reducedMotion;
scene.add(beacons, halos, planetRings, planetMoons, exampleGates);

const FEATURE_COUNT = LIBRARY_FEATURES.length;
const DISCOVER_RANGE = 32;
const orbitalTargets: OrbitalTarget[] = [
  ...beacons.instances.map((inst) => ({ position: inst.position, kind: "feature" as const })),
  ...exampleGates.instances.map((inst) => ({ position: inst.position, kind: "example" as const })),
];
const orbitalDiscovered: boolean[] = new Array(orbitalTargets.length).fill(false);
const orbital = new OrbitalIndicators(orbitalTargets, camera);
scene.add(orbital);

const compassTarget = document.getElementById("compass-target");
const exampleFound = document.getElementById("st-examples");
const labelLayer = document.getElementById("hud-labels");
const exampleLayer = document.getElementById("hud-examples");

const exampleLabels = Array.from(exampleLayer?.querySelectorAll<HTMLAnchorElement>(".example-label") ?? []);
const exampleDistances = exampleLabels.map((label) => label.querySelector<HTMLElement>(".example-dist"));
const exampleImages = exampleLabels.map((label) => label.querySelector<HTMLImageElement>("img"));

const featureFound = document.getElementById("st-found");
let activeFeature = -1;

/* One anchored HTML block per beacon: name, live distance, and the doc blurb
   when you are close enough to unlock it. */
const featureLabels = LIBRARY_FEATURES.map((feature) => {
  const label = document.createElement("a");
  label.className = "beacon-label";
  label.href = feature.href;
  label.hidden = true;

  const head = document.createElement("span");
  head.className = "label-head";
  const name = document.createElement("b");
  name.textContent = feature.label;
  const distance = document.createElement("span");
  distance.className = "label-dist";
  head.append(name, distance);

  const blurb = document.createElement("p");
  blurb.className = "label-blurb";
  blurb.textContent = feature.blurb;

  const open = document.createElement("span");
  open.className = "label-open";
  open.textContent = "OPEN DOC";

  label.append(head, blurb, open);
  labelLayer?.appendChild(label);
  return { label, distance };
});

main.createView({ scene, camera, enabled: false });

/* The console lives inside the splash canvas when the browser ships the
   html-in-canvas APIs; otherwise the voices stay the fixed DOM console. */
const hudMode = initHudCanvas({ scene, camera, renderer: main.renderer });

if (import.meta.env.DEV || new URLSearchParams(location.search).has("stats")) {
  main.showStats = true;
  const statsDom = document.body.lastElementChild as HTMLElement | null;
  if (statsDom?.style.zIndex === "10000") {
    statsDom.style.top = "auto";
    statsDom.style.left = "0.5rem";
    statsDom.style.bottom = "13rem";
    statsDom.style.transform = "scale(0.85)";
    statsDom.style.transformOrigin = "bottom left";
  }
}

if (import.meta.env.DEV || new URLSearchParams(location.search).has("stats")) {
  (window as unknown as Record<string, unknown>).__introDebug = {
    scene, camera, spaceship, asteroids, beacons, exampleGates, stars, smoke, main, boot: bootProgress, reducedMotion,
    hudCanvas: { mode: hudMode },
  };
}

/* ------------------------------------------------------------------ */
/* Flight model: WASD throttle/yaw, pointer banks and aims.            */
/* ------------------------------------------------------------------ */

const keys = new Set<string>();
const pointer = { x: 0, y: 0 };

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  keys.add(e.code);
}, { capture: true });
window.addEventListener("keyup", (e) => keys.delete(e.code), { capture: true });
window.addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
}, { capture: true });
window.addEventListener("pointerleave", () => {
  pointer.x = 0;
  pointer.y = 0;
}, { capture: true });

/* Touch: drag anywhere steers (x = yaw, y = throttle); the thrust button
   holds full gas. Mouse keeps the reticle-only behaviour. */
let touchYaw = 0;
let touchThrust = 0;
let touchId: number | null = null;
const touchStart = { x: 0, y: 0 };
let buttonThrust = 0;

window.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "touch" || touchId !== null) return;
  touchId = e.pointerId;
  touchStart.x = e.clientX;
  touchStart.y = e.clientY;
}, { capture: true, passive: true });

window.addEventListener("pointermove", (e) => {
  if (e.pointerId !== touchId) return;
  const dx = (e.clientX - touchStart.x) / Math.min(window.innerWidth, 520);
  const dy = (e.clientY - touchStart.y) / 320;
  touchYaw = Math.max(-1, Math.min(1, dx * 2.2));
  touchThrust = Math.max(0, Math.min(1, -dy * 1.6));
}, { capture: true, passive: true });

const endTouch = (e: PointerEvent) => {
  if (e.pointerId !== touchId) return;
  touchId = null;
  touchYaw = 0;
  touchThrust = 0;
};
window.addEventListener("pointerup", endTouch, { capture: true, passive: true });
window.addEventListener("pointercancel", endTouch, { capture: true, passive: true });

const thrustButton = document.getElementById("hud-thrust");
thrustButton?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  buttonThrust = 1;
});
for (const ev of ["pointerup", "pointercancel", "pointerleave"]) {
  thrustButton?.addEventListener(ev, () => {
    buttonThrust = 0;
  });
}

const forward = new Vector3();
const forwardYaw = new Vector3();
const desiredCamera = new Vector3();
const lookTarget = new Vector3();
const centerPull = new Vector3();
const cameraSide = new Vector3();
const UP = new Vector3(0, 1, 0);

let speed = 6;
let bank = 0;
let orbit = 0;
let stoppedFor = 0;
let shakeBurst = 0;
let lastThrust = 0;
let elapsed = 0;
let fps = 0;
let lastFlush = performance.now();
let lastDom = -1;
let renderedFrames = 0;
let fpsWindow = performance.now();

/* Frame pacing: the splash draws at most 60 times a second. An accumulator
   keeps that cadence stable on high-refresh panels (120Hz renders every
   other frame, 75Hz settles near 60 instead of dropping to 37.5) and tells
   the gated world updates how much time passed since the last drawn frame. */
let lastTick = performance.now();
let frameAcc = 0;
let frameDue = false;
let frameDelta = 0;

/* Last values written to the HUD, so unchanged frames skip the DOM write. */
let lastReticleOpacity = "";
let lastReticleTransform = "";
let lastCompassText = "";
let hudAimX = Number.NaN;
let hudAimY = Number.NaN;

const IDLE_SPEED = 0;
const MAX_SPEED = 26;
const ACCEL = 16;
const YAW_RATE = 1.7;
const FIELD_LIMIT = 460;
const CAM_DIST = 12.5;
const CAM_HEIGHT = 3.1;
let portrait = false;
function measureViewport(): void {
  portrait = window.innerHeight > window.innerWidth * 1.15;
}
measureViewport();
window.addEventListener("resize", measureViewport, { passive: true });
const LOOK_AHEAD = 14;
const FRAME_MS = 1000 / 60;

scene.on("beforeanimate", () => {
  const now = performance.now();
  frameAcc += now - lastTick;
  lastTick = now;
  frameDue = frameAcc >= FRAME_MS;
  if (frameDue) {
    frameDelta = frameAcc / 1000;
    frameAcc %= FRAME_MS;
    renderedFrames++;
  }
  scene.needsRender = frameDue;
});

/* The world's per-instance updates (asteroids, beacons, examples, rings,
   moons, halos, smoke) each listen to their own "animate" event. Defer those
   to drawn frames and hand them the accumulated delta, so a 120Hz rAF does
   not run the instance work twice for a single visible frame. */
const gatedEvent = { delta: 0, total: 0 };
type AnimateTarget = {
  __eventsDispatcher?: { dispatch: (type: string, event: { delta: number; total: number }) => void };
};

function gateWorldUpdates(target: object): void {
  const dispatcher = (target as AnimateTarget).__eventsDispatcher;
  if (!dispatcher) return;
  const dispatch = dispatcher.dispatch.bind(dispatcher);
  dispatcher.dispatch = (type, event) => {
    if (type !== "animate") return dispatch(type, event);
    if (!frameDue) return;
    gatedEvent.delta = frameDelta;
    gatedEvent.total = event.total;
    dispatch(type, gatedEvent);
  };
}

gateWorldUpdates(asteroids);
gateWorldUpdates(smoke);
gateWorldUpdates(beacons);
gateWorldUpdates(halos);
gateWorldUpdates(exampleGates);
gateWorldUpdates(planetRings);
gateWorldUpdates(planetMoons);

scene.on("animate", (e) => {
  const dt = Math.min(e.delta, 0.05);
  elapsed += dt;

  const keyThrust = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
  const keyYaw = (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) - (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0);
  const thrustIn = keyThrust !== 0 ? keyThrust : buttonThrust > 0 || touchThrust > 0.15 ? 1 : 0;
  if (thrustIn > 0 && lastThrust <= 0) shakeBurst = 1;
  if (thrustIn > 0) {
    collapseHero();
    heroManual = false;
  }
  lastThrust = thrustIn;
  shakeBurst = Math.max(0, shakeBurst - dt / 0.5);
  const yawIn = keyYaw !== 0 ? keyYaw : -touchYaw;

  if (thrustIn > 0) speed += ACCEL * dt;
  else if (thrustIn < 0) speed -= ACCEL * dt;
  else speed += (IDLE_SPEED - speed) * Math.min(1, dt * 1.5);
  speed = Math.max(0, Math.min(MAX_SPEED, speed));

  spaceship.rotation.y += yawIn * YAW_RATE * dt;

  /* Simple handling: yaw banks the hull, the pointer only aims the reticle. */
  const bankTarget = yawIn * 0.3;
  bank += (bankTarget - bank) * Math.min(1, dt * 3);
  spaceship.rotation.z = bank;
  spaceship.rotation.x = reducedMotion || speed < 0.6 ? 0 : Math.sin(elapsed * 0.6) * 0.02;

  /* The model's nose is its local +Z (thin spike end); the tail, wings,
     and engines live at -Z. Forward is the nose. */
  forward.set(0, 0, 1).applyQuaternion(spaceship.quaternion);
  spaceship.position.addScaledVector(forward, speed * dt);

  /* Keep the placeholder field in view: soft pull back toward the ring. */
  const dist = spaceship.position.length();
  if (dist > FIELD_LIMIT) {
    centerPull.copy(spaceship.position).multiplyScalar(-1 / dist);
    spaceship.position.addScaledVector(centerPull, (dist - FIELD_LIMIT) * dt * 2.5);
  }

  /* Chase camera: sits behind the tail (engines toward the viewer) and
     follows yaw only, so banking never rolls the horizon. Parked, it eases
     around to a side profile; the first throttle input swings it back. */
  forwardYaw.set(0, 0, 1).applyAxisAngle(UP, spaceship.rotation.y);
  stoppedFor = speed < 0.6 ? stoppedFor + dt : 0;
  const orbitTarget = !reducedMotion && stoppedFor > 0.7 ? 1 : 0;
  orbit += (orbitTarget - orbit) * Math.min(1, dt * (orbitTarget > orbit ? 0.9 : 1.8));
  if (orbit > 0.995) orbit = 1;
  if (orbit < 0.005) orbit = 0;
  /* The showcase: once the camera is parked in the high side profile the
     legend plate grows back (70ms, CSS), unless the pilot closed it by hand. */
  if (orbit === 1 && stoppedFor > 1.1 && !heroManual) expandHero();
  const orbitAngle = orbit * Math.PI * 0.46;
  /* Parked, the reticle has nothing to aim: it fades with the orbit. */
  const reticleOpacity = Math.max(0, 1 - orbit * 2.2).toFixed(2);
  if (hud.reticle && reticleOpacity !== lastReticleOpacity) {
    lastReticleOpacity = reticleOpacity;
    hud.reticle.style.opacity = reticleOpacity;
  }
  const camDist = CAM_DIST * (portrait ? 1.55 : 1);
  const camHeight = CAM_HEIGHT * (portrait ? 1.3 : 1);
  desiredCamera.copy(spaceship.position)
    .addScaledVector(forwardYaw, -camDist * Math.cos(orbitAngle))
    .addScaledVector(cameraSide.copy(UP).cross(forwardYaw).normalize(), camDist * Math.sin(orbitAngle));
  desiredCamera.y += camHeight * (1 + orbit * 0.85);
  camera.position.lerp(desiredCamera, 1 - Math.exp(-dt * 2.6));
  lookTarget.copy(spaceship.position).addScaledVector(forwardYaw, LOOK_AHEAD * (1 - orbit));
  lookTarget.y += orbit * 1.6;
  camera.lookAt(lookTarget);

  /* Launch shakes the cockpit: one burst that dies ~500ms after the throttle
     bites, then the frame is stable. */
  if (!reducedMotion) {
    const shake = shakeBurst * 0.22;
    if (shake > 0.002) {
      camera.position.x += Math.sin(elapsed * 41.0) * shake;
      camera.position.y += Math.sin(elapsed * 33.7 + 1.7) * shake * 0.7;
      camera.position.z += Math.cos(elapsed * 37.3 + 0.6) * shake;
      camera.rotation.z += Math.sin(elapsed * 29.0) * shake * 0.1;
    }
  }

  /* Stars are a fixed sky: locked to the camera, never parallaxing. */
  stars.position.copy(camera.position);

  smoke.setThrust(speed / MAX_SPEED);
  shipAudio.setThrottle(speed / MAX_SPEED);

  /* Boot: the world assembles as a phosphor schematic, then spreads out. */
  const boot = reducedMotion ? 1 : Math.min(1, elapsed / 2.4);
  const eased = 1 - Math.pow(1 - boot, 3);
  bootProgress.value = eased;
  asteroids.boot = eased;
  beacons.boot = eased;
  exampleGates.boot = eased;

  /* Founding rule: this screen renders at 60fps max. Physics keeps the rAF
     cadence; rendering and the world updates that feed it are gated by the
     accumulator in "beforeanimate" so we never burn frames the eye can't see. */
  const now = performance.now();
  if (frameDue) {
    if (elapsed - lastDom > 0.12) {
      lastDom = elapsed;
      updateAnnotations();
    }
    moveHud();
    smoothLabels();
    updateOrbital();
    updateDiscovery();
  }
  if (now - fpsWindow >= 500) {
    fps = (renderedFrames * 1000) / (now - fpsWindow);
    renderedFrames = 0;
    fpsWindow = now;
  }

  if (now - lastFlush < 100) return;
  lastFlush = now;
  if (elapsed - lastDom < 0.001) {
    flushHud();
    syncHudCanvas();
  }
});

/* ------------------------------------------------------------------ */
/* Compass: bearing tape plus one marker per library capability.        */
/* ------------------------------------------------------------------ */



/* ------------------------------------------------------------------ */
/* Anchored labels: every beacon/gate projects to screen space, but    */
/* only the nearest few inside sensor range get an HTML block, so the  */
/* HUD guides without becoming a wall of cards.                        */
/* ------------------------------------------------------------------ */

const projected = new Vector3();
const SENSOR_RANGE = 200;
const PREVIEW_RANGE = 65;
const MAX_ANNOTATIONS = 4;

type Annotation = {
  el: HTMLAnchorElement;
  position: Vector3;
  distanceCell: HTMLElement | null;
  kind: "feature" | "example";
};

const annotations: Annotation[] = [
  ...featureLabels.map(({ label, distance }, i) => ({
    el: label,
    position: beacons.instances[i].position,
    distanceCell: distance,
    kind: "feature" as const,
  })),
  ...exampleLabels.map((label, i) => ({
    el: label,
    position: exampleGates.instances[i].position,
    distanceCell: exampleDistances[i] ?? null,
    kind: "example" as const,
  })),
];

const labelTargets = new Map<HTMLElement, { x: number; y: number }>();
const labelCurrent = new Map<HTMLElement, { x: number; y: number }>();
const labelTransforms = new Map<HTMLElement, string>();

/* The blocks follow their bodies smoothly: targets come from the throttled
   projection pass, the transform lerps on drawn frames. Reduced motion snaps
   instead of chasing, and unchanged transforms are not written again. */
function smoothLabels(): void {
  for (const [el, target] of labelTargets) {
    if (el.hidden) continue;
    let current = labelCurrent.get(el);
    if (!current) {
      current = { x: target.x, y: target.y };
      labelCurrent.set(el, current);
    }
    if (reducedMotion) {
      current.x = target.x;
      current.y = target.y;
    } else {
      current.x += (target.x - current.x) * 0.2;
      current.y += (target.y - current.y) * 0.2;
    }
    const transform = `translate(${current.x.toFixed(1)}px, ${current.y.toFixed(1)}px)`;
    if (labelTransforms.get(el) === transform) continue;
    labelTransforms.set(el, transform);
    el.style.transform = transform;
  }
}

const candidates: { annotation: Annotation; x: number; y: number; distance: number }[] = [];
const heroBox = { right: 0, bottom: 0 };
const hudBoxes: { x: number; y: number; w: number; h: number }[] = [];

function measureHudBoxes(): void {
  hudBoxes.length = 0;
  for (const id of ["hud-telemetry", "hud-flight", "hud-chips", "hud-sound", "compass-target"]) {
    const el = document.getElementById(id);
    if (!el || getComputedStyle(el).display === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) hudBoxes.push({ x: r.left, y: r.top, w: r.width, h: r.height });
  }
}

function overlapsHud(x: number, y: number, w: number, h: number): boolean {
  for (const box of hudBoxes) {
    if (x < box.x + box.w && x + w > box.x && y < box.y + box.h && y + h > box.y) return true;
  }
  return false;
}

function measureHero(): void {
  const rect = document.querySelector(".hero")?.getBoundingClientRect();
  heroBox.right = rect?.right ?? 0;
  heroBox.bottom = rect?.bottom ?? 0;
  measureHudBoxes();
}
measureHero();
window.addEventListener("resize", measureHero);

/* Card heights are measured at most once per visibility state ("near" cards
   grow a blurb): reading offsetHeight forces a synchronous layout, so the
   projection pass must never measure cards it already knows. */
const cardHeights = new WeakMap<HTMLElement, { near: boolean; height: number }>();
const FALLBACK_CARD_HEIGHT = { feature: 46, example: 74 };

function cardHeightFor(annotation: Annotation): number {
  const el = annotation.el;
  const near = el.classList.contains("near") || el.classList.contains("preview");
  const cached = cardHeights.get(el);
  if (cached && cached.near === near) return cached.height;
  const height = el.offsetHeight || FALLBACK_CARD_HEIGHT[annotation.kind];
  cardHeights.set(el, { near, height });
  return height;
}

function updateAnnotations(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  candidates.length = 0;

  for (const annotation of annotations) {
    if (!annotation.el.hidden) annotation.el.hidden = true;

    projected.copy(annotation.position).applyMatrix4(camera.matrixWorldInverse);
    if (projected.z > -1.5) continue;

    projected.applyMatrix4(camera.projectionMatrix);
    const x = (projected.x * 0.5 + 0.5) * width;
    const y = (-projected.y * 0.5 + 0.5) * height;
    if (x < -200 || x > width + 200 || y < -140 || y > height + 140) continue;

    const distance = spaceship.position.distanceTo(annotation.position);
    if (distance > SENSOR_RANGE) continue;

    candidates.push({ annotation, x, y, distance });
  }

  candidates.sort((a, b) => a.distance - b.distance);

  /* Preview: the nearest body inside range opens its block as a small page. */
  for (const annotation of annotations) annotation.el.classList.remove("preview");
  if (candidates[0] && candidates[0].distance < PREVIEW_RANGE) {
    candidates[0].annotation.el.classList.add("preview");
  }

  for (let i = 0; i < candidates.length && i < MAX_ANNOTATIONS; i++) {
    const { annotation, x, y, distance } = candidates[i];
    const el = annotation.el;
    const cardWidth = annotation.kind === "example" ? 274 : 254;

    if (el.hidden) el.hidden = false;
    const cardHeight = cardHeightFor(annotation);

    let clampedX = Math.min(Math.max(x + 18, 14), Math.max(width - cardWidth, 14));
    let clampedY = Math.min(Math.max(y - 22, 152), Math.max(height - cardHeight - 24, 152));
    /* Never cover the legend plate: push the block below it. */
    if (clampedX < heroBox.right + 12 && clampedY < heroBox.bottom + 12) clampedY = heroBox.bottom + 12;
    /* Never sit on the console: slide left of it, or drop below. */
    if (overlapsHud(clampedX, clampedY, cardWidth, cardHeight)) {
      const leftOfHud = Math.min(...hudBoxes.map((b) => b.x)) - cardWidth - 14;
      if (leftOfHud > 14) {
        clampedX = Math.min(clampedX, leftOfHud);
        clampedY = Math.max(clampedY, heroBox.bottom + 12);
      } else {
        continue;
      }
    }

    labelTargets.set(el, { x: clampedX, y: clampedY });
    const cell = annotation.distanceCell;
    if (cell) {
      const text = `${Math.round(distance)}u`;
      if (cell.textContent !== text) cell.textContent = text;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Discovery: proximity unlocks the doc page (or the runnable example). */
/* ------------------------------------------------------------------ */

function updateOrbital(): void {
  for (let i = 0; i < FEATURE_COUNT; i++) orbitalDiscovered[i] = beacons.discovered.has(i);
  for (let i = 0; i < EXAMPLE_COUNT; i++) orbitalDiscovered[FEATURE_COUNT + i] = exampleGates.discovered.has(i);
  orbital.update(orbitalDiscovered, elapsed);
}

function updateDiscovery(): void {
  let nearest = -1;
  let nearestDistance = Infinity;

  for (let i = 0; i < FEATURE_COUNT; i++) {
    const distance = spaceship.position.distanceTo(beacons.instances[i].position);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = i;
    }
    if (distance < DISCOVER_RANGE && !beacons.discovered.has(i)) {
      beacons.discovered.add(i);
      shipAudio.blip();
      featureLabels[i]?.label.classList.add("found");
      if (featureFound) featureFound.textContent = `${beacons.discovered.size}/${FEATURE_COUNT}`;
    }
  }

  const near = nearest >= 0 && nearestDistance < DISCOVER_RANGE ? nearest : -1;
  if (near !== activeFeature) {
    if (activeFeature >= 0) featureLabels[activeFeature]?.label.classList.remove("near");
    activeFeature = near;
    if (activeFeature >= 0) featureLabels[activeFeature]?.label.classList.add("near");
  }

  for (let i = 0; i < EXAMPLE_COUNT; i++) {
    const label = exampleLabels[i];
    if (!label) continue;
    const distance = spaceship.position.distanceTo(exampleGates.instances[i].position);
    const isNear = distance < DISCOVER_RANGE;
    if (isNear === label.classList.contains("near")) continue;

    label.classList.toggle("near", isNear);
    const image = exampleImages[i];
    if (image) {
      const target = isNear ? image.dataset.anim : image.dataset.poster;
      if (target && image.getAttribute("src") !== target) image.src = target;
    }
    if (isNear && !exampleGates.discovered.has(i)) {
      exampleGates.discovered.add(i);
      shipAudio.blip();
      label.classList.add("found");
      if (exampleFound) exampleFound.textContent = `${exampleGates.discovered.size}/${EXAMPLE_COUNT}`;
    }
  }

  if (compassTarget) {
    let text = "NO TARGET";
    if (nearest >= 0) {
      const label = LIBRARY_FEATURES[nearest].label.toUpperCase();
      const state = beacons.discovered.has(nearest) ? "✓" : "▸";
      /* Bucket the distance to 10u so the polite live region announces
         roughly once a second instead of every frame. */
      const bucket = Math.round(nearestDistance / 10) * 10;
      text = `${state} ${label} · ${bucket}u · ${beacons.discovered.size}/${FEATURE_COUNT}`;
    }
    if (text !== lastCompassText) {
      lastCompassText = text;
      compassTarget.textContent = text;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Placeholder audio: ambient drone + thrust whine, muted by default.  */
/* ------------------------------------------------------------------ */

class ShipAudio {
  private ctx?: AudioContext;
  private master?: GainNode;
  private whine?: OscillatorNode;
  private whineGain?: GainNode;
  private engineFilter?: BiquadFilterNode;
  private ambientGain?: GainNode;
  private ambientFilter?: BiquadFilterNode;
  private noise?: AudioBufferSourceNode;
  enabled = false;

  async toggle(): Promise<boolean> {
    if (!this.ctx) this.init();
    await this.ctx?.resume();
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.value = this.enabled ? 0.12 : 0;
    return this.enabled;
  }

  setThrottle(t: number): void {
    if (!this.ctx || !this.whine || !this.whineGain) return;
    const now = this.ctx.currentTime;
    this.whine.frequency.setTargetAtTime(88 + t * 210, now, 0.14);
    this.whineGain.gain.setTargetAtTime(0.022 + t * 0.055, now, 0.2);
    if (this.engineFilter) this.engineFilter.frequency.setTargetAtTime(340 + t * 460, now, 0.22);
  }

  /** Example unlocked: a warmer three-note chime. */
  chime(): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const at = now + i * 0.09;
      const osc = this.ctx!.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.1, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
      osc.connect(gain).connect(this.master!);
      osc.start(at);
      osc.stop(at + 0.65);
    });
  }

  /** Discovery ping: a short two-step chirp when a capability is unlocked. */
  blip(): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(1240, now + 0.12);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  private init(): void {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 46;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.5;
    drone.connect(droneGain).connect(master);

    const whine = ctx.createOscillator();
    whine.type = "triangle";
    whine.frequency.value = 88;
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0.015;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 340;
    whine.connect(whineGain).connect(filter).connect(master);

    /* Ambient: filtered noise bed + a slow detuned fifth, very quiet. */
    const len = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const ambientFilter = ctx.createBiquadFilter();
    ambientFilter.type = "lowpass";
    ambientFilter.frequency.value = 220;
    const ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.16;
    noise.connect(ambientFilter).connect(ambientGain).connect(master);

    const fifth = ctx.createOscillator();
    fifth.type = "sine";
    fifth.frequency.value = 69;
    const fifthGain = ctx.createGain();
    fifthGain.gain.value = 0.22;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain).connect(ambientFilter.frequency);

    drone.start();
    whine.start();
    noise.start();
    fifth.start();
    lfo.start();
    this.ctx = ctx;
    this.master = master;
    this.whine = whine;
    this.whineGain = whineGain;
    this.engineFilter = filter;
    this.ambientFilter = ambientFilter;
    this.ambientGain = ambientGain;
    this.noise = noise;
  }
}

const shipAudio = new ShipAudio();

/* The legend plate yields to the experience: it collapses only when the pilot
   actually takes the controls (canvas press or throttle), never on a bare
   keypress, and the toggle brings it back on any device. */
const heroPlate = document.querySelector<HTMLElement>(".hero");
const heroToggle = document.getElementById("hero-toggle") as HTMLButtonElement | null;
let heroCollapsed = false;
let heroManual = false;

/* The toggle's label tracks the plate: "Hide" while it is open (the default
   state) and "Show" once it is collapsed. */
function syncHeroToggle(): void {
  if (!heroToggle) return;
  heroToggle.setAttribute("aria-expanded", String(!heroCollapsed));
  heroToggle.setAttribute("aria-label", heroCollapsed ? "Show the legend plate" : "Hide the legend plate");
}

function collapseHero(): void {
  if (!heroPlate || heroCollapsed) return;
  heroCollapsed = true;
  heroPlate.classList.add("is-collapsed");
  syncHeroToggle();
  measureHero();
}
function expandHero(): void {
  if (!heroPlate || !heroCollapsed) return;
  heroCollapsed = false;
  heroPlate.classList.remove("is-collapsed");
  syncHeroToggle();
  measureHero();
}
syncHeroToggle();
heroToggle?.addEventListener("click", () => {
  heroManual = true;
  if (heroCollapsed) expandHero();
  else collapseHero();
});
heroPlate?.addEventListener("pointerdown", (e) => {
  if ((e.target as HTMLElement).closest("#hero-toggle")) return;
  if (heroCollapsed) expandHero();
});
window.addEventListener("pointerdown", (e) => {
  if ((e.target as HTMLElement).closest("#three-canvas")) collapseHero();
}, { capture: true, passive: true });

/* Keyboard path for the plate: "[" toggles it, Escape collapses it while it
   is open. Never on a bare keypress, and never while a dialog owns the key. */
window.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  const target = e.target as HTMLElement | null;
  if (target?.isContentEditable || (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
  if (e.code === "BracketLeft") {
    if (heroCollapsed) expandHero();
    else collapseHero();
    return;
  }
  if (e.code === "Escape" && !heroCollapsed) {
    if (document.querySelector("dialog[open], [aria-modal='true']")) return;
    collapseHero();
  }
}, { capture: true });

/* ------------------------------------------------------------------ */
/* HUD wiring (intro.ts owns these cells).                             */
/* ------------------------------------------------------------------ */

const $ = (id: string) => document.getElementById(id);
const hud = {
  vel: $("v-vel"),
  thr: $("v-thr"),
  alt: $("v-alt"),
  draws: $("st-draws"),
  tris: $("st-tris"),
  fps: $("st-fps"),
  inst: $("st-inst"),
  smoke: $("st-smoke"),
  version: $("st-version"),
  reticle: $("hud-reticle"),
  sound: $("hud-sound") as HTMLButtonElement | null,
};

if (hud.version) {
  const webgl = main.renderer.capabilities.isWebGL2 ? "WEBGL2" : "WEBGL1";
  hud.version.textContent = `THREE R${REVISION} · EZ MAIN ${EZ_MAIN_VERSION} · ${webgl}`;
}

hud.sound?.addEventListener("click", async () => {
  const on = await shipAudio.toggle();
  hud.sound?.setAttribute("aria-pressed", String(on));
  const label = hud.sound?.querySelector("[data-sound-label]");
  if (label) label.textContent = on ? "SOUND ON" : "SOUND OFF";
});

/* The console drifts with the aim, like the reticle: the whole display is
   one projected surface, each voice at its own depth. */
const HUD_PARALLAX: [HTMLElement | null, number, number][] = [];
for (const [el, kx, ky] of [
  [document.getElementById("hud-telemetry"), 5, 4],
  [document.getElementById("hud-flight"), 7, 5],
  [document.getElementById("hud-chips"), 4, 3],
  [document.getElementById("compass-target"), 6, 4],
  [hud.sound, 6, 4],
] as [HTMLElement | null, number, number][]) {
  if (el) HUD_PARALLAX.push([el, kx, ky]);
}

function moveHud(): void {
  /* Parallax is motion: reduced-motion users get a still HUD, and an
     unchanged aim never writes the same transform again. */
  if (reducedMotion) return;
  if (hudAimX === pointer.x && hudAimY === pointer.y) return;
  hudAimX = pointer.x;
  hudAimY = pointer.y;
  for (const [el, kx, ky] of HUD_PARALLAX) {
    el.style.transform = `translate(${(pointer.x * kx).toFixed(1)}px, ${(pointer.y * ky).toFixed(1)}px)`;
  }
}

function flushHud(): void {
  const info = main.renderer.info;
  const smokeCount = smoke.instancesCount;

  if (hud.vel) hud.vel.textContent = String(Math.round(speed * 12));
  if (hud.thr) hud.thr.textContent = `${Math.round((speed / MAX_SPEED) * 100)}%`;
  if (hud.alt) hud.alt.textContent = String(Math.round(spaceship.position.y * 10));
  if (hud.draws) hud.draws.textContent = String(info.render.calls);
  if (hud.tris) hud.tris.textContent = info.render.triangles.toLocaleString("en-US");
  if (hud.fps) hud.fps.textContent = String(Math.round(fps));
  if (hud.inst) hud.inst.textContent = (asteroids.instancesCount + smokeCount).toLocaleString("en-US");
  if (hud.smoke) hud.smoke.textContent = String(smokeCount);
  if (hud.reticle) {
    const transform = `translate(${(pointer.x * 34).toFixed(1)}px, ${(pointer.y * 22).toFixed(1)}px)`;
    if (transform !== lastReticleTransform) {
      lastReticleTransform = transform;
      hud.reticle.style.transform = transform;
    }
  }
}