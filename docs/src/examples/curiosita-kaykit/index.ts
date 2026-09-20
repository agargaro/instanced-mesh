import { AnimationClip, Quaternion, SkinnedMesh, Vector2, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { settings } from './config.js';
import { camera, fog, main, scene } from './world.js';
import { kaykitAudio, createSoundButton, createStartButton } from './audio.js';
import { isDebug, maxInstancesBinding, pane, speedMonitor, timeMonitor, updateStatsOverlay } from './ui.js';
import { smooth } from './math.js';
import { createRegia } from './regia.js';
import { CrowdDirector } from './controller.js';
import { DEATH_HOLD, Performance, type Robot } from './animation.js';

createSoundButton(kaykitAudio);
createStartButton(kaykitAudio);

const up = new Vector3(0, 1, 0);
const heroSpot = new Vector3(0, 0, 0);
const heroWalkFrom = new Vector3(0, 0, -4);
const robotBSpot = new Vector3(2.1, 0, -2.2);
// Storyboard layout, two stages deep inside the crowd. The first holds the
// trio in a line — greets, trains (punches), celebrates. The second is a ring
// of six who celebrate or use the tool, with the breakdancer at its centre.
const groupSpot = new Vector3(-10, 0, -52);
const actorSpots = [
  new Vector3(-13.52, 0, -52),
  new Vector3(-10, 0, -52),
  new Vector3(-6.48, 0, -52)
];
const secondSpot = new Vector3(10, 0, -70);
// Twelve in the ring, one breakdancer in the middle.
const secondActorSpots = Array.from({ length: 12 }, (_, k) => {
  const angle = (k / 12) * Math.PI * 2;
  return new Vector3(secondSpot.x + Math.cos(angle) * 5.85, 0, secondSpot.z + Math.sin(angle) * 5.85);
});
const spinSpot = new Vector3(10, 0, -70);
const fieldHalfWidth = 140;
const fieldStart = -14;
const fieldDepth = 120;
let elapsed = 0;
let lifeTime = 0;
let cueIndex = 0;
let paused = false;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let lastCamPos = new Vector3(0, 1.5, 12);
let camSpeed = 0;
let totalFrames = 0;
let totalTime = 0;
let fireCues: (t: number) => void = () => {};
let restart: () => void = () => {};

pane.addButton({ title: 'Restart' }).on('click', () => restart());

function beatName(t: number) {
  const s = settings;
  if (t < s.walkEnd) return '01 silence / walk-in';
  if (t < s.greetHeroAt) return '02 first hop';
  if (t < s.celebrateAt) return '03 hello / reply';
  if (t < s.celebrateAt + 1.7) return '04 celebration / camera starts';
  if (t < s.reactionAt) return '03 greeting hold';
  if (t < s.contagionAt) return '03 reaction';
  if (t < s.pullBackAt) return '04 contagion';
  if (t < s.revealAt) return '05 crowd awakens';
  if (t < s.arcAt) return '06 community';
  if (t < s.cutAt) return '07 crowd';
  if (t < s.escalationAt) return '08 individuals';
  if (t < s.holdAt) return '09 escalation';
  if (t < s.payoffAt) return '10 grand reveal';
  if (t < s.finaleAt) return '11 payoff';
  return '12 finale';
}

async function init() {
  const loader = new GLTFLoader();
  const base = '/instanced-mesh/kaykit/';
  const [character, special, simulation, melee] = await Promise.all([
    loader.loadAsync(base + 'Mannequin_Medium_Animated.glb'),
    // Same Rig_Medium skeleton: the click sequence lives in the Special set.
    loader.loadAsync(base + 'Rig_Medium_Special.glb'),
    // Same skeleton again: the floor transitions (lie/sit down and back up).
    loader.loadAsync(base + 'Rig_Medium_Simulation.glb'),
    // And the twirl of the actor at the centre of the circle.
    loader.loadAsync(base + 'Rig_Medium_CombatMelee.glb')
  ]);
  const names: Record<string, string> = {
    idle: 'Idle_A', idleB: 'Idle_B', run: 'Running_A', jump: 'Jump_Full_Short',
    wave: 'Waving', cheer: 'Cheering', hit: 'Hit_A',
    pushUps: 'Push_Ups', sitUps: 'Sit_Ups', useItem: 'Use_Item', spawn: 'Spawn_Ground',
    walkA: 'Walking_A', walkB: 'Walking_B', walkC: 'Walking_C', sneak: 'Sneaking',
    punch: 'Melee_Unarmed_Attack_Punch_A'
  };
  const clips = Object.entries(names).map(([name, original]) => {
    const clip = character.animations.find((c) => c.name === original);
    if (!clip) throw new Error(`Missing KayKit clip: ${original}`);
    return { name, clip: new AnimationClip(name, clip.duration, clip.tracks.map((track) => track.clone())) };
  });
  // Click sequence, in order: Skeletons_Death then the seventh of the Special
  // set, Skeletons_Death_Resurrect, which recomposes and stands the robot up.
  for (const [name, original] of [
    ['death', 'Skeletons_Death'],
    ['resurrect', 'Skeletons_Death_Resurrect']
  ] as const) {
    const clip = special.animations.find((c) => c.name === original);
    if (!clip) throw new Error(`Missing KayKit clip: ${original}`);
    const filtered = clip.tracks.filter((track) => character.scene.getObjectByName(track.name.split('.')[0]));
    const tracks = (filtered.length ? filtered : clip.tracks).map((track) => track.clone());
    clips.push({ name, clip: new AnimationClip(name, clip.duration, tracks) });
  }
  // Floor transitions from the Simulation set: the body lies/sits down and
  // stands back up instead of snapping between idle and a floor pose.
  for (const [name, original] of [
    ['lieDown', 'Lie_Down'],
    ['lieStandUp', 'Lie_StandUp'],
    ['sitDown', 'Sit_Floor_Down'],
    ['sitStandUp', 'Sit_Floor_StandUp']
  ] as const) {
    const clip = simulation.animations.find((c) => c.name === original);
    if (!clip) throw new Error(`Missing KayKit clip: ${original}`);
    const filtered = clip.tracks.filter((track) => character.scene.getObjectByName(track.name.split('.')[0]));
    const tracks = (filtered.length ? filtered : clip.tracks).map((track) => track.clone());
    clips.push({ name, clip: new AnimationClip(name, clip.duration, tracks) });
  }
  // The twirl at the centre of the circle.
  {
    const clip = melee.animations.find((c) => c.name === 'Melee_2H_Attack_Spin');
    if (!clip) throw new Error('Missing KayKit clip: Melee_2H_Attack_Spin');
    const filtered = clip.tracks.filter((track) => character.scene.getObjectByName(track.name.split('.')[0]));
    const tracks = (filtered.length ? filtered : clip.tracks).map((track) => track.clone());
    clips.push({ name: 'spin', clip: new AnimationClip('spin', clip.duration, tracks) });
  }
  const dur: Record<string, number> = {};
  for (const { name, clip } of clips) dur[name] = clip.duration;
  // Death runs straight into the resurrection: the full window a robot is down.
  const dismantleWindow = dur.death + DEATH_HOLD + dur.resurrect;

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
    // the two detail stages inside the crowd: the trio keeps it tight, the
    // ring of six gets room to dance
    if (Math.hypot(x - groupSpot.x, z - groupSpot.z) < 8.8) continue;
    if (Math.hypot(x - secondSpot.x, z - secondSpot.z) < 12) continue;
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
  // Instance 0 is the protagonist: same geometry, same skeleton, same draw call
  // as the crowd — never a second clone of the character.
  const heroId = 0;
  // B — one robot walks out of the field and stands near the hero
  let bIndex = 0;
  let bBest = Infinity;
  positions.forEach((p, i) => {
    if (i === heroId) return;
    const d = p.distanceToSquared(robotBSpot);
    if (d < bBest) {
      bBest = d;
      bIndex = i;
    }
  });
  const robotBPos = robotBSpot.clone();
  const bWalkFrom = new Vector3(3.5, 0, -17);
  positions[bIndex].copy(bWalkFrom);
  // a third walker on the left, so the opening has two or three little robots
  let wIndex = 0;
  let wBest = Infinity;
  positions.forEach((p, i) => {
    if (i === bIndex || i === heroId) return;
    const d = p.distanceToSquared(new Vector3(-5, 0, -11));
    if (d < wBest) {
      wBest = d;
      wIndex = i;
    }
  });
  const walkerSpot = new Vector3(-2.1, 0, -3.4);
  const walkerFrom = new Vector3(-4, 0, -18);
  positions[wIndex].copy(walkerFrom);
  // the trio of the close-up steps into the first circle
  const groupOrder = positions
    .map((p, i) => ({ i, d: p.distanceToSquared(groupSpot) }))
    .filter(({ i }) => i !== bIndex && i !== wIndex && i !== heroId)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
  groupOrder.forEach(({ i }, k) => positions[i].copy(actorSpots[k]));
  const groupPositions = groupOrder.map(({ i }) => positions[i].clone());
  const groupCenter = new Vector3();
  for (const p of groupPositions) groupCenter.add(p);
  groupCenter.multiplyScalar(1 / groupPositions.length);
  // the second group: twelve in the ring, the breakdancer at its centre
  const secondOrder = positions
    .map((p, i) => ({ i, d: p.distanceToSquared(secondSpot) }))
    .filter(({ i }) => i !== bIndex && i !== wIndex && i !== heroId && !groupOrder.some((entry) => entry.i === i))
    .sort((a, b) => a.d - b.d)
    .slice(0, 13);
  secondOrder.slice(0, 12).forEach(({ i }, k) => positions[i].copy(secondActorSpots[k]));
  const spinIndex = secondOrder[12].i;
  positions[spinIndex].copy(spinSpot);
  const secondPositions = secondOrder.slice(0, 12).map(({ i }) => positions[i].clone());
  const secondCenter = new Vector3();
  for (const p of secondPositions) secondCenter.add(p);
  secondCenter.multiplyScalar(1 / secondPositions.length);
  // the protagonist owns the empty stage in front of the field
  positions[heroId].copy(heroSpot);

  const crowd = new InstancedMesh2<Robot>(geometry, meshes[0].material, { capacity: positions.length, createEntities: true });
  crowd.initSkeleton(skeleton, false);
  (crowd as any).draggable = false;
  (crowd as any).interceptByRaycaster = false;
  crowd.bindMatrix.copy(meshes[0].bindMatrix);
  crowd.bindMatrixInverse.copy(meshes[0].bindMatrixInverse);
  crowd.frustumCulled = true;
  crowd.addInstances(positions.length, (robot, i) => {
    robot.seed = random();
    robot.isHero = i === heroId;
    robot.position.copy(positions[i]);
    // The protagonist is authored: he always starts square to the camera,
    // never on a random yaw the slow body turn would have to unwind.
    robot.quaternion.setFromAxisAngle(
      up,
      robot.isHero ? 0 : random() < 0.22 ? random() * Math.PI * 2 : Math.atan2(-robot.position.x, -robot.position.z)
    );
    robot.offset = random() * dur.idle;
    robot.idleSpeed = 0.88 + random() * 0.28;
    robot.idleClip = random() < 0.5 ? 0 : 1;
    robot.energy = 0.35 + random() * 0.65;
    const r = random();
    robot.reaction = r < 0.3 ? 0 : r < 0.5 ? 1 : r < 0.65 ? 2 : r < 0.8 ? 3 : 4;
    robot.tracksCamera = false;
    robot.yawOffset = Math.atan2(2 * robot.quaternion.w * robot.quaternion.y, 1 - 2 * robot.quaternion.y ** 2);
    robot.gazeOffset = (random() - 0.5) * 0.9;
    robot.gaze = new Quaternion();
    robot.headLock = new Quaternion();
    robot.lastPose = -Infinity;
    robot.distB = 0;
    robot.distC = robot.position.length();
    robot.distG = 0;
    robot.isB = false;
    robot.role = 0;
    robot.toolGroup = false;
    robot.walk = null;
    robot.entrance = null;
    robot.locomotion = 'walk';
  });
  const robotB = crowd.instances[bIndex];
  robotB.isB = true;
  robotB.energy = 0.95;
  robotB.reaction = 0;
  robotB.locomotion = 'walk';
  // The right companion uses a slower walking entrance and arrives later.
  robotB.walk = { from: bWalkFrom.clone(), to: robotBSpot.clone(), t0: settings.walkStart + 0.08, t1: settings.walkEnd + 6 };
  const walker = crowd.instances[wIndex];
  walker.energy = 0.7;
  walker.locomotion = 'walk';
  // The left companion walks in and arrives one second after the hero.
  walker.walk = { from: walkerFrom.clone(), to: walkerSpot.clone(), t0: settings.walkStart + 0.22, t1: settings.walkEnd + 3 };
  // The protagonist is an ordinary instance of the same mesh, authored by the
  // scene: it starts off-stage and walks in through the same entrance
  // mechanism — and the same walk clip — the whole crowd uses.
  const heroRobot = crowd.instances[heroId];
  heroRobot.position.copy(heroWalkFrom);
  heroRobot.entrance = { from: heroWalkFrom.clone(), to: heroSpot.clone(), t0: settings.walkStart, t1: settings.walkEnd };
  for (const robot of crowd.instances) robot.distB = robot.position.distanceTo(robotBPos);
  groupOrder.forEach(({ i }, k) => {
    crowd.instances[i].role = (k + 1) as Robot['role'];
  });
  secondOrder.slice(0, 12).forEach(({ i }) => { crowd.instances[i].toolGroup = true; });
  // the twirl sits at the centre of the second group, not the first
  crowd.instances[spinIndex].role = 4;
  for (const robot of crowd.instances) robot.distG = robot.position.distanceTo(groupCenter);
  let activeCount = positions.length;
  const applyCount = (n: number) => {
    const v = Math.max(0, Math.min(Math.floor(n), positions.length));
    activeCount = v;
    for (let i = 0; i < positions.length; i++) (crowd as any).setActiveAt(i, i < v);
    (crowd as any).count = v;
  };
  applyCount(settings.maxInstances);
  maxInstancesBinding.on('change', (ev: any) => applyCount(ev.value));
  scene.add(crowd);

  // The mixer must own the original bone hierarchy, not the instanced draw mesh.
  const crowdPerformance = new Performance(source as any, clips);
  const regia = createRegia({ robotB: robotBPos, group: groupCenter, group2: secondCenter });
  const target = new Vector3();
  const rotation = new Quaternion();
  const inverse = new Quaternion();
  const viewDirection = new Vector3();
  const relative = new Vector3();
  const gaze = new Vector3();
  const heroBodyTarget = new Vector3();
  let frameDelta = 0;

  // Semantic decisions are independent of the cinematic camera clock.
  const director = new CrowdDirector(dur, crowd.instances, settings.seed);
  director.update(0, activeCount);
  const pointer = new Vector2();
  const intersections: any[] = [];
  main.renderer.domElement.addEventListener('pointerdown', (event) => {
    const rect = main.renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    main.raycaster.setFromCamera(pointer, camera);
    intersections.length = 0;
    crowd.raycast(main.raycaster, intersections);
    // The hit box is the bind pose: a robot lying on the floor keeps the
    // standing silhouette, so a downed robot is skipped until it stands up —
    // the protagonist is the exception, he is always pokeable.
    const crowdHit = intersections.find((entry) => {
      const id = entry.instanceId;
      if (!Number.isInteger(id)) return false;
      if (id === heroId) return true;
      const down = lifeTime - director.dismantleAt[id];
      return !(down >= 0 && down < dismantleWindow);
    });
    if (!crowdHit) return;
    const id = crowdHit.instanceId as number;
    director.playHit(id, lifeTime);
    director.playDismantle(id, lifeTime);
    kaykitAudio.tap(id === heroId ? 1.1 : 0.85);
  });

  // The field itself enters after the hero's celebration. Keep the home layout
  // for deterministic reactions, but render each robot from a deeper starting
  // point and advance it into place with a staggered walking clip.
  for (let i = 0; i < crowd.instances.length; i++) {
    const robot = crowd.instances[i];
    if (robot.isHero || robot.isB || robot === walker) continue;
    const home = robot.position.clone();
    const isDetailActor = robot.role > 0 || robot.toolGroup;
    const depthOffset = isDetailActor ? 26 : 12;
    const from = home.clone().add(new Vector3((robot.seed % 17 - 8) * 0.08, 0, -depthOffset - (robot.seed % (isDetailActor ? 7 : 5))));
    // A short stagger keeps the crowd alive without leaving visible robots
    // frozen at their spawn points. Each path preserves its final x lane.
    // The crowd must stay inside the fog until the hero has finished calling
    // them and has turned back toward the camera.
    const t0 = settings.reactionAt + 1.1 + (robot.seed % 1000) / 1000 * 0.65;
    const walkDuration = isDetailActor ? 5.2 + (robot.seed % 700) / 1000 * 0.8 : 2.45 + (robot.seed % 700) / 1000 * 0.35;
    robot.entrance = { from, to: home, t0, t1: t0 + walkDuration };
    robot.position.copy(from);
  }

  crowd.onFrustumEnter = (i) => {
    // The protagonist is sampled every frame by the authored scene pass.
    if (i === heroId) return true;
    const robot = crowd.instances[i];
    const depth = relative.copy(robot.position).sub(camera.position).dot(viewDirection);
    if (depth > fog.far + 3) return false;
    const poseInterval = depth < 65 ? 0 : depth < 110 ? 1 / 30 : 1 / 20;
    if (lifeTime >= robot.lastPose && lifeTime - robot.lastPose < poseInterval) return true;
    const poseDelta = Number.isFinite(robot.lastPose) ? Math.min(0.2, Math.max(frameDelta, lifeTime - robot.lastPose)) : frameDelta;
    crowdPerformance.sample(director.pose(robot, lifeTime));
    if (depth < 75) {
      director.gaze(robot, lifeTime, camera.position, gaze);
      target.copy(gaze).sub(robot.position).applyQuaternion(inverse.copy(robot.quaternion).invert());
      crowdPerformance.aim(target, poseDelta, robot.gaze, 1, 1 - smooth((depth - 50) / 25), robot, director.torsoReady(robot, lifeTime));
    }
    robot.headLock.copy(crowdPerformance.head.quaternion);
    crowd.setBonesAt(i, false);
    robot.lastPose = lifeTime;
    return true;
  };
  // first pose for every instance, so nobody starts in T-pose
  for (let i = 0; i < positions.length; i++) {
    const r = crowd.instances[i];
    crowdPerformance.sample(director.pose(r, 0));
    r.headLock.copy(crowdPerformance.head.quaternion);
    crowd.setBonesAt(i, false);
  }

  const cues: [number, () => void][] = [
    [settings.walkStart + 0.2, () => kaykitAudio.footstep(0, 0.8)],
    [settings.walkStart + 0.7, () => kaykitAudio.footstep(1, 0.8)],
    [settings.walkStart + 1.2, () => kaykitAudio.footstep(2, 0.8)],
    [settings.walkStart + 1.7, () => kaykitAudio.footstep(1, 0.75)],
    [settings.walkEnd - 0.32, () => kaykitAudio.blip(330, 0.1, 0.05)],
    [settings.greetHeroAt + 0.2, () => { kaykitAudio.blip(330, 0.1, 0.05); kaykitAudio.greetingVoice(); }],
    [settings.greetBAt + 0.2, () => { kaykitAudio.blip(392, 0.1, 0.05); kaykitAudio.greetingVoice(); }],
    [settings.greetWalkerAt + 0.2, () => { kaykitAudio.blip(440, 0.1, 0.05); kaykitAudio.greetingVoice(); }],
    [settings.greetHeroAt + settings.greetingSpacing + 0.2, () => { kaykitAudio.blip(350, 0.1, 0.05); kaykitAudio.greetingVoice(); }],
    [settings.celebrateAt, () => { kaykitAudio.cheer(0.5); kaykitAudio.crowdVoice(); }],
    [settings.reactionAt + 1.25, () => kaykitAudio.crowdCall()],
    [settings.reactionAt + 1.75, () => kaykitAudio.footstep(0, 0.7)],
    [settings.reactionAt + 2.3, () => kaykitAudio.footstep(1, 0.7)],
    [settings.reactionAt + 2.9, () => kaykitAudio.footstep(2, 0.7)],
    [settings.reactionAt + 3.5, () => kaykitAudio.footstep(0, 0.65)],
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
        kaykitAudio.crowdVoice();
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
  cues.sort((a, b) => a[0] - b[0]);
  fireCues = (t) => {
    while (cueIndex < cues.length && cues[cueIndex][0] <= t) cues[cueIndex++][1]();
  };
  restart = () => {
    elapsed = lifeTime = 0;
    cueIndex = 0;
    director.reset(settings.seed);
    heroRobot.gaze.identity();
    heroRobot.position.copy(heroWalkFrom);
  };

  elapsed = 0;
  lastCamPos.copy(camera.position);
  regia.update(0);
  scene.on('animate', (e) => {
    if (document.hidden) return;
    frameDelta = Math.min(e.delta, 0.1);
    if (!paused) {
      lifeTime += frameDelta;
      elapsed = Math.min(settings.duration + 1.5, lifeTime);
    }
    director.reducedMotion = motionPreference.matches;
    director.update(lifeTime, activeCount);
    const t = elapsed;
    fireCues(t);
    regia.update(motionPreference.matches ? settings.duration : t);
    camera.getWorldDirection(viewDirection);
    camSpeed = camera.position.distanceTo(lastCamPos) / Math.max(0.001, frameDelta);
    lastCamPos.copy(camera.position);
    speedMonitor.speed = camSpeed;
    timeMonitor.time = t;
    timeMonitor.beat = beatName(t);
    // The protagonist is animated exactly like any other instance: the same
    // director pose, the same shared mixer, one clip at a time — never a mix.
    // lifeTime (not the clamped camera clock) keeps him alive after the end.
    crowdPerformance.sample(director.pose(heroRobot, lifeTime));
    director.gaze(heroRobot, lifeTime, camera.position, gaze);
    target.copy(gaze).sub(heroRobot.position).applyQuaternion(inverse.copy(heroRobot.quaternion).invert());
    crowdPerformance.aim(target, frameDelta, heroRobot.gaze, 1, 1, undefined, false, false, 1.4);
    crowd.setBonesAt(heroId, false);
    // walkers move through the world while the camera watches
    for (const robot of crowd.instances) {
      if (robot.walk) {
        const travelEnd = Math.max(robot.walk.t0 + 0.1, robot.walk.t1 - 0.42);
        const u = motionPreference.matches ? 1 : smooth((t - robot.walk.t0) / (travelEnd - robot.walk.t0));
        robot.position.lerpVectors(robot.walk.from, robot.walk.to, u);
        // Turn the whole body gently toward the initiator; the head only fine-tunes.
        const fromYaw = Math.atan2(robot.walk.to.x - robot.walk.from.x, robot.walk.to.z - robot.walk.from.z);
        const greetingYaw = Math.atan2(heroSpot.x - robot.walk.to.x, heroSpot.z - robot.walk.to.z);
        const facing = fromYaw + (greetingYaw - fromYaw) * smooth((t - robot.walk.t1) / 0.9);
        robot.quaternion.setFromAxisAngle(up, facing);
        robot.updateMatrix();
      }
      if (robot.entrance) {
        const travelEnd = Math.max(robot.entrance.t0 + 0.1, robot.entrance.t1 - 0.45);
        const u = motionPreference.matches ? 1 : smooth((t - robot.entrance.t0) / (travelEnd - robot.entrance.t0));
        robot.position.lerpVectors(robot.entrance.from, robot.entrance.to, u);
        if (robot.isHero) {
          // Body fully turned to his friends and to the crew he calls; the
          // neck brings the eyes the rest of the way.
          const staged = director.heroFacing(lifeTime, heroBodyTarget);
          if (!staged) heroBodyTarget.copy(camera.position);
          rotation.setFromAxisAngle(up, Math.atan2(heroBodyTarget.x - robot.position.x, heroBodyTarget.z - robot.position.z));
          const blend = motionPreference.matches || lifeTime < 0.25 ? 1 : 1 - Math.exp(-(staged ? 3.2 : settings.bodyFollow) * frameDelta);
          robot.quaternion.slerp(rotation, blend);
          robot.updateMatrix();
          continue;
        }
        const walkingYaw = Math.atan2(
          robot.entrance.to.x - robot.entrance.from.x,
          robot.entrance.to.z - robot.entrance.from.z
        );
        const cameraYaw = Math.atan2(
          camera.position.x - robot.position.x,
          camera.position.z - robot.position.z
        );
        const delta = Math.atan2(Math.sin(cameraYaw - walkingYaw), Math.cos(cameraYaw - walkingYaw));
        const faceCamera = smooth((t - (travelEnd - 0.9)) / 0.9);
        robot.quaternion.setFromAxisAngle(up, walkingYaw + delta * faceCamera);
        robot.updateMatrix();
      }
      if (robot.toolGroup && t >= settings.cutAt + 2.2 && t < settings.holdAt + 1.2) {
        const toolYaw = Math.atan2(secondCenter.x - robot.position.x, secondCenter.z - robot.position.z);
        robot.quaternion.setFromAxisAngle(up, toolYaw);
        robot.updateMatrix();
      }

    }
    totalFrames++;
    totalTime += frameDelta;
    const avgFps = totalFrames / Math.max(0.001, totalTime);
    const info: any = (main as any).renderer.info.render;
    updateStatsOverlay(avgFps, activeCount, info, t);
  });
  if (isDebug || new URLSearchParams(location.search).has('debug'))
    Object.assign(window, {
      kaykitDebug: {
        crowd,
        director,
        hero: heroRobot,
        performance: crowdPerformance,
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
          return activeCount;
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
          lifeTime = Math.max(0, time);
          elapsed = Math.min(settings.duration + 1.5, lifeTime);
          director.reset(settings.seed);
          heroRobot.gaze.identity();
          cueIndex = cues.findIndex(([at]) => at > time);
          if (cueIndex < 0) cueIndex = cues.length;
        },
        setSeed(seed: number) {
          settings.seed = seed >>> 0;
          restart();
        },
        get lifeTime() { return lifeTime; },
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
