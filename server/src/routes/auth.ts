import { Hono } from 'hono';
import { z } from 'zod';

import { encrypt, keyPrefix, newId, newToken, hashToken } from '../crypto.ts';
import { queryOne } from '../db.ts';
import { requireSession, type AppEnv } from '../session.ts';
import { SkydiveError, validateKey } from '../skydive.ts';

const SESSION_DAYS = 30;

const loginBody = z.object({
  email: z.string().trim().min(3).max(200).email(),
});

const connectBody = z.object({
  key: z.string().trim().min(1).max(400),
});

export const authRoutes = new Hono<AppEnv>();

/**
 * Sign in by email. No password: this is an assignment build, and a fake
 * password field would imply a security property we do not provide.
 */
authRoutes.post('/login', async (c) => {
  const parsed = loginBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'a valid email is required' }, 400);
  }
  const email = parsed.data.email.toLowerCase();

  const user = await queryOne<{ id: string }>(
    `INSERT INTO users (id, email) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    [newId(), email],
  );
  if (!user) return c.json({ error: 'could not sign in' }, 500);

  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await queryOne(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [newId(), user.id, hashToken(token), expires],
  );

  return c.json({ token, email, expiresAt: expires.toISOString() }, 201);
});

authRoutes.use('/session', requireSession);
authRoutes.use('/logout', requireSession);
authRoutes.use('/connect', requireSession);
authRoutes.use('/disconnect', requireSession);

authRoutes.get('/session', (c) => {
  const viewer = c.get('viewer');
  return c.json({
    email: viewer.email,
    connected: viewer.workspaceId !== null,
    keyPrefix: viewer.keyPrefix,
  });
});

authRoutes.post('/logout', async (c) => {
  const header = c.req.header('authorization') ?? '';
  await queryOne('DELETE FROM sessions WHERE token_hash = $1 RETURNING id', [
    hashToken(header.slice(7).trim()),
  ]);
  return c.json({ ok: true });
});

/**
 * Store a workspace key. Validated against Skydive before it is persisted, so
 * a bad key fails here instead of surfacing as an empty roster later.
 */
authRoutes.post('/connect', async (c) => {
  const parsed = connectBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'an API key is required' }, 400);
  const key = parsed.data.key;

  if (!key.startsWith('sky_live_')) {
    return c.json({ error: 'that does not look like a Skydive API key' }, 400);
  }

  try {
    await validateKey(key);
  } catch (err) {
    if (err instanceof SkydiveError && err.code === 'unauthorized') {
      return c.json({ error: 'Skydive rejected that key' }, 400);
    }
    if (err instanceof SkydiveError && err.code === 'forbidden') {
      return c.json(
        { error: 'that key cannot list agents — use an account-level key' },
        400,
      );
    }
    return c.json({ error: 'could not reach Skydive to check that key' }, 502);
  }

  const viewer = c.get('viewer');
  await queryOne(
    `INSERT INTO workspaces (id, user_id, key_ciphertext, key_prefix)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
       SET key_ciphertext = EXCLUDED.key_ciphertext,
           key_prefix     = EXCLUDED.key_prefix
     RETURNING id`,
    [newId(), viewer.userId, encrypt(key), keyPrefix(key)],
  );

  return c.json({ connected: true, keyPrefix: keyPrefix(key) }, 201);
});

authRoutes.post('/disconnect', async (c) => {
  await queryOne('DELETE FROM workspaces WHERE user_id = $1 RETURNING id', [
    c.get('viewer').userId,
  ]);
  return c.json({ connected: false });
});
