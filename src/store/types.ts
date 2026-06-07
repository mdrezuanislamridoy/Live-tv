import type { Channel } from '../utils/m3uParser';

export interface TvState {
  // Playlist & Channels
  m3uUrl: string;
  epgUrl: string;
  channels: Channel[];
  categories: string[];
  favorites: string[];
  recentlyWatched: string[];
  activeCategory: string;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  
  // Player State
  currentChannel: Channel | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  autoPlayNext: boolean;
  
  // UI Configuration
  accentColor: 'blue' | 'purple' | 'pink' | 'green';
  tvMode: boolean; // D-pad/keyboard focused mode
  activeTab: 'home' | 'search' | 'categories' | 'favorites' | 'settings';
  
  // Actions
  setM3uUrl: (url: string) => void;
  setEpgUrl: (url: string) => void;
  loadPlaylist: (forceReload?: boolean) => Promise<void>;
  toggleFavorite: (channelId: string) => void;
  addToRecentlyWatched: (channelId: string) => void;
  clearHistory: () => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setAutoPlayNext: (val: boolean) => void;
  setAccentColor: (color: 'blue' | 'purple' | 'pink' | 'green') => void;
  setTvMode: (val: boolean) => void;
  setActiveTab: (tab: 'home' | 'search' | 'categories' | 'favorites' | 'settings') => void;
}
