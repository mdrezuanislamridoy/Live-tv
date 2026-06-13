import type { StateCreator } from 'zustand';
import type { TvState } from '../types';

export interface SettingsSlice {
  accentColor: 'blue' | 'purple' | 'pink' | 'green';
  tvMode: boolean;
  activeTab: 'home' | 'search' | 'categories' | 'favorites' | 'settings' | 'all-channels';
  setAccentColor: (color: 'blue' | 'purple' | 'pink' | 'green') => void;
  setTvMode: (val: boolean) => void;
  setActiveTab: (tab: 'home' | 'search' | 'categories' | 'favorites' | 'settings' | 'all-channels') => void;
}

export const createSettingsSlice: StateCreator<
  TvState,
  [],
  [],
  SettingsSlice
> = (set) => {
  const savedAccent = typeof window !== 'undefined' ? (localStorage.getItem('tv_accent') as any) || 'blue' : 'blue';
  const savedTvMode = typeof window !== 'undefined' ? localStorage.getItem('tv_mode') === 'true' : false;

  return {
    accentColor: savedAccent,
    tvMode: savedTvMode,
    activeTab: 'home',

    setAccentColor: (color) => {
      localStorage.setItem('tv_accent', color);
      set({ accentColor: color } as Partial<TvState>);
    },

    setTvMode: (val) => {
      localStorage.setItem('tv_mode', val.toString());
      set({ tvMode: val } as Partial<TvState>);
    },

    setActiveTab: (tab) => set({ activeTab: tab } as Partial<TvState>)
  };
};
