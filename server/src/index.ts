import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { migrate } from './db.ts';
import { authRoutes } from './routes/auth.ts';
import type { AppEnv } from './session.ts';

const PORT = Number(process.env.BFF_PORT ?? 8787);

export const app = new Hono<AppEnv>();

app.use('*', cors({ origin: '*', allowHeaders: ['authorization', 'content-type'] }));

app.get('/health', (c) => c.json({ ok: true }));
app.route('/v1/auth', authRoutes);

app.onError((err, c) => {
  console.error('[bff]', err.message);
  return c.json({ error: 'internal error' }, 500);
});

async function main() {
  await migrate();
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`[bff] listening on :${info.port}`);
  });
}

main().catch((err: unknown) => {
  console.error('[bff] failed to start:', err);
  process.exit(1);
});
