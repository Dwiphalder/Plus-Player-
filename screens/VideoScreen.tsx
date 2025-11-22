import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Video, Track } from '../types';
import { Play, Film, Clock, Search, FileVideo, FolderSearch, CheckSquare, Square, Trash2, X, Check, AlertTriangle, Menu } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { VideoPlayerOverlay } from '../components/Video/VideoPlayerOverlay';
import { scanDirectory } from '../services/fileSystem';
import { generateVideoThumbnail } from '../services/videoUtils';
import { formatTime } from '../services/audioUtils';
import { clsx } from 'clsx';

interface VideoScreenProps {
  videos: Video[];
  onImport: (tracks: Track[], videos: Video[]) => void;
  onDelete: (ids: string[]) => void;
  onOpenSidebar: () => void;
}

export const VideoScreen: React.FC<VideoScreenProps> = ({ videos, onImport, onDelete, onOpenSidebar }) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  // Store metadata: thumbnail and duration
  const [metadata, setMetadata] = useState<Record<string, { thumbnail: string, duration: number }>>({});
  
  const fallbackVideoInputRef = useRef<HTMLInputElement>(null);
  const { trigger } = useHaptic();

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Long Press Logic
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  // Generate thumbnails and duration for videos
  useEffect(() => {
    const generateMetadata = async () => {
        for (const video of videos) {
            // Check if we already have metadata or if the video object has it
            const hasMeta = metadata[video.id];
            const hasNativeMeta = video.thumbnailUrl && video.duration > 0;

            if (!hasMeta && !hasNativeMeta) {
                const data = await generateVideoThumbnail(video.url);
                setMetadata(prev => ({ 
                    ...prev, 
                    [video.id]: { 
                        thumbnail: data.thumbnail, 
                        duration: data.duration 
                    } 
                }));
            }
        }
    };
    generateMetadata();
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [videos, searchQuery]);

  const handleFallbackVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsScanning(true);
      const newVideos: Video[] = [];
      const files: File[] = Array.from(e.target.files);

      for (const file of files) {
         if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mkv|mov)$/i)) {
            newVideos.push({
                id: `vid-${Date.now()}-${Math.random()}`,
                title: file.name.replace(/\.[^/.]+$/, ""),
                url: URL.createObjectURL(file),
                duration: 0,
                size: file.size,
                dateAdded: file.lastModified
            });
         }
      }
      
      if (newVideos.length > 0) {
        onImport([], newVideos);
        trigger([10, 50, 10]);
      }
      setIsScanning(false);
    }
    if(e.target) e.target.value = ""; 
  };

  const handleScanVideos = async () => {
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
      console.warn("Video Scan failed or canceled, trying fallback:", error);
      setTimeout(() => {
          fallbackVideoInputRef.current?.click();
          setIsScanning(false);
      }, 200);
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

  const handleVideoClick = (video: Video) => {
    if (isSelectionMode) {
       trigger(5);
       toggleSelection(video.id);
    } else {
      if (!isLongPress.current) {
        trigger(10);
        setSelectedVideo(video);
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
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedIds(new Set(videos.map(v => v.id)));
    }
  };

  const handleConfirmDelete = () => {
    trigger([10, 30, 10]);
    onDelete(Array.from(selectedIds));
    setShowDeleteConfirm(false);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="h-full flex flex-col pb-24 relative">
      <input 
        type="file" 
        ref={fallbackVideoInputRef}
        onChange={handleFallbackVideoChange}
        accept="video/*"
        multiple
        className="hidden"
      />

      <div className="px-6 pt-8 mb-4">
        <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-4">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { trigger(5); onOpenSidebar(); }}
                    className="p-2 -ml-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                    <Menu size={24} />
                </motion.button>
                <div>
                    <motion.h1 
                        layout
                        key={isSelectionMode ? 'select' : 'title'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-slate-900 dark:text-white"
                    >
                        {isSelectionMode ? `${selectedIds.size} Selected` : 'My Videos'}
                    </motion.h1>
                    <span className="text-sm text-slate-500 dark:text-white/50">
                        {isSelectionMode ? 'Manage Selection' : `${videos.length} Videos`}
                    </span>
                </div>
            </div>
        </div>

        {/* Setup Video Library Button (Only if empty & not selecting) */}
        <AnimatePresence>
          {videos.length === 0 && !isSelectionMode && (
            <motion.div 
              layout
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            >
              <button 
                onClick={handleScanVideos}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10 flex items-center justify-between group relative overflow-hidden active:scale-[0.98] transition-all"
              >
                <div className="relative z-10 flex items-center gap-3">
                   <div className="p-2 rounded-full bg-white/20">
                     {isScanning ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FolderSearch size={20} />}
                   </div>
                   <div className="text-left">
                     <h3 className="font-bold text-sm">Import Local Videos</h3>
                     <p className="text-xs text-white/80">Scan folder or select files</p>
                   </div>
                </div>
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        {!isSelectionMode && (
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 dark:text-white/40" />
                </div>
                <input 
                    type="text" 
                    placeholder="Find video..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-slate-200 dark:bg-white/5 dark:border-white/10 border rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                />
            </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 no-scrollbar">
        {filteredVideos.length === 0 && !isScanning ? (
           <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <Film size={64} className="mb-4 text-slate-400 dark:text-white/20" />
              <p className="text-slate-900 dark:text-white font-medium">No videos found</p>
              <p className="text-xs text-center text-slate-500 dark:text-white/50 mt-2">Tap Import above to add videos</p>
           </div>
        ) : (
           <div className="grid grid-cols-2 gap-4 pb-24">
             {filteredVideos.map((video, i) => {
               const isSelected = selectedIds.has(video.id);
               const vidMeta = metadata[video.id];
               const displayThumb = vidMeta?.thumbnail || video.thumbnailUrl;
               const displayDuration = vidMeta?.duration || video.duration;

               return (
               <ScrollReveal key={video.id} delay={i * 0.05}>
                 <div
                    onPointerDown={() => startLongPress(video.id)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                 >
                    <GlassCard 
                        className={clsx(
                            "p-2 cursor-pointer group transition-all active:scale-[0.98] relative",
                            isSelected 
                                ? "bg-primary/20 border-primary/50" 
                                : "border-transparent hover:border-primary/30 dark:hover:border-white/20"
                        )}
                        onClick={() => handleVideoClick(video)}
                    >
                        {/* Selection Checkbox Overlay */}
                        {isSelectionMode && (
                            <div className="absolute top-3 left-3 z-20">
                                {isSelected 
                                    ? <div className="bg-primary rounded-md p-0.5"><Check size={14} className="text-white" /></div> 
                                    : <div className="bg-black/50 rounded-md p-0.5"><Square size={14} className="text-white/70" /></div>
                                }
                            </div>
                        )}

                        <div className="aspect-video w-full rounded-lg bg-slate-900 relative overflow-hidden mb-3">
                            {/* Thumbnail or Placeholder */}
                            {displayThumb ? (
                                <img 
                                        src={displayThumb} 
                                        alt={video.title} 
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                            ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                        <FileVideo className="text-white/20" size={32} />
                                    </div>
                            )}
                            
                            {/* Play Overlay (Hidden in selection mode) */}
                            {!isSelectionMode && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30">
                                        <Play fill="white" className="text-white ml-1" size={24} />
                                    </div>
                                </div>
                            )}

                            {/* Selection Overlay */}
                            {isSelected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                                    <Check size={32} className="text-white drop-shadow-lg" />
                                </div>
                            )}

                            {/* Duration Badge */}
                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] font-medium text-white flex items-center gap-1 backdrop-blur-sm">
                                <Clock size={10} />
                                <span>{displayDuration > 0 ? formatTime(displayDuration) : '--:--'}</span> 
                            </div>
                        </div>
                        
                        <h3 className={clsx("font-medium text-sm truncate px-1", isSelected ? "text-primary font-bold" : "text-slate-900 dark:text-white")}>{video.title}</h3>
                        <div className="flex justify-between px-1 mt-1">
                            <span className="text-[10px] text-slate-500 dark:text-white/40">{new Date(video.dateAdded).toLocaleDateString()}</span>
                            <span className="text-[10px] text-slate-500 dark:text-white/40">{(video.size ? (video.size / (1024*1024)).toFixed(1) : '?')} MB</span>
                        </div>
                    </GlassCard>
                 </div>
               </ScrollReveal>
             )}})}
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
            className="absolute bottom-24 left-6 right-6 bg-slate-900/90 dark:bg-white/10 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-white/10 z-50 flex justify-between items-center max-w-md mx-auto"
          >
             <button onClick={handleSelectAll} className="p-3 flex flex-col items-center text-white/70 hover:text-white transition-colors active:scale-95">
                <CheckSquare size={20} />
                <span className="text-[10px] mt-1">All</span>
             </button>
             
             <div className="flex-1" />

             <button onClick={() => { trigger(10); setShowDeleteConfirm(true); }} className="p-3 flex flex-col items-center text-red-400 hover:text-red-300 transition-colors active:scale-95">
                <Trash2 size={20} />
                <span className="text-[10px] mt-1">Delete</span>
             </button>

             <div className="flex-1" />

             <div className="h-8 w-[1px] bg-white/20 mx-1" />

             <button onClick={() => { trigger(5); setIsSelectionMode(false); setSelectedIds(new Set()); }} className="p-3 flex flex-col items-center text-white/70 hover:text-white transition-colors active:scale-95">
                <X size={20} />
                <span className="text-[10px] mt-1">Cancel</span>
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Video Player Overlay */}
      <AnimatePresence>
        {selectedVideo && (
           <VideoPlayerOverlay 
              video={selectedVideo} 
              onClose={() => setSelectedVideo(null)} 
           />
        )}
      </AnimatePresence>
    </div>
  );
};