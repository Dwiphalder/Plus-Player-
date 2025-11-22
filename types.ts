export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number; // in seconds
  isLocal?: boolean;
  dateAdded?: number;
  playCount?: number;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  size?: number;
  dateAdded: number;
  resolution?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  coverUrl?: string;
  isAuto?: boolean;
}

export type ScreenName = 'home' | 'video' | 'player' | 'settings' | 'favorites';

export enum LoopMode {
  None,
  All,
  One
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  history: Track[];
  loopMode: LoopMode;
  isShuffle: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isFullPlayerOpen: boolean;
}