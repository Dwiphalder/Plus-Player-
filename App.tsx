
import React, { useState, useEffect, useRef } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { DEMO_TRACKS, INITIAL_PLAYLISTS } from './constants';
import { HomeScreen } from './screens/HomeScreen';
import { VideoScreen } from './screens/VideoScreen';
import { FavoritesScreen } from './screens/FavoritesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { FullPlayer } from './screens/FullPlayer';
import { MiniPlayer } from './components/Player/MiniPlayer';
import { ScreenName, Track, Video, Playlist } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { useHaptic } from './hooks/useHaptic';
import { clsx } from 'clsx';
import { FpsCounter } from './components/ui/FpsCounter';
import { Sidebar } from './components/Navigation/Sidebar';

const screensOrder: ScreenName[] = ['home', 'video', 'favorites', 'settings'];

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    scale: 1,
    opacity: 1,
    zIndex: 10,
    boxShadow: direction > 0 ? "-20px 0 50px rgba(0,0,0,0.5)" : "20px 0 50px rgba(0,0,0,0.5)",
  }),
  center: {
    x: 0,
    scale: 1,
    opacity: 1,
    zIndex: 1,
    boxShadow: "0 0 0 rgba(0,0,0,0)",
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    scale: 0.95, // Slight scale down for parallax depth effect
    opacity: 0.5, // Fade out slightly
    zIndex: 0,
  })
};

const PageWrapper: React.FC<{ children?: React.ReactNode; pageKey: string; direction: number }> = ({ children, pageKey, direction }) => {
  const { isPremium } = useSettings();
  
  if (!isPremium) {
      return <div className="w-full h-full overflow-hidden">{children}</div>;
  }
  
  return (
    <div className="w-full h-full overflow-hidden relative bg-slate-50 dark:bg-[#0f172a]">
        <motion.div
            key={pageKey}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 250, damping: 30, mass: 1 }}
            className="w-full h-full absolute inset-0"
        >
            {children}
        </motion.div>
    </div>
  );
};

