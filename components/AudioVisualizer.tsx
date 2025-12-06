import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const draw = () => {
      // Resize logic
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Draw a flat line or simple pulse if waiting
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = '#cbd5e1'; // slate-300
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      // Dynamic Wave
      const effectiveVolume = Math.max(0.05, volume); // Minimum presence
      const lines = 3;
      const colors = ['rgba(14, 165, 233, 0.5)', 'rgba(6, 182, 212, 0.5)', 'rgba(45, 212, 191, 0.5)']; // Sky, Cyan, Teal

      phase += 0.1;

      for (let j = 0; j < lines; j++) {
        ctx.beginPath();
        ctx.strokeStyle = colors[j];
        ctx.lineWidth = 3;

        for (let i = 0; i < width; i++) {
          const x = i;
          // Sine wave math
          const freq = 0.02 + (j * 0.01);
          const amp = (height / 3) * effectiveVolume; 
          const y = (height / 2) + Math.sin(x * freq + phase + j) * amp;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [isActive, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={120} 
      className="w-full h-full rounded-lg"
    />
  );
};

export default AudioVisualizer;
