
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type EqPreset = 'Flat' | 'Bass Boost' | 'Vocal' | 'Treble' | 'Rock' | 'Pop' | 'Custom';
export type HapticIntensity = 'low' | 'medium' | 'high' | 'monster';

export interface EqSettings {
  preset: EqPreset;
  gains: number[]; // 5 bands: 60Hz, 250Hz, 1kHz, 4kHz, 12kHz
}

interface SettingsContextType {
  hapticEnabled: boolean;
  toggleHaptic: () => void;
  hapticIntensity: HapticIntensity;
  setHapticIntensity: (intensity: HapticIntensity) => void;
  eqSettings: EqSettings;
  setEqPreset: (preset: EqPreset) => void;
  setCustomEqGain: (index: number, gain: number) => void;
  isPremium: boolean;
  unlockPremium: (code: string) => boolean;
  deactivatePremium: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  // Graphics
  targetFps: number;
  setTargetFps: (fps: number) => void;
  showFps: boolean;
  toggleShowFps: () => void;
  maxDetectedFps: number;
}

const SettingsContext = createContext<SettingsContextType>({
  hapticEnabled: true,
  toggleHaptic: () => {},
  hapticIntensity: 'medium',
  setHapticIntensity: () => {},
  eqSettings: { preset: 'Flat', gains: [0, 0, 0, 0, 0] },
  setEqPreset: () => {},
  setCustomEqGain: () => {},
  isPremium: false,
  unlockPremium: () => false,
  deactivatePremium: () => {},
  isFullScreen: false,
  toggleFullScreen: () => {},
  targetFps: 60,
  setTargetFps: () => {},
  showFps: false,
  toggleShowFps: () => {},
  maxDetectedFps: 60,
});

export const PRESETS: Record<string, number[]> = {
  'Flat': [0, 0, 0, 0, 0],
  'Bass Boost': [10, 6, 2, 0, 0],
  'Vocal': [-2, 2, 6, 4, 0],
  'Treble': [0, 0, 2, 6, 8],
  'Rock': [5, 3, -2, 4, 6],
  'Pop': [3, 4, 0, 3, 5],
};

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [hapticIntensity, setHapticIntensity] = useState<HapticIntensity>('medium');
  
  const [eqSettings, setEqSettings] = useState<EqSettings>({
    preset: 'Flat',
    gains: [0, 0, 0, 0, 0]
  });
  
  // Premium State
  const [isPremium, setIsPremium] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nova_premium') === 'true';
    }
    return false;
  });

  // Full Screen State
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Graphics State
  const [targetFps, setTargetFps] = useState(60);
  const [showFps, setShowFps] = useState(false);
  const [maxDetectedFps, setMaxDetectedFps] = useState(60);

  // Benchmark Refresh Rate on Mount
  useEffect(() => {
    let frames = 0;
    let startTime = performance.now();
    let animId: number;

    const loop = (time: number) => {
      frames++;
      if (time - startTime >= 1000) {
        // 1 second passed, estimate FPS
        const fps = Math.round(frames * 10) / 10; 
        let detected = 60;
        
        // Logic updated: Default to 60Hz minimum. 
        // Only detect higher if consistent evidence found.
        // Don't downgrade to 30Hz just because app load was heavy.
        
        if (fps > 130) detected = 144;
        else if (fps > 105) detected = 120;
        else if (fps > 75) detected = 90;
        else detected = 60; // Baseline for modern devices

        setMaxDetectedFps(detected);
        
        // If current target is higher than detected, cap it, otherwise leave it
        // But ensure we don't auto-set it lower than 60 on start
        setTargetFps(prev => {
            if (prev > detected) return detected;
            return prev;
        });
      } else {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, []);

  const toggleHaptic = () => {
    if (!isPremium) return; // Prevent toggling if not premium
    setHapticEnabled(prev => !prev);
  };

  const unlockPremium = (code: string) => {
    if (code === 'DWIP') {
      localStorage.setItem('nova_premium', 'true');
      setIsPremium(true);
      return true;
    }
    return false;
  };

  const deactivatePremium = () => {
      localStorage.removeItem('nova_premium');
      setIsPremium(false);
      setHapticEnabled(false); // Auto disable haptics
      
      // Force reset generic settings that rely on premium
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }

      // Reset FPS to 60 if it was higher
      if (targetFps > 60) {
          setTargetFps(60);
      }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const toggleShowFps = () => setShowFps(prev => !prev);

  // Sync fullscreen state with browser events (in case user presses Esc)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const setEqPreset = (preset: EqPreset) => {
    if (preset === 'Custom') {
      setEqSettings(prev => ({ ...prev, preset: 'Custom' }));
    } else {
      setEqSettings({
        preset,
        gains: [...PRESETS[preset]]
      });
    }
  };

  const setCustomEqGain = (index: number, gain: number) => {
    setEqSettings(prev => {
      const newGains = [...prev.gains];
      newGains[index] = gain;
      return {
        preset: 'Custom',
        gains: newGains
      };
    });
  };

  return (
    <SettingsContext.Provider value={{ 
      hapticEnabled, 
      toggleHaptic, 
      hapticIntensity,
      setHapticIntensity,
      eqSettings, 
      setEqPreset, 
      setCustomEqGain,
      isPremium,
      unlockPremium,
      deactivatePremium,
      isFullScreen,
      toggleFullScreen,
      targetFps,
      setTargetFps,
      showFps,
      toggleShowFps,
      maxDetectedFps
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
