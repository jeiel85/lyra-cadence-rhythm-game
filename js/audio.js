/**
 * Web Audio API Chiptune Music & Rhythm Engine for Lyra's Cadence
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.currentTrack = null;
    this.isPlaying = false;

    // Rhythm Clock
    this.bpm = 100;
    this.beatInterval = 60 / this.bpm;
    this.startTime = 0;
    this.pauseOffset = 0;
    this.lastScheduledBeat = -1;

    // Sequencer
    this.timerId = null;
    this.stepIndex = 0;

    // Track definitions
    this.tracks = this.initTracks();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  // Pitch helper (MIDI note number to Hz)
  m2f(note) {
    if (!note || note <= 0) return 0;
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // Current beat & progress
  getCurrentBeat() {
    if (!this.ctx || !this.isPlaying) return 0;
    const elapsed = this.ctx.currentTime - this.startTime;
    return (elapsed / this.beatInterval);
  }

  getBeatProgress() {
    const b = this.getCurrentBeat();
    return b - Math.floor(b);
  }

  // Rhythm hit evaluation
  checkBeatAccuracy() {
    const prog = this.getBeatProgress();
    // Distance from the nearest beat (0.0 or 1.0)
    let dist = Math.min(prog, 1.0 - prog); // 0.0 is dead-on
    let secondsDiff = dist * this.beatInterval;

    if (secondsDiff <= 0.10) {
      return { rating: 'PERFECT', diff: secondsDiff, score: 100, comboAdd: 1, power: 1.5 };
    } else if (secondsDiff <= 0.20) {
      return { rating: 'GREAT', diff: secondsDiff, score: 50, comboAdd: 1, power: 1.0 };
    } else {
      return { rating: 'MISS', diff: secondsDiff, score: 0, comboAdd: 0, power: 0.5 };
    }
  }

  // Music Patterns
  initTracks() {
    return {
      stage1: {
        bpm: 102,
        name: 'Riverside Meadow',
        melody: [
          60, 0, 64, 0, 67, 69, 67, 0,
          64, 0, 60, 0, 62, 0, 62, 0,
          60, 0, 64, 0, 67, 72, 71, 69,
          67, 0, 64, 0, 60, 0, 0, 0,
          65, 0, 69, 0, 72, 0, 69, 0,
          64, 0, 67, 0, 72, 0, 67, 0,
          62, 0, 65, 0, 69, 0, 67, 65,
          64, 0, 62, 0, 60, 0, 0, 0
        ],
        bass: [
          36, 0, 43, 0, 36, 0, 43, 0,
          38, 0, 45, 0, 38, 0, 45, 0,
          36, 0, 43, 0, 36, 0, 43, 0,
          36, 0, 43, 0, 48, 0, 43, 0,
          41, 0, 48, 0, 41, 0, 48, 0,
          36, 0, 43, 0, 36, 0, 43, 0,
          38, 0, 45, 0, 43, 0, 50, 0,
          36, 0, 43, 0, 36, 0, 0, 0
        ],
        drums: [
          1, 0, 2, 0, 1, 0, 2, 0,
          1, 0, 2, 0, 1, 1, 2, 0,
          1, 0, 2, 0, 1, 0, 2, 0,
          1, 0, 2, 0, 1, 1, 2, 3,
          1, 0, 2, 0, 1, 0, 2, 0,
          1, 0, 2, 0, 1, 0, 2, 0,
          1, 0, 2, 0, 1, 0, 2, 0,
          1, 1, 2, 1, 1, 2, 3, 3
        ]
      },
      stage2: {
        bpm: 118,
        name: 'Whispering Woods',
        melody: [
          62, 65, 69, 0, 67, 65, 64, 0,
          62, 0, 65, 69, 72, 71, 69, 67,
          65, 0, 69, 72, 74, 0, 72, 69,
          67, 69, 67, 64, 62, 0, 0, 0,
          70, 0, 72, 0, 74, 72, 70, 69,
          67, 0, 69, 0, 70, 69, 67, 65,
          64, 0, 67, 0, 71, 0, 69, 67,
          62, 0, 65, 0, 62, 0, 0, 0
        ],
        bass: [
          38, 0, 45, 0, 38, 0, 45, 0,
          38, 0, 45, 0, 38, 0, 45, 0,
          41, 0, 48, 0, 41, 0, 48, 0,
          38, 0, 45, 0, 38, 0, 45, 0,
          46, 0, 53, 0, 46, 0, 53, 0,
          43, 0, 50, 0, 43, 0, 50, 0,
          40, 0, 47, 0, 45, 0, 52, 0,
          38, 0, 45, 0, 38, 0, 0, 0
        ],
        drums: [
          1, 0, 2, 3, 1, 0, 2, 3,
          1, 0, 2, 3, 1, 1, 2, 3,
          1, 0, 2, 3, 1, 0, 2, 3,
          1, 0, 2, 3, 1, 2, 1, 3,
          1, 0, 2, 3, 1, 0, 2, 3,
          1, 0, 2, 3, 1, 0, 2, 3,
          1, 0, 2, 3, 1, 0, 2, 3,
          1, 1, 2, 2, 1, 2, 3, 3
        ]
      },
      stage3: {
        bpm: 130,
        name: 'Echo Ruins',
        melody: [
          64, 67, 71, 74, 76, 74, 71, 67,
          64, 0, 67, 0, 69, 0, 71, 0,
          67, 71, 74, 76, 79, 76, 74, 71,
          72, 71, 69, 67, 64, 0, 64, 0,
          65, 69, 72, 76, 77, 76, 72, 69,
          64, 67, 71, 74, 76, 74, 71, 67,
          62, 65, 69, 72, 74, 72, 69, 65,
          64, 0, 67, 0, 64, 0, 0, 0
        ],
        bass: [
          40, 40, 47, 40, 40, 40, 47, 40,
          40, 40, 47, 40, 45, 45, 52, 45,
          40, 40, 47, 40, 40, 40, 47, 40,
          48, 48, 45, 45, 40, 40, 47, 40,
          41, 41, 48, 41, 41, 41, 48, 41,
          40, 40, 47, 40, 40, 40, 47, 40,
          38, 38, 45, 38, 43, 43, 50, 43,
          40, 40, 47, 40, 40, 0, 0, 0
        ],
        drums: [
          1, 3, 2, 3, 1, 3, 2, 3,
          1, 3, 2, 3, 1, 1, 2, 3,
          1, 3, 2, 3, 1, 3, 2, 3,
          1, 3, 2, 3, 1, 2, 3, 3,
          1, 3, 2, 3, 1, 3, 2, 3,
          1, 3, 2, 3, 1, 3, 2, 3,
          1, 3, 2, 3, 1, 3, 2, 3,
          1, 1, 2, 1, 2, 2, 3, 3
        ]
      },
      boss: {
        bpm: 144,
        name: 'Cadence Overlord',
        melody: [
          72, 71, 68, 65, 64, 65, 68, 71,
          72, 0, 75, 74, 72, 71, 68, 65,
          77, 76, 72, 69, 68, 69, 72, 76,
          77, 0, 80, 79, 77, 76, 72, 68,
          73, 72, 69, 66, 65, 66, 69, 72,
          71, 70, 67, 64, 63, 64, 67, 70,
          69, 68, 65, 62, 61, 62, 65, 68,
          64, 68, 71, 76, 80, 0, 0, 0
        ],
        bass: [
          36, 36, 48, 36, 36, 36, 48, 36,
          36, 36, 48, 36, 44, 44, 43, 41,
          41, 41, 53, 41, 41, 41, 53, 41,
          41, 41, 53, 41, 49, 49, 48, 44,
          37, 37, 49, 37, 37, 37, 49, 37,
          35, 35, 47, 35, 35, 35, 47, 35,
          33, 33, 45, 33, 33, 33, 45, 33,
          36, 40, 43, 48, 52, 0, 0, 0
        ],
        drums: [
          1, 3, 2, 3, 1, 3, 2, 3,
          1, 1, 2, 3, 1, 3, 2, 2,
          1, 3, 2, 3, 1, 3, 2, 3,
          1, 1, 2, 3, 1, 2, 3, 2,
          1, 3, 2, 3, 1, 3, 2, 3,
          1, 3, 2, 3, 1, 3, 2, 3,
          1, 3, 2, 3, 1, 1, 2, 2,
          1, 2, 1, 2, 1, 2, 3, 3
        ]
      }
    };
  }

    stopTrack() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  scheduleNotes() {
    if (!this.isPlaying || !this.ctx) return;

    const lookahead = 0.1; // schedule 100ms ahead
    const stepDuration = this.beatInterval / 2; // 8th note resolution

    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this.playStepNotes(this.stepIndex, this.nextNoteTime, stepDuration);
      this.nextNoteTime += stepDuration;
      this.stepIndex = (this.stepIndex + 1) % this.currentTrack.melody.length;
    }

    this.timerId = setTimeout(() => this.scheduleNotes(), 25);
  }

  playTrack(trackKey) {
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx || !this.tracks[trackKey]) return;
    this.stopTrack();

    this.currentTrack = this.tracks[trackKey];
    this.bpm = this.currentTrack.bpm;
    this.beatInterval = 60 / this.bpm;
    this.stepIndex = 0;
    this.startTime = this.ctx.currentTime;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.isPlaying = true;

    this.scheduleNotes();
  }

  playStepNotes(step, time, duration) {
    if (!this.currentTrack) return;

    // Melody (Square wave)
    const melNote = this.currentTrack.melody[step];
    if (melNote && melNote > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(this.m2f(melNote), time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration * 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    }

    // Bass (Triangle wave)
    const bassNote = this.currentTrack.bass[step];
    if (bassNote && bassNote > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.m2f(bassNote), time);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.linearRampToValueAtTime(0.01, time + duration * 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    }

    // Drums (1=Kick, 2=Snare, 3=Hi-hat)
    const drum = this.currentTrack.drums[step];
    if (drum === 1) this.synthKick(time);
    else if (drum === 2) this.synthSnare(time);
    else if (drum === 3) this.synthHihat(time);
  }

  // Chiptune Percussion Synthesizers
  synthKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.08);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.09);
  }

  synthSnare(time) {
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.08);
  }

  synthHihat(time) {
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 6000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  // Sound Effects (SFX)
  playBeatStep(quality) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = quality === 'PERFECT' ? 660 : quality === 'GREAT' ? 440 : 220;
    osc.frequency.setValueAtTime(freq, now);

    const vol = quality === 'PERFECT' ? 0.2 : quality === 'GREAT' ? 0.15 : 0.08;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playSlash() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playHurt() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playNoteTileChime() {
    if (!this.ctx || this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  playDialogBlip() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380 + Math.random() * 80, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playBossRoar() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.6);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  playVictory() {
    this.stopTrack();
    if (!this.ctx || this.isMuted) return;
    const chords = [
      [523.25, 659.25], // C
      [587.33, 739.99], // D
      [659.25, 830.61], // E
      [783.99, 1046.50] // G-C
    ];
    chords.forEach((chord, idx) => {
      const now = this.ctx.currentTime + idx * 0.22;
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx === 3 ? 0.8 : 0.2));

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + (idx === 3 ? 0.8 : 0.2));
      });
    });
  }
}

window.soundEngine = new SoundEngine();
