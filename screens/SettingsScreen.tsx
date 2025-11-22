
import React, { useState } from 'react';
import { Moon, Sun, Volume2, Clock, Shield, Info, ChevronRight, Bell, Music2, Sliders, Activity, X, Check, Crown, Lock, Maximize, Minimize, LogOut, Smartphone, Monitor, Menu, Zap, Palette, RefreshCcw } from 'lucide-react';
import { GlassCard, NeonButton } from '../components/ui/GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { useHaptic } from '../hooks/useHaptic';
import { useSettings, HapticIntensity } from '../contexts/SettingsContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { EqualizerModal } from '../components/Player/EqualizerModal';

interface SettingsScreenProps {
  onOpenSidebar: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenSidebar }) => {
  const { isDarkMode, toggleDarkMode, updateTheme, resetTheme, primaryColor, secondaryColor } = useTheme();
  const { 
    hapticEnabled, toggleHaptic, 
    hapticIntensity, setHapticIntensity,
    eqSettings, 
    isPremium, unlockPremium, deactivatePremium, 
    isFullScreen, toggleFullScreen,
    targetFps, setTargetFps,
    showFps, toggleShowFps,
    maxDetectedFps
  } = useSettings();
  
  const { trigger } = useHaptic();
  
  const [notifications, setNotifications] = useState(true);
  const [showEqModal, setShowEqModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [premiumCode, setPremiumCode] = useState('');
  const [showPremiumSuccess, setShowPremiumSuccess] = useState(false);

  const handleToggleTheme = () => {
    if (!isPremium) {
        return; 
    }
    trigger(10);
    toggleDarkMode();
  };

  const handleToggleHaptic = () => {
     if (!isPremium) return;
     
     if (!hapticEnabled) {
         if (navigator.vibrate) navigator.vibrate(10);
     }
     toggleHaptic();
  };

  const handleUnlockPremium = () => {
      if (unlockPremium(premiumCode)) {
          setShowPremiumSuccess(true);
          setPremiumCode('');
          trigger([50, 100, 50]);
          setTimeout(() => setShowPremiumSuccess(false), 3000);
      } else {
          trigger([50, 50]); // Error vibration
          alert("Invalid Code");
      }
  };

  const handleDeactivate = () => {
      if (confirm("Are you sure you want to deactivate Premium features?")) {
          trigger([50, 50]);
          deactivatePremium();
          resetTheme(); // Reset colors
          if (isDarkMode) toggleDarkMode(); // Reset to light
      }
  };

  const THEME_PRESETS = [
      { name: 'Default', primary: '#8b5cf6', secondary: '#ec4899' },
      { name: 'Ocean', primary: '#06b6d4', secondary: '#3b82f6' }, // Cyan -> Blue
      { name: 'Sunset', primary: '#f97316', secondary: '#e11d48' }, // Orange -> Rose
      { name: 'Cyberpunk', primary: '#eab308', secondary: '#a855f7' }, // Yellow -> Purple
      { name: 'Matrix', primary: '#22c55e', secondary: '#10b981' }, // Green -> Emerald
      { name: 'Midnight', primary: '#6366f1', secondary: '#8b5cf6' }, // Indigo -> Violet
  ];

  const SettingItem = ({ icon: Icon, title, subtitle, action, value, onClick, disabled }: any) => (
    <div 
      onClick={() => {
          if (disabled) return;
          trigger(5);
          if (onClick) onClick();
      }}
      className={clsx(
        "flex items-center justify-between p-4 transition-colors cursor-pointer group",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 dark:active:bg-white/10"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={clsx(
            "p-2 rounded-full transition-colors",
            disabled ? "bg-slate-100 dark:bg-white/5 text-slate-400" : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 group-hover:text-primary group-hover:bg-primary/10"
        )}>
           <Icon size={20} />
        </div>
        <div>
           <h4 className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
               {title}
               {disabled && <Lock size={12} className="text-slate-400" />}
           </h4>
           {subtitle && <p className="text-xs text-slate-500 dark:text-white/40">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-slate-400 dark:text-white/50">{value}</span>}
        {action}
      </div>
    </div>
  );

  const Toggle = ({ checked, onChange, disabled }: any) => (
    <button 
        onClick={(e) => { 
            e.stopPropagation(); 
            if (!disabled) onChange(); 
        }}
        disabled={disabled}
        className={clsx(
            "w-11 h-6 rounded-full relative transition-colors shadow-inner",
            disabled ? "bg-slate-200 dark:bg-white/10 cursor-not-allowed" : (checked ? "bg-primary" : "bg-slate-300 dark:bg-white/20")
        )}
    >
        <motion.div 
          layout={isPremium} // Only animate if premium
          className={clsx(
            "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm",
            checked ? "left-6" : "left-1"
          )} 
        />
    </button>
  );

  const AVAILABLE_FPS = [24, 30, 40, 45, 60, 90, 120, 144];
  const HAPTIC_LEVELS: { id: HapticIntensity, label: string }[] = [
      { id: 'low', label: 'Low' },
      { id: 'medium', label: 'Medium' },
      { id: 'high', label: 'High' },
      { id: 'monster', label: 'Monster' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-32 px-6 pt-8 h-full overflow-y-auto no-scrollbar"
    >
      <div className="flex items-center gap-4 mb-6">
            <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => { trigger(5); onOpenSidebar(); }}
                className="p-2 -ml-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
                <Menu size={24} />
            </motion.button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
      </div>

      <div className="space-y-6">
          {/* Premium Section */}
          <section>
             <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">Premium</h3>
                {isPremium && <span className="text-xs font-bold text-primary flex items-center gap-1"><Crown size={12} fill="currentColor" /> ACTIVATED</span>}
             </div>
             
             <GlassCard className={clsx("p-4 flex flex-col gap-4", isPremium ? "border-primary/50 bg-primary/5" : "")}>
                {!isPremium ? (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-full text-amber-600 dark:text-amber-400">
                                <Crown size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Unlock Premium Features</h4>
                                <p className="text-xs text-slate-500 dark:text-white/60">Enable Animations, Dark Mode & Haptics</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Enter Code" 
                                value={premiumCode}
                                onChange={(e) => setPremiumCode(e.target.value)}
                                className="flex-1 bg-slate-100 dark:bg-white/10 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                            />
                            <button 
                                onClick={handleUnlockPremium}
                                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90"
                            >
                                Redeem
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-center gap-2 py-2 text-primary">
                            <Check size={20} />
                            <span className="font-medium">All features unlocked</span>
                        </div>
                        <button 
                            onClick={handleDeactivate}
                            className="w-full py-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <LogOut size={14} />
                            Deactivate Subscription
                        </button>
                    </div>
                )}
             </GlassCard>
          </section>

          {/* Graphics Section */}
          <section>
             <h3 className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-3 px-2">Graphics & Performance</h3>
             <GlassCard className="overflow-hidden flex flex-col p-0">
                 <div className="p-4 border-b border-slate-100 dark:border-white/5">
                     <div className="flex items-center gap-4 mb-3">
                         <div className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70">
                             <Monitor size={20} />
                         </div>
                         <div>
                             <h4 className="text-slate-900 dark:text-white font-medium">Frame Rate (FPS)</h4>
                             <p className="text-xs text-slate-500 dark:text-white/40">Max supported: {maxDetectedFps}Hz {!isPremium && maxDetectedFps > 60 && "(Premium Limit)"}</p>
                         </div>
                     </div>
                     
                     {/* FPS Slider/Selector */}
                     <div className="flex flex-wrap gap-2 pl-14">
                         {AVAILABLE_FPS.filter(fps => {
                             // Show if within hardware capability
                             const isSupported = fps <= maxDetectedFps;
                             // If NOT premium, hide options > 60
                             if (!isPremium && fps > 60) return false;
                             return isSupported;
                         }).map((fps) => (
                             <button
                                key={fps}
                                onClick={() => { trigger(5); setTargetFps(fps); }}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                    targetFps === fps 
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                        : "bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/5"
                                )}
                             >
                                 {fps}
                             </button>
                         ))}
                         {!isPremium && maxDetectedFps > 60 && (
                             <div className="px-3 py-1.5 rounded-lg text-xs font-bold border border-transparent text-slate-400 flex items-center gap-1 opacity-50 cursor-not-allowed">
                                 <Lock size={10} />
                                 High FPS
                             </div>
                         )}
                     </div>
                 </div>

                <SettingItem 
                    icon={Activity} 
                    title="Show FPS Counter" 
                    subtitle="Real-time performance viewer"
                    action={<Toggle checked={showFps} onChange={() => { trigger(10); toggleShowFps(); }} />} 
                />
                
                <SettingItem 
                    icon={isFullScreen ? Minimize : Maximize} 
                    title="Full Screen Mode" 
                    subtitle="Hide extra borders"
                    action={<Toggle checked={isFullScreen} onChange={toggleFullScreen} />} 
                />
                <SettingItem 
                    icon={isDarkMode ? Moon : Sun} 
                    title="Dark Mode" 
                    subtitle={!isPremium ? "Premium Required" : "System Default"}
                    disabled={!isPremium}
                    action={<Toggle checked={isDarkMode} onChange={handleToggleTheme} disabled={!isPremium} />} 
                />
                
                {/* Customize Feel - Only visible if Premium AND Dark Mode is on */}
                <AnimatePresence>
                    {isPremium && isDarkMode && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 dark:border-white/5"
                        >
                            <SettingItem 
                                icon={Palette} 
                                title="Customize Feel" 
                                subtitle="Change app colors & theme"
                                action={<div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">PRO</div>}
                                onClick={() => setShowThemeModal(true)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
             </GlassCard>
          </section>

          {/* Appearance / Haptics */}
          <section>
             <h3 className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-3 px-2">Interactions</h3>
             <GlassCard className="overflow-hidden flex flex-col p-0">
                <div className="border-b border-slate-100 dark:border-white/5">
                    <SettingItem 
                        icon={Smartphone} 
                        title="Haptic Feedback" 
                        subtitle={!isPremium ? "Premium Required" : "System vibration"}
                        disabled={!isPremium}
                        action={<Toggle checked={hapticEnabled && isPremium} onChange={handleToggleHaptic} disabled={!isPremium} />} 
                    />
                    
                    {/* Haptic Intensity Selector */}
                    {isPremium && hapticEnabled && (
                        <div className="px-4 pb-4 pl-14 flex flex-wrap gap-2">
                             {HAPTIC_LEVELS.map((level) => (
                                 <button
                                    key={level.id}
                                    onClick={() => { 
                                        setHapticIntensity(level.id);
                                        // Preview the vibration instantly
                                        if (navigator.vibrate) {
                                            setTimeout(() => trigger(10), 0);
                                        }
                                    }}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1",
                                        hapticIntensity === level.id
                                            ? (level.id === 'monster' 
                                                ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/30" 
                                                : "bg-primary text-white border-primary shadow-lg shadow-primary/20")
                                            : "bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/5"
                                    )}
                                 >
                                     {level.id === 'monster' && <Zap size={10} fill="currentColor" />}
                                     {level.label}
                                 </button>
                             ))}
                        </div>
                    )}
                </div>
             </GlassCard>
          </section>

          {/* Audio */}
          <section>
             <h3 className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-3 px-2">Audio</h3>
             <GlassCard className="overflow-hidden flex flex-col p-0">
                <SettingItem 
                    icon={Sliders} 
                    title="Equalizer" 
                    subtitle={eqSettings.preset}
                    value={eqSettings.preset === 'Flat' ? 'Off' : 'On'}
                    onClick={() => setShowEqModal(true)}
                    action={<ChevronRight size={18} className="text-slate-400 dark:text-white/30" />} 
                />
             </GlassCard>
          </section>

           {/* General */}
           <section>
             <h3 className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-3 px-2">General</h3>
             <GlassCard className="overflow-hidden flex flex-col p-0">
                <SettingItem 
                    icon={Bell} 
                    title="Notifications" 
                    action={<Toggle checked={notifications} onChange={() => { trigger(10); setNotifications(!notifications); }} />} 
                />
                <SettingItem 
                    icon={Shield} 
                    title="Privacy Policy" 
                    action={<ChevronRight size={18} className="text-slate-400 dark:text-white/30" />} 
                />
                <SettingItem 
                    icon={Info} 
                    title="Version" 
                    value="v1.0.5" 
                />
             </GlassCard>
          </section>
      </div>

      <EqualizerModal isOpen={showEqModal} onClose={() => setShowEqModal(false)} />

      {/* Theme Studio Modal */}
      <AnimatePresence>
          {showThemeModal && (
            <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10 max-h-[80vh] overflow-y-auto"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Palette className="text-primary" /> Theme Studio
                        </h2>
                        <button onClick={() => setShowThemeModal(false)} className="p-2 bg-white/10 rounded-full">
                            <X size={20} className="text-white" />
                        </button>
                    </div>

                    {/* Presets Grid */}
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Pro Presets</h3>
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {THEME_PRESETS.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => {
                                    trigger(10);
                                    updateTheme(preset.primary, preset.secondary);
                                }}
                                className={clsx(
                                    "p-4 rounded-2xl border flex items-center gap-3 transition-all relative overflow-hidden",
                                    primaryColor === preset.primary 
                                        ? "bg-white/10 border-primary" 
                                        : "bg-black/20 border-white/5 hover:bg-white/5"
                                )}
                            >
                                <div 
                                    className="w-8 h-8 rounded-full shadow-lg border-2 border-white/20"
                                    style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                                />
                                <span className="text-white font-medium">{preset.name}</span>
                                {primaryColor === preset.primary && (
                                    <div className="absolute top-2 right-2 text-primary"><Check size={16} /></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Custom Color Pickers */}
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">Custom Colors</h3>
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                             <span className="text-white font-medium">Primary Color</span>
                             <div className="relative">
                                <input 
                                    type="color" 
                                    value={primaryColor}
                                    onChange={(e) => updateTheme(e.target.value, secondaryColor)}
                                    className="w-10 h-10 rounded-full overflow-hidden opacity-0 absolute inset-0 cursor-pointer"
                                />
                                <div className="w-10 h-10 rounded-full border-2 border-white/20 shadow-inner" style={{ backgroundColor: primaryColor }} />
                             </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                             <span className="text-white font-medium">Accent Color</span>
                             <div className="relative">
                                <input 
                                    type="color" 
                                    value={secondaryColor}
                                    onChange={(e) => updateTheme(primaryColor, e.target.value)}
                                    className="w-10 h-10 rounded-full overflow-hidden opacity-0 absolute inset-0 cursor-pointer"
                                />
                                <div className="w-10 h-10 rounded-full border-2 border-white/20 shadow-inner" style={{ backgroundColor: secondaryColor }} />
                             </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => { trigger(10); resetTheme(); }}
                        className="w-full py-3 rounded-xl bg-white/5 text-white/60 font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 mb-2"
                    >
                        <RefreshCcw size={16} /> Reset to Default
                    </button>

                    <button 
                        onClick={() => setShowThemeModal(false)}
                        className="w-full py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20"
                    >
                        Done
                    </button>
                </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showPremiumSuccess && (
             <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-full shadow-xl z-50 font-bold flex items-center gap-2"
             >
                 <Crown size={20} fill="currentColor" />
                 Premium Unlocked!
             </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-8 text-center text-slate-400 dark:text-white/20 text-xs mb-4">
        <p>Made with ❤️ by Plus Player</p>
      </div>
    </motion.div>
  );
};
