import React from "react";
import { RadioVoice, VoiceOption, PresetBroadcast } from "../types";
import { Sparkles, Mic, History, Volume2, Radio } from "lucide-react";

interface BroadcastEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  selectedVoice: RadioVoice;
  onVoiceChange: (voice: RadioVoice) => void;
  broadcastStyle: string;
  onStyleChange: (style: string) => void;
  voiceOptions: VoiceOption[];
  presets: PresetBroadcast[];
  onSelectPreset: (preset: PresetBroadcast) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onOpenHistoricalDrawer: () => void;
}

export const BroadcastEditor: React.FC<BroadcastEditorProps> = ({
  text,
  onTextChange,
  selectedVoice,
  onVoiceChange,
  broadcastStyle,
  onStyleChange,
  voiceOptions,
  presets,
  onSelectPreset,
  onGenerate,
  isGenerating,
  onOpenHistoricalDrawer,
}) => {
  // Estimate speaking duration (approx. 130 words per minute for 1950s formal cadence)
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round((wordCount / 130) * 60);

  return (
    <div className="bg-[#241a13] border-2 border-[#453020] rounded-xl p-5 shadow-xl text-stone-200">
      {/* Header & Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/50 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-700/30 border border-amber-500/50 flex items-center justify-center text-amber-300">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-amber-100 tracking-wide">
              Texto da Emissão de Rádio (1950s)
            </h2>
            <p className="text-xs text-amber-400/70 font-sans">
              Locução histórica em Português de Portugal para síntese vocal vintage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHistoricalDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-700/60 text-xs font-serif transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Arquivo Histórico das Minas</span>
          </button>
        </div>
      </div>

      {/* Preset selector buttons */}
      <div className="mb-4">
        <label className="block text-[11px] font-serif uppercase tracking-wider text-amber-400/80 mb-1.5">
          Textos e Noticiários Históricos:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((p) => {
            const isCurrent = text === p.text;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPreset(p)}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-amber-900/50 border-amber-400 text-amber-100 shadow-md ring-1 ring-amber-500/30"
                    : "bg-[#1b130e] border-amber-950 text-stone-300 hover:bg-[#2e2017] hover:border-amber-800"
                }`}
              >
                <div className="font-serif font-bold text-amber-200 truncate flex items-center justify-between">
                  <span>{p.title}</span>
                  <span className="text-[10px] font-mono text-amber-500/80 ml-2">{p.frequency} kHz</span>
                </div>
                <div className="text-[11px] text-stone-400 truncate mt-0.5 font-sans">{p.category} • {p.date}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative mb-4">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={6}
          placeholder="Escreva ou cole aqui o texto para a emissão radiofónica..."
          className="w-full bg-[#17100b] border border-amber-900/60 focus:border-amber-400 rounded-lg p-3.5 text-amber-100 text-sm font-serif leading-relaxed placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500/40 resize-y shadow-inner"
        />
        <div className="flex items-center justify-between text-[11px] font-mono text-amber-500/70 mt-1 px-1">
          <span>{text.length} caracteres • {wordCount} palavras</span>
          <span>Duração estimada: ~{estimatedSeconds} segundos</span>
        </div>
      </div>

      {/* Voice & Style Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Male Voice Persona Selector */}
        <div>
          <label className="block text-[11px] font-serif uppercase tracking-wider text-amber-400/80 mb-1.5 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            Voz Masculina de Época:
          </label>
          <div className="space-y-1.5">
            {voiceOptions.map((v) => {
              const isSelected = selectedVoice === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => onVoiceChange(v.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "bg-amber-950/80 border-amber-400 text-amber-100 shadow-sm"
                      : "bg-[#1a120d] border-amber-900/40 text-stone-400 hover:bg-[#251912] hover:text-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-amber-200">{v.name}</span>
                    <span className="text-[10px] font-mono text-amber-500/90 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                      {v.pitchHint}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Broadcast Delivery Tone & Options */}
        <div className="flex flex-col justify-between">
          <div>
            <label className="block text-[11px] font-serif uppercase tracking-wider text-amber-400/80 mb-1.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              Estilo e Cadência de Locução:
            </label>
            <div className="space-y-2">
              {[
                {
                  id: "vintage_1950s_radio",
                  title: "Emissora Nacional (Oficial 1950s)",
                  desc: "Dicção solene, ritmo pausado e formal dos noticiários da rádio de Estado.",
                },
                {
                  id: "urgent_bulletin",
                  title: "Edição Especial / Despacho Urgente",
                  desc: "Cadência mais incisiva e enérgica de boletim de última hora.",
                },
                {
                  id: "formal_documentary",
                  title: "Documentário / Crónica Histórica",
                  desc: "Tom narrativo clássico de atualidades cinematográficas e sonoras.",
                },
              ].map((st) => (
                <label
                  key={st.id}
                  className={`block p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    broadcastStyle === st.id
                      ? "bg-amber-950/80 border-amber-400 text-amber-100"
                      : "bg-[#1a120d] border-amber-900/40 text-stone-400 hover:bg-[#251912]"
                  }`}
                >
                  <input
                    type="radio"
                    name="broadcastStyle"
                    value={st.id}
                    checked={broadcastStyle === st.id}
                    onChange={(e) => onStyleChange(e.target.value)}
                    className="sr-only"
                  />
                  <div className="font-serif font-bold text-amber-200">{st.title}</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">{st.desc}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Primary Generation Button */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !text.trim()}
            className={`w-full mt-4 py-3 px-4 rounded-xl font-serif font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg ${
              isGenerating
                ? "bg-amber-800 text-amber-200 cursor-wait opacity-80"
                : "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] active:scale-[0.99]"
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
                <span>A Sintetizar Voz dos Anos 50...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>Emitir na Rádio 1950s (Gerar Voz)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
