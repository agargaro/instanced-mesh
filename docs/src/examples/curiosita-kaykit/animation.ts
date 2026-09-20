import { AnimationAction, AnimationClip, AnimationMixer, Bone, Euler, Object3D, Quaternion, Vector3 } from 'three';
import { smooth } from './math.js';

export type Robot = {
  seed: number;
  distB: number;
  distC: number;
  distG: number;
  isB: boolean;
  offset: number;
  idleSpeed: number;
  idleClip: 0 | 1;
  energy: number;
  reaction: 0 | 1 | 2 | 3 | 4;
  tracksCamera: boolean;
  yawOffset: number;
  gazeOffset: number;
  gaze: Quaternion;
  lastPose: number;
  role: 0 | 1 | 2 | 3;
  walk: { from: Vector3; to: Vector3; t0: number; t1: number } | null;
};

export type Pose = {
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
};

/**
 * Weight-driven mixer over a fixed clip set. Every instance of the crowd is
 * sampled from the same mixer and pushed into the instanced skeleton, so the
 * cost is one pose per visible robot (throttled by distance).
 */
export class Performance {
  mixer: AnimationMixer;
  actions: Record<string, AnimationAction> = {};
  head: Bone;
  offset = new Quaternion();
  target = new Quaternion();
  direction = new Vector3();
  inverse = new Quaternion();
  angles = new Euler(0, 0, 0, 'YXZ');
  private waveSeam?: AnimationAction;

  constructor(
    public root: Object3D,
    clips: { name: string; clip: AnimationClip }[]
  ) {
    this.mixer = new AnimationMixer(root);
    for (const { name, clip } of clips) this.actions[name] = this.mixer.clipAction(clip).play();
    if (this.actions.wave) this.waveSeam = this.mixer.clipAction(this.actions.wave.getClip().clone()).play();
    this.head = root.getObjectByName('head') as Bone;
  }

  duration(name: string) {
    return this.actions[name]?.getClip().duration ?? 0;
  }

  private apply(name: string, weight: number, time: number) {
    const action = this.actions[name];
    if (!action) return;
    action.enabled = weight > 0.001;
    if (!action.enabled) return;
    action.time = time;
    action.setEffectiveWeight(weight);
  }

  sample(pose: Pose, updateWorld = true) {
    let run = pose.run ?? 0;
    let jump = pose.jump ?? 0;
    let wave = pose.wave ?? 0;
    let cheer = pose.cheer ?? 0;
    let hit = pose.hit ?? 0;
    let override = Math.min(1, run + jump + wave + cheer + hit);
    let idleWeight = (pose.idle ?? 1) * Math.max(0, 1 - override);
    // Nobody is ever frozen: a thin idle layer always survives under the
    // action, and if every clip fades out idle takes the whole pose.
    if (override > 0 && (pose.idle ?? 1) > 0 && idleWeight < 0.12) {
      const factor = (1 - 0.12) / override;
      run *= factor;
      jump *= factor;
      wave *= factor;
      cheer *= factor;
      hit *= factor;
      idleWeight = 0.12;
      override = 1 - idleWeight;
    } else if (idleWeight + override < 0.01) {
      idleWeight = 1;
      override = 0;
    }
    const idleTime = pose.idleTime ?? 0;
    const useB = pose.idleClip === 1;
    this.apply('idle', useB ? 0 : idleWeight, idleTime);
    this.apply('idleB', useB ? idleWeight : 0, idleTime);
    this.apply('run', run, pose.runTime ?? 0);
    this.apply('jump', jump, pose.jumpTime ?? 0);
    this.apply('cheer', cheer, pose.cheerTime ?? 0);
    this.apply('hit', hit, pose.hitTime ?? 0);
    const waveAction = this.actions.wave;
    if (waveAction) {
      // Two overlapping copies of the wave clip kill the loop seam.
      const duration = waveAction.getClip().duration;
      const overlap = Math.min(0.65, duration * 0.25);
      const period = duration - overlap;
      const wt = Math.max(0, pose.waveTime ?? 0);
      const cycle = Math.floor(wt / period);
      const local = wt % period;
      const seam = cycle > 0 ? smooth(local / overlap) : 1;
      this.apply('wave', wave * seam, local);
      if (this.waveSeam) {
        this.waveSeam.enabled = true;
        this.waveSeam.time = period + local;
        this.waveSeam.setEffectiveWeight(wave * (1 - seam));
      }
    }
    this.mixer.update(0);
    if (updateWorld) this.root.updateMatrixWorld(true);
  }

  aim(target: Vector3, dt: number, state: Quaternion, speed = 1) {
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
      Math.max(-0.55, Math.min(0.55, Math.atan2(this.direction.x, this.direction.z))),
      0
    );
    this.target.setFromEuler(this.angles);
    this.offset.slerp(this.target, 1 - Math.exp(-1.2 * speed * dt));
    state.slerp(this.offset, 1 - Math.exp(-2.2 * speed * dt));
    this.head.quaternion.copy(state);
    this.root.updateMatrixWorld(true);
  }
}
