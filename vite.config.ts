import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'
import https from 'https'
import http from 'http'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {},
    middlewareMode: false,
  },
  // @ts-ignore
  configureServer(server) {
    server.middlewares.use('/stream-proxy', (req: IncomingMessage, res: ServerResponse) => {
      const urlParam = new URL(req.url ?? '', 'http://localhost').searchParams.get('url');
      if (!urlParam) { res.statusCode = 400; res.end('Missing url'); return; }

      const parsed = new URL(urlParam);
      const client = parsed.protocol === 'https:' ? https : http;

      client.get({
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': `${parsed.protocol}//${parsed.hostname}/`,
          'Origin': `${parsed.protocol}//${parsed.hostname}`,
        },
      }, (upstream) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', upstream.headers['content-type'] ?? 'application/octet-stream');
        res.writeHead(upstream.statusCode ?? 200);
        upstream.pipe(res);
      }).on('error', () => { res.statusCode = 502; res.end(); });
    });
  }
})
