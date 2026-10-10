import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  Sliders,
  Disc3,
  Flame,
  Radio,
  Sparkles,
  Zap,
  Music,
} from "lucide-react";
import { MagicEyeTube } from "./MagicEyeTube";
import { VUMeter } from "./VUMeter";
import { RadioDial } from "./RadioDial";
import { AudioVisualizer } from "./AudioVisualizer";
import { AudioProcessingSettings, RadioFilterMode, PresetBroadcast } from "../types";

interface VintageRadioCabinetProps {
  settings: AudioProcessingSettings;
  onSettingsChange: (settings: AudioProcessingSettings) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onExportWav: (withEffects: boolean) => void;
  isExporting: boolean;
  hasAudio: boolean;
  currentProgress: { currentTime: number; duration: number };
  getVisualizerData: () => { peak: number; rms: number; frequencyData: Uint8Array };
  activeFrequency: number;
  onFrequencyChange: (freq: number) => void;
  currentPreset?: PresetBroadcast;
  activeText: string;
}

export const VintageRadioCabinet: React.FC<VintageRadioCabinetProps> = ({
  settings,
  onSettingsChange,
  isPlaying,
  onPlay,
  onPause,
  onRestart,
  onExportWav,
  isExporting,
  hasAudio,
  currentProgress,
  getVisualizerData,
  activeFrequency,
  onFrequencyChange,
  currentPreset,
  activeText,
}) => {
  const visualData = getVisualizerData();
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const filterModes: { id: RadioFilterMode; label: string; desc: string }[] = [
    { id: "1950s_am", label: "Rádio AM 1950s", desc: "Filtro passa-banda 320Hz–3.6kHz com saturação a válvulas" },
    { id: "gramophone_78", label: "Gramofone 78 RPM", desc: "Corte estreito com ressonância de corneta acústica" },
    { id: "shortwave", label: "Ondas Curtas (DX)", desc: "Emissão distante com atenuação e ruído de éter" },
    { id: "clean_studio", label: "Estúdio Moderno", desc: "Som limpo sem filtros vintage" },
  ];

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#3a2517] via-[#28180e] to-[#1a0f08] border-8 border-[#4e321e] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_4px_12px_rgba(255,255,255,0.1)] p-4 sm:p-6 text-stone-200">
      {/* Wood Corner Inlay Accents */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-600/40 pointer-events-none" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-600/40 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-600/40 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-600/40 pointer-events-none" />

      {/* Top Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#5c3c24] pb-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#20140c] flex items-center justify-center text-amber-400 font-serif font-black text-xs">
              EN
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-serif font-extrabold text-amber-200 tracking-wider">
              EMISSORA NACIONAL DE RADIODIFUSÃO
            </h1>
            <p className="text-[11px] font-mono uppercase text-amber-500/80 tracking-widest">
              RECEPTOR SUPER-HETERODINO A VÁLVULAS • MOD. 1952
            </p>
          </div>
        </div>

        {/* Live Broadcast Status Indicator */}
        <div className="flex items-center gap-2 bg-[#170e08] border border-amber-800/60 px-3 py-1.5 rounded-full shadow-inner">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPlaying
                ? "bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse"
                : hasAudio
                ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                : "bg-stone-600"
            }`}
          />
          <span className="text-xs font-serif font-bold text-amber-300">
            {isPlaying ? "NO AR (EMISSÃO ATIVA)" : hasAudio ? "PRONTO PARA EMITIR" : "AGUARDA TRANSMISSÃO"}
          </span>
        </div>
      </div>

      {/* Main Radio Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        {/* Left Column: Speaker Grille + Magic Eye Tube + VU Meters */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Speaker Grille & Magic Eye Chamber */}
          <div className="relative rounded-xl bg-[#1d120a] border-4 border-[#3f2716] p-4 shadow-[inset_0_4px_16px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Woven speaker grille cloth texture */}
            <div
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#d97706 1px, transparent 1px), radial-gradient(#b45309 1px, #1d120a 1px)`,
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 4px 4px",
              }}
            />

            <div className="relative z-10 flex items-center justify-around gap-4">
              {/* Magic Eye Vacuum Tube */}
              <MagicEyeTube level={visualData.peak} isActive={isPlaying} />

              {/* Tape Reel / Spool Animation */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative w-16 h-16 rounded-full bg-[#110b06] border-2 border-stone-700 flex items-center justify-center shadow-inner">
                  {/* Spool spokes spinning */}
                  <div
                    className={`w-12 h-12 rounded-full border border-amber-600/40 flex items-center justify-center ${
                      isPlaying ? "animate-spin" : ""
                    }`}
                    style={{ animationDuration: `${2.5 / settings.playbackSpeed}s` }}
                  >
                    <Disc3 className="w-10 h-10 text-amber-500/70" />
                  </div>
                  <div className="absolute w-3 h-3 rounded-full bg-stone-400 border border-stone-800" />
                </div>
                <span className="text-[10px] font-mono text-amber-500/80 uppercase font-semibold">
                  Fita Magnética
                </span>
              </div>
            </div>
          </div>

          {/* Dual Analog VU Meters */}
          <div className="grid grid-cols-2 gap-2">
            <VUMeter level={visualData.rms * 1.5} label="CANAL A (VOZ)" isActive={isPlaying} />
            <VUMeter level={visualData.peak * 1.2} label="CANAL B (MOD)" isActive={isPlaying} />
          </div>

          {/* CRT Oscilloscope */}
          <AudioVisualizer getVisualizerData={getVisualizerData} isPlaying={isPlaying} />
        </div>

        {/* Right Column: Radio Dial + Playback Controls + Sound Texture Knobs */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* Radio Dial Scale */}
          <RadioDial
            currentFreq={activeFrequency}
            onFreqChange={onFrequencyChange}
            activeStationName={currentPreset?.stationName || "EMISSORA NACIONAL"}
          />

          {/* Timeline & Active Progress */}
          <div className="bg-[#191009] border border-amber-900/60 rounded-xl p-3 shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Duração da Emissão:
              </span>
              <span>
                {formatTime(currentProgress.currentTime)} / {formatTime(currentProgress.duration)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-amber-950">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 transition-all duration-100"
                style={{
                  width: `${
                    currentProgress.duration > 0
                      ? (currentProgress.currentTime / currentProgress.duration) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Primary Transport Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e130a] border-2 border-amber-900/50 rounded-xl p-3.5 shadow-md">
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <button
                  type="button"
                  onClick={onPause}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pausar Emissão</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPlay}
                  disabled={!hasAudio}
                  className={`px-6 py-2.5 rounded-xl font-serif font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
                    hasAudio
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700"
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span>Ouvir Emissão 1950s</span>
                </button>
              )}

              <button
                type="button"
                onClick={onRestart}
                disabled={!hasAudio}
                title="Reiniciar Emissão"
                className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-700 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Chime & Speed Selectors */}
            <div className="flex items-center gap-3">
              {/* Intro Chime Toggle */}
              <label className="flex items-center gap-1.5 text-xs font-serif text-amber-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.playIntroChime}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, playIntroChime: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-amber-600 accent-amber-500"
                />
                <span>Sinal Horário / Gongo</span>
              </label>

              {/* Speed Switcher */}
              <div className="flex items-center bg-stone-900 border border-stone-700 rounded-lg p-0.5 text-[11px] font-mono">
                {[0.85, 1.0, 1.15].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => onSettingsChange({ ...settings, playbackSpeed: spd })}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                      settings.playbackSpeed === spd
                        ? "bg-amber-700 text-amber-100 font-bold"
                        : "text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    {spd === 1.0 ? "1x" : `${spd}x`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Retro Knobs & Acoustic Filtering Controls */}
      <div className="bg-[#19100a] border-2 border-amber-950 rounded-xl p-4 shadow-inner">
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-serif font-bold uppercase tracking-wider text-amber-300">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Reguladores Acústicos do Receptor (Filtros de Época)</span>
          </div>

          {/* Download WAV Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onExportWav(true)}
              disabled={!hasAudio || isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-600/50 text-xs font-serif transition-colors cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descarregar Áudio 1950s (.WAV)</span>
            </button>
          </div>
        </div>

        {/* Filter Mode Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {filterModes.map((mode) => {
            const isActive = settings.filterMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onSettingsChange({ ...settings, filterMode: mode.id })}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  isActive
                    ? "bg-amber-950 border-amber-400 text-amber-100 ring-1 ring-amber-500/50 shadow-sm"
                    : "bg-stone-900/70 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                }`}
              >
                <div className="text-xs font-serif font-bold text-amber-200">{mode.label}</div>
                <div className="text-[10px] text-stone-400 mt-0.5 leading-tight">{mode.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Analog Sliders: Volume, Crackle, Hum, Cabinet Warmth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Master Volume */}
          <div className="bg-[#140c07] p-3 rounded-lg border border-amber-950">
            <div className="flex items-center justify-between text-xs font-serif text-amber-300 mb-1">
              <span>Volume Geral:</span>
              <span className="font-mono text-amber-400">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.volume}
              onChange={(e) => onSettingsChange({ ...settings, volume: Number(e.target.value) })}
              className="w-full h-1.5 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Vinyl & Surface Crackle */}
          <div className="bg-[#140c07] p-3 rounded-lg border border-amber-950">
            <div className="flex items-center justify-between text-xs font-serif text-amber-300 mb-1">
              <span>Ruído de Agulha / Éter:</span>
              <span className="font-mono text-amber-400">{Math.round(settings.crackleLevel * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.crackleLevel}
              onChange={(e) =>
                onSettingsChange({ ...settings, crackleLevel: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* 50Hz Mains Hum (Rede Elétrica) */}
          <div className="bg-[#140c07] p-3 rounded-lg border border-amber-950">
            <div className="flex items-center justify-between text-xs font-serif text-amber-300 mb-1">
              <span>Zumbido de Rede (50Hz):</span>
              <span className="font-mono text-amber-400">{Math.round(settings.humLevel * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.humLevel}
              onChange={(e) => onSettingsChange({ ...settings, humLevel: Number(e.target.value) })}
              className="w-full h-1.5 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Tube / Cabinet Warmth */}
          <div className="bg-[#140c07] p-3 rounded-lg border border-amber-950">
            <div className="flex items-center justify-between text-xs font-serif text-amber-300 mb-1">
              <span>Calor das Válvulas:</span>
              <span className="font-mono text-amber-400">{Math.round(settings.cabinetWarmth * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.cabinetWarmth}
              onChange={(e) =>
                onSettingsChange({ ...settings, cabinetWarmth: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-stone-900 rounded appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Synchronized Live Transcript Display */}
      {hasAudio && (
        <div className="mt-4 p-4 rounded-xl bg-[#180f08] border border-amber-900/40 text-xs sm:text-sm font-serif leading-relaxed text-amber-100/90 shadow-inner">
          <div className="text-[10px] font-mono uppercase text-amber-500/80 mb-1.5 tracking-wider flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-amber-400" />
            <span>Transcrição em Emissão Contínua:</span>
          </div>
          <p className="italic text-stone-300">
            &ldquo;{activeText}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};
