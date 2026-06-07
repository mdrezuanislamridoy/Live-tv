import React from 'react';
import { useTvStore } from '../../store/useTvStore';
import { ChannelGrid } from '../channel/ChannelGrid';

export const CategoriesTab: React.FC = () => {
  const { channels } = useTvStore();

  return (
    <div className="flex flex-col gap-2">
      <ChannelGrid channels={channels} />
    </div>
  );
};
