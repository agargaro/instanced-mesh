/** Robot height in world units — the regia measures every camera move in H. */
export const H = 2.2;

export const settings = {
  duration: 30.4,
  seed: 72491,

  // beat markers (seconds) — one shared timeline for camera, crowd, fog, sound, UI
  walkStart: 0.25,
  walkEnd: 2.35,
  firstHopAt: 2.6,
  greetHeroAt: 5.2,
  greetBAt: 8.45,
  greetWalkerAt: 5.45,
  greetingSpacing: 3,
  celebrateAt: 10.9,
  crowdCallEnd: 11.7,
  greetingEnd: 10.9,
  reactionAt: 11.1,
  contagionAt: 12.2,
  pullBackAt: 13.7,
  revealAt: 15.7,
  arcAt: 17.7,
  cutAt: 19.7,
  escalationAt: 21.7,
  holdAt: 24.7,
  payoffAt: 26.2,
  finaleAt: 27.7,
  finalHopAt: 28.3,
  responseAt: 29.1,

  // crowd capacity (behavior is independent of the camera timeline)
  maxInstances: 8000,

  // hero
  headFollow: 0.38,
  // Head leads the attention change; the body follows a beat later.
  bodyFollow: 1.15,

  // payoff overlay (scene 11)
  showPayoff: true
};

export type Settings = typeof settings;
