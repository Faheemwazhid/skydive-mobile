/**
 * Serves the exported web build with the API on the same origin, which is the
 * shape Vercel deploys: static files from dist/, everything under /api handled
 * by the BFF. `npx expo start` cannot show this, because in development the app
 * talks to a separate origin and the production build hardcodes /api.
 *
 * Run:  npm run build:web && npm run preview
 */
import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

import { getRequestListener } from '@hono/node-server';

import { createApp } from '../server/src/app';

const PORT = Number(process.env.PREVIEW_PORT ?? 8083);
const DIST = resolve(__dirname, '..', 'dist');

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

const api = getRequestListener(createApp('/api').fetch);

/** dist/ has no directory index for routes, so unknown paths fall back to the SPA shell. */
function candidatesFor(req: IncomingMessage): string[] {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]));
  return [join(DIST, path), join(DIST, path, 'index.html'), join(DIST, 'index.html')];
}

createServer(async (req, res) => {
  if ((req.url ?? '').startsWith('/api')) {
    api(req, res);
    return;
  }
  for (const candidate of candidatesFor(req)) {
    try {
      const body = await readFile(candidate);
      res.writeHead(200, {
        'content-type':
          CONTENT_TYPES[extname(candidate)] ?? 'application/octet-stream',
      });
      res.end(body);
      return;
    } catch {
      // try the next candidate
    }
  }
  res.writeHead(404).end('not found');
}).listen(PORT, () => {
  console.log(`[preview] dist + /api on :${PORT}`);
});
