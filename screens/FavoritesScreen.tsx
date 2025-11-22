import React from 'react';
import { Track } from '../types';
import { Play, Heart, Music, Shuffle, Menu } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { motion } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';

interface FavoritesScreenProps {
  tracks: Track[];
  favoriteIds: Set<string>;
  onPlayTrack: (track: Track, playlist: Track[]) => void;
  onOpenSidebar: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ tracks, favoriteIds, onPlayTrack, onOpenSidebar }) => {
  const { trigger } = useHaptic();
  const favoriteTracks = tracks.filter(t => favoriteIds.has(t.id));

  const handlePlayAll = () => {
    if (favoriteTracks.length > 0) {
      trigger(10);
      onPlayTrack(favoriteTracks[0], favoriteTracks);
    }
  };

  const handleShuffle = () => {
     if (favoriteTracks.length > 0) {
        trigger(10);
        const shuffled = [...favoriteTracks].sort(() => Math.random() - 0.5);
        onPlayTrack(shuffled[0], shuffled);
     }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-32 px-6 pt-8 h-full flex flex-col"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-4">
             <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => { trigger(5); onOpenSidebar(); }}
                className="p-2 -ml-2 w-10 rounded-full bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
                <Menu size={24} />
            </motion.button>
            <div>
                <h1 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">Favorites</h1>
                <p className="text-slate-500 dark:text-white/50 text-sm">{favoriteTracks.length} Songs you love</p>
            </div>
        </div>
        <motion.div whileTap={{ scale: 0.8 }} className="mt-2">
           <Heart className="text-primary mb-2 fill-primary" size={32} />
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button 
            onClick={handlePlayAll}
            disabled={favoriteTracks.length === 0}
            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg active:scale-95"
        >
            <Play size={18} fill="currentColor" />
            Play All
        </button>
        <button 
            onClick={handleShuffle}
            disabled={favoriteTracks.length === 0}
            className="flex-1 bg-white/50 dark:bg-white/10 text-slate-900 dark:text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-white/80 dark:hover:bg-white/20 transition-colors disabled:opacity-50 shadow-sm active:scale-95"
        >
            <Shuffle size={18} />
            Shuffle
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto -mx-6 px-6 no-scrollbar">
        {favoriteTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-white/30">
             <Heart size={48} className="mb-4 opacity-20" />
             <p className="text-lg font-medium">No favorites yet</p>
             <p className="text-xs mt-2">Tap the heart icon on the player to add songs.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {favoriteTracks.map((track, i) => (
              <ScrollReveal key={track.id} delay={i < 10 ? i * 0.05 : 0}>
                <GlassCard 
                  className="flex items-center p-3 gap-3 hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer group border-transparent hover:border-slate-200 dark:hover:border-white/10 active:scale-[0.99]"
                  onClick={() => { trigger(5); onPlayTrack(track, favoriteTracks); }}
                >
                  <div className="w-8 text-center text-slate-400 dark:text-white/30 font-medium text-sm">{i + 1}</div>
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm">
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={16} fill="white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">{track.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-white/50 truncate">{track.artist}</p>
                  </div>
                  <Heart size={18} className="text-primary mr-2" fill="#8b5cf6" />
                  <div className="text-xs text-slate-400 dark:text-white/30 font-mono">
                    {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                  </div>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};