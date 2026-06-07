import type { StateCreator } from 'zustand';
import type { TvState } from '../types';

export interface FavoritesSlice {
  favorites: string[];
  recentlyWatched: string[];
  toggleFavorite: (channelId: string) => void;
  addToRecentlyWatched: (channelId: string) => void;
  clearHistory: () => void;
}

export const createFavoritesSlice: StateCreator<
  TvState,
  [],
  [],
  FavoritesSlice
> = (set) => {
  const savedFavorites = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tv_favorites') || '[]') : [];
  const savedHistory = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tv_history') || '[]') : [];

  return {
    favorites: savedFavorites,
    recentlyWatched: savedHistory,

    toggleFavorite: (channelId) => {
      set((state) => {
        const isFav = state.favorites.includes(channelId);
        const newFavs = isFav 
          ? state.favorites.filter(id => id !== channelId)
          : [...state.favorites, channelId];
        
        localStorage.setItem('tv_favorites', JSON.stringify(newFavs));
        return { favorites: newFavs } as Partial<TvState>;
      });
    },

    addToRecentlyWatched: (channelId) => {
      set((state) => {
        const filtered = state.recentlyWatched.filter(id => id !== channelId);
        const newHistory = [channelId, ...filtered].slice(0, 20); // Keep last 20 items
        
        localStorage.setItem('tv_history', JSON.stringify(newHistory));
        return { recentlyWatched: newHistory } as Partial<TvState>;
      });
    },

    clearHistory: () => {
      localStorage.removeItem('tv_history');
      set({ recentlyWatched: [] } as Partial<TvState>);
    }
  };
};
