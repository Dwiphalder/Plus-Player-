
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Track, Video, ScreenName, Playlist } from '../types';
import { CATEGORIES } from '../constants';
import { GlassCard } from '../components/ui/GlassCard';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { Play, FolderSearch, Music, WifiOff, CheckSquare, Square, Edit3, Trash2, X, Check, ArrowRight, ArrowLeft, Plus, ListPlus, Shuffle, Image as ImageIcon, AlertTriangle, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { scanDirectory } from '../services/fileSystem';
import { parseFileToTrack } from '../services/audioUtils';
import { clsx } from 'clsx';

interface HomeScreenProps {
  tracks: Track[];
  playlists: Playlist[];
  onPlayTrack: (track: Track, playlist: Track[]) => void;
  greeting: string;
  onImport: (tracks: Track[], videos: Video[]) => void;
  onDelete: (ids: string[]) => void;
  onRename: (id: string, newName: string) => void;
  onNavigate: (screen: ScreenName) => void;
  onCreatePlaylist: (name: string, coverUrl?: string) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onOpenSidebar: () => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
}

// Internal Navigation State
type InternalView = 
  | { type: 'root' }
  | { type: 'album'; albumName: string }
  | { type: 'playlist'; playlistId: string };

const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [error, setError] = useState(false);
  useEffect(() => { setError(false); }, [src]);

  if (error) {
    return (
      <div className={clsx(className, "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center")}>
         <Music className="text-slate-400 dark:text-slate-500" size="50%" />
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)} 
      loading="lazy"
    />
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
    tracks, playlists, onPlayTrack, greeting, onImport, onDelete, onRename, onNavigate, onCreatePlaylist, onAddToPlaylist, onOpenSidebar, activeCategory, onSelectCategory, searchQuery 
}) => {
  const [internalView, setInternalView] = useState<InternalView>({ type: 'root' });
  const [isScanning, setIsScanning] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const { trigger } = useHaptic();

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Playlist Creation State
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistCover, setNewPlaylistCover] = useState<string | null>(null);
  const playlistCoverInputRef = useRef<HTMLInputElement>(null);

  // Add to Playlist State
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState<string | null>(null);

  // Long Press Logic
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  // Filtered Data based on Search
  const filteredTracks = useMemo(() => {
      if (!searchQuery) return tracks;
      const lower = searchQuery.toLowerCase();
      return tracks.filter(t => t.title.toLowerCase().includes(lower) || t.artist.toLowerCase().includes(lower));
  }, [tracks, searchQuery]);

  const groupedAlbums = useMemo(() => {
    const map = new Map<string, Track[]>();
    filteredTracks.forEach(t => {
      const list = map.get(t.album) || [];
      list.push(t);
      map.set(t.album, list);
    });
    return Array.from(map.entries());
  }, [filteredTracks]);

  const groupedArtists = useMemo(() => {
    const map = new Map<string, Track[]>();
    filteredTracks.forEach(t => {
      const list = map.get(t.artist) || [];
      list.push(t);
      map.set(t.artist, list);
    });
    return Array.from(map.entries());
  }, [filteredTracks]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleBack = () => {
      trigger(10);
      setInternalView({ type: 'root' });
  };

  const handleOpenAlbum = (albumName: string) => {
      trigger(10);
      setInternalView({ type: 'album', albumName });
  };

  const handleOpenPlaylist = (playlistId: string) => {
      trigger(10);
      if (playlistId === 'fav') {
          onNavigate('favorites');
      } else if (playlistId === 'recent') {
          // Just reset sort in future if needed, currently no op since activeCategory handles it
      } else {
          setInternalView({ type: 'playlist', playlistId });
      }
  };

  const handleFallbackInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsScanning(true);
      const newTracks: Track[] = [];
      const files: File[] = Array.from(e.target.files);
      
      const processChunk = async (startIndex: number) => {
        const chunk = files.slice(startIndex, startIndex + 50);
        for (const file of chunk) {
           if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.m4a')) {
              const track = await parseFileToTrack(file);
              if (track) newTracks.push(track);
           }
        }
        
        if (startIndex + 50 < files.length) {
           setTimeout(() => processChunk(startIndex + 50), 0);
        } else {
           if (newTracks.length > 0) {
             onImport(newTracks, []);
             trigger([10, 50, 10]);
           }
           setIsScanning(false);
        }
      };

      processChunk(0);
    }
    if(e.target) e.target.value = ""; 
  };

  const handleScan = async () => {
    trigger(10);
    setIsScanning(true);
    try {
      const result = await scanDirectory();
      if (result.audio.length > 0 || result.video.length > 0) {
        onImport(result.audio, result.video);
        trigger([10, 50, 10]);
      }
      setIsScanning(false);
    } catch (error) {
      console.warn("Directory Picker failed, using fallback:", error);
      if (fallbackInputRef.current) {
        setTimeout(() => {
            fallbackInputRef.current?.click();
            setIsScanning(false);
        }, 100);
      } else {
        setIsScanning(false);
      }
    }
  };

  // --- Selection Logic ---
  const startLongPress = (id: string) => {
    if (activeCategory !== 'all' && internalView.type === 'root') return;
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
    if (selectedIds.size === filteredTracks.length) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedIds(new Set(filteredTracks.map(t => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    trigger(10);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    trigger([10, 30, 10]);
    onDelete(Array.from(selectedIds));
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
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

  const handlePlaylistCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setNewPlaylistCover(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handleCreatePlaylistConfirm = () => {
      if (newPlaylistName.trim()) {
          trigger(10);
          onCreatePlaylist(newPlaylistName.trim(), newPlaylistCover || undefined);
          setNewPlaylistName('');
          setNewPlaylistCover(null);
          setShowCreatePlaylistModal(false);
      }
  };

  const openAddToPlaylist = (trackId: string) => {
      trigger(5);
      setTrackToAdd(trackId);
      setShowAddToPlaylistModal(true);
  };

  const confirmAddToPlaylist = (playlistId: string) => {
      if (trackToAdd) {
          trigger(10);
          onAddToPlaylist(playlistId, trackToAdd);
          setShowAddToPlaylistModal(false);
          setTrackToAdd(null);
      }
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Renderers ---

  const renderAlbumView = (albumName: string) => {
      const albumTracks = tracks.filter(t => t.album === albumName);
      const albumCover = albumTracks.length > 0 ? albumTracks[0].coverUrl : '';

      return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="pb-32"
          >
              <div className="flex flex-col items-center mb-8">
                  <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl mb-4 border-4 border-white/10">
                      <ImageWithFallback src={albumCover} alt={albumName} className="w-full h-full object-cover" />
                  </div>
                  <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">{albumName}</h2>
                  <p className="text-slate-500 dark:text-white/50 text-sm">{albumTracks[0]?.artist}</p>
                  
                  <button 
                    onClick={() => onPlayTrack(albumTracks[0], albumTracks)}
                    className="mt-4 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform flex items-center gap-2"
                  >
                      <Play fill="currentColor" size={18} /> Play Album
                  </button>
              </div>

              <div className="space-y-2 px-2">
                  {albumTracks.map((track, i) => (
                      <ScrollReveal key={track.id} delay={i * 0.05}>
                        <div 
                            onClick={() => onPlayTrack(track, albumTracks)}
                            className="flex items-center p-3 rounded-xl hover:bg-white/80 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                            <span className="w-8 text-center text-slate-400 text-sm font-mono">{i+1}</span>
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-white">{track.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-white/50">{formatTime(track.duration)}</p>
                            </div>
                            <button onClick={(e) => {e.stopPropagation(); openAddToPlaylist(track.id);}} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ListPlus size={20} className="text-slate-400 dark:text-white/50 hover:text-primary" />
                            </button>
                        </div>
                      </ScrollReveal>
                  ))}
              </div>
          </motion.div>
      );
  };

  const renderPlaylistView = (playlistId: string) => {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return <div>Playlist not found</div>;

      const playlistTracks = tracks.filter(t => playlist.trackIds.includes(t.id));

      return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="pb-32"
          >
              <div className="flex flex-col items-center mb-8">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl mb-4 bg-gradient-to-br from-primary to-secondary flex items-center justify-center relative">
                      {playlist.coverUrl && !playlist.coverUrl.includes('random') ? (
                          <img src={playlist.coverUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                          <FolderSearch size={48} className="text-white/50" />
                      )}
                  </div>
                  <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">{playlist.name}</h2>
                  <p className="text-slate-400 dark:text-white/30 text-xs mt-1">{playlistTracks.length} Songs</p>
                  
                  <div className="flex gap-3 mt-4">
                    <button 
                        onClick={() => playlistTracks.length > 0 && onPlayTrack(playlistTracks[0], playlistTracks)}
                        className="bg-primary text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50"
                        disabled={playlistTracks.length === 0}
                    >
                        <Play fill="currentColor" size={18} /> Play
                    </button>
                    <button 
                        onClick={() => {
                            if (playlistTracks.length > 0) {
                                const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
                                onPlayTrack(shuffled[0], shuffled);
                            }
                        }}
                        className="bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                        disabled={playlistTracks.length === 0}
                    >
                        <Shuffle size={18} /> Shuffle
                    </button>
                  </div>
              </div>

               <div className="space-y-2 px-2">
                  {playlistTracks.length === 0 ? (
                      <div className="text-center text-slate-400 py-10">
                          <p>This playlist is empty.</p>
                          <p className="text-xs mt-2">Add songs from the main library.</p>
                      </div>
                  ) : (
                    playlistTracks.map((track, i) => (
                        <ScrollReveal key={track.id} delay={i * 0.05}>
                            <div 
                                onClick={() => onPlayTrack(track, playlistTracks)}
                                className="flex items-center p-3 rounded-xl hover:bg-white/80 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded bg-slate-200 dark:bg-white/10 mr-3 overflow-hidden">
                                    <ImageWithFallback src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 dark:text-white truncate">{track.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-white/50 truncate">{track.artist}</p>
                                </div>
                                <span className="text-xs text-slate-400 font-mono">{formatTime(track.duration)}</span>
                            </div>
                        </ScrollReveal>
                    ))
                  )}
              </div>
          </motion.div>
      );
  };

  const renderContent = () => {
    if (internalView.type === 'album') return renderAlbumView(internalView.albumName);
    if (internalView.type === 'playlist') return renderPlaylistView(internalView.playlistId);

    switch (activeCategory) {
      case 'albums':
        return (
          <div className="grid grid-cols-2 gap-4">
            {groupedAlbums.map(([albumName, albumTracks], i) => (
              <ScrollReveal key={albumName} delay={i * 0.05}>
                <GlassCard 
                  className="p-3 group cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => handleOpenAlbum(albumName)}
                >
                  <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 relative">
                    <ImageWithFallback src={albumTracks[0].coverUrl} alt={albumName} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{albumName}</h3>
                  <p className="text-slate-500 dark:text-white/50 text-xs">{albumTracks[0].artist}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        );
      
      case 'artists':
        return (
          <div className="grid grid-cols-3 gap-4">
            {groupedArtists.map(([artistName, artistTracks], i) => (
              <ScrollReveal key={artistName} delay={i * 0.05}>
                 <div
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                  onClick={() => { trigger(5); onPlayTrack(artistTracks[0], artistTracks); }}
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 relative shadow-lg group-active:scale-95 transition-transform">
                    <ImageWithFallback src={artistTracks[0].coverUrl} alt={artistName} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white text-center truncate w-full">{artistName}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        );

      case 'playlists':
        return (
          <div className="space-y-4">
            <ScrollReveal delay={0}>
               <button 
                  onClick={() => setShowCreatePlaylistModal(true)}
                  className="w-full flex items-center p-4 gap-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/20 text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mb-2"
               >
                  <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                     <Plus size={32} />
                  </div>
                  <div className="text-left">
                      <h3 className="font-semibold text-lg">Create Playlist</h3>
                      <p className="text-xs">Add a new collection</p>
                  </div>
               </button>
            </ScrollReveal>

            {playlists.map((playlist, i) => (
              <ScrollReveal key={playlist.id} delay={i * 0.1}>
                <GlassCard 
                  onClick={() => handleOpenPlaylist(playlist.id)}
                  className="flex items-center p-4 gap-4 hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer active:scale-[0.98] transition-all group"
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-slate-600 dark:text-white/50 overflow-hidden shadow-inner relative">
                    {playlist.coverUrl ? (
                      <ImageWithFallback src={playlist.coverUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <FolderSearch size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{playlist.name}</h3>
                    <p className="text-slate-500 dark:text-white/50 text-sm">{playlist.trackIds.length} Songs</p>
                  </div>
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-white/5 group-hover:bg-primary group-hover:text-white transition-colors">
                      <ArrowRight size={20} />
                  </div>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        );

      case 'all':
      default:
        return (
          <div className="space-y-4">
            {filteredTracks.map((track, i) => {
              const isSelected = selectedIds.has(track.id);
              return (
                <ScrollReveal key={track.id} delay={i < 10 ? i * 0.05 : 0}>
                  <div 
                    onPointerDown={() => startLongPress(track.id)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                  >
                    <GlassCard 
                      className={clsx(
                        "flex items-center p-3 gap-4 cursor-pointer group active:scale-[0.98] transition-all",
                        isSelected ? "bg-primary/20 border-primary/50" : "hover:bg-white/80 dark:hover:bg-white/10"
                      )}
                      onClick={() => handleTrackClick(track, filteredTracks)}
                    >
                      {isSelectionMode ? (
                          <div className="mr-1 text-primary">
                            {isSelected ? <CheckSquare size={20} fill="currentColor" className="text-white" /> : <Square size={20} className="text-slate-400" />}
                          </div>
                      ) : null}

                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm bg-slate-200 dark:bg-white/5">
                        <ImageWithFallback src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        {isSelected && <div className="absolute inset-0 bg-primary/30 flex items-center justify-center"><Check size={24} className="text-white" /></div>}
                        {!isSelected && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={20} fill="white" />
                        </div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate">{track.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-white/50 truncate">{track.artist}</p>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-white/40 mr-2">{formatTime(track.duration)}</div>
                      
                      {!isSelectionMode && (
                        <button className="p-2 text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-transform" onClick={(e) => { e.stopPropagation(); openAddToPlaylist(track.id); }}>
                          <ListPlus size={20} />
                        </button>
                      )}
                    </GlassCard>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pb-32 px-6 pt-8 relative h-full"
    >
      <input
        type="file"
        ref={fallbackInputRef}
        onChange={handleFallbackInputChange}
        style={{ display: 'none' }}
        {...({ webkitdirectory: "true", directory: "", multiple: true } as any)}
      />

      <AnimatePresence>
          {internalView.type !== 'root' && (
              <motion.button
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                onClick={handleBack}
                className="absolute top-6 left-4 z-40 w-12 h-12 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-slate-900 dark:text-white shadow-lg hover:bg-white/30 transition-all"
              >
                  <ArrowLeft size={24} />
              </motion.button>
          )}
      </AnimatePresence>

      {internalView.type === 'root' && (
          <div className="flex justify-between items-center mb-6 relative z-10">
            {/* Menu Button */}
             <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => { trigger(5); onOpenSidebar(); }}
                className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
             >
                <Menu size={24} />
             </motion.button>

            {/* Greeting */}
            <div className="text-center">
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-white/60">
                    {isSelectionMode ? `${selectedIds.size} Selected` : greeting}
                </h1>
                {!isSelectionMode && (
                    <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-white/50 text-xs">
                    {isOffline && <WifiOff size={10} className="text-red-400" />}
                    </div>
                )}
            </div>

            {/* Profile -> Settings */}
            <motion.div 
                whileTap={{ scale: 0.9 }}
                onClick={() => { trigger(5); onNavigate('settings'); }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 cursor-pointer"
            >
                <ImageWithFallback src="https://picsum.photos/100/100" alt="Profile" className="w-full h-full rounded-full border-2 border-white dark:border-black object-cover" />
            </motion.div>
        </div>
      )}

      {/* Scan Button */}
      <AnimatePresence>
        {!isSelectionMode && internalView.type === 'root' && (
          <motion.div 
            layout
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6"
          >
            <button 
              onClick={handleScan}
              className={clsx(
                "w-full p-4 rounded-2xl shadow-lg flex items-center justify-between group relative overflow-hidden active:scale-[0.98] transition-all",
                tracks.length < 10 
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-primary/30 ring-4 ring-primary/20"
                  : "bg-white dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10"
              )}
            >
              <div className="relative z-10 flex items-center gap-3">
                 <div className={clsx("p-2 rounded-full", tracks.length < 10 ? "bg-white/20" : "bg-slate-100 dark:bg-white/10")}>
                   {isScanning ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FolderSearch size={20} />}
                 </div>
                 <div className="text-left">
                   <h3 className="font-bold text-sm">{tracks.length < 10 ? "Setup Music Library" : "Scan Media Files"}</h3>
                   <p className={clsx("text-xs", tracks.length < 10 ? "text-white/80" : "text-slate-500 dark:text-white/50")}>
                      {tracks.length < 10 ? "Import songs & videos" : "Sync directory changes"}
                   </p>
                 </div>
              </div>
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      {internalView.type === 'root' && !isSelectionMode && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-4 pb-2">
            {CATEGORIES.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => { trigger(5); onSelectCategory(cat.id); }}
                    className={clsx(
                        "px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                        activeCategory === cat.id 
                            ? "bg-primary text-white shadow-lg shadow-primary/30" 
                            : "bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-300 dark:hover:bg-white/10"
                    )}
                >
                    {cat.name}
                </button>
            ))}
        </div>
      )}

      {renderContent()}

      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-6 right-6 bg-slate-900/90 dark:bg-white/10 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-white/10 z-50 flex justify-between items-center max-w-md mx-auto"
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

      <AnimatePresence>
        {showCreatePlaylistModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10"
             >
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Create New Playlist</h3>
                
                <div className="flex justify-center mb-6">
                    <input 
                        type="file" 
                        accept="image/*"
                        ref={playlistCoverInputRef}
                        onChange={handlePlaylistCoverChange}
                        className="hidden"
                    />
                    <button 
                        onClick={() => playlistCoverInputRef.current?.click()}
                        className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center text-slate-500 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors overflow-hidden relative"
                    >
                        {newPlaylistCover ? (
                            <img src={newPlaylistCover} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <ImageIcon size={24} className="mb-2" />
                                <span className="text-xs">Add Cover</span>
                            </>
                        )}
                    </button>
                </div>

                <input 
                   type="text" 
                   placeholder="Playlist Name"
                   value={newPlaylistName}
                   onChange={(e) => setNewPlaylistName(e.target.value)}
                   autoFocus
                   className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary mb-6"
                />
                <div className="flex gap-3">
                   <button 
                      onClick={() => {
                          setShowCreatePlaylistModal(false);
                          setNewPlaylistCover(null);
                          setNewPlaylistName('');
                      }}
                      className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/60 font-semibold hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={handleCreatePlaylistConfirm}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 shadow-lg shadow-primary/25 transition-colors"
                   >
                      Create
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
          {showDeleteConfirm && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10"
                  >
                      <div className="flex flex-col items-center mb-4 text-center">
                          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500 mb-4">
                              <AlertTriangle size={24} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete {selectedIds.size} Songs?</h3>
                          <p className="text-slate-500 dark:text-white/60 text-sm mt-2">
                              Are you sure you want to delete these tracks? This action cannot be undone.
                          </p>
                      </div>
                      
                      <div className="flex gap-3 mt-6">
                          <button 
                              onClick={() => setShowDeleteConfirm(false)}
                              className="flex-1 py-3 rounded-xl bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/60 font-semibold hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={confirmDelete}
                              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 shadow-lg shadow-red-500/25 transition-colors"
                          >
                              Delete
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddToPlaylistModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 max-h-[60vh] overflow-hidden flex flex-col"
             >
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Add to Playlist</h3>
                <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2 mb-4">
                    {playlists.filter(p => !p.isAuto).map(playlist => (
                        <button 
                            key={playlist.id}
                            onClick={() => confirmAddToPlaylist(playlist.id)}
                            className="w-full text-left p-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded bg-slate-300 dark:bg-white/20 overflow-hidden">
                                {playlist.coverUrl && <img src={playlist.coverUrl} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <span className="font-medium truncate flex-1">{playlist.name}</span>
                            <Plus size={18} />
                        </button>
                    ))}
                    {playlists.filter(p => !p.isAuto).length === 0 && (
                        <p className="text-center text-slate-500 dark:text-white/50 text-sm py-4">No custom playlists yet.</p>
                    )}
                </div>
                <button 
                    onClick={() => setShowAddToPlaylistModal(false)}
                    className="w-full py-3 rounded-xl bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/60 font-semibold hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
                >
                    Cancel
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
