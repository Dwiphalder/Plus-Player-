export const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const parseFileToTrack = (file: File): Promise<any> => {
  return new Promise((resolve) => {
    // Basic parser
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    // Safety timeout in case metadata never loads
    const timeout = setTimeout(() => {
        resolve(null);
    }, 2000);

    audio.onloadedmetadata = () => {
      clearTimeout(timeout);
      let duration = audio.duration;
      if (!isFinite(duration)) duration = 0;

      resolve({
        id: `local-${Date.now()}-${Math.random()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Unknown Artist',
        album: 'Local Files',
        coverUrl: 'https://picsum.photos/500/500?grayscale', // Generic placeholder
        audioUrl: url,
        duration: duration,
        isLocal: true,
        dateAdded: file.lastModified,
        playCount: 0,
      });
    };
    
    // Handle errors if audio file is corrupt
    audio.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
    };
  });
};