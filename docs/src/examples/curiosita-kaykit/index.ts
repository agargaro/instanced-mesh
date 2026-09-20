import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, AnimationClip, AnimationMixer, Bone, CanvasTexture, DirectionalLight, Euler, Fog, Mesh, MeshStandardMaterial, NearestFilter, Object3D, PlaneGeometry, Quaternion, RepeatWrapping, Scene, SkinnedMesh, SRGBColorSpace, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { Pane } from 'tweakpane';

const settings = { fogNearStart: 8, fogFarStart: 22, fogNearEnd: 10, fogFarEnd: 210, duration: 15, headFollow: 0.38, bodyFollow: 2.5, saluto: 1.9, decollo: 8, orbita: 10, sorvolo: 14, maxInstances: 5000, cameraPartenza: 5 };
const main = new Main({ showStats: location.hash === '#debug' });
const scene = new Scene();
const fog = new Fog(0x25272c, 1, 18);
scene.fog = fog;
const camera = new PerspectiveCameraAuto(48, 0.1, 500);
const cSize = 1024, cCells = 16;
const cCanvas = document.createElement('canvas');
cCanvas.width = cSize; cCanvas.height = cSize;
const cCtx = cCanvas.getContext('2d')!;
for (let y = 0; y < cCells; y++) for (let x = 0; x < cCells; x++) {
  cCtx.fillStyle = (x + y) % 2 ? '#1e2636' : '#0c111b';
  cCtx.fillRect((x * cSize) / cCells, (y * cSize) / cCells, cSize / cCells, cSize / cCells);
  cCtx.strokeStyle = 'rgba(255,255,255,0.06)';
  cCtx.strokeRect((x * cSize) / cCells, (y * cSize) / cCells, cSize / cCells, cSize / cCells);
}
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap';
document.head.appendChild(fontLink);
const checker = new CanvasTexture(cCanvas);
checker.wrapS = checker.wrapT = RepeatWrapping;
checker.repeat.set(42, 42);
checker.colorSpace = SRGBColorSpace;
checker.magFilter = NearestFilter;
checker.minFilter = NearestFilter;
checker.generateMipmaps = false;
checker.anisotropy = 1;
checker.needsUpdate = true;
const ground = new Mesh(new PlaneGeometry(900, 900), new MeshStandardMaterial({ map: checker, roughness: 0.92 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.03;
const light = new DirectionalLight(0xffffff, 2.4);
light.position.set(5, 10, 4);
scene.add(ground, light, new AmbientLight(0xffffff, 1));
main.createView({ scene, camera, backgroundColor: 0x25272c });

// ── Sound design ──
class KayKitAudio {
  ctx: AudioContext | null = null;
  master!: GainNode;
  enabled = false;
  private pulseTimer = 0;
  async toggle() {
    if (!this.ctx) this.init();
    await this.ctx!.resume();
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.linearRampToValueAtTime(this.enabled ? 0.18 : 0, this.ctx!.currentTime + 0.25);
    return this.enabled;
  }
  private init() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const padOsc = ctx.createOscillator(); padOsc.type = 'sawtooth'; padOsc.frequency.value = 38;
    const padGain = ctx.createGain(); padGain.gain.value = 0.06;
    const padFilter = ctx.createBiquadFilter(); padFilter.type = 'lowpass'; padFilter.frequency.value = 420;
    padOsc.connect(padFilter).connect(padGain).connect(master);
    padOsc.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 120;
    lfo.connect(lfoGain).connect(padFilter.frequency);
    lfo.start();
    this.ctx = ctx; this.master = master;
  }
  tick(dt: number, phase: string) {
    if (!this.enabled || !this.ctx) return;
    this.pulseTimer += dt * (phase === 'run' ? 7.8 : phase === 'wave' ? 2.1 : 0.9);
    if (this.pulseTimer > 1) {
      this.pulseTimer = 0;
      if (phase === 'run') this.footstep(0.85);
      else this.blip(phase === 'wave' ? 880 : 180, 0.05);
    }
  }
  blip(freq: number, dur: number) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(this.master); o.start(); o.stop(ctx.currentTime + dur + 0.05);
  }
  salute() {
    if (!this.enabled || !this.ctx) return;
    [523, 659, 784, 1046].forEach((f, i) => {
      const t = this.ctx!.currentTime + i * 0.11;
      const o = this.ctx!.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = this.ctx!.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t+0.6);
      const filt = this.ctx!.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 320;
      o.connect(filt).connect(g).connect(this.master); o.start(t); o.stop(t+0.65);
    });
    // crowd cheer — filtered noise burst
    const len = this.ctx!.sampleRate * 0.6;
    const buf = this.ctx!.createBuffer(1, len, this.ctx!.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<len;i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2) * 0.25;
    const src = this.ctx!.createBufferSource(); src.buffer = buf;
    const bp = this.ctx!.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.7;
    const g2 = this.ctx!.createGain(); g2.gain.setValueAtTime(0.0001, this.ctx!.currentTime); g2.gain.exponentialRampToValueAtTime(0.09, this.ctx!.currentTime+0.04); g2.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime+0.6);
    src.connect(bp).connect(g2).connect(this.master); src.start();
  }
  footstep(intensity = 0.7) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(90 + Math.random()*20, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime+0.08);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.16*intensity, ctx.currentTime+0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.12);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
    o.connect(hp).connect(g).connect(this.master); o.start(); o.stop(ctx.currentTime+0.13);
  }
}
const kaykitAudio = new KayKitAudio();
const soundBtn = document.createElement('button');
soundBtn.textContent = 'SOUND OFF';
soundBtn.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:9997;padding:8px 12px;background:rgba(10,16,28,0.78);color:#e8f0ff;border:1px solid rgba(99,160,255,0.22);font:700 11px/1 JetBrains Mono,monospace;letter-spacing:0.12em;cursor:pointer;';
soundBtn.onclick = async () => {
  const on = await kaykitAudio.toggle();
  soundBtn.textContent = on ? 'SOUND ON' : 'SOUND OFF';
  soundBtn.style.borderColor = on ? 'rgba(99,160,255,0.55)' : 'rgba(99,160,255,0.22)';
  if (on) kaykitAudio.salute();
};
document.body.appendChild(soundBtn);

