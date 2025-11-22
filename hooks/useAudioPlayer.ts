import { useState, useRef, useEffect, useCallback } from 'react';
import { Track, LoopMode } from '../types';
import { useSettings } from '../contexts/SettingsContext';

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  
  const { eqSettings } = useSettings();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loopMode, setLoopMode] = useState<LoopMode>(LoopMode.None);
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);

  // Initialize Audio Element AND Web Audio API Graph together
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audioRef.current = audio;

    // Audio Context Setup
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      // Only create context if it doesn't exist or was closed
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyserNodeRef.current = analyser;

          // Create Filters (5 Bands)
          const frequencies = [60, 250, 1000, 4000, 12000];
          const types: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];
          
          const filters = frequencies.map((freq, i) => {
            const filter = ctx.createBiquadFilter();
            filter.type = types[i];
            filter.frequency.value = freq;
            filter.gain.value = 0;
            return filter;
          });
          filtersRef.current = filters;

          // Connect Graph: Source -> Filters -> Analyser -> Destination
          const source = ctx.createMediaElementSource(audio);
          
          let currentNode: AudioNode = source;
          filters.forEach(filter => {
            currentNode.connect(filter);
            currentNode = filter;
          });
          
          currentNode.connect(analyser);
          analyser.connect(ctx.destination);
      }

    } catch (e) {
      console.warn("Web Audio API initialization warning:", e);
    }

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
        if (isFinite(audio.duration)) {
            setDuration(audio.duration);
        }
    };
    
    const onError = (e: Event) => {
        // Ignore errors if source is empty (happens during cleanup)
        if (!audio.src || audio.src === window.location.href) return;

        const error = audio.error;
        let message = "Unknown error";
        let code = 0;
        
        if (error) {
            code = error.code;
            switch (error.code) {
                case error.MEDIA_ERR_ABORTED: message = "Aborted"; break;
                case error.MEDIA_ERR_NETWORK: message = "Network error"; break;
                case error.MEDIA_ERR_DECODE: message = "Decode error"; break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED: message = "Source not supported"; break;
                default: message = "Unknown"; break;
            }
        }
        
        // Only log unexpected errors
        if (code !== error?.MEDIA_ERR_ABORTED) {
            console.error(`Audio Playback Error: ${message} (${code})`);
        }
        
        setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('error', onError);

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => audio.play().catch(() => {}));
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => {/* handled by hook dep */});
        navigator.mediaSession.setActionHandler('nexttrack', () => {/* handled by hook dep */});
      } catch(e) { console.warn("Media Session API error", e); }
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('error', onError);
      audio.src = '';
      
      // CRITICAL FIX: Explicitly nullify the context ref so it is recreated on re-mount
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.warn("Context close error", e));
        }
        audioContextRef.current = null; 
        filtersRef.current = [];
        analyserNodeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle 'ended' event and media controls that depend on state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => handleNext();
    const onNextTrack = () => handleNext();
    const onPrevTrack = () => handlePrev();

    audio.addEventListener('ended', onEnded);
    
    if ('mediaSession' in navigator) {
        try {
            navigator.mediaSession.setActionHandler('nexttrack', onNextTrack);
            navigator.mediaSession.setActionHandler('previoustrack', onPrevTrack);
        } catch(e) {}
    }

    return () => {
        audio.removeEventListener('ended', onEnded);
    };
  }, [queue, currentTrack, loopMode, isShuffle]); // Re-bind when dependencies change

  // Update EQ Gains
  useEffect(() => {
    if (filtersRef.current.length > 0 && audioContextRef.current && audioContextRef.current.state === 'running') {
      const currentTime = audioContextRef.current.currentTime;
      filtersRef.current.forEach((filter, i) => {
        const targetGain = eqSettings.gains[i] || 0;
        if (Number.isFinite(targetGain)) {
           filter.gain.setTargetAtTime(targetGain, currentTime, 0.1);
        }
      });
    }
  }, [eqSettings]);

  // Metadata Update
  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album,
            artwork: [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }]
          });
      } catch(e) {}
    }
  }, [currentTrack]);

  const resumeContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(e => console.warn("Context resume error", e));
    }
  }, []);

  const play = useCallback(() => {
    resumeContext();
    if (audioRef.current && currentTrack) {
      if (!audioRef.current.src) {
          // If src was cleared or lost, restore it
          audioRef.current.src = currentTrack.audioUrl;
          audioRef.current.load();
      }
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
             // Only log real errors, not aborts caused by rapid switching
             if (error.name !== 'AbortError') {
                console.warn("Playback prevented:", error.message);
             }
             setIsPlaying(false);
          });
      }
    }
  }, [currentTrack, resumeContext]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    resumeContext();
    if (newQueue) {
      setQueue(newQueue);
    }
    setCurrentTrack(track);
    
    if (audioRef.current) {
      if (!track.audioUrl) {
          console.error("Invalid audio URL for track:", track.title);
          return;
      }

      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => {
             if (error.name !== 'AbortError') {
                console.warn("Playback start failed:", error.message);
             }
             setIsPlaying(false);
          });
      }
    }
    setHistory(prev => [...prev, track]);
  }, [resumeContext]);

  const handleNext = useCallback(() => {
    // We use a ref check or state check. queue is from closure, need to ensure it's fresh.
    // The useEffect dependent on [queue] ensures this callback is recreated when queue changes.
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
        return; 
      }
    }
    playTrack(queue[nextIndex]);
  }, [currentTrack, queue, loopMode, isShuffle, playTrack, play]);

  const handlePrev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;

    playTrack(queue[prevIndex]);
  }, [currentTrack, queue, playTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      if (Number.isFinite(time)) {
          audioRef.current.currentTime = time;
          setCurrentTime(time);
      }
    }
  }, []);

  const changeVolume = useCallback((vol: number) => {
      if(audioRef.current) {
          audioRef.current.volume = vol;
          setVolume(vol);
      }
  }, []);

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleLoop = () => setLoopMode(prev => (prev + 1) % 3);

  return {
    audioRef,
    analyserNodeRef,
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
    stop, // Added stop
  };
};