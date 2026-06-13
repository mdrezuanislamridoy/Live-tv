import React, { useState, useMemo } from 'react';
import { useTvStore } from '../../store/useTvStore';
import { ChannelGrid } from '../channel/ChannelGrid';
import { Tv, Search } from 'lucide-react';

export const AllChannelsTab: React.FC = () => {
  const { allChannels, accentColor, loading } = useTvStore();
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');

  const groups = useMemo(() => {
    const g = Array.from(new Set(allChannels.map(c => c.category))).sort();
    return ['All', ...g];
  }, [allChannels]);

  const filtered = useMemo(() => allChannels.filter(c => {
    const matchGroup = activeGroup === 'All' || c.category === activeGroup;
    const matchQuery = !query || c.name.toLowerCase().includes(query.toLowerCase());
    return matchGroup && matchQuery;
  }), [allChannels, query, activeGroup]);

  const accentText = { blue: 'text-neon-blue', purple: 'text-neon-purple', pink: 'text-neon-pink', green: 'text-neon-green' }[accentColor] ?? 'text-neon-blue';
  const accentActive = { blue: 'border-neon-blue text-neon-blue bg-neon-blue/10', purple: 'border-neon-purple text-neon-purple bg-neon-purple/10', pink: 'border-neon-pink text-neon-pink bg-neon-pink/10', green: 'border-neon-green text-neon-green bg-neon-green/10' }[accentColor] ?? 'border-neon-blue text-neon-blue bg-neon-blue/10';

  if (loading && allChannels.length === 0) return (
    <div className="w-full py-24 flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
      <p className="text-gray-400 text-sm font-semibold tracking-wider">LOADING ALL CHANNELS...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 px-1">
        <Tv size={22} className={accentText} />
        <h2 className="text-xl font-bold text-white">All Channels</h2>
        <span className="text-xs text-gray-500 font-semibold ml-auto">{filtered.length.toLocaleString()} channels</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search channels..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {groups.map(g => (
          <button key={g} onClick={() => setActiveGroup(g)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activeGroup === g ? accentActive : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {g}
          </button>
        ))}
      </div>

      {filtered.length > 0
        ? <ChannelGrid channels={filtered} />
        : <p className="text-gray-500 text-sm text-center py-16">No channels found.</p>
      }
    </div>
  );
};
