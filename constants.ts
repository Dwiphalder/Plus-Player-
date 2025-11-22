import { Track, Playlist } from './types';

export const DEMO_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Tech House Vibes',
    artist: 'Mixkit',
    album: 'House Collection',
    coverUrl: 'https://picsum.photos/500/500?random=1',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    duration: 286,
    dateAdded: Date.now() - 10000000,
    playCount: 45,
  },
  {
    id: '2',
    title: 'Hip Hop 02',
    artist: 'Mixkit',
    album: 'Urban Beats',
    coverUrl: 'https://picsum.photos/500/500?random=2',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-738.mp3',
    duration: 133,
    dateAdded: Date.now() - 5000000,
    playCount: 12,
  },
  {
    id: '3',
    title: 'Driving Ambition',
    artist: 'Mixkit',
    album: 'Motivation',
    coverUrl: 'https://picsum.photos/500/500?random=3',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3',
    duration: 150,
    dateAdded: Date.now() - 200000,
    playCount: 89,
  },
  {
    id: '4',
    title: 'Raising Me Higher',
    artist: 'Mixkit',
    album: 'Uplifting',
    coverUrl: 'https://picsum.photos/500/500?random=4',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-raising-me-higher-34.mp3',
    duration: 195,
    dateAdded: Date.now() - 80000000,
    playCount: 5,
  },
  {
    id: '5',
    title: 'Life is a Dream',
    artist: 'Michael Ramir C.',
    album: 'Chill',
    coverUrl: 'https://picsum.photos/500/500?random=5',
    audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-life-is-a-dream-837.mp3',
    duration: 184,
    dateAdded: Date.now() - 1000,
    playCount: 23,
  }
];

export const CATEGORIES = [
  { id: 'all', name: 'Songs' },
  { id: 'albums', name: 'Albums' },
  { id: 'artists', name: 'Artists' },
  { id: 'playlists', name: 'Playlists' },
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  { id: 'fav', name: 'Favorites', trackIds: [], isAuto: true, coverUrl: 'https://picsum.photos/500/500?random=10' },
  { id: 'recent', name: 'Recently Played', trackIds: [], isAuto: true, coverUrl: 'https://picsum.photos/500/500?random=11' },
];