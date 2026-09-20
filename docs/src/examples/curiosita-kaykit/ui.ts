import { Pane } from 'tweakpane';
import { settings } from './config.js';

interface ScenePane {
  addBinding(t: any, k: any, o: any): any;
  addButton(o: any): any;
  addFolder(o: any): ScenePane;
}

export const isDebug = location.hash === '#debug';

export const pane = new Pane({ title: 'KayKit · direction' }) as unknown as ScenePane;

const updatePaneVisibility = () => {
  const debug = location.hash === '#debug';
  const el = document.querySelector('.tp-dfwv') as HTMLElement | null;
  if (el) el.style.display = debug ? 'block' : 'none';
  (pane as any).element.hidden = !debug;
};
setTimeout(updatePaneVisibility, 80);
window.addEventListener('hashchange', updatePaneVisibility);

const timeline = pane.addFolder({ title: 'Timeline (s)' });
timeline.addBinding(settings, 'duration', { min: 12, max: 40, step: 0.5, label: 'Duration' });
timeline.addBinding(settings, 'walkStart', { min: 0, max: 40, step: 0.05, label: 'Walk in' });
timeline.addBinding(settings, 'walkEnd', { min: 0.5, max: 40, step: 0.05, label: 'Walk end' });
timeline.addBinding(settings, 'firstHopAt', { min: 0, max: 40, step: 0.05, label: 'First hop' });
timeline.addBinding(settings, 'reactionAt', { min: 0, max: 40, step: 0.05, label: 'Reaction' });
timeline.addBinding(settings, 'contagionAt', { min: 2, max: 40, step: 0.05, label: 'Contagion' });
timeline.addBinding(settings, 'pullBackAt', { min: 2, max: 40, step: 0.05, label: 'Pull back' });
timeline.addBinding(settings, 'revealAt', { min: 3, max: 40, step: 0.05, label: 'Community' });
timeline.addBinding(settings, 'arcAt', { min: 4, max: 40, step: 0.05, label: 'Arc' });
timeline.addBinding(settings, 'cutAt', { min: 5, max: 40, step: 0.05, label: 'Cut actors' });
timeline.addBinding(settings, 'escalationAt', { min: 6, max: 40, step: 0.05, label: 'Escalation' });
timeline.addBinding(settings, 'holdAt', { min: 8, max: 40, step: 0.05, label: 'Hold' });
timeline.addBinding(settings, 'payoffAt', { min: 10, max: 40, step: 0.05, label: 'Payoff' });
timeline.addBinding(settings, 'finaleAt', { min: 12, max: 40, step: 0.05, label: 'Finale' });
timeline.addBinding(settings, 'finalHopAt', { min: 13, max: 40, step: 0.05, label: 'Final hop' });
timeline.addBinding(settings, 'responseAt', { min: 14, max: 40, step: 0.05, label: 'Crowd response' });

const cameraFolder = pane.addFolder({ title: 'Camera' });
cameraFolder.addBinding(settings, 'headFollow', { min: 0, max: 1, label: 'Head follow' });
cameraFolder.addBinding(settings, 'bodyFollow', { min: 0, max: 6, label: 'Body turn' });

const crowdFolder = pane.addFolder({ title: 'Crowd' });
crowdFolder.addBinding(settings, 'showPayoff', { label: 'Payoff overlay' });

export const maxInstancesBinding: any = crowdFolder.addBinding(settings, 'maxInstances', {
  min: 500,
  max: 8000,
  step: 100,
  label: 'Instances'
});

export const speedMonitor = { speed: 0 };
export const timeMonitor = { time: 0, beat: '—' };
if (isDebug) {
  pane.addBinding(speedMonitor, 'speed', { readonly: true, view: 'graph', min: 0, max: 30, label: 'Camera m/s' });
  pane.addBinding(timeMonitor, 'time', { readonly: true, label: 'Time' });
  pane.addBinding(timeMonitor, 'beat', { readonly: true, label: 'Beat' });
}

