import { create } from 'zustand';
import { parseM3U } from '../utils/m3uParser';
import type { Channel } from '../utils/m3uParser';
import { STATIC_FALLBACK_M3U, DEFAULT_M3U_URL, DEFAULT_EPG_URL } from '../config';

interface TvState {
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
  activeTab: 'home' | 'categories' | 'favorites' | 'settings';
  
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
  setActiveTab: (tab: 'home' | 'categories' | 'favorites' | 'settings') => void;
}

export const useTvStore = create<TvState>((set, get) => {
  // Load initial settings from localStorage
  let savedM3u = localStorage.getItem('tv_m3u_url') || DEFAULT_M3U_URL;
  
  // Force migration for users who had the old fallback default or specific presets
  if (savedM3u === 'local-sample' || savedM3u.includes('documentary.m3u')) {
    savedM3u = 'iptv-org-api';
    localStorage.setItem('tv_m3u_url', savedM3u);
  }
  
  const savedEpg = localStorage.getItem('tv_epg_url') || DEFAULT_EPG_URL;
  const savedFavorites = JSON.parse(localStorage.getItem('tv_favorites') || '[]');
  const savedHistory = JSON.parse(localStorage.getItem('tv_history') || '[]');
  const savedVolume = parseFloat(localStorage.getItem('tv_volume') || '0.7');
  const savedMuted = localStorage.getItem('tv_muted') === 'true';
  const savedAutoPlay = localStorage.getItem('tv_autoplay') !== 'false'; // default true
  const savedAccent = (localStorage.getItem('tv_accent') as any) || 'blue';
  const savedTvMode = localStorage.getItem('tv_mode') === 'true';

  return {
    m3uUrl: savedM3u,
    epgUrl: savedEpg,
    channels: [],
    categories: [],
    favorites: savedFavorites,
    recentlyWatched: savedHistory,
    activeCategory: 'All',
    searchQuery: '',
    loading: false,
    error: null,
    
    currentChannel: null,
    isPlaying: false,
    volume: savedVolume,
    isMuted: savedMuted,
    autoPlayNext: savedAutoPlay,
    
    accentColor: savedAccent,
    tvMode: savedTvMode,
    activeTab: 'home',

    setM3uUrl: (url) => {
      localStorage.setItem('tv_m3u_url', url);
      set({ m3uUrl: url });
      get().loadPlaylist(true);
    },

    setEpgUrl: (url) => {
      localStorage.setItem('tv_epg_url', url);
      set({ epgUrl: url });
    },

    loadPlaylist: async (forceReload = false) => {
      const { m3uUrl } = get();
      set({ loading: true, error: null });

      // 1. Try to load from Local Cache if not forcing reload
      if (!forceReload) {
        const cachedContent = localStorage.getItem(`cached_m3u_v2_${m3uUrl}`);
        if (cachedContent) {
          let parsed: Channel[] = [];
          if (m3uUrl === 'iptv-org-api') {
            try {
              parsed = JSON.parse(cachedContent);
            } catch (e) {
              parsed = [];
            }
          } else {
            parsed = parseM3U(cachedContent);
          }
          
          if (parsed.length > 0) {
            const categories = ['All', ...Array.from(new Set(parsed.map(c => c.category)))];
            set({ 
              channels: parsed, 
              categories, 
              loading: false 
            });
            // Auto play first channel if none is playing
            if (parsed.length > 0 && !get().currentChannel) {
              set({ currentChannel: parsed[0] });
            }
            return;
          }
        }
      }

      // 2. Fetch playlist
      try {
        if (m3uUrl === 'iptv-org-api') {
          // Fetch from real JSON REST API
          const [channelsRes, streamsRes, logosRes] = await Promise.all([
            fetch('https://iptv-org.github.io/api/channels.json'),
            fetch('https://iptv-org.github.io/api/streams.json'),
            fetch('https://iptv-org.github.io/api/logos.json')
          ]);
          
          if (!channelsRes.ok || !streamsRes.ok || !logosRes.ok) throw new Error('Failed to fetch from real API');
          
          const rawChannels: any[] = await channelsRes.json();
          const rawStreams: any[] = await streamsRes.json();
          const rawLogos: any[] = await logosRes.json();
          
          const channelMap = new Map();
          rawChannels.forEach(c => channelMap.set(c.id, c));
          
          const logoMap = new Map();
          rawLogos.forEach(l => logoMap.set(l.channel, l.url));
          
          const parsedChannels: Channel[] = [];
          const addedChannelIds = new Set<string>();
          
          // Map streams to channels
          rawStreams.forEach((stream) => {
             if (!stream.channel) return;
             
             const cInfo = channelMap.get(stream.channel);
             if (cInfo && !cInfo.is_nsfw) {
               const isBd = cInfo.country === 'BD' || cInfo.country === 'bd';
               const isSports = cInfo.categories && cInfo.categories.includes('sports');

               if (isBd || isSports) {
                 // Only add if not already added
                 if (!addedChannelIds.has(cInfo.id)) {
                   addedChannelIds.add(cInfo.id);
                   parsedChannels.push({
                     id: cInfo.id,
                     name: cInfo.name || 'Unknown Channel',
                     logo: logoMap.get(cInfo.id) || '',
                     url: stream.url,
                     category: cInfo.categories && cInfo.categories.length > 0 ? cInfo.categories[0].toUpperCase() : 'GENERAL'
                   });
                 }
               }
             }
          });
          
          if (parsedChannels.length === 0) throw new Error('No channels parsed from API');
          
          localStorage.setItem(`cached_m3u_v3_${m3uUrl}`, JSON.stringify(parsedChannels));
          
          const categories = ['All', ...Array.from(new Set(parsedChannels.map(c => c.category)))];
          set({ channels: parsedChannels, categories, loading: false });
          if (parsedChannels.length > 0 && !get().currentChannel) set({ currentChannel: parsedChannels[0] });
          return;
        }

        let m3uContent = '';

        if (m3uUrl === 'local-sample') {
          m3uContent = STATIC_FALLBACK_M3U;
        } else {
          try {
            // Direct fetch attempt
            const response = await fetch(m3uUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            m3uContent = await response.text();
          } catch (fetchErr) {
            console.warn('Direct fetch failed. Retrying through CORS proxy...', fetchErr);
            // CORS Proxy Fallback
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(m3uUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Failed to fetch via CORS proxy. Playlist server might be down.`);
            m3uContent = await response.text();
          }
        }

        if (!m3uContent || !m3uContent.includes('#EXTM3U')) {
          throw new Error('Invalid playlist format. Must be a valid M3U file.');
        }

        // Cache the raw content
        localStorage.setItem(`cached_m3u_v2_${m3uUrl}`, m3uContent);

        const parsedChannels = parseM3U(m3uContent);
        if (parsedChannels.length === 0) {
          throw new Error('No valid channels found in the M3U playlist.');
        }

        const categories = ['All', ...Array.from(new Set(parsedChannels.map(c => c.category)))];
        
        set({ 
          channels: parsedChannels, 
          categories, 
          loading: false 
        });

        // Set default playing channel
        if (parsedChannels.length > 0 && !get().currentChannel) {
          set({ currentChannel: parsedChannels[0] });
        }
      } catch (err: any) {
        console.error(err);
        set({ 
          error: err.message || 'Failed to fetch M3U playlist.', 
          loading: false 
        });

        // Fallback to static sample if it errored on custom URL
        if (m3uUrl !== 'local-sample') {
          console.log('Loading local sample as safety fallback...');
          const parsed = parseM3U(STATIC_FALLBACK_M3U);
          const categories = ['All', ...Array.from(new Set(parsed.map(c => c.category)))];
          set({ 
            channels: parsed, 
            categories,
            error: `Failed to load URL. Loaded offline demo instead. (${err.message})`
          });
          if (parsed.length > 0 && !get().currentChannel) {
            set({ currentChannel: parsed[0] });
          }
        }
      }
    },

    toggleFavorite: (channelId) => {
      set((state) => {
        const isFav = state.favorites.includes(channelId);
        const newFavs = isFav 
          ? state.favorites.filter(id => id !== channelId)
          : [...state.favorites, channelId];
        
        localStorage.setItem('tv_favorites', JSON.stringify(newFavs));
        return { favorites: newFavs };
      });
    },

    addToRecentlyWatched: (channelId) => {
      set((state) => {
        const filtered = state.recentlyWatched.filter(id => id !== channelId);
        const newHistory = [channelId, ...filtered].slice(0, 20); // Keep last 20 items
        
        localStorage.setItem('tv_history', JSON.stringify(newHistory));
        return { recentlyWatched: newHistory };
      });
    },

    clearHistory: () => {
      localStorage.removeItem('tv_history');
      set({ recentlyWatched: [] });
    },

    setCurrentChannel: (channel) => {
      set({ currentChannel: channel, isPlaying: !!channel });
      if (channel) {
        get().addToRecentlyWatched(channel.id);
      }
    },

    setIsPlaying: (playing) => set({ isPlaying: playing }),
    
    setVolume: (vol) => {
      localStorage.setItem('tv_volume', vol.toString());
      set({ volume: vol });
    },
    
    setIsMuted: (muted) => {
      localStorage.setItem('tv_muted', muted.toString());
      set({ isMuted: muted });
    },

    setActiveCategory: (category) => set({ activeCategory: category, searchQuery: '' }),
    
    setSearchQuery: (query) => set({ searchQuery: query }),

    setAutoPlayNext: (val) => {
      localStorage.setItem('tv_autoplay', val.toString());
      set({ autoPlayNext: val });
    },

    setAccentColor: (color) => {
      localStorage.setItem('tv_accent', color);
      set({ accentColor: color });
    },

    setTvMode: (val) => {
      localStorage.setItem('tv_mode', val.toString());
      set({ tvMode: val });
    },

    setActiveTab: (tab) => set({ activeTab: tab })
  };
});
