import { AnimationAction, AnimationClip, AnimationMixer, Bone, Euler, Object3D, Quaternion, Vector3 } from 'three';

export type Robot = {
  seed: number;
  isHero: boolean;
  distB: number;
  distC: number;
  distG: number;
  isB: boolean;
  offset: number;
  idleSpeed: number;
  breathRate: number;
  breathPhase: number;
  breathDrift: number;
  idleClip: 0 | 1;
  energy: number;
  reaction: 0 | 1 | 2 | 3 | 4;
  tracksCamera: boolean;
  yawOffset: number;
  gazeOffset: number;
  gaze: Quaternion;
  headLock: Quaternion;
  torsoYaw: number;
  lastPose: number;
  role: 0 | 1 | 2 | 3 | 4;
  toolGroup: boolean;
  walk: { from: Vector3; to: Vector3; t0: number; t1: number } | null;
  entrance: { from: Vector3; to: Vector3; t0: number; t1: number } | null;
  locomotion: 'walk' | 'sneak';
};

export type Pose = {
  activity?: string;
  activityWeight?: number;
  activityTime?: number;
  idle?: number;
  idleTime?: number;
  idleClip?: 0 | 1;
  run?: number;
  runTime?: number;
  jump?: number;
  jumpTime?: number;
  wave?: number;
  waveTime?: number;
  cheer?: number;
  cheerTime?: number;
  hit?: number;
  hitTime?: number;
  disassemble?: number;
  disassembleTime?: number;
};

/** Click sequence: the death clip runs straight into the resurrection. */
export const DEATH_HOLD = 0;

/**
 * Weight-driven mixer over a fixed clip set. Every instance of the crowd is
 * sampled from the same mixer and pushed into the instanced skeleton, so the
 * cost is one pose per visible robot (throttled by distance).
 */
export class Performance {
  mixer: AnimationMixer;
  actions: Record<string, AnimationAction> = {};
  head: Bone;
  chest: Bone;
  offset = new Quaternion();
  target = new Quaternion();
  direction = new Vector3();
  inverse = new Quaternion();
  angles = new Euler(0, 0, 0, 'YXZ');


  constructor(
    public root: Object3D,
    clips: { name: string; clip: AnimationClip }[]
  ) {
    this.mixer = new AnimationMixer(root);
    for (const { name, clip } of clips) this.actions[name] = this.mixer.clipAction(clip).play();
    if (!this.actions.idle) throw new Error('A looping baseline clip is required');
    this.head = root.getObjectByName('head') as Bone;
    this.chest = root.getObjectByName('chest') as Bone;
  }

  duration(name: string) {
    return this.actions[name]?.getClip().duration ?? 0;
  }

  private apply(name: string, weight: number, time: number) {
    const action = this.actions[name];
    if (!action) return;
    action.enabled = weight > 0.001;
    if (!action.enabled) return;
    const duration = action.getClip().duration;
    const clock = Number.isFinite(time) ? time : 0;
    // update(0) deliberately samples without advancing the shared mixer; it does
    // not perform Three.js loop wrapping. Never send an unbounded clip time.
    const loops = name === 'idle' || name === 'idleB' || name === 'run' || name === 'wave' || name === 'cheer' || ['pushUps', 'sitUps', 'useItem', 'walkA', 'walkB', 'walkC', 'sneak'].includes(name);
    action.time = duration <= 0 ? 0 : loops ? ((clock % duration) + duration) % duration : Math.max(0, Math.min(duration, clock));
    action.setEffectiveWeight(weight);
  }