// ──────────── ⚡ OVERDRIVE — technical payoff (beat 11) ────────────
export const finalStats = document.createElement('div');
finalStats.id = 'final-stats';
finalStats.style.cssText =
  'position:fixed;top:6%;left:50%;transform:translateX(-50%);color:#e8f0ff;display:none;opacity:0;transition:opacity 0.2s linear;z-index:9998;text-align:center;pointer-events:none;min-width:560px;';
finalStats.innerHTML = `
  <div style="font:400 11px/1 JetBrains Mono,monospace;letter-spacing:0.22em;opacity:0.6;text-transform:uppercase;margin-bottom:10px">INSTANCEDMESH2 — LIVE TELEMETRY</div>
  <div style="font:300 clamp(3.2rem,7vw,5.8rem)/0.86 Cormorant Garamond, Georgia, serif;letter-spacing:-0.02em;text-shadow:0 0 24px rgba(99,160,255,0.45),0 2px 32px rgba(0,0,0,0.75)">InstancedMesh<span style="font-weight:500;color:#a8c1ff">2</span></div>
  <div style="margin:12px auto 0;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;max-width:640px">
    <div style="background:rgba(12,18,32,0.72);border:1px solid rgba(99,160,255,0.22);padding:10px 8px"><div style="font:700 10px/1 JetBrains Mono,monospace;letter-spacing:0.14em;opacity:0.6">AVG FPS</div><div id="stat-fps" style="font:700 22px/1 Inter,system-ui;margin-top:4px">—</div></div>
    <div style="background:rgba(12,18,32,0.72);border:1px solid rgba(99,160,255,0.22);padding:10px 8px"><div style="font:700 10px/1 JetBrains Mono,monospace;letter-spacing:0.14em;opacity:0.6">INSTANCES</div><div id="stat-inst" style="font:700 22px/1 Inter,system-ui;margin-top:4px">—</div></div>
    <div style="background:rgba(12,18,32,0.72);border:1px solid rgba(99,160,255,0.22);padding:10px 8px"><div style="font:700 10px/1 JetBrains Mono,monospace;letter-spacing:0.14em;opacity:0.6">TRIANGLES</div><div id="stat-tris" style="font:700 22px/1 Inter,system-ui;margin-top:4px">—</div></div>
    <div style="background:rgba(12,18,32,0.72);border:1px solid rgba(255,90,54,0.28);padding:10px 8px"><div style="font:700 10px/1 JetBrains Mono,monospace;letter-spacing:0.14em;opacity:0.6">DRAW CALLS</div><div id="stat-calls" style="font:700 22px/1 Inter,system-ui;margin-top:4px;color:#ffb347">—</div></div>
  </div>
  <div style="margin-top:10px;font:400 11px/1.5 Inter,system-ui;opacity:0.62;letter-spacing:0.02em">one InstancedMesh2 · skinned &amp; animated on the GPU · frustum-culled per instance</div>
  <div id="stats-lines" style="display:none"></div>
`;
document.body.appendChild(finalStats);

export function updateStatsOverlay(
  avgFps: number,
  crowdCount: number,
  info: { triangles: number; calls: number },
  elapsed: number
) {
  // ?debug keeps the overlay up for the whole run so it can be styled live.
  const always = new URLSearchParams(location.search).has('debug');
  const fade = settings.showPayoff ? (always ? 1 : Math.min(1, (elapsed - settings.payoffAt) / 0.35)) : 0;
  finalStats.style.display = fade > 0 ? 'block' : 'none';
  finalStats.style.opacity = String(Math.max(0, fade));
  if (fade <= 0) return;
  const elFps = document.getElementById('stat-fps');
  const elInst = document.getElementById('stat-inst');
  const elTris = document.getElementById('stat-tris');
  const elCalls = document.getElementById('stat-calls');
  if (elFps) elFps.textContent = avgFps.toFixed(1);
  if (elInst) elInst.textContent = `${crowdCount} / ${settings.maxInstances}`;
  if (elTris) elTris.textContent = `${(info.triangles / 1000).toFixed(1)}k`;
  if (elCalls) elCalls.textContent = `${info.calls}`;
}
