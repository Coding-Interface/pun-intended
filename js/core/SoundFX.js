/**
 * SoundFX: tiny synthesized sound kit (Web Audio, no asset files).
 * A single shared instance `Sfx` is exposed at the bottom of this file.
 */
class SoundFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
  }

  get enabled() {
    return GameConfig.get('soundEnabled');
  }

  /** Call from any user gesture - browsers keep audio locked until then. */
  unlock() {
    this._getCtx();
  }

  _getCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.master.gain.value = GameConfig.get('sfxVolume');
    return this.ctx;
  }

  _getNoise(c) {
    if (!this.noiseBuffer) {
      const len = c.sampleRate * 0.6;
      this.noiseBuffer = c.createBuffer(1, len, c.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuffer;
  }

  _tone(freq, type, duration, vol, opts = {}) {
    if (!this.enabled) return;
    try {
      const c = this._getCtx();
      if (!c) return;
      const t0 = c.currentTime + (opts.delay || 0);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + duration);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + (opts.attack || 0.006));
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    } catch (e) {
      /* audio is optional */
    }
  }

  _noise(duration, vol, opts = {}) {
    if (!this.enabled) return;
    try {
      const c = this._getCtx();
      if (!c) return;
      const t0 = c.currentTime + (opts.delay || 0);
      const src = c.createBufferSource();
      src.buffer = this._getNoise(c);
      const filter = c.createBiquadFilter();
      filter.type = opts.filter || 'bandpass';
      filter.Q.value = opts.q || 1.2;
      filter.frequency.setValueAtTime(opts.from || 800, t0);
      filter.frequency.exponentialRampToValueAtTime(opts.to || 3000, t0 + duration);
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t0);
      src.stop(t0 + duration + 0.02);
    } catch (e) {
      /* audio is optional */
    }
  }

  click() {
    this._tone(620, 'triangle', 0.07, 0.25, { slideTo: 760 });
  }

  hover() {
    this._tone(980, 'sine', 0.05, 0.06);
  }

  pop(step = 0) {
    const f = 480 * Math.pow(1.06, step);
    this._tone(f, 'triangle', 0.1, 0.3, { slideTo: f * 1.5 });
  }

  drop() {
    this._tone(520, 'triangle', 0.1, 0.22, { slideTo: 280 });
  }

  deal(step = 0) {
    this._tone(700 + step * 30, 'sine', 0.05, 0.08);
  }

  flip() {
    this._noise(0.14, 0.35, { from: 1800, to: 6000, q: 0.8 });
  }

  whoosh() {
    this._noise(0.45, 0.4, { from: 300, to: 2800, q: 0.7 });
  }

  correct() {
    [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 'triangle', 0.22, 0.26, { delay: i * 0.07 }));
  }

  wrong() {
    this._tone(240, 'sawtooth', 0.2, 0.14, { slideTo: 150 });
    this._tone(180, 'square', 0.24, 0.08, { delay: 0.09, slideTo: 110 });
  }

  combo(level) {
    const base = 660 * Math.pow(1.122, Math.min(level, 8));
    this._tone(base, 'square', 0.12, 0.1, { delay: 0.3 });
    this._tone(base * 1.5, 'square', 0.18, 0.1, { delay: 0.38 });
  }

  hint() {
    [1320, 1568, 1760, 2093, 2637].forEach((f, i) => this._tone(f, 'sine', 0.14, 0.12, { delay: i * 0.045 }));
  }

  key() {
    this._tone(760 + Math.random() * 60, 'triangle', 0.05, 0.14);
  }

  zoom(open = true) {
    this._tone(open ? 420 : 700, 'sine', 0.16, 0.16, { slideTo: open ? 820 : 360 });
  }

  star(i) {
    const f = 784 * Math.pow(1.26, i);
    this._tone(f, 'triangle', 0.3, 0.28);
    this._tone(f * 2, 'sine', 0.3, 0.08, { delay: 0.03 });
  }

  fanfare() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((f, i) => this._tone(f, 'triangle', i === notes.length - 1 ? 0.6 : 0.16, 0.24, { delay: i * 0.1 }));
  }

  tick() {
    this._tone(1200, 'square', 0.03, 0.05);
  }
}

const Sfx = new SoundFX();
