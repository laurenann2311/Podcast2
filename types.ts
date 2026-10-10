export type RadioVoice = "Fenrir" | "Charon" | "Puck" | "Zephyr";

export type RadioFilterMode = "1950s_am" | "gramophone_78" | "shortwave" | "clean_studio";

export interface VoiceOption {
  id: RadioVoice;
  name: string;
  role: string;
  description: string;
  pitchHint: string;
}

export interface PresetBroadcast {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  text: string;
  historicalContext: string;
  suggestedVoice: RadioVoice;
  frequency: number; // in kHz (e.g. 756)
  stationName: string;
}

export interface AudioProcessingSettings {
  filterMode: RadioFilterMode;
  crackleLevel: number; // 0 to 1
  humLevel: number; // 0 to 1
  cabinetWarmth: number; // 0 to 1
  playIntroChime: boolean;
  playbackSpeed: number; // 0.8 to 1.3
  volume: number; // 0 to 1
  voicePitchShift?: number; // Pitch shift multiplier, e.g. 0.94 for deep baritone
  bassBoost?: number; // dB boost at low-chest frequencies (120Hz-250Hz)
  clarityBoost?: number; // dB boost at vocal presence/consonant frequencies (2.8kHz-4.5kHz)
}

export interface AudioGenerationResult {
  audioBase64: string;
  mimeType: string;
  sampleRate: number;
  voice: string;
  text: string;
  generatedAt: number;
}
