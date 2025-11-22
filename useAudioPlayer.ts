import { useState, useRef, useEffect, useCallback } from 'react';
import { Track, LoopMode } from '../types';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loopMode, setLoopMode] = useState<LoopMode>(LoopMode.None);
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => handleNext();
    const onError = (e: Event) => {
        console.error("Audio Playback Error:", audio.error);
        setIsPlaying(false);
        // Optionally attempt to play next track if error occurs
        // handleNext(); 
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Lock screen media controls
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Media Session Metadata
  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }]
      });
    }
  }, [currentTrack]);

  const play = useCallback(() => {
    if (audioRef.current && currentTrack) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.warn("Playback prevented or interrupted:", error.message);
            setIsPlaying(false);
          });
      }
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueue(newQueue);
    }
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => {
             if (error.name === 'NotAllowedError') {
                 console.warn("Autoplay prevented. User interaction required.");
             } else {
                 console.error("Playback failed:", error);
             }
             setIsPlaying(false);
          });
      }
    }
    setHistory(prev => [...prev, track]);
  }, []);

  const handleNext = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;

    if (loopMode === LoopMode.One && audioRef.current) {
      audioRef.current.currentTime = 0;
      play();
      return;
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    let nextIndex = currentIndex + 1;

    if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
    }

    if (nextIndex >= queue.length) {
      if (loopMode === LoopMode.All) {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return; // End of playlist
      }
    }

    playTrack(queue[nextIndex]);
  }, [currentTrack, queue, loopMode, isShuffle, playTrack, play]);

  const handlePrev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    
    // If more than 3 seconds in, just restart song
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
       prevIndex = queue.length - 1;
    }

    playTrack(queue[prevIndex]);
  }, [currentTrack, queue, playTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const changeVolume = useCallback((vol: number) => {
      if(audioRef.current) {
          audioRef.current.volume = vol;
          setVolume(vol);
      }
  }, []);

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleLoop = () => {
    setLoopMode(prev => (prev + 1) % 3);
  };

  return {
    audioRef,
    isPlaying,
    currentTrack,
    currentTime,
    duration,
    volume,
    loopMode,
    isShuffle,
    queue,
    playTrack,
    togglePlay,
    handleNext,
    handlePrev,
    seek,
    changeVolume,
    toggleShuffle,
    toggleLoop,
    setQueue,
  };
};