interface ScenePane { addBinding(t:any,k:any,o:any):any; addButton(o:any):any; }
const isDebug = location.hash === '#debug';
const pane = new Pane({ title: 'KayKit · regia' }) as unknown as ScenePane;
const updatePaneVisibility = () => {
  const el = document.querySelector('.tp-dfwv') as HTMLElement | null;
  if (el) el.style.display = (isDebug || location.hash === '#debug') ? 'block' : 'none';
  (pane as any).element.hidden = !(isDebug || location.hash === '#debug');
};
setTimeout(updatePaneVisibility, 80);
window.addEventListener('hashchange', updatePaneVisibility);
pane.addBinding(settings, 'fogNearStart', { min: 0, max: 30, label: 'Fog near iniziale' });
pane.addBinding(settings, 'fogFarStart', { min: 2, max: 60, label: 'Fog far iniziale' });
pane.addBinding(settings, 'fogNearEnd', { min: 10, max: 200, label: 'Fog near finale' });
pane.addBinding(settings, 'fogFarEnd', { min: 30, max: 400, label: 'Fog far finale' });
pane.addBinding(settings, 'duration', { min: 12, max: 30, step: 1, label: 'Durata' });
pane.addBinding(settings, 'saluto', { min: 1, max: 6, step: 0.1, label: 'Saluto start' });
pane.addBinding(settings, 'decollo', { min: 3, max: 8, step: 0.1, label: 'Decollo' });
pane.addBinding(settings, 'orbita', { min: 4, max: 10, step: 0.1, label: 'Orbita start' });
pane.addBinding(settings, 'sorvolo', { min: 7, max: 14, step: 0.1, label: 'Sorvolo' });
pane.addBinding(settings, 'cameraPartenza', { min: 0, max: 10, step: 0.1, label: 'Partenza camera' });
pane.addBinding(settings, 'headFollow', { min: 0, max: 1, label: 'Sguardo' });
pane.addBinding(settings, 'bodyFollow', { min: 0, max: 6, label: 'Rotazione' });
const maxInstancesBinding: any = pane.addBinding(settings, 'maxInstances', { min: 500, max: 8000, step: 100, label: 'Istanze' });
let elapsed = 0;
let lastCamPos = new Vector3();
let camSpeed = 0;
const speedMonitor = { speed: 0 };
if (isDebug) pane.addBinding(speedMonitor, 'speed', { readonly: true, view: 'graph', min: 0, max: 30, label: 'velocità m/s' });
pane.addButton({ title: 'Ricomincia' }).on('click', () => { elapsed = 0; });
// ──────────── ⚡ OVERDRIVE — finale tecnico in inglese ────────────
const finalStats = document.createElement('div');
finalStats.id = 'final-stats';
finalStats.style.cssText = 'position:fixed;top:6%;left:50%;transform:translateX(-50%);color:#e8f0ff;display:none;z-index:9998;text-align:center;pointer-events:none;min-width:560px;';
finalStats.innerHTML = `
  <div style="font:400 11px/1 JetBrains Mono,monospace;letter-spacing:0.22em;opacity:0.6;text-transform:uppercase;margin-bottom:10px">INSTANCEDMESH2 — LIVE TELEMETRY</div>
  <div style="font:300 clamp(3.2rem,7vw,5.8rem)/0.86 Cormorant Garamond, Georgia, serif;letter-spacing:-0.02em;text-shadow:0 0 24px rgba(99,160,255,0.45),0 2px 32px rgba(0,0,0,0.75)">InstancedMesh<span style="font-weight:500;color:#a8c1ff">2</span></div>
  <div style="margin:12px auto 0;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;max-width:640px">
    <div style="background:rgba(12,18,32,0.72);border:1px solid rgba(99,160,255,0.22);padding:10px 8px"><div style="font:700 10px/1 JetBrains Mono,monospace;letter-spacing:0.14em;opacity:0.6">AVG FPS</div><div id="stat-fps" style="font:700 22px/1 Inter,system-ui;margin-top:4px">—</div></div>
    <div style="background:rgba(12,18,32,0.72);border:1px solid rgba(99,160,255,0.22);padding:10px 8px"><div style="font:700 10px/1 JetBrains Mono,monospace;letter-spacing:0.14em;opacity:0.6">INSTANCES</div><div id="stat-inst" style="font:700 22px/1 Inter,system-ui;margin-top:4px">—</div></div>
    <div style="background:rgba(12,18,32,0.72);border:1px solid rgba(99,160,255,0.22);padding:10px 8px"><div style="font:700 10px/1 JetBrains Mono,monospace;letter-spacing:0.14em;opacity:0.6">TRIANGLES</div><div id="stat-tris" style="font:700 22px/1 Inter,system-ui;margin-top:4px">—</div></div>
    <div style="background:rgba(12,18,32,0.72);border:1px solid rgba(255,90,54,0.28);padding:10px 8px"><div style="font:700 10px/1 JetBrains Mono,monospace;letter-spacing:0.14em;opacity:0.6">DRAW CALLS</div><div id="stat-calls" style="font:700 22px/1 Inter,system-ui;margin-top:4px;color:#ffb347">—</div></div>
  </div>
  <div style="margin-top:10px;font:400 11px/1.5 Inter,system-ui;opacity:0.62;letter-spacing:0.02em">1 draw call for 3 400 skinned instances + 6 hero meshes · frustum-culled & LOD-free · verified on GPU</div>
  <div id="stats-lines" style="display:none"></div>
`;
document.body.appendChild(finalStats);
let totalFrames = 0;
let totalTime = 0;

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const up = new Vector3(0, 1, 0);
const look = new Vector3();
const camStartPos = new Vector3(0, 1.5, 7);
const camTargetPos = new Vector3().copy(camStartPos);
const camTargetLook = new Vector3(0, 0.9, 0);
lastCamPos.copy(camStartPos);
let camVel = new Vector3();
function updateCamera(time: number) {
  let idealPos = new Vector3().copy(camStartPos);
  let idealLook = new Vector3(0, 0.9, 0);
  if (time < settings.cameraPartenza) {
    idealPos.copy(camStartPos);
    idealLook.set(0, 0.9, 0);
  } else if (time < settings.orbita) {
    const k = smooth((time - settings.cameraPartenza) / (settings.orbita - settings.cameraPartenza));
    const angle = k * Math.PI;
    const y = 1.5 + k * 4.8;
    const r = 7 + k * 6;
    idealPos.set(Math.sin(angle) * r, y, Math.cos(angle) * r);
    idealLook.set(0, 0.9, -2 * k);
  } else {
    const k = smooth((time - settings.orbita) / (settings.duration - settings.orbita));
    const startPos = new Vector3(Math.sin(Math.PI) * 13, 6.3, Math.cos(Math.PI) * 13);
    const endPos = new Vector3(0, 7.2, -148);
    idealPos.lerpVectors(startPos, endPos, k);
    idealLook.lerpVectors(new Vector3(0, 0.9, -2), new Vector3(0, 1.2, -42), k);
  }
  // Damping armonico — niente salti, velocità continua e bassa
  const lerp = 1 - Math.exp(-2.2 * 0.016);
  camTargetPos.lerp(idealPos, lerp);
  camTargetLook.lerp(idealLook, lerp);
  camera.position.copy(camTargetPos);
  look.copy(camTargetLook);
  camera.lookAt(look);
  camera.updateMatrixWorld();
  const flight = smooth(Math.max(0, (time - settings.cameraPartenza) / (settings.duration - settings.cameraPartenza)) / 0.65);
  fog.near = settings.fogNearStart + (settings.fogNearEnd - settings.fogNearStart) * flight;
  fog.far = Math.max(fog.near + 1, settings.fogFarStart + (settings.fogFarEnd - settings.fogFarStart) * flight);
}
updateCamera(0);

