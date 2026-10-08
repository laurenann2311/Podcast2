import React, { useState, useRef } from 'react';
import {
  PodcastSegment,
  SpeakerConfig,
  PodcastLanguage,
  SpeakerGender,
} from '../types/podcast';
import {
  Mic,
  Play,
  Square,
  Plus,
  Trash2,
  ArrowUpDown,
  Sparkles,
  Languages,
  FileText,
  Volume2,
  Copy,
  ChevronDown,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  FileAudio,
} from 'lucide-react';
import { SAMPLE_SCRIPTS } from '../data/sampleScripts';
import {
  getAudioContext,
  decodeAudioBase64,
  processSegmentDsp,
  playWebSpeechPreview,
} from '../utils/audioEngine';

interface ScriptEditorProps {
  segments: PodcastSegment[];
  onUpdateSegments: (segments: PodcastSegment[]) => void;
  speakers: {
    male: SpeakerConfig;
    female: SpeakerConfig;
  };
  language: PodcastLanguage;
  onLanguageChange: (lang: PodcastLanguage) => void;
  onOpenTranscriber: () => void;
  onStartBatchProcessing: (customSegments?: PodcastSegment[]) => void;
  isBatchProcessing: boolean;
  onApplyReferenceAudio?: (audioBuffer: AudioBuffer, fileName: string, base64?: string) => void;
  onApplyClonedVoice?: (file: File, target?: 'male' | 'female' | 'both') => Promise<void>;
  onRemixMaster?: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  segments,
  onUpdateSegments,
  speakers,
  language,
  onLanguageChange,
  onOpenTranscriber,
  onStartBatchProcessing,
  isBatchProcessing,
  onApplyReferenceAudio,
  onApplyClonedVoice,
  onRemixMaster,
}) => {
  const [viewMode, setViewMode] = useState<'segments' | 'raw_text'>('segments');
  const [rawText, setRawText] = useState('');
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [stopPreviewFn, setStopPreviewFn] = useState<(() => void) | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [targetVoiceSpeaker, setTargetVoiceSpeaker] = useState<'male' | 'female' | 'both'>('male');
  const [isCloningReference, setIsCloningReference] = useState(false);

  const referenceFileRef = useRef<HTMLInputElement | null>(null);

  const handleVoiceReferenceUpload = async (file: File) => {
    setIsCloningReference(true);
    try {
      if (onApplyClonedVoice) {
        await onApplyClonedVoice(file, targetVoiceSpeaker);
      } else if (onApplyReferenceAudio) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          onApplyReferenceAudio(null as any, file.name, base64);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Failed to clone voice:', err);
      alert('Could not clone voice from this sound file. Please ensure it is a valid audio file.');
    } finally {
      setIsCloningReference(false);
    }
  };

  // Sync raw text when entering raw text mode
  const enterRawTextMode = () => {
    const textFormatted = segments
      .map((seg) => {
        const role = seg.speaker === 'male' ? 'Male' : 'Female';
        return `${role}: ${seg.text}`;
      })
      .join('\n\n');
    setRawText(textFormatted);
    setViewMode('raw_text');
  };

  // Parse raw text into segments
  const applyRawTextToSegments = () => {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    let currentSpeaker: SpeakerGender = 'male';

    const parsed: PodcastSegment[] = lines.map((line, idx) => {
      const lower = line.toLowerCase();
      let cleaned = line.trim();

      if (
        lower.startsWith('male:') ||
        lower.startsWith('[male]') ||
        lower.startsWith('man:') ||
        lower.startsWith('male voice:') ||
        lower.startsWith('host a:')
      ) {
        currentSpeaker = 'male';
        cleaned = line.replace(/^(male:|\[male\]|man:|male voice:|host a:)\s*/i, '');
      } else if (
        lower.startsWith('female:') ||
        lower.startsWith('[female]') ||
        lower.startsWith('woman:') ||
        lower.startsWith('female voice:') ||
        lower.startsWith('host b:')
      ) {
        currentSpeaker = 'female';
        cleaned = line.replace(/^(female:|\[female\]|woman:|female voice:|host b:)\s*/i, '');
      } else {
        // Alternate turns if no explicit speaker prefix
        currentSpeaker = idx % 2 === 0 ? 'male' : 'female';
      }

      return {
        id: `seg-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        speaker: currentSpeaker,
        text: cleaned,
        status: 'idle',
      };
    });

    onUpdateSegments(parsed);
    setViewMode('segments');
  };

  // Add new dialogue segment
  const handleAddSegment = (afterIndex?: number) => {
    const lastSpeaker =
      segments.length > 0
        ? segments[afterIndex !== undefined ? afterIndex : segments.length - 1].speaker
        : 'female';
    const nextSpeaker: SpeakerGender = lastSpeaker === 'male' ? 'female' : 'male';

    const newSegment: PodcastSegment = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      speaker: nextSpeaker,
      text: '',
      status: 'idle',
    };

    if (afterIndex !== undefined) {
      const copy = [...segments];
      copy.splice(afterIndex + 1, 0, newSegment);
      onUpdateSegments(copy);
    } else {
      onUpdateSegments([...segments, newSegment]);
    }
  };

  // Update specific segment
  const updateSegment = (id: string, updates: Partial<PodcastSegment>) => {
    onUpdateSegments(
      segments.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg))
    );
  };

  // Delete segment
  const deleteSegment = (id: string) => {
    if (segments.length <= 1) return;
    onUpdateSegments(segments.filter((s) => s.id !== id));
  };

  // Duplicate segment
  const duplicateSegment = (index: number) => {
    const target = segments[index];
    const newSeg: PodcastSegment = {
      ...target,
      id: `seg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'idle',
      audioBase64: undefined,
      audioBuffer: undefined,
      audioUrl: undefined,
    };
    const copy = [...segments];
    copy.splice(index + 1, 0, newSeg);
    onUpdateSegments(copy);
  };

  // Toggle speaker for segment
  const toggleSpeaker = (id: string) => {
    onUpdateSegments(
      segments.map((s) =>
        s.id === id
          ? {
              ...s,
              speaker: s.speaker === 'male' ? 'female' : 'male',
              status: 'idle',
              audioBuffer: undefined,
              audioBase64: undefined,
              audioUrl: undefined,
            }
          : s
      )
    );
  };

  // Move segment up or down
  const moveSegment = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= segments.length) return;
    const copy = [...segments];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    onUpdateSegments(copy);
  };

  // Load a sample preset script
  const handleLoadSample = (scriptId: string) => {
    const found = SAMPLE_SCRIPTS.find((s) => s.id === scriptId);
    if (!found) return;

    onLanguageChange(found.language);
    const newSegs: PodcastSegment[] = found.segments.map((s, idx) => ({
      ...s,
      id: `sample-${Date.now()}-${idx}`,
      status: 'idle',
    }));
    onUpdateSegments(newSegs);
  };

  // Preview a single segment
  const handlePreviewSegment = async (seg: PodcastSegment) => {
    if (activePreviewId === seg.id) {
      // Stop preview
      stopPreviewFn?.();
      setActivePreviewId(null);
      setStopPreviewFn(null);
      return;
    }

    if (stopPreviewFn) {
      stopPreviewFn();
    }

    setActivePreviewId(seg.id);
    const speakerConfig = speakers[seg.speaker];

    // Only play cached audioBuffer if segment is marked ready, voice matches, and not custom audio
    const voiceMatches =
      !seg.isCustomAudio &&
      (!speakerConfig.clonedVoice
        ? !seg.clonedVoiceName
        : seg.clonedVoiceName === speakerConfig.clonedVoice.name);

    if (seg.audioBuffer && seg.status === 'ready' && voiceMatches) {
      try {
        const ctx = getAudioContext();
        const dspBuffer = await processSegmentDsp(seg.audioBuffer, speakerConfig);
        const source = ctx.createBufferSource();
        source.buffer = dspBuffer;
        source.connect(ctx.destination);
        source.start();

        setStopPreviewFn(() => () => {
          try {
            source.stop();
          } catch {}
        });

        source.onended = () => {
          setActivePreviewId(null);
          setStopPreviewFn(null);
        };
        return;
      } catch (err) {
        console.error('Error playing audio buffer:', err);
      }
    }

    // Otherwise generate audio for this segment reading this exact text box!
    updateSegment(seg.id, { status: 'rendering' });

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
          tone: speakerConfig.tone < -0.2 ? 'warm' : speakerConfig.tone > 0.2 ? 'bright' : 'neutral',
          styleDescription: speakerConfig.clonedVoice?.stylePrompt || speakerConfig.stylePrompt || seg.styleDescription,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const rawBuffer = await decodeAudioBase64(data.audioBase64);
          const dspBuffer = await processSegmentDsp(rawBuffer, speakerConfig);

          updateSegment(seg.id, {
            status: 'ready',
            isCustomAudio: false,
            audioBase64: data.audioBase64,
            audioBuffer: rawBuffer,
            duration: rawBuffer.duration,
            clonedVoiceName: speakerConfig.clonedVoice?.name || seg.clonedVoiceName,
          });

          const ctx = getAudioContext();
          const source = ctx.createBufferSource();
          source.buffer = dspBuffer;
          source.connect(ctx.destination);
          source.start();

          setStopPreviewFn(() => () => {
            try {
              source.stop();
            } catch {}
          });

          source.onended = () => {
            setActivePreviewId(null);
            setStopPreviewFn(null);
          };
          return;
        }
      }
      throw new Error('Fallback to local speech synthesis');
    } catch {
      const cancelSpeech = playWebSpeechPreview(
        seg.text,
        seg.speaker,
        language,
        speakerConfig,
        () => {
          setActivePreviewId(null);
          setStopPreviewFn(null);
        }
      );
      setStopPreviewFn(() => cancelSpeech);
    }
  };

  // Upload a voice audio file for this speaker to clone and read dialogue turns
  const handleSegmentAudioUpload = async (segId: string, file: File) => {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return;
    if (onApplyClonedVoice) {
      await onApplyClonedVoice(file, seg.speaker);
    }
  };

  // AI Script Assistant actions
  const handleAiAction = async (action: 'generate' | 'translate' | 'polish') => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/script/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          topic: aiTopic,
          script: segments.map((s) => ({ speaker: s.speaker, text: s.text })),
          language,
        }),
      });

      if (!res.ok) throw new Error('AI script assist request failed');
      const data = await res.json();

      if (Array.isArray(data.segments) && data.segments.length > 0) {
        const newSegs: PodcastSegment[] = data.segments.map(
          (s: { speaker: SpeakerGender; text: string }, idx: number) => ({
            id: `ai-${Date.now()}-${idx}`,
            speaker: s.speaker || (idx % 2 === 0 ? 'male' : 'female'),
            text: s.text,
            status: 'idle',
          })
        );
        onUpdateSegments(newSegs);
        setShowAiModal(false);
        setAiTopic('');
      }
    } catch (err: any) {
      alert(err?.message || 'AI generation failed');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const renderedCount = segments.filter((s) => s.status === 'ready').length;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => onLanguageChange('en')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                language === 'en'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🇬🇧 English</span>
            </button>
            <button
              onClick={() => onLanguageChange('pt-PT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                language === 'pt-PT'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🇵🇹 Português (PT)</span>
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setViewMode('segments')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'segments'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Dialogue Cards
            </button>
            <button
              onClick={enterRawTextMode}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'raw_text'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Full Text Box
            </button>
          </div>

          {/* Sample Preset Script Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleLoadSample(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-600 cursor-pointer"
            >
              <option value="" disabled>
                Load Sample Episode...
              </option>
              {SAMPLE_SCRIPTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.language === 'pt-PT' ? '🇵🇹' : '🇬🇧'} {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side AI & Speech to text actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-500 transition-colors"
            title="Upload audio or record mic to convert speech to podcast script"
          >
            <Mic className="w-3.5 h-3.5 text-sky-400" />
            <span>Speech to Text</span>
          </button>

          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800/80 hover:to-purple-800/80 text-indigo-200 border border-indigo-700/60 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Script Tools</span>
          </button>

          {/* BATCH RENDER BUTTON */}
          <button
            onClick={() => onStartBatchProcessing()}
            disabled={isBatchProcessing || segments.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBatchProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Batch Processing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Render All ({renderedCount}/{segments.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RAW TEXT BOX MODE */}
      {viewMode === 'raw_text' && (
        <div className="space-y-4">
          <div className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">
                Paste your podcast transcript below. Prefix lines with &apos;Male:&apos; and &apos;Female:&apos;.
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {rawText.split('\n').filter((l) => l.trim()).length} lines
              </span>
            </div>
            <textarea
              rows={14}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Male: Welcome to today's podcast episode!\nFemale: Thanks! I'm really excited to dive into this discussion.\nMale: Let's start with the core concepts.\nFemale: Exactly, here is what listeners will find most intriguing...`}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 font-mono leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setViewMode('segments')}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={applyRawTextToSegments}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-md"
            >
              Parse into Back-and-Forth Dialogue Cards
            </button>
          </div>
        </div>
      )}

      {/* SEGMENTED DIALOGUE CARDS VIEW */}
      {viewMode === 'segments' && (
        <div className="space-y-3">
          {segments.map((seg, idx) => {
            const isMale = seg.speaker === 'male';
            const isPreviewingThis = activePreviewId === seg.id;

            return (
              <div
                key={seg.id}
                className={`relative rounded-xl border p-4 transition-all ${
                  isMale
                    ? 'bg-zinc-950/70 border-amber-500/25 hover:border-amber-500/45'
                    : 'bg-zinc-950/70 border-rose-500/25 hover:border-rose-500/45'
                }`}
              >
                {/* Segment Header */}
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    {/* Speaker badge (clickable to switch) */}
                    <button
                      onClick={() => toggleSpeaker(seg.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border transition-all ${
                        isMale
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                      }`}
                      title="Click to toggle speaker (Male / Female)"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{isMale ? 'Male Voice' : 'Female Voice'}</span>
                    </button>

                    <span className="text-[11px] text-zinc-500 font-mono">
                      Turn {idx + 1}
                    </span>

                    {/* Cloned Voice badge */}
                    {speakers[seg.speaker].clonedVoice && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                        <Mic className="w-3 h-3 text-amber-400" />
                        <span>Voice: {speakers[seg.speaker].clonedVoice?.name}</span>
                      </span>
                    )}

                    {/* Status indicator */}
                    {seg.status === 'ready' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready {seg.duration ? `(${seg.duration.toFixed(1)}s)` : ''}</span>
                      </span>
                    )}

                    {seg.status === 'rendering' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Synthesizing...</span>
                      </span>
                    )}
                  </div>

                  {/* Actions: Preview, Upload Sound File, Move Up/Down, Duplicate, Delete */}
                  <div className="flex items-center gap-1.5">
                    {/* PREVIEW BUTTON */}
                    <button
                      onClick={() => handlePreviewSegment(seg)}
                      disabled={!seg.text.trim() && !seg.audioBuffer}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                        isPreviewingThis
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm animate-pulse'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                      }`}
                      title="Preview this text box read in the assigned voice"
                    >
                      {isPreviewingThis ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Preview</span>
                        </>
                      )}
                    </button>

                    {/* UPLOAD VOICE FOR THIS SPEAKER */}
                    

                    <button
                      onClick={() => moveSegment(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 rounded transition-colors"
                      title="Move Up"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => duplicateSegment(idx)}
                      className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                      title="Duplicate Segment"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteSegment(seg.id)}
                      disabled={segments.length <= 1}
                      className="p-1 text-zinc-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 rounded transition-colors"
                      title="Delete Segment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cloned Voice Active Badge on this card */}
                {speakers[seg.speaker].clonedVoice && (
                  <div className="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-1.5 text-xs text-emerald-300 mb-2.5">
                    <span className="flex items-center gap-1.5 font-medium truncate">
                      <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        Voice from <strong className="text-zinc-100">{speakers[seg.speaker].clonedVoice?.name}</strong> reads this text box
                      </span>
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-mono shrink-0">
                      Cloned Voice Active
                    </span>
                  </div>
                )}

                {/* Segment Textarea */}
                <textarea
                  rows={2}
                  value={seg.text}
                  onChange={(e) =>
                    updateSegment(seg.id, {
                      text: e.target.value,
                      status: 'idle',
                      audioBuffer: undefined,
                      audioBase64: undefined,
                      isCustomAudio: false,
                    })
                  }
                  placeholder={
                    isMale
                      ? `Male voice dialogue text to read out loud...`
                      : `Female voice dialogue text to read out loud...`
                  }
                  className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-lg p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors leading-relaxed"
                />

                {/* Insert between segments button */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => handleAddSegment(idx)}
                    className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-zinc-700 shadow-md"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add Turn
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Segment at End */}
          <div className="pt-2 flex items-center justify-center">
            <button
              onClick={() => handleAddSegment()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Dialogue Turn</span>
            </button>
          </div>
        </div>
      )}

      {/* AI SCRIPT TOOLS MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-zinc-100">AI Podcast Script Assistant</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Generate Dialogue Option */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Generate Full Episode Script by Topic
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. History of Lisbon and Fado music, or Quantum Computing"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleAiAction('generate')}
                  disabled={isAiGenerating || !aiTopic.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                >
                  {isAiGenerating ? 'Writing...' : 'Generate'}
                </button>
              </div>
            </div>

            {/* Translate Option */}
            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-emerald-400" />
                    Bilingual Script Translation
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Translate current script into {language === 'pt-PT' ? 'English' : 'Português de Portugal (pt-PT)'}.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const targetLang = language === 'pt-PT' ? 'en' : 'pt-PT';
                    onLanguageChange(targetLang);
                    handleAiAction('translate');
                  }}
                  disabled={isAiGenerating || segments.length === 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                >
                  Translate Now
                </button>
              </div>
            </div>

            {/* Polish Conversational Nuance */}
            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    Add Conversational Nuances
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Enrich script with natural pauses, affirmations (|mhm|, |yeah|), and vocal dynamics.
                  </p>
                </div>
                <button
                  onClick={() => handleAiAction('polish')}
                  disabled={isAiGenerating || segments.length === 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                >
                  Enhance Script
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
