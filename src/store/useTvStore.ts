import { create } from 'zustand';
import type { TvState } from './types';
import { createPlaylistSlice } from './slices/playlistSlice';
import { createPlayerSlice } from './slices/playerSlice';
import { createFavoritesSlice } from './slices/favoritesSlice';
import { createSettingsSlice } from './slices/settingsSlice';

export const useTvStore = create<TvState>()((...a) => ({
  ...createPlaylistSlice(...a),
  ...createPlayerSlice(...a),
  ...createFavoritesSlice(...a),
  ...createSettingsSlice(...a),
}));
export type { TvState };
