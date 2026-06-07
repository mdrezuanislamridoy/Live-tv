import React from 'react';
import { useTvStore } from '../../store/useTvStore';
import { ChannelGrid } from '../channel/ChannelGrid';
import { Search } from 'lucide-react';

export const SearchTab: React.FC = () => {
  const { searchQuery, setSearchQuery, channels } = useTvStore();

  return (
    <div className="flex flex-col gap-6 w-full mt-2">
      <div className="flex items-center w-full glass-panel-light rounded-2xl px-5 py-4 border border-white/15 focus-within:border-white/40 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300">
        <Search size={24} className="text-gray-400 mr-4 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search live channels, sports, or categories..."
          className="bg-transparent border-none text-white text-lg outline-none w-full placeholder:text-gray-500 focusable"
          autoFocus
        />
      </div>
      <ChannelGrid channels={channels} />
    </div>
  );
};
