const https = require('https');
const get = (url) => new Promise((res, rej) => https.get(url, r => {
  let d = '';
  r.on('data', chunk => d+=chunk);
  r.on('end', () => res(JSON.parse(d)));
}).on('error', rej));

async function run() {
  const [rawChannels, rawStreams, rawLogos] = await Promise.all([
    get('https://iptv-org.github.io/api/channels.json'),
    get('https://iptv-org.github.io/api/streams.json'),
    get('https://iptv-org.github.io/api/logos.json')
  ]);
  const channelMap = new Map();
  rawChannels.forEach(c => channelMap.set(c.id, c));
  const parsedChannels = [];
  rawStreams.forEach(stream => {
    if (!stream.channel) return;
    const cInfo = channelMap.get(stream.channel);
    if (cInfo && !cInfo.is_nsfw) {
      if (!parsedChannels.find(c => c.id === cInfo.id)) {
        parsedChannels.push({ id: cInfo.id });
      }
    }
  });
  console.log("Total channels parsed:", parsedChannels.length);
}
run();
