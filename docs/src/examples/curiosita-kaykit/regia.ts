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
  group2: Vector3;
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
  const group2 = anchors.group2;
  const group2Chest = new Vector3(group2.x, 1.25, group2.z);
  const group2WideEye = new Vector3(group2.x - 3.8, 1.75 * H, group2.z + 15);
  const group2Eye = new Vector3(group2.x - 2.6, 1.4 * H, group2.z + 9);

  // A — Mystery Wide · B — Character · B2 — Reaction · B3 — Contagion
  // C — Crowd Medium · D — Crowd High · D2 — Choreography arc
  // E — Character Cut · F — Massive Wide · G — Final Character
  const keys: Key[] = [
    key([0, 1.3 * H, 12], heroChest, 44),                                        // 0  A   closer opening
    key([0, 1.3 * H, 12], heroChest, 44),                                        // 1      the robots walk in
    key([0, 1.3 * H, 12], heroChest, 44, easeInOutSine),                         // 2  B   hold for greeting
    key([0, 1.3 * H, 12], heroChest, 44),                                        // 3      hold through the call
    key([0, 1.3 * H, 12], heroChest, 44),                                        // 4  hold after celebration
    key([0, 1.3 * H, 12], heroChest, 44),                                        // 5  hold before the panorama
    key([0, 1.3 * H, 12], heroChest, 44),                                        // 6  C   panorama starts directly
    key([0, 6 * H, -2], midCrowd, 48, easeInOutCubic),                           // 7  D   crane over the crowd
    key([9, 6.6 * H, -3], deepCrowd, 48, easeInOutSine),                         // 8  D2  lateral arc
    key([groupEye.x, groupEye.y, groupEye.z], groupChest, 34),                   // 9  E   CUT individuals
    key([groupEye.x, groupEye.y, groupEye.z], groupChest, 34),                   // 10     hold
    key([group2WideEye.x, group2WideEye.y, group2WideEye.z], group2Chest, 38),   // 11     second detail dolly start
    key([group2Eye.x, group2Eye.y, group2Eye.z], group2Chest, 34, easeInOutSine), // 12     dolly in / hold
    key([0, 12 * H, -18], massCenter, 50, easeInOutQuint),                       // 13 F   escalation
    key([0, 12 * H, -18], massCenter, 50),                                       // 14     hold
    key([0, 12 * H, -18], massCenter, 48.5),                                     // 15     fov drift
    key([0, 1.4 * H, 13], heroChest, 35),                                        // 16 G   CUT hero
    key([0, 1.4 * H, 12], heroChest, 35, easeInOutCubic),                        // 17 G2  micro push-in
    key([0, 1.4 * H, 12], heroChest, 35)                                         // 18     hold
  ];

  const times: number[] = new Array(keys.length).fill(0);
  // Keep the distant field invisible until the hero has finished greeting;
  // camera movement then becomes the reveal mechanism.
  // Fog remains sealed through the call and opens only with the first camera
  // move, so the crowd never pops into view before the panorama starts.
  const fogTimes = [0, settings.greetHeroAt + 1.3, settings.revealAt, settings.arcAt, settings.cutAt, settings.escalationAt, settings.holdAt, settings.duration];
  // Once the camera rises, clear the near field and leave haze only on the
  // distant rows; the closer fog returns when the later details begin.
  const fogNear = [10, 10, 16, 4, 4, 8, 15, 12];
  const fogFar = [18, 18, 42, 150, 150, 110, 150, 220];

  function refreshTimes() {
    const s = settings;
    times[0] = 0;
    times[1] = s.walkStart;
    times[2] = s.walkEnd + 0.2;
    times[3] = s.crowdCallEnd;
    times[4] = s.reactionAt + 1.1;
    times[5] = s.pullBackAt;
    times[6] = s.revealAt;
    times[7] = s.arcAt;
    times[8] = s.cutAt;
    times[9] = s.cutAt;
    times[10] = s.cutAt + 2.2;
    times[11] = s.cutAt + 2.2;
    times[12] = s.cutAt + 4.6;
    // Give the detail-to-panorama release a readable 1.6 s crane-out.
    times[13] = s.holdAt + 1.2;
    times[14] = s.payoffAt;
    times[15] = s.finaleAt;
    times[16] = s.finaleAt;
    times[17] = s.finalHopAt + 0.4;
    times[18] = s.duration;
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
