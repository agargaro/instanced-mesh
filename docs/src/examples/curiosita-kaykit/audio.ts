export class KayKitAudio {
  ctx: AudioContext | null = null;
  master!: GainNode;
  enabled = false;
  private samples = new Map<string, AudioBuffer>();
  private sampleLoading: Promise<void> | null = null;
  private music?: AudioBufferSourceNode;
  private musicGain?: GainNode;

  async toggle() {
    if (!this.ctx) this.init();
    await this.ctx!.resume();
    await this.loadSamples();
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.linearRampToValueAtTime(this.enabled ? 0.18 : 0, this.ctx!.currentTime + 0.25);
    if (this.enabled) {
      this.startMusic();
      this.musicGain?.gain.linearRampToValueAtTime(0.065, this.ctx!.currentTime + 0.4);
    }
    else if (this.musicGain) this.musicGain.gain.linearRampToValueAtTime(0.0001, this.ctx!.currentTime + 0.25);
    return this.enabled;
  }

  private async loadSamples() {
    if (this.sampleLoading) return this.sampleLoading;
    const files: Record<string, string> = {
      foot0: 'footstep-metal-0.ogg', foot1: 'footstep-metal-1.ogg', foot2: 'footstep-metal-2.ogg',
      greeting: 'metal-greeting.ogg', call: 'robot-call.ogg', cheerVoice: 'robot-cheer.ogg', music: 'music-loop.ogg'
    };
    this.sampleLoading = Promise.all(Object.entries(files).map(async ([name, file]) => {
      const response = await fetch(`/instanced-mesh/kaykit/audio/${file}`);
      if (!response.ok) return;
      this.samples.set(name, await this.ctx!.decodeAudioData(await response.arrayBuffer()));
    })).then(() => undefined);
    return this.sampleLoading;
  }

  private playSample(name: string, gain = 0.2, rate = 1) {
    if (!this.enabled || !this.ctx) return;
    const buffer = this.samples.get(name);
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    source.connect(g).connect(this.master);
    source.start();
  }

  footstep(variant = 0, intensity = 1) {
    this.playSample(`foot${variant % 3}`, 0.22 * intensity, 0.94 + (variant % 4) * 0.035);
  }

  greetingVoice() { this.playSample('greeting', 0.16, 1.05); }
  crowdCall() { this.playSample('call', 0.13, 0.96); }
  crowdVoice() { this.playSample('cheerVoice', 0.12, 1.02); }

  private startMusic() {
    if (!this.ctx || this.music || !this.samples.get('music')) return;
    this.music = this.ctx.createBufferSource();
    this.music.buffer = this.samples.get('music')!;
    this.music.loop = true;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.0001;
    this.music.connect(this.musicGain).connect(this.master);
    this.music.start();
    this.musicGain.gain.linearRampToValueAtTime(0.065, this.ctx.currentTime + 1.2);
  }

  private init() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const padOsc = ctx.createOscillator();
    padOsc.type = 'sawtooth';
    padOsc.frequency.value = 38;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.06;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 420;
    padOsc.connect(padFilter).connect(padGain).connect(master);
    padOsc.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain).connect(padFilter.frequency);
    lfo.start();
    this.ctx = ctx;
    this.master = master;
  }

  blip(freq: number, dur: number, gain = 0.14) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + dur + 0.05);
  }

  /** Anticipation before a hop. */
  boop() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + 0.14);
  }

  /** Landing tap — the rhythmic element of the contagion. */
  tap(intensity = 1) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.16 * intensity, ctx.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.13);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + 0.15);
    this.noiseBurst(0.06, 1500, 0.045 * intensity);
  }

  /** Soft UI click for the technical payoff. */
  click() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + 0.06);
  }

  /** Small body hop: pitch-down thump plus a soft noise puff. */
  hop(intensity = 1) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(220 * intensity, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2 * intensity, ctx.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + 0.24);
    this.noiseBurst(0.16, 900, 0.05 * intensity);
  }

  /** Filtered noise sweep for dolly / crane moves. */
  whoosh(duration = 1.2) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(220, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + duration * 0.55);
    bp.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + duration * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    src.connect(bp).connect(g).connect(this.master);
    src.start();
    src.stop(ctx.currentTime + duration + 0.05);
  }

  /** Rising tone for the escalation pull-back. */
  riser(duration = 2.5) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(110, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + duration * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration + 0.2);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + duration + 0.25);
  }

  /** Low impact for the grand reveal hold. */
  boom() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + 0.95);
    this.noiseBurst(0.5, 420, 0.06);
  }

  /** Crowd cheer: bright chord plus a band-passed noise swell. */
  cheer(intensity = 1) {
    if (!this.enabled || !this.ctx) return;
    [523, 659, 784, 1046].forEach((f, i) => {
      const t = this.ctx!.currentTime + i * 0.11;
      const o = this.ctx!.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13 * intensity, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      const filt = this.ctx!.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.value = 320;
      o.connect(filt).connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.65);
    });
    const len = this.ctx!.sampleRate * 0.6;
    const buf = this.ctx!.createBuffer(1, len, this.ctx!.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2) * 0.25;
    const src = this.ctx!.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx!.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    const g2 = this.ctx!.createGain();
    g2.gain.setValueAtTime(0.0001, this.ctx!.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.09 * intensity, this.ctx!.currentTime + 0.04);
    g2.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + 0.6);
    src.connect(bp).connect(g2).connect(this.master);
    src.start();
  }

  private noiseBurst(duration: number, frequency: number, gain: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = frequency;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(bp).connect(g).connect(this.master);
    src.start();
  }
}

export const kaykitAudio = new KayKitAudio();

export function createSoundButton(audio: KayKitAudio): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = 'SOUND OFF';
  btn.style.cssText =
    'position:fixed;bottom:18px;right:18px;z-index:9997;padding:8px 12px;background:rgba(10,16,28,0.78);color:#e8f0ff;border:1px solid rgba(99,160,255,0.22);font:700 11px/1 JetBrains Mono,monospace;letter-spacing:0.12em;cursor:pointer;';
  btn.onclick = async () => {
    const on = await audio.toggle();
    btn.textContent = on ? 'SOUND ON' : 'SOUND OFF';
    btn.style.borderColor = on ? 'rgba(99,160,255,0.55)' : 'rgba(99,160,255,0.22)';
    if (on) {
      audio.blip(660, 0.09, 0.08);
      setTimeout(() => audio.blip(990, 0.12, 0.08), 90);
    }
  };
  document.body.appendChild(btn);
  return btn;
}
