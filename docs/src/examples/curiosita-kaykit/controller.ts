import { Vector3 } from 'three';
import { settings } from './config.js';
import { pulse } from './math.js';
import type { Pose, Robot } from './animation.js';

export type Durations = Record<string, number>;

type RippleKind = 'hop' | 'wave' | 'cheer';

type Ripple = {
  kind: RippleKind;
  at: number;
  speed: number;
  window: number;
  distance: (robot: Robot) => number;
  origin: Vector3;
};

const up = new Vector3(0, 1, 0);

/** Deterministic per-robot randomness: same robot, same tick, same behaviour. */
const hash = (a: number, b: number) => {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/**
 * The animation controller of the crowd.
 *
 * Everything a robot does comes from here: it always returns a valid pose
 * (idle is the floor), it layers global wave events on top of each robot's
 * personality, and it keeps a slow schedule of micro-actions so that nobody
 * is ever standing still — even between two waves.
 */
export class CrowdDirector {
  private ripples: Ripple[] = [];
  private hero = new Vector3(0, 1.15, 0);

  constructor(
    private dur: Durations,
    private actorC: Vector3,
    private actorD: Vector3,
    private actorE: Vector3,
    private robotB: Vector3
  ) {}

  addHop(origin: Vector3, at: number, distance: (robot: Robot) => number) {
    this.ripples.push({ kind: 'hop', origin: origin.clone(), at, speed: settings.hopSpeed, window: this.dur.wave, distance });
  }

  addWave(origin: Vector3, at: number, distance: (robot: Robot) => number) {
    this.ripples.push({ kind: 'wave', origin: origin.clone(), at, speed: settings.waveSpeed, window: this.dur.wave * 2, distance });
  }

  addCheer(origin: Vector3, at: number, distance: (robot: Robot) => number) {
    this.ripples.push({ kind: 'cheer', origin: origin.clone(), at, speed: settings.cheerSpeed, window: this.dur.cheer, distance });
  }

  private active(robot: Robot, t: number) {
    let best: { ripple: Ripple; local: number } | null = null;
    for (const ripple of this.ripples) {
      const local = t - (ripple.at + ripple.distance(robot) * ripple.speed);
      if (local > 0 && local < ripple.window && (!best || ripple.at >= best.ripple.at)) best = { ripple, local };
    }
    return best;
  }

  pose(robot: Robot, t: number): Pose {
    const s = settings;
    if (robot.walk && t > robot.walk.t0 && t < robot.walk.t1) return { idle: 0, run: 1, runTime: t - robot.walk.t0 };
    if (robot.role && t >= s.cutAt && t < s.escalationAt) return this.actorPose(robot, t);
    const act = this.active(robot, t);
    if (act) {
      const p = this.reactionPose(robot, act.ripple.kind, act.local, act.ripple.window);
      if (p) return p;
    }
    return this.idlePose(robot, t);
  }

  /** Returns true when the robot is focused on an event (no idle wander). */
  gaze(robot: Robot, t: number, cameraPos: Vector3, out: Vector3): boolean {
    const s = settings;
    if (robot.isB && t > s.reactionAt - 0.3 && t < s.reactionAt + 2.6) {
      out.copy(this.hero);
      return true;
    }
    if (robot.role > 1 && t >= s.cutAt && t < s.escalationAt) {
      out.copy(this.actorC).setY(1.2);
      return true;
    }
    const act = this.active(robot, t);
    if (act && act.local < 1.6) {
      out.copy(act.ripple.origin);
      return true;
    }
    out.copy(cameraPos);
    return false;
  }

  /** Idle wander added on top of the camera gaze. */
  wander(robot: Robot, t: number) {
    return robot.gazeOffset + Math.sin(t * 0.27 + robot.seed * 9.1) * 0.22;
  }

  private actorPose(robot: Robot, t: number): Pose {
    const local = t - settings.cutAt;
    if (robot.role === 1) {
      const jt = local - 0.2;
      if (jt > 0 && jt < this.dur.jump) {
        const w = pulse(jt, this.dur.jump, 0.08, 0.12);
        if (w > 0) return { jump: w, jumpTime: jt };
      }
      const ht = local - 1.5;
      if (ht > 0 && ht < this.dur.hit) {
        const w = pulse(ht, this.dur.hit, 0.05, 0.12);
        if (w > 0) return { hit: w, hitTime: ht };
      }
      return this.idlePose(robot, t);
    }
    if (robot.role === 2) {
      const jt = local - 1.2;
      if (jt > 0 && jt < 0.5) {
        const w = pulse(jt, 0.5, 0.1, 0.15);
        if (w > 0) return { jump: w, jumpTime: jt };
      }
      return this.idlePose(robot, t);
    }
    const ht = local - 1.4;
    if (ht > 0 && ht < this.dur.hit) {
      const w = pulse(ht, this.dur.hit, 0.05, 0.12);
      if (w > 0) return { hit: w, hitTime: ht };
    }
    return this.idlePose(robot, t);
  }

  private reactionPose(robot: Robot, kind: RippleKind, local: number, window: number): Pose | null {
    const speed = 0.85 + robot.energy * 0.35;
    const jt = local * speed;
    if (kind === 'cheer') {
      const w = pulse(local, window, 0.12, 0.3);
      return w > 0 ? { cheer: w, cheerTime: local } : null;
    }
    if (kind === 'wave' && robot.reaction === 4) {
      const w = pulse(local, window, 0.3, 0.5);
      return w > 0 ? { wave: w, waveTime: local + robot.offset } : null;
    }
    if (robot.reaction === 0) return jt < this.dur.jump ? { jump: pulse(jt, this.dur.jump, 0.08, 0.12), jumpTime: jt } : null;
    if (robot.reaction === 1) return jt < 0.55 ? { jump: pulse(jt, 0.55, 0.08, 0.15), jumpTime: jt } : null;
    if (robot.reaction === 2) return null;
    if (robot.reaction === 3) {
      const short = this.dur.jump * 0.72;
      return jt < short ? { jump: pulse(jt, short, 0.06, 0.1), jumpTime: jt } : null;
    }
    const w = pulse(local, window, 0.3, 0.5);
    return w > 0 ? { wave: w, waveTime: local + robot.offset } : null;
  }

  /**
   * The floor of the whole system: idle plus a slow schedule of micro-actions
   * (a small bounce, a short wave, a look around) so the crowd keeps living.
   */
  private idlePose(robot: Robot, t: number): Pose {
    const idleTime = t * robot.idleSpeed + robot.offset;
    const period = 3.6 + robot.energy * 3.2;
    const phase = robot.offset * 7.3 + robot.seed * 11.7;
    const local = t + phase - Math.floor((t + phase) / period) * period;
    if (local < 1.5) {
      const h = hash(robot.seed * 1000, Math.floor((t + phase) / period));
      const w = pulse(local, 1.5, 0.3, 0.4) * (0.35 + robot.energy * 0.3);
      if (w > 0.01) {
        if (h < 0.34) return { idle: 1 - w, idleTime, jump: w, jumpTime: local };
        if (h < 0.67) return { idle: 1 - w, idleTime, wave: w, waveTime: local + robot.offset };
      }
    }
    return { idle: 1, idleClip: robot.idleClip, idleTime };
  }
}