const AppContent = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('home');
  const [slideDirection, setSlideDirection] = useState(0);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [allTracks, setAllTracks] = useState<Track[]>(DEMO_TRACKS);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(['1', '3']));
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);
  
  // Global Sidebar & Navigation State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { trigger } = useHaptic();
  const { isPremium, isFullScreen, showFps } = useSettings();
  
  const player = useAudioPlayer();

  // Swipe Logic Refs
  const touchStart = useRef<{x: number, y: number} | null>(null);

  const handleNavigate = (screen: ScreenName) => {
      const prevIndex = screensOrder.indexOf(currentScreen);
      const nextIndex = screensOrder.indexOf(screen);
      setSlideDirection(nextIndex > prevIndex ? 1 : -1);
      setCurrentScreen(screen);
  };

  const onTouchStart = (e: React.TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const diffX = touchStart.current.x - endX;
      const diffY = touchStart.current.y - endY;
      
      // Check if horizontal swipe is dominant and significant enough
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          const currentIndex = screensOrder.indexOf(currentScreen);
          
          if (diffX > 0) {
              // Swiped Left -> Go Next
              if (currentIndex < screensOrder.length - 1) {
                  trigger(5);
                  handleNavigate(screensOrder[currentIndex + 1]);
              }
          } else {
              // Swiped Right -> Go Prev
              if (currentIndex > 0) {
                  trigger(5);
                  handleNavigate(screensOrder[currentIndex - 1]);
              }
          }
      }
      
      touchStart.current = null;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Night';
  };

  const greeting = getGreeting();

  const handleImport = (newTracks: Track[], newVideos: Video[]) => {
    if (newTracks.length > 0) {
        setAllTracks(prev => {
            const existingTitles = new Set(prev.map(t => t.title));
            const uniqueNew = newTracks.filter(t => !existingTitles.has(t.title));
            return [...uniqueNew, ...prev];
        });
    }
    
    if (newVideos.length > 0) {
        setAllVideos(prev => {
            const existingTitles = new Set(prev.map(v => v.title));
            const uniqueNew = newVideos.filter(v => !existingTitles.has(v.title));
            return [...uniqueNew, ...prev];
        });
    }
  };

  const handleDeleteTracks = (ids: string[]) => {
    if (player.currentTrack && ids.includes(player.currentTrack.id)) {
        player.togglePlay();
        setIsFullPlayerOpen(false);
    }

    setAllTracks(prev => prev.filter(t => !ids.includes(t.id)));
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.delete(id));
      return newSet;
    });
    setPlaylists(prev => prev.map(p => ({
        ...p,
        trackIds: p.trackIds.filter(tid => !ids.includes(tid))
    })));
  };

  const handleDeleteVideos = (ids: string[]) => {
    setAllVideos(prev => prev.filter(v => !ids.includes(v.id)));
  };

  const handleRenameTrack = (id: string, newTitle: string) => {
    setAllTracks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  const handlePlayTrack = (track: Track, playlist: Track[]) => {
    player.playTrack(track, playlist);
    setIsFullPlayerOpen(true);
  };

  const toggleFavorite = (id: string) => {
    trigger(10);
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreatePlaylist = (name: string, coverUrl?: string) => {
      const newPlaylist: Playlist = {
          id: `pl-${Date.now()}`,
          name,
          trackIds: [],
          coverUrl: coverUrl || 'https://picsum.photos/500/500?random=' + Math.floor(Math.random() * 100),
          isAuto: false
      };
      setPlaylists(prev => [...prev, newPlaylist]);
  };

  const handleAddToPlaylist = (playlistId: string, trackId: string) => {
      setPlaylists(prev => prev.map(p => {
          if (p.id === playlistId) {
              if (p.trackIds.includes(trackId)) return p;
              return { ...p, trackIds: [...p.trackIds, trackId] };
          }
          return p;
      }));
  };

  const handleStopPlayback = () => {
      trigger(10);
      player.stop();
  };

  return (
    <div className={clsx(
        "relative w-full h-screen bg-black text-slate-900 dark:text-white overflow-hidden flex justify-center transition-colors duration-500",
        isFullScreen ? "items-stretch" : "" 
    )}>
      {/* FPS Viewer Overlay */}
      {showFps && <FpsCounter />}

      {/* Container */}
      <div className={clsx(
          "w-full bg-slate-50 dark:bg-[#0f172a] relative shadow-2xl overflow-hidden flex flex-col transition-all duration-700",
          isFullScreen ? "max-w-none h-full rounded-none" : "max-w-md h-full shadow-2xl"
      )}
      >
        
        {/* Ambient Gradients */}
        <div className={clsx(
            "absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 dark:bg-primary/20 blur-[120px] rounded-full pointer-events-none",
            isPremium ? "transition-all duration-1000" : ""
        )} />
        <div className={clsx(
            "absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-secondary/10 dark:bg-secondary/20 blur-[120px] rounded-full pointer-events-none",
            isPremium ? "transition-all duration-1000" : ""
        )} />

        {/* Global Sidebar */}
        <Sidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
        />

        {/* Main App Layer */}
        <motion.div 
            className="flex-1 flex flex-col overflow-hidden relative z-0 bg-slate-50 dark:bg-[#0f172a] origin-bottom"
            animate={isPremium && isFullPlayerOpen ? { 
                scale: 0.95, 
                borderRadius: 20, 
                filter: 'brightness(0.7)',
                y: -10
            } : { 
                scale: 1, 
                borderRadius: 0, 
                filter: 'brightness(1)',
                y: 0
            }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex-1 overflow-hidden relative z-0">
                <AnimatePresence initial={false} custom={slideDirection}>
                    {currentScreen === 'home' && (
                    <PageWrapper pageKey="home" direction={slideDirection}>
                        <HomeScreen 
                            tracks={allTracks} 
                            playlists={playlists}
                            onPlayTrack={handlePlayTrack}
                            greeting={greeting}
                            onImport={handleImport}
                            onDelete={handleDeleteTracks}
                            onRename={handleRenameTrack}
                            onNavigate={handleNavigate}
                            onCreatePlaylist={handleCreatePlaylist}
                            onAddToPlaylist={handleAddToPlaylist}
                            onOpenSidebar={() => setIsSidebarOpen(true)}
                            activeCategory={activeCategory}
                            onSelectCategory={setActiveCategory}
                            searchQuery={searchQuery}
                        />
                    </PageWrapper>
                    )}
                    {currentScreen === 'video' && (
                    <PageWrapper pageKey="video" direction={slideDirection}>
                        <VideoScreen 
                            videos={allVideos}
                            onImport={handleImport}
                            onDelete={handleDeleteVideos}
                            onOpenSidebar={() => setIsSidebarOpen(true)}
                        />
                    </PageWrapper>
                    )}
                    {currentScreen === 'favorites' && (
                    <PageWrapper pageKey="favorites" direction={slideDirection}>
                        <FavoritesScreen 
                            tracks={allTracks}
                            favoriteIds={favoriteIds}
                            onPlayTrack={handlePlayTrack}
                            onOpenSidebar={() => setIsSidebarOpen(true)}
                        />
                    </PageWrapper>
                    )}
                    {currentScreen === 'settings' && (
                    <PageWrapper pageKey="settings" direction={slideDirection}>
                        <SettingsScreen onOpenSidebar={() => setIsSidebarOpen(true)} />
                    </PageWrapper>
                    )}
                </AnimatePresence>
            </div>

            {/* Mini Player */}
            <div className="relative z-20 pointer-events-none">
                <AnimatePresence>
                    {player.currentTrack && currentScreen !== 'video' && !isFullPlayerOpen && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="pointer-events-auto"
                    >
                        <MiniPlayer 
                            track={player.currentTrack} 
                            isPlaying={player.isPlaying}
                            onTogglePlay={() => { trigger(5); player.togglePlay(); }}
                            onNext={() => { trigger(5); player.handleNext(); }}
                            onExpand={() => { trigger(5); setIsFullPlayerOpen(true); }}
                            onClose={handleStopPlayback}
                        />
                    </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>

        {/* Full Screen Player */}
        <AnimatePresence>
          {isFullPlayerOpen && player.currentTrack && (
            <FullPlayer 
              track={player.currentTrack}
              isPlaying={player.isPlaying}
              currentTime={player.currentTime}
              duration={player.duration}
              onClose={() => setIsFullPlayerOpen(false)}
              onTogglePlay={() => { trigger(5); player.togglePlay(); }}
              onNext={() => { trigger(5); player.handleNext(); }}
              onPrev={() => { trigger(5); player.handlePrev(); }}
              onSeek={player.seek}
              loopMode={player.loopMode}
              isShuffle={player.isShuffle}
              toggleLoop={() => { trigger(5); player.toggleLoop(); }}
              toggleShuffle={() => { trigger(5); player.toggleShuffle(); }}
              audioRef={player.audioRef}
              analyserNodeRef={player.analyserNodeRef}
              isFavorite={favoriteIds.has(player.currentTrack.id)}
              onToggleFavorite={() => toggleFavorite(player.currentTrack!.id)}
              onDelete={(id) => handleDeleteTracks([id])}
              onRename={handleRenameTrack}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
