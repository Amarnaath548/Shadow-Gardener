export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientNodes = null;
    this.volume = 0.7;
    this.muted = false;
    this._ambientStarted = false;
  }

  ensure() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
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
    this.ensure();
    if (!this.ctx) return;
    this._ambientStarted = true;
    // Simple droning pad: two detuned oscillators through a lowpass filter
    const ctx = this.ctx;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.value = 110;
    osc2.frequency.value = 164.81;
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 1.2;
    g.gain.value = 0.04;
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    osc1.start();
    osc2.start();
    this.ambientNodes = { osc1, osc2, filter, gain: g };
  }

  updateAmbient(sunElevation) {
    if (!this.ambientNodes) return;
    const f = this.ambientNodes.filter;
    // brighter (higher cutoff) when sun high
    const cutoff = 400 + sunElevation * 900;
    f.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.5);
    const g = this.ambientNodes.gain;
    g.gain.setTargetAtTime(0.03 + sunElevation * 0.03, this.ctx.currentTime, 0.5);
  }
}
