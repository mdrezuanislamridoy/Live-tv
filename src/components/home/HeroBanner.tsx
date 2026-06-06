import React, { useState, useEffect } from 'react';
import { Play, Heart, Tv } from 'lucide-react';
import type { Channel } from '../../utils/m3uParser';
import { generateMockEpg, getCurrentProgram } from '../../utils/epgParser';
import type { EpgProgram } from '../../utils/epgParser';
import { useTvStore } from '../../store/useTvStore';

interface HeroBannerProps {
  channel: Channel | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ channel }) => {
  const { setCurrentChannel, favorites, toggleFavorite, accentColor } = useTvStore();
  const [currentShow, setCurrentShow] = useState<EpgProgram | null>(null);

  useEffect(() => {
    if (!channel) return;
    
    // Generate deterministic schedule for featured channel
    const programs = generateMockEpg(channel.id, channel.category);
    const show = getCurrentProgram(programs);
    setCurrentShow(show);
    
    // Refresh schedule checking every minute
    const interval = setInterval(() => {
      const updatedShow = getCurrentProgram(programs);
      setCurrentShow(updatedShow);
    }, 60000);

    return () => clearInterval(interval);
  }, [channel]);

  if (!channel) return null;

  const isFavorite = favorites.includes(channel.id);

  // Accent mapping helper
  const getAccentBgClass = () => {
    switch (accentColor) {
      case 'purple': return 'bg-neon-purple/20 text-neon-purple';
      case 'pink': return 'bg-neon-pink/20 text-neon-pink';
      case 'green': return 'bg-neon-green/20 text-neon-green';
      case 'blue':
      default: return 'bg-neon-blue/20 text-neon-blue';
    }
  };

  const getAccentButtonClass = () => {
    switch (accentColor) {
      case 'purple': return 'bg-neon-purple hover:bg-neon-purple/80 text-white';
      case 'pink': return 'bg-neon-pink hover:bg-neon-pink/80 text-white';
      case 'green': return 'bg-neon-green hover:bg-neon-green/80 text-black';
      case 'blue':
      default: return 'bg-neon-blue hover:bg-neon-blue/80 text-black';
    }
  };

  return (
    <div className="relative w-full h-[450px] md:h-[400px] rounded-3xl overflow-hidden glass-panel border border-white/5 mb-8 flex flex-col justify-end">
      {/* Background Gradient & Blurred Art */}
      <div className="absolute inset-0 z-0">
        {channel.logo ? (
          <img 
            src={channel.logo} 
            alt="" 
            className="w-full h-full object-cover opacity-20 scale-110 blur-xl select-none pointer-events-none"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-brand-bg via-brand-dark to-slate-900 opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-dark/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-dark/30 to-transparent" />
      </div>

      {/* Featured Badge */}
      <div className="absolute top-6 left-6 md:left-10 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
        </span>
        <span className="text-[10px] md:text-xs font-semibold tracking-wider text-rose-500 uppercase">FEATURED BROADCAST</span>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 p-6 md:p-10 max-w-2xl flex flex-col gap-4">
        {/* Category & Channel Title */}
        <div className="flex flex-col gap-1">
          <span className={`text-xs font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-md border border-white/5 w-fit ${getAccentBgClass()}`}>
            {channel.category}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mt-2 flex items-center gap-3">
            {channel.name}
          </h2>
        </div>

        {/* EPG Now Playing program */}
        {currentShow && (
          <div className="flex flex-col gap-1 border-l-2 border-white/20 pl-4 mt-2">
            <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">NOW PLAYING:</span>
            <span className="text-md font-bold text-white tracking-wide">{currentShow.title}</span>
            <p className="text-xs text-gray-400 max-w-xl leading-relaxed line-clamp-2 mt-1">
              {currentShow.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <button
            onClick={() => setCurrentChannel(channel)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg cursor-pointer focusable btn-focus ${getAccentButtonClass()}`}
            tabIndex={0}
          >
            <Play size={18} fill="currentColor" />
            <span>PLAY NOW</span>
          </button>
          
          <button
            onClick={() => toggleFavorite(channel.id)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer focusable btn-focus`}
            tabIndex={0}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-rose-500" : "text-gray-400"} />
            <span>{isFavorite ? 'FAVORITED' : 'ADD FAVORITE'}</span>
          </button>
        </div>
      </div>

      {/* Side floating graphic indicator */}
      <div className="absolute right-10 bottom-10 hidden lg:flex items-center justify-center p-8 rounded-full border border-white/5 bg-white/5 backdrop-blur-md opacity-25">
        <Tv size={80} className="text-white" />
      </div>
    </div>
  );
};
