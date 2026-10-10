import React from "react";
import { X, BookOpen, Train, Pickaxe, MapPin, Building, Calendar, FileText } from "lucide-react";

interface HistoricalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoricalDrawer: React.FC<HistoricalDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#241a13] border-2 border-amber-850 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-amber-900/60 bg-[#1e150f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-800/40 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-amber-100">
                Arquivo Histórico: Minas de Lenhite do Espadanal
              </h2>
              <p className="text-xs text-amber-400/80 font-sans">
                Rio Maior, Ribatejo — Década de 1950 & Empresa Industrial Carbonífera Electrotécnica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-200 border border-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed font-serif text-stone-300">
          {/* Executive Overview */}
          <div className="p-4 rounded-xl bg-[#1b130e] border border-amber-900/50">
            <h3 className="font-bold text-amber-200 text-base mb-2 flex items-center gap-2">
              <Pickaxe className="w-4 h-4 text-amber-400" />
              O Complexo Mineiro do Espadanal
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm">
              As <strong>Minas do Espadanal</strong>, situadas no concelho de Rio Maior, constituíram a mais importante exploração de lenhite (carvão fóssil de teor castanho) da Península Ibérica. Operadas pela <em>Empresa Industrial Carbonífera Electrotécnica, Limitada</em>, foram um baluarte económico e de auto-suficiência energética para Portugal durante a Segunda Guerra Mundial e o período pós-guerra na década de 1950.
            </p>
          </div>

          {/* Key Historical Figures Mentioned in the Broadcast */}
          <div>
            <h4 className="text-xs font-bold font-sans uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              Personalidades Presentes no Registo Histórico
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800">
                <div className="font-bold text-amber-300 font-serif">Ministro da Economia</div>
                <div className="text-stone-400 mt-1 font-sans">
                  Visita ministerial oficial para fiscalização das instalações termoindustriais e incentivo à produção carbonífera nacional.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800">
                <div className="font-bold text-amber-300 font-serif">Dr. Astério Rosa & Eng. Cílio Rosa</div>
                <div className="text-stone-400 mt-1 font-sans">
                  Administradores Delegados da <em>Empresa Industrial Carbonífera Electrotécnica, Lda.</em>, proprietária e concessionária das minas.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800">
                <div className="font-bold text-amber-300 font-serif">Eng. Falcão Mena</div>
                <div className="text-stone-400 mt-1 font-sans">
                  Diretor Técnico das Minas, responsável pelo traçado das galerias subterrâneas e mecanização da lavra mineira.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-stone-900/60 border border-stone-800">
                <div className="font-bold text-amber-300 font-serif">Major Cabral de Quadros & Dr. Branco</div>
                <div className="text-stone-400 mt-1 font-sans">
                  Presidente e Secretário da Câmara Municipal de Rio Maior, acompanhando a receção de honra.
                </div>
              </div>
            </div>
          </div>

          {/* Railway Infrastructure */}
          <div className="p-4 rounded-xl bg-[#1b130e] border border-amber-900/50">
            <h3 className="font-bold text-amber-200 text-sm mb-1.5 flex items-center gap-2">
              <Train className="w-4 h-4 text-amber-400" />
              O Cais e Caminho de Ferro Mineiro
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm">
              O minério era escoado a partir do cais de embarque mineiro do Espadanal através de uma linha ferroviária privativa de via reduzida (600 mm), que ligava os poços de extração à vila de Rio Maior e aos entroncamentos da Linha do Oeste, transportando milhares de toneladas de combustível fóssil para as fábricas de cimento, vidro e centrais elétricas portuguesas.
            </p>
          </div>

          {/* Audio broadcast style note */}
          <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300/90 font-sans flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Registo Sonoro dos Anos 50:</strong> As notícias e boletins desta época eram redigidos em estilo jornalístico descritivo e solene, com leitura de todas as altas patentes, cargos honoríficos e títulos académicos, refletindo os padrões editoriais da <em>Emissora Nacional de Radiodifusão</em> durante o Estado Novo.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-amber-900/60 bg-[#1e150f] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-stone-950 font-serif font-bold text-xs cursor-pointer"
          >
            Fechar Arquivo
          </button>
        </div>
      </div>
    </div>
  );
};
