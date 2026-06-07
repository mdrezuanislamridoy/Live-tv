import React from 'react';
import { useTvStore } from '../../store/useTvStore';
import { ChannelCard } from '../channel/ChannelCard';
import { Heart } from 'lucide-react';

export const FavoritesTab: React.FC = () => {
  const { channels, favorites } = useTvStore();

  const favoriteChannels = channels.filter(c => favorites.includes(c.id));

  return (
    <div className="flex flex-col gap-6">
      {favoriteChannels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {favoriteChannels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      ) : (
        /* Empty Favorites State */
        <div className="w-full flex flex-col items-center justify-center py-24 px-6 rounded-3xl border border-dashed border-white/10 glass-panel">
          <div className="p-4 rounded-full bg-white/5 border border-white/5 text-gray-500 mb-4 animate-pulse">
            <Heart size={40} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Your favorites is empty</h3>
          <p className="text-sm text-gray-400 text-center max-w-sm">
            Navigate back to the channels grid, click on any channel card, and click the Heart icon to add it here.
          </p>
        </div>
      )}
    </div>
  );
};
