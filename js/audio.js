/**
 * CLASSROOM ARCADE - SOUND ENGINE (Web Audio API)
 * Procedural synthesis - Zero external MP3/WAV dependencies!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Short click / mechanical tick for roulette pins and dials
  playTick(frequency = 800) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // Juicy pop for capsule popping open or button press
  playPop() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.06);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  // Card flip snap sound
  playCardFlip() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Tension Drumroll
  playDrumroll(durationSeconds = 2.0) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const interval = 0.06;
    const count = Math.floor(durationSeconds / interval);

    for (let i = 0; i < count; i++) {
      const time = now + i * interval;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + (i * 3), time);

      const vol = 0.08 + (i / count) * 0.25;
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.05);
    }
  }

  // Triumphant Fanfare for Winner Announcement
  playFanfare() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.15, delay: 0 },       // C5
      { f: 659.25, d: 0.15, delay: 0.16 },    // E5
      { f: 783.99, d: 0.18, delay: 0.32 },    // G5
      { f: 1046.50, d: 0.55, delay: 0.50 }    // C6 (Climax!)
    ];

    const now = this.ctx.currentTime;

    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.delay);

      gain.gain.setValueAtTime(0, now + note.delay);
      gain.gain.linearRampToValueAtTime(0.35, now + note.delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + note.delay);
      osc.stop(now + note.delay + note.d);
    });

    // Add bright sparkle shimmer
    setTimeout(() => {
      this.playSparkle();
    }, 550);
  }

  playSparkle() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const pitches = [1318.5, 1567.98, 2093.0];
    pitches.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }
}

// Global Sound Instance
window.Sound = new SoundEngine();
