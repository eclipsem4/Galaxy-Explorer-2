// Audio synthesizer for planets using the Web Audio API
// Synthesizes atmospheric waves, ambient sounds, and solar winds dynamically

class PlanetSynthEngine {
  private ctx: AudioContext | null = null;
  private primaryGain: GainNode | null = null;
  private cosmicOsc: OscillatorNode | null = null;
  private cosmicGain: GainNode | null = null;
  private planetOsc: OscillatorNode | null = null;
  private planetNoise: AudioWorkletNode | ScriptProcessorNode | null = null;
  private planetFilter: BiquadFilterNode | null = null;
  private planetGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  private isCosmicPlaying = false;
  private initialized = false;

  constructor() {
    // Lazy initialisation to adhere to security standards and save memory
  }

  private init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.primaryGain = this.ctx.createGain();
      this.primaryGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      
      // Setup AnalyserNode for live frequency spectrum analysis
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128; // 64 frequency bins
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.primaryGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported or blocked in this environment:", e);
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleCosmicBackground(enable: boolean) {
    this.resume();
    if (!this.ctx || !this.primaryGain) return;

    if (enable) {
      if (this.isCosmicPlaying) return;

      // Create very low background rumble (cosmic resonance)
      this.cosmicOsc = this.ctx.createOscillator();
      this.cosmicGain = this.ctx.createGain();
      
      this.cosmicOsc.type = "sine";
      this.cosmicOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
      
      this.cosmicGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.cosmicGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 3);

      this.cosmicOsc.connect(this.cosmicGain);
      this.cosmicGain.connect(this.primaryGain);
      
      this.cosmicOsc.start();
      this.isCosmicPlaying = true;
    } else {
      if (!this.isCosmicPlaying) return;

      if (this.cosmicGain && this.cosmicOsc) {
        const currentGain = this.cosmicGain.gain;
        currentGain.setValueAtTime(currentGain.value, this.ctx!.currentTime);
        currentGain.linearRampToValueAtTime(0, this.ctx!.currentTime + 1.5);
        
        const oscToStop = this.cosmicOsc;
        setTimeout(() => {
          try {
            oscToStop.stop();
          } catch(e){}
        }, 1600);
      }
      this.isCosmicPlaying = false;
    }
  }

  public playPlanetAtmosphere(
    type: OscillatorType,
    frequency: number,
    resonance: number,
    noiseLevel: number
  ) {
    this.resume();
    if (!this.ctx || !this.primaryGain) return;

    // First stop current planet sound if playing
    this.stopPlanetAtmosphere(0.3);

    const now = this.ctx.currentTime;

    // 1. Oscillator Tone
    this.planetOsc = this.ctx.createOscillator();
    this.planetOsc.type = type;
    this.planetOsc.frequency.setValueAtTime(frequency, now);

    // 2. Dynamic filter sweep (atmosphere wind simulator)
    this.planetFilter = this.ctx.createBiquadFilter();
    this.planetFilter.type = "bandpass";
    this.planetFilter.frequency.setValueAtTime(frequency * 1.5, now);
    this.planetFilter.Q.setValueAtTime(resonance, now);

    // 3. Planet gain block with smooth fade in
    this.planetGain = this.ctx.createGain();
    this.planetGain.gain.setValueAtTime(0, now);
    this.planetGain.gain.linearRampToValueAtTime(0.18, now + 0.8);

    // 4. White noise simulation (uses script processor if worklet is overkill)
    try {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(noiseLevel * 0.08, now);

      noiseNode.connect(noiseGain);
      noiseGain.connect(this.planetFilter);
      noiseNode.start();
    } catch(e) {
      console.error(e);
    }

    // Connect node graph
    this.planetOsc.connect(this.planetFilter);
    this.planetFilter.connect(this.planetGain);
    this.planetGain.connect(this.primaryGain);

    // Start tone
    this.planetOsc.start();

    // Modulate filter frequency slowly to create an organic atmospheric sweeping effect
    this.modulateFilterFrequency(frequency);
  }

  private modulateFilterFrequency(baseFreq: number) {
    if (!this.ctx || !this.planetFilter) return;
    const now = this.ctx.currentTime;
    
    // Create random sweeping motions
    this.planetFilter.frequency.linearRampToValueAtTime(baseFreq * 2.2, now + 2);
    this.planetFilter.frequency.linearRampToValueAtTime(baseFreq * 0.9, now + 4);
    this.planetFilter.frequency.linearRampToValueAtTime(baseFreq * 1.6, now + 6);
  }

  public stopPlanetAtmosphere(fadeDuration = 0.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.planetGain && this.planetOsc) {
      const currentGain = this.planetGain.gain;
      currentGain.setValueAtTime(currentGain.value, now);
      currentGain.linearRampToValueAtTime(0, now + fadeDuration);

      const oscToStop = this.planetOsc;
      setTimeout(() => {
        try {
          oscToStop.stop();
        } catch(e){}
      }, fadeDuration * 1100);

      this.planetOsc = null;
      this.planetGain = null;
    }
  }

  public setGlobalVolume(level: number) {
    this.resume();
    if (this.primaryGain && this.ctx) {
      this.primaryGain.gain.setValueAtTime(level, this.ctx.currentTime);
    }
  }

  /**
   * Plays a subtle, tactile aerospace interface boot/click chirp.
   */
  public playInterfaceChirp(freq = 1100, duration = 0.045) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + duration);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.primaryGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Ignore if Web Audio gesture restriction
    }
  }

  /**
   * Plays a simulated solar flare alert telemetry sound with frequency sweep
   */
  public playSolarFlareAlert(severity: 'C' | 'M' | 'X' = 'M') {
    this.resume();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (severity === 'X') {
        // High severity: dramatic two-step klaxon alarm
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.linearRampToValueAtTime(720, now + 0.15);
        osc.frequency.setValueAtTime(360, now + 0.2);
        osc.frequency.linearRampToValueAtTime(720, now + 0.35);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        
        osc.connect(gain);
        gain.connect(this.primaryGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (severity === 'M') {
        // Moderate severity: distinct rising warble
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.25);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.primaryGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Minor severity: light double chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(780, now);
        osc.frequency.exponentialRampToValueAtTime(1170, now + 0.15);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.primaryGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Audio gesture restriction
    }
  }

  /**
   * Retrieves real-time FFT frequency spectrum data from the active audio graph.
   * Returns a Uint8Array containing normalized amplitude values (0-255) across frequency bins.
   */
  public getFrequencyData(binCount = 64): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(binCount);
    }
    const fullBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(fullBuffer);
    if (binCount >= fullBuffer.length) {
      return fullBuffer;
    }
    return fullBuffer.slice(0, binCount);
  }

  /**
   * Retrieves real-time time-domain waveform data for oscilloscope rendering.
   */
  public getTimeDomainData(sampleCount = 64): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(sampleCount).fill(128);
    }
    const fullBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(fullBuffer);
    if (sampleCount >= fullBuffer.length) {
      return fullBuffer;
    }
    return fullBuffer.slice(0, sampleCount);
  }

  /**
   * Checks if audio context is active and running.
   */
  public isAudioActive(): boolean {
    return !!(this.ctx && this.ctx.state === 'running');
  }

  /**
   * Calculates overall audio intensity (0.0 to 1.0) and decomposed band energies.
   * Useful for visualizers, particle physics, and atmospheric scattering effects.
   */
  public getAudioIntensity(binCount = 48): {
    overall: number;   // Normalized overall energy (0.0 to 1.0)
    bass: number;      // Low frequency energy (0.0 to 1.0)
    mid: number;       // Mid frequency energy (0.0 to 1.0)
    treble: number;    // High frequency energy (0.0 to 1.0)
    peak: number;      // Instantaneous peak value (0.0 to 1.0)
    hasRealAudio: boolean; // Whether non-silent audio data is currently streaming
  } {
    if (!this.analyser) {
      return { overall: 0, bass: 0, mid: 0, treble: 0, peak: 0, hasRealAudio: false };
    }

    const freq = this.getFrequencyData(binCount);
    if (!freq || freq.length === 0) {
      return { overall: 0, bass: 0, mid: 0, treble: 0, peak: 0, hasRealAudio: false };
    }

    let total = 0;
    let peak = 0;
    let bassTotal = 0;
    let midTotal = 0;
    let trebleTotal = 0;

    const bassCutoff = Math.max(1, Math.floor(binCount * 0.25));
    const midCutoff = Math.max(bassCutoff + 1, Math.floor(binCount * 0.7));

    for (let i = 0; i < binCount; i++) {
      const val = (freq[i] || 0) / 255;
      total += val;
      if (val > peak) peak = val;

      if (i < bassCutoff) {
        bassTotal += val;
      } else if (i < midCutoff) {
        midTotal += val;
      } else {
        trebleTotal += val;
      }
    }

    const overall = total / binCount;
    const bass = bassCutoff > 0 ? bassTotal / bassCutoff : 0;
    const midCount = midCutoff - bassCutoff;
    const mid = midCount > 0 ? midTotal / midCount : 0;
    const trebleCount = binCount - midCutoff;
    const treble = trebleCount > 0 ? trebleTotal / trebleCount : 0;
    const hasRealAudio = peak > 0.02;

    return { overall, bass, mid, treble, peak, hasRealAudio };
  }
}

export const SpaceAudio = new PlanetSynthEngine();
