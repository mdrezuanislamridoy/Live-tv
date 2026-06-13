import type { StateCreator } from 'zustand';
import type { TvState } from '../types';
import type { Channel } from '../../utils/m3uParser';

export interface PlaylistSlice {
  m3uUrl: string;
  epgUrl: string;
  channels: Channel[];      // football/FIFA only
  allChannels: Channel[];   // all 6800+
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

const BASE = 'https://raw.githubusercontent.com/SHAJON-404/iptv/main/app/data';
const CACHE_KEY = 'shajon_channels_v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const createPlaylistSlice: StateCreator<
  TvState,
  [],
  [],
  PlaylistSlice
> = (set, get) => {
  return {
    m3uUrl: BASE,
    epgUrl: '',
    channels: [],
    allChannels: [],
    categories: [],
    activeCategory: 'All',
    searchQuery: '',
    loading: false,
    error: null,

    setM3uUrl: (_url) => { get().loadPlaylist(true); },
    setEpgUrl: (_url) => {},

    loadPlaylist: async (forceReload = false) => {
      set({ loading: true, error: null } as Partial<TvState>);

      // Check cache
      if (!forceReload) {
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { ts, football, all } = JSON.parse(cached);
            if (Date.now() - ts < CACHE_TTL && football?.length > 0) {
              const categories = buildCategories(football);
              set({ channels: football, allChannels: all || [], categories, loading: false } as Partial<TvState>);
              if (!get().currentChannel) set({ currentChannel: football[0] } as Partial<TvState>);
              return;
            }
          }
        } catch { /* ignore bad cache */ }
      }

      try {
        const [fifaRes, allRes] = await Promise.all([
          fetch(`${BASE}/fifa.json`),
          fetch(`${BASE}/channels.json`),
        ]);

        if (!fifaRes.ok || !allRes.ok) throw new Error('Failed to fetch channel data');

        const [fifaRaw, allRaw]: any[][] = await Promise.all([
          fifaRes.json(),
          allRes.json(),
        ]);

        // Only keep live/200 channels
        const liveAll = allRaw.filter((c: any) => c.status === 'live' || c.status_code === 200);

        const toChannel = (c: any, group?: string): Channel => ({
          id: (c.id || `${c.name}-${c.url}`).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 60),
          name: c.name,
          logo: c.logo || '',
          url: c.url,
          category: group || c.group || 'Other',
        });

        // Football keywords for priority sorting
        const footballKeywords = ['fifa', 'football', 'tsport', 't sport', 'bein', 'espn', 'fox sport', 'eurosport', 'star sport', 'sony sport', 'sky sport', 'dazn', 'goal tv', 'bleav football', 'oman sport', 'ktv sport', 'nbc sport', 'ptv sport', 'tsn', 'dd sport', 'live sport'];

        const isFootball = (c: any) => {
          const n = (c.name + (c.group || '')).toLowerCase();
          return footballKeywords.some(k => n.includes(k));
        };

        // FIFA channels first (from fifa.json, filter out .mpd DASH streams)
        const fifaChannels = fifaRaw
          .filter((c: any) => c.url && !c.url.includes('.mpd'))
          .map((c: any) => toChannel(c, 'FIFA WC 2026'));

        // Football/sports channels from channels.json (status 200)
        const footballRelated = liveAll
          .filter((c: any) => isFootball(c) && !c.url.includes('.mpd'))
          .map((c: any) => toChannel(c));

        // Rest of live channels
        const otherChannels = liveAll
          .filter((c: any) => !isFootball(c) && !c.url.includes('.mpd'))
          .map((c: any) => toChannel(c));

        // Dedupe by url across all
        const seenUrls = new Set<string>();
        const footballChannels: Channel[] = [];
        const restChannels: Channel[] = [];

        for (const ch of [...fifaChannels, ...footballRelated]) {
          if (!seenUrls.has(ch.url)) { seenUrls.add(ch.url); footballChannels.push(ch); }
        }
        for (const ch of otherChannels) {
          if (!seenUrls.has(ch.url)) { seenUrls.add(ch.url); restChannels.push(ch); }
        }

        const categories = buildCategories(footballChannels);

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), football: footballChannels, all: restChannels }));
        } catch { /* storage full */ }

        set({ channels: footballChannels, allChannels: restChannels, categories, loading: false } as Partial<TvState>);
        if (!get().currentChannel && footballChannels.length > 0) {
          set({ currentChannel: footballChannels[0] } as Partial<TvState>);
        }

      } catch (err: any) {
        set({ error: err.message || 'Failed to load channels.', loading: false } as Partial<TvState>);
      }
    },

    setActiveCategory: (category) => set({ activeCategory: category, searchQuery: '' } as Partial<TvState>),
    setSearchQuery: (query) => set({ searchQuery: query } as Partial<TvState>),
  };
};

function buildCategories(channels: Channel[]): string[] {
  const priority = ['FIFA WC 2026', 'Sports', 'Live Sports', 'Bangla', 'Bangla News', 'Indian Bangla'];
  const all = Array.from(new Set(channels.map(c => c.category)));
  const rest = all.filter(c => !priority.includes(c)).sort();
  return ['All', ...priority.filter(p => all.includes(p)), ...rest];
}
