
import { useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export const useHaptic = () => {
  const { hapticEnabled, hapticIntensity, isPremium } = useSettings();

  const trigger = useCallback((pattern: number | number[] = 10) => {
    // Strict rule: No haptics if not premium, even if enabled in state
    if (!isPremium || !hapticEnabled) return;
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        let finalPattern = pattern;

        // Calculate multiplier based on intensity
        let multiplier = 1;
        let baseAdd = 0;

        switch (hapticIntensity) {
            case 'low':
                multiplier = 0.5;
                break;
            case 'medium':
                multiplier = 1;
                break;
            case 'high':
                multiplier = 2.5;
                break;
            case 'monster':
                multiplier = 4.0; // Aggressive scaling
                baseAdd = 50; // Minimum duration floor for monster feel
                break;
        }

        // Apply logic
        if (typeof pattern === 'number') {
            // For single vibration
            if (hapticIntensity === 'monster') {
                // Monster Mode: Heavy impact
                finalPattern = (pattern * multiplier) + baseAdd;
            } else {
                finalPattern = Math.max(5, pattern * multiplier); // Ensure at least 5ms
            }
        } else if (Array.isArray(pattern)) {
            // For patterns [vibrate, pause, vibrate]
            finalPattern = pattern.map((val, i) => {
                // Only multiply vibration duration (even indices), not pauses (odd indices)
                if (i % 2 === 0) {
                     if (hapticIntensity === 'monster') {
                         return (val * multiplier) + baseAdd;
                     }
                     return Math.max(5, val * multiplier);
                }
                return val; // Keep pauses same or maybe shorter for intensity? Keeping same for rhythm.
            });
        }

        navigator.vibrate(finalPattern);
      } catch (e) {
        // Ignore errors on devices that don't support vibration or if user hasn't interacted
      }
    }
  }, [hapticEnabled, hapticIntensity, isPremium]);

  return { trigger };
};
