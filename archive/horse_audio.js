/**
 * Trottr - Procedural Equine Web Audio API Engine
 * Zero external audio assets required. 100% offline & self-contained.
 */

class HorseAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initDone = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // --- Procedural Hoof Clip-Clop (Two-beat wooden resonance) ---
  playClipClop() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Beat 1 (Primary strike)
    this._synthesizeHoofStep(now, 1.0, 380, 180);
    // Beat 2 (Secondary trailing clop ~110ms later)
    this._synthesizeHoofStep(now + 0.11, 0.75, 430, 210);
  }

  _synthesizeHoofStep(startTime, volume, startFreq, endFreq) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Resonant wooden body
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, startTime);
    filter.Q.setValueAtTime(4.5, startTime);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.045);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.28 * volume, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.065);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.07);

    // Subtle hoof grit/click using noise
    this._addHoofGrit(startTime, volume);
  }

  _addHoofGrit(startTime, volume) {
    const bufferSize = this.ctx.sampleRate * 0.035;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09 * volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(startTime);
  }

  // --- Procedural Equine Whinny / Neigh (Dual Oscillator FM + Pitch Glide + Vibrato) ---
  playWhinny(personality = 'default') {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    let baseFreq = 520;
    let peakFreq = 1250;
    let duration = 0.95;

    if (personality === 'shetland') {
      baseFreq = 780;
      peakFreq = 1680;
      duration = 0.7;
    } else if (personality === 'draft') {
      baseFreq = 380;
      peakFreq = 880;
      duration = 1.15;
    } else if (personality === 'dramatic') {
      baseFreq = 590;
      peakFreq = 1450;
      duration = 1.2;
    }

    // Carrier Oscillator
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sawtooth';

    // Pitch envelope: starts mid, shoots up to high whinny peak, wavers, then trails down
    carrier.frequency.setValueAtTime(baseFreq, now);
    carrier.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.22);
    carrier.frequency.linearRampToValueAtTime(peakFreq * 0.85, now + 0.55);
    carrier.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + duration);

    // Vibrato LFO for signature equine flutter
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(14, now); // ~14Hz equine flutter
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(55, now + 0.2);
    lfoGain.gain.linearRampToValueAtTime(75, now + 0.5);
    lfoGain.gain.linearRampToValueAtTime(15, now + duration);
    lfo.connect(carrier.frequency);

    // Resonant vocal tract formant filter
    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(1100, now);
    formant.frequency.linearRampToValueAtTime(1800, now + 0.25);
    formant.frequency.exponentialRampToValueAtTime(750, now + duration);
    formant.Q.setValueAtTime(3.0, now);

    // Amplitude envelope
    const ampGain = this.ctx.createGain();
    ampGain.gain.setValueAtTime(0.001, now);
    ampGain.gain.linearRampToValueAtTime(0.24, now + 0.15);
    ampGain.gain.linearRampToValueAtTime(0.22, now + 0.5);
    ampGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    carrier.connect(formant);
    formant.connect(ampGain);
    ampGain.connect(this.ctx.destination);

    carrier.start(now);
    lfo.start(now);
    carrier.stop(now + duration);
    lfo.stop(now + duration);

    // Add gentle trail snort
    setTimeout(() => {
      this.playSnort(0.4);
    }, (duration * 0.7) * 1000);
  }

  // --- Procedural Horse Snort / Nose Puff ---
  playSnort(volume = 0.5) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.38;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pinkish fluttering air burst
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      const pink = b0 + b1 + b2 + white * 0.5362;
      // 22Hz flutter for flapping lips/nostrils
      const flutter = 0.7 + 0.3 * Math.sin(2 * Math.PI * 22 * (i / this.ctx.sampleRate));
      data[i] = pink * 0.15 * flutter;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35 * volume, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // --- Carrot / Apple Crunch (Short crispy bite) ---
  playCrunch() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let j = 0; j < 3; j++) {
      const offset = now + j * 0.065;
      const duration = 0.05;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200 + (j * 300), offset);
      filter.Q.setValueAtTime(2.5, offset);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, offset);
      gain.gain.exponentialRampToValueAtTime(0.001, offset + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(offset);
    }
  }

  // --- Match Celebration Fanfare (Equestrian Brass & Golden Chime) ---
  playMatchFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [293.66, 369.99, 440.0, 587.33];

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.85);
    });

    setTimeout(() => {
      this.playWhinny('dramatic');
    }, 450);
  }

  // --- Card Swipe Whoosh ---
  playWhoosh(direction = 'right') {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = direction === 'right' ? 240 : 380;
    const endFreq = direction === 'right' ? 440 : 180;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

// Global singleton instance
window.horseAudio = new HorseAudioEngine();
