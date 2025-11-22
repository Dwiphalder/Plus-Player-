
import React, { useState } from 'react';
import { ChevronDown, Heart, MoreVertical, Shuffle, Repeat, Play, Pause, SkipBack, SkipForward, ListMusic, Volume2, Edit3, Trash2, Info, Bell, Share2, X, Check, AlertTriangle } from 'lucide-react';
import { Track, LoopMode } from '../types';
import { formatTime } from '../services/audioUtils';
import { Visualizer } from '../components/Player/Visualizer';
import { NeonButton } from '../components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useSettings } from '../contexts/SettingsContext';
import { EqualizerModal } from '../components/Player/EqualizerModal';
import { useHaptic } from '../hooks/useHaptic';

interface FullPlayerProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onClose: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  loopMode: LoopMode;
  isShuffle: boolean;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  analyserNodeRef: React.MutableRefObject<AnalyserNode | null>;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export const FullPlayer: React.FC<FullPlayerProps> = ({
  track, isPlaying, currentTime, duration, onClose, onTogglePlay, onNext, onPrev, onSeek,
  loopMode, isShuffle, toggleLoop, toggleShuffle, audioRef, analyserNodeRef, isFavorite, onToggleFavorite,
  onDelete, onRename
}) => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Modal States
  const [showInfo, setShowInfo] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showRingtoneToast, setShowRingtoneToast] = useState(false);

  const { isPremium } = useSettings();
  const { trigger } = useHaptic();
  
  const handleMenuClick = () => {
      trigger(5);
      setShowMenu(!showMenu);
  };

  const handleSetRingtone = () => {
      trigger([10, 10]);
      setShowMenu(false);
      setShowRingtoneToast(true);
      setTimeout(() => setShowRingtoneToast(false), 2500);
  };

  const handleRenamePrepare = () => {
      setRenameValue(track.title);
      setShowRename(true);
      setShowMenu(false);
  };

  const handleRenameConfirm = () => {
      if (renameValue.trim()) {
          trigger(10);
          onRename(track.id, renameValue.trim());
          setShowRename(false);
      }
  };

  const handleDeleteConfirm = () => {
      trigger([20, 50]);
      onDelete(track.id);
      setShowDelete(false);
      setShowMenu(false);
      // Close is handled by parent due to track unmount, but safe to call here if needed
  };

  const handleShare = async () => {
      trigger(5);
      if (navigator.share) {
          try {
              await navigator.share({
                  title: track.title,
                  text: `Listening to ${track.title} by ${track.artist}`,
                  url: window.location.href
              });
          } catch (e) {
              // Ignore
          }
      } else {
          alert("Share not supported on this browser");
      }
      setShowMenu(false);
  };

  const handleInfo = () => {
      trigger(5);
      setShowInfo(true);
      setShowMenu(false);
  };

  return (
    <>
      <motion.div 
        initial={isPremium ? { y: '100%', scale: 0.95, opacity: 0 } : { y: '100%' }}
        animate={isPremium ? { y: 0, scale: 1, opacity: 1 } : { y: 0 }}
        exit={isPremium ? { y: '100%', scale: 0.95, opacity: 0 } : { y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 1 }}
        style={{ willChange: 'transform' }} 
        className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white overflow-hidden shadow-2xl"
      >
        {/* Dynamic Background Blur - Removed pulse for performance */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img src={track.coverUrl} alt="bg" className="w-full h-full object-cover opacity-50 blur-2xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-slate-900/60 to-slate-900/95" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center p-6 pt-12">
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ChevronDown size={24} />
          </button>
          <span className="text-xs font-medium tracking-widest uppercase text-white/70">Now Playing</span>
          <button 
            onClick={handleMenuClick}
            className={clsx("p-2 rounded-full transition-colors", showMenu ? "bg-primary text-white" : "hover:bg-white/10")}
          >
            <MoreVertical size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex-1 flex flex-col px-8 py-4 overflow-y-auto no-scrollbar">
          
          {/* Album Art / Vinyl */}
          <div className="flex-1 flex items-center justify-center py-6 min-h-[300px]">
            {!showLyrics ? (
              <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  className={clsx(
                    "relative w-72 h-72 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/5",
                    isPlaying ? "rotate-vinyl" : "paused-vinyl"
                  )}
              >
                  <img 
                    src={track.coverUrl} 
                    alt="Album Art" 
                    className="w-full h-full object-cover rounded-full"
                  />
                  {/* Center hole for vinyl effect */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-slate-900 rounded-full border-2 border-white/10 flex items-center justify-center">
                      <div className="w-3 h-3 bg-black rounded-full" />
                    </div>
                  </div>
              </motion.div>
            ) : (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full bg-white/5 rounded-3xl p-6 overflow-y-auto backdrop-blur-md"
              >
                <h3 className="text-lg font-bold mb-4 text-primary">Lyrics</h3>
                <p className="text-white/80 leading-loose text-lg text-center">
                  (Lyrics not available for demo tracks)<br/>
                  Imagine synced lyrics scrolling here...<br/>
                  ♫ ♫ ♫<br/>
                  Neon lights in the rain<br/>
                  Cyber city calling my name<br/>
                  ...
                </p>
              </motion.div>
            )}
          </div>

          {/* Track Info */}
          <div className="mt-6 flex justify-between items-end mb-8">
            <div className="flex-1 mr-4">
              <h2 className="text-2xl font-bold mb-1 leading-tight truncate">{track.title}</h2>
              <p className="text-lg text-white/60 truncate">{track.artist}</p>
            </div>
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={onToggleFavorite}
              className={clsx(
                  "p-3 rounded-full transition-all duration-300 shrink-0",
                  isFavorite ? "text-primary bg-primary/20 hover:bg-primary/30" : "text-white/30 bg-white/5 hover:bg-white/10 hover:text-white"
              )}
            >
              <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
            </motion.button>
          </div>

          {/* Seek Bar */}
          <div className="mb-8">
            <div className="mb-4">
              <Visualizer isPlaying={isPlaying} analyserNodeRef={analyserNodeRef} />
            </div>

            <input 
              type="range" 
              min={0} 
              max={duration || 100} 
              value={currentTime} 
              onChange={(e) => onSeek(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-pink-500 transition-colors"
            />
            <div className="flex justify-between text-xs text-white/40 mt-2 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-10">
            <button 
              onClick={toggleShuffle} 
              className={clsx("p-2 transition-colors", isShuffle ? "text-primary" : "text-white/40")}
            >
              <Shuffle size={20} />
            </button>
            
            <motion.button whileTap={{ scale: 0.9 }} onClick={onPrev} className="p-2 text-white hover:text-primary transition-colors">
              <SkipBack size={32} fill="currentColor" className="text-white" />
            </motion.button>
            
            <NeonButton 
              onClick={onTogglePlay} 
              active 
              className="w-20 h-20 !p-0 flex items-center justify-center bg-gradient-to-br from-primary to-secondary hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause size={32} fill="white" />
              ) : (
                <Play size={32} fill="white" className="ml-1" />
              )}
            </NeonButton>
            
            <motion.button whileTap={{ scale: 0.9 }} onClick={onNext} className="p-2 text-white hover:text-primary transition-colors">
              <SkipForward size={32} fill="currentColor" className="text-white" />
            </motion.button>
            
            <button 
              onClick={toggleLoop} 
              className={clsx("p-2 transition-colors relative", loopMode !== LoopMode.None ? "text-primary" : "text-white/40")}
            >
              <Repeat size={20} />
              {loopMode === LoopMode.One && (
                <span className="absolute top-1 right-0 text-[8px] font-bold">1</span>
              )}
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between items-center px-4 pb-8">
            <button className="flex flex-col items-center gap-1 text-white/50 hover:text-white" onClick={() => setShowLyrics(!showLyrics)}>
                <ListMusic size={20} />
                <span className="text-[10px]">LYRICS</span>
            </button>
            <button 
              className="flex flex-col items-center gap-1 text-white/50 hover:text-white"
              onClick={() => setShowEq(true)}
            >
                <Volume2 size={20} />
                <span className="text-[10px]">EQ</span>
            </button>
          </div>
        </div>

        {/* Options Menu Action Sheet */}
        <AnimatePresence>
          {showMenu && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMenu(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute bottom-0 left-0 right-0 bg-slate-800/90 border-t border-white/10 rounded-t-3xl p-6 z-50 flex flex-col gap-2"
              >
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                  
                  <button onClick={handleRenamePrepare} className="flex items-center gap-4 p-4 hover:bg-white/10 rounded-xl transition-colors">
                      <Edit3 size={20} className="text-white/70" />
                      <span className="font-medium">Rename</span>
                  </button>

                  <button onClick={handleSetRingtone} className="flex items-center gap-4 p-4 hover:bg-white/10 rounded-xl transition-colors">
                      <Bell size={20} className="text-white/70" />
                      <span className="font-medium">Set as Ringtone</span>
                  </button>

                  <button onClick={handleInfo} className="flex items-center gap-4 p-4 hover:bg-white/10 rounded-xl transition-colors">
                      <Info size={20} className="text-white/70" />
                      <span className="font-medium">Song Info</span>
                  </button>

                   <button onClick={handleShare} className="flex items-center gap-4 p-4 hover:bg-white/10 rounded-xl transition-colors">
                      <Share2 size={20} className="text-white/70" />
                      <span className="font-medium">Share</span>
                  </button>

                  <div className="h-[1px] bg-white/10 my-1" />

                  <button onClick={() => { trigger(10); setShowDelete(true); setShowMenu(false); }} className="flex items-center gap-4 p-4 hover:bg-red-500/20 rounded-xl transition-colors text-red-400">
                      <Trash2 size={20} />
                      <span className="font-medium">Delete from Library</span>
                  </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Rename Modal */}
        <AnimatePresence>
            {showRename && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <motion.div initial={{scale: 0.9}} animate={{scale:1}} className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold mb-4">Rename Song</h3>
                        <input 
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 mb-6 focus:outline-none focus:border-primary"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowRename(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-white/70">Cancel</button>
                            <button onClick={handleRenameConfirm} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold">Save</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Delete Modal */}
        <AnimatePresence>
            {showDelete && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <motion.div initial={{scale: 0.9}} animate={{scale:1}} className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 border border-white/10 text-center">
                        <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Delete Song?</h3>
                        <p className="text-white/60 text-sm mb-6">Are you sure you want to delete "{track.title}"? This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDelete(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-white/70">Cancel</button>
                            <button onClick={handleDeleteConfirm} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold">Delete</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Info Modal */}
        <AnimatePresence>
            {showInfo && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setShowInfo(false)}>
                    <motion.div initial={{scale: 0.9}} animate={{scale:1}} className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-6 border-b border-white/10 pb-2">Song Info</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/50">File Name</span>
                                <span className="text-white truncate max-w-[150px]">{track.title}.mp3</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">Artist</span>
                                <span className="text-white">{track.artist}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">Album</span>
                                <span className="text-white">{track.album}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">Duration</span>
                                <span className="text-white">{formatTime(duration)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-white/50">Format</span>
                                <span className="text-white">MP3 / 320kbps</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-white/50">Location</span>
                                <span className="text-white truncate max-w-[150px]">{track.isLocal ? '/Internal Storage/Music' : 'Streaming'}</span>
                            </div>
                        </div>
                        <button onClick={() => setShowInfo(false)} className="w-full py-3 rounded-xl bg-white/10 text-white mt-6 font-medium">Close</button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
        
        {/* Ringtone Toast */}
        <AnimatePresence>
             {showRingtoneToast && (
                 <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="absolute bottom-24 left-0 right-0 mx-auto w-max px-6 py-3 bg-primary text-white rounded-full shadow-lg font-medium flex items-center gap-2 z-[70]"
                 >
                     <Bell size={16} /> Ringtone Set Successfully
                 </motion.div>
             )}
        </AnimatePresence>

      </motion.div>

      <EqualizerModal isOpen={showEq} onClose={() => setShowEq(false)} />
    </>
  );
};
