import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, AnimationClip, AnimationMixer, Bone, CanvasTexture, DirectionalLight, Euler, Fog, Mesh, MeshStandardMaterial, NearestFilter, Object3D, PlaneGeometry, Quaternion, RepeatWrapping, Scene, SkinnedMesh, SRGBColorSpace, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { Pane } from 'tweakpane';

const settings = { fogNearStart: 1, fogFarStart: 18, fogNearEnd: 5, fogFarEnd: 200, duration: 18, headFollow: 0.65, bodyFollow: 2.5, saluto: 1.9, decollo: 8, orbita: 10, sorvolo: 14 };
const main = new Main({ showStats: true });
const scene = new Scene();
const fog = new Fog(0x050608, 1, 18);
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
main.createView({ scene, camera, backgroundColor: 0x050608 });

interface ScenePane { addBinding(t:any,k:any,o:any):any; addButton(o:any):any; }
const pane = new Pane({ title: 'KayKit · regia' }) as unknown as ScenePane;
pane.addBinding(settings, 'fogNearStart', { min: 0, max: 30, label: 'Fog near iniziale' });
pane.addBinding(settings, 'fogFarStart', { min: 2, max: 60, label: 'Fog far iniziale' });
pane.addBinding(settings, 'fogNearEnd', { min: 10, max: 200, label: 'Fog near finale' });
pane.addBinding(settings, 'fogFarEnd', { min: 30, max: 400, label: 'Fog far finale' });
pane.addBinding(settings, 'duration', { min: 12, max: 30, step: 1, label: 'Durata' });
pane.addBinding(settings, 'saluto', { min: 1, max: 6, step: 0.1, label: 'Saluto start' });
pane.addBinding(settings, 'decollo', { min: 3, max: 8, step: 0.1, label: 'Decollo' });
pane.addBinding(settings, 'orbita', { min: 4, max: 10, step: 0.1, label: 'Orbita start' });
pane.addBinding(settings, 'sorvolo', { min: 7, max: 14, step: 0.1, label: 'Sorvolo' });
pane.addBinding(settings, 'headFollow', { min: 0, max: 1, label: 'Sguardo' });
pane.addBinding(settings, 'bodyFollow', { min: 0, max: 6, label: 'Rotazione' });
let elapsed = 0;
let lastCamPos = new Vector3();
let camSpeed = 0;
const speedMonitor = { speed: 0 };
pane.addBinding(speedMonitor, 'speed', { readonly: true, view: 'graph', min: 0, max: 30, label: 'velocità m/s' });
pane.addButton({ title: 'Ricomincia' }).on('click', () => { elapsed = 0; });

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const up = new Vector3(0, 1, 0);
const look = new Vector3();
const camStartPos = new Vector3(0, 1.5, 7);
const camTargetPos = new Vector3().copy(camStartPos);
const camTargetLook = new Vector3(0, 0.9, 0);
lastCamPos.copy(camStartPos);
let camVel = new Vector3();
function updateCamera(time: number) {
  // Semplificato come richiesto: fissa → dolly lento alle spalle → sorvolo, niente orbita
  let idealPos = new Vector3().copy(camStartPos);
  let idealLook = new Vector3(0, 0.9, 0);
  if (time < settings.saluto) {
    idealPos.copy(camStartPos);
    idealLook.set(0, 0.9, 0);
  } else if (time < settings.orbita) {
    const k = smooth((time - settings.saluto) / (settings.orbita - settings.saluto));
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
  const flight = smooth(Math.max(0, (time - settings.saluto) / (settings.duration - settings.saluto)) / 0.65);
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
    this.head.getWorldPosition(this.direction);
    this.direction.subVectors(target, this.direction);
    this.head.parent.getWorldQuaternion(this.inverse).invert();
    this.direction.applyQuaternion(this.inverse).normalize();
    this.angles.set(-Math.asin(Math.max(-0.8, Math.min(0.8, this.direction.y))), Math.max(-0.9, Math.min(0.9, Math.atan2(this.direction.x, this.direction.z))), 0);
    this.target.setFromEuler(this.angles);
    this.offset.identity().slerp(this.target, settings.headFollow);
    state.slerp(this.offset, 1 - Math.exp(-3 * dt));
    this.head.quaternion.multiply(state);
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
    return new AnimationClip(clip.name, clip.duration, clip.tracks.filter(track => character.scene.getObjectByName(track.name.split('.')[0])).map(track => track.clone()));
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
  const geometry = mergeGeometries(meshes.map(m => m.geometry.clone()), false);
  if (!geometry) throw new Error('Cannot merge');
  const positions: Vector3[] = [];
  let seed = 72491;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const gap = 2.35;
  const cells = new Map<string, Vector3[]>();
  for (let attempt = 0; positions.length < 3400 && attempt < 300000; attempt++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 125;
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
  const crowd = new InstancedMesh2<Robot>(geometry, meshes[0].material, { capacity: positions.length, createEntities: true });
  crowd.initSkeleton(skeleton, false);
  crowd.bindMatrix.copy(meshes[0].bindMatrix);
  crowd.bindMatrixInverse.copy(meshes[0].bindMatrixInverse);
  crowd.frustumCulled = true;
  crowd.addInstances(positions.length, (robot, i) => {
    robot.position.copy(positions[i]);
    robot.quaternion.setFromAxisAngle(up, Math.atan2(-robot.position.x, 7 - robot.position.z));
    robot.delay = 0.25 + Math.min(1.5, robot.position.length() * 0.01) + (i % 7) * 0.07;
    robot.offset = (i % 19) * 0.13;
    robot.gaze = new Quaternion();
    robot.lastPose = -Infinity;
  });
  scene.add(crowd);
  const crowdPerformance = new Performance(source, clips);
  const target = new Vector3(); const rotation = new Quaternion(); const inverse = new Quaternion(); const viewDirection = new Vector3(); const relative = new Vector3(); let frameDelta = 0;
  crowd.onFrustumEnter = (i) => {
    const robot = crowd.instances[i];
    const depth = relative.copy(robot.position).sub(camera.position).dot(viewDirection);
    if (depth > fog.far + 3) return false;
    const poseInterval = depth < 22 ? 1 / 30 : depth < 65 ? 1 / 20 : 1 / 10;
    if (elapsed >= robot.lastPose && elapsed - robot.lastPose < poseInterval) return true;
    const poseDelta = Number.isFinite(robot.lastPose) ? Math.min(0.2, Math.max(frameDelta, elapsed - robot.lastPose)) : frameDelta;
    crowdPerformance.sample(elapsed, elapsed - 3 - robot.delay, 0, robot.offset);
    target.copy(camera.position).sub(robot.position).applyQuaternion(inverse.copy(robot.quaternion).invert());
    crowdPerformance.aim(target, poseDelta, robot.gaze);
    crowd.setBonesAt(i, false);
    robot.lastPose = elapsed;
    return true;
  };
  crowdPerformance.sample(0, -1, 0);
  for (let i = 0; i < positions.length; i++) crowd.setBonesAt(i, false);
    elapsed = 0;
  lastCamPos.copy(camStartPos);
  scene.on('animate', e => {
    if (document.hidden) return;
    frameDelta = Math.min(e.delta, 0.1);
    elapsed += frameDelta;
    if (elapsed > settings.duration + 2) elapsed = 0;
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
    heroPerformance.sample(tClamped, tClamped - 3, 1 - smooth((tClamped - 2.35) / 0.45));
    heroPerformance.aim(camera.position, frameDelta, heroGaze);
    for (const robot of crowd.instances) {
      if (relative.copy(robot.position).sub(camera.position).dot(viewDirection) > fog.far + 3) continue;
      rotation.setFromAxisAngle(up, Math.atan2(camera.position.x - robot.position.x, camera.position.z - robot.position.z));
      if (robot.quaternion.angleTo(rotation) < 0.0005) continue;
      robot.quaternion.slerp(rotation, turn);
      robot.updateMatrix();
    }
  });
  if (new URLSearchParams(location.search).has('debug')) Object.assign(window, { kaykitDebug: { crowd, hero, camera, source, renderer: main.renderer, get calls() { return main.renderer.info.render.calls; }, get instanceCount() { return (crowd as any).count; }, seek(time: number) { elapsed = time; }, get time() { return elapsed; } } });
}
init().catch(error => {
  console.error('[KayKit]', error);
  const message = document.createElement('p');
  message.textContent = 'Impossibile caricare la scena. Ricarica per riprovare.';
  message.style.cssText = 'position:fixed;bottom:24px;left:24px;color:white';
  document.body.append(message);
});
