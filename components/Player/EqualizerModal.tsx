import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders } from 'lucide-react';
import { useSettings, PRESETS, EqPreset } from '../../contexts/SettingsContext';
import { NeonButton } from '../ui/GlassCard';
import { useHaptic } from '../../hooks/useHaptic';
import { clsx } from 'clsx';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose }) => {
  const { eqSettings, setEqPreset, setCustomEqGain } = useSettings();
  const { trigger } = useHaptic();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10 max-h-[80vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sliders className="text-primary" /> Equalizer
                    </h2>
                    <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-white/10 rounded-full">
                        <X size={20} className="text-slate-600 dark:text-white" />
                    </button>
                </div>

                {/* Presets */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
                    {Object.keys(PRESETS).concat('Custom').map((preset) => (
                        <button
                            key={preset}
                            onClick={() => { trigger(5); setEqPreset(preset as EqPreset); }}
                            className={clsx(
                                "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all",
                                eqSettings.preset === preset
                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                    : "bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/60 border border-transparent hover:border-slate-300 dark:hover:border-white/20"
                            )}
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                {/* Sliders */}
                <div className="flex justify-between h-48 items-end px-2 gap-2 md:gap-4 bg-slate-100 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5">
                    {['60Hz', '250Hz', '1kHz', '4kHz', '12kHz'].map((label, index) => (
                        <div key={index} className="flex flex-col items-center h-full w-12 group">
                            <div className="relative flex-1 w-full flex justify-center">
                                {/* Track */}
                                <div className="absolute top-0 bottom-0 w-1 bg-slate-300 dark:bg-white/10 rounded-full"></div>
                                
                                {/* Range Input (Vertical) */}
                                <input 
                                    type="range" 
                                    min="-12" 
                                    max="12" 
                                    step="1"
                                    value={eqSettings.gains[index]}
                                    onChange={(e) => {
                                        setCustomEqGain(index, Number(e.target.value));
                                    }}
                                    className="h-full w-full appearance-none bg-transparent z-10 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(139,92,246,0.5)] hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                                    style={{ 
                                        WebkitAppearance: 'slider-vertical',
                                        writingMode: 'bt-lr' as any /* IE/Edge specific */
                                    }}
                                />
                            </div>
                            <span className="mt-3 text-[10px] font-medium text-slate-500 dark:text-white/40">{label}</span>
                            <span className="text-[9px] text-primary font-bold">{eqSettings.gains[index] > 0 ? '+' : ''}{eqSettings.gains[index]}dB</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-center">
                    <NeonButton 
                        onClick={onClose} 
                        className="w-full bg-primary text-white"
                    >
                        Done
                    </NeonButton>
                </div>

            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};