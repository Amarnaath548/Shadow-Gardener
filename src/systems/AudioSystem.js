export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientNodes = null;
    this.volume = 0.7;
    this.muted = false;
    this._ambientStarted = false;
    this._nextPluckTime = 0;
    this._nextCelloTime = 0;
    this._celloStep = 0;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.ctx = null;
    }
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    return this.muted;
  }

  tone(freq, dur, type = 'sine', gain = 0.15, attack = 0.01, decay = null) {
    if (!this.ctx) this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  chord(freqs, dur, type = 'sine', gain = 0.08) {
    freqs.forEach((f, i) => this.tone(f, dur, type, gain, 0.02, null));
  }

  playBloom() {
    this.chord([523.25, 659.25, 783.99], 0.6, 'triangle', 0.12);
  }

  playScorch() {
    this.tone(220, 0.35, 'sawtooth', 0.1);
    this.tone(196, 0.4, 'square', 0.06);
  }

  playWater() {
    this.tone(660, 0.15, 'sine', 0.08);
    setTimeout(() => this.tone(880, 0.2, 'sine', 0.06), 80);
  }

  playPrune() {
    this.tone(330, 0.12, 'square', 0.09);
    this.tone(247, 0.18, 'triangle', 0.07);
  }

  playClick() {
    this.tone(440, 0.06, 'square', 0.05);
  }

  playLevelComplete() {
    const seq = [523.25, 659.25, 783.99, 1046.5];
    seq.forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.14), i * 140));
  }

  playFail() {
    this.tone(196, 0.5, 'sawtooth', 0.1);
    setTimeout(() => this.tone(147, 0.6, 'sawtooth', 0.08), 200);
  }

  startAmbient() {
    if (this._ambientStarted) return;
    if (typeof window === 'undefined') return;
    this.ensure();
    if (!this.ctx) return;
    this._ambientStarted = true;

    const ctx = this.ctx;
    const sunBus = ctx.createGain();
    const shadeBus = ctx.createGain();
    sunBus.gain.value = 0;
    shadeBus.gain.value = 0;
    sunBus.connect(this.master);
    shadeBus.connect(this.master);

    this.ambientNodes = { sunBus, shadeBus };
    this._nextPluckTime = ctx.currentTime + 0.25;
    this._nextCelloTime = ctx.currentTime + 0.25;
  }

  _playMarimbaPluck(freq, time) {
    const ctx = this.ctx;
    if (!ctx || !this.ambientNodes) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.045, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);
    g.connect(this.ambientNodes.sunBus);

    const oscSine = ctx.createOscillator();
    oscSine.type = 'sine';
    oscSine.frequency.setValueAtTime(freq, time);
    oscSine.connect(g);
    oscSine.onended = () => {
      try { oscSine.disconnect(); } catch (e) {}
    };

    const oscTri = ctx.createOscillator();
    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(freq * 2, time);
    const triGain = ctx.createGain();
    triGain.gain.setValueAtTime(0.28, time);
    triGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
    oscTri.connect(triGain);
    triGain.connect(g);
    oscTri.onended = () => {
      try {
        oscTri.disconnect();
        triGain.disconnect();
        g.disconnect();
      } catch (e) {}
    };

    oscSine.start(time);
    oscTri.start(time);
    oscSine.stop(time + 0.48);
    oscTri.stop(time + 0.48);
  }

  _playCelloNote(freq, time, dur = 3.8) {
    const ctx = this.ctx;
    if (!ctx || !this.ambientNodes) return;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, time);
    filter.Q.setValueAtTime(1.1, time);

    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.032, time + 1.2);
    g.gain.setValueAtTime(0.032, time + dur - 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.ambientNodes.shadeBus);

    osc.onended = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        g.disconnect();
      } catch (e) {}
    };

    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  updateAmbient(sunElevation) {
    if (!this._ambientStarted) this.startAmbient();
    if (!this.ambientNodes || !this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const t = Math.max(0, Math.min(1, (sunElevation - 0.35) / 0.65));
    const sunMix = t;
    const shadeMix = 1 - t;

    this.ambientNodes.sunBus.gain.setTargetAtTime(sunMix, now, 0.35);
    this.ambientNodes.shadeBus.gain.setTargetAtTime(shadeMix, now, 0.35);

    if (sunMix > 0.15 && now >= this._nextPluckTime) {
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      this._playMarimbaPluck(freq, now);
      this._nextPluckTime = now + 0.6 + Math.random() * 0.6;
    }

    if (shadeMix > 0.15 && now >= this._nextCelloTime) {
      const pairs = [
        [130.81, 196.0],
        [146.83, 220.0],
        [110.0, 164.81]
      ];
      const pair = pairs[this._celloStep % pairs.length];
      this._celloStep++;
      this._playCelloNote(pair[0], now, 3.8);
      this._playCelloNote(pair[1], now + 0.35, 3.6);
      this._nextCelloTime = now + 3.4;
    }
  }
}
