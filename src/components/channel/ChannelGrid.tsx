import React from 'react';
import type { Channel } from '../../utils/m3uParser';
import { ChannelCard } from './ChannelCard';
import { useTvStore } from '../../store/useTvStore';
import { Sparkles } from 'lucide-react';

interface ChannelGridProps {
  channels: Channel[];
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({ channels }) => {
  const { 
    categories, 
    activeCategory, 
    setActiveCategory, 
    searchQuery, 
    loading, 
    accentColor 
  } = useTvStore();

  const [displayLimit, setDisplayLimit] = React.useState(100);

  // Reset display limit when category or search changes
  React.useEffect(() => {
    setDisplayLimit(100);
  }, [activeCategory, searchQuery]);

  // Filter channels based on Category and Search Query
  const filteredChannels = channels.filter(c => {
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || c.name.toLowerCase().includes(query) || c.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const visibleChannels = filteredChannels.slice(0, displayLimit);

  // Accent mapping helpers
  const getAccentBgClass = (isActive: boolean) => {
    if (!isActive) return 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10';
    switch (accentColor) {
      case 'purple': return 'bg-neon-purple/20 border-neon-purple text-neon-purple font-semibold';
      case 'pink': return 'bg-neon-pink/20 border-neon-pink text-neon-pink font-semibold';
      case 'green': return 'bg-neon-green/20 border-neon-green text-neon-green font-semibold';
      case 'blue':
      default: return 'bg-neon-blue/20 border-neon-blue text-neon-blue font-semibold';
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        {/* Category Tabs Skeleton */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-white/5 border border-white/5 rounded-xl animate-pulse shrink-0" />
          ))}
        </div>

        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="aspect-video bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-12 bg-white/5 rounded" />
                <div className="h-4 w-8 bg-white/5 rounded" />
              </div>
              <div className="flex gap-3 my-3">
                <div className="h-12 w-12 bg-white/5 rounded-xl shrink-0" />
                <div className="flex-1 flex flex-col gap-2 justify-center">
                  <div className="h-4 w-3/4 bg-white/5 rounded" />
                  <div className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-3 w-1/3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Dynamic Category Tabs */}
      <div 
        className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 px-1 -mx-1 scroll-smooth"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl border text-xs md:text-sm transition-all duration-200 whitespace-nowrap focusable sidebar-focus ${getAccentBgClass(isActive)}`}
              tabIndex={0}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Channel Cards Grid */}
      {filteredChannels.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {visibleChannels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
          
          {/* Load More Button */}
          {filteredChannels.length > visibleChannels.length && (
            <div className="w-full flex justify-center py-6">
              <button
                onClick={() => setDisplayLimit(prev => prev + 100)}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white transition-colors"
              >
                Load More Channels ({filteredChannels.length - visibleChannels.length} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="w-full flex flex-col items-center justify-center py-20 px-6 rounded-3xl border border-dashed border-white/10 glass-panel">
          <div className="p-4 rounded-full bg-white/5 border border-white/5 text-gray-500 mb-4 animate-bounce">
            <Sparkles size={40} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No channels found</h3>
          <p className="text-sm text-gray-400 text-center max-w-sm">
            {searchQuery 
              ? `We couldn't find any channels matching "${searchQuery}". Try editing your search query.`
              : `This category does not contain any channels.`
            }
          </p>
        </div>
      )}
    </div>
  );
};
