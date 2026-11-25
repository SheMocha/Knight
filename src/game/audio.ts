class MedievalAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private enabled = true;
  private adMuted = false;
  private musicPlaying = false;
  private musicTimer: number | null = null;
  private stepIndex = 0;

  // Bouncy D-Dorian medieval tavern / Flash arcade melody (MIDI notes)
  private readonly melody: (number | null)[] = [
    62, 65, 69, 65, 67, 65, 64, 62,
    60, 62, 64, 67, 65, 64, 62, null,
    69, 72, 74, 72, 71, 69, 67, 69,
    65, 67, 69, 64, 62, null, 62, null,
  ];

  private readonly bassline: (number | null)[] = [
    38, null, 45, null, 43, null, 45, null,
    36, null, 43, null, 38, null, 45, null,
    45, null, 50, null, 43, null, 45, null,
    41, null, 43, null, 38, null, 38, null,
  ];

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.masterGain && this.ctx) {
      const target = enabled && !this.adMuted ? 0.85 : 0;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03);
    }
    if (!enabled) {
      this.stopMusic();
    }
  }

  public setAdAudioDuck(muted: boolean): void {
    this.adMuted = muted;
    if (this.masterGain && this.ctx) {
      const target = this.enabled && !muted ? 0.85 : 0;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.enabled ? 0.85 : 0;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.2;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.65;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  public startMusic(): void {
    if (!this.enabled || this.musicPlaying) return;
    this.unlock();
    if (!this.ctx) return;
    this.musicPlaying = true;
    const stepMs = 165;
    const tick = () => {
      if (!this.musicPlaying || !this.enabled || !this.ctx || !this.musicGain) return;
      if (this.ctx.state === 'running') {
        const now = this.ctx.currentTime;
        const mNote = this.melody[this.stepIndex % this.melody.length];
        const bNote = this.bassline[this.stepIndex % this.bassline.length];

        if (mNote !== null) {
          this.playPluck(this.midiToFreq(mNote), now, 0.14, 'triangle', 0.24, this.musicGain);
          this.playPluck(this.midiToFreq(mNote + 12), now, 0.06, 'sine', 0.07, this.musicGain);
        }
        if (bNote !== null) {
          this.playPluck(this.midiToFreq(bNote), now, 0.22, 'sawtooth', 0.16, this.musicGain);
        }
        if (this.stepIndex % 4 === 0) {
          this.playDrum(now, 115, 0.08, 0.14, this.musicGain);
        } else if (this.stepIndex % 4 === 2) {
          this.playNoiseBurst(now, 0.04, 2400, 0.07, this.musicGain);
        }
        this.stepIndex = (this.stepIndex + 1) % this.melody.length;
      }
      this.musicTimer = window.setTimeout(tick, stepMs);
    };
    tick();
  }

  public stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playPluck(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    dest: AudioNode,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private playDrum(
    startTime: number,
    startFreq: number,
    duration: number,
    volume: number,
    dest: AudioNode,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(42, startTime + duration);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private playNoiseBurst(
    startTime: number,
    duration: number,
    filterFreq: number,
    volume: number,
    dest: AudioNode,
  ): void {
    if (!this.ctx) return;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(startTime);
    noise.stop(startTime + duration + 0.01);
  }

  public playUiClick(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playPluck(520, now, 0.06, 'triangle', 0.25, this.sfxGain);
    this.playPluck(780, now + 0.02, 0.05, 'sine', 0.16, this.sfxGain);
  }

  public playShopBuy(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [587.33, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this.playPluck(f, now + i * 0.055, 0.16, 'triangle', 0.3, this.sfxGain!);
    });
  }

  public playChargeTick(charge: number): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const freq = 260 + charge * 560;
    this.playPluck(freq, now, 0.055, 'triangle', 0.12, this.sfxGain);
  }

  public playFullChargeReady(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playPluck(880, now, 0.12, 'triangle', 0.28, this.sfxGain);
    this.playPluck(1318.5, now + 0.05, 0.16, 'sine', 0.24, this.sfxGain);
  }

  public playSwing(power = 0.5): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const heavy = power > 0.7;
    this.playNoiseBurst(now, heavy ? 0.18 : 0.11, heavy ? 400 : 720, heavy ? 0.48 : 0.3, this.sfxGain);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(heavy ? 240 : 340, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + (heavy ? 0.17 : 0.1));
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.17 : 0.1));
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playGetMedieval(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playDrum(now, 165, 0.35, 0.65, this.sfxGain);
    this.playNoiseBurst(now, 0.26, 620, 0.55, this.sfxGain);
    [293.66, 440, 587.33, 880].forEach((freq, i) => {
      this.playPluck(freq, now + i * 0.025, 0.34, 'sawtooth', 0.22, this.sfxGain!);
    });
  }

  public playDizzy(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Cartoon wobbly bird-circling warble!
    const notes = [680, 520, 740, 500, 660, 460];
    notes.forEach((f, idx) => {
      this.playPluck(f, now + idx * 0.075, 0.08, 'sine', 0.24, this.sfxGain!);
    });
  }

  public playSmash(kind: 'wood' | 'metal' | 'magic' = 'wood'): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    if (kind === 'wood') {
      this.playNoiseBurst(now, 0.15, 780, 0.55, this.sfxGain);
      this.playDrum(now, 175, 0.13, 0.48, this.sfxGain);
      this.playPluck(280, now + 0.02, 0.08, 'square', 0.18, this.sfxGain);
    } else if (kind === 'metal') {
      this.playNoiseBurst(now, 0.12, 1800, 0.4, this.sfxGain);
      this.playPluck(620, now, 0.2, 'sawtooth', 0.25, this.sfxGain);
      this.playPluck(940, now + 0.01, 0.16, 'triangle', 0.22, this.sfxGain);
    } else {
      this.playNoiseBurst(now, 0.16, 1400, 0.35, this.sfxGain);
      this.playPluck(520, now, 0.14, 'sine', 0.28, this.sfxGain);
      this.playPluck(880, now + 0.04, 0.18, 'triangle', 0.25, this.sfxGain);
    }
  }

  public playBonk(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.045);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.13);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playCoin(combo = 1): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const pitchBoost = Math.min(combo, 12) * 32;
    this.playPluck(987 + pitchBoost, now, 0.1, 'sine', 0.24, this.sfxGain);
    this.playPluck(1318 + pitchBoost, now + 0.05, 0.14, 'triangle', 0.2, this.sfxGain);
  }

  public playGoldBag(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [784, 987, 1175, 1568].forEach((freq, idx) => {
      this.playPluck(freq, now + idx * 0.045, 0.16, 'triangle', 0.26, this.sfxGain!);
    });
  }

  public playCeramicBreak(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playNoiseBurst(now, 0.11, 2600, 0.44, this.sfxGain);
    this.playPluck(1180, now, 0.075, 'triangle', 0.26, this.sfxGain);
    this.playPluck(1640, now + 0.025, 0.065, 'sine', 0.22, this.sfxGain);
    this.playPluck(920, now + 0.05, 0.08, 'triangle', 0.18, this.sfxGain);
  }

  public playComboTier(combo: number): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const highTier = combo >= 7;
    const base = highTier ? 659.25 : 523.25;
    const notes = highTier
      ? [base, base * 1.25, base * 1.5, base * 2]
      : [base, base * 1.25, base * 1.5];
    notes.forEach((freq, idx) => {
      this.playPluck(freq, now + idx * 0.04, 0.14, highTier ? 'sawtooth' : 'triangle', highTier ? 0.2 : 0.22, this.sfxGain!);
    });
  }

  public playBonusPickup(kind: 'gold_rush' | 'double_score' | 'power_surge' | 'extra_points'): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    if (kind === 'gold_rush') {
      [880, 1108.73, 1318.51, 1760].forEach((f, i) => {
        this.playPluck(f, now + i * 0.04, 0.16, 'triangle', 0.3, this.sfxGain!);
      });
    } else if (kind === 'double_score') {
      [587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, i) => {
        this.playPluck(f, now + i * 0.045, 0.18, 'sine', 0.28, this.sfxGain!);
      });
    } else if (kind === 'power_surge') {
      this.playDrum(now, 150, 0.22, 0.52, this.sfxGain);
      [329.63, 440, 659.25, 880].forEach((f, i) => {
        this.playPluck(f, now + i * 0.038, 0.22, 'sawtooth', 0.2, this.sfxGain!);
      });
    } else {
      [659.25, 830.61, 987.77, 1318.51].forEach((f, i) => {
        this.playPluck(f, now + i * 0.042, 0.17, 'triangle', 0.28, this.sfxGain!);
      });
    }
  }

  public playPigTransform(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playNoiseBurst(now, 0.2, 1200, 0.45, this.sfxGain);
    this.playPluck(660, now, 0.12, 'sine', 0.24, this.sfxGain);
    this.playPluck(495, now + 0.07, 0.12, 'sine', 0.24, this.sfxGain);
    this.playPigOink(0.14);
  }

  public playPigOink(delay = 0): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, start);
    osc.frequency.exponentialRampToValueAtTime(360, start + 0.08);
    osc.frequency.exponentialRampToValueAtTime(210, start + 0.17);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(620, start);
    filter.Q.value = 3.5;
    gain.gain.setValueAtTime(0.42, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.19);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + 0.21);
  }

  public playLevelComplete(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    const times = [0, 0.11, 0.22, 0.34, 0.5, 0.62];
    notes.forEach((freq, idx) => {
      this.playPluck(freq, now + times[idx], 0.26, 'triangle', 0.34, this.sfxGain!);
      this.playPluck(freq * 0.5, now + times[idx], 0.28, 'sawtooth', 0.12, this.sfxGain!);
    });
  }

  public playGameOver(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [392, 369.99, 349.23, 311.13];
    notes.forEach((freq, idx) => {
      this.playPluck(freq, now + idx * 0.22, idx === 3 ? 0.55 : 0.2, 'sawtooth', 0.24, this.sfxGain!);
    });
  }

  public playExplosion(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playDrum(now, 140, 0.42, 0.72, this.sfxGain);
    this.playNoiseBurst(now, 0.36, 360, 0.65, this.sfxGain);
    this.playNoiseBurst(now + 0.04, 0.24, 980, 0.35, this.sfxGain);
  }

  public playBalloonPop(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playNoiseBurst(now, 0.055, 2200, 0.55, this.sfxGain);
    this.playPluck(840, now, 0.05, 'sine', 0.28, this.sfxGain);
  }

  public playIceShatter(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playNoiseBurst(now, 0.14, 3400, 0.38, this.sfxGain);
    [1568, 2093, 2637, 1760].forEach((f, i) => {
      this.playPluck(f, now + i * 0.022, 0.11, 'sine', 0.22, this.sfxGain!);
    });
  }

  public playFirework(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Rising whistle + pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(1680, now + 0.26);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
    this.playNoiseBurst(now + 0.25, 0.18, 1900, 0.45, this.sfxGain);
    this.playPluck(1318, now + 0.26, 0.14, 'triangle', 0.25, this.sfxGain);
    this.playPluck(1760, now + 0.3, 0.14, 'sine', 0.22, this.sfxGain);
  }

  public playChickenSquawk(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [0, 0.11].forEach((offset, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(i === 0 ? 640 : 760, now + offset);
      osc.frequency.exponentialRampToValueAtTime(1180, now + offset + 0.045);
      osc.frequency.exponentialRampToValueAtTime(520, now + offset + 0.095);
      gain.gain.setValueAtTime(0.26, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.11);
    });
  }

  public playGhostSpooky(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(760, now + 0.18);
    osc.frequency.linearRampToValueAtTime(440, now + 0.42);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playFailForbidden(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playDrum(now, 130, 0.32, 0.62, this.sfxGain);
    [311.13, 277.18, 233.08, 185].forEach((freq, idx) => {
      this.playPluck(freq, now + idx * 0.11, 0.28, 'sawtooth', 0.28, this.sfxGain!);
    });
  }

  public playBossRoar(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playDrum(now, 110, 0.55, 0.7, this.sfxGain);
    this.playNoiseBurst(now, 0.48, 420, 0.52, this.sfxGain);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(72, now + 0.5);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.54);
  }

  public playBossHit(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playDrum(now, 175, 0.2, 0.58, this.sfxGain);
    this.playNoiseBurst(now, 0.14, 1300, 0.44, this.sfxGain);
    this.playPluck(420, now, 0.14, 'sawtooth', 0.24, this.sfxGain);
    this.playPluck(660, now + 0.02, 0.12, 'triangle', 0.22, this.sfxGain);
  }

  public playBossVictory(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    notes.forEach((f, idx) => {
      this.playPluck(f, now + idx * 0.095, 0.34, 'triangle', 0.36, this.sfxGain!);
      this.playPluck(f * 0.5, now + idx * 0.095, 0.36, 'sawtooth', 0.16, this.sfxGain!);
    });
  }

  public playJump(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.14);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playPlayerHurt(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playDrum(now, 145, 0.28, 0.68, this.sfxGain);
    this.playNoiseBurst(now, 0.16, 720, 0.45, this.sfxGain);
    this.playPluck(220, now, 0.18, 'sawtooth', 0.28, this.sfxGain);
    this.playPluck(155, now + 0.06, 0.22, 'sawtooth', 0.24, this.sfxGain);
  }

  public playMushroomDizzy(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.linearRampToValueAtTime(640, now + 0.12);
    osc.frequency.linearRampToValueAtTime(280, now + 0.26);
    osc.frequency.linearRampToValueAtTime(540, now + 0.4);
    osc.frequency.linearRampToValueAtTime(220, now + 0.56);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  public playAchievementUnlock(): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880, 1174.66, 1479.98];
    notes.forEach((freq, idx) => {
      this.playPluck(freq, now + idx * 0.06, 0.28, 'triangle', 0.3, this.sfxGain!);
      this.playPluck(freq * 1.5, now + idx * 0.06 + 0.02, 0.2, 'sine', 0.14, this.sfxGain!);
    });
  }

  public dispose(): void {
    this.stopMusic();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioEngine = new MedievalAudioEngine();
