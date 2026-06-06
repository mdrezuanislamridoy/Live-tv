export interface EpgProgram {
  title: string;
  description: string;
  start: Date;
  end: Date;
  category?: string;
}

/**
 * Parses XMLTV format EPG data.
 */
export function parseXMLTV(xmlString: string): Record<string, EpgProgram[]> {
  const channelPrograms: Record<string, EpgProgram[]> = {};
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const programmes = xmlDoc.getElementsByTagName('programme');
    
    for (let i = 0; i < programmes.length; i++) {
      const prog = programmes[i];
      const channelId = prog.getAttribute('channel') || '';
      if (!channelId) continue;
      
      const startStr = prog.getAttribute('start') || '';
      const stopStr = prog.getAttribute('stop') || '';
      
      const titleEl = prog.getElementsByTagName('title')[0];
      const descEl = prog.getElementsByTagName('desc')[0];
      const categoryEl = prog.getElementsByTagName('category')[0];
      
      const title = titleEl ? titleEl.textContent || 'Untitled Program' : 'Untitled Program';
      const description = descEl ? descEl.textContent || 'No description available.' : 'No description available.';
      const category = categoryEl ? categoryEl.textContent || '' : '';
      
      const start = parseXMLTVDate(startStr);
      const end = parseXMLTVDate(stopStr);
      
      if (!channelPrograms[channelId]) {
        channelPrograms[channelId] = [];
      }
      
      channelPrograms[channelId].push({
        title,
        description,
        start,
        end,
        category
      });
    }
  } catch (error) {
    console.error('Error parsing EPG XMLTV data:', error);
  }
  
  return channelPrograms;
}

/**
 * Converts XMLTV date format (YYYYMMDDhhmmss +ZZZZ) into JavaScript Date.
 */
function parseXMLTVDate(dateStr: string): Date {
  // Example: 20260606120000 +0000
  if (!dateStr || dateStr.length < 14) return new Date();
  
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hour = parseInt(dateStr.substring(8, 10), 10);
  const min = parseInt(dateStr.substring(10, 12), 10);
  const sec = parseInt(dateStr.substring(12, 14), 10);
  
  // Create UTC date, then adjust offset if present
  let date = new Date(Date.UTC(year, month, day, hour, min, sec));
  
  const offsetPart = dateStr.substring(14).trim();
  if (offsetPart && (offsetPart.startsWith('+') || offsetPart.startsWith('-'))) {
    const sign = offsetPart.startsWith('+') ? 1 : -1;
    const offsetHours = parseInt(offsetPart.substring(1, 3), 10);
    const offsetMins = parseInt(offsetPart.substring(3, 5), 10);
    const totalOffsetMinutes = (offsetHours * 60 + offsetMins) * sign;
    
    // Adjust by subtracting the offset minutes from UTC time
    date = new Date(date.getTime() - totalOffsetMinutes * 60 * 1000);
  }
  
  return date;
}

