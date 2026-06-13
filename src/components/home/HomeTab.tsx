import React from 'react';
import { useTvStore } from '../../store/useTvStore';
import { ChannelRow } from '../channel/ChannelRow';
import { ChannelGrid } from '../channel/ChannelGrid';
import { Tv } from 'lucide-react';

export const HomeTab: React.FC = () => {
  const {
    channels,
    favorites,
    recentlyWatched,
    accentColor,
    loading,
    searchQuery,
    currentChannel
  } = useTvStore();

  const favoriteChannels = channels.filter(c => favorites.includes(c.id));
  const historyChannels = recentlyWatched
    .map(id => channels.find(c => c.id === id))
    .filter((c): c is typeof channels[0] => !!c);
  const trendingChannels = channels.slice(0, 12);

  // Accent color mapping helper
  const getAccentTextClass = () => {
    switch (accentColor) {
      case 'purple': return 'text-neon-purple';
      case 'pink': return 'text-neon-pink';
      case 'green': return 'text-neon-green';
      case 'blue':
      default: return 'text-neon-blue';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Select a Channel Placeholder */}
      {!currentChannel && channels.length > 0 && !loading && (
        <div className="w-full h-[250px] md:h-[350px] flex flex-col items-center justify-center bg-black/20 border border-white/5 rounded-3xl mb-4 glass-panel-light relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
          
          <div className="p-4 md:p-6 rounded-full bg-white/5 border border-white/10 mb-4 animate-[bounce_3s_ease-in-out_infinite] shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-md relative z-10">
            <Tv size={40} className="text-white/80" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight relative z-10">Select a channel to watch</h2>
          <p className="text-sm text-gray-400 text-center max-w-sm px-4 relative z-10">
            Click on any channel card below from the live TV guide to instantly start streaming!
          </p>
        </div>
      )}
      
      {/* Loader Spinner */}
      {loading && channels.length === 0 && (
        <div className="w-full py-24 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          <p className="text-gray-400 text-sm font-semibold tracking-wider">PARSING CHANNELS...</p>
        </div>
      )}

      {/* Channel Lists Rows */}
      {channels.length > 0 && (
        <div className="flex flex-col">
          {/* Hide non-search content when actively searching */}
          {!searchQuery && (
            <>
              {/* Recently Played Row */}
              {historyChannels.length > 0 && (
                <ChannelRow title="Recently Watched" channels={historyChannels} />
              )}

              {/* Favorites Row */}
              {favoriteChannels.length > 0 && (
                <ChannelRow title="Favorite Channels" channels={favoriteChannels} />
              )}

              {/* Trending Channels */}
              <ChannelRow title="Trending Broadcasters" channels={trendingChannels} />
            </>
          )}

          {/* All Football/FIFA Channels Grid */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-6 px-2">
              <Tv size={20} className={getAccentTextClass()} />
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white/90">
                ⚽ Football &amp; FIFA WC 2026
              </h3>
            </div>
            <ChannelGrid channels={channels} />
          </div>
        </div>
      )}
    </div>
  );
};
