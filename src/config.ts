// Configuration settings for the Live TV App

export interface PresetPlaylist {
  name: string;
  url: string;
  description: string;
}

export const PRESET_PLAYLISTS: PresetPlaylist[] = [
  {
    name: "Global Live API (JSON REST)",
    url: "iptv-org-api",
    description: "Fetches live channels globally directly from iptv-org REST API"
  },
  {
    name: "Standard Sample (High Quality)",
    url: "local-sample",
    description: "Curated legal streams (NASA, Euronews, Red Bull TV, Test streams) - Works instantly!"
  },
  {
    name: "English Channels (Global)",
    url: "https://iptv-org.github.io/iptv/languages/eng.m3u",
    description: "Thousands of English language channels from around the world (iptv-org)"
  },
  {
    name: "Global News (iptv-org)",
    url: "https://iptv-org.github.io/iptv/categories/news.m3u",
    description: "News channels worldwide"
  },
  {
    name: "Global Movies (iptv-org)",
    url: "https://iptv-org.github.io/iptv/categories/movies.m3u",
    description: "Movie and cinema channels"
  },
  {
    name: "Global Documentaries",
    url: "https://iptv-org.github.io/iptv/categories/documentary.m3u",
    description: "Science, nature, history, and education channels"
  },
  {
    name: "Bangladesh Channels",
    url: "https://iptv-org.github.io/iptv/countries/bd.m3u",
    description: "All available live channels from Bangladesh"
  },
  {
    name: "Indian Channels",
    url: "https://iptv-org.github.io/iptv/countries/in.m3u",
    description: "All available live channels from India"
  }
];

export const DEFAULT_M3U_URL = "iptv-org-api";
export const DEFAULT_EPG_URL = "";

// High quality legal public streams embedded for quick test/fallback
export const STATIC_FALLBACK_M3U = `#EXTM3U
#EXTINF:-1 tvg-id="nasa" tvg-name="NASA TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" group-title="Science",NASA TV (USA)
https://nasa-otd.akamaized.net/hls/live/2035882/NASA-OTD/master.m3u8

#EXTINF:-1 tvg-id="euronews-en" tvg-name="Euronews English" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/e0/Euronews_logo_2016.svg" group-title="News",Euronews English
https://euronews-euronews-england-1-us.samsung.wurl.com/manifest/playlist.m3u8

#EXTINF:-1 tvg-id="redbull" tvg-name="Red Bull TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/e2/Red_Bull_logo.svg" group-title="Sports",Red Bull TV
https://rbmn-live.akamaized.net/hls/live/590964/sports/index.m3u8

#EXTINF:-1 tvg-id="sintel" tvg-name="Sintel UHD" tvg-logo="https://durian.blender.org/wp-content/uploads/2010/06/sintel_poster_v2_small.jpg" group-title="Cinema",Sintel (CGI Movie Stream)
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

#EXTINF:-1 tvg-id="tears-of-steel" tvg-name="Tears of Steel" tvg-logo="https://mango.blender.org/wp-content/uploads/2012/09/cropped-header-trans1.png" group-title="Cinema",Tears of Steel (Sci-Fi Stream)
https://demo.unified-streaming.com/kaltura/cast/tears-of-steel/tears-of-steel.ism/.m3u8

#EXTINF:-1 tvg-id="bigbuckbunny" tvg-name="Big Buck Bunny" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_Buck_Bunny_Main_Poster.jpg" group-title="Cinema",Big Buck Bunny (Classic Animation)
https://multiplatform-f.akamaihd.net/i/multi/will/bunny/big_buck_bunny_,640x360_400,640x360_700,640x360_1000,950x540_1500,.f4v.csmil/master.m3u8

#EXTINF:-1 tvg-id="dw-news" tvg-name="DW English" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/c/c5/Deutsche_Welle_logo.svg" group-title="News",Deutsche Welle English
https://dwamdstream102.akamaized.net/hls/live/2013955-b/dwamdstream102/index.m3u8
`;
