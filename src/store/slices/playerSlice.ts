import type { StateCreator } from 'zustand';
import type { TvState } from '../types';
import type { Channel } from '../../utils/m3uParser';

export interface PlayerSlice {
  currentChannel: Channel | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  autoPlayNext: boolean;
  setCurrentChannel: (channel: Channel | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setAutoPlayNext: (val: boolean) => void;
}

export const createPlayerSlice: StateCreator<
  TvState,
  [],
  [],
  PlayerSlice
> = (set, get) => {
  const savedVolume = typeof window !== 'undefined' ? parseFloat(localStorage.getItem('tv_volume') || '0.7') : 0.7;
  const savedMuted = typeof window !== 'undefined' ? localStorage.getItem('tv_muted') === 'true' : false;
  const savedAutoPlay = typeof window !== 'undefined' ? localStorage.getItem('tv_autoplay') !== 'false' : true;

  return {
    currentChannel: null,
    isPlaying: false,
    volume: savedVolume,
    isMuted: savedMuted,
    autoPlayNext: savedAutoPlay,

    setCurrentChannel: (channel) => {
      set({ currentChannel: channel, isPlaying: !!channel } as Partial<TvState>);
      if (channel) {
        get().addToRecentlyWatched(channel.id);
      }
    },

    setIsPlaying: (playing) => set({ isPlaying: playing } as Partial<TvState>),
    
    setVolume: (vol) => {
      localStorage.setItem('tv_volume', vol.toString());
      set({ volume: vol } as Partial<TvState>);
    },
    
    setIsMuted: (muted) => {
      localStorage.setItem('tv_muted', muted.toString());
      set({ isMuted: muted } as Partial<TvState>);
    },

    setAutoPlayNext: (val) => {
      localStorage.setItem('tv_autoplay', val.toString());
      set({ autoPlayNext: val } as Partial<TvState>);
    }
  };
};
