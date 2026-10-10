import React, { useEffect, useRef } from "react";

interface VUMeterProps {
  level: number; // 0 to 1
  label?: string;
  isActive?: boolean;
}

export const VUMeter: React.FC<VUMeterProps> = ({ level, label = "MODULATION VU", isActive = false }) => {
  const needleRef = useRef<number>(-45); // -45 deg to +45 deg

  // Ballistic damping simulation for realistic analog needle inertia
  const targetAngle = isActive ? Math.min(45, Math.max(-45, -45 + level * 90)) : -45;

  useEffect(() => {
    let animId: number;
    const animate = () => {
      // Smooth spring needle movement
      needleRef.current += (targetAngle - needleRef.current) * 0.28;
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetAngle]);

  return (
    <div className="relative bg-[#f4e8c1] rounded-md border-2 border-stone-800 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_1px_3px_rgba(0,0,0,0.5)] p-2 w-full max-w-[210px] select-none">
      {/* Vintage Dial Backplate */}
      <div className="relative h-20 overflow-hidden flex flex-col justify-between">
        {/* Subtle aged paper gradient & grain */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f9f0d3] via-[#efe1b4] to-[#dec993] opacity-90 pointer-events-none" />

        {/* Vintage VU Scale Markings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 90">
          <defs>
            <path id="vuArc" d="M 30 75 A 100 100 0 0 1 170 75" fill="none" />
          </defs>

          {/* Normal scale arc (black) */}
          <path d="M 30 70 A 90 90 0 0 1 135 25" fill="none" stroke="#292524" strokeWidth="2" />
          {/* Overload scale arc (red) */}
          <path d="M 135 25 A 90 90 0 0 1 170 70" fill="none" stroke="#b91c1c" strokeWidth="3" />

          {/* Scale ticks */}
          {/* -20, -10, -7, -5, -3, -1, 0, +1, +2, +3 */}
          <line x1="38" y1="62" x2="44" y2="58" stroke="#292524" strokeWidth="1.5" />
          <line x1="62" y1="46" x2="67" y2="43" stroke="#292524" strokeWidth="1.5" />
          <line x1="88" y1="34" x2="91" y2="30" stroke="#292524" strokeWidth="1.5" />
          <line x1="114" y1="28" x2="115" y2="23" stroke="#292524" strokeWidth="1.5" />
          <line x1="135" y1="26" x2="136" y2="20" stroke="#b91c1c" strokeWidth="2" />
          <line x1="156" y1="36" x2="160" y2="32" stroke="#b91c1c" strokeWidth="1.5" />
          <line x1="168" y1="58" x2="173" y2="56" stroke="#b91c1c" strokeWidth="1.5" />

          {/* Decibel numbers */}
          <text x="35" y="76" fontSize="8" fontFamily="serif" fill="#44403c">-20</text>
          <text x="60" y="58" fontSize="8" fontFamily="serif" fill="#44403c">-10</text>
          <text x="88" y="44" fontSize="8" fontFamily="serif" fill="#44403c">-5</text>
          <text x="115" y="38" fontSize="8" fontFamily="serif" fill="#44403c">-1</text>
          <text x="134" y="34" fontSize="9" fontFamily="serif" fontWeight="bold" fill="#b91c1c">0</text>
          <text x="156" y="48" fontSize="8" fontFamily="serif" fill="#b91c1c">+3</text>
          <text x="100" y="54" fontSize="7" fontFamily="monospace" textAnchor="middle" fill="#78716c">100%</text>

          {/* Pivot cap */}
          <circle cx="100" cy="86" r="8" fill="#1c1917" stroke="#78716c" strokeWidth="1" />
          <circle cx="100" cy="86" r="3" fill="#a8a29e" />
        </svg>

        {/* Dynamic Needle */}
        <div
          className="absolute left-1/2 bottom-[-2px] w-[2px] h-[64px] bg-red-700 origin-bottom shadow-[0_0_2px_rgba(0,0,0,0.8)] z-10 transition-transform duration-75 ease-out"
          style={{
            transform: `translateX(-50%) rotate(${targetAngle}deg)`,
          }}
        >
          {/* Needle tip highlight */}
          <div className="w-[2px] h-[12px] bg-red-900" />
        </div>

        {/* Dial Glass Reflection */}
        <div className="absolute top-0 right-0 w-24 h-12 bg-white/25 rounded-bl-full pointer-events-none" />
      </div>

      {/* Label & Manufacturer Badge */}
      <div className="mt-1 flex items-center justify-between text-[9px] font-serif text-stone-700 tracking-wider px-1">
        <span className="font-bold text-amber-950">{label}</span>
        <span className="text-[8px] font-mono text-stone-500">TYPE 1952</span>
      </div>
    </div>
  );
};
