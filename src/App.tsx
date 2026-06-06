import React, { useEffect } from 'react';
import { useTvStore } from './store/useTvStore';
import { useTvNavigation } from './hooks/useTvNavigation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HeroBanner } from './components/home/HeroBanner';
import { VideoPlayer } from './components/player/VideoPlayer';
import { ChannelRow } from './components/channel/ChannelRow';
import { ChannelCard } from './components/channel/ChannelCard';
import { ChannelGrid } from './components/channel/ChannelGrid';
import { Settings } from './components/settings/Settings';
import { Tv, Heart } from 'lucide-react';

const App: React.FC = () => {
  const {
    activeTab,
    channels,
    currentChannel,
    favorites,
    recentlyWatched,
    loadPlaylist,
    accentColor,
    error,
    loading,
    searchQuery
  } = useTvStore();

  // Initialize Spatial D-pad & Keyboard Navigation
  useTvNavigation();

  // Load M3U playlist on mount
  useEffect(() => {
    loadPlaylist();
  }, []);

  // Filter channels to render favorites list
  const favoriteChannels = channels.filter(c => favorites.includes(c.id));

  // Filter channels to render recently watched list
  const historyChannels = recentlyWatched
    .map(id => channels.find(c => c.id === id))
    .filter((c): c is typeof channels[0] => !!c);

  // Featured Channel for Hero Banner
  const featuredChannel = channels.length > 0 ? channels[0] : null;

  // Filter channels for Trending list (just select a few from index)
  const trendingChannels = channels.slice(1, 10);

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
    <div className="min-h-screen bg-brand-bg text-gray-100 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-20 min-w-0 transition-all duration-300">
        {/* Header Widget */}
        <Header />

        {/* Dynamic Display Area */}
        <div className="flex-1 p-6 md:p-10 flex flex-col gap-8 overflow-y-auto custom-scrollbar max-w-7xl mx-auto w-full">
          {/* Error Message banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs md:text-sm font-semibold flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Persistent Player Panel (Only shown if a channel is selected and active) */}
          {currentChannel && (
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Now Streaming
                </span>
                <span className={`text-xs font-bold ${getAccentTextClass()} tracking-wider`}>
                  {currentChannel.name}
                </span>
              </div>
              <VideoPlayer />
            </div>
          )}

          {/* Main Tab Views Switcher */}
          {activeTab === 'home' && (
            <div className="flex flex-col gap-2">
              {/* Show Hero Banner only if player is not loaded (saves height) */}
              {!currentChannel && featuredChannel && (
                <HeroBanner channel={featuredChannel} />
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

                  {/* All Channels Grid Section */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-6 px-2">
                      <Tv size={20} className={getAccentTextClass()} />
                      <h3 className="text-lg md:text-xl font-bold tracking-tight text-white/90">
                        All Channels Guide
                      </h3>
                    </div>
                    <ChannelGrid channels={channels} />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="flex flex-col gap-2">
              <ChannelGrid channels={channels} />
            </div>
          )}

          {activeTab === 'favorites' && (
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
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
