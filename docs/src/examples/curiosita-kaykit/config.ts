/** Robot height in world units — the regia measures every camera move in H. */
export const H = 2.2;

export const settings = {
  duration: 22,

  // beat markers (seconds) — one shared timeline for camera, crowd, fog, sound, UI
  walkStart: 0.25,
  walkEnd: 2.35,
  firstHopAt: 2.6,
  reactionAt: 3.4,
  contagionAt: 4.5,
  pullBackAt: 6.0,
  revealAt: 8.0,
  arcAt: 10.0,
  cutAt: 12.0,
  escalationAt: 14.0,
  holdAt: 17.0,
  payoffAt: 18.5,
  finaleAt: 20.0,
  finalHopAt: 20.6,
  responseAt: 21.4,

  // crowd choreography
  maxInstances: 8000,
  hopSpeed: 0.06,
  waveSpeed: 0.04,
  cheerSpeed: 0.012,

  // hero
  headFollow: 0.38,
  bodyFollow: 2.5,

  // payoff overlay (scene 11)
  showPayoff: true
};

export type Settings = typeof settings;
