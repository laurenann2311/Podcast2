import { Mp3Encoder } from '@breezystack/lamejs';
import { SpeakerConfig, PodcastSegment, PodcastLanguage } from '../types/podcast';

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function decodeAudioBase64(base64: string): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = base64ToArrayBuffer(base64);
  return await ctx.decodeAudioData(arrayBuffer);
}

/**
 * Converts an AudioBuffer into a WAV Blob (16-bit PCM RIFF)
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length;
  const dataByteCount = length * blockAlign;
  const bufferByteCount = 44 + dataByteCount;

  const arrayBuffer = new ArrayBuffer(bufferByteCount);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataByteCount, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataByteCount, true);

  // Write interleaved PCM 16-bit samples
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer (-32768 to 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converts an AudioBuffer into an MP3 Blob using @breezystack/lamejs
 */
export function audioBufferToMp3(buffer: AudioBuffer, kbps = 192): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: BlobPart[] = [];

  const length = buffer.length;
  const sampleBlockSize = 1152;

  // Float32 to Int16
  const ch0 = buffer.getChannelData(0);
  const ch1 = channels > 1 ? buffer.getChannelData(1) : ch0;

  for (let i = 0; i < length; i += sampleBlockSize) {
    const chunkLength = Math.min(sampleBlockSize, length - i);

    // Cleanly allocate fresh block or zero-padded buffers for each chunk
    const leftInt16 = new Int16Array(chunkLength);
    const rightInt16 = channels > 1 ? new Int16Array(chunkLength) : leftInt16;

    for (let j = 0; j < chunkLength; j++) {
      const s0 = Math.max(-1, Math.min(1, ch0[i + j]));
      leftInt16[j] = s0 < 0 ? s0 * 0x8000 : s0 * 0x7fff;

      if (channels > 1) {
        const s1 = Math.max(-1, Math.min(1, ch1[i + j]));
        rightInt16[j] = s1 < 0 ? s1 * 0x8000 : s1 * 0x7fff;
      }
    }

    const mp3buf: any = channels === 1 ? encoder.encodeBuffer(leftInt16) : encoder.encodeBuffer(leftInt16, rightInt16);

    if (mp3buf && mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf.buffer as ArrayBuffer, mp3buf.byteOffset, mp3buf.length));
    }
  }

  const endBuf: any = encoder.flush();
  if (endBuf && endBuf.length > 0) {
    mp3Data.push(new Uint8Array(endBuf.buffer as ArrayBuffer, endBuf.byteOffset, endBuf.length));
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Apply DSP effects (Tone EQ, Speed, Pitch adjustment, Pan, Volume) to an AudioBuffer
 * Returns a new processed AudioBuffer rendered via OfflineAudioContext
 */
export async function processSegmentDsp(
  inputBuffer: AudioBuffer,
  config: SpeakerConfig
): Promise<AudioBuffer> {
  const speed = Math.max(0.75, Math.min(1.4, config.speed || 1.0));
  const pitchFactor = Math.max(0.85, Math.min(1.15, config.pitch || 1.0));
  const tone = Math.max(-1.0, Math.min(1.0, config.tone || 0));
  const volume = Math.max(0, Math.min(1.5, config.volume ?? 1.0));
  const pan = Math.max(-1.0, Math.min(1.0, config.pan ?? 0));

  // If parameters are at neutral default, return original buffer untouched
  if (
    Math.abs(speed - 1.0) < 0.015 &&
    Math.abs(pitchFactor - 1.0) < 0.015 &&
    Math.abs(tone) < 0.02 &&
    Math.abs(volume - 1.0) < 0.02 &&
    Math.abs(pan) < 0.02
  ) {
    return inputBuffer;
  }

  const sampleRate = inputBuffer.sampleRate;
  // Calculate output duration based on playback speed
  const rate = speed * pitchFactor;
  const outputLength = Math.max(1, Math.ceil(inputBuffer.length / rate));
  const offlineCtx = new OfflineAudioContext(2, outputLength, sampleRate);

  const source = offlineCtx.createBufferSource();
  source.buffer = inputBuffer;
  source.playbackRate.value = rate;

  // Studio Broadcast Tone EQ:
  // Low-shelf (Warm analog body)
  const lowShelf = offlineCtx.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 220;
  lowShelf.gain.value = tone < 0 ? -tone * 5.0 : -tone * 1.5;

  // High-shelf (Natural broadcast condenser air)
  const highShelf = offlineCtx.createBiquadFilter();
  highShelf.type = 'highshelf';
  highShelf.frequency.value = 5200;
  highShelf.gain.value = tone > 0 ? tone * 4.5 : tone * 2.0;

  // Mid presence peaking (speech intelligibility)
  const midPeak = offlineCtx.createBiquadFilter();
  midPeak.type = 'peaking';
  midPeak.frequency.value = 2400;
  midPeak.Q.value = 0.9;
  midPeak.gain.value = tone * 2.0;

  // Stereo Panner
  const panner = offlineCtx.createStereoPanner();
  panner.pan.value = pan;

  // Master Gain
  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = volume;

  // Connect studio graph
  source.connect(lowShelf);
  lowShelf.connect(midPeak);
  midPeak.connect(highShelf);
  highShelf.connect(panner);
  panner.connect(gainNode);
  gainNode.connect(offlineCtx.destination);

  source.start(0);
  return await offlineCtx.startRendering();
}

/**
 * Mix all podcast dialogue segments together into a cohesive master podcast AudioBuffer
 * Free of any synthetic beeps, digital pops, or clipping artifacts.
 */
export async function mixMasterPodcast(
  segments: PodcastSegment[],
  speakers: Record<'male' | 'female', SpeakerConfig>,
  options: {
    includeIntroChime?: boolean;
    pauseDuration?: number; // seconds between speakers, e.g. 0.35s
  } = {}
): Promise<{
  audioBuffer: AudioBuffer;
  wavBlob: Blob;
  wavUrl: string;
  mp3Blob: Blob;
  mp3Url: string;
  totalDuration: number;
}> {
  if (!segments.length || segments.some(s => s.status !== 'ready' || !s.audioBuffer)) throw new Error('Every turn must be rendered before exporting the complete podcast.');
  const { pauseDuration = 0.35 } = options;

  // Process DSP for each segment's audio buffer
  const processedClips: { buffer: AudioBuffer; speaker: 'male' | 'female'; text: string }[] = [];

  for (const seg of segments) {
    const audioBuffer = seg.audioBuffer;
    const isExactSoundFile = seg.isCustomAudio;

    if (!audioBuffer) continue;
    const speakerConfig = speakers[seg.speaker];
    // Keep custom pre-recorded audio without DSP modification, apply DSP to synthesized speech
    const processedBuffer = isExactSoundFile
      ? audioBuffer
      : await processSegmentDsp(audioBuffer, speakerConfig);
    processedClips.push({
      buffer: processedBuffer,
      speaker: seg.speaker,
      text: seg.text,
    });
  }

  if (processedClips.length === 0) {
    throw new Error('No audio clips available to mix. Please render at least one segment first.');
  }

  // Calculate timeline start times with clean conversational pacing
  let currentTime = 0.0;

  const clipStartTimes: number[] = [];
  for (let i = 0; i < processedClips.length; i++) {
    clipStartTimes.push(currentTime);
    const dur = processedClips[i].buffer.duration;
    currentTime += dur + pauseDuration;
  }
  currentTime += 0.15; // subtle room margin at end

  // Standardize master render to 44.1kHz studio broadcast format
  const sampleRate = 44100;
  const totalLength = Math.max(1, Math.ceil(currentTime * sampleRate));
  const offlineCtx = new OfflineAudioContext(2, totalLength, sampleRate);

  // Place each speech clip on the timeline with anti-click envelope
  for (let i = 0; i < processedClips.length; i++) {
    const { buffer } = processedClips[i];
    const startTime = clipStartTimes[i];
    const dur = buffer.duration;

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    // Apply 5ms fade-in and 10ms fade-out envelope to eliminate digital DC clicks or pops
    const clipGain = offlineCtx.createGain();
    clipGain.gain.setValueAtTime(0, startTime);
    clipGain.gain.linearRampToValueAtTime(1, startTime + Math.min(0.008, dur * 0.1));
    const fadeOutStart = Math.max(startTime + 0.01, startTime + dur - 0.012);
    clipGain.gain.setValueAtTime(1, fadeOutStart);
    clipGain.gain.linearRampToValueAtTime(0, startTime + dur);

    source.connect(clipGain);
    clipGain.connect(offlineCtx.destination);
    source.start(startTime);
  }

  const masterBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(masterBuffer);
  const wavUrl = URL.createObjectURL(wavBlob);
  const mp3Blob = audioBufferToMp3(masterBuffer, 192);
  const mp3Url = URL.createObjectURL(mp3Blob);

  return {
    audioBuffer: masterBuffer,
    wavBlob,
    wavUrl,
    mp3Blob,
    mp3Url,
    totalDuration: masterBuffer.duration,
  };
}

/**
 * Client-side Speech Synthesis preview (Web Speech API)
 * Synthesizes audio using the browser's speech engine if offline or server is unavailable
 */
export function playWebSpeechPreview(
  text: string,
  speaker: 'male' | 'female',
  language: PodcastLanguage,
  config: SpeakerConfig,
  onEnd?: () => void
): () => void {
  if (!('speechSynthesis' in window)) {
    alert('Web Speech Synthesis is not supported in this browser.');
    onEnd?.();
    return () => {};
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const targetLang =
    language === 'pt-PT' ? 'pt-PT' : language === 'pt-BR' ? 'pt-BR' : 'en-US';
  utterance.lang = targetLang;

  // Map pitch (0.6 - 1.4)
  utterance.pitch = Math.max(0.5, Math.min(2.0, config.pitch || 1.0));
  // Map rate (0.7 - 1.5)
  utterance.rate = Math.max(0.5, Math.min(2.0, config.speed || 1.0));
  utterance.volume = Math.max(0, Math.min(1.0, config.volume || 1.0));

  // Voice selection matching gender and language
  const voices = window.speechSynthesis.getVoices();
  const matchingVoices = voices.filter((v) => {
    const code = v.lang.replace('_', '-');
    return language === 'pt-PT'
      ? code.startsWith('pt')
      : code.startsWith('en');
  });

  if (matchingVoices.length > 0) {
    const genderKeywords =
      speaker === 'male'
        ? ['male', 'man', 'david', 'george', 'joão', 'manuel', 'antónio', 'guy']
        : ['female', 'woman', 'zira', 'samantha', 'maria', 'ana', 'joana', 'helena'];

    const matchedVoice =
      matchingVoices.find((v) =>
        genderKeywords.some((k) => v.name.toLowerCase().includes(k))
      ) || matchingVoices[0];

    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = () => {
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
    onEnd?.();
  };
}