// Deterministic mock data assets based on categories
const SHOWS_BY_CATEGORY: Record<string, { title: string; desc: string }[]> = {
  News: [
    { title: "Global Morning Update", desc: "Live coverage of the top stories breaking around the globe." },
    { title: "World Business Report", desc: "Analysis of market trends, economic shifts, and global financial updates." },
    { title: "Hourly News Briefing", desc: "A rapid-fire summary of local, national, and international headlines." },
    { title: "Press Room Live", desc: "Reporters and analysts debate the critical issues forming this week's agenda." },
    { title: "Global Tonight", desc: "Comprehensive in-depth reporting and interviews about the day's major events." },
    { title: "Tech & Society Insight", desc: "Investigating how new digital transformations are shaping political and social landscapes." }
  ],
  Science: [
    { title: "Cosmology & Beyond", desc: "Explore the mysteries of dark energy, stellar collapse, and deep space probes." },
    { title: "Wonders of the Solar System", desc: "A tour of the gas giants, asteroids, and robotic explorers mapping our stellar backyard." },
    { title: "Ocean Deep Explorers", desc: "Discovering bioluminescent life forms and volcanic vents miles below the sea surface." },
    { title: "Future Tech Laboratory", desc: "A look at upcoming milestones in quantum computing, bioengineering, and green energy." },
    { title: "Nature's Microscopic World", desc: "How tiny microorganisms control life cycles and sustain macro ecosystems." }
  ],
  Sports: [
    { title: "Sports Center Live", desc: "Instant highlights, scores, analysis, and breaking sports reports." },
    { title: "Extreme Sports World", desc: "Adrenaline-fueled adventures from snowboarding mountain peaks to skydiving records." },
    { title: "Championship Classics", desc: "Revisiting legendary matches, history-making plays, and underdog victories." },
    { title: "Tactics & Training", desc: "Pro coaches dissect player movements, strategy layouts, and peak athletic training." },
    { title: "Motorsport Weekly", desc: "High-octane summaries of Formula, rally, and endurance racing action." }
  ],
  Cinema: [
    { title: "Behind the Screen", desc: "Interviews with screenwriters, directors, and sound designers on cinematic masterclasses." },
    { title: "Indie Film Showcase", desc: "Presenting award-winning shorts and feature-length independent visual dramas." },
    { title: "Classic Hollywood Era", desc: "Restored black-and-white double features, tracking golden age cinema history." },
    { title: "Action Blockbuster Preview", desc: "Trailers, set leaks, and cast interviews for upcoming high-budget releases." },
    { title: "Sci-Fi Shorts Collection", desc: "Visual storytelling pushing the boundaries of speculative fiction and visual effects." }
  ],
  Default: [
    { title: "Morning Pulse", desc: "A light mixture of music, news, and current lifestyles to start your day." },
    { title: "Prime Time Variety", desc: "Curated collection of regional shows, discussions, and popular visual segments." },
    { title: "Documentary Hour", desc: "Exploring cultural, historical, and geographical profiles across the globe." },
    { title: "Global Entertainment News", desc: "Updates from pop culture, music reviews, red carpet events, and celebrity talks." },
    { title: "Late Night Chill", desc: "Ambient sounds, lo-fi beats, and scenic slow-television feeds for winding down." }
  ]
};

/**
 * Generates EPG schedules deterministically for a channel.
 * Will generate programs for a 24-hour window around the requested time.
 */
export function generateMockEpg(channelId: string, category: string, date: Date = new Date()): EpgProgram[] {
  const programs: EpgProgram[] = [];
  
  // Set to start of the day (00:00) in current timezone
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Select program pool
  let pool = SHOWS_BY_CATEGORY.Default;
  const lowerCat = category.toLowerCase();
  
  if (lowerCat.includes('news')) pool = SHOWS_BY_CATEGORY.News;
  else if (lowerCat.includes('science') || lowerCat.includes('document') || lowerCat.includes('tech')) pool = SHOWS_BY_CATEGORY.Science;
  else if (lowerCat.includes('sport') || lowerCat.includes('action')) pool = SHOWS_BY_CATEGORY.Sports;
  else if (lowerCat.includes('cinema') || lowerCat.includes('movie')) pool = SHOWS_BY_CATEGORY.Cinema;

  // Use channelId hash to deterministically randomize the schedule layout
  let hash = 0;
  for (let i = 0; i < channelId.length; i++) {
    hash = channelId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  let currentStart = new Date(startOfDay);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1); // 24 hours later
  
  let index = 0;
  while (currentStart < endOfDay) {
    // Deterministic duration: 30m, 1h, 1.5h, or 2h
    const durOptions = [30, 60, 60, 90, 120];
    const durIndex = (hash + index) % durOptions.length;
    const durationMinutes = durOptions[durIndex];
    
    const currentEnd = new Date(currentStart.getTime() + durationMinutes * 60 * 1000);
    
    // Choose show from pool
    const showIndex = (hash + index) % pool.length;
    const show = pool[showIndex];
    
    programs.push({
      title: show.title,
      description: show.desc,
      start: new Date(currentStart),
      end: new Date(currentEnd > endOfDay ? endOfDay : currentEnd),
      category: category
    });
    
    currentStart = new Date(currentEnd);
    index++;
  }
  
  return programs;
}

/**
 * Finds the currently playing program for a channel.
 */
export function getCurrentProgram(programs: EpgProgram[], time: Date = new Date()): EpgProgram | null {
  if (!programs || programs.length === 0) return null;
  
  const now = time.getTime();
  const current = programs.find(p => p.start.getTime() <= now && p.end.getTime() > now);
  
  return current || programs[0] || null;
}
