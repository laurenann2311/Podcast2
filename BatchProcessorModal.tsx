import React from 'react';
import { PodcastSegment, BatchProgressState, SpeakerConfig } from '../types/podcast';
import { Loader2, CheckCircle2, AlertCircle, Play, Pause, X, Layers, Clock, Download, FileAudio, Radio } from 'lucide-react';

interface BatchProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: BatchProgressState;
  segments: PodcastSegment[];
  speakers: {
    male: SpeakerConfig;
    female: SpeakerConfig;
  };
  onPauseResume: () => void;
  isPaused: boolean;
  wavUrl?: string | null;
  mp3Url?: string | null;
  totalDuration?: number;
}

export const BatchProcessorModal: React.FC<BatchProcessorModalProps> = ({
  isOpen,
  onClose,
  progress,
  segments,
  speakers,
  onPauseResume,
  isPaused,
  wavUrl,
  mp3Url,
  totalDuration,
}) => {
  if (!isOpen) return null;

  const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const isDone = progress.phase === 'done';

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Batch Audio Processing Engine
              </h3>
              <p className="text-xs text-zinc-400">
                Synthesizing multi-speaker podcast segments into a full dialogue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar & Stat Summary */}
        <div className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200">
                {isDone
                  ? 'Batch Rendering Complete — Conversation Ready!'
                  : progress.phase === 'mixing_master'
                  ? 'Mixing Master Timeline...'
                  : progress.phase === 'encoding'
                  ? 'Encoding WAV and MP3...'
                  : `Processing Segment ${progress.completed + 1} of ${progress.total}`}
              </span>
              {isPaused && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Paused
                </span>
              )}
            </div>
            <span className="font-mono font-bold text-amber-400">{percent}%</span>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isDone
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isDone
                ? `Full episode ready: ${totalDuration ? formatDuration(totalDuration) : ''}`
                : 'Fast neural synthesis with intelligent caching'}
            </span>
            <span>
              {progress.completed} / {progress.total} segments ready
            </span>
          </div>
        </div>

        {/* SUCCESS DOWNLOAD BANNER IF READY */}
        {isDone && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full conversation successfully assembled and mixed!</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {mp3Url && (
                <a
                  href={mp3Url}
                  download="podwave_full_conversation.mp3"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP3 (192kbps)</span>
                </a>
              )}

              {wavUrl && (
                <a
                  href={wavUrl}
                  download="podwave_full_conversation.wav"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 hover:border-zinc-500 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <FileAudio className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download WAV (Lossless)</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Segment Queue Status List */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {segments.map((seg, idx) => {
            const isMale = seg.speaker === 'male';

            return (
              <div
                key={seg.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-zinc-500 w-5">
                    #{idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isMale
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {isMale ? 'Male' : 'Female'}
                  </span>
                  <span className="text-zinc-300 truncate text-[11px]">
                    {seg.text || '(Empty text)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {seg.status === 'ready' && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  )}
                  {seg.status === 'rendering' && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing</span>
                    </span>
                  )}
                  {seg.status === 'idle' && (
                    <span className="text-[11px] text-zinc-500">Queued</span>
                  )}
                  {seg.status === 'error' && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <div>
            {!isDone && (
              <button
                onClick={onPauseResume}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume Batch</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Batch</span>
                  </>
                )}
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all shadow-md ${
              isDone
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
          >
            {isDone ? 'Close to Timeline' : 'Run in Background'}
          </button>
        </div>
      </div>
    </div>
  );
};