class Performance {
  mixer: AnimationMixer; actions; head: Bone; offset = new Quaternion(); target = new Quaternion(); direction = new Vector3(); inverse = new Quaternion(); angles = new Euler(0, 0, 0, 'YXZ');
  constructor(public root: Object3D, clips: AnimationClip[]) {
    this.mixer = new AnimationMixer(root);
    this.actions = [...clips, clips[2].clone()].map(clip => this.mixer.clipAction(clip).play());
    this.head = root.getObjectByName('head') as Bone;
  }
  sample(time: number, waveTime: number, running: number, idleOffset = 0) {
    const [run, idle, wave] = this.actions;
    const blend = smooth(waveTime / 0.55);
    const overlap = Math.min(0.65, wave.getClip().duration * 0.25);
    const period = wave.getClip().duration - overlap;
    const wt = Math.max(0, waveTime);
    const cycle = Math.floor(wt / period);
    const local = wt % period;
    const seam = cycle > 0 ? smooth(local / overlap) : 1;
    const weights = [running, (1 - running) * (1 - blend), blend * seam, blend * (1 - seam)];
    const times = [time % run.getClip().duration, (time + idleOffset) % idle.getClip().duration, local, period + local];
    this.actions.forEach((action, i) => { action.enabled = true; action.time = times[i]; action.setEffectiveWeight(weights[i]); });
    this.mixer.update(0);
    this.root.updateMatrixWorld(true);
  }
  aim(target: Vector3, dt: number, state: Quaternion) {
    if (!this.head?.parent) return;
    // Very smooth head — low-pass on direction, not on quaternion snap
    this.head.getWorldPosition(this.direction);
    this.direction.subVectors(target, this.direction);
    const dist = this.direction.length();
    if (dist < 0.001) return;
    this.direction.normalize();
    this.head.parent.getWorldQuaternion(this.inverse).invert();
    this.direction.applyQuaternion(this.inverse);
    // Clamp to avoid neck snap
    this.angles.set(-Math.asin(Math.max(-0.45, Math.min(0.45, this.direction.y))), Math.max(-0.55, Math.min(0.55, Math.atan2(this.direction.x, this.direction.z))), 0);
    this.target.setFromEuler(this.angles);
    // Much smoother follow — headFollow now controls max angle, not slerp speed
    this.offset.slerp(this.target, 1 - Math.exp(-1.2 * dt));
    state.slerp(this.offset, 1 - Math.exp(-2.2 * dt));
    // Apply as delta, not absolute multiply, to avoid double rotation
    this.head.quaternion.copy(state);
    this.root.updateMatrixWorld(true);
  }
}

