import React, { useState, useEffect } from 'react';
import { Heart, Play } from 'lucide-react';
import type { Channel } from '../../utils/m3uParser';
import { generateMockEpg, getCurrentProgram } from '../../utils/epgParser';
import type { EpgProgram } from '../../utils/epgParser';
import { useTvStore } from '../../store/useTvStore';

interface ChannelCardProps {
  channel: Channel;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channel }) => {
  const { setCurrentChannel, favorites, toggleFavorite, accentColor } = useTvStore();
  const [currentShow, setCurrentShow] = useState<EpgProgram | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Generate deterministic schedule for channel
    const programs = generateMockEpg(channel.id, channel.category);
    const show = getCurrentProgram(programs);
    setCurrentShow(show);

    // Refresh every 3 minutes
    const interval = setInterval(() => {
      const updatedShow = getCurrentProgram(programs);
      setCurrentShow(updatedShow);
    }, 180000);

    return () => clearInterval(interval);
  }, [channel]);

  const isFavorite = favorites.includes(channel.id);

  // Fallback text avatar generator
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  };

  // Generate deterministic gradient background for fallback logo
  const getGradientClass = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'from-blue-600 to-indigo-800',
      'from-purple-600 to-pink-800',
      'from-emerald-600 to-teal-800',
      'from-rose-600 to-orange-850',
      'from-violet-700 to-purple-900',
      'from-cyan-600 to-blue-800'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

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

  const getAccentHoverText = () => {
    switch (accentColor) {
      case 'purple': return 'group-hover:text-neon-purple';
      case 'pink': return 'group-hover:text-neon-pink';
      case 'green': return 'group-hover:text-neon-green';
      case 'blue':
      default: return 'group-hover:text-neon-blue';
    }
  };

  return (
    <div
      onClick={() => setCurrentChannel(channel)}
      className="group relative flex flex-col glass-panel hover:glass-panel-light rounded-2xl p-4 border border-white/5 cursor-pointer focusable channel-card-focus w-full h-full transition-all duration-300"
      tabIndex={0}
      role="button"
      aria-label={`Watch ${channel.name}`}
    >
      {/* Top Banner (Category, Live indicator) */}
      <div className="flex justify-between items-center z-10">
        <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${getAccentBgClass()}`}>
          {channel.category}
        </span>
        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md text-[9px] font-extrabold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Center Details: Logo & Name */}
      <div className="flex-1 flex flex-col gap-3 my-4 overflow-hidden z-10 w-full">
        {/* Logo Container - Large separated box */}
        <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-black/30 border border-white/5 flex items-center justify-center shrink-0 p-3 mx-auto">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt=""
              onError={() => setImgError(true)}
              className="w-full h-full object-contain select-none filter drop-shadow-md"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center font-bold text-2xl text-white bg-gradient-to-br ${getGradientClass(channel.name)} rounded-lg`}>
              {getInitials(channel.name)}
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col gap-1 overflow-hidden text-center mt-1">
          <h3 className={`font-bold text-[15px] leading-tight text-gray-100 group-hover:text-white truncate transition-colors ${getAccentHoverText()}`}>
            {channel.name}
          </h3>
          {currentShow ? (
            <span className="text-[11px] font-medium text-gray-400 truncate" title={currentShow.title}>
              {currentShow.title}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-gray-500 italic">No Guide Available</span>
          )}
        </div>
      </div>

      {/* Bottom program preview & Quick Actions */}
      <div className="flex justify-between items-center border-t border-white/5 pt-2.5 z-10 mt-auto">
        <span className="text-[10px] text-gray-500 truncate max-w-[80%]">
          {currentShow 
            ? `${currentShow.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${currentShow.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
            : 'No EPG timeline'
          }
        </span>
        
        {/* Actions Overlay */}
        <div className="flex items-center gap-2">
          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Avoid playing channel when clicking favorite
              toggleFavorite(channel.id);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            tabIndex={-1} // Don't let spatial nav capture this inner button, click card instead
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-rose-500" : "text-gray-400"} />
          </button>
          
          {/* Play indicator */}
          <div className="p-1.5 rounded-lg bg-white/5 text-gray-400 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
            <Play size={14} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Animated Subtle glow backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/2 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
    </div>
  );
};
