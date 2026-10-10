import React, { useState, useEffect, useRef } from "react";
import { VintageRadioAudioEngine } from "./utils/audioEngine";
import { PRESET_BROADCASTS } from "./data/presets";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  Radio,
  Mic,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Award,
  Sliders,
  FileAudio,
  BookOpen,
} from "lucide-react";

const INITIAL_TEXT =
  "Em visita particular às instalações das Minas de Lenhite do Espadanal, chegou a esta vila, cerca das 15 horas do dia 25, o Senhor Ministro da Economia, que, como já dissemos no último número do nosso jornal, em informação aliás incompleta, era aguardado junto do cais do caminho de ferro mineiro pelos senhores Doutor Astério Rosa, Administrador Delegado da Empresa Industrial Carbonífera Electrotécnica, Limitada, proprietária das referidas minas; Engenheiro Cílio Rosa, Administrador da mesma empresa; Engenheiro Falcão Mena, Director Técnico das Minas; Major Cabral de Quadros e Doutor Branco, respectivamente, Presidente e Secretário da Câmara Municipal; Doutor Vidigal Pais, médico da empresa, e Doutor Calado da Maia, que representava a União Nacional, na ausência do Presidente do mesmo organismo; Engenheiros Castro e Sola, Director Geral de Minas; Ferreira do Amaral, Director Geral dos Serviços Industriais; Alexandre Vasconcelos Matias.";

interface VoiceConfig {
  id: "Fenrir" | "Charon" | "Puck" | "Zephyr";
  title: string;
  role: string;
  registerBadge: string;
  description: string;
  accentHint: string;
  defaultPitch: number;
  defaultBass: number;
  defaultClarity: number;
  defaultSpeed: number;
}

const VOICES: VoiceConfig[] = [
  {
    id: "Fenrir",
    title: "Fenrir — O Baixo Solene de Estado",
    role: "Locutor Oficial da Emissora Nacional",
    registerBadge: "Baixo Cavernoso (Mais Grave)",
    description: "Baixo-barítono muito profundo, cavernoso, solene e ministerial com ressonância peitoral máxima de 1950.",
    accentHint: "Dicção austera e pausada de Lisboa (Quelhas), pausas deliberadas e solenidade institucional.",
    defaultPitch: 0.93,
    defaultBass: 8,
    defaultClarity: 6,
    defaultSpeed: 0.94,
  },
  {
    id: "Charon",
    title: "Charon — O Barítono Nobre de Noticiário",
    role: "Comentador Noticioso & Editorialista de Época",
    registerBadge: "Barítono Nobre & Distinto",
    description: "Voz média-grave culta, aristocrática e elegante de estúdio, típica do Jornal Falado e crónicas internacionais.",
    accentHint: "Dicção formal e equilibrada de Portugal continental, ritmo estável e sem afetação.",
    defaultPitch: 0.98,
    defaultBass: 5,
    defaultClarity: 7,
    defaultSpeed: 1.0,
  },
  {
    id: "Puck",
    title: "Puck — O Repórter Dinâmico de Campo",
    role: "Correspondente de Exterior em Emissão Direta",
    registerBadge: "Barítono Enérgico (Exterior)",
    description: "Voz masculina viva, enérgica, incisiva e projetada, ideal para reportagens nas minas, portos e acontecimentos ao ar livre.",
    accentHint: "Cadência rápida, entoação dinâmica e assertiva de reportagem jornalística em direto de 1950.",
    defaultPitch: 1.01,
    defaultBass: 2,
    defaultClarity: 9,
    defaultSpeed: 1.06,
  },
  {
    id: "Zephyr",
    title: "Zephyr — O Cronista Noturno de Salão",
    role: "Apresentador Noturno & Boletins Marítimos",
    registerBadge: "Voz Aveludada & Suave",
    description: "Voz aveludada, suave, profunda e intimista, com caloroso efeito de proximidade de microfone de fita.",
    accentHint: "Cadência serena e melódica de salão radiofónico, suavidade nos fonemas sibilantes de Portugal.",
    defaultPitch: 0.96,
    defaultBass: 6,
    defaultClarity: 5,
    defaultSpeed: 0.96,
  },
];

