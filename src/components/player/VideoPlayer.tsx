import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, 
  Tv, Eye, Heart, Settings
} from 'lucide-react';
import { useTvStore } from '../../store/useTvStore';
import { generateMockEpg, getCurrentProgram } from '../../utils/epgParser';
import type { EpgProgram } from '../../utils/epgParser';

export const VideoPlayer: React.FC = () => {
  const { 
    currentChannel, 
    setCurrentChannel, 
    channels,
    isPlaying, 
    setIsPlaying, 
    volume, 
    setVolume, 
    isMuted, 
    setIsMuted, 
    autoPlayNext,
    favorites,
    toggleFavorite,
    accentColor
  } = useTvStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentShow, setCurrentShow] = useState<EpgProgram | null>(null);
  const [showChannelList, setShowChannelList] = useState(false);
  
  // Timeline State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Quality State
  const [qualityLevels, setQualityLevels] = useState<{height: number, bitrate: number, index: number}[]>([]);
  const [currentQualityLevel, setCurrentQualityLevel] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Controls auto-hide timer
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentChannel) return;

    // Generate EPG show details
    const programs = generateMockEpg(currentChannel.id, currentChannel.category);
    setCurrentShow(getCurrentProgram(programs));

    // Reset error state
    setPlaybackError(null);
    setIsBuffering(true);

    const video = videoRef.current;
    if (!video) return;

    // Standard HTML5 video buffering event listeners
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    // Clean up previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = currentChannel.url;

    const initPlayer = (url: string, isProxyFallback: boolean) => {
      // Clean up previous Hls instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Check if the stream is an HLS (m3u8) stream
      if (streamUrl.includes('.m3u8') || streamUrl.includes('/manifest')) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1000 * 1000, // 60MB
            enableWorker: true,
            lowLatencyMode: false,
          });
          hlsRef.current = hls;
          
          hls.loadSource(url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
            setIsBuffering(false);
            
            // Map available quality levels
            const levels = data.levels.map((l, index) => ({
              height: l.height,
              bitrate: l.bitrate,
              index: index
            }));
            setQualityLevels(levels);
            setCurrentQualityLevel(hls.currentLevel);

            if (isPlaying) {
              video.play().catch(err => {
                console.warn("Autoplay blocked by browser with sound. Attempting muted autoplay...", err);
                if (err.name === 'NotAllowedError') {
                  video.muted = true;
                  setIsMuted(true);
                  video.play().catch(() => setIsPlaying(false));
                } else {
                  setIsPlaying(false);
                }
              });
            }
          });

          // Error Handling
          hls.on(Hls.Events.ERROR, (_, data) => {
            console.warn('HLS.js error:', data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  if (!isProxyFallback) {
                    console.log('Fatal network error (likely CORS). Retrying with proxy...');
                    hls.destroy();
                    hlsRef.current = null;
                    initPlayer(`https://corsproxy.io/?${encodeURIComponent(streamUrl)}`, true);
                  } else {
                    console.log('Fatal network error even after proxy fallback...');
                    setPlaybackError('This broadcaster has blocked playback in standard web browsers (CORS restriction) or in your region. Skipping to next...');
                    setIsBuffering(false);
                    hls.destroy();
                    hlsRef.current = null;
                    if (autoPlayNext) setTimeout(() => handleNextChannel(), 2000);
                  }
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('Fatal media error, trying to recover...');
                  hls.recoverMediaError();
                  break;
                default:
                  setPlaybackError('Stream offline or blocked by the provider. Skipping to next...');
                  setIsBuffering(false);
                  hls.destroy();
                  hlsRef.current = null;
                  if (autoPlayNext) setTimeout(() => handleNextChannel(), 2000);
                  break;
              }
            }
          });

          // Buffering managed globally by HTML5 video events above

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari, iOS)
          video.src = url;
          video.onloadedmetadata = () => {
            setIsBuffering(false);
            if (isPlaying) video.play().catch(() => setIsPlaying(false));
          };
          video.onerror = () => {
            if (!isProxyFallback) {
              initPlayer(`https://corsproxy.io/?${encodeURIComponent(streamUrl)}`, true);
            } else {
              setPlaybackError('Failed to load live video stream. Skipping...');
              setIsBuffering(false);
              if (autoPlayNext) setTimeout(() => handleNextChannel(), 2000);
            }
          };
        } else {
          setPlaybackError('HLS streaming is not supported in this browser.');
          setIsBuffering(false);
        }
      } else {
        // Direct MP4 or other video streaming formats
        video.src = url;
        video.load();
        video.onloadedmetadata = () => {
          setIsBuffering(false);
          if (isPlaying) video.play().catch(() => setIsPlaying(false));
        };
        video.onerror = () => {
          if (!isProxyFallback) {
            initPlayer(`https://corsproxy.io/?${encodeURIComponent(streamUrl)}`, true);
          } else {
            setPlaybackError('Failed to play stream. Unsupported format or CORS restrictions. Skipping...');
            setIsBuffering(false);
            if (autoPlayNext) setTimeout(() => handleNextChannel(), 2000);
          }
        };
      }
    };

    initPlayer(streamUrl, false);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel]);

  // Adjust volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Handle Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
    resetControlsTimer();
  };

  // Channel switching functions (Zap)
  const handlePrevChannel = () => {
    if (!currentChannel || channels.length <= 1) return;
    const currentIndex = channels.findIndex(c => c.id === currentChannel.id);
    const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
    setCurrentChannel(channels[prevIndex]);
    resetControlsTimer();
  };

  const handleNextChannel = () => {
    if (!currentChannel || channels.length <= 1) return;
    const currentIndex = channels.findIndex(c => c.id === currentChannel.id);
    const nextIndex = (currentIndex + 1) % channels.length;
    setCurrentChannel(channels[nextIndex]);
    resetControlsTimer();
  };

  // Mute / Unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    resetControlsTimer();
  };

  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentQualityLevel(levelIndex);
      setShowQualityMenu(false);
    }
  };

  // Fullscreen toggling
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
    resetControlsTimer();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // PiP support
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error('Failed to trigger PiP:', err);
    }
    resetControlsTimer();
  };

  // Controls Visibility Timers
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    // Auto hide controls after 4 seconds of no activity
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !showChannelList) {
        setShowControls(false);
      }
    }, 4000);
  };

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showChannelList]);

  if (!currentChannel) {
    return (
      <div className="w-full aspect-video rounded-3xl glass-panel flex flex-col items-center justify-center p-6 border border-white/5">
        <Tv size={50} className="text-gray-600 mb-4 animate-pulse" />
        <p className="text-gray-400 font-medium text-sm">Select a channel to start streaming</p>
      </div>
    );
  }

  const isFavorite = favorites.includes(currentChannel.id);

  // Accent helpers
  const getAccentTextClass = () => {
    switch (accentColor) {
      case 'purple': return 'text-neon-purple';
      case 'pink': return 'text-neon-pink';
      case 'green': return 'text-neon-green';
      case 'blue':
      default: return 'text-neon-blue';
    }
  };

  const getAccentProgressBgClass = () => {
    switch (accentColor) {
      case 'purple': return 'bg-neon-purple';
      case 'pink': return 'bg-neon-pink';
      case 'green': return 'bg-neon-green';
      case 'blue':
      default: return 'bg-neon-blue';
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/5 shadow-2xl group/player ${
        isFullscreen ? 'h-screen w-screen border-none rounded-none' : ''
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(isFinite(dur) ? dur : 0);
          }
        }}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Buffering Indicator */}
      {isBuffering && !playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
            <Tv size={24} className="absolute text-white animate-pulse" />
          </div>
          <p className="text-gray-300 text-xs font-semibold tracking-wider mt-4">BUFFERING STREAM...</p>
        </div>
      )}

      {/* Playback Error Overlay */}
      {playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-bg/90 backdrop-blur-md z-20 px-6 text-center">
          <AlertTriangle size={48} className="text-rose-500 mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-2">Streaming Error</h3>
          <p className="text-xs text-gray-400 max-w-md mb-6">{playbackError}</p>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setPlaybackError(null);
                setIsBuffering(true);
                setCurrentChannel({ ...currentChannel }); // Force refresh channel link
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              RETRY STREAM
            </button>
            <button 
              onClick={handleNextChannel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors border border-white/5 cursor-pointer"
            >
              NEXT CHANNEL
              <ChevronRight size={14} />
            </button>
          </div>
          {autoPlayNext && (
            <p className="text-[10px] text-gray-500 mt-4 italic">Auto-skipping to next channel in a few seconds...</p>
          )}
        </div>
      )}

      {/* Custom Player Controls (Fade effect) */}
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) togglePlay();
        }}
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 flex flex-col justify-between p-3 md:p-6 z-10 transition-opacity duration-300 select-none ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Controls: Channel details */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              {currentChannel.logo ? (
                <img src={currentChannel.logo} alt="" className="h-8 w-8 object-contain" onError={(e)=>{e.currentTarget.style.display='none'}} />
              ) : (
                <Tv size={20} className="text-gray-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                {currentChannel.name}
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              </span>
              <span className="text-[10px] text-gray-400 font-medium">{currentChannel.category}</span>
            </div>
          </div>

          {/* Quick toggle favorites */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(currentChannel.id)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-rose-500" : "text-gray-400"} />
            </button>
            <button
              onClick={() => setShowChannelList(!showChannelList)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                showChannelList 
                  ? `${getAccentTextClass()} border-current bg-white/5` 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Tv size={16} />
              <span>CHANNELS</span>
            </button>
          </div>
        </div>

        {/* Middle Controls (Big play button for quick desktop clicks) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="p-5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 pointer-events-auto transition-transform active:scale-95 cursor-pointer shadow-2xl"
            >
              <Play size={32} fill="currentColor" className="ml-1" />
            </button>
          )}
        </div>

        {/* Bottom Controls: Seek bar, buttons, and timers */}
        <div className="w-full flex flex-col gap-3.5 mt-auto">
          {/* Timeline / EPG Area */}
          {duration > 0 ? (
            <div className="flex items-center gap-3 px-1 mb-1">
              <span className="text-[10px] text-white font-mono shrink-0">
                {new Date(currentTime * 1000).toISOString().substring(14, 19)}
              </span>
              <input
                type="range"
                min="0"
                max={duration}
                step="1"
                value={currentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setCurrentTime(newTime);
                  if (videoRef.current) videoRef.current.currentTime = newTime;
                }}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-white/20 accent-white hover:h-2 transition-all`}
              />
              <span className="text-[10px] text-gray-400 font-mono shrink-0">
                {new Date(duration * 1000).toISOString().substring(14, 19)}
              </span>
            </div>
          ) : currentShow && (
            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold uppercase">
                <span>EPG: {currentShow.title}</span>
                <span className="flex items-center gap-1.5 text-rose-500 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> LIVE
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className={`h-full ${getAccentProgressBgClass()}`}
                  style={{ width: `${Math.min(100, Math.max(10, ((new Date().getTime() - currentShow.start.getTime()) / (currentShow.end.getTime() - currentShow.start.getTime())) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] text-gray-500 font-semibold">
                <span>Start: {currentShow.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>End: {currentShow.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevChannel}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Previous Channel (Zap)"
              >
                <ChevronLeft size={16} />
              </button>

              <button 
                onClick={togglePlay}
                className="p-2.5 rounded-xl bg-white text-black hover:bg-gray-200 transition-colors cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>

              <button 
                onClick={handleNextChannel}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Next Channel (Zap)"
              >
                <ChevronRight size={16} />
              </button>

              {/* Volume Controller */}
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={toggleMute}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="hidden sm:block w-20 md:w-24 accent-white h-1.5 rounded-lg appearance-none cursor-pointer bg-white/20"
                />
              </div>
            </div>

            {/* Utility Controls */}
            <div className="flex items-center gap-2">
              {/* Settings / Quality Button */}
              {qualityLevels.length > 0 && (
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); }}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
                    title="Video Quality"
                  >
                    <Settings size={16} />
                    {currentQualityLevel === -1 ? <span className="text-[10px] font-bold">AUTO</span> : <span className="text-[10px] font-bold">{qualityLevels.find(l => l.index === currentQualityLevel)?.height || 'AUTO'}p</span>}
                  </button>
                  
                  {/* Quality Menu Overlay */}
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-32 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col z-50 shadow-2xl">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQualityChange(-1); }}
                        className={`text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/10 transition-colors ${currentQualityLevel === -1 ? getAccentTextClass() : 'text-white'}`}
                      >
                        Auto (ABR)
                      </button>
                      {qualityLevels.slice().reverse().map(level => (
                        <button
                          key={level.index}
                          onClick={(e) => { e.stopPropagation(); handleQualityChange(level.index); }}
                          className={`text-left px-4 py-2 text-xs font-medium hover:bg-white/10 transition-colors ${currentQualityLevel === level.index ? getAccentTextClass() : 'text-white'}`}
                        >
                          {level.height}p {level.bitrate ? `(${Math.round(level.bitrate / 1000)}k)` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Picture in Picture */}
              <button
                onClick={togglePiP}
                className="hidden sm:block p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Picture in Picture"
              >
                <Eye size={16} />
              </button>

              {/* Fullscreen Button */}
              <button 
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Channels Zapping Overlay (Tivimate-style panel sliding from the right) */}
      {showChannelList && (
        <div className="absolute right-0 top-0 h-full w-[260px] md:w-[320px] bg-black/85 backdrop-blur-lg border-l border-white/10 z-20 flex flex-col transition-all duration-300">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Tv size={16} className={getAccentTextClass()} />
              ZAP CHANNELS
            </h4>
            <button 
              onClick={() => setShowChannelList(false)}
              className="text-xs text-gray-400 hover:text-white font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 cursor-pointer"
            >
              CLOSE
            </button>
          </div>
          {/* Channel search in overlay */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
            {channels.map((chan) => {
              const isSelected = currentChannel.id === chan.id;
              return (
                <button
                  key={chan.id}
                  onClick={() => setCurrentChannel(chan)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs font-semibold flex items-center gap-3 cursor-pointer ${
                    isSelected 
                      ? `bg-white/5 ${getAccentTextClass()} border-current` 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="h-6 w-6 rounded bg-white/5 flex items-center justify-center shrink-0">
                    {chan.logo ? (
                      <img src={chan.logo} alt="" className="h-5 w-5 object-contain" onError={(e)=>{e.currentTarget.style.display='none'}} />
                    ) : (
                      <Tv size={12} />
                    )}
                  </div>
                  <span className="truncate flex-1">{chan.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
