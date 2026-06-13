import React, { useEffect } from 'react';
import { useTvStore } from './store/useTvStore';
import { useTvNavigation } from './hooks/useTvNavigation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { VideoPlayer } from './components/player/VideoPlayer';
import { Settings } from './components/settings/Settings';
import { HomeTab } from './components/home/HomeTab';
import { SearchTab } from './components/search/SearchTab';

import { CategoriesTab } from './components/categories/CategoriesTab';
import { AllChannelsTab } from './components/all-channels/AllChannelsTab';
import { FavoritesTab } from './components/favorites/FavoritesTab';

const App: React.FC = () => {
  const {
    activeTab,
    currentChannel,
    loadPlaylist,
    accentColor,
    error,
  } = useTvStore();

  // Initialize Spatial D-pad & Keyboard Navigation
  useTvNavigation();

  // Load M3U playlist on mount
  useEffect(() => {
    loadPlaylist();
  }, []);

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
      <main className="flex-1 flex flex-col md:ml-64 min-w-0 transition-all duration-300">
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
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'search' && <SearchTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'all-channels' && <AllChannelsTab />}
          {activeTab === 'favorites' && <FavoritesTab />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
};

export default App;