export default function App() {
  const [text, setText] = useState<string>(INITIAL_TEXT);
  const [voice, setVoice] = useState<"Fenrir" | "Charon" | "Puck" | "Zephyr">("Fenrir");
  const [pitchDepth, setPitchDepth] = useState<"very_deep" | "deep">("very_deep");
  const [bassBoostAmount, setBassBoostAmount] = useState<number>(8); // dB (Warm, clean chest resonance)
  const [clarityBoostAmount, setClarityBoostAmount] = useState<number>(6); // dB (High vocal clarity & crisp diction)
  const [pitchShiftMultiplier, setPitchShiftMultiplier] = useState<number>(0.93); // Crisp articulation
  const [radioEffect, setRadioEffect] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(0.94); // Natural 1950s broadcasting tempo
  const [volume, setVolume] = useState<number>(0.95);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasAudio, setHasAudio] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const audioEngineRef = useRef<VintageRadioAudioEngine | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    audioEngineRef.current = new VintageRadioAudioEngine();
    return () => {
      if (audioEngineRef.current) audioEngineRef.current.stop();
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Sync settings with audio engine
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.updateSettings({
        filterMode: radioEffect ? "1950s_am" : "clean_studio",
        crackleLevel: radioEffect ? 0.2 : 0,
        humLevel: radioEffect ? 0.1 : 0,
        cabinetWarmth: radioEffect ? 0.7 : 0,
        playIntroChime: radioEffect,
        playbackSpeed: speed,
        volume: volume,
        voicePitchShift: pitchShiftMultiplier,
        bassBoost: bassBoostAmount,
        clarityBoost: clarityBoostAmount,
      });
    }
  }, [radioEffect, speed, volume, pitchShiftMultiplier, bassBoostAmount, clarityBoostAmount]);

  // Track playback time
  useEffect(() => {
    const loop = () => {
      if (audioEngineRef.current) {
        const prog = audioEngineRef.current.getPlaybackProgress();
        setCurrentTime(prog.currentTime);
        setDuration(prog.duration);
        if (prog.isPlaying !== isPlaying) {
          setIsPlaying(prog.isPlaying);
        }
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  const handleSelectVoice = (selectedId: "Fenrir" | "Charon" | "Puck" | "Zephyr") => {
    setVoice(selectedId);
    const cfg = VOICES.find((v) => v.id === selectedId);
    if (cfg) {
      // Adapt tuning defaults to highlight the unique variety of each male voice
      setPitchShiftMultiplier(cfg.defaultPitch);
      setBassBoostAmount(cfg.defaultBass);
      setClarityBoostAmount(cfg.defaultClarity);
      setSpeed(cfg.defaultSpeed);
      if (selectedId === "Fenrir") {
        setPitchDepth("very_deep");
      } else {
        setPitchDepth("deep");
      }
    }
  };

  const handleLoadPreset = (presetText: string, suggestedVoice: "Fenrir" | "Charon" | "Puck" | "Zephyr") => {
    setText(presetText);
    handleSelectVoice(suggestedVoice);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    try {
      setIsGenerating(true);
      setError(null);
      setDownloadSuccessMsg(null);

      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
      setIsPlaying(false);

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice,
          pitchDepth,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ao gerar voz (${res.status})`);
      }

      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error("Não foram recebidos dados de áudio.");
      }

      if (audioEngineRef.current) {
        await audioEngineRef.current.decodeAudio(data.audioBase64, data.mimeType || "audio/pcm;rate=24000");
        setHasAudio(true);

        // Auto play with vintage DSP
        audioEngineRef.current.play(
          {
            filterMode: radioEffect ? "1950s_am" : "clean_studio",
            crackleLevel: radioEffect ? 0.2 : 0,
            humLevel: radioEffect ? 0.1 : 0,
            cabinetWarmth: radioEffect ? 0.7 : 0,
            playIntroChime: radioEffect,
            playbackSpeed: speed,
            volume: volume,
            voicePitchShift: pitchShiftMultiplier,
            bassBoost: bassBoostAmount,
            clarityBoost: clarityBoostAmount,
          },
          0,
          () => setIsPlaying(false)
        );
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Falha ao gerar a síntese vocal.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = () => {
    if (!audioEngineRef.current || !hasAudio) return;
    const effectiveSpeed = speed * pitchShiftMultiplier;
    const maxDur = duration > 0 ? duration : (audioEngineRef.current.getCurrentBuffer()?.duration || 1) / effectiveSpeed;
    const offset = currentTime >= maxDur ? 0 : currentTime;

    audioEngineRef.current.play(
      {
        filterMode: radioEffect ? "1950s_am" : "clean_studio",
        crackleLevel: radioEffect ? 0.2 : 0,
        humLevel: radioEffect ? 0.1 : 0,
        cabinetWarmth: radioEffect ? 0.7 : 0,
        playIntroChime: false,
        playbackSpeed: speed,
        volume: volume,
        voicePitchShift: pitchShiftMultiplier,
        bassBoost: bassBoostAmount,
        clarityBoost: clarityBoostAmount,
      },
      offset,
      () => setIsPlaying(false)
    );
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.pause();
    setIsPlaying(false);
  };

  const handleRestart = () => {
    if (!audioEngineRef.current || !hasAudio) return;
    audioEngineRef.current.play(
      {
        filterMode: radioEffect ? "1950s_am" : "clean_studio",
        crackleLevel: radioEffect ? 0.2 : 0,
        humLevel: radioEffect ? 0.1 : 0,
        cabinetWarmth: radioEffect ? 0.7 : 0,
        playIntroChime: radioEffect,
        playbackSpeed: speed,
        volume: volume,
        voicePitchShift: pitchShiftMultiplier,
        bassBoost: bassBoostAmount,
        clarityBoost: clarityBoostAmount,
      },
      0,
      () => setIsPlaying(false)
    );
    setIsPlaying(true);
  };

  // Download handler supporting both full 1950s radio effect and clean studio vocal
  const handleDownload = async (applyVintageEffects: boolean = true) => {
    if (!audioEngineRef.current || !hasAudio) return;
    try {
      setIsExporting(true);
      setError(null);
      setDownloadSuccessMsg(null);

      const blob = await audioEngineRef.current.exportAsWav(
        {
          filterMode: applyVintageEffects ? "1950s_am" : "clean_studio",
          crackleLevel: applyVintageEffects ? 0.2 : 0,
          humLevel: applyVintageEffects ? 0.1 : 0,
          cabinetWarmth: applyVintageEffects ? 0.7 : 0,
          playIntroChime: false,
          playbackSpeed: speed,
          volume: 1.0,
          voicePitchShift: pitchShiftMultiplier,
          bassBoost: bassBoostAmount,
          clarityBoost: clarityBoostAmount,
        },
        applyVintageEffects
      );

      const fileName = `emissora_nacional_1950s_pt-PT_${voice.toLowerCase()}_${applyVintageEffects ? "radio_am" : "estudio_limpo"}.wav`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);

      const sizeKb = Math.round(blob.size / 1024);
      setDownloadSuccessMsg(`Descarregado com sucesso: "${fileName}" (${sizeKb} KB, WAV 16-bit 44.1kHz).`);
      setTimeout(() => setDownloadSuccessMsg(null), 6000);
    } catch (e: any) {
      console.error(e);
      setError("Erro ao renderizar e descarregar o ficheiro .WAV.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" />
            Emissora Nacional de Radiodifusão • Anos 1950
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-amber-100">
            Locutor de Rádio dos Anos 1950 (Vozes Masculinas de Época)
          </h1>
          <p className="text-sm text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Síntese vocal masculina com dicção rigorosa em <strong className="text-amber-300">Português de Portugal (pt-PT)</strong>, 
            sotaque continental dos estúdios de Lisboa dos anos 50 e processamento acústico a válvulas com exportação em formato <strong className="text-amber-300">.WAV</strong>.
          </p>

          {/* Accent & Phonetics Badge */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 font-medium">
              <span className="text-base leading-none">🇵🇹</span>
              <span>Sotaque Estrito: Portugal Continental (pt-PT / Lisboa)</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 text-[11px]">
              Vogais átonas reduzidas [ɨ]/[u]
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 text-[11px]">
              Sibilantes chiadas [ʃ]/[ʒ]
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 text-[11px]">
              Oclusivas dentais secas [t]/[d]
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 text-[11px]">
              Zero sotaque brasileiro
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Download Success Notification */}
        {downloadSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-sm flex items-start gap-3 animate-fade-in">
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{downloadSuccessMsg}</div>
          </div>
        )}

        {/* Historical Presets Quick Selector */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Textos Históricos de Portugal dos Anos 1950 (Predefinições):
            </span>
            <span className="text-[11px] text-stone-500 hidden sm:inline">Clique para carregar o texto e locutor recomendado</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PRESET_BROADCASTS.map((p) => {
              const voiceMatch = VOICES.find((v) => v.id === p.suggestedVoice);
              const isCurrent = text === p.text;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleLoadPreset(p.text, p.suggestedVoice)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-amber-500/15 border-amber-500/80 text-amber-200 shadow-sm"
                      : "bg-stone-950/60 border-stone-800/80 text-stone-300 hover:border-stone-700 hover:bg-stone-950"
                  }`}
                >
                  <div className="text-[11px] font-bold text-amber-400 truncate">{p.title}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5 truncate">{p.stationName} • {p.date}</div>
                  <div className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Locutor: {voiceMatch?.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Input Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Texto para Locução (Português de Portugal):
            </label>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copiado!" : "Copiar"}</span>
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl p-4 text-stone-200 text-sm sm:text-base font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-y"
            placeholder="Insira aqui o texto a sintetizar em português de Portugal..."
          />

          {/* Voice Selection - 4 Distinct Male Voices */}
          <div className="space-y-2 pt-2 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Variedade Vocal: 4 Locutores Masculinos de 1950 (Apenas Vozes Masculinas):
              </label>
              <span className="text-[11px] text-stone-400">Clique para alternar o timbre</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VOICES.map((v) => {
                const isSelected = voice === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVoice(v.id)}
                    className={`text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500 text-amber-100 shadow-md ring-1 ring-amber-500/50"
                        : "bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold font-serif text-sm text-stone-100">{v.title}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold whitespace-nowrap ${
                        isSelected ? "bg-amber-500/30 text-amber-300 border border-amber-500/40" : "bg-stone-800 text-stone-400"
                      }`}>
                        {v.registerBadge}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-300 mt-1 font-medium">{v.role}</div>
                    <div className="text-[11px] text-stone-400 mt-0.5 leading-snug">{v.description}</div>
                    <div className="text-[10px] text-amber-400/80 mt-1.5 italic flex items-center gap-1">
                      <span>• {v.accentHint}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Depth, Clarity & Tone Tuning Controls */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Afinação Acústica & Diccção:
              </span>
              {/* Quick Presets */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-stone-500 mr-1">Perfis Rápidos:</span>
                <button
                  type="button"
                  onClick={() => {
                    setClarityBoostAmount(9);
                    setBassBoostAmount(3);
                    setPitchShiftMultiplier(0.98);
                    setRadioEffect(true);
                  }}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    clarityBoostAmount >= 8
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold"
                      : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  ⚡ Máxima Nitidez 1950s
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClarityBoostAmount(6);
                    setBassBoostAmount(8);
                    setPitchShiftMultiplier(0.93);
                    setRadioEffect(true);
                  }}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    bassBoostAmount >= 7
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold"
                      : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  🎙️ Baixo Profundo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClarityBoostAmount(0);
                    setBassBoostAmount(0);
                    setPitchShiftMultiplier(1.0);
                    setRadioEffect(false);
                  }}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    !radioEffect
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold"
                      : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  ✨ Som Puro
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Pitch Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Tom & Gravidade:</span>
                  <span className="font-mono text-stone-300">{Math.round((1 - pitchShiftMultiplier) * 100)}% grave</span>
                </div>
                <input
                  type="range"
                  min={0.88}
                  max={1.05}
                  step={0.01}
                  value={pitchShiftMultiplier}
                  onChange={(e) => setPitchShiftMultiplier(Number(e.target.value))}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>Grave (0.88)</span>
                  <span>Normal (1.00)</span>
                </div>
              </div>

              {/* Clarity / Presence Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-stone-400">
                  <span className="text-amber-300 font-medium">Claridade & Articulação:</span>
                  <span className="font-mono text-amber-300">+{clarityBoostAmount} dB</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={clarityBoostAmount}
                  onChange={(e) => setClarityBoostAmount(Number(e.target.value))}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>Suave (0 dB)</span>
                  <span>Nítido (+10 dB)</span>
                </div>
              </div>

              {/* Bass Boost Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Ressonância de Peito:</span>
                  <span className="font-mono text-stone-300">+{bassBoostAmount} dB</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={bassBoostAmount}
                  onChange={(e) => setBassBoostAmount(Number(e.target.value))}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>Plano (0 dB)</span>
                  <span>Encorpado (+12 dB)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1950s Radio Effect Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={radioEffect}
                onChange={(e) => setRadioEffect(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500 bg-stone-950 border-stone-700 cursor-pointer"
              />
              <span className="text-stone-300 font-medium">
                Efeito de Transmissão de Rádio 1950s (Filtro AM + Válvulas + Chiado Vintage)
              </span>
            </label>

            <div className="flex items-center gap-1.5 text-stone-400">
              <span>Cadência:</span>
              {[0.9, 0.94, 1.0, 1.06].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded border text-[11px] font-mono cursor-pointer ${
                    speed === s
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold"
                      : "bg-stone-950 border-stone-800 hover:border-stone-700"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="w-full py-4 px-6 rounded-xl font-serif font-bold text-base flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>A Sintetizar com Sotaque de Portugal (pt-PT)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Transmitir Locução 1950s ({VOICES.find(v => v.id === voice)?.title.split("—")[0].trim()})</span>
              </>
            )}
          </button>
        </div>

        {/* Audio Player & Download Card */}
        {hasAudio && (
          <div className="bg-stone-900 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isPlaying ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                <span className="font-serif font-bold text-amber-200 text-sm">
                  {isPlaying ? `A Transmitir: ${VOICES.find(v => v.id === voice)?.title}` : "Emissão de Áudio Pronta"}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  pt-PT • 1950s
                </span>
              </div>
              <span className="text-xs font-mono text-stone-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Time progress bar */}
            <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-100"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Transport & Download controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                {isPlaying ? (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold font-serif text-sm flex items-center gap-2 cursor-pointer transition-colors shadow"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pausar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlay}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-bold font-serif text-sm flex items-center gap-2 cursor-pointer transition-all shadow"
                  >
                    <Play className="w-4 h-4" />
                    <span>Ouvir Locução</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRestart}
                  title="Reiniciar Emissão"
                  className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 text-xs text-stone-400 ml-2">
                  <Volume2 className="w-4 h-4 text-stone-400" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-20 sm:w-24 h-1.5 bg-stone-800 rounded appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Download Buttons Section */}
              <div className="flex items-center gap-2">
                {/* Download Full 1950s AM Radio Audio */}
                <button
                  type="button"
                  onClick={() => handleDownload(true)}
                  disabled={isExporting}
                  title="Descarregar ficheiro WAV com filtro de rádio AM 1950s, válvulas e atmosfera de época"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>A Gerar WAV...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descarregar .WAV (Rádio 1950s)</span>
                    </>
                  )}
                </button>

                {/* Download Clean Studio Audio */}
                <button
                  type="button"
                  onClick={() => handleDownload(false)}
                  disabled={isExporting}
                  title="Descarregar ficheiro WAV puro de estúdio (com afinação e presença, sem chiado de rádio)"
                  className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 hover:border-amber-500/40 text-xs font-serif font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>Estúdio Limpo</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

