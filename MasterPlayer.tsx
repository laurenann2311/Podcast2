import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Download,
  Volume2,
  Sparkles,
  Sliders,
  Music,
  Radio,
  FileAudio,
  CheckCircle2,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { PodcastSegment, SpeakerConfig } from '../types/podcast';
import { getAudioContext } from '../utils/audioEngine';

interface MasterPlayerProps {
  masterAudioBuffer: AudioBuffer | null;
  wavUrl: string | null;
  mp3Url: string | null;
  totalDuration: number;
  segments: PodcastSegment[];
  speakers: {
    male: SpeakerConfig;
    female: SpeakerConfig;
  };
  includeIntroChime: boolean;
  onToggleIntroChime: (val: boolean) => void;
  pauseDuration: number;
  onChangePauseDuration: (val: number) => void;
  onRemixMaster: () => void;
  isRemixing: boolean;
  onStartRenderAll?: () => void;
}

export const MasterPlayer: React.FC<MasterPlayerProps> = ({
  masterAudioBuffer,
  wavUrl,
  mp3Url,
  totalDuration,
  segments,
  speakers,
  includeIntroChime,
  onToggleIntroChime,
  pauseDuration,
  onChangePauseDuration,
  onRemixMaster,
  isRemixing,
  onStartRenderAll,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1.0);

  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop playback when buffer changes
  useEffect(() => {
    stopPlayback();
    setCurrentTime(0);
    pauseTimeRef.current = 0;
  }, [masterAudioBuffer]);

  // Update canvas waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !masterAudioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const data = masterAudioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    const progressX = (currentTime / (totalDuration || 1)) * width;

    // Draw background waveform bars
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const barHeight = Math.max(2, (max - min) * amp * 0.9);
      const y = (height - barHeight) / 2;

      // Color based on playback progress
      if (i <= progressX) {
        ctx.fillStyle = '#f59e0b'; // Amber for played
      } else {
        ctx.fillStyle = '#3f3f46'; // Zinc for unplayed
      }

      ctx.fillRect(i, y, 1.5, barHeight);
    }
  }, [masterAudioBuffer, currentTime, totalDuration]);

  const startPlayback = (offsetSeconds = 0) => {
    if (!masterAudioBuffer) return;
    const audioCtx = getAudioContext();

    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {}
    }

    const source = audioCtx.createBufferSource();
    source.buffer = masterAudioBuffer;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;
    gainNodeRef.current = gainNode;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const safeOffset = Math.max(0, Math.min(offsetSeconds, masterAudioBuffer.duration - 0.05));
    source.start(0, safeOffset);

    startTimeRef.current = audioCtx.currentTime - safeOffset;
    activeSourceRef.current = source;
    setIsPlaying(true);

    const updateTimer = () => {
      if (!activeSourceRef.current) return;
      const elapsed = audioCtx.currentTime - startTimeRef.current;
      if (elapsed >= masterAudioBuffer.duration) {
        setIsPlaying(false);
        setCurrentTime(masterAudioBuffer.duration);
        pauseTimeRef.current = 0;
        return;
      }
      setCurrentTime(elapsed);
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };
    animationFrameRef.current = requestAnimationFrame(updateTimer);

    source.onended = () => {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  };

  const pausePlayback = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {}
      activeSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    pauseTimeRef.current = currentTime;
    setIsPlaying(false);
  };

  const stopPlayback = () => {
    pausePlayback();
    setCurrentTime(0);
    pauseTimeRef.current = 0;
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback(pauseTimeRef.current);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!masterAudioBuffer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * (totalDuration || masterAudioBuffer.duration);

    setCurrentTime(targetTime);
    pauseTimeRef.current = targetTime;

    if (isPlaying) {
      startPlayback(targetTime);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-2xl backdrop-blur-sm space-y-5">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 flex items-center justify-center shadow-inner">
            <Radio className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Master Podcast Studio
              {masterAudioBuffer && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready to Export
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400">
              Interactive timeline with stereo imaging and studio MP3/WAV export
            </p>
          </div>
        </div>

        {/* Studio timeline options */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Inter-speaker pause duration */}
          <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-400">Pause:</span>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={pauseDuration}
              onChange={(e) => onChangePauseDuration(parseFloat(e.target.value))}
              className="w-16 accent-amber-500 cursor-pointer"
            />
            <span className="font-mono text-zinc-200">{pauseDuration.toFixed(2)}s</span>
          </div>

          {/* Re-mix button */}
          <button
            onClick={onRemixMaster}
            disabled={isRemixing || segments.filter((s) => s.audioBuffer).length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-40 transition-colors"
            title="Re-mix timeline with latest knob adjustments and pause settings"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRemixing ? 'animate-spin' : ''}`} />
            <span>Remix Timeline</span>
          </button>
        </div>
      </div>

      {/* WAVEFORM CANVAS & SCRUBBER */}
      <div className="space-y-2">
        <div
          onClick={handleSeek}
          className="relative w-full h-24 bg-zinc-950 rounded-xl border border-zinc-800/90 overflow-hidden cursor-pointer hover:border-zinc-700 transition-colors group"
        >
          {masterAudioBuffer ? (
            <>
              <canvas
                ref={canvasRef}
                width={800}
                height={96}
                className="w-full h-full block"
              />
              {/* Playhead indicator needle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] pointer-events-none"
                style={{
                  left: `${(currentTime / (totalDuration || 1)) * 100}%`,
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500 text-xs space-y-1">
              <Layers className="w-6 h-6 text-zinc-600 mb-1" />
              <p className="font-medium text-zinc-400">Master audio track is not rendered yet.</p>
              <p className="text-[11px] text-zinc-500">
                Click &quot;Render All&quot; above to batch process dialogue turns into a complete podcast episode.
              </p>
            </div>
          )}
        </div>

        {/* Timecode and scrubber labels */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
          <span className="text-amber-400 font-semibold">{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration || 0)}</span>
        </div>
      </div>

      {/* MULTI-TRACK CONVERSATIONAL FLOW STRIP */}
      {segments.length > 0 && (
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Conversational Multi-Track Flow</span>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Male Voice
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Female Voice
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 w-full h-7 bg-zinc-900 rounded-lg p-1 overflow-hidden border border-zinc-800">
            {segments.map((seg, idx) => {
              const isMale = seg.speaker === 'male';
              const isReady = seg.status === 'ready';
              return (
                <div
                  key={seg.id}
                  className={`h-full rounded flex items-center justify-center text-[9px] font-bold truncate px-1 transition-all ${
                    isMale
                      ? isReady
                        ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
                      : isReady
                      ? 'bg-rose-500/30 border border-rose-500/50 text-rose-300'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-500'
                  }`}
                  style={{ flex: Math.max(1, (seg.text.length / 40)) }}
                  title={`Turn ${idx + 1}: ${isMale ? 'Male Voice' : 'Female Voice'} (${seg.text.slice(0, 40)}...)`}
                >
                  #{idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTROLS & EXPORT HUB */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayPause}
            disabled={!masterAudioBuffer}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            title={isPlaying ? 'Pause' : 'Play full podcast'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={stopPlayback}
            disabled={!masterAudioBuffer}
            className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 transition-colors"
            title="Stop"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <div className="flex items-center gap-2 ml-2 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <input
              type="range"
              min="0"
              max="1.2"
              step="0.05"
              value={volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                if (gainNodeRef.current) {
                  gainNodeRef.current.gain.value = val;
                }
              }}
              className="w-20 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* EXPORT BUTTONS: MP3 & WAV */}
        {(() => {
          const readyCount = segments.filter((s) => s.status === 'ready' && s.audioBuffer).length;
          const isFullyRendered = segments.length > 0 && readyCount === segments.length && Boolean(masterAudioBuffer);

          return (
            <div className="flex flex-wrap items-center gap-2.5">
              {isFullyRendered && mp3Url ? (
                <a
                  href={mp3Url}
                  download="podwave_full_conversation.mp3"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  title="Download the full completed podcast conversation in high quality MP3 (192kbps)"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full Conversation (MP3)</span>
                </a>
              ) : (
                <button
                  onClick={() => {
                    if (onStartRenderAll) {
                      onStartRenderAll();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  title="Render all dialogue turns to guarantee full conversation download"
                >
                  <Sparkles className="w-4 h-4 text-zinc-950" />
                  <span>
                    Render & Download Full Conversation ({readyCount}/{segments.length} Ready)
                  </span>
                </button>
              )}

              {isFullyRendered && wavUrl ? (
                <a
                  href={wavUrl}
                  download="podwave_full_conversation.wav"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer"
                  title="Download lossless master WAV"
                >
                  <FileAudio className="w-4 h-4 text-sky-400" />
                  <span>Export Lossless WAV</span>
                </a>
              ) : null}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
