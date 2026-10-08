import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PodcastSegment,
  SpeakerConfig,
  PodcastLanguage,
  BatchProgressState,
  ClonedVoiceProfile,
} from './types/podcast';
import { SAMPLE_SCRIPTS } from './data/sampleScripts';
import { VoiceControlPanel } from './components/VoiceControlPanel';
import { ScriptEditor } from './components/ScriptEditor';
import { MasterPlayer } from './components/MasterPlayer';
import { BatchProcessorModal } from './components/BatchProcessorModal';
import { SpeechToTextModal } from './components/SpeechToTextModal';
import {
  mixMasterPodcast,
  decodeAudioBase64,
  getAudioContext,
} from './utils/audioEngine';
import {
  Radio,
  Sparkles,
  Sliders,
  Layers,
  Mic,
  Volume2,
  FileAudio,
  CheckCircle2,
  Headphones,
  Info,
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<PodcastLanguage>('pt-PT');

  // Dual Voice Configuration with individual physical knobs
  const [speakers, setSpeakers] = useState<{
    male: SpeakerConfig;
    female: SpeakerConfig;
  }>({
    male: {
      id: 'speaker-male',
      name: 'Simão',
      gender: 'male',
      voiceName: 'SgbHvexvdPuvqzNjvbPM',
      pitch: 1.0,
      speed: 1.0,
      tone: 0,
      volume: 1.0,
      pan: -0.25,
      stylePrompt:
        'Authentic native European Portuguese (pt-PT) male podcast documentary host. Deep resonant baritone voice, authentic Portugal Lisbon accent, warm chest resonance, engaging conversational storytelling delivery, natural speaking cadence, clear broadcast articulation.',
    },
    female: {
      id: 'speaker-female',
      name: 'Marta',
      gender: 'female',
      voiceName: 'bBNhdwrIjl4fcVYiRbT2',
      pitch: 1.0,
      speed: 1.0,
      tone: 0,
      volume: 1.0,
      pan: 0.25,
      stylePrompt:
        'Authentic native European Portuguese (pt-PT) female podcast host. Expressive, articulate, bright Lisbon accent, engaging conversational pacing, warm natural storytelling inflection, clear and lively broadcast delivery.',
    },
  });

  // Dialogue segments initialized with sample script
  const [segments, setSegments] = useState<PodcastSegment[]>(() => {
    const initialSample = SAMPLE_SCRIPTS[0];
    return initialSample.segments.map((s, idx) => ({
      ...s,
      id: `seg-init-${idx}`,
      status: 'idle',
    }));
  });

  // Master Timeline state
  const [masterAudioBuffer, setMasterAudioBuffer] = useState<AudioBuffer | null>(null);
  const [wavUrl, setWavUrl] = useState<string | null>(null);
  const [mp3Url, setMp3Url] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [includeIntroChime, setIncludeIntroChime] = useState(false);
  const [pauseDuration, setPauseDuration] = useState(0.35);
  const [isRemixing, setIsRemixing] = useState(false);

  // Batch Processing state
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBatchPaused, setIsBatchPaused] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgressState>({
    isActive: false,
    total: 0,
    completed: 0,
    currentSegmentIndex: 0,
    phase: 'idle',
  });

  // Speech-to-Text modal state
  const [isTranscriberOpen, setIsTranscriberOpen] = useState(false);

  // Cancel ref for batch processing
  // Cancel ref for batch processing
  const cancelBatchRef = useRef(false);

  // Keep refs to avoid stale closure issues in async callbacks
  const speakersRef = useRef(speakers);
  speakersRef.current = speakers;

  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  // Handle speaker updates
  const handleUpdateSpeaker = (
    gender: 'male' | 'female',
    updates: Partial<SpeakerConfig>
  ) => {
    setSpeakers((prev) => {
      const next = {
        ...prev,
        [gender]: { ...prev[gender], ...updates },
      };
      speakersRef.current = next;
      return next;
    });
  };

  // Re-mix master timeline from currently ready segments
  const remixMaster = useCallback(
    async (
      currentSegments = segmentsRef.current,
      overrideSpeakers?: { male: SpeakerConfig; female: SpeakerConfig }
    ) => {
      const readySegments = currentSegments.filter(
        (s) => Boolean(s.audioBuffer)
      );
      if (readySegments.length === 0) return;

      const activeSpeakers = overrideSpeakers || speakersRef.current;
      setIsRemixing(true);
      try {
        const result = await mixMasterPodcast(currentSegments, activeSpeakers, {
          includeIntroChime,
          pauseDuration,
        });

        setMasterAudioBuffer(result.audioBuffer);
        setWavUrl(result.wavUrl);
        setMp3Url(result.mp3Url);
        setTotalDuration(result.totalDuration);
      } catch (err) {
        console.error('Failed to remix master:', err);
      } finally {
        setIsRemixing(false);
      }
    },
    [includeIntroChime, pauseDuration]
  );

  // Batch Processing Engine: processes multiple segments with fast caching, retry & acoustic fallback
  const startBatchProcessing = async (
    customSegments?: PodcastSegment[],
    overrideSpeakers?: { male: SpeakerConfig; female: SpeakerConfig },
    openModal = false
  ) => {
    const segmentsToUse = customSegments || segmentsRef.current;
    if (segmentsToUse.length === 0) return;

    const activeSpeakers = overrideSpeakers || speakersRef.current;

    cancelBatchRef.current = false;
    setIsBatchProcessing(true);
    if (openModal) {
      setIsBatchModalOpen(true);
    }
    setIsBatchPaused(false);

    setBatchProgress({
      isActive: true,
      total: segmentsToUse.length,
      completed: segmentsToUse.filter((s) => s.status === 'ready' && s.audioBuffer).length,
      currentSegmentIndex: 0,
      phase: 'generating_segments',
    });

    const updatedSegments = [...segmentsToUse];

    // Loop through segments and synthesize any that are not ready
    for (let i = 0; i < updatedSegments.length; i++) {
      if (cancelBatchRef.current) break;

      const seg = updatedSegments[i];
      const speakerConfig = activeSpeakers[seg.speaker];

      // Skip if already rendered with audio and voice matches
      if (
        seg.audioBuffer &&
        seg.status === 'ready' &&
        !customSegments &&
        (!speakerConfig.clonedVoice || seg.clonedVoiceName === speakerConfig.clonedVoice.name)
      ) {
        continue;
      }

      setBatchProgress((prev) => ({
        ...prev,
        currentSegmentIndex: i,
        phase: 'generating_segments',
      }));

      // Mark segment as rendering
      updatedSegments[i] = { ...seg, status: 'rendering' };
      setSegments([...updatedSegments]);

      let renderedSuccessfully = false;

      // Attempt 1: Call server TTS endpoint with cloned voice profile
      try {
        const res = await fetch('/api/tts/generate-segment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: seg.text,
            speaker: seg.speaker,
            voiceName: speakerConfig.voiceName,
            language,
            pitch: speakerConfig.pitch,
            speed: speakerConfig.speed,
            tone:
              speakerConfig.tone < -0.2
                ? 'warm'
                : speakerConfig.tone > 0.2
                ? 'bright'
                : 'neutral',
            styleDescription:
              speakerConfig.clonedVoice?.stylePrompt ||
              speakerConfig.stylePrompt ||
              seg.styleDescription,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const rawBuffer = await decodeAudioBase64(data.audioBase64);
            updatedSegments[i] = {
              ...seg,
              status: 'ready',
              isCustomAudio: false,
              audioBase64: data.audioBase64,
              audioBuffer: rawBuffer,
              duration: rawBuffer.duration,
              clonedVoiceName: speakerConfig.clonedVoice?.name || seg.clonedVoiceName,
            };
            renderedSuccessfully = true;
          }
        }
      } catch (err) {
        console.warn(`Server segment call failed for ${i}, attempting fallback:`, err);
      }

      // If server segment call failed on first attempt, retry once
      if (!renderedSuccessfully) {
        try {
          await new Promise((r) => setTimeout(r, 600));
          const retryRes = await fetch('/api/tts/generate-segment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: seg.text,
              speaker: seg.speaker,
              voiceName: speakerConfig.voiceName,
              language,
              pitch: speakerConfig.pitch,
              speed: speakerConfig.speed,
              styleDescription:
                speakerConfig.clonedVoice?.stylePrompt ||
                speakerConfig.stylePrompt ||
                seg.styleDescription,
            }),
          });
          if (retryRes.ok) {
            const data = await retryRes.json();
            if (data.audioBase64) {
              const rawBuffer = await decodeAudioBase64(data.audioBase64);
              updatedSegments[i] = {
                ...seg,
                status: 'ready',
                isCustomAudio: false,
                audioBase64: data.audioBase64,
                audioBuffer: rawBuffer,
                duration: rawBuffer.duration,
                clonedVoiceName: speakerConfig.clonedVoice?.name || seg.clonedVoiceName,
              };
              renderedSuccessfully = true;
            }
          }
        } catch (retryErr) {
          console.warn(`Retry failed for segment ${i}:`, retryErr);
        }
      }

      if (!renderedSuccessfully) {
        updatedSegments[i] = {
          ...seg,
          status: 'error',
          errorMessage: 'Unable to synthesize audio segment',
        };
      }

      setSegments([...updatedSegments]);
      setBatchProgress((prev) => ({
        ...prev,
        completed: updatedSegments.filter((s) => s.status === 'ready').length,
      }));
    }

    if (cancelBatchRef.current || updatedSegments.some(s => s.status !== 'ready' || !s.audioBuffer)) {
      setBatchProgress(prev => ({...prev, phase: 'error', errorMessage: 'Podcast incomplete. Resolve failed turns and render again.'}));
      setIsBatchProcessing(false);
      return;
    }
    // Phase 2: Mixing Master & Encoding
    setBatchProgress((prev) => ({
      ...prev,
      phase: 'mixing_master',
    }));

    try {
      const result = await mixMasterPodcast(updatedSegments, activeSpeakers, {
        includeIntroChime,
        pauseDuration,
      });

      setMasterAudioBuffer(result.audioBuffer);
      setWavUrl(result.wavUrl);
      setMp3Url(result.mp3Url);
      setTotalDuration(result.totalDuration);

      setBatchProgress((prev) => ({
        ...prev,
        phase: 'done',
      }));
    } catch (err: any) {
      console.error('Batch mix failed:', err);
      setBatchProgress((prev) => ({
        ...prev,
        phase: 'error',
        errorMessage: err?.message,
      }));
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Apply cloned voice profile to speaker so all text boxes are read using this voice
  const handleApplyClonedVoiceToSpeaker = useCallback(
    async (
      gender: 'male' | 'female',
      clonedProfile: ClonedVoiceProfile,
      autoSynthesize = true
    ) => {
      const nextSpeakers = {
        ...speakersRef.current,
        [gender]: {
          ...speakersRef.current[gender],
          voiceName: clonedProfile.voiceName,
          pitch: clonedProfile.pitch,
          speed: clonedProfile.speed,
          tone: clonedProfile.tone,
          stylePrompt: clonedProfile.stylePrompt,
          clonedVoice: clonedProfile,
        },
      };

      setSpeakers(nextSpeakers);
      speakersRef.current = nextSpeakers;

      // Invalidate segments for this speaker so they synthesize reading their text boxes with this voice!
      const updated = segmentsRef.current.map((s) => {
        if (s.speaker === gender) {
          return {
            ...s,
            status: 'idle' as const,
            isCustomAudio: false,
            audioBuffer: undefined,
            audioBase64: undefined,
            styleDescription: clonedProfile.stylePrompt,
            clonedVoiceName: clonedProfile.name,
          };
        }
        return s;
      });
      setSegments(updated);
      segmentsRef.current = updated;

      if (autoSynthesize) {
        setTimeout(() => {
          startBatchProcessing(updated, nextSpeakers, false);
        }, 50);
      }
    },
    []
  );

  // Clone voice from uploaded audio file and apply it to read all dialogue text boxes
  const handleCloneAndApplyVoice = useCallback(
    async (
      file: File,
      target: 'male' | 'female' | 'both' = 'male'
    ) => {
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const resultStr = typeof reader.result === 'string' ? reader.result : '';
            const commaIdx = resultStr.indexOf(',');
            resolve(commaIdx >= 0 ? resultStr.slice(commaIdx + 1) : resultStr);
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/voice/clone-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: file.type || 'audio/wav',
            fileName: file.name,
            language,
            target,
          }),
        });

        const data = res.ok ? await res.json() : null;

        const detectedGender: 'male' | 'female' =
          data?.gender === 'female' || file.name.toLowerCase().includes('female')
            ? 'female'
            : 'male';
        const actualTarget: 'male' | 'female' | 'both' =
          target === 'both' ? 'both' : (target || detectedGender);

        const isMaleTarget = actualTarget === 'male' || (actualTarget === 'both' && detectedGender === 'male');
        const defaultVoiceName = isMaleTarget ? 'Charon' : 'Aoede';
        const defaultStylePrompt = isMaleTarget
          ? 'Authentic native European Portuguese (pt-PT) male podcast documentary host. Deep resonant baritone voice, authentic Portugal Lisbon accent, warm chest resonance, engaging conversational storytelling delivery, natural speaking cadence, clear broadcast articulation.'
          : 'Authentic native European Portuguese (pt-PT) female podcast host. Expressive, articulate, bright Lisbon accent, engaging conversational pacing, warm natural storytelling inflection, clear and lively broadcast delivery.';

        const clonedProfile: ClonedVoiceProfile = {
          name: file.name,
          voiceName: data?.voiceName || defaultVoiceName,
          pitch: data?.pitch ?? (isMaleTarget ? 0.94 : 1.0),
          speed: data?.speed ?? 1.0,
          tone: data?.tone ?? (isMaleTarget ? -0.2 : 0.1),
          stylePrompt: data?.stylePrompt || defaultStylePrompt,
          summary: data?.summary || `Cloned voice profile for ${file.name}`,
          detectedAccent: data?.detectedAccent || 'European Portuguese (Lisbon)',
          sourceAudioBase64: base64,
        };

        const current = speakersRef.current;
        let nextSpeakers = { ...current };

        if (actualTarget === 'both') {
          nextSpeakers = {
            male: {
              ...current.male,
              voiceName: 'Charon',
              pitch: clonedProfile.pitch ?? 0.94,
              speed: clonedProfile.speed ?? 1.0,
              tone: clonedProfile.tone ?? -0.2,
              stylePrompt: clonedProfile.stylePrompt,
              clonedVoice: { ...clonedProfile, voiceName: 'Charon' },
            },
            female: {
              ...current.female,
              voiceName: 'Aoede',
              pitch: 1.0,
              speed: clonedProfile.speed ?? 1.0,
              tone: 0.1,
              stylePrompt: clonedProfile.stylePrompt,
              clonedVoice: { ...clonedProfile, voiceName: 'Aoede' },
            },
          };
        } else {
          nextSpeakers = {
            ...current,
            [actualTarget]: {
              ...current[actualTarget],
              voiceName: clonedProfile.voiceName,
              pitch: clonedProfile.pitch,
              speed: clonedProfile.speed,
              tone: clonedProfile.tone,
              stylePrompt: clonedProfile.stylePrompt,
              clonedVoice: clonedProfile,
            },
          };
        }

        setSpeakers(nextSpeakers);
        speakersRef.current = nextSpeakers;

        // Update all target segments to use this cloned voice to read their text boxes!
        const updated = segmentsRef.current.map((s) => {
          if (actualTarget === 'both' || s.speaker === actualTarget) {
            return {
              ...s,
              status: 'idle' as const,
              isCustomAudio: false,
              audioBuffer: undefined,
              audioBase64: undefined,
              styleDescription: clonedProfile.stylePrompt,
              clonedVoiceName: file.name,
            };
          }
          return s;
        });

        setSegments(updated);
        segmentsRef.current = updated;

        // Immediately start batch synthesis so text boxes are read in this cloned voice!
        setTimeout(() => {
          startBatchProcessing(updated, nextSpeakers, false);
        }, 50);
      } catch (err) {
        console.warn('Voice clone fallback applied:', err);
      }
    },
    [language]
  );

  // Apply uploaded voice sound file across Portuguese / script dialogue turns
  const handleApplyReferenceAudioToAllSegments = useCallback(
    (audioBuffer: AudioBuffer, fileName: string, base64?: string) => {
      // Trigger voice cloning and apply to read all text boxes
      if (base64) {
        fetch('/api/voice/clone-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: 'audio/wav',
            fileName,
            language,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            const clonedProfile: ClonedVoiceProfile = {
              name: fileName,
              voiceName: data.voiceName || 'Charon',
              pitch: data.pitch ?? 0.94,
              speed: data.speed ?? 1.0,
              tone: data.tone ?? -0.2,
              stylePrompt: data.stylePrompt || '',
              summary: data.summary || `Cloned voice from ${fileName}`,
              detectedAccent: data.detectedAccent,
              sourceAudioBase64: base64,
            };

            const current = speakersRef.current;
            const nextSpeakers = {
              male: {
                ...current.male,
                voiceName: 'Charon',
                pitch: 0.94,
                speed: clonedProfile.speed,
                tone: -0.2,
                stylePrompt: clonedProfile.stylePrompt,
                clonedVoice: clonedProfile,
              },
              female: {
                ...current.female,
                voiceName: 'Aoede',
                pitch: 1.0,
                speed: 1.0,
                tone: 0.1,
                stylePrompt: clonedProfile.stylePrompt,
                clonedVoice: clonedProfile,
              },
            };
            setSpeakers(nextSpeakers);
            speakersRef.current = nextSpeakers;

            const updated = segmentsRef.current.map((s) => ({
              ...s,
              status: 'idle' as const,
              isCustomAudio: false,
              audioBuffer: undefined,
              audioBase64: undefined,
              styleDescription: clonedProfile.stylePrompt,
              clonedVoiceName: fileName,
            }));
            setSegments(updated);
            segmentsRef.current = updated;
            setTimeout(() => startBatchProcessing(updated, nextSpeakers, false), 50);
          })
          .catch((e) => console.warn('Voice clone fallback:', e));
      }
    },
    [language]
  );

  // Apply speaker uploaded audio as a cloned voice to read all turns for that speaker
  const handleApplySpeakerAudioToSegments = useCallback(
    (
      gender: 'male' | 'female',
      audioBuffer: AudioBuffer,
      fileName: string,
      base64?: string
    ) => {
      if (base64) {
        fetch('/api/voice/clone-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: 'audio/wav',
            fileName,
            language,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            const isFem = gender === 'female';
            const clonedProfile: ClonedVoiceProfile = {
              name: fileName,
              voiceName: data.voiceName || (isFem ? 'Aoede' : 'Charon'),
              pitch: data.pitch ?? (isFem ? 1.0 : 0.94),
              speed: data.speed ?? 1.0,
              tone: data.tone ?? (isFem ? 0.1 : -0.2),
              stylePrompt: data.stylePrompt || '',
              summary: data.summary || `Cloned voice from ${fileName}`,
              detectedAccent: data.detectedAccent,
              sourceAudioBase64: base64,
            };
            handleApplyClonedVoiceToSpeaker(gender, clonedProfile, true);
          })
          .catch((err) => {
            console.warn('Speaker voice clone fallback:', err);
          });
      }
    },
    [language, handleApplyClonedVoiceToSpeaker]
  );

  // Backward-compatible alias for Portuguese voice cloning
  const handleClonePortugueseVoice = useCallback(
    (file: File) => handleCloneAndApplyVoice(file, 'both'),
    [handleCloneAndApplyVoice]
  );

  // Language change handler - switches language and loads matching natural sample script
  const handleLanguageChange = (newLang: PodcastLanguage) => {
    setLanguage(newLang);
    const matchingSample = SAMPLE_SCRIPTS.find((s) => s.language === newLang);
    if (matchingSample) {
      const newSegs: PodcastSegment[] = matchingSample.segments.map((s, idx) => ({
        ...s,
        id: `seg-${newLang}-${Date.now()}-${idx}`,
        status: 'idle',
      }));
      setSegments(newSegs);
      segmentsRef.current = newSegs;
      setMasterAudioBuffer(null);
      setWavUrl(null);
      setMp3Url(null);
      setTotalDuration(0);
    }
  };

  const handlePauseResumeBatch = () => {
    setIsBatchPaused((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* APP TOP NAVIGATION */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Headphones className="w-5 h-5 text-zinc-950 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                PodWave Studio
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span>Dual Voice Dialogue</span>
                <span aria-hidden="true">·</span>
                <span>English & Português (PT)</span>
              </div>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-3">
            {/* Language status */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300">
              <span>{language === 'pt-PT' ? '🇵🇹 pt-PT' : '🇬🇧 en-US'}</span>
            </div>

            {/* Speech to text trigger */}
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-zinc-500 transition-colors shadow-sm"
              title="Convert speech to podcast script"
            >
              <Mic className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Speech to Text</span>
            </button>

            {/* Primary Batch Render */}
            <button
              onClick={() => startBatchProcessing(undefined, undefined, true)}
              disabled={isBatchProcessing || segments.length === 0}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-md shadow-amber-500/20 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Render Podcast</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-3 text-sm text-zinc-300">Simão & Marta · Portuguese podcast voices · Audio generation uses your ElevenLabs credits.</div>
      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* SECTION 1: DUAL VOICE HARDWARE CONTROL RACK */}
        <section aria-labelledby="voice-knobs-heading">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h2
                id="voice-knobs-heading"
                className="text-xs font-bold uppercase tracking-wider text-zinc-300"
              >
                Acoustic Knobs & Voice Personas
              </h2>
            </div>
            <div className="text-[11px] text-zinc-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-zinc-400" />
              <span>Adjust pitch, speed, and warmth/brightness tone for each speaker</span>
            </div>
          </div>

          <VoiceControlPanel
            speakers={speakers}
            onUpdateSpeaker={handleUpdateSpeaker}
            language={language}
            onApplySpeakerAudioToSegments={handleApplySpeakerAudioToSegments}
            onApplyClonedVoiceToSpeaker={handleApplyClonedVoiceToSpeaker}
          />
        </section>

        {/* SECTION 2: BACK-AND-FORTH PODCAST SCRIPT EDITOR */}
        <section aria-labelledby="script-editor-heading">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h2
                id="script-editor-heading"
                className="text-xs font-bold uppercase tracking-wider text-zinc-300"
              >
                Back-and-Forth Dialogue Editor
              </h2>
            </div>
            <div className="text-[11px] text-zinc-500">
              <span>{segments.length} dialogue turns · Preview individual segments or render all</span>
            </div>
          </div>

          <ScriptEditor
            segments={segments}
            onUpdateSegments={(segs) => {
              setSegments(segs);
              segmentsRef.current = segs;
            }}
            speakers={speakers}
            language={language}
            onLanguageChange={handleLanguageChange}
            onOpenTranscriber={() => setIsTranscriberOpen(true)}
            onStartBatchProcessing={() => startBatchProcessing(undefined, undefined, true)}
            isBatchProcessing={isBatchProcessing}
            onApplyReferenceAudio={handleApplyReferenceAudioToAllSegments}
            onApplyClonedVoice={handleCloneAndApplyVoice}
            onRemixMaster={() => remixMaster()}
          />
        </section>

        {/* SECTION 3: MASTER PODCAST TIMELINE & EXPORT HUB */}
        <section aria-labelledby="master-player-heading">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <h2
                id="master-player-heading"
                className="text-xs font-bold uppercase tracking-wider text-zinc-300"
              >
                Master Preview & Export Station
              </h2>
            </div>
            <div className="text-[11px] text-zinc-500">
              <span>Export options: WAV 16-bit Lossless & MP3 192kbps</span>
            </div>
          </div>

          <MasterPlayer
            masterAudioBuffer={masterAudioBuffer}
            wavUrl={wavUrl}
            mp3Url={mp3Url}
            totalDuration={totalDuration}
            segments={segments}
            speakers={speakers}
            includeIntroChime={includeIntroChime}
            onToggleIntroChime={setIncludeIntroChime}
            pauseDuration={pauseDuration}
            onChangePauseDuration={setPauseDuration}
            onRemixMaster={() => remixMaster(segments)}
            isRemixing={isRemixing}
            onStartRenderAll={() => startBatchProcessing(undefined, undefined, true)}
          />
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950/80 py-5 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>PodWave Studio · Studio-Grade Dual Voice Podcast Audio Production</p>
          <div className="flex items-center gap-3">
            <span>English (en-US)</span>
            <span>·</span>
            <span>Português de Portugal (pt-PT)</span>
            <span>·</span>
            <span>WAV & MP3</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <BatchProcessorModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        progress={batchProgress}
        segments={segments}
        speakers={speakers}
        onPauseResume={handlePauseResumeBatch}
        isPaused={isBatchPaused}
        wavUrl={wavUrl}
        mp3Url={mp3Url}
        totalDuration={totalDuration}
      />

      <SpeechToTextModal
        isOpen={isTranscriberOpen}
        onClose={() => setIsTranscriberOpen(false)}
        onApplyTranscript={(newSegs) => setSegments(newSegs)}
        language={language}
      />
    </div>
  );
}
