import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  getVisualizerData: () => { peak: number; rms: number; frequencyData: Uint8Array };
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  getVisualizerData,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark oscilloscope background
      ctx.fillStyle = "#0c150e";
      ctx.fillRect(0, 0, width, height);

      // CRT Grid overlay (graticule)
      ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
      ctx.lineWidth = 1;

      // Grid lines
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const { peak, frequencyData } = getVisualizerData();

      if (isPlaying && frequencyData.length > 0) {
        // Draw vintage frequency bars with warm phosphor glow
        const barCount = 32;
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * (frequencyData.length * 0.65));
          const val = frequencyData[dataIndex] || 0;
          const barHeight = (val / 255) * (height - 8);

          // Phosphor Green to Amber gradient
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, "rgba(5, 150, 105, 0.8)");
          grad.addColorStop(0.7, "rgba(16, 185, 129, 0.95)");
          grad.addColorStop(1, "rgba(245, 158, 11, 0.95)");

          ctx.fillStyle = grad;
          ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
        }

        // Center oscilloscope waveform trace simulation
        ctx.beginPath();
        ctx.strokeStyle = "rgba(52, 211, 153, 0.85)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 6;

        const sliceWidth = width / frequencyData.length;
        let x = 0;
        for (let i = 0; i < frequencyData.length; i++) {
          const v = (frequencyData[i] / 128.0) - 1.0;
          const y = (height / 2) + v * (height * 0.35) * (peak > 0.1 ? peak : 0.2);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Flat center line when idle
        ctx.beginPath();
        ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [getVisualizerData, isPlaying]);

  return (
    <div className="relative w-full h-20 rounded bg-stone-950 border border-stone-800 overflow-hidden shadow-inner flex items-center justify-center">
      <canvas ref={canvasRef} width={340} height={80} className="w-full h-full object-cover" />
      <div className="absolute top-1 right-2 text-[8px] font-mono text-emerald-500/70 tracking-widest uppercase">
        CRT OSCILLOGRAM 1950
      </div>
    </div>
  );
};
