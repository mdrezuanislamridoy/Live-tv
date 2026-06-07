import React, { useState, useEffect } from 'react';
import { Search, Wifi, WifiOff, Clock } from 'lucide-react';
import { useTvStore } from '../../store/useTvStore';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    activeCategory, 
    searchQuery, 
    setSearchQuery, 
    channels, 
    accentColor 
  } = useTvStore();

  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Clock tick
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Connection listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Header Title Resolver
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'categories': return 'Explore Categories';
      case 'favorites': return 'My Favorites';
      case 'settings': return 'App Settings';
      case 'search': return 'Search Channels';
      case 'home':
      default:
        return activeCategory === 'All' ? 'Home' : activeCategory;
    }
  };

  // Accent mapping helper
  const getAccentBgClass = () => {
    switch (accentColor) {
      case 'purple': return 'bg-neon-purple/20 border-neon-purple/30 text-neon-purple';
      case 'pink': return 'bg-neon-pink/20 border-neon-pink/30 text-neon-pink';
      case 'green': return 'bg-neon-green/20 border-neon-green/30 text-neon-green';
      case 'blue':
      default: return 'bg-neon-blue/20 border-neon-blue/30 text-neon-blue';
    }
  };

  const getAccentFocusClass = () => {
    switch (accentColor) {
      case 'purple': return 'focus-within:border-neon-purple focus-within:shadow-[0_0_15px_rgba(157,78,221,0.2)]';
      case 'pink': return 'focus-within:border-neon-pink focus-within:shadow-[0_0_15px_rgba(255,0,127,0.2)]';
      case 'green': return 'focus-within:border-neon-green focus-within:shadow-[0_0_15px_rgba(57,255,20,0.2)]';
      case 'blue':
      default: return 'focus-within:border-neon-blue focus-within:shadow-[0_0_15px_rgba(0,242,254,0.2)]';
    }
  };

  return (
    <header className="w-full px-4 md:px-10 py-3 md:py-0 min-h-[80px] flex flex-wrap items-center justify-between border-b border-white/5 bg-brand-bg/50 backdrop-blur-md sticky top-0 z-30 gap-y-3 gap-x-2">
      {/* Title & Stats */}
      <div className="flex items-center gap-2 md:gap-3.5 order-1">
        {/* Fixed Logo Branding */}
        {/* <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${getAccentBgClass()} shrink-0`}>
            <Tv size={18} />
          </div>
          <span className="font-bold text-base md:text-lg tracking-wider text-gradient-flow whitespace-nowrap">
            RR STREAM
          </span>
        </div> */}

        {/* Separator / slash */}
        <span className="text-white/10 text-lg">/</span>

        {/* Dynamic Title */}
        <h1 className="text-sm md:text-base font-semibold tracking-tight text-gray-300 whitespace-nowrap">
          {getHeaderTitle()}
        </h1>
        {activeTab === 'home' && (
          <span className={`hidden lg:inline-flex items-center text-xs px-2.5 py-1 rounded-full border ${getAccentBgClass()} font-medium`}>
            {channels.length} channels loaded
          </span>
        )}
      </div>

      {/* Right widgets (Clock, Wifi) */}
      <div className="flex items-center gap-3 md:gap-6 order-2 md:order-3">
        {/* Wifi indicator */}
        <div className="flex items-center" title={isOnline ? "Connected to internet" : "Offline mode"}>
          {isOnline ? (
            <Wifi size={18} className="text-emerald-500 animate-pulse" />
          ) : (
            <WifiOff size={18} className="text-rose-500 animate-pulse" />
          )}
        </div>

        {/* Dynamic Clock */}
        <div className="flex items-center gap-2 text-gray-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs md:text-sm">
          <Clock size={15} className="text-gray-400" />
          <span className="font-semibold">{formatTime(time)}</span>
          <span className="hidden sm:inline text-gray-500">|</span>
          <span className="hidden sm:inline text-gray-400">{formatDate(time)}</span>
        </div>
      </div>

      {/* Middle Search (Hidden on Mobile, available via Bottom Nav) */}
      {activeTab !== 'settings' && activeTab !== 'search' && (
        <div className={`hidden md:flex items-center md:flex-1 max-w-md order-3 md:order-2 md:mx-8 glass-panel-light rounded-xl px-4 py-2.5 border border-white/15 transition-all duration-300 ${getAccentFocusClass()}`}>
          <Search size={18} className="text-gray-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels, genres..."
            className="bg-transparent border-none text-white text-sm outline-none w-full focusable"
            tabIndex={0}
          />
        </div>
      )}
    </header>
  );
};
