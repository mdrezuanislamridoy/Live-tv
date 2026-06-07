import type { StateCreator } from 'zustand';
import type { TvState } from '../types';
import { parseM3U } from '../../utils/m3uParser';
import { STATIC_FALLBACK_M3U, DEFAULT_M3U_URL, DEFAULT_EPG_URL } from '../../config';
import type { Channel } from '../../utils/m3uParser';

export interface PlaylistSlice {
  m3uUrl: string;
  epgUrl: string;
  channels: Channel[];
  categories: string[];
  activeCategory: string;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  setM3uUrl: (url: string) => void;
  setEpgUrl: (url: string) => void;
  loadPlaylist: (forceReload?: boolean) => Promise<void>;
  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const createPlaylistSlice: StateCreator<
  TvState,
  [],
  [],
  PlaylistSlice
> = (set, get) => {
  // Load initial settings from localStorage
  let savedM3u = typeof window !== 'undefined' ? localStorage.getItem('tv_m3u_url') || DEFAULT_M3U_URL : DEFAULT_M3U_URL;
  
  // Force migration for users who had the old fallback default or specific presets
  if (savedM3u === 'local-sample' || savedM3u.includes('documentary.m3u')) {
    savedM3u = 'iptv-org-api';
    if (typeof window !== 'undefined') {
      localStorage.setItem('tv_m3u_url', savedM3u);
    }
  }
  
  const savedEpg = typeof window !== 'undefined' ? localStorage.getItem('tv_epg_url') || DEFAULT_EPG_URL : DEFAULT_EPG_URL;

  return {
    m3uUrl: savedM3u,
    epgUrl: savedEpg,
    channels: [],
    categories: [],
    activeCategory: 'All',
    searchQuery: '',
    loading: false,
    error: null,

    setM3uUrl: (url) => {
      localStorage.setItem('tv_m3u_url', url);
      set({ m3uUrl: url } as Partial<TvState>);
      get().loadPlaylist(true);
    },

    setEpgUrl: (url) => {
      localStorage.setItem('tv_epg_url', url);
      set({ epgUrl: url } as Partial<TvState>);
    },

    loadPlaylist: async (forceReload = false) => {
      const { m3uUrl } = get();
      set({ loading: true, error: null } as Partial<TvState>);

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
            } as Partial<TvState>);
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
          // Custom sort to force T Sports to the top
          parsedChannels.sort((a, b) => {
            const aIsTSports = a.name.toLowerCase().includes('t sports') || a.name.toLowerCase().includes('tsports');
            const bIsTSports = b.name.toLowerCase().includes('t sports') || b.name.toLowerCase().includes('tsports');
            if (aIsTSports && !bIsTSports) return -1;
            if (!aIsTSports && bIsTSports) return 1;
            return 0;
          });

          if (parsedChannels.length === 0) throw new Error('No channels parsed from API');
          
          localStorage.setItem(`cached_m3u_v4_${m3uUrl}`, JSON.stringify(parsedChannels));
          
          const categories = ['All', ...Array.from(new Set(parsedChannels.map(c => c.category)))];
          set({ channels: parsedChannels, categories, loading: false } as Partial<TvState>);
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
        } as Partial<TvState>);

      } catch (err: any) {
        console.error(err);
        set({ 
          error: err.message || 'Failed to fetch M3U playlist.', 
          loading: false 
        } as Partial<TvState>);

        // Fallback to static sample if it errored on custom URL
        if (m3uUrl !== 'local-sample') {
          console.log('Loading local sample as safety fallback...');
          const parsed = parseM3U(STATIC_FALLBACK_M3U);
          const categories = ['All', ...Array.from(new Set(parsed.map(c => c.category)))];
          set({ 
            channels: parsed, 
            categories,
            error: `Failed to load URL. Loaded offline demo instead. (${err.message})`
          } as Partial<TvState>);
          if (parsed.length > 0 && !get().currentChannel) {
            set({ currentChannel: parsed[0] } as Partial<TvState>);
          }
        }
      }
    },

    setActiveCategory: (category) => set({ activeCategory: category, searchQuery: '' } as Partial<TvState>),
    
    setSearchQuery: (query) => set({ searchQuery: query } as Partial<TvState>)
  };
};
