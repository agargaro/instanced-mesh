import { Vector3 } from 'three';
import { settings } from './config.js';
import { pulse, smooth } from './math.js';
import { DEATH_HOLD, type Pose, type Robot } from './animation.js';

export type Durations = Record<string, number>;
type Individual = Robot & { id: number; position: Vector3 };

/** Independent streams: changing a decision never reshuffles personality. */
export const hash = (seed: number, stream: number) => {
  let h = (Math.imul(seed | 0, 374761393) + Math.imul(stream | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// The crowd only ever greets, jumps or celebrates: no floor poses, no
// lying/sitting down, no spawning. Detail shots author their own beats.
const ACTIVITIES = ['wave', 'jump', 'cheer'];
const STEP = 0.2;
const NEIGHBORS = 6;
// The opening has a small clearing; this reaches its edge without broadcasting.
const RADIUS = 14;
const NONE = -1;
const HERO = -2;

/**
 * One semantic controller, compact state for all individuals. Decisions run at
 * 5 Hz regardless of visibility; the existing shared mixer samples smooth poses.
 * No character is ever dead between actions. There is always a living baseline.
 */
export class CrowdDirector {
  readonly energy: Float32Array;
  readonly curiosity: Float32Array;
  readonly sociability: Float32Array;
  readonly nextDecision: Float64Array;
  readonly actionAt: Float64Array;
  readonly hitAt: Float64Array;
  readonly dismantleAt: Float64Array;
  readonly cooldown: Float64Array;
  readonly action: Uint8Array; // 0 rest, 1–8 distinct activities
  readonly attention: Int32Array;
  readonly attentionUntil: Float64Array;
  readonly attentionAt: Float64Array;
  readonly neighbors: Int32Array;
  private pendingAt: Float64Array;
  private pendingSource: Int32Array;
  private pendingDepth: Uint8Array;
  private sequence: Uint32Array;
  private depth: Uint8Array;
  reactionsEnabled = true;
  reducedMotion = false;
  private eventPosition = new Vector3();
  private receiverPosition = new Vector3();
  private tick = -1;
  private count = 0;
  private hero = new Vector3(0, 1.15, 0);
  private poseBuffer: Pose = {};
  // The protagonist's storyboard beats, one clip at a time.
  private heroBeats: { at: number; kind: number; duration: number }[];
  private duration(kind: number) {
    const clip = ACTIVITIES[kind - 1];
    return this.dur[clip] ?? 0;
  }

  constructor(private dur: Durations, private robots: Individual[], private seed = 72491) {
    this.heroBeats = [
      { at: settings.walkEnd, kind: 1, duration: dur.wave },        // arrival wave, to us
      { at: settings.greetHeroAt, kind: 1, duration: dur.wave },    // greeting the friends
      { at: settings.greetBAt, kind: 1, duration: dur.wave },       // answering Robot B
      { at: settings.celebrateAt, kind: 3, duration: dur.cheer },   // calling the whole crowd
      { at: settings.finalHopAt, kind: 2, duration: dur.jump }      // the finale hop
    ];
    const n = robots.length;
    this.energy = new Float32Array(n);
    this.curiosity = new Float32Array(n);
    this.sociability = new Float32Array(n);
    this.nextDecision = new Float64Array(n);
    this.actionAt = new Float64Array(n);
    this.hitAt = new Float64Array(n);
    this.dismantleAt = new Float64Array(n);
    this.cooldown = new Float64Array(n);
    this.action = new Uint8Array(n);
    this.attention = new Int32Array(n);
    this.attentionUntil = new Float64Array(n);
    this.attentionAt = new Float64Array(n);
    this.neighbors = new Int32Array(n * NEIGHBORS).fill(NONE);
    this.pendingAt = new Float64Array(n);
    this.pendingSource = new Int32Array(n);
    this.pendingDepth = new Uint8Array(n);
    this.sequence = new Uint32Array(n);
    this.depth = new Uint8Array(n);
    // Placement is static apart from the opening walkers. Use their destinations
    // and check actual distance when delivering events so no distant links fire.
    const cells = new Map<string, number[]>();
    const home = (i: number) => robots[i].walk?.to ?? robots[i].position;
    for (let i = 0; i < n; i++) {
      const p = home(i), key = `${Math.floor(p.x / RADIUS)},${Math.floor(p.z / RADIUS)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key)!.push(i);
    }
    for (let i = 0; i < n; i++) {
      const p = home(i), x = Math.floor(p.x / RADIUS), z = Math.floor(p.z / RADIUS);
      const candidates: { id: number; distance: number }[] = [];
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        for (const id of cells.get(`${x + dx},${z + dz}`) ?? []) {
          const distance = p.distanceToSquared(home(id));
          if (id !== i && distance < RADIUS * RADIUS) candidates.push({ id, distance });
        }
      }
      candidates.sort((a, b) => a.distance - b.distance);
      for (let k = 0; k < Math.min(NEIGHBORS, candidates.length); k++) this.neighbors[i * NEIGHBORS + k] = candidates[k].id;
    }
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = seed;
    this.tick = -1;
    this.action.fill(0);
    this.actionAt.fill(0);
    this.hitAt.fill(-Infinity);
    this.dismantleAt.fill(-Infinity);
    this.cooldown.fill(0);
    this.attention.fill(NONE);
    this.attentionUntil.fill(0);
    this.attentionAt.fill(0);
    this.pendingAt.fill(Infinity);
    this.pendingSource.fill(NONE);
    this.sequence.fill(0);
    this.depth.fill(0);
    for (let i = 0; i < this.robots.length; i++) {
      const r = this.robots[i];
      r.seed = (hash(seed, i) * 4294967296) >>> 0;
      this.energy[i] = r.energy = 0.2 + hash(r.seed, 1) * 0.7;
      this.curiosity[i] = hash(r.seed, 2);
      this.sociability[i] = hash(r.seed, 3);
      r.idleSpeed = 0.95 + hash(r.seed, 4) * 0.1;
      r.idleClip = hash(r.seed, 5) < 0.5 ? 0 : 1;
      r.offset = hash(r.seed, 6) * this.dur[r.idleClip ? 'idleB' : 'idle'];
      r.breathRate = 0.65 + hash(r.seed, 21) * 0.5;
      r.breathPhase = hash(r.seed, 22) * Math.PI * 2;
      r.breathDrift = 0.17 + hash(r.seed, 23) * 0.24;
      r.gazeOffset = (hash(r.seed, 7) - 0.5) * 0.55;
      r.gaze.identity();
      r.torsoYaw = 0;
      r.lastPose = -Infinity;
      this.nextDecision[i] = 0.5 + hash(r.seed, 8) * 12;
    }
    // The protagonist and his right-hand friend must never breathe in step:
    // different clip, different tempo, different phase.
    const hero = this.robots.find((r) => r.isHero);
    if (hero) {
      hero.idleClip = 0;
      hero.breathRate = 1.18;
      hero.offset = this.dur.idle * 0.2;
      hero.breathPhase = 0.7;
      hero.breathDrift = 0.21;
    }
    const friend = this.robots.find((r) => r.isB);
    if (friend) {
      friend.idleClip = 1;
      friend.breathRate = 0.78;
      friend.offset = this.dur.idleB * 0.75;
      friend.breathPhase = 4.4;
      friend.breathDrift = 0.34;
    }
  }

  /** The active storyboard beat of the protagonist, if any. */
  private heroBeat(t: number) {
    for (const beat of this.heroBeats) {
      const local = t - beat.at;
      if (local >= 0 && local < beat.duration) return { kind: beat.kind, local };
    }
    return null;
  }

  private heroBeatPose(p: Pose, kind: number, local: number) {
    const weight = (duration: number, fadeIn: number, fadeOut: number) => pulse(local, duration, fadeIn, fadeOut);
    if (kind === 1) {
      p.wave = weight(this.dur.wave, 0.35, 0.45);
      p.waveTime = local;
    } else if (kind === 2) {
      p.jump = weight(this.dur.jump, 0.1, 0.24);
      p.jumpTime = local;
    } else {
      p.cheer = weight(this.dur.cheer, 0.2, 0.4);
      p.cheerTime = local;
    }
  }

  /**
   * Where the protagonist's body points: his two friends while he greets them,
   * the crew while he calls it. Returns false to keep facing the camera.
   */
  heroFacing(t: number, out: Vector3): boolean {
    const beat = this.heroBeat(t);
    if (beat?.kind === 3) {
      out.set(0, 0, -24);
      return true;
    }
    if (t >= settings.greetHeroAt && t < settings.greetingEnd) {
      const exchange = Math.floor((t - settings.greetHeroAt) / settings.greetingSpacing);
      const friend = exchange % 2 === 0 ? this.robots.find((r) => r.walk && !r.isB) : this.robots.find((r) => r.isB);
      if (friend) {
        out.copy(friend.position);
        return true;
      }
    }
    return false;
  }

  private positionAt(i: number, t: number, out: Vector3) {
    const r = this.robots[i];
    if (!r.walk) return out.copy(r.position);
    const travelEnd = Math.max(r.walk.t0 + 0.1, r.walk.t1 - 0.42);
    const u = smooth((t - r.walk.t0) / (travelEnd - r.walk.t0));
    return out.lerpVectors(r.walk.from, r.walk.to, u);
  }

  private notice(i: number, source: number, t: number, depth: number) {
    if (!this.reactionsEnabled) return;
    if (this.robots[i].walk && t < settings.greetingEnd) return;
    if (this.pendingAt[i] !== Infinity || this.attentionUntil[i] > t) return;
    const r = this.robots[i];
    const origin = source === HERO ? this.hero : this.positionAt(source, t, this.eventPosition);
    const distance = this.positionAt(i, t, this.receiverPosition).distanceTo(origin);
    if (distance > RADIUS) return;
    const chance = (0.2 + this.curiosity[i] * 0.55) * (1 - distance / (RADIUS * 1.4));
    if (hash(r.seed, this.tick * 17 + source) > chance) return;
    this.pendingAt[i] = t + 0.18 + hash(r.seed, this.tick + 103) * 0.65;
    this.pendingSource[i] = source;
    this.pendingDepth[i] = depth;
  }

  private start(i: number, kind: number, t: number, depth = 0) {
    if (this.reducedMotion || !(this.duration(kind) > 0)) return;
    this.action[i] = kind;
    this.actionAt[i] = t;
    this.depth[i] = depth;
    this.cooldown[i] = t + this.duration(kind) / this.robots[i].idleSpeed + 3 + hash(this.robots[i].seed, this.tick + 71) * 5;
    if (depth >= 2) return;
    for (let k = 0; k < NEIGHBORS; k++) {
      const neighbor = this.neighbors[i * NEIGHBORS + k];
      if (neighbor >= 0 && neighbor < this.count) this.notice(neighbor, i, t, depth + 1);
    }
  }

  playOneShot(id: number, t: number) {
    if (id >= 0 && id < this.count && this.cooldown[id] <= t) this.start(id, 1 + id % ACTIVITIES.length, t);
  }

  playHit(id: number, t: number) {
    if (id >= 0 && id < this.count) this.hitAt[id] = t;
  }

  playDismantle(id: number, t: number) {
    if (id >= 0 && id < this.count) this.dismantleAt[id] = t;
  }

  update(t: number, count = this.robots.length) {
    this.count = count;
    if (t < this.tick * STEP) this.reset();
    const targetTick = Math.floor(t / STEP + 1e-8);
    while (this.tick < targetTick) {
      const now = ++this.tick * STEP;
      for (let i = 0; i < count; i++) {
        const r = this.robots[i];
        // Reserve the two opening companions for their authored greeting.
        if (r.walk && now < settings.greetingEnd) continue;
        // Entrance locomotion owns the pose until the character has settled;
        // random actions must never interrupt a visible walk cycle.
        if (r.entrance && now < r.entrance.t1) continue;
        if (this.action[i] && (now - this.actionAt[i]) * r.idleSpeed >= this.duration(this.action[i])) this.action[i] = 0;
        if (this.attentionUntil[i] <= now) this.attention[i] = NONE;
        if (this.pendingAt[i] <= now) {
          const source = this.pendingSource[i];
          this.pendingAt[i] = Infinity;
          if (source === HERO || source < count) {
            this.attention[i] = source;
            this.attentionAt[i] = now;
            this.attentionUntil[i] = now + 1 + this.curiosity[i] * 2;
            const imitate = hash(r.seed, this.tick + 311) < this.sociability[i] * this.energy[i] * 0.5;
            if (imitate && this.cooldown[i] <= now && !this.action[i]) this.start(i, 1 + i % ACTIVITIES.length, now + 0.25, this.pendingDepth[i]);
          }
        }
        if (now < this.nextDecision[i]) continue;
        const decision = ++this.sequence[i];
        this.nextDecision[i] = now + 2 + (1 - this.energy[i]) * 5 + hash(r.seed, decision * 11) * 5;
        if (r.walk && now < r.walk.t1) continue;
        if (this.attentionUntil[i] <= now) {
          const neighbor = this.neighbors[i * NEIGHBORS + Math.floor(hash(r.seed, decision * 11 + 1) * NEIGHBORS)];
          this.attention[i] = neighbor >= 0 && neighbor < count && hash(r.seed, decision * 11 + 2) < this.curiosity[i] ? neighbor : NONE;
          this.attentionAt[i] = now;
          this.attentionUntil[i] = now + 0.8 + hash(r.seed, decision * 11 + 3) * 2.2;
        }
        if (!this.action[i] && this.cooldown[i] <= now && hash(r.seed, decision * 11 + 4) < 0.08 + this.energy[i] * 0.18) {
          const choice = hash(r.seed, decision * 11 + 5);
          this.start(i, 1 + Math.floor(choice * ACTIVITIES.length), now);
        }
      }
    }
  }

  pose(robot: Individual, t: number): Pose {
    // Reuse the sampler input: no allocation per visible character per frame.
    // Every field is reset here, so one instance's action can never leak into
    // the pose of the next one through this shared buffer.
    const p = this.poseBuffer;
    p.idle = 1;
    p.idleClip = robot.idleClip;
    // Independent rest clocks: broad tempo variation plus gentle, personal drift.
    // Analytic phase stays continuous across culling, seeking and action recovery;
    // changing the breathing rhythm does not change the speed of other activities.
    const drift = 0.22 * (Math.sin(t * robot.breathDrift + robot.breathPhase) - Math.sin(robot.breathPhase));
    p.idleTime = t * robot.breathRate + robot.offset + drift;
    p.run = 0;
    p.runTime = 0;
    p.jump = 0;
    p.jumpTime = 0;
    p.wave = 0;
    p.waveTime = 0;
    p.cheer = 0;
    p.cheerTime = 0;
    p.hit = 0;
    p.hitTime = 0;
    p.disassemble = 0;
    p.disassembleTime = 0;
    p.activity = undefined;
    p.activityWeight = 0;
    p.activityTime = 0;
    const hitTime = t - this.hitAt[robot.id];
    const dismantleTime = t - this.dismantleAt[robot.id];
    // Death runs straight into the resurrection: no dead idle in between.
    const dismantleWindow = this.dur.death + DEATH_HOLD + this.dur.resurrect;
    if (dismantleTime >= 0 && dismantleTime < dismantleWindow && !this.reducedMotion) {
      p.disassemble = 1;
      p.disassembleTime = dismantleTime;
      return p;
    }
    if (hitTime >= 0 && hitTime < this.dur.hit && !this.reducedMotion) {
      p.hit = pulse(hitTime, this.dur.hit, 0.06, 0.2);
      p.hitTime = hitTime;
      return p;
    }
    // The protagonist follows the storyboard beats instead of random actions.
    if (robot.isHero) {
      const beat = this.heroBeat(t);
      if (beat) {
        this.heroBeatPose(p, beat.kind, beat.local);
        return p;
      }
    }
    if (robot.walk && !this.reducedMotion) {
      const local = t - robot.walk.t0;
      p.activity = ['walkA', 'walkB', 'walkC'][robot.id % 3];
      p.activityWeight = pulse(local, robot.walk.t1 - robot.walk.t0, 0.3, 0.45);
      p.activityTime = local;
      if (p.activityWeight > 0) return p;
    }
    if (robot.walk && t < settings.greetingEnd) {
      if (!this.reducedMotion) {
        const local = t - (robot.isB ? settings.greetBAt : settings.greetWalkerAt);
        p.wave = pulse(local, this.dur.wave, 0.35, 0.45);
        p.waveTime = local;
      }
      return p;
    }
    if (robot.entrance && !this.reducedMotion) {
      const local = t - robot.entrance.t0;
      const span = robot.entrance.t1 - robot.entrance.t0;
      p.run = pulse(local, span, 0.28, 0.42);
      p.runTime = local;
      if (p.run > 0) return p;
      // A few arrivals acknowledge the group after settling, adding life
      // without making the entire field wave in the same beat.
      if (robot.id % 17 < 14) {
        const waveTime = t - robot.entrance.t1;
        p.wave = pulse(waveTime, 1.45, 0.18, 0.3);
        p.waveTime = waveTime;
        if (p.wave > 0) return p;
      }
    }
    // The three actors in the close-up have authored beats instead of random
    // crowd decisions: wave, punch, and hop. Their poses stay active for the
    // entire detail shot and never fall back to walking in place.
    // The three actors in the close-up have authored beats, in a line: greet,
    // train (punch) and celebrate. The ring of six celebrates or uses the
    // tool, and the breakdancer twirls at its centre.
    if (robot.role > 0 && t >= settings.cutAt && t < settings.cutAt + 8.5 && !this.reducedMotion) {
      const local = t - settings.cutAt + robot.role * 0.18;
      if (robot.role === 4) {
        const cycle = this.dur.spin;
        const beat = local % cycle;
        p.activity = 'spin';
        p.activityTime = beat;
        p.activityWeight = pulse(beat, cycle, 0.2, 0.25);
        return p;
      }
      const cycle = robot.role === 1 ? 2.3 : robot.role === 2 ? 1.5 : 1.8;
      const beat = local % cycle;
      const weight = pulse(beat, cycle, 0.32, 0.32);
      if (robot.role === 1) {
        p.wave = weight;
        p.waveTime = beat;
      } else if (robot.role === 2) {
        p.activity = 'punch';
        p.activityWeight = weight;
        p.activityTime = beat;
      } else {
        p.cheer = weight;
        p.cheerTime = beat;
      }
      // Keep the authored idle blend during the small gap at a cycle boundary;
      // never hand control back to a random crowd action in the close-up.
      return p;
    }
    // The ring of six: half of them celebrate, half work the tool.
    if (robot.toolGroup && t >= settings.cutAt + 2.2 && t < settings.holdAt + 1.2 && !this.reducedMotion) {
      const local = ((t - settings.cutAt - 2.2) * 0.78) % 1.8;
      if (robot.id % 2 === 0) {
        p.cheer = pulse(local, 1.8, 0.3, 0.3);
        p.cheerTime = local;
      } else {
        p.activity = 'useItem';
        p.activityWeight = pulse(local, 1.8, 0.3, 0.3);
        p.activityTime = local;
      }
      return p;
    }
    const kind = this.action[robot.id];
    if (kind && !robot.isHero && !this.reducedMotion) {
      const local = (t - this.actionAt[robot.id]) * robot.idleSpeed;
      const duration = this.duration(kind);
      const w = pulse(local, duration, 0.35, 0.45);
      const clip = ACTIVITIES[kind - 1];
      if (clip === 'wave') {
        p.wave = w;
        p.waveTime = local;
      } else if (clip === 'jump') {
        p.jump = w;
        p.jumpTime = local;
      } else {
        p.cheer = w;
        p.cheerTime = local;
      }
    }
    return p;
  }

  gaze(robot: Individual, t: number, cameraPos: Vector3, out: Vector3): boolean {
    if (robot.isHero) {
      // Poked by us: eyes on the audience, whatever else is happening.
      const dismantleTime = t - this.dismantleAt[robot.id];
      const hitTime = t - this.hitAt[robot.id];
      const poked =
        (dismantleTime >= 0 && dismantleTime < this.dur.death + DEATH_HOLD + this.dur.resurrect) ||
        (hitTime >= 0 && hitTime < this.dur.hit);
      if (poked) {
        out.copy(cameraPos);
        return true;
      }
      const beat = this.heroBeat(t);
      // Cheering the crew: he watches the crew.
      if (beat?.kind === 3) {
        out.set(0, 1.35, -24);
        return true;
      }
      // Greeting his two friends: he watches whoever he is answering.
      if (t >= settings.greetHeroAt && t < settings.greetingEnd) {
        const exchange = Math.floor((t - settings.greetHeroAt) / settings.greetingSpacing);
        const friend = exchange % 2 === 0 ? this.robots.find((r) => r.walk && !r.isB) : this.robots.find((r) => r.isB);
        if (friend) {
          out.copy(friend.position).setY(1.35);
          return true;
        }
      }
      // The finale hop: he watches the crowd he just called.
      if (beat?.kind === 2) {
        out.set(0, 1.2, -24);
        return true;
      }
      // Idle, or waving at us: eyes on the audience.
      out.copy(cameraPos);
      return true;
    }
    if (robot.walk && t >= robot.walk.t1 && t < settings.greetingEnd) {
      out.copy(this.hero);
      return true;
    }
    const id = this.attention[robot.id];
    if (id === HERO) out.copy(this.hero);
    else if (id >= 0 && id < this.count) out.copy(this.robots[id].position).setY(1.25);
    else {
      // Persist a fixation between decisions, with a tiny bounded drift.
      const angle = robot.yawOffset + robot.gazeOffset + Math.sin(t * 0.45 + robot.offset) * 0.025;
      out.set(robot.position.x + Math.sin(angle) * 8, 1.2, robot.position.z + Math.cos(angle) * 8);
    }
    return id !== NONE;
  }

  torsoReady(robot: Individual, t: number) {
    return this.attention[robot.id] !== NONE && t - this.attentionAt[robot.id] > 0.45;
  }
}
