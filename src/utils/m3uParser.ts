export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  category: string;
}

/**
 * Parses a standard M3U playlist file content into a list of Channel objects.
 */
export function parseM3U(content: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split('\n');
  
  let currentChannel: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      currentChannel = {};
      
      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      currentChannel.logo = logoMatch ? logoMatch[1].trim() : '';

      // Extract group-title (category)
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      currentChannel.category = groupMatch ? groupMatch[1].trim() : 'Uncategorized';
      
      // Extract tvg-id
      const idMatch = line.match(/tvg-id="([^"]+)"/i);
      let tempId = idMatch ? idMatch[1].trim() : '';

      // Extract tvg-name as fallback for name
      const tvgNameMatch = line.match(/tvg-name="([^"]+)"/i);
      const tvgName = tvgNameMatch ? tvgNameMatch[1].trim() : '';

      // Find the channel name after the last comma
      const commaIndex = line.lastIndexOf(',');
      let name = '';
      if (commaIndex !== -1) {
        name = line.substring(commaIndex + 1).trim();
      } else {
        name = tvgName || 'Unknown Channel';
      }
      
      currentChannel.name = name;
      
      // If we still don't have a unique ID, generate one based on the name
      if (!tempId) {
        tempId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      }
      currentChannel.id = tempId || `channel-${channels.length + 1}`;
      
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentChannel) {
        currentChannel.url = line;
        // Only add if we have a valid URL and name
        if (currentChannel.name && currentChannel.url) {
          channels.push(currentChannel as Channel);
        }
        currentChannel = null;
      }
    }
  }

  // Deduplicate channels by ID to avoid UI rendering key conflicts
  const uniqueChannels: Channel[] = [];
  const seenIds = new Set<string>();

  for (const channel of channels) {
    let finalId = channel.id;
    let counter = 1;
    while (seenIds.has(finalId)) {
      finalId = `${channel.id}-${counter}`;
      counter++;
    }
    channel.id = finalId;
    seenIds.add(finalId);
    uniqueChannels.push(channel);
  }

  return uniqueChannels;
}
