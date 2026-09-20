import { Vector3 } from 'three';
import { H, settings } from './config.js';
import { camera, fog } from './world.js';
import { easeInOutCubic, easeInOutQuint, easeInOutSine, linear, segment, type Ease } from './math.js';

/**
 * One rigged camera, seven poses (A–G), seventeen keyframes and two cuts.
 * The camera never interpolates its rotation: we animate `position`, an
 * invisible `target` and `fov`, then lookAt the target every frame.
 *
 * Scene 01–02: the camera is completely still and the robots walk to it.
 * The crowd lives behind the hero (deep −Z); until the reveal the fog opens
 * just enough behind him to hide it.
 */

export type RegiaAnchors = {
  robotB: Vector3;
  group: Vector3;
};

type Key = { pos: Vector3; target: Vector3; fov: number; ease: Ease };

const key = (pos: [number, number, number], target: Vector3, fov: number, ease: Ease = linear): Key => ({
  pos: new Vector3(...pos),
  target: target.clone(),
  fov,
  ease
});

export function createRegia(anchors: RegiaAnchors) {
  const heroChest = new Vector3(0, 1.15, 0);
  const b = anchors.robotB;
  const bChest = new Vector3(b.x, 1.05, b.z);
  const heroToB = new Vector3().lerpVectors(heroChest, bChest, 0.5);
  const cluster = new Vector3(1, 0.9, -9);
  const nearCrowd = new Vector3(0, 1.5, -16);
  const midCrowd = new Vector3(0, 2, -45);
  const deepCrowd = new Vector3(0, 2, -55);
  const massCenter = new Vector3(0, 2, -95);
  const group = anchors.group;
  const groupChest = new Vector3(group.x, 1.25, group.z);
  const groupEye = new Vector3(group.x + 2.6, 1.4 * H, group.z + 7);

  // A — Mystery Wide · B — Character · B2 — Reaction · B3 — Contagion
  // C — Crowd Medium · D — Crowd High · D2 — Choreography arc
  // E — Character Cut · F — Massive Wide · G — Final Character
  const keys: Key[] = [
    key([0, 1.3 * H, 20], heroChest, 40),                                        // 0  A   fixed wide
    key([0, 1.3 * H, 20], heroChest, 40),                                        // 1      the robots walk in
    key([0, 1.3 * H, 20], heroChest, 35, easeInOutSine),                         // 2  B   same camera, tighter fov
    key([0, 1.3 * H, 20], heroChest, 35),                                        // 3      hold
    key([1.5 * H, 1.3 * H, 19], heroToB, 35, easeInOutCubic),                    // 4  B2  truck / reaction
    key([2 * H, 1.3 * H, 20.5], cluster, 36, easeInOutSine),                     // 5  B3  contagion drift
    key([2, 2 * H, 24], nearCrowd, 42, easeInOutCubic),                          // 6  C   pull back
    key([0, 6 * H, -2], midCrowd, 48, easeInOutCubic),                           // 7  D   crane over the crowd
    key([9, 6.6 * H, -3], deepCrowd, 48, easeInOutSine),                         // 8  D2  lateral arc
    key([groupEye.x, groupEye.y, groupEye.z], groupChest, 34),                   // 9  E   CUT individuals
    key([groupEye.x, groupEye.y, groupEye.z], groupChest, 34),                   // 10     hold
    key([0, 12 * H, -18], massCenter, 50, easeInOutQuint),                       // 11 F   escalation
    key([0, 12 * H, -18], massCenter, 50),                                       // 12     hold
    key([0, 12 * H, -18], massCenter, 48.5),                                     // 13     fov drift
    key([0, 1.4 * H, 13], heroChest, 35),                                        // 14 G   CUT hero
    key([0, 1.4 * H, 12], heroChest, 35, easeInOutCubic),                        // 15 G2  micro push-in
    key([0, 1.4 * H, 12], heroChest, 35)                                         // 16     hold
  ];

  const times: number[] = new Array(keys.length).fill(0);
  const fogTimes = [0, 3.2, 4.5, 6.0, 8.0, 10.0, 14.0, 22.0];
  const fogNear = [34, 34, 20, 20, 18, 15, 12, 12];
  const fogFar = [38, 38, 60, 60, 110, 150, 210, 220];

  function refreshTimes() {
    const s = settings;
    times[0] = 0;
    times[1] = s.walkStart;
    times[2] = s.walkEnd + 0.2;
    times[3] = s.reactionAt - 0.2;
    times[4] = s.reactionAt + 1.1;
    times[5] = s.pullBackAt;
    times[6] = s.revealAt;
    times[7] = s.arcAt;
    times[8] = s.cutAt;
    times[9] = s.cutAt;
    times[10] = s.escalationAt;
    times[11] = s.holdAt;
    times[12] = s.payoffAt;
    times[13] = s.finaleAt;
    times[14] = s.finaleAt;
    times[15] = s.finalHopAt + 0.4;
    times[16] = s.duration;
  }

  const _pos = new Vector3();
  const _target = new Vector3();
  let lastFogNear = -1;
  let lastFogFar = -1;

  function update(time: number) {
    refreshTimes();
    const { i, u } = segment(time, times);
    const k0 = keys[i];
    const k1 = keys[Math.min(i + 1, keys.length - 1)];
    const e = k1.ease(u);
    _pos.lerpVectors(k0.pos, k1.pos, e);
    _target.lerpVectors(k0.target, k1.target, e);
    camera.position.copy(_pos);
    camera.lookAt(_target);
    const fov = k0.fov + (k1.fov - k0.fov) * e;
    if (Math.abs(camera.fov - fov) > 1e-4) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    const f = segment(time, fogTimes);
    const fi = Math.min(f.i, fogNear.length - 2);
    const near = fogNear[fi] + (fogNear[fi + 1] - fogNear[fi]) * f.u;
    const far = fogFar[fi] + (fogFar[fi + 1] - fogFar[fi]) * f.u;
    if (Math.abs(near - lastFogNear) > 0.0015 || Math.abs(far - lastFogFar) > 0.0015) {
      lastFogNear = near;
      lastFogFar = far;
      fog.near = near;
      fog.far = Math.max(near + 1, far);
    }
  }

  return { update, keys, times };
}
