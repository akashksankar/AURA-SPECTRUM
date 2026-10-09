import { AudioAnalysisData, AudioProcessingMode, SoundSettings } from '../types/audio';

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  // Nodes in graph
  private ambientLowpass: BiquadFilterNode | null = null;
  private ambientHighshelf: BiquadFilterNode | null = null;
  private beatLowShelf: BiquadFilterNode | null = null;
  private beatHighShelf: BiquadFilterNode | null = null;
  private convolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private reverbDryGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Cached analysis buffers to avoid garbage collection allocations in RAF
  private freqArray: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(512));
  private timeArray: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(1024));

  // Beat tracking state
  private previousBassEnergy = 0;
  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedTreble = 0;
  private smoothedRms = 0;
  private lastBeatTime = 0;
  private beatPulse = 0;

  // Callbacks
  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  private onEndedCallback?: () => void;
  private onStateChangeCallback?: (isPlaying: boolean, isLoading: boolean) => void;
  private onErrorCallback?: (errorMsg: string) => void;

  private isInitialized = false;
  private isSourceConnected = false;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';

    this.setupAudioElementListeners();
  }

  private setupAudioElementListeners() {
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(
          this.audioElement.currentTime,
          this.audioElement.duration || 0
        );
      }
    });

    this.audioElement.addEventListener('ended', () => {
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });

    this.audioElement.addEventListener('playing', () => {
      this.onStateChangeCallback?.(true, false);
    });

    this.audioElement.addEventListener('pause', () => {
      this.onStateChangeCallback?.(false, false);
    });

    this.audioElement.addEventListener('waiting', () => {
      this.onStateChangeCallback?.(!this.audioElement.paused, true);
    });

    this.audioElement.addEventListener('canplay', () => {
      this.onStateChangeCallback?.(!this.audioElement.paused, false);
    });

    this.audioElement.addEventListener('error', () => {
      const err = this.audioElement.error;
      const msg = err ? `Audio playback error (code ${err.code})` : 'Failed to decode audio track';
      this.onErrorCallback?.(msg);
      this.onStateChangeCallback?.(false, false);
    });
  }

  // Ensure AudioContext is instantiated and resumed upon user gesture
  public async ensureContext(): Promise<AudioContext> {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.buildAudioGraph();
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  private generateImpulseResponse(ctx: AudioContext, duration = 2.4, decay = 2.2): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const envelope = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }
    return impulse;
  }

  private buildAudioGraph() {
    if (!this.audioCtx || this.isInitialized) return;
    const ctx = this.audioCtx;

    // Connect MediaElement once
    if (!this.isSourceConnected) {
      try {
        this.sourceNode = ctx.createMediaElementSource(this.audioElement);
        this.isSourceConnected = true;
      } catch (err) {
        console.warn('Source node connection exception:', err);
      }
    }

    // 1. Ambient Lowpass Filter (used in ambient mode to soften harsh highs)
    this.ambientLowpass = ctx.createBiquadFilter();
    this.ambientLowpass.type = 'lowpass';
    this.ambientLowpass.frequency.setValueAtTime(20000, ctx.currentTime);
    this.ambientLowpass.Q.setValueAtTime(0.7, ctx.currentTime);

    // 2. Ambient Highshelf Filter
    this.ambientHighshelf = ctx.createBiquadFilter();
    this.ambientHighshelf.type = 'highshelf';
    this.ambientHighshelf.frequency.setValueAtTime(4500, ctx.currentTime);
    this.ambientHighshelf.gain.setValueAtTime(0, ctx.currentTime);

    // 3. Beat Low Shelf (80Hz bass boost)
    this.beatLowShelf = ctx.createBiquadFilter();
    this.beatLowShelf.type = 'lowshelf';
    this.beatLowShelf.frequency.setValueAtTime(85, ctx.currentTime);
    this.beatLowShelf.gain.setValueAtTime(0, ctx.currentTime);

    // 4. Beat High Shelf (8000Hz sparkle)
    this.beatHighShelf = ctx.createBiquadFilter();
    this.beatHighShelf.type = 'highshelf';
    this.beatHighShelf.frequency.setValueAtTime(8000, ctx.currentTime);
    this.beatHighShelf.gain.setValueAtTime(0, ctx.currentTime);

    // 5. Reverb Convolver + Dry/Wet blend
    this.convolver = ctx.createConvolver();
    this.convolver.buffer = this.generateImpulseResponse(ctx, 2.5, 2.8);

    this.reverbDryGain = ctx.createGain();
    this.reverbDryGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.reverbWetGain = ctx.createGain();
    this.reverbWetGain.gain.setValueAtTime(0.0, ctx.currentTime);

    // 6. Dynamics Compressor
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    this.compressor.knee.setValueAtTime(20, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.005, ctx.currentTime);
    this.compressor.release.setValueAtTime(0.15, ctx.currentTime);

    // 7. Master Gain Node
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, ctx.currentTime);

    // 8. Analyser Node
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.78;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;

    this.freqArray = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    this.timeArray = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));

    // Wire Graph:
    // source -> beatLowShelf -> beatHighShelf -> ambientLowpass -> ambientHighshelf
    // -> [Dry -> Compressor]
    // -> [Wet -> Convolver -> Compressor]
    // -> compressor -> masterGain -> analyser -> destination
    if (this.sourceNode) {
      this.sourceNode.connect(this.beatLowShelf);
      this.beatLowShelf.connect(this.beatHighShelf);
      this.beatHighShelf.connect(this.ambientLowpass);
      this.ambientLowpass.connect(this.ambientHighshelf);

      // Branch to dry and wet
      this.ambientHighshelf.connect(this.reverbDryGain);
      this.ambientHighshelf.connect(this.convolver);

      this.convolver.connect(this.reverbWetGain);

      this.reverbDryGain.connect(this.compressor);
      this.reverbWetGain.connect(this.compressor);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(ctx.destination);
    }

    this.isInitialized = true;
  }

  // Load and prepare a track URL
  public async loadTrack(url: string, autoplay = true): Promise<void> {
    await this.ensureContext();

    this.audioElement.src = url;
    this.audioElement.load();

    if (autoplay) {
      try {
        await this.audioElement.play();
      } catch (err) {
        console.warn('Autoplay prevented or deferred until gesture:', err);
      }
    }
  }

  public async play(): Promise<void> {
    await this.ensureContext();
    try {
      await this.audioElement.play();
    } catch (err) {
      console.warn('Play prevented:', err);
    }
  }

  public pause(): void {
    this.audioElement.pause();
  }

  public togglePlay(): void {
    if (this.audioElement.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  public seek(seconds: number): void {
    if (!isNaN(seconds) && isFinite(seconds)) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration || 0));
    }
  }

  public getCurrentTime(): number {
    return this.audioElement.currentTime || 0;
  }

  public getDuration(): number {
    return this.audioElement.duration || 0;
  }

  public isPlaying(): boolean {
    return !this.audioElement.paused && !this.audioElement.ended;
  }

  // Apply Sound Settings (Modes: Original, Ambient, Beat)
  public applySettings(settings: SoundSettings): void {
    if (!this.audioCtx || !this.isInitialized) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const rampTime = 0.08;

    // Master volume & mute
    const effectiveVolume = settings.isMuted ? 0 : settings.masterVolume;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(effectiveVolume, now + rampTime);
    }

    if (settings.mode === 'original') {
      // Clean bypass: all filters flat, reverb dry 100%, wet 0%
      if (this.ambientLowpass) {
        this.ambientLowpass.frequency.linearRampToValueAtTime(20000, now + rampTime);
      }
      if (this.ambientHighshelf) {
        this.ambientHighshelf.gain.linearRampToValueAtTime(0, now + rampTime);
      }
      if (this.beatLowShelf) {
        this.beatLowShelf.gain.linearRampToValueAtTime(0, now + rampTime);
      }
      if (this.beatHighShelf) {
        this.beatHighShelf.gain.linearRampToValueAtTime(0, now + rampTime);
      }
      if (this.reverbDryGain) {
        this.reverbDryGain.gain.linearRampToValueAtTime(1.0, now + rampTime);
      }
      if (this.reverbWetGain) {
        this.reverbWetGain.gain.linearRampToValueAtTime(0.0, now + rampTime);
      }
    } else if (settings.mode === 'ambient') {
      // Ambient mode: lush lowpass filter, gentle highshelf rollback, stereo reverb wet mix
      const cutoff = settings.ambientCutoff || 3200;
      const reverbMix = settings.ambientReverbMix || 0.45;
      const warmth = settings.ambientWarmth || 0.6;

      if (this.ambientLowpass) {
        this.ambientLowpass.frequency.linearRampToValueAtTime(cutoff, now + rampTime);
      }
      if (this.ambientHighshelf) {
        this.ambientHighshelf.gain.linearRampToValueAtTime(-4.5 * warmth, now + rampTime);
      }
      if (this.beatLowShelf) {
        this.beatLowShelf.gain.linearRampToValueAtTime(1.5 * warmth, now + rampTime);
      }
      if (this.beatHighShelf) {
        this.beatHighShelf.gain.linearRampToValueAtTime(-2.0, now + rampTime);
      }
      if (this.reverbDryGain) {
        this.reverbDryGain.gain.linearRampToValueAtTime(Math.max(0.3, 1.0 - reverbMix * 0.7), now + rampTime);
      }
      if (this.reverbWetGain) {
        this.reverbWetGain.gain.linearRampToValueAtTime(reverbMix, now + rampTime);
      }
    } else if (settings.mode === 'beat') {
      // Beat focus: punchy low-end shelf, high presence sparkle, tight dynamics
      const bassGain = settings.beatBassGain || 7.5;
      const trebleGain = settings.beatTrebleGain || 4.0;

      if (this.ambientLowpass) {
        this.ambientLowpass.frequency.linearRampToValueAtTime(20000, now + rampTime);
      }
      if (this.ambientHighshelf) {
        this.ambientHighshelf.gain.linearRampToValueAtTime(0, now + rampTime);
      }
      if (this.beatLowShelf) {
        this.beatLowShelf.gain.linearRampToValueAtTime(bassGain, now + rampTime);
      }
      if (this.beatHighShelf) {
        this.beatHighShelf.gain.linearRampToValueAtTime(trebleGain, now + rampTime);
      }
      if (this.reverbDryGain) {
        this.reverbDryGain.gain.linearRampToValueAtTime(1.0, now + rampTime);
      }
      if (this.reverbWetGain) {
        this.reverbWetGain.gain.linearRampToValueAtTime(0.04, now + rampTime);
      }
    }
  }

  // Get real-time audio analysis data (Bass, Mid, Treble, RMS, Beat Onset)
  public getAnalysis(sensitivity = 1.0): AudioAnalysisData {
    if (!this.analyser || this.audioElement.paused) {
      // Decay smoothed values towards resting 0 when paused
      this.smoothedBass *= 0.92;
      this.smoothedMid *= 0.92;
      this.smoothedTreble *= 0.92;
      this.smoothedRms *= 0.92;
      this.beatPulse *= 0.88;
      this.freqArray.fill(0);
      this.timeArray.fill(128);

      return {
        bass: this.smoothedBass,
        mid: this.smoothedMid,
        treble: this.smoothedTreble,
        rms: this.smoothedRms,
        beatOnset: false,
        beatPulse: this.beatPulse,
        beatTrend: 'stable',
        frequencyData: this.freqArray,
        timeDomainData: this.timeArray
      };
    }

    this.analyser.getByteFrequencyData(this.freqArray);
    this.analyser.getByteTimeDomainData(this.timeArray);

    const binCount = this.analyser.frequencyBinCount; // 512 bins (0 to ~22050Hz, ~43Hz per bin)

    // Bass: 20Hz - 250Hz (bins 1 to 7)
    let rawBass = 0;
    const bassBins = Math.min(8, binCount);
    for (let i = 1; i < bassBins; i++) {
      rawBass += this.freqArray[i];
    }
    rawBass = (rawBass / (bassBins - 1) / 255) * sensitivity;

    // Mid: 250Hz - 2500Hz (bins 8 to 60)
    let rawMid = 0;
    const midStart = bassBins;
    const midEnd = Math.min(60, binCount);
    for (let i = midStart; i < midEnd; i++) {
      rawMid += this.freqArray[i];
    }
    rawMid = (rawMid / (midEnd - midStart) / 255) * sensitivity;

    // Treble: 2500Hz - 16000Hz (bins 60 to 380)
    let rawTreble = 0;
    const trebleStart = midEnd;
    const trebleEnd = Math.min(380, binCount);
    for (let i = trebleStart; i < trebleEnd; i++) {
      rawTreble += this.freqArray[i];
    }
    rawTreble = (rawTreble / (trebleEnd - trebleStart) / 255) * sensitivity;

    // RMS from time domain data
    let sumSquares = 0;
    for (let i = 0; i < this.timeArray.length; i++) {
      const normalized = (this.timeArray[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rawRms = Math.sqrt(sumSquares / this.timeArray.length) * sensitivity;

    // Smooth values with organic attack and release
    const attack = 0.55;
    const release = 0.18;

    this.smoothedBass += (rawBass - this.smoothedBass) * (rawBass > this.smoothedBass ? attack : release);
    this.smoothedMid += (rawMid - this.smoothedMid) * (rawMid > this.smoothedMid ? attack : release);
    this.smoothedTreble += (rawTreble - this.smoothedTreble) * (rawTreble > this.smoothedTreble ? attack : release);
    this.smoothedRms += (rawRms - this.smoothedRms) * (rawRms > this.smoothedRms ? attack : release);

    // Onset Beat Detection: look for sharp sudden rise in bass energy
    const bassDelta = rawBass - this.previousBassEnergy;
    this.previousBassEnergy = rawBass;

    const now = performance.now();
    let beatOnset = false;
    // Debounce beats by at least 170ms
    if (bassDelta > 0.15 && rawBass > 0.24 && now - this.lastBeatTime > 170) {
      beatOnset = true;
      this.lastBeatTime = now;
      this.beatPulse = Math.min(1.0, 0.45 + rawBass * 0.55);
    } else {
      this.beatPulse *= 0.90;
    }

    const beatTrend: 'rising' | 'falling' | 'stable' =
      bassDelta > 0.04 ? 'rising' : bassDelta < -0.04 ? 'falling' : 'stable';

    return {
      bass: Math.min(1.0, Math.max(0, this.smoothedBass)),
      mid: Math.min(1.0, Math.max(0, this.smoothedMid)),
      treble: Math.min(1.0, Math.max(0, this.smoothedTreble)),
      rms: Math.min(1.0, Math.max(0, this.smoothedRms)),
      beatOnset,
      beatPulse: Math.min(1.0, Math.max(0, this.beatPulse)),
      beatTrend,
      frequencyData: this.freqArray,
      timeDomainData: this.timeArray
    };
  }

  // Event callbacks registration
  public onTimeUpdate(cb: (currentTime: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public onStateChange(cb: (isPlaying: boolean, isLoading: boolean) => void) {
    this.onStateChangeCallback = cb;
  }

  public onError(cb: (msg: string) => void) {
    this.onErrorCallback = cb;
  }

  public destroy() {
    this.audioElement.pause();
    this.audioElement.src = '';
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
  }
}

// Global Singleton Instance
export const audioEngine = new AudioEngine();
