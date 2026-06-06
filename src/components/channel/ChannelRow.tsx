import React from 'react';
import type { Channel } from '../../utils/m3uParser';
import { ChannelCard } from './ChannelCard';

interface ChannelRowProps {
  title: string;
  channels: Channel[];
}

export const ChannelRow: React.FC<ChannelRowProps> = ({ title, channels }) => {
  if (channels.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Title */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg md:text-xl font-bold tracking-tight text-white/90">
          {title}
        </h3>
        <span className="text-xs text-gray-500 font-semibold">
          {channels.length} {channels.length === 1 ? 'channel' : 'channels'}
        </span>
      </div>

      {/* Horizontal Scroller */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 px-2 scroll-smooth -mx-2">
        {channels.map((channel) => (
          <div 
            key={channel.id} 
            className="w-[260px] md:w-[300px] shrink-0"
          >
            <ChannelCard channel={channel} />
          </div>
        ))}
      </div>
    </div>
  );
};
