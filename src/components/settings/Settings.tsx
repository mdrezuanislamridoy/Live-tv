import React, { useState } from 'react';
import { 
  Save, RefreshCw, Palette, Trash2, 
  Settings as SettingsIcon, Link, FileText, CheckCircle
} from 'lucide-react';
import { useTvStore } from '../../store/useTvStore';
import { SHAJON_BASE } from '../../config';

const PRESET_PLAYLISTS = [
  { name: '🏆 FIFA WC 2026 + All Channels', url: SHAJON_BASE, description: '6800+ verified live channels — FIFA, Sports, Bangla, News & more' },
  { name: '🇧🇩 Bangla Channels', url: `${SHAJON_BASE}/bangla.json`, description: '100+ verified Bangladeshi channels' },
  { name: '⚽ Sports Only', url: `${SHAJON_BASE}/sports.json`, description: '244 verified live sports channels' },
];

export const Settings: React.FC = () => {
  const {
    m3uUrl,
    epgUrl,
    setM3uUrl,
    setEpgUrl,
    autoPlayNext,
    setAutoPlayNext,
    accentColor,
    setAccentColor,
    clearHistory,
    loading
  } = useTvStore();

  const [inputM3u, setInputM3u] = useState(m3uUrl === 'local-sample' ? '' : m3uUrl);
  const [inputEpg, setInputEpg] = useState(epgUrl);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Apply custom configuration
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    
    const finalM3u = inputM3u.trim() || 'local-sample';
    const finalEpg = inputEpg.trim();
    
    setM3uUrl(finalM3u);
    setEpgUrl(finalEpg);
    
    setSuccessMsg('Settings updated successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Load Preset Playlists
  const handleLoadPreset = (url: string) => {
    if (url === 'local-sample') {
      setInputM3u('');
      setM3uUrl('local-sample');
    } else {
      setInputM3u(url);
      setM3uUrl(url);
    }
    
    setSuccessMsg('Preset loaded! Initializing streams...');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Reset to Defaults
  const handleReset = () => {
    setInputM3u('');
    setInputEpg('');
    setM3uUrl('local-sample');
    setEpgUrl('');
    setAutoPlayNext(true);
    setAccentColor('blue');
    setSuccessMsg('Reset to default settings.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Accent mapping helper
  const getAccentTextClass = () => {
    switch (accentColor) {
      case 'purple': return 'text-neon-purple';
      case 'pink': return 'text-neon-pink';
      case 'green': return 'text-neon-green';
      case 'blue':
      default: return 'text-neon-blue';
    }
  };

  const getAccentBgClass = (color: string) => {
    switch (color) {
      case 'purple': return 'bg-neon-purple';
      case 'pink': return 'bg-neon-pink';
      case 'green': return 'bg-neon-green';
      case 'blue':
      default: return 'bg-neon-blue';
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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-10">
      {/* Welcome Banner */}
      <div className="glass-panel border border-white/5 rounded-3xl p-6 flex items-center gap-4">
        <div className={`p-3.5 rounded-2xl bg-white/5 ${getAccentTextClass()}`}>
          <SettingsIcon size={32} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Configuration Control</h2>
          <p className="text-xs text-gray-400">
            Paste your IPTV M3U URL, select standard presets, configure guide files, and adjust aesthetics.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle size={18} />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Playlists Presets List */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2 border-b border-white/5 pb-3">
              <Link size={16} className={getAccentTextClass()} />
              Playlist Presets
            </h3>
            
            <div className="flex flex-col gap-3">
              {PRESET_PLAYLISTS.map((preset) => {
                const isCurrent = (preset.url === 'local-sample' && m3uUrl === 'local-sample') || (preset.url === m3uUrl);
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleLoadPreset(preset.url)}
                    className={`text-left p-3.5 rounded-2xl border text-xs font-semibold flex flex-col gap-1 transition-all focusable sidebar-focus ${
                      isCurrent 
                        ? `bg-white/5 ${getAccentTextClass()} border-current` 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    tabIndex={0}
                  >
                    <span className="font-bold text-gray-200">{preset.name}</span>
                    <span className="text-[10px] text-gray-500 font-medium leading-relaxed">{preset.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Configurations Fields */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSave} className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2 border-b border-white/5 pb-3">
              <FileText size={16} className={getAccentTextClass()} />
              Custom Sources
            </h3>

            {/* M3U Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-300">Custom M3U Playlist Link</label>
              <input
                type="url"
                value={inputM3u}
                onChange={(e) => setInputM3u(e.target.value)}
                placeholder="https://example.com/playlist.m3u"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all focusable"
                tabIndex={0}
              />
              <span className="text-[10px] text-gray-500 font-medium">Leave empty to run standard fallback streams.</span>
            </div>

            {/* EPG Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-300">EPG XMLTV Guide Link (Optional)</label>
              <input
                type="url"
                value={inputEpg}
                onChange={(e) => setInputEpg(e.target.value)}
                placeholder="https://example.com/epg.xml"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all focusable"
                tabIndex={0}
              />
              <span className="text-[10px] text-gray-500 font-medium">Auto-generates visual mockup programs if empty.</span>
            </div>

            {/* Autoplay toggle */}
            <div className="flex items-center justify-between py-2 border-y border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-gray-200">Auto-Play Next Channel</span>
                <span className="text-[10px] text-gray-500">Automatically switch to the next channel if playback fails.</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoPlayNext(!autoPlayNext)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focusable ${
                  autoPlayNext ? getAccentBgClass(accentColor) : 'bg-white/10'
                }`}
                tabIndex={0}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoPlayNext ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Color accent selection */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Palette size={14} /> Theme Accent Color
              </label>
              <div className="flex gap-4">
                {(['blue', 'purple', 'pink', 'green'] as const).map((color) => {
                  const isActive = accentColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccentColor(color)}
                      className={`h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center focusable ${
                        isActive ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      } ${getAccentBgClass(color)}`}
                      tabIndex={0}
                      title={`Select ${color} accent`}
                    >
                      {isActive && <div className="h-2.5 w-2.5 rounded-full bg-black/40" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons row */}
            <div className="flex flex-wrap items-center gap-4 mt-4 border-t border-white/5 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-lg cursor-pointer focusable btn-focus shrink-0 ${getAccentButtonClass()}`}
                tabIndex={0}
              >
                <Save size={14} />
                <span>{loading ? 'LOADING PLAYLIST...' : 'SAVE & RELOAD'}</span>
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white text-xs hover:bg-white/10 transition-all cursor-pointer focusable btn-focus"
                tabIndex={0}
              >
                <RefreshCw size={14} />
                <span>RESTORE DEFAULTS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clearHistory();
                  setSuccessMsg('Watch history cleared.');
                  setTimeout(() => setSuccessMsg(null), 3000);
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs hover:bg-rose-500/10 transition-all cursor-pointer focusable btn-focus ml-auto"
                tabIndex={0}
              >
                <Trash2 size={14} />
                <span>CLEAR HISTORY</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
