import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { migrate } from './db';
import { agentRoutes } from './routes/agents';
import { authRoutes } from './routes/auth';
import { chatRoutes } from './routes/chat';
import type { AppEnv } from './session';
import { SkydiveError } from './skydive';

export function createApp(basePath = '') {
  const app = new Hono<AppEnv>().basePath(basePath);

  app.use(
    '*',
    cors({ origin: '*', allowHeaders: ['authorization', 'content-type'] }),
  );

  // Must be registered before the routes, or it never runs for them.
  app.use('*', async (_c, next) => {
    await ensureSchema();
    await next();
  });

  app.get('/health', (c) => c.json({ ok: true }));
  app.route('/v1/auth', authRoutes);
  app.route('/v1/agents', agentRoutes);
  app.route('/v1/chat', chatRoutes);

  /**
   * A revoked key is the one upstream failure the app can act on, so it keeps
   * its own code. Everything else is a 502 the client should not interpret.
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
        return c.json(
          { error: 'Skydive is rate limiting', code: 'rate_limited' },
          429,
        );
      }
      console.error('[bff] skydive:', err.code, err.message);
      return c.json({ error: 'Skydive request failed', code: err.code }, 502);
    }
    console.error('[bff]', err);
    return c.json({ error: 'internal error' }, 500);
  });

  return app;
}

/**
 * Serverless invocations are cold and concurrent, so the schema call must be
 * safe to run repeatedly and only once per instance. It is CREATE TABLE IF NOT
 * EXISTS throughout, so a lost race is harmless. A failed attempt is not
 * cached: the next request retries instead of the instance failing forever.
 */
let migrated: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  migrated ??= migrate().catch((err: unknown) => {
    migrated = null;
    throw err;
  });
  return migrated;
}
