import React from "react";

interface RadioDialProps {
  currentFreq: number; // in kHz, e.g. 756
  onFreqChange: (freq: number) => void;
  activeStationName: string;
}

export const RadioDial: React.FC<RadioDialProps> = ({
  currentFreq,
  onFreqChange,
  activeStationName,
}) => {
  const minFreq = 540;
  const maxFreq = 1600;

  // Calculate needle position percentage (0% to 100%)
  const percentage = Math.max(0, Math.min(100, ((currentFreq - minFreq) / (maxFreq - minFreq)) * 100));

  const stations = [
    { name: "EN LISBOA I", freq: 666, mark: "666 kHz" },
    { name: "EMISSORA NACIONAL", freq: 756, mark: "756 kHz" },
    { name: "ESPADANAL MINAS", freq: 890, mark: "890 kHz" },
    { name: "R. CLUBE PORTUGUÊS", freq: 1035, mark: "1035 kHz" },
    { name: "R. RENASCENÇA", freq: 1259, mark: "1259 kHz" },
    { name: "PORTO I", freq: 1412, mark: "1412 kHz" },
  ];

  return (
    <div className="relative w-full bg-[#1b140e] border-4 border-[#3d2b1f] rounded-lg p-3 shadow-[inset_0_4px_16px_rgba(0,0,0,0.9),0_2px_4px_rgba(0,0,0,0.6)]">
      {/* Backlit Glow Frame */}
      <div className="relative bg-gradient-to-b from-[#2b1f14] via-[#3a2818] to-[#1e130a] rounded border border-amber-900/60 p-2 overflow-hidden shadow-[inset_0_0_24px_rgba(245,158,11,0.2)]">
        {/* Vintage Radio Glass Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />

        {/* Dial Scale Header */}
        <div className="flex items-center justify-between text-[11px] font-serif uppercase tracking-widest text-amber-300/80 mb-2 border-b border-amber-800/40 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
            <span className="font-semibold text-amber-200">ONDAS MÉDIAS (AM)</span>
          </div>
          <div className="text-amber-400 font-mono text-[10px]">
            {activeStationName || "SINTONIA MANUAL"} • <span className="font-bold text-amber-200">{currentFreq} kHz</span>
          </div>
        </div>

        {/* Station Names Row */}
        <div className="relative h-6 w-full mb-1">
          {stations.map((st) => {
            const stPercent = ((st.freq - minFreq) / (maxFreq - minFreq)) * 100;
            const isSelected = Math.abs(currentFreq - st.freq) < 25;
            return (
              <button
                key={st.freq}
                type="button"
                onClick={() => onFreqChange(st.freq)}
                className={`absolute top-0 transform -translate-x-1/2 text-[9px] font-serif uppercase tracking-tight whitespace-nowrap cursor-pointer transition-all duration-200 px-1 py-0.5 rounded ${
                  isSelected
                    ? "text-amber-200 font-bold bg-amber-950/80 border border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    : "text-amber-500/70 hover:text-amber-300"
                }`}
                style={{ left: `${stPercent}%` }}
              >
                {st.name}
              </button>
            );
          })}
        </div>

        {/* Dial Ticks & Scale Track */}
        <div className="relative h-10 w-full flex items-center">
          {/* Main horizontal frequency track */}
          <div className="absolute w-full h-[2px] bg-amber-700/60" />

          {/* Scale Frequency Markings (550, 600, 700 ... 1600) */}
          <div className="w-full flex justify-between text-[10px] font-mono text-amber-400/90 select-none px-1">
            <span>550</span>
            <span>600</span>
            <span>700</span>
            <span>800</span>
            <span>900</span>
            <span>1000</span>
            <span>1200</span>
            <span>1400</span>
            <span>1600</span>
          </div>

          {/* Glowing Tuning Needle */}
          <div
            className="absolute top-[-6px] bottom-[-6px] w-[3px] bg-red-500 shadow-[0_0_8px_#ef4444,0_0_12px_#f97316] z-10 transition-all duration-200 pointer-events-none"
            style={{ left: `${percentage}%` }}
          >
            {/* Needle top cursor marker */}
            <div className="absolute top-0 -left-[3px] w-2 h-2 bg-red-600 rounded-full border border-amber-200 shadow-sm" />
          </div>
        </div>

        {/* Metros Band Scale (Wavelength: 550m - 187m) */}
        <div className="flex items-center justify-between text-[9px] font-mono text-amber-600/80 mt-1 border-t border-amber-900/40 pt-1">
          <span>545 m</span>
          <span>450 m</span>
          <span>350 m</span>
          <span>275 m</span>
          <span>220 m</span>
          <span>187 m</span>
        </div>
      </div>

      {/* Interactive Tuning Slider & Presets bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-[11px] font-serif text-amber-300 font-medium whitespace-nowrap">
            Sintonia Fina:
          </span>
          <input
            type="range"
            min={minFreq}
            max={maxFreq}
            step={1}
            value={currentFreq}
            onChange={(e) => onFreqChange(Number(e.target.value))}
            className="w-full h-2 bg-stone-900 rounded-lg appearance-none cursor-ew-resize accent-amber-500 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-1">
          {stations.slice(0, 4).map((st) => (
            <button
              key={st.freq}
              type="button"
              onClick={() => onFreqChange(st.freq)}
              className={`text-[9px] px-2 py-1 rounded font-serif transition-colors border ${
                currentFreq === st.freq
                  ? "bg-amber-800 text-amber-100 border-amber-400 font-bold"
                  : "bg-stone-900 text-amber-400/80 border-stone-800 hover:bg-stone-800 hover:text-amber-200"
              }`}
            >
              {st.freq} kHz
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