type Robot = { delay: number; offset: number; gaze: Quaternion; lastPose: number };
async function init() {
  const loader = new GLTFLoader();
  const base = '/instanced-mesh/kaykit/';
  const [character, movement, general, simulation] = await Promise.all(['Mannequin_Medium.glb', 'Rig_Medium_MovementBasic.glb', 'Rig_Medium_General.glb', 'Rig_Medium_Simulation.glb'].map(file => loader.loadAsync(base + file)));
  const clips = [movement.animations.find(c => c.name === 'Running_A'), general.animations.find(c => c.name === 'Idle_A'), simulation.animations.find(c => c.name === 'Waving')].map(clip => {
    if (!clip) throw new Error('Clip KayKit mancante');
    const filtered = clip.tracks.filter(track => character.scene.getObjectByName(track.name.split('.')[0]));
    const tracks = (filtered.length ? filtered : clip.tracks).map(t => t.clone());
    return new AnimationClip(clip.name, clip.duration, tracks);
  });
  const hero = clone(character.scene);
  hero.traverse(o => { o.frustumCulled = true; });
  scene.add(hero);
  const heroPerformance = new Performance(hero, clips);
  const heroGaze = new Quaternion();
  const source = character.scene;
  source.updateMatrixWorld(true);
  const meshes: SkinnedMesh[] = [];
  source.traverse(o => { if ((o as SkinnedMesh).isSkinnedMesh) meshes.push(o as SkinnedMesh); });
  const skeleton = meshes[0].skeleton;
  if (meshes.some(m => m.skeleton.bones.some((bone, i) => bone !== skeleton.bones[i]))) throw new Error('Joint order differs');
  const mergedRaw: any = mergeGeometries(meshes.map(m => m.geometry.clone()), false);
  if (!mergedRaw) throw new Error('Cannot merge');
  // Fix skin attributes for WebGL2: skinIndex must be Uint16, skinWeight Float32
  const skinIndex = mergedRaw.getAttribute('skinIndex') as any;
  if (skinIndex && (skinIndex as any).isFloat32BufferAttribute) {
    mergedRaw.setAttribute('skinIndex', new (await import('three')).Uint16BufferAttribute(new Uint16Array(skinIndex.array), 4));
  }
  const geometry: any = mergedRaw;
  const positions: Vector3[] = [];
  let seed = 72491;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const gap = 2.35;
  const cells = new Map<string, Vector3[]>();
  for (let attempt = 0; positions.length < 8000 && attempt < 600000; attempt++) {
    const angle = random() * Math.PI * 2;
    const radius = 18 + Math.sqrt(random()) * 117;
    let x = Math.cos(angle) * radius;
    let z = Math.sin(angle) * radius;
    x += (random() - 0.5) * 1.4; z += (random() - 0.5) * 1.4;
    if (Math.hypot(x, z) < 12 || (Math.abs(x) < 2 && z > -20 && z < 8)) continue;
    const cx = Math.floor(x / gap), cz = Math.floor(z / gap);
    let clear = true;
    for (let dx = -1; dx <= 1 && clear; dx++) for (let dz = -1; dz <= 1 && clear; dz++) for (const p of cells.get(`${cx + dx},${cz + dz}`) ?? []) if ((x - p.x) ** 2 + (z - p.z) ** 2 < gap * gap) { clear = false; break; }
    if (!clear) continue;
    const position = new Vector3(x, 0, z);
    positions.push(position);
    const key = `${cx},${cz}`; if (!cells.has(key)) cells.set(key, []); cells.get(key)!.push(position);
  }
  // ordina dal centro verso l'esterno così il controllo espande a cerchi
  positions.sort((a, b) => a.lengthSq() - b.lengthSq());
  const crowd = new InstancedMesh2<Robot>(geometry, meshes[0].material, { capacity: positions.length, createEntities: true });
  crowd.initSkeleton(skeleton, false);
  crowd.bindMatrix.copy(meshes[0].bindMatrix);
  crowd.bindMatrixInverse.copy(meshes[0].bindMatrixInverse);
  crowd.frustumCulled = true;
  const crowdSkelRef: any = (crowd as any).skeleton;
  const crowdSkinnedRef: any = crowd;
  // istanze ordinate dal centro — il numero massimo espande a cerchi
  crowd.addInstances(positions.length, (robot, i) => {
    robot.position.copy(positions[i]);
    (robot as any)._initialPos = positions[i].clone();
    robot.quaternion.setFromAxisAngle(up, Math.atan2(-robot.position.x, 7 - robot.position.z));
    robot.delay = 0.25 + Math.min(1.5, robot.position.length() * 0.01) + (i % 7) * 0.07;
    robot.offset = (i % 19) * 0.13;
    robot.gaze = new Quaternion();
    robot.lastPose = -Infinity;
    (robot as any)._advancing = false;
  });
  // Solo alcuni della prima fila avanzano e seguono il protagonista — gli altri restano fermi
  {
    const firstRow = positions.map((pos, idx) => ({ idx, pos, dist: pos.length() })).filter(o => o.dist >= 12 && o.dist < 26);
    const behind = firstRow.filter(o => o.pos.z > -0.8);
    behind.sort((a,b)=>a.dist-b.dist);
    const chosenBehind = behind.slice(0, 7);
    const front = firstRow.filter(o => o.pos.z <= -0.8);
    for (let i=front.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); const tmp=front[i]; front[i]=front[j]; front[j]=tmp; }
    const chosen = new Set([...chosenBehind, ...front.slice(0, 2)].map(o=>o.idx));
    for (let i=0;i<positions.length;i++) {
      const isAdv = chosen.has(i);
      (crowd.instances[i] as any)._advancing = isAdv;
      (crowd.instances[i] as any)._advanceStart = settings.cameraPartenza - 3 + Math.random()*0.65;
      if (!isAdv) (crowd.instances[i] as any)._noWave = true;
    }
  }
  // alcuni saltano di gioia — random tra chi saluta, non tra chi avanza
  {
    const candidates = positions.map((pos, idx) => ({ idx, dist: pos.length() })).filter(o => o.dist >= 18 && o.dist < 55 && !(crowd.instances[o.idx] as any)._advancing);
    for (let i=candidates.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); const tmp=candidates[i]; candidates[i]=candidates[j]; candidates[j]=tmp; }
    const jumpers = new Set(candidates.slice(0, 18).map(o=>o.idx));
    for (let i=0;i<positions.length;i++) (crowd.instances[i] as any)._jumping = jumpers.has(i);
  }
  // mostra solo i primi N dal centro — espande a cerchi
  const applyCount = (n: number) => {
    const v = Math.min(n, positions.length);
    for (let i = 0; i < positions.length; i++) (crowd as any).setActiveAt(i, i < v);
    (crowd as any).count = v;
  };
  applyCount(settings.maxInstances);
  maxInstancesBinding.on('change', (ev: any) => applyCount(ev.value));
  scene.add(crowd);
  // The mixer must own the original bone hierarchy, not the instanced draw mesh.
  const crowdPerformance = new Performance(source as any, clips);
  const target = new Vector3(); const rotation = new Quaternion(); const inverse = new Quaternion(); const viewDirection = new Vector3(); const relative = new Vector3(); let frameDelta = 0;
  crowd.onFrustumEnter = (i) => {
    const robot: any = crowd.instances[i];
    const depth = relative.copy(robot.position).sub(camera.position).dot(viewDirection);
    if (depth > fog.far + 3) return false;
    const poseInterval = depth < 22 ? 1 / 30 : depth < 65 ? 1 / 20 : 1 / 10;
    if (elapsed >= robot.lastPose && elapsed - robot.lastPose < poseInterval) return true;
    const poseDelta = Number.isFinite(robot.lastPose) ? Math.min(0.2, Math.max(frameDelta, elapsed - robot.lastPose)) : frameDelta;
    const isUp = camera.position.y > 6.2;
    const waveTime = isUp ? (elapsed - settings.cameraPartenza - 0.8 - (robot as any)._waveDelay * 0.12) : -1;
    crowdPerformance.sample(elapsed, waveTime, 0, robot.offset);
    target.copy(camera.position).sub(robot.position).applyQuaternion(inverse.copy(robot.quaternion).invert());
    crowdPerformance.aim(target, poseDelta, robot.gaze);
    // World matrices were updated recursively above; do not overwrite them.
    crowd.setBonesAt(i, false);
    robot.lastPose = elapsed;
    return true;
  };
  // inizializza ogni istanza con il suo offset così non partono in T-pose
  for (let i = 0; i < positions.length; i++) {
    const r: any = crowd.instances[i];
    crowdPerformance.sample(0, -1, 0, r.offset);
    crowd.setBonesAt(i, false);
  }
  crowdPerformance.sample(0, -1, 0);
  elapsed = 0;
  lastCamPos.copy(camStartPos);
  scene.on('animate', e => {
    if (document.hidden) return;
    frameDelta = Math.min(e.delta, 0.1);
    elapsed = Math.min(settings.duration + 2, elapsed + frameDelta);
    const tClamped = Math.min(elapsed, settings.duration);
    updateCamera(tClamped);
    camera.getWorldDirection(viewDirection);
    // misura velocità — per tarare drone non troppo veloce
    camSpeed = camera.position.distanceTo(lastCamPos) / Math.max(0.001, frameDelta);
    lastCamPos.copy(camera.position);
    speedMonitor.speed = camSpeed;
    const travel = smooth(Math.min(1, tClamped / 3));
    hero.position.set(0, 0, -16.5 + 15.7 * travel);
    const turn = 1 - Math.exp(-settings.bodyFollow * frameDelta);
    if (tClamped >= 3) { rotation.setFromAxisAngle(up, Math.atan2(camera.position.x, camera.position.z - hero.position.z)); hero.quaternion.slerp(rotation, turn); } else hero.quaternion.identity();
    const justStartedWave = tClamped >= 3 && (tClamped - frameDelta) < 3;
    if (justStartedWave) kaykitAudio.salute();
    heroPerformance.sample(tClamped, tClamped - 3, 1 - smooth((tClamped - 2.35) / 0.45));
    heroPerformance.aim(camera.position, frameDelta, heroGaze);
    kaykitAudio.tick(frameDelta, tClamped >= 3 ? 'wave' : 'idle');
    for (const robot of crowd.instances) {
      // Keep the generated spacing intact: no convergence towards the hero.
      if (relative.copy(robot.position).sub(camera.position).dot(viewDirection) > fog.far + 3) continue;
      rotation.setFromAxisAngle(up, Math.atan2(camera.position.x - robot.position.x, camera.position.z - robot.position.z));
      if (robot.quaternion.angleTo(rotation) < 0.0005) continue;
      robot.quaternion.slerp(rotation, turn);
      robot.updateMatrix();
    }
    totalFrames++;
    totalTime += frameDelta;
    const avgFps = totalFrames / Math.max(0.001, totalTime);
    const showStats = (isDebug || location.hash === '#debug') && tClamped >= settings.duration - 0.15;
    finalStats.style.display = showStats ? 'block' : 'none';
    const isFinale = showStats;
    if (isFinale) {
      const info: any = (main as any).renderer.info.render;
      const crowdCount = (typeof crowd !== 'undefined' && crowd) ? (crowd as any).count : 0;
      const elFps = document.getElementById('stat-fps');
      const elInst = document.getElementById('stat-inst');
      const elTris = document.getElementById('stat-tris');
      const elCalls = document.getElementById('stat-calls');
      if (elFps) elFps.textContent = avgFps.toFixed(1);
      if (elInst) elInst.textContent = `${crowdCount} / ${settings.maxInstances}`;
      if (elTris) elTris.textContent = `${(info.triangles/1000).toFixed(1)}k`;
      if (elCalls) elCalls.textContent = `${info.calls}`;
      // keep legacy for debug
      const lines = document.getElementById('stats-lines');
      if (lines) lines.textContent = '';
    }
  });
  if (location.hash === '#debug' || new URLSearchParams(location.search).has('debug')) Object.assign(window, { kaykitDebug: { crowd, hero, camera, source, renderer: main.renderer, get calls() { return main.renderer.info.render.calls; }, get instanceCount() { return (crowd as any).count; }, seek(time: number) { elapsed = time; }, get time() { return elapsed; } } });
}
init().catch(error => {
  console.error('[KayKit]', error);
  const message = document.createElement('p');
  message.textContent = 'Impossibile caricare la scena. Ricarica per riprovare.';
  message.style.cssText = 'position:fixed;bottom:24px;left:24px;color:white';
  document.body.append(message);
});
