/**
 * Tiny procedural audio engine (no audio files needed):
 * an ambient ocean bed plus a few synthesized sound effects.
 */
class AudioEngine {
  ctx = null;
  master = null;
  volume = 0.6;
  oceanStarted = false;

  ensure() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  /** Call from a user gesture. */
  unlock() {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!this.oceanStarted) this.startOcean();
  }

  startOcean() {
    const ctx = this.ctx;
    this.oceanStarted = true;
    const len = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain).connect(gain.gain);
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    lfo.start();
  }

  tone(freq, dur = 0.15, type = 'sine', vol = 0.25, delay = 0) {
    const ctx = this.ensure();
    if (!ctx || this.volume <= 0) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  pickup() { this.tone(880, 0.1, 'triangle'); this.tone(1320, 0.12, 'triangle', 0.2, 0.07); }
  success() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.22, i * 0.1)); }
  error() { this.tone(200, 0.2, 'square', 0.1); }
  click() { this.tone(660, 0.05, 'sine', 0.12); }
  splash() { this.tone(300, 0.3, 'sawtooth', 0.05); }
}

export const audio = new AudioEngine();
