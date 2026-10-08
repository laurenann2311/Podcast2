import React, { useRef, useState, useEffect, useCallback } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  formatValue?: (val: number) => string;
  onChange: (val: number) => void;
  accentColor?: 'amber' | 'rose' | 'emerald' | 'sky' | 'indigo';
  size?: number; // diameter in px (e.g. 56 or 64)
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  defaultValue = min + (max - min) / 2,
  unit = '',
  formatValue,
  onChange,
  accentColor = 'amber',
  size = 56,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartVal = useRef(value);

  // Angle range: -135deg to +135deg (270deg sweep)
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -135 + normalized * 270;

  const colorMap = {
    amber: {
      activeRing: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.4)',
      text: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    },
    rose: {
      activeRing: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.4)',
      text: 'text-rose-400',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    },
    emerald: {
      activeRing: '#10b981',
      glow: 'rgba(16, 185, 129, 0.4)',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    },
    sky: {
      activeRing: '#0284c7',
      glow: 'rgba(2, 132, 199, 0.4)',
      text: 'text-sky-400',
      badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    },
    indigo: {
      activeRing: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.4)',
      text: 'text-indigo-400',
      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    },
  }[accentColor];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartVal.current = value;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartY.current - e.clientY; // upward drag increases
      const sensitivity = (max - min) / 160; // 160px drag for full sweep
      let newVal = dragStartVal.current + deltaY * sensitivity;
      newVal = Math.max(min, Math.min(max, newVal));
      // Snap to step
      if (step > 0) {
        newVal = Math.round(newVal / step) * step;
      }
      onChange(Number(newVal.toFixed(3)));
    },
    [isDragging, min, max, step, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * (step || 0.05);
    let newVal = Math.max(min, Math.min(max, value + delta));
    if (step > 0) {
      newVal = Math.round(newVal / step) * step;
    }
    onChange(Number(newVal.toFixed(3)));
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      delta = step || 0.05;
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      delta = -(step || 0.05);
    } else if (e.key === 'Home') {
      onChange(min);
      return;
    } else if (e.key === 'End') {
      onChange(max);
      return;
    } else {
      return;
    }
    e.preventDefault();
    const newVal = Math.max(min, Math.min(max, value + delta));
    onChange(Number(newVal.toFixed(3)));
  };

  // SVG arc math
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  // 270 degrees is 0.75 of circumference
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength * (1 - normalized);

  const displayString = formatValue
    ? formatValue(value)
    : `${value.toFixed(2)}${unit}`;

  return (
    <div className="flex flex-col items-center select-none group">
      <div className="flex items-center justify-between w-full px-0.5 mb-1.5">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">
          {label}
        </span>
      </div>

      <div
        ref={knobRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        title={`${label}: ${displayString} (Drag or scroll to adjust, double click to reset)`}
        className={`relative flex items-center justify-center cursor-ns-resize outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-400 rounded-full transition-transform active:scale-95 ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{ width: size, height: size }}
      >
        {/* Background track SVG */}
        <svg
          className="absolute inset-0 -rotate-[135deg]"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background track arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth="3.5"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorMap.activeRing}
            strokeWidth="3.5"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: isDragging ? `drop-shadow(0 0 4px ${colorMap.glow})` : 'none',
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.1s ease-out',
            }}
          />
        </svg>

        {/* Knob Body with 3D metallic studio texture */}
        <div
          className="relative rounded-full flex items-center justify-center shadow-lg border border-zinc-700/60 transition-transform"
          style={{
            width: size - 14,
            height: size - 14,
            background:
              'radial-gradient(circle at 35% 35%, #3f3f46 0%, #27272a 45%, #18181b 100%)',
            boxShadow:
              'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 3px 6px rgba(0, 0, 0, 0.5)',
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Knurled grip edge dots / ridges */}
          <div className="absolute inset-0 rounded-full opacity-40 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:4px_4px]" />

          {/* Center cap */}
          <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700/80 shadow-inner flex items-center justify-center" />

          {/* Indicator notch */}
          <div
            className="absolute top-1 w-1 rounded-full shadow-sm"
            style={{
              height: Math.max(5, (size - 14) / 4),
              backgroundColor: colorMap.activeRing,
              boxShadow: `0 0 6px ${colorMap.glow}`,
            }}
          />
        </div>
      </div>

      {/* Value Badge */}
      <div
        className={`mt-2 px-2 py-0.5 rounded text-[11px] font-mono tracking-tight font-medium border ${colorMap.badge} cursor-pointer hover:opacity-90 transition-opacity`}
        onClick={handleDoubleClick}
        title="Double-click to reset"
      >
        {displayString}
      </div>
    </div>
  );
};
