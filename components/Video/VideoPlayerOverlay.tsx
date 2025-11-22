
import React, { useState, useRef, useEffect } from 'react';
import { Video } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Lock, Unlock, SkipBack, SkipForward } from 'lucide-react';
import { formatTime } from '../../services/audioUtils';
import { useHaptic } from '../../hooks/useHaptic';
import { clsx } from 'clsx';

interface VideoPlayerOverlayProps {
  video: Video;
  onClose: () => void;
}

export const VideoPlayerOverlay: React.FC<VideoPlayerOverlayProps> = ({ video, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { trigger } = useHaptic();

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const updateTime = () => setCurrentTime(v.currentTime);
    const updateDuration = () => setDuration(v.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener('timeupdate', updateTime);
    v.addEventListener('loadedmetadata', updateDuration);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    
    // Auto play
    v.play().catch(e => console.warn("Autoplay blocked", e));

    return () => {
      v.removeEventListener('timeupdate', updateTime);
      v.removeEventListener('loadedmetadata', updateDuration);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, []);

  const showControls = () => {
    if (isLocked) return;
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setIsControlsVisible(false);
    }, 3000);
  };

  const togglePlay = () => {
    trigger(10);
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleLock = () => {
      trigger(20);
      setIsLocked(!isLocked);
      if (!isLocked) setIsControlsVisible(false); // Hide immediately on lock
      else setIsControlsVisible(true);
  };

  const changeSpeed = () => {
      const rates = [0.5, 1.0, 1.5, 2.0];
      const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
      const newRate = rates[nextIdx];
      setPlaybackRate(newRate);
      if (videoRef.current) videoRef.current.playbackRate = newRate;
      trigger(5);
  };

  const toggleFit = () => {
      setFitMode(prev => prev === 'contain' ? 'cover' : 'contain');
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={showControls}
      onClick={showControls}
    >
      <video 
        ref={videoRef}
        src={video.url}
        className={clsx("w-full h-full transition-all duration-500", fitMode === 'cover' ? 'object-cover' : 'object-contain')}
        playsInline
        preload="metadata"
      />

      {/* Controls Overlay */}
      <motion.div 
        initial={false}
        animate={{ opacity: isControlsVisible ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none flex flex-col justify-between p-6"
      >
        {/* Header */}
        <div className={clsx("flex justify-between items-start pointer-events-auto transition-all", isLocked ? "opacity-0" : "opacity-100")}>
           <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
              <X size={24} />
           </button>
           <h2 className="text-white font-medium text-sm mt-2 drop-shadow-md max-w-[200px] truncate">{video.title}</h2>
           <button onClick={toggleFit} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white text-xs font-bold w-10 h-10 flex items-center justify-center">
               {fitMode === 'contain' ? 'FIT' : 'FILL'}
           </button>
        </div>

        {/* Center Play Button (Only shows when paused or controls visible) */}
        <div className={clsx("self-center pointer-events-auto", isLocked ? "opacity-0" : "opacity-100")}>
            {!isPlaying && (
                <button onClick={togglePlay} className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 hover:scale-105 transition-all">
                    <Play size={40} fill="white" className="text-white ml-1" />
                </button>
            )}
        </div>

        {/* Bottom Controls */}
        <div className={clsx("flex flex-col gap-4 pointer-events-auto mb-4 transition-all", isLocked ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0")}>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
                <span className="text-white/80 text-xs font-mono w-10 text-right">{formatTime(currentTime)}</span>
                <input 
                    type="range" 
                    min={0} 
                    max={duration || 100} 
                    value={currentTime} 
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary hover:h-2 transition-all"
                />
                <span className="text-white/80 text-xs font-mono w-10">{formatTime(duration)}</span>
            </div>

            {/* Buttons Row */}
            <div className="flex justify-between items-center px-2">
                <div className="flex gap-4">
                    <button onClick={() => { trigger(5); if(videoRef.current) videoRef.current.currentTime -= 10; }} className="text-white/80 hover:text-white">
                        <SkipBack size={24} />
                    </button>
                    <button onClick={togglePlay} className="text-white hover:text-primary">
                        {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
                    </button>
                    <button onClick={() => { trigger(5); if(videoRef.current) videoRef.current.currentTime += 10; }} className="text-white/80 hover:text-white">
                        <SkipForward size={24} />
                    </button>
                </div>

                <div className="flex gap-4 items-center">
                    <button onClick={changeSpeed} className="text-white font-bold text-sm w-8 h-8 border border-white/30 rounded-full flex items-center justify-center hover:bg-white/10">
                        {playbackRate}x
                    </button>
                </div>
            </div>
        </div>
      </motion.div>

      {/* Lock Button (Always visible if locked, or visible with controls) */}
      <AnimatePresence>
        {(isControlsVisible || isLocked) && (
            <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleLock}
                className={clsx(
                    "absolute left-6 bottom-10 z-[110] p-3 rounded-full backdrop-blur-md transition-all pointer-events-auto",
                    isLocked ? "bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]" : "bg-white/10 text-white hover:bg-white/20"
                )}
            >
                {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
            </motion.button>
        )}
      </AnimatePresence>
      
    </motion.div>
  );
};
