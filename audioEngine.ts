import { AudioProcessingSettings, RadioFilterMode } from "../types";

export class VintageRadioAudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Filter chain nodes
  private hpFilter: BiquadFilterNode | null = null;
  private lpFilter: BiquadFilterNode | null = null;
  private peakFilter: BiquadFilterNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private bassBoostFilter: BiquadFilterNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Atmosphere generators
  private crackleSource: AudioBufferSourceNode | null = null;
  private crackleGain: GainNode | null = null;
  private humSource: OscillatorNode | null = null;
  private humHarmonic: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  private currentAudioBuffer: AudioBuffer | null = null;
  private isPlaying: boolean = false;
  private playbackStartTime: number = 0;
  private pauseOffset: number = 0;

  private onEndedCallback: (() => void) | null = null;

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext {
    return this.initContext();
  }

  // Convert raw 16-bit PCM base64 string (sampleRate: 24000) or decode standard audio buffer
  public async decodeAudio(base64Data: string, mimeType: string = "audio/pcm;rate=24000"): Promise<AudioBuffer> {
    const ctx = this.initContext();

    // Clean base64 string
    const cleanBase64 = base64Data.replace(/^data:audio\/[^;]+;base64,/, "").trim();
    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Detect encoded formats (MP3/MPEG, WAV, OGG, WEBM) vs raw linear PCM
    const isEncoded =
      mimeType.includes("mpeg") ||
      mimeType.includes("mp3") ||
      mimeType.includes("wav") ||
      mimeType.includes("wave") ||
      mimeType.includes("ogg") ||
      mimeType.includes("webm");

    if (isEncoded) {
      try {
        // Standard Web Audio decodeAudioData for MP3/WAV/etc.
        const arrayBuf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const decoded = await new Promise<AudioBuffer>((resolve, reject) => {
          ctx.decodeAudioData(
            arrayBuf,
            (buf) => resolve(buf),
            (err) => reject(err)
          );
        });
        this.currentAudioBuffer = decoded;
        return decoded;
      } catch (err) {
        console.warn("decodeAudioData failed on encoded format, trying fallback:", err);
      }
    }

    // Raw 16-bit linear PCM Little-Endian (Gemini TTS default 24kHz)
    const sampleRate = 24000;
    const numSamples = Math.floor(len / 2);
    const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    for (let i = 0; i < numSamples; i++) {
      const int16 = dataView.getInt16(i * 2, true); // true = Little Endian
      channelData[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
    }
    this.currentAudioBuffer = audioBuffer;
    return audioBuffer;
  }

  // Create distortion saturation curve for vintage vacuum tube warm harmonics
  private makeDistortionCurve(amount: number = 20): Float32Array {
    const k = typeof amount === "number" ? amount : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Soft saturation polynomial + slight asymmetric warmth
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x)) + 0.05 * (x * x - 1);
    }
    return curve;
  }

  // Procedural Vinyl Crackle Buffer Generator
  private createCrackleBuffer(ctx: BaseAudioContext, duration: number = 10): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      // Base tape/surface hiss
      let sample = (Math.random() * 2 - 1) * 0.015;

      // Random micro-pops and dust clicks (vinyl crackle)
      if (Math.random() < 0.0012) {
        const popIntensity = (Math.random() * 0.4 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
        sample += popIntensity;
      }
      data[i] = sample;
    }
    return buffer;
  }

  // Play a brief authentic 1950s radio interval chime / tuning sweep
  public playTuningChime(): void {
    const ctx = this.initContext();
    const now = ctx.currentTime;

    // Dual-tone interval chime (E4 -> G4 -> C5 like 1950s broadcast stings)
    const tones = [329.63, 392.0, 523.25];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);

      gain.gain.setValueAtTime(0, now + idx * 0.18);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.65);
    });

    // Subtle radio heterodyne tuning chirp
    const whistle = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    whistle.type = "sine";
    whistle.frequency.setValueAtTime(1400, now);
    whistle.frequency.exponentialRampToValueAtTime(750, now + 0.4);

    whistleGain.gain.setValueAtTime(0.05, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    whistle.connect(whistleGain);
    whistleGain.connect(ctx.destination);

    whistle.start(now);
    whistle.stop(now + 0.45);
  }

  // Apply settings to the active node chain
  public updateSettings(settings: AudioProcessingSettings): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Update Master Volume
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(settings.volume, now, 0.05);
    }

    // Update Filters according to mode
    if (this.hpFilter && this.lpFilter && this.peakFilter && this.waveShaper) {
      this.configureFiltersForMode(
        settings.filterMode,
        settings.cabinetWarmth,
        settings.clarityBoost !== undefined ? settings.clarityBoost : 6.0
      );
    }

    // Update Atmosphere Crackle & Hum
    if (this.crackleGain) {
      const targetCrackle = settings.filterMode === "clean_studio" ? 0 : settings.crackleLevel * 0.35;
      this.crackleGain.gain.setTargetAtTime(targetCrackle, now, 0.05);
    }

    if (this.humGain) {
      const targetHum = settings.filterMode === "clean_studio" ? 0 : settings.humLevel * 0.08;
      this.humGain.gain.setTargetAtTime(targetHum, now, 0.05);
    }

    // Update playback speed / pitch if playing
    if (this.sourceNode) {
      const pitchMultiplier = settings.voicePitchShift !== undefined ? settings.voicePitchShift : 1.0;
      this.sourceNode.playbackRate.setTargetAtTime(settings.playbackSpeed * pitchMultiplier, now, 0.05);
    }

    if (this.bassBoostFilter) {
      const boostVal = settings.bassBoost !== undefined ? settings.bassBoost : 6.0;
      this.bassBoostFilter.gain.setTargetAtTime(boostVal, now, 0.05);
    }

    if (this.presenceFilter) {
      const clarityVal = settings.clarityBoost !== undefined ? settings.clarityBoost : 4.5;
      this.presenceFilter.gain.setTargetAtTime(clarityVal, now, 0.05);
    }
  }

  private configureFiltersForMode(mode: RadioFilterMode, warmth: number, clarity: number = 4.5): void {
    if (!this.hpFilter || !this.lpFilter || !this.peakFilter || !this.presenceFilter || !this.waveShaper || !this.ctx) return;
    const now = this.ctx.currentTime;

    switch (mode) {
      case "1950s_am":
        // 1950s High-Fidelity Broadcast & Studio Microphone:
        // - HP at 85Hz: eliminates rumble while keeping natural deep voice fullness
        // - Presence at 3600Hz: crisply emphasizes consonants and speech clarity
        // - LP at 8000Hz: preserves full vocal articulation and sibilants without muffled boxiness
        // - Peak at 1400Hz: gentle mid-century acoustic radio signature
        // - Subtle tube warmth
        this.hpFilter.frequency.setTargetAtTime(85, now, 0.05);
        this.hpFilter.Q.setTargetAtTime(0.7, now, 0.05);

        this.presenceFilter.frequency.setTargetAtTime(3600, now, 0.05);
        this.presenceFilter.gain.setTargetAtTime(clarity, now, 0.05);
        this.presenceFilter.Q.setTargetAtTime(1.1, now, 0.05);

        this.lpFilter.frequency.setTargetAtTime(8000, now, 0.05);
        this.lpFilter.Q.setTargetAtTime(0.9, now, 0.05);

        this.peakFilter.frequency.setTargetAtTime(1400, now, 0.05);
        this.peakFilter.gain.setTargetAtTime(1.5 + warmth * 1.0, now, 0.05);
        this.peakFilter.Q.setTargetAtTime(0.9, now, 0.05);

        this.waveShaper.curve = this.makeDistortionCurve(4 + warmth * 6);
        break;

      case "gramophone_78":
        this.hpFilter.frequency.setTargetAtTime(180, now, 0.05);
        this.hpFilter.Q.setTargetAtTime(0.9, now, 0.05);

        this.presenceFilter.frequency.setTargetAtTime(3200, now, 0.05);
        this.presenceFilter.gain.setTargetAtTime(clarity + 1.5, now, 0.05);
        this.presenceFilter.Q.setTargetAtTime(1.3, now, 0.05);

        this.lpFilter.frequency.setTargetAtTime(6000, now, 0.05);
        this.lpFilter.Q.setTargetAtTime(1.5, now, 0.05);

        this.peakFilter.frequency.setTargetAtTime(1400, now, 0.05);
        this.peakFilter.gain.setTargetAtTime(2.5, now, 0.05);
        this.peakFilter.Q.setTargetAtTime(1.5, now, 0.05);

        this.waveShaper.curve = this.makeDistortionCurve(10 + warmth * 8);
        break;

      case "shortwave":
        this.hpFilter.frequency.setTargetAtTime(160, now, 0.05);
        this.hpFilter.Q.setTargetAtTime(0.9, now, 0.05);

        this.presenceFilter.frequency.setTargetAtTime(3000, now, 0.05);
        this.presenceFilter.gain.setTargetAtTime(clarity + 1.0, now, 0.05);
        this.presenceFilter.Q.setTargetAtTime(1.2, now, 0.05);

        this.lpFilter.frequency.setTargetAtTime(5500, now, 0.05);
        this.lpFilter.Q.setTargetAtTime(1.6, now, 0.05);

        this.peakFilter.frequency.setTargetAtTime(1200, now, 0.05);
        this.peakFilter.gain.setTargetAtTime(2.0, now, 0.05);
        this.peakFilter.Q.setTargetAtTime(1.0, now, 0.05);

        this.waveShaper.curve = this.makeDistortionCurve(8 + warmth * 8);
        break;

      case "clean_studio":
      default:
        this.hpFilter.frequency.setTargetAtTime(30, now, 0.05);
        this.hpFilter.Q.setTargetAtTime(0.7, now, 0.05);

        this.presenceFilter.frequency.setTargetAtTime(3500, now, 0.05);
        this.presenceFilter.gain.setTargetAtTime(0.0, now, 0.05);
        this.presenceFilter.Q.setTargetAtTime(1.0, now, 0.05);

        this.lpFilter.frequency.setTargetAtTime(20000, now, 0.05);
        this.lpFilter.Q.setTargetAtTime(0.7, now, 0.05);

        this.peakFilter.frequency.setTargetAtTime(2500, now, 0.05);
        this.peakFilter.gain.setTargetAtTime(0.0, now, 0.05);
        this.peakFilter.Q.setTargetAtTime(1.0, now, 0.05);

        this.waveShaper.curve = this.makeDistortionCurve(1);
        break;
    }
  }

  // Play audio buffer with complete vintage radio DSP graph
  public play(settings: AudioProcessingSettings, offset: number = 0, onEnded?: () => void): void {
    if (!this.currentAudioBuffer) return;

    this.stop();
    const ctx = this.initContext();

    this.onEndedCallback = onEnded || null;

    if (settings.playIntroChime && offset === 0) {
      this.playTuningChime();
    }

    const pitchMultiplier = settings.voicePitchShift !== undefined ? settings.voicePitchShift : 1.0;

    // Source Node
    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.currentAudioBuffer;
    this.sourceNode.playbackRate.value = settings.playbackSpeed * pitchMultiplier;

    // Bass / Baritone Chest Resonance Filter (low-shelf at 200Hz)
    this.bassBoostFilter = ctx.createBiquadFilter();
    this.bassBoostFilter.type = "lowshelf";
    this.bassBoostFilter.frequency.setValueAtTime(200, ctx.currentTime);
    const boostGain = settings.bassBoost !== undefined ? settings.bassBoost : 6.0;
    this.bassBoostFilter.gain.setValueAtTime(boostGain, ctx.currentTime);

    // Filters
    this.hpFilter = ctx.createBiquadFilter();
    this.hpFilter.type = "highpass";

    this.presenceFilter = ctx.createBiquadFilter();
    this.presenceFilter.type = "peaking";

    this.lpFilter = ctx.createBiquadFilter();
    this.lpFilter.type = "lowpass";

    this.peakFilter = ctx.createBiquadFilter();
    this.peakFilter.type = "peaking";

    // Tube distortion
    this.waveShaper = ctx.createWaveShaper();
    this.waveShaper.oversample = "2x";

    this.configureFiltersForMode(settings.filterMode, settings.cabinetWarmth, settings.clarityBoost ?? 4.5);

    // Broadcast Compressor / AGC Limiter (vintage radio leveling amplifier)
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-16, ctx.currentTime);
    this.compressor.knee.setValueAtTime(6, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4.5, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.005, ctx.currentTime);
    this.compressor.release.setValueAtTime(0.12, ctx.currentTime);

    // Analyser Node for VU meter and visualizer
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Master Gain
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(settings.volume, ctx.currentTime);

    // Crackle & Hum Generator (vintage atmospheric patina)
    const crackleBuffer = this.createCrackleBuffer(ctx, 15);
    this.crackleSource = ctx.createBufferSource();
    this.crackleSource.buffer = crackleBuffer;
    this.crackleSource.loop = true;
    this.crackleGain = ctx.createGain();
    this.crackleGain.gain.setValueAtTime(
      settings.filterMode === "clean_studio" ? 0 : settings.crackleLevel * 0.20,
      ctx.currentTime
    );
    this.crackleSource.connect(this.crackleGain);
    this.crackleGain.connect(this.gainNode);
    this.crackleSource.start();

    // 50Hz Mains Hum (European power grid) + 100Hz harmonic
    this.humSource = ctx.createOscillator();
    this.humSource.type = "sine";
    this.humSource.frequency.setValueAtTime(50, ctx.currentTime);

    this.humHarmonic = ctx.createOscillator();
    this.humHarmonic.type = "sine";
    this.humHarmonic.frequency.setValueAtTime(100, ctx.currentTime);

    this.humGain = ctx.createGain();
    this.humGain.gain.setValueAtTime(
      settings.filterMode === "clean_studio" ? 0 : settings.humLevel * 0.05,
      ctx.currentTime
    );

    const humSubGain = ctx.createGain();
    humSubGain.gain.value = 0.3;
    this.humHarmonic.connect(humSubGain);
    humSubGain.connect(this.humGain);
    this.humSource.connect(this.humGain);
    this.humGain.connect(this.gainNode);

    this.humSource.start();
    this.humHarmonic.start();

    // Signal Routing:
    // Source -> BassBoost -> HP -> Presence -> Peak -> LP -> WaveShaper -> Compressor -> Analyser -> Master Gain -> Destination
    this.sourceNode.connect(this.bassBoostFilter);
    this.bassBoostFilter.connect(this.hpFilter);
    this.hpFilter.connect(this.presenceFilter);
    this.presenceFilter.connect(this.peakFilter);
    this.peakFilter.connect(this.lpFilter);
    this.lpFilter.connect(this.waveShaper);
    this.waveShaper.connect(this.compressor);
    this.compressor.connect(this.analyserNode);
    this.analyserNode.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);

    // Track playback timing
    const startDelay = settings.playIntroChime && offset === 0 ? 0.35 : 0;
    this.playbackStartTime = ctx.currentTime + startDelay - offset;
    this.pauseOffset = offset;
    this.isPlaying = true;

    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.cleanupAtmosphere();
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };

    this.sourceNode.start(ctx.currentTime + startDelay, offset);
  }

  public pause(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset;
    const currentPos = (this.ctx.currentTime - this.playbackStartTime);
    this.pauseOffset = Math.max(0, currentPos);
    this.stop();
    return this.pauseOffset;
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }
    this.cleanupAtmosphere();
  }

  private cleanupAtmosphere(): void {
    if (this.crackleSource) {
      try {
        this.crackleSource.stop();
        this.crackleSource.disconnect();
      } catch (e) {}
      this.crackleSource = null;
    }
    if (this.humSource) {
      try {
        this.humSource.stop();
        this.humSource.disconnect();
      } catch (e) {}
      this.humSource = null;
    }
    if (this.humHarmonic) {
      try {
        this.humHarmonic.stop();
        this.humHarmonic.disconnect();
      } catch (e) {}
      this.humHarmonic = null;
    }
  }

  public getPlaybackProgress(): { currentTime: number; duration: number; isPlaying: boolean } {
    if (!this.currentAudioBuffer) {
      return { currentTime: 0, duration: 0, isPlaying: false };
    }
    const duration = this.currentAudioBuffer.duration;
    if (!this.isPlaying || !this.ctx) {
      return { currentTime: Math.min(this.pauseOffset, duration), duration, isPlaying: false };
    }
    const currentTime = Math.max(0, Math.min(this.ctx.currentTime - this.playbackStartTime, duration));
    return { currentTime, duration, isPlaying: true };
  }

  // Visualizer data helper (returns level from 0 to 1 and frequency data)
  public getVisualizerData(): { peak: number; rms: number; frequencyData: Uint8Array } {
    if (!this.analyserNode || !this.isPlaying) {
      return { peak: 0, rms: 0, frequencyData: new Uint8Array(64) };
    }

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < bufferLength; i++) {
      const val = dataArray[i] / 255;
      sum += val * val;
      if (val > peak) peak = val;
    }
    const rms = Math.sqrt(sum / bufferLength);

    return { peak, rms, frequencyData: dataArray };
  }

  public getCurrentBuffer(): AudioBuffer | null {
    return this.currentAudioBuffer;
  }

  // Export processed 1950s audio as downloadable WAV
  public async exportAsWav(settings: AudioProcessingSettings, withEffects: boolean = true): Promise<Blob> {
    if (!this.currentAudioBuffer) {
      throw new Error("No audio buffer loaded to export.");
    }

    const pitchMultiplier = settings.voicePitchShift !== undefined ? settings.voicePitchShift : 1.0;
    const effectiveRate = settings.playbackSpeed * pitchMultiplier;
    const duration = this.currentAudioBuffer.duration / effectiveRate + 0.6;
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = this.currentAudioBuffer;
    source.playbackRate.value = effectiveRate;

    // Bass boost shelf (Chest resonance)
    const bass = offlineCtx.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 200;
    bass.gain.value = settings.bassBoost !== undefined ? settings.bassBoost : 6.0;

    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.92;
    masterGain.connect(offlineCtx.destination);

    if (withEffects && settings.filterMode !== "clean_studio") {
      const hp = offlineCtx.createBiquadFilter();
      hp.type = "highpass";
      const presence = offlineCtx.createBiquadFilter();
      presence.type = "peaking";
      const lp = offlineCtx.createBiquadFilter();
      lp.type = "lowpass";
      const peak = offlineCtx.createBiquadFilter();
      peak.type = "peaking";
      const shaper = offlineCtx.createWaveShaper();
      shaper.oversample = "2x";

      const clarity = settings.clarityBoost ?? 6.0;

      // Configure based on mode
      if (settings.filterMode === "1950s_am") {
        hp.frequency.value = 85;
        hp.Q.value = 0.7;
        presence.frequency.value = 3600;
        presence.gain.value = clarity;
        presence.Q.value = 1.1;
        lp.frequency.value = 8000;
        lp.Q.value = 0.9;
        peak.frequency.value = 1400;
        peak.gain.value = 1.5 + settings.cabinetWarmth * 1.0;
        shaper.curve = this.makeDistortionCurve(4 + settings.cabinetWarmth * 6);
      } else if (settings.filterMode === "gramophone_78") {
        hp.frequency.value = 180;
        hp.Q.value = 0.9;
        presence.frequency.value = 3200;
        presence.gain.value = clarity + 1.5;
        presence.Q.value = 1.3;
        lp.frequency.value = 6000;
        lp.Q.value = 1.5;
        peak.frequency.value = 1400;
        peak.gain.value = 2.5;
        shaper.curve = this.makeDistortionCurve(10 + settings.cabinetWarmth * 8);
      } else {
        hp.frequency.value = 160;
        hp.Q.value = 0.9;
        presence.frequency.value = 3000;
        presence.gain.value = clarity + 1.0;
        presence.Q.value = 1.2;
        lp.frequency.value = 5500;
        lp.Q.value = 1.6;
        peak.frequency.value = 1200;
        peak.gain.value = 2.0;
        shaper.curve = this.makeDistortionCurve(8 + settings.cabinetWarmth * 8);
      }

      const comp = offlineCtx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4.5;

      // Add atmospheric crackle in offline export
      if (settings.crackleLevel > 0) {
        const crackle = offlineCtx.createBufferSource();
        crackle.buffer = this.createCrackleBuffer(offlineCtx, duration);
        const crackleG = offlineCtx.createGain();
        crackleG.gain.value = settings.crackleLevel * 0.15;
        crackle.connect(crackleG);
        crackleG.connect(masterGain);
        crackle.start();
      }

      source.connect(bass);
      bass.connect(hp);
      hp.connect(presence);
      presence.connect(peak);
      peak.connect(lp);
      lp.connect(shaper);
      shaper.connect(comp);
      comp.connect(masterGain);
    } else {
      const presence = offlineCtx.createBiquadFilter();
      presence.type = "peaking";
      presence.frequency.value = 3500;
      presence.gain.value = (settings.clarityBoost ?? 4) * 0.5;
      source.connect(bass);
      bass.connect(presence);
      presence.connect(masterGain);
    }

    source.start(0);
    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWavBlob(renderedBuffer);
  }

  // Convert AudioBuffer to high-quality mastered WAV standard Blob
  private audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = 1;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const channelData = buffer.getChannelData(0);
    const numSamples = channelData.length;
    const dataSize = numSamples * (bitDepth / 8);
    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, "WAVE");

    // fmt sub-chunk
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    // Calculate peak level for studio-grade broadcast normalization (target: 0.94 / -0.5 dBFS)
    let maxPeak = 0;
    for (let i = 0; i < numSamples; i++) {
      const absVal = Math.abs(channelData[i]);
      if (absVal > maxPeak) maxPeak = absVal;
    }
    const normFactor = maxPeak > 0 ? Math.min(1.4, 0.94 / maxPeak) : 1.0;

    // Fade-in (5ms) and fade-out (25ms) sample counts to eliminate boundary clicks
    const fadeInSamples = Math.min(Math.floor(sampleRate * 0.005), numSamples);
    const fadeOutSamples = Math.min(Math.floor(sampleRate * 0.025), numSamples);

    // Write normalized, mastered 16-bit PCM samples
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      let sample = channelData[i] * normFactor;

      // Apply smooth boundary windowing
      if (i < fadeInSamples) {
        sample *= (i / fadeInSamples);
      } else if (i > numSamples - fadeOutSamples) {
        sample *= ((numSamples - i) / fadeOutSamples);
      }

      const clamped = Math.max(-1, Math.min(1, sample));
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }

    return new Blob([wavBuffer], { type: "audio/wav" });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
