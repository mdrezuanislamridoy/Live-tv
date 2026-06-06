import React, { useState } from 'react';
import { Home, FolderHeart, Heart, Settings, Tv, Menu, Search } from 'lucide-react';
import { useTvStore } from '../../store/useTvStore';

interface SidebarProps {
  // Can add props here if needed
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { activeTab, setActiveTab, accentColor, tvMode } = useTvStore();
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'search' as const, label: 'Search', icon: Search },
    { id: 'categories' as const, label: 'Categories', icon: FolderHeart },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  // Accent mapping helper
  const getAccentClass = () => {
    switch (accentColor) {
      case 'purple': return 'text-neon-purple border-neon-purple';
      case 'pink': return 'text-neon-pink border-neon-pink';
      case 'green': return 'text-neon-green border-neon-green';
      case 'blue':
      default: return 'text-neon-blue border-neon-blue';
    }
  };

  const getAccentBgClass = () => {
    switch (accentColor) {
      case 'purple': return 'bg-neon-purple/10 text-neon-purple';
      case 'pink': return 'bg-neon-pink/10 text-neon-pink';
      case 'green': return 'bg-neon-green/10 text-neon-green';
      case 'blue':
      default: return 'bg-neon-blue/10 text-neon-blue';
    }
  };

  return (
    <>
      {/* TV / Desktop Left Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full z-40 hidden md:flex flex-col glass-panel border-r border-white/5 transition-all duration-300 ${
          isHovered ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 gap-4 border-b border-white/5 overflow-hidden">
          <div className={`p-2 rounded-lg ${getAccentBgClass()} shrink-0`}>
            <Tv size={24} />
          </div>
          <span className={`font-bold text-lg tracking-wider text-gradient-flow whitespace-nowrap transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            RR STREAM
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 space-y-2 px-3">
          {navItems.filter(item => item.id !== 'search').map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (activeTab !== item.id) useTvStore.getState().setSearchQuery('');
                  setActiveTab(item.id);
                }}
                className={`w-full flex items-center gap-4 py-3.5 px-4 rounded-xl font-medium transition-all duration-250 sidebar-focus focusable ${
                  isActive 
                    ? `bg-white/5 font-semibold border-l-4 ${getAccentClass()}` 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                aria-label={item.label}
              >
                <Icon size={22} className="shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap ${
                  isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer Hint */}
        <div className="p-4 border-t border-white/5 overflow-hidden">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <Menu size={16} className="shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              {tvMode ? 'D-Pad Active' : 'Keyboard Friendly'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 w-full z-40 md:hidden glass-panel border-t border-white/10 px-4 py-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (activeTab !== item.id) useTvStore.getState().setSearchQuery('');
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                isActive ? getAccentClass().split(' ')[0] : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
