import React from "react";

interface MagicEyeTubeProps {
  level: number; // 0 to 1
  isActive: boolean;
}

export const MagicEyeTube: React.FC<MagicEyeTubeProps> = ({ level, isActive }) => {
  // The classic 6E5 / EM34 Magic Eye tube shows a green circular phosphor glow
  // with a dark shadow wedge that closes (narrows) as the signal level increases.
  const baseAngle = 90; // full open when silent
  const closedAngle = 10; // closes down when loud
  const currentAngle = isActive ? Math.max(closedAngle, baseAngle - level * 75) : baseAngle;

  const halfAngle = (currentAngle / 2) * (Math.PI / 180);
  const radius = 28;
  const cx = 32;
  const cy = 32;

  // Calculate sector points for the dark wedge
  const x1 = cx - radius * Math.sin(halfAngle);
  const y1 = cy - radius * Math.cos(halfAngle);
  const x2 = cx + radius * Math.sin(halfAngle);
  const y2 = cy - radius * Math.cos(halfAngle);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16 rounded-full bg-stone-950 p-1 border-2 border-amber-900/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9),0_0_12px_rgba(34,197,94,0.25)] flex items-center justify-center">
        {/* Outer brass ring */}
        <div className="absolute inset-0 rounded-full border border-amber-600/40 pointer-events-none" />

        {/* Tube Glass bulb reflection */}
        <div className="absolute top-1 left-2 w-4 h-2 rounded-full bg-white/20 blur-[1px] rotate-[-30deg] pointer-events-none z-20" />

        {/* Phosphor Glow SVG */}
        <svg className="w-14 h-14" viewBox="0 0 64 64">
          <defs>
            <radialGradient id="magicEyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity={isActive ? "0.95" : "0.3"} />
              <stop offset="60%" stopColor="#059669" stopOpacity={isActive ? "0.8" : "0.2"} />
              <stop offset="90%" stopColor="#047857" stopOpacity={isActive ? "0.6" : "0.1"} />
              <stop offset="100%" stopColor="#022c22" stopOpacity="0.9" />
            </radialGradient>
            <filter id="greenNeon">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Glowing Green Phosphor Disk */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="url(#magicEyeGlow)"
            filter={isActive ? "url(#greenNeon)" : undefined}
            className="transition-opacity duration-300"
          />

          {/* Central Target Anode Core */}
          <circle cx={cx} cy={cy} r="8" fill="#0f172a" stroke="#047857" strokeWidth="1" />

          {/* Shadow Sector (The "Eye" wedge that closes on signal) */}
          <path
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
            fill="#09140f"
            opacity={isActive ? 0.92 : 0.95}
            className="transition-all duration-75"
          />

          {/* Cathode cap center */}
          <circle cx={cx} cy={cy} r="4" fill="#022c22" />
        </svg>
      </div>
      <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500/80 font-semibold">
        6E5 Magic Eye
      </span>
    </div>
  );
};
