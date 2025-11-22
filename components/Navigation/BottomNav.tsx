import React, { useState } from 'react';
import { Home, Film, Heart, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { ScreenName } from '../../types';
import { clsx } from 'clsx';
import { useHaptic } from '../../hooks/useHaptic';
import { motion } from 'framer-motion';

interface BottomNavProps {
  currentScreen: ScreenName;
  setScreen: (screen: ScreenName) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, setScreen }) => {
  const { trigger } = useHaptic();
  const [isHidden, setIsHidden] = useState(false);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'video', icon: Film, label: 'Video' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleNavClick = (id: string) => {
    if (currentScreen !== id) {
      trigger(10);
      setScreen(id as ScreenName);
    }
  };

  return (
    <motion.div 
      initial={false}
      animate={{ y: isHidden ? '100%' : '0%' }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute bottom-0 w-full z-30"
    >
      {/* Toggle Button */}
       <button 
         onClick={() => { trigger(5); setIsHidden(!isHidden); }}
         className="absolute -top-8 right-6 w-12 h-9 bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-t-xl border-t border-x border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:text-primary transition-colors shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
       >
         {isHidden ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
       </button>

      <div className="px-6 py-3 pb-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 flex justify-between items-center transition-colors duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-none">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="relative flex flex-col items-center justify-center w-16 h-14"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 w-10 h-10 rounded-full bg-primary/10 dark:bg-white/10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className={clsx(
                "relative z-10 transition-all duration-300 p-1",
                isActive 
                  ? "text-primary dark:text-white scale-110" 
                  : "text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70"
              )}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              <span className={clsx(
                "text-[10px] font-medium transition-all duration-300 absolute bottom-1",
                isActive 
                  ? "opacity-100 translate-y-0 text-slate-900 dark:text-white" 
                  : "opacity-0 translate-y-2"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
