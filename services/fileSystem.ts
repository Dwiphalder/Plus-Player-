import { Track, Video } from '../types';
import { parseFileToTrack } from './audioUtils';

export const scanDirectory = async (): Promise<{ audio: Track[], video: Video[] }> => {
  // If API is missing, throw immediately to trigger fallback
  if (!('showDirectoryPicker' in window)) {
    throw new Error("API_NOT_SUPPORTED");
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker();
    const audioTracks: Track[] = [];
    const videoFiles: Video[] = [];
    const MAX_FILES = 2000; 

    async function scan(handle: any) {
      if (audioTracks.length + videoFiles.length >= MAX_FILES) return;

      for await (const entry of handle.values()) {
        if (audioTracks.length + videoFiles.length >= MAX_FILES) break;

        if (entry.kind === 'file') {
          const name = entry.name.toLowerCase();
          
          // Audio Check
          if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg') || name.endsWith('.m4a') || name.endsWith('.flac')) {
             try {
               const file = await entry.getFile();
               const track = await parseFileToTrack(file);
               if (track) audioTracks.push(track);
             } catch (e) {
               console.warn("Could not read audio file", entry.name);
             }
          }
          
          // Video Check
          if (name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.webm') || name.endsWith('.mov')) {
            try {
              const file = await entry.getFile();
              const url = URL.createObjectURL(file);
              
              // Basic Video Object
              videoFiles.push({
                id: `vid-${Date.now()}-${Math.random()}`,
                title: file.name.replace(/\.[^/.]+$/, ""),
                url: url,
                duration: 0, // Metadata loaded later on play
                size: file.size,
                dateAdded: file.lastModified
              });
            } catch (e) {
              console.warn("Could not read video file", entry.name);
            }
          }

        } else if (entry.kind === 'directory') {
          // Recursive scan
          await scan(entry);
        }
      }
    }
    
    await scan(dirHandle);
    return { audio: audioTracks, video: videoFiles };
  } catch (err: any) {
    // Re-throw specific errors that should trigger a fallback UI
    if (err.name === 'SecurityError' || err.name === 'ReferenceError' || err.message === 'API_NOT_SUPPORTED') {
       throw err;
    }
    // If user cancelled, just return empty
    if (err.name === 'AbortError') {
      return { audio: [], video: [] };
    }
    console.error("Error scanning directory:", err);
    throw err;
  }
};