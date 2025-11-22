import React, { useEffect, useState, useRef } from 'react';
import { Activity } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export const FpsCounter: React.FC = () => {
  const [fps, setFps] = useState(0);
  const { targetFps } = useSettings();
  
  // Refs to track timing without re-renders
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const animIdRef = useRef<number | null>(null);
  const lastDrawTimeRef = useRef(performance.now());

  useEffect(() => {
    const loop = (time: number) => {
      const interval = 1000 / targetFps;
      const delta = time - lastDrawTimeRef.current;

      // Throttle: Only update if enough time has passed for the target FPS
      if (delta > interval) {
          lastDrawTimeRef.current = time - (delta % interval);
          frameCountRef.current++;
      }

      const secondDelta = time - lastTimeRef.current;
      if (secondDelta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / secondDelta));
        frameCountRef.current = 0;
        lastTimeRef.current = time;
      }
      
      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);
    return () => {
        if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [targetFps]);

  return (
    <div className="fixed top-2 right-16 z-[100] pointer-events-none">
      <div className="bg-black/70 backdrop-blur-md text-green-400 font-mono text-xs px-2 py-1 rounded-lg border border-green-500/30 flex items-center gap-2 shadow-lg">
        <Activity size={12} className="animate-pulse" />
        <span>{Math.min(fps, targetFps)} FPS</span>
      </div>
    </div>
  );
};