export type SpeakerGender = 'male' | 'female';

export type PodcastLanguage = 'en' | 'pt-PT' | 'pt-BR';

export interface ClonedVoiceProfile {
  name: string;
  voiceName: string;
  pitch: number;
  speed: number;
  tone: number;
  stylePrompt: string;
  summary: string;
  detectedAccent?: string;
  sourceAudioBase64?: string;
}

export interface SpeakerConfig {
  id: string;
  name: string; // 'Male' | 'Female'
  gender: SpeakerGender;
  voiceName: string;
  pitch: number; // 0.85 to 1.15 (1.0 = natural)
  speed: number; // 0.85 to 1.25 (1.0 = natural)
  tone: number; // -1.0 (warm analog) to 1.0 (crisp studio presence)
  volume: number; // 0 to 1.2 (1.0 = 100%)
  pan: number; // -1 (left) to 1 (right)
  customAudioFile?: {
    name: string;
    audioBuffer: AudioBuffer;
    audioBase64?: string;
  };
  stylePrompt?: string;
  clonedVoice?: ClonedVoiceProfile;
}

export interface PodcastSegment {
  id: string;
  speaker: SpeakerGender;
  text: string;
  audioBase64?: string;
  audioBuffer?: AudioBuffer;
  audioUrl?: string;
  duration?: number;
  status: 'idle' | 'rendering' | 'ready' | 'error';
  errorMessage?: string;
  isPreviewing?: boolean;
  isCustomAudio?: boolean;
  customAudioName?: string;
  styleDescription?: string;
  clonedVoiceName?: string;
}

export interface MasterPodcastState {
  isRenderingFull: boolean;
  fullAudioBuffer?: AudioBuffer;
  fullWavUrl?: string;
  fullMp3Url?: string;
  totalDuration: number;
  isPlaying: boolean;
  currentTime: number;
}

export interface BatchProgressState {
  isActive: boolean;
  total: number;
  completed: number;
  currentSegmentIndex: number;
  phase: 'idle' | 'generating_segments' | 'mixing_master' | 'encoding' | 'done' | 'error';
  errorMessage?: string;
}
