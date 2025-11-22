
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Track } from '../types';
import { FolderOpen, Plus, Music, ArrowUpDown, Clock, Zap, Calendar, Check, Trash2, Edit3, X, CheckSquare, Square } from 'lucide-react';
import { parseFileToTrack } from '../services/audioUtils';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { GlassCard } from '../components/ui/GlassCard';
import { ScrollReveal } from '../components/ui/ScrollReveal';

interface LibraryScreenProps {
  tracks: Track[];
  onImport: (tracks: Track[]) => void;
  onPlayTrack: (track: Track, playlist: Track[]) => void;
  onDelete: (ids: string[]) => void;
  onRename: (id: string, newName: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'mostPlayed' | 'durationDesc' | 'az';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ tracks, onImport, onPlayTrack, onDelete, onRename }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  
  // Refs for long press handling
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const { trigger } = useHaptic();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newTracks: Track[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.type.startsWith('audio/')) {
          const track = await parseFileToTrack(file);
          if (track) newTracks.push(track);
        }
      }
      if (newTracks.length > 0) {
          trigger([10, 50]);
          onImport(newTracks);
      }
    }
    if(e.target) e.target.value = "";
  };

  const sortedTracks = useMemo(() => {
    const t = [...tracks];
    switch (sortOption) {
      case 'newest':
        return t.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
      case 'oldest':
        return t.sort((a, b) => (a.dateAdded || 0) - (b.dateAdded || 0));
      case 'mostPlayed':
        return t.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      case 'durationDesc':
        return t.sort((a, b) => b.duration - a.duration);
      case 'az':
        return t.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return t;
    }
  }, [tracks, sortOption]);

  const getSortLabel = () => {
    switch (sortOption) {
      case 'newest': return 'Recently Added';
      case 'oldest': return 'Oldest Added';
      case 'mostPlayed': return 'Most Played';
      case 'durationDesc': return 'Longest Duration';
      case 'az': return 'A-Z';
    }
  };

  // --- Selection Logic ---

  const startLongPress = (id: string) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      trigger(50);
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTrackClick = (track: Track, playlist: Track[]) => {
    if (isSelectionMode) {
      trigger(5);
      toggleSelection(track.id);
    } else {
      if (!isLongPress.current) {
        trigger(5);
        onPlayTrack(track, playlist);
      }
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      if (newSet.size === 0) setIsSelectionMode(false);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    trigger(10);
    if (selectedIds.size === tracks.length) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedIds(new Set(tracks.map(t => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    trigger([10, 30, 10]);
    onDelete(Array.from(selectedIds));
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handlePrepareRename = () => {
    if (selectedIds.size !== 1) return;
    trigger(10);
    const id = Array.from(selectedIds)[0];
    const track = tracks.find(t => t.id === id);
    if (track) {
      setRenameValue(track.title);
      setShowRenameModal(true);
    }
  };

  const handleConfirmRename = () => {
    if (renameValue.trim() && selectedIds.size === 1) {
      trigger(10);
      const id = Array.from(selectedIds)[0];
      onRename(id, renameValue.trim());
      setShowRenameModal(false);
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  return (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="pb-32 px-6 pt-8 h-full flex flex-col relative"
    >
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">My Library</h1>

      {/* Actions (Hidden in Selection Mode) */}
      <AnimatePresence>
        {!isSelectionMode && (
          <motion.div 
            initial={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => { trigger(5); fileInputRef.current?.click(); }}
                className="bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden active:scale-[0.98]"
              >
                <div className="p-3 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                   <Plus size={24} />
                </div>
                <span className="font-medium text-sm text-slate-900 dark:text-white">Import Files</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  multiple 
                  accept="audio/*" 
                  className="hidden" 
                />
              </button>
              
              <button 
                onClick={() => { trigger(5); folderInputRef.current?.click(); }}
                className="bg-white border-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/70 border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden active:scale-[0.98]"
              >
                <div className="p-3 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                   <FolderOpen size={24} />
                </div>
                <span className="font-medium text-sm text-slate-900 dark:text-white">Local Folders</span>
                <input 
                  type="file" 
                  ref={folderInputRef} 
                  onChange={handleFileChange} 
                  {...({ webkitdirectory: "true", directory: "" } as any)}
                  className="hidden" 
                />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort Controls */}
      <div className="flex justify-between items-center mb-4 relative z-30">
        <h3 className="text-sm font-bold text-slate-400 dark:text-white/50 uppercase tracking-wider">
          {isSelectionMode ? `${selectedIds.size} Selected` : `All Tracks (${tracks.length})`}
        </h3>
        
        {!isSelectionMode && (
          <button 
            onClick={() => { trigger(5); setShowSortMenu(!showSortMenu); }}
            className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
          >
            <ArrowUpDown size={14} />
            {getSortLabel()}
          </button>
        )}

        {/* Sort Dropdown */}
        {showSortMenu && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-2 z-40 flex flex-col overflow-hidden backdrop-blur-xl"
            >
              {[
                { id: 'newest', label: 'Recently Added', icon: Calendar },
                { id: 'mostPlayed', label: 'Most Played', icon: Zap },
                { id: 'durationDesc', label: 'Longest Duration', icon: Clock },
                { id: 'oldest', label: 'Oldest Added', icon: Calendar },
                { id: 'az', label: 'A-Z', icon: Music },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    trigger(5);
                    setSortOption(opt.id as SortOption);
                    setShowSortMenu(false);
                  }}
                  className={clsx(
                    "px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
                    sortOption === opt.id ? "text-primary bg-primary/5" : "text-slate-600 dark:text-white/70"
                  )}
                >
                  <opt.icon size={16} />
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto -mx-6 px-6 no-scrollbar pb-24">
        {sortedTracks.length === 0 ? (
          <div className="text-center py-10 text-slate-400 dark:text-white/30 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 animate-pulse">
               <Music size={40} className="opacity-50" />
            </div>
            <p className="text-lg font-medium">No songs found</p>
            <p className="text-xs mt-2 max-w-[200px]">Import files or select a folder to build your library.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTracks.map((track, i) => {
              const isSelected = selectedIds.has(track.id);
              return (
                <ScrollReveal key={track.id} delay={i < 10 ? i * 0.05 : 0}>
                  <div 
                    onPointerDown={() => startLongPress(track.id)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onClick={() => handleTrackClick(track, sortedTracks)}
                    className={clsx(
                      "flex items-center p-3 rounded-xl transition-all cursor-pointer group border",
                      isSelected 
                          ? "bg-primary/20 border-primary/50" 
                          : "bg-transparent hover:bg-white dark:hover:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/5"
                    )}
                  >
                    {/* Selection Checkbox */}
                    {isSelectionMode ? (
                        <div className="mr-3 text-primary">
                          {isSelected ? <CheckSquare size={20} fill="currentColor" className="text-white" /> : <Square size={20} className="text-slate-400" />}
                        </div>
                    ) : (
                        <div className="w-6 text-center text-slate-400 dark:text-white/30 font-medium text-xs mr-2">{i + 1}</div>
                    )}
                    
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-white/10 mr-4 relative shadow-sm">
                      <img src={track.coverUrl} className="w-full h-full object-cover" alt="" />
                      {isSelected && <div className="absolute inset-0 bg-primary/30 flex items-center justify-center"><Check size={20} className="text-white" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white truncate">{track.title}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500 dark:text-white/50 truncate max-w-[100px]">{track.artist}</div>
                        {track.isLocal && <span className="text-[8px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-white/40">LOCAL</span>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-white/30 font-mono">
                      {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Selection Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-20 left-6 right-6 bg-slate-900/90 dark:bg-white/10 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-white/10 z-50 flex justify-between items-center"
          >
             <button onClick={handleSelectAll} className="p-3 flex flex-col items-center text-white/70 hover:text-white transition-colors">
                <CheckSquare size={20} />
                <span className="text-[10px] mt-1">All</span>
             </button>
             
             <button 
                onClick={handlePrepareRename} 
                disabled={selectedIds.size !== 1}
                className="p-3 flex flex-col items-center text-white/70 hover:text-white transition-colors disabled:opacity-30"
             >
                <Edit3 size={20} />
                <span className="text-[10px] mt-1">Rename</span>
             </button>

             <button onClick={handleDeleteSelected} className="p-3 flex flex-col items-center text-red-400 hover:text-red-300 transition-colors">
                <Trash2 size={20} />
                <span className="text-[10px] mt-1">Delete</span>
             </button>

             <div className="h-8 w-[1px] bg-white/20 mx-1" />

             <button onClick={() => setIsSelectionMode(false)} className="p-3 flex flex-col items-center text-white/70 hover:text-white transition-colors">
                <X size={20} />
                <span className="text-[10px] mt-1">Cancel</span>
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {showRenameModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10"
             >
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Rename Song</h3>
                <input 
                   type="text" 
                   value={renameValue}
                   onChange={(e) => setRenameValue(e.target.value)}
                   autoFocus
                   className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary mb-6"
                />
                <div className="flex gap-3">
                   <button 
                      onClick={() => setShowRenameModal(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/60 font-semibold hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={handleConfirmRename}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 shadow-lg shadow-primary/25 transition-colors"
                   >
                      Save
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