  sample(pose: Pose, updateWorld = true) {
    // No character is ever dead between actions. There is always a living baseline.
    // Only available clips count toward the budget; baseline fills its remainder.
    const weight = (name: string, value = 0) => this.actions[name] && Number.isFinite(value) ? Math.max(0, value) : 0;
    const run = weight('run', pose.run);
    const jump = weight('jump', pose.jump);
    const wave = weight('wave', pose.wave);
    const cheer = weight('cheer', pose.cheer);
    const hit = weight('hit', pose.hit);
    // Click sequence: Skeletons_Death runs straight into
    // Skeletons_Death_Resurrect — no dead idle in between.
    const deathDur = this.duration('death');
    const resurrectDur = this.duration('resurrect');
    const dt = pose.disassembleTime ?? 0;
    const dis = weight('death', pose.disassemble);
    let deathW = 0, deathT = 0, resurrectW = 0, resurrectT = 0;
    if (dis > 0) {
      if (dt < deathDur) {
        deathW = dis * Math.min(1, dt / 0.1);
        deathT = dt;
      } else {
        resurrectT = dt - deathDur;
        resurrectW = dis * Math.min(1, Math.max(0, (resurrectDur - resurrectT) / 0.25));
      }
    }
    const dismantle = Math.max(deathW, resurrectW);
    const activity = weight(pose.activity ?? '', pose.activityWeight);
    const total = run + jump + wave + cheer + hit + dismantle + activity;
    const scale = total > 1 ? 1 / total : 1;
    const idleWeight = 1 - Math.min(1, total);
    const idleTime = pose.idleTime ?? 0;
    const useB = pose.idleClip === 1 && !!this.actions.idleB;
    this.apply('idle', useB ? 0 : idleWeight, idleTime);
    this.apply('idleB', useB ? idleWeight : 0, idleTime);
    this.apply('run', run * scale, pose.runTime ?? 0);
    this.apply('jump', jump * scale, pose.jumpTime ?? 0);
    this.apply('wave', wave * scale, pose.waveTime ?? 0);
    this.apply('cheer', cheer * scale, pose.cheerTime ?? 0);
    this.apply('hit', hit * scale, pose.hitTime ?? 0);
    this.apply('death', deathW * scale, deathT);
    this.apply('resurrect', resurrectW * scale, resurrectT);
    for (const name of ['pushUps', 'sitUps', 'useItem', 'spawn', 'walkA', 'walkB', 'walkC', 'sneak', 'punch', 'lieDown', 'lieStandUp', 'sitDown', 'sitStandUp', 'spin']) {
      this.apply(name, name === pose.activity ? activity * scale : 0, pose.activityTime ?? 0);
    }
    this.mixer.update(0);
    if (updateWorld) this.root.updateMatrixWorld(true);
  }

  aim(target: Vector3, dt: number, state: Quaternion, speed = 1, strength = 1, torso?: Robot, followBody = false, steady = false, maxYaw = 0.55) {
    if (!this.head?.parent) return;
    this.head.getWorldPosition(this.direction);
    this.direction.subVectors(target, this.direction);
    const dist = this.direction.length();
    if (dist < 0.001) return;
    this.direction.normalize();
    this.head.parent.getWorldQuaternion(this.inverse).invert();
    this.direction.applyQuaternion(this.inverse);
    this.angles.set(
      -Math.asin(Math.max(-0.45, Math.min(0.45, this.direction.y))),
      Math.max(-maxYaw, Math.min(maxYaw, Math.atan2(this.direction.x, this.direction.z))),
      0
    );
    if (torso && this.chest) {
      const desired = followBody && Math.abs(this.angles.y) > 0.35 ? this.angles.y * 0.3 : 0;
      torso.torsoYaw += (desired - torso.torsoYaw) * (1 - Math.exp(-1.5 * dt));
      this.angles.y -= torso.torsoYaw;
    }
    this.target.setFromEuler(this.angles);
    // The shared sampler has no persistent per-character smoothing state.
    state.slerp(this.target, 1 - Math.exp(-3.5 * speed * dt));
    this.offset.identity().slerp(state, strength);
    if (steady) {
      // Absolute local orientation removes the clip's exaggerated head sway.
      this.head.quaternion.copy(this.offset);
    } else this.head.quaternion.multiply(this.offset);
    if (torso && this.chest) {
      this.angles.set(0, torso.torsoYaw * strength, 0);
      this.chest.quaternion.multiply(this.offset.setFromEuler(this.angles));
    }
    this.root.updateMatrixWorld(true);
  }
}
