import React from 'react';
import { Play, Pause, SkipForward, X } from 'lucide-react';
import { Track } from '../../types';
import { NeonButton } from '../ui/GlassCard';
import { clsx } from 'clsx';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onExpand: () => void;
  onClose: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ track, isPlaying, onTogglePlay, onNext, onExpand, onClose }) => {
  if (!track) return null;

  return (
    <div 
      className="absolute bottom-20 left-4 right-4 z-20"
      onClick={onExpand}
    >
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pr-2 flex items-center shadow-2xl shadow-black/50 overflow-hidden cursor-pointer group relative">
        
        {/* Animated Progress Bar Background - Simulated */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-primary/50 w-full">
           <div className="h-full bg-primary w-1/3 animate-pulse"></div>
        </div>

        {/* Album Art */}
        <div className={clsx(
          "w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 shrink-0 relative",
          isPlaying ? "animate-[spin_4s_linear_infinite]" : ""
        )}>
           <img src={track.coverUrl} alt="Cover" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
             <div className="w-3 h-3 bg-black rounded-full border border-white/30"></div>
           </div>
        </div>

        {/* Info */}
        <div className="flex-1 ml-3 overflow-hidden">
          <h4 className="text-white text-sm font-semibold truncate group-hover:text-primary transition-colors">{track.title}</h4>
          <p className="text-white/50 text-xs truncate">{track.artist}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <NeonButton 
            className="w-9 h-9 bg-transparent hover:bg-white/10 !shadow-none"
            onClick={onTogglePlay}
          >
            {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-1" />}
          </NeonButton>
          
          <NeonButton 
             className="w-8 h-8 bg-transparent hover:bg-white/10 !shadow-none text-white/70"
             onClick={onNext}
          >
            <SkipForward size={16} />
          </NeonButton>
          
          {/* Divider */}
          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Close Button */}
          <NeonButton
             className="w-8 h-8 bg-transparent hover:bg-red-500/20 hover:text-red-400 !shadow-none text-white/50"
             onClick={onClose}
          >
             <X size={16} />
          </NeonButton>
        </div>
      </div>
    </div>
  );
};