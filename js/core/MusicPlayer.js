/**
 * MusicPlayer: soft, low-volume lo-fi background music, generated live
 * with Web Audio (no files). Mellow electric-piano 7th chords, round sine
 * bass, a sparse melody through a gentle echo, brushed drums with a lazy
 * swing and a faint vinyl crackle - all behind a warm low-pass filter.
 *
 * Two variations: 'menu' and 'game' (same vibe, different chords).
 * Shares the AudioContext owned by SoundFX. A shared instance `Music`
 * is exposed at the bottom of this file.
 */
class MusicPlayer {
  static DEFAULT_VOLUME = 0.22;

  // Chord voicings (MIDI). root = bass note.
  static CHORDS = {
    Cmaj7: { root: 36, tones: [60, 64, 67, 71] },
    Am7: { root: 45, tones: [57, 60, 64, 67] },
    Fmaj7: { root: 41, tones: [57, 60, 64, 65] },
    G6: { root: 43, tones: [55, 59, 62, 64] },
    Em7: { root: 40, tones: [55, 59, 62, 64] },
    Dm7: { root: 38, tones: [57, 60, 62, 65] },
  };

  static TRACKS = {
    menu: { bpm: 76, bars: ['Cmaj7', 'Am7', 'Fmaj7', 'G6', 'Cmaj7', 'Am7', 'Fmaj7', 'G6'] },
    game: { bpm: 82, bars: ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7', 'Fmaj7', 'Em7', 'Dm7', 'G6'] },
  };

  // Sparse lead: per bar, [step (0-15), midi, length in steps]
  static MELODY = [
    [[2, 76, 4], [8, 74, 3], [12, 72, 4]],
    [[4, 69, 6], [12, 72, 3]],
    [[0, 74, 4], [6, 76, 4], [12, 79, 4]],
    [[2, 76, 3], [6, 74, 8]],
    [[2, 79, 4], [8, 81, 3], [12, 79, 4]],
    [[4, 76, 6], [12, 74, 3]],
    [[0, 72, 4], [6, 74, 3], [10, 76, 6]],
    [[4, 74, 10]],
  ];

  constructor() {
    this.track = null;
    this.playing = false;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.bus = null;
    this.duckLevel = 1;
  }

  get enabled() {
    return GameConfig.get('musicEnabled');
  }

  _ctx() {
    return Sfx._getCtx();
  }

  _ensureBus(c) {
    if (this.bus) return;
    this.bus = c.createGain();
    this.bus.gain.value = 0;
    const warm = c.createBiquadFilter();
    warm.type = 'lowpass';
    warm.frequency.value = 2400;
    warm.Q.value = 0.4;
    this.bus.connect(warm);
    warm.connect(c.destination);

    // Gentle echo for the lead
    this.echoIn = c.createGain();
    const delay = c.createDelay(1);
    delay.delayTime.value = 0.42;
    const fb = c.createGain();
    fb.gain.value = 0.28;
    const tone = c.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1400;
    this.echoIn.connect(delay);
    delay.connect(tone);
    tone.connect(fb);
    fb.connect(delay);
    tone.connect(this.bus);
  }

  _targetGain() {
    return MusicPlayer.DEFAULT_VOLUME * this.duckLevel;
  }

  /** Starts (or switches to) a track. Safe to call repeatedly. */
  play(name) {
    this.wanted = name;
    if (!this.enabled) return;
    const c = this._ctx();
    if (!c) return;
    this._ensureBus(c);
    if (this.playing && this.track === MusicPlayer.TRACKS[name]) return;
    this.track = MusicPlayer.TRACKS[name];
    this.step = 0;
    this.nextTime = c.currentTime + 0.1;
    this.bus.gain.cancelScheduledValues(c.currentTime);
    this.bus.gain.setTargetAtTime(this._targetGain(), c.currentTime, 0.8);
    if (!this.playing) {
      this.playing = true;
      this.timer = setInterval(() => this._schedule(), 25);
    }
  }

  stop(fade = 0.6) {
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    const c = this.bus && this._ctx();
    if (c) this.bus.gain.setTargetAtTime(0, c.currentTime, fade / 3);
  }

  /** Re-applies the on/off setting (called from the MUSIC toggles). */
  refresh() {
    if (this.enabled) this.play(this.wanted || 'menu');
    else this.stop(0.3);
  }

  /** Lowers the music (e.g. while an ad plays). */
  duck(on, level = 0.3) {
    this.duckLevel = on ? level : 1;
    const c = this.bus && this._ctx();
    if (c && this.playing) this.bus.gain.setTargetAtTime(this._targetGain(), c.currentTime, 0.15);
  }

  _schedule() {
    const c = this._ctx();
    if (!c || !this.playing) return;
    const stepDur = 60 / this.track.bpm / 4;
    while (this.nextTime < c.currentTime + 0.15) {
      this._playStep(this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % (this.track.bars.length * 16);
    }
  }

  _playStep(step, t0, dur) {
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const chord = MusicPlayer.CHORDS[this.track.bars[bar]];
    // Lazy swing on the off-beat 8ths
    const t = s % 4 === 2 ? t0 + dur * 0.33 : t0;

    // Electric-piano chord: full on the downbeat, a softer push on the "and of 3"
    if (s === 0) chord.tones.forEach((m, i) => this._keys(m, t + i * 0.012, dur * 14, 0.034));
    if (s === 10) chord.tones.slice(1).forEach((m, i) => this._keys(m + 12, t + i * 0.015, dur * 5, 0.016));

    // Round bass
    if (s === 0) this._bass(chord.root, t, dur * 7, 0.11);
    if (s === 10) this._bass(chord.root + 7, t, dur * 4, 0.07);

    // Sparse melody through the echo
    MusicPlayer.MELODY[bar].forEach(([st, midi, len]) => {
      if (st === s) this._lead(midi, t, dur * len, 0.03);
    });

    // Brushed drums
    if (s === 0 || s === 9) this._kick(t, 0.1);
    if (s === 4 || s === 12) this._noise(t, 0.09, 0.022, 2200, 'bandpass', 0.8);
    if (s % 2 === 0) this._noise(t, 0.035, s % 4 === 2 ? 0.01 : 0.006, 8000, 'highpass', 0.7);

    // Vinyl crackle
    if (Math.random() < 0.18) this._noise(t0 + Math.random() * dur, 0.006, 0.012, 3000, 'highpass', 0.5);
  }

  _freq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /** Mellow electric piano: sine + quiet detuned triangle, soft attack, long decay. */
  _keys(midi, t, len, vol) {
    const c = this._ctx();
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + len * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    g.connect(this.bus);
    [
      ['sine', 0, 1],
      ['triangle', 6, 0.25],
    ].forEach(([type, cents, mix]) => {
      const o = c.createOscillator();
      const m = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(this._freq(midi), t);
      o.detune.value = cents;
      m.gain.value = mix;
      o.connect(m);
      m.connect(g);
      o.start(t);
      o.stop(t + len + 0.05);
    });
  }

  _bass(midi, t, len, vol) {
    const c = this._ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(this._freq(midi), t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(vol * 0.5, t + len * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g);
    g.connect(this.bus);
    o.start(t);
    o.stop(t + len + 0.05);
  }

  _lead(midi, t, len, vol) {
    const c = this._ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(this._freq(midi), t);
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.frequency.value = 5;
    lg.gain.value = 3;
    lfo.connect(lg);
    lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g);
    g.connect(this.bus);
    g.connect(this.echoIn);
    o.start(t);
    lfo.start(t);
    o.stop(t + len + 0.05);
    lfo.stop(t + len + 0.05);
  }

  _kick(t, vol) {
    const c = this._ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.14);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g);
    g.connect(this.bus);
    o.start(t);
    o.stop(t + 0.22);
  }

  _noise(t, len, vol, freq, type, q) {
    const c = this._ctx();
    const src = c.createBufferSource();
    src.buffer = Sfx._getNoise(c);
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f);
    f.connect(g);
    g.connect(this.bus);
    src.start(t);
    src.stop(t + len + 0.02);
  }
}

const Music = new MusicPlayer();
