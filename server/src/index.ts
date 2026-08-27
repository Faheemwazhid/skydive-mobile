import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { migrate } from './db.ts';
import { agentRoutes } from './routes/agents.ts';
import { authRoutes } from './routes/auth.ts';
import type { AppEnv } from './session.ts';
import { SkydiveError } from './skydive.ts';

const PORT = Number(process.env.BFF_PORT ?? 8787);

export const app = new Hono<AppEnv>();

app.use(
  '*',
  cors({ origin: '*', allowHeaders: ['authorization', 'content-type'] }),
);

app.get('/health', (c) => c.json({ ok: true }));
app.route('/v1/auth', authRoutes);
app.route('/v1/agents', agentRoutes);

/**
 * A revoked key is the one upstream failure the app can act on, so it keeps its
 * own code. Everything else is a 502 the client should not try to interpret.
 */
app.onError((err, c) => {
  if (err instanceof SkydiveError) {
    if (err.code === 'unauthorized') {
      return c.json(
        { error: 'Skydive rejected the stored key', code: 'key_invalid' },
        502,
      );
    }
    if (err.code === 'not_found') {
      return c.json({ error: 'not found', code: 'not_found' }, 404);
    }
    if (err.code === 'rate_limited') {
      return c.json({ error: 'Skydive is rate limiting', code: 'rate_limited' }, 429);
    }
    console.error('[bff] skydive:', err.code, err.message);
    return c.json({ error: 'Skydive request failed', code: err.code }, 502);
  }
  console.error('[bff]', err);
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
