import React, { useEffect, useRef } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface VisualizerProps {
  isPlaying: boolean;
  analyserNodeRef: React.MutableRefObject<AnalyserNode | null>;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, analyserNodeRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const { targetFps } = useSettings();
  const lastDrawTimeRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const draw = (timestamp: number) => {
      if (!canvasRef.current || !analyserNodeRef.current) {
         animationRef.current = requestAnimationFrame(draw);
         return;
      }

      // Strict Throttling Logic
      const interval = 1000 / targetFps;
      const delta = timestamp - lastDrawTimeRef.current;

      if (delta < interval) {
         animationRef.current = requestAnimationFrame(draw);
         return;
      }

      // Adjust execution time to keep sync
      lastDrawTimeRef.current = timestamp - (delta % interval);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = analyserNodeRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      // We only draw the first half of the buffer usually as the high frequencies are often empty in music
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#ec4899'); // Pink
        gradient.addColorStop(1, '#8b5cf6'); // Violet

        ctx.fillStyle = gradient;
        
        // Draw rounded bars
        if (barHeight > 0) {
          ctx.beginPath();
          ctx.roundRect(x, canvas.height - barHeight, Math.max(barWidth - 2, 1), barHeight, 4);
          ctx.fill();
        }

        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Reset time tracking on start
    lastDrawTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, analyserNodeRef, targetFps]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={60} 
      className="w-full h-16 opacity-80"
    />
  );
};