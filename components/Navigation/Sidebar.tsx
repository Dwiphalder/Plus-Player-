import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Home, Film, Heart, Settings } from 'lucide-react';
import { CATEGORIES } from '../../constants';
import { clsx } from 'clsx';
import { ScreenName } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, onClose, activeCategory, onSelectCategory, searchQuery, onSearchChange,
  currentScreen, onNavigate
}) => {
  
  const handleNavigation = (screen: ScreenName) => {
      onNavigate(screen);
      if (screen === 'home') {
        onSelectCategory('all'); // Reset to all songs when going home
      }
      onClose();
  };

  const handleCategorySelect = (id: string) => {
      if (currentScreen !== 'home') {
          onNavigate('home');
      }
      onSelectCategory(id);
      onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          {/* Sidebar Drawer */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 z-[70] shadow-2xl p-6 flex flex-col h-full overflow-y-auto no-scrollbar"
          >
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Plus</h2>
                <button onClick={onClose} className="p-2 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors">
                   <X size={20} className="text-slate-600 dark:text-white" />
                </button>
             </div>

             {/* Search Input in Menu */}
             <div className="relative group mb-8">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search size={20} className="text-slate-400 dark:text-white/40" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-white border-slate-200 dark:bg-white/5 dark:border-white/10 border rounded-2xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                />
            </div>

            {/* Main Navigation */}
            <div className="space-y-1 mb-8">
                <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-2 pl-2">Menu</h3>
                
                <button
                    onClick={() => handleNavigation('home')}
                    className={clsx(
                        "w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3",
                        currentScreen === 'home'
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/5"
                    )}
                >
                    <Home size={20} /> Home
                </button>

                <button
                    onClick={() => handleNavigation('video')}
                    className={clsx(
                        "w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3",
                        currentScreen === 'video'
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/5"
                    )}
                >
                    <Film size={20} /> Video
                </button>

                <button
                    onClick={() => handleNavigation('favorites')}
                    className={clsx(
                        "w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3",
                        currentScreen === 'favorites'
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/5"
                    )}
                >
                    <Heart size={20} /> Favorites
                </button>

                <button
                    onClick={() => handleNavigation('settings')}
                    className={clsx(
                        "w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3",
                        currentScreen === 'settings'
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/5"
                    )}
                >
                    <Settings size={20} /> Settings
                </button>
            </div>

            {/* Music Categories (Only show contextually or always) */}
            <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-2 pl-2">Browse Music</h3>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={clsx(
                            "w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between",
                            currentScreen === 'home' && activeCategory === cat.id 
                                ? "bg-white dark:bg-white/10 text-primary border border-primary/20" 
                                : "text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/5"
                        )}
                    >
                        {cat.name}
                        {currentScreen === 'home' && activeCategory === cat.id && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </button>
                ))}
            </div>

            <div className="mt-auto pt-8">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/10">
                    <p className="text-xs text-slate-500 dark:text-white/50 text-center">Plus Player v1.0.5</p>
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};