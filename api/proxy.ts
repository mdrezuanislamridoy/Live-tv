import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';
import http from 'http';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const target = req.query.url as string;
  if (!target) return res.status(400).send('Missing url param');

  const parsed = new URL(target);
  const client = parsed.protocol === 'https:' ? https : http;

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `${parsed.protocol}//${parsed.hostname}/`,
      'Origin': `${parsed.protocol}//${parsed.hostname}`,
    },
  };

  const upstream = client.get(options, (stream) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', stream.headers['content-type'] || 'application/octet-stream');
    res.writeHead(stream.statusCode || 200);
    stream.pipe(res);
  });

  upstream.on('error', () => res.status(502).send('Upstream error'));
}
