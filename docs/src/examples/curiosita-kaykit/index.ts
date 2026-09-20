import { AnimationClip, Quaternion, SkinnedMesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { settings } from './config.js';
import { camera, fog, main, scene } from './world.js';
import { kaykitAudio, createSoundButton } from './audio.js';
import { isDebug, maxInstancesBinding, pane, speedMonitor, timeMonitor, updateStatsOverlay } from './ui.js';
import { pulse } from './math.js';
import { createRegia } from './regia.js';
import { Performance, type Pose, type Robot } from './animation.js';

createSoundButton(kaykitAudio);

const up = new Vector3(0, 1, 0);
const heroSpot = new Vector3(0, 0, 0);
const heroWalkFrom = new Vector3(0, 0, -12);
const robotBSpot = new Vector3(3.5, 0, -7);
const groupSpot = new Vector3(-8, 0, -22);
const actorSpots = [new Vector3(-8, 0, -22), new Vector3(-9.8, 0, -20.2), new Vector3(-6.4, 0, -23.6)];
const fieldHalfWidth = 140;
const fieldStart = -20;
const fieldDepth = 160;
let elapsed = 0;
let cueIndex = 0;
let paused = false;
let lastCamPos = new Vector3(0, 1.5, 20);
let camSpeed = 0;
let totalFrames = 0;
let totalTime = 0;
let fireCues: (t: number) => void = () => {};
let restart: () => void = () => {};

pane.addButton({ title: 'Restart' }).on('click', () => restart());

function beatName(t: number) {
  const s = settings;
  if (t < s.walkEnd) return '01 silence / walk-in';
  if (t < s.reactionAt) return '02 first hop';
  if (t < s.contagionAt) return '03 reaction';
  if (t < s.pullBackAt) return '04 contagion';
  if (t < s.revealAt) return '05 crowd awakens';
  if (t < s.arcAt) return '06 first wave';
  if (t < s.cutAt) return '07 choreography';
  if (t < s.escalationAt) return '08 individuals';
  if (t < s.holdAt) return '09 escalation';
  if (t < s.payoffAt) return '10 grand reveal';
  if (t < s.finaleAt) return '11 payoff';
  return '12 finale';
}

async function init() {
  const loader = new GLTFLoader();
  const base = '/instanced-mesh/kaykit/';
  const [character, movement, general, simulation] = await Promise.all(
    ['Mannequin_Medium.glb', 'Rig_Medium_MovementBasic.glb', 'Rig_Medium_General.glb', 'Rig_Medium_Simulation.glb'].map((file) =>
      loader.loadAsync(base + file)
    )
  );
  const pick = (gltf: typeof general, name: string) => {
    const clip = gltf.animations.find((c) => c.name === name);
    if (!clip) throw new Error(`Missing KayKit clip: ${name}`);
    return clip;
  };
  const clips = [
    { name: 'idle', clip: pick(general, 'Idle_A') },
    { name: 'idleB', clip: pick(general, 'Idle_B') },
    { name: 'run', clip: pick(movement, 'Running_A') },
    { name: 'jump', clip: pick(movement, 'Jump_Full_Short') },
    { name: 'wave', clip: pick(simulation, 'Waving') },
    { name: 'cheer', clip: pick(simulation, 'Cheering') },
    { name: 'hit', clip: pick(general, 'Hit_A') }
  ].map(({ name, clip }) => {
    const filtered = clip.tracks.filter((track) => character.scene.getObjectByName(track.name.split('.')[0]));
    const tracks = (filtered.length ? filtered : clip.tracks).map((t) => t.clone());
    return { name, clip: new AnimationClip(name, clip.duration, tracks) };
  });
  const dur: Record<string, number> = {};
  for (const { name, clip } of clips) dur[name] = clip.duration;
  const waveDur = dur.wave * 2;

  const hero = clone(character.scene);
  hero.traverse((o) => {
    o.frustumCulled = true;
  });
  hero.position.copy(heroWalkFrom);
  scene.add(hero);
  const heroPerformance = new Performance(hero, clips);
  const heroGaze = new Quaternion();

  const source = character.scene;
  source.updateMatrixWorld(true);
  const meshes: SkinnedMesh[] = [];
  source.traverse((o) => {
    if ((o as SkinnedMesh).isSkinnedMesh) meshes.push(o as SkinnedMesh);
  });
  const skeleton = meshes[0].skeleton;
  if (meshes.some((m) => m.skeleton.bones.some((bone, i) => bone !== skeleton.bones[i]))) throw new Error('Joint order differs');
  const mergedRaw: any = mergeGeometries(
    meshes.map((m) => m.geometry.clone()),
    false
  );
  if (!mergedRaw) throw new Error('Cannot merge');
  // Fix skin attributes for WebGL2: skinIndex must be Uint16, skinWeight Float32
  const skinIndex = mergedRaw.getAttribute('skinIndex') as any;
  if (skinIndex && (skinIndex as any).isFloat32BufferAttribute) {
    mergedRaw.setAttribute('skinIndex', new (await import('three')).Uint16BufferAttribute(new Uint16Array(skinIndex.array), 4));
  }
  const geometry: any = mergedRaw;
  // The crowd is a deep field behind the hero: the camera in front of him
  // discovers it row by row, and the fog keeps the far edge out of sight.
  const positions: Vector3[] = [];
  let seed = 72491;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const gap = 2.35;
  const cells = new Map<string, Vector3[]>();
  for (let attempt = 0; positions.length < 8000 && attempt < 900000; attempt++) {
    const x = (random() * 2 - 1) * fieldHalfWidth + (random() - 0.5) * 2.6;
    const z = fieldStart - random() * fieldDepth + (random() - 0.5) * 2.6;
    // small clearing where scene 08 plays out
    if (Math.hypot(x - groupSpot.x, z - groupSpot.z) < 8) continue;
    const cx = Math.floor(x / gap),
      cz = Math.floor(z / gap);
    let clear = true;
    for (let dx = -1; dx <= 1 && clear; dx++)
      for (let dz = -1; dz <= 1 && clear; dz++)
        for (const p of cells.get(`${cx + dx},${cz + dz}`) ?? [])
          if ((x - p.x) ** 2 + (z - p.z) ** 2 < gap * gap) {
            clear = false;
            break;
          }
    if (!clear) continue;
    const position = new Vector3(x, 0, z);
    positions.push(position);
    const key = `${cx},${cz}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(position);
  }
  // innermost robots first: the instance slider expands outwards from the hero
  positions.sort((a, b) => a.lengthSq() - b.lengthSq());
  // B — one robot walks out of the field and stands near the hero
  let bIndex = 0;
  let bBest = Infinity;
  positions.forEach((p, i) => {
    const d = p.distanceToSquared(robotBSpot);
    if (d < bBest) {
      bBest = d;
      bIndex = i;
    }
  });
  const robotBPos = robotBSpot.clone();
  const bWalkFrom = new Vector3(3.5, 0, -24);
  positions[bIndex].copy(bWalkFrom);
  // a third walker on the left, so the opening has two or three little robots
  let wIndex = 0;
  let wBest = Infinity;
  positions.forEach((p, i) => {
    if (i === bIndex) return;
    const d = p.distanceToSquared(new Vector3(-5, 0, -11));
    if (d < wBest) {
      wBest = d;
      wIndex = i;
    }
  });
  const walkerSpot = new Vector3(-5, 0, -11);
  const walkerFrom = new Vector3(-4, 0, -26);
  positions[wIndex].copy(walkerFrom);
  // the three individuals of scene 08 step into their small clearing
  const groupOrder = positions
    .map((p, i) => ({ i, d: p.distanceToSquared(groupSpot) }))
    .filter(({ i }) => i !== bIndex && i !== wIndex)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
  groupOrder.forEach(({ i }, k) => positions[i].copy(actorSpots[k]));
  const groupPositions = groupOrder.map(({ i }) => positions[i].clone());
  const groupCenter = new Vector3();
  for (const p of groupPositions) groupCenter.add(p);
  groupCenter.multiplyScalar(1 / groupPositions.length);

  const crowd = new InstancedMesh2<Robot>(geometry, meshes[0].material, { capacity: positions.length, createEntities: true });
  crowd.initSkeleton(skeleton, false);
  crowd.bindMatrix.copy(meshes[0].bindMatrix);
  crowd.bindMatrixInverse.copy(meshes[0].bindMatrixInverse);
  crowd.frustumCulled = true;
  crowd.addInstances(positions.length, (robot, i) => {
    robot.position.copy(positions[i]);
    robot.quaternion.setFromAxisAngle(up, random() < 0.22 ? random() * Math.PI * 2 : Math.atan2(-robot.position.x, -robot.position.z));
    robot.offset = (i % 19) * 0.13;
    robot.idleSpeed = 0.88 + random() * 0.28;
    robot.idleClip = random() < 0.5 ? 0 : 1;
    robot.energy = 0.35 + random() * 0.65;
    const r = random();
    robot.reaction = r < 0.3 ? 0 : r < 0.5 ? 1 : r < 0.65 ? 2 : r < 0.8 ? 3 : 4;
    robot.tracksCamera = random() < 0.6;
    robot.yawOffset = (random() - 0.5) * 0.8;
    robot.gazeOffset = (random() - 0.5) * 0.9;
    robot.gaze = new Quaternion();
    robot.lastPose = -Infinity;
    robot.distB = 0;
    robot.distC = robot.position.length();
    robot.distG = 0;
    robot.isB = false;
    robot.role = 0;
    robot.walk = null;
  });
  const robotB = crowd.instances[bIndex];
  robotB.isB = true;
  robotB.energy = 0.95;
  robotB.reaction = 0;
  robotB.walk = { from: bWalkFrom.clone(), to: robotBSpot.clone(), t0: 0.5, t1: 3.4 };
  const walker = crowd.instances[wIndex];
  walker.energy = 0.7;
  walker.walk = { from: walkerFrom.clone(), to: walkerSpot.clone(), t0: 0.9, t1: 3.5 };
  for (const robot of crowd.instances) robot.distB = robot.position.distanceTo(robotBPos);
  groupOrder.forEach(({ i }, k) => {
    crowd.instances[i].role = (k + 1) as Robot['role'];
  });
  for (const robot of crowd.instances) robot.distG = robot.position.distanceTo(groupCenter);
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
  const regia = createRegia({ robotB: robotBPos, group: groupCenter });
  const target = new Vector3();
  const rotation = new Quaternion();
  const inverse = new Quaternion();
  const viewDirection = new Vector3();
  const relative = new Vector3();
  const gaze = new Vector3();
  const bLook = new Vector3(robotBSpot.x, 1.1, robotBSpot.z);
  const bodyBFace = new Vector3();
  const crowdLook = new Vector3(0, 1.2, -25);
  let frameDelta = 0;

  // ── crowd behaviour ───────────────────────────────────────────────
  // reaction variants: 0 full jump · 1 knee bounce · 2 noticed only · 3 small hop · 4 arms up
  const reactionPose = (robot: Robot, local: number, waveWindow: number): Pose | null => {
    const speed = 0.85 + robot.energy * 0.35;
    const jt = local * speed;
    if (robot.reaction === 0) return jt < dur.jump ? { idle: 0, jump: pulse(jt, dur.jump, 0.08, 0.12), jumpTime: jt } : null;
    if (robot.reaction === 1) return jt < 0.55 ? { idle: 0, jump: pulse(jt, 0.55, 0.08, 0.15), jumpTime: jt } : null;
    if (robot.reaction === 2) return null;
    if (robot.reaction === 3) {
      const short = dur.jump * 0.72;
      return jt < short ? { idle: 0, jump: pulse(jt, short, 0.06, 0.1), jumpTime: jt } : null;
    }
    return local < waveWindow ? { idle: 0, wave: pulse(local, waveWindow, 0.3, 0.5), waveTime: local + robot.offset } : null;
  };

  const robotPose = (robot: Robot, t: number): Pose => {
    const s = settings;
    const idle = (): Pose => ({ idle: 1, idleClip: robot.idleClip, idleTime: t * robot.idleSpeed + robot.offset });
    if (robot.walk && t > robot.walk.t0 && t < robot.walk.t1) return { idle: 0, run: 1, runTime: t - robot.walk.t0 };
    // scene 08 — C jumps too high and lands badly, D leans in, E flinches
    if (robot.role && t >= s.cutAt && t < s.escalationAt) {
      const local = t - s.cutAt;
      if (robot.role === 1) {
        const jt = local - 0.2;
        if (jt > 0 && jt < dur.jump) {
          const w = pulse(jt, dur.jump, 0.08, 0.12);
          if (w > 0) return { idle: 0, jump: w, jumpTime: jt };
        }
        const ht = local - 1.5;
        if (ht > 0 && ht < dur.hit) {
          const w = pulse(ht, dur.hit, 0.05, 0.12);
          if (w > 0) return { idle: 0, hit: w, hitTime: ht };
        }
        return idle();
      }
      if (robot.role === 2) {
        const jt = local - 1.2;
        if (jt > 0 && jt < 0.5) {
          const w = pulse(jt, 0.5, 0.1, 0.15);
          if (w > 0) return { idle: 0, jump: w, jumpTime: jt };
        }
        return idle();
      }
      const ht = local - 1.4;
      if (ht > 0 && ht < dur.hit) {
        const w = pulse(ht, dur.hit, 0.05, 0.12);
        if (w > 0) return { idle: 0, hit: w, hitTime: ht };
      }
      return idle();
    }
    // scene 12 — the whole field answers the hero, ripple from him
    const ct = t - (s.responseAt + robot.distC * s.cheerSpeed);
    if (ct > 0 && ct < dur.cheer) {
      const w = pulse(ct, dur.cheer, 0.12, 0.3);
      if (w > 0) return { idle: 0, cheer: w, cheerTime: ct };
    }
    // scene 09 — Robot C's clumsy landing ripples through the mass
    const w2 = t - (s.escalationAt + robot.distG * s.waveSpeed);
    if (w2 > 0 && w2 < waveDur) {
      const p = reactionPose(robot, w2, waveDur);
      if (p) return p;
    }
    // scene 06 — the first big wave, born next to the hero
    const w1 = t - (s.revealAt + robot.distC * s.waveSpeed);
    if (w1 > 0 && w1 < waveDur) {
      const p = reactionPose(robot, w1, waveDur);
      if (p) return p;
    }
    // scene 04 — the hop contagion, from Robot B
    const jt = t - (robot.isB ? s.reactionAt + 0.6 : s.contagionAt + robot.distB * s.hopSpeed);
    if (jt > 0 && jt < waveDur) {
      const p = reactionPose(robot, jt, dur.wave);
      if (p) return p;
    }
    return idle();
  };

  const gazePoint = (robot: Robot, t: number, out: Vector3): boolean => {
    const s = settings;
    // B looks at the hero while it imitates him
    if (robot.isB && t > s.reactionAt - 0.3 && t < s.reactionAt + 2.6) {
      out.set(0, 1.15, 0);
      return true;
    }
    // during a reaction, look where the wave came from
    const w1 = t - (s.revealAt + robot.distC * s.waveSpeed);
    if (w1 > 0 && w1 < 1.4) {
      out.set(0, 1.2, 0);
      return true;
    }
    const w2 = t - (s.escalationAt + robot.distG * s.waveSpeed);
    if (w2 > 0 && w2 < 1.4) {
      out.copy(groupPositions[0]).setY(1.2);
      return true;
    }
    const jt = t - (robot.isB ? s.reactionAt + 0.6 : s.contagionAt + robot.distB * s.hopSpeed);
    if (jt > 0 && jt < 1.4) {
      out.copy(robotBPos).setY(1.2);
      return true;
    }
    // scene 08 — D and E watch C
    if (robot.role > 1 && t >= s.cutAt && t < s.escalationAt) {
      out.copy(groupPositions[0]).setY(1.2);
      return true;
    }
    out.copy(camera.position);
    return false;
  };

  crowd.onFrustumEnter = (i) => {
    const robot = crowd.instances[i];
    const depth = relative.copy(robot.position).sub(camera.position).dot(viewDirection);
    if (depth > fog.far + 3) return false;
    const poseInterval = depth < 22 ? 1 / 30 : depth < 65 ? 1 / 20 : 1 / 10;
    if (elapsed >= robot.lastPose && elapsed - robot.lastPose < poseInterval) return true;
    const poseDelta = Number.isFinite(robot.lastPose) ? Math.min(0.2, Math.max(frameDelta, elapsed - robot.lastPose)) : frameDelta;
    crowdPerformance.sample(robotPose(robot, elapsed));
    const focused = gazePoint(robot, elapsed, gaze);
    target.copy(gaze).sub(robot.position).applyQuaternion(inverse.copy(robot.quaternion).invert());
    if (!focused) target.applyAxisAngle(up, robot.gazeOffset);
    crowdPerformance.aim(target, poseDelta, robot.gaze);
    crowd.setBonesAt(i, false);
    robot.lastPose = elapsed;
    return true;
  };
  // first pose for every instance, so nobody starts in T-pose
  for (let i = 0; i < positions.length; i++) {
    const r = crowd.instances[i];
    crowdPerformance.sample(robotPose(r, 0));
    crowd.setBonesAt(i, false);
  }

  const cues: [number, () => void][] = [
    [settings.walkStart + 0.2, () => kaykitAudio.tap(0.25)],
    [settings.walkStart + 0.7, () => kaykitAudio.tap(0.25)],
    [settings.walkStart + 1.2, () => kaykitAudio.tap(0.25)],
    [settings.walkStart + 1.7, () => kaykitAudio.tap(0.25)],
    [settings.firstHopAt + 0.05, () => kaykitAudio.boop()],
    [settings.firstHopAt + 0.8, () => kaykitAudio.tap(1)],
    [settings.reactionAt + 0.6, () => kaykitAudio.tap(0.6)],
    [settings.contagionAt + 0.15, () => kaykitAudio.tap(0.5)],
    [settings.contagionAt + 0.55, () => kaykitAudio.tap(0.45)],
    [settings.contagionAt + 0.95, () => kaykitAudio.tap(0.4)],
    [settings.contagionAt + 1.3, () => kaykitAudio.tap(0.35)],
    [settings.pullBackAt, () => kaykitAudio.whoosh(2)],
    [
      settings.revealAt,
      () => {
        kaykitAudio.whoosh(1.6);
        kaykitAudio.cheer(0.6);
      }
    ],
    [settings.arcAt, () => kaykitAudio.whoosh(1.2)],
    [settings.cutAt + 0.35, () => kaykitAudio.tap(0.9)],
    [settings.cutAt + 1.5, () => kaykitAudio.tap(0.7)],
    [settings.cutAt + 1.6, () => kaykitAudio.blip(196, 0.12, 0.1)],
    [
      settings.escalationAt,
      () => {
        kaykitAudio.riser(3);
        kaykitAudio.whoosh(3);
      }
    ],
    [settings.holdAt, () => kaykitAudio.boom()],
    [settings.payoffAt + 0.1, () => kaykitAudio.click()],
    [settings.finalHopAt + 0.05, () => kaykitAudio.boop()],
    [settings.finalHopAt + 0.8, () => kaykitAudio.tap(1)],
    [settings.responseAt, () => kaykitAudio.cheer(1.3)]
  ];
  fireCues = (t) => {
    while (cueIndex < cues.length && cues[cueIndex][0] <= t) cues[cueIndex++][1]();
  };
  restart = () => {
    elapsed = 0;
    cueIndex = 0;
  };

  elapsed = 0;
  lastCamPos.copy(camera.position);
  regia.update(0);
  scene.on('animate', (e) => {
    if (document.hidden) return;
    frameDelta = Math.min(e.delta, 0.1);
    if (!paused) elapsed = Math.min(settings.duration + 1.5, elapsed + frameDelta);
    const t = elapsed;
    fireCues(t);
    regia.update(t);
    camera.getWorldDirection(viewDirection);
    camSpeed = camera.position.distanceTo(lastCamPos) / Math.max(0.001, frameDelta);
    lastCamPos.copy(camera.position);
    speedMonitor.speed = camSpeed;
    timeMonitor.time = t;
    timeMonitor.beat = beatName(t);
    // hero — walks in, looks at B when B answers, glances at the crowd before the final hop
    const walkU = (t - settings.walkStart) / (settings.walkEnd - settings.walkStart);
    if (walkU >= 1) hero.position.copy(heroSpot);
    else if (walkU > 0) hero.position.lerpVectors(heroWalkFrom, heroSpot, walkU);
    const focusB = t > settings.reactionAt + 0.05 && t < settings.reactionAt + 2.3;
    const bodyB = t > settings.reactionAt + 0.3 && t < settings.reactionAt + 2.5;
    const glance = t > settings.finaleAt + 0.05 && t < settings.finaleAt + 0.55;
    const headFace = glance ? crowdLook : focusB ? bLook : camera.position;
    bodyBFace.lerpVectors(camera.position, bLook, 0.5);
    const bodyFace = glance ? crowdLook : bodyB ? bodyBFace : camera.position;
    const turn = 1 - Math.exp(-(glance || bodyB ? 4 : settings.bodyFollow) * frameDelta);
    rotation.setFromAxisAngle(up, Math.atan2(bodyFace.x - hero.position.x, bodyFace.z - hero.position.z));
    hero.quaternion.slerp(rotation, turn);
    const jumpAt = t >= settings.finalHopAt ? settings.finalHopAt : settings.firstHopAt;
    const jt = t - jumpAt;
    let heroPose: Pose;
    if (walkU > 0 && walkU < 1) heroPose = { idle: 0, run: 1, runTime: t - settings.walkStart };
    else if (jt > 0 && jt < dur.jump) heroPose = { idle: 0, jump: pulse(jt, dur.jump, 0.08, 0.12), jumpTime: jt };
    else heroPose = { idle: 1, idleClip: 0, idleTime: t * 0.95 + 0.37 };
    heroPerformance.sample(heroPose);
    heroPerformance.aim(headFace, frameDelta, heroGaze, focusB || glance ? 2.5 : 1);
    // walkers move through the world while the camera watches
    for (const robot of crowd.instances) {
      if (robot.walk && t > robot.walk.t0 && t < robot.walk.t1) {
        const u = (t - robot.walk.t0) / (robot.walk.t1 - robot.walk.t0);
        robot.position.lerpVectors(robot.walk.from, robot.walk.to, u);
        robot.updateMatrix();
      }
      if (!robot.tracksCamera) continue;
      if (relative.copy(robot.position).sub(camera.position).dot(viewDirection) > fog.far + 3) continue;
      rotation.setFromAxisAngle(up, Math.atan2(camera.position.x - robot.position.x, camera.position.z - robot.position.z) + robot.yawOffset);
      if (robot.quaternion.angleTo(rotation) < 0.0005) continue;
      robot.quaternion.slerp(rotation, turn);
      robot.updateMatrix();
    }
    totalFrames++;
    totalTime += frameDelta;
    const avgFps = totalFrames / Math.max(0.001, totalTime);
    const info: any = (main as any).renderer.info.render;
    updateStatsOverlay(avgFps, (crowd as any).count as number, info, t);
  });
  if (isDebug || new URLSearchParams(location.search).has('debug'))
    Object.assign(window, {
      kaykitDebug: {
        crowd,
        hero,
        camera,
        source,
        regia,
        scene,
        fog,
        renderer: main.renderer,
        get calls() {
          return main.renderer.info.render.calls;
        },
        get instanceCount() {
          return (crowd as any).count;
        },
        setInstances(n: number) {
          settings.maxInstances = n;
          applyCount(n);
          (maxInstancesBinding as any).refresh?.();
        },
        setPaused(v: boolean) {
          paused = v;
        },
        seek(time: number) {
          elapsed = time;
          cueIndex = cues.findIndex(([at]) => at > time);
          if (cueIndex < 0) cueIndex = cues.length;
        },
        get time() {
          return elapsed;
        }
      }
    });
}

init().catch((error) => {
  console.error('[KayKit]', error);
  const message = document.createElement('p');
  message.textContent = 'Could not load the scene. Reload to try again.';
  message.style.cssText = 'position:fixed;bottom:24px;left:24px;color:white';
  document.body.append(message);
});
