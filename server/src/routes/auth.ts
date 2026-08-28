import { Hono } from 'hono';
import { z } from 'zod';

import { encrypt, keyPrefix, newId, newToken, sha256 } from '../crypto';
import { queryOne } from '../db';
import { clientKey, rateLimit } from '../rateLimit';
import { requireSession, type AppEnv } from '../session';
import { SkydiveError, validateKey } from '../skydive';

const REMEMBERED_DAYS = 15;
const SESSION_HOURS = 12;

/** 5 attempts per 15 minutes per IP. Generous for a human, costly for a script. */
const CONNECT_LIMIT = 5;
const CONNECT_WINDOW_MS = 15 * 60_000;

const connectBody = z.object({
  key: z.string().trim().min(1).max(400),
  remember: z.boolean().optional(),
});

const nameBody = z.object({
  name: z.string().trim().min(1).max(60),
});

export const authRoutes = new Hono<AppEnv>();

function expiryFor(remember: boolean): Date {
  const ms = remember
    ? REMEMBERED_DAYS * 86_400_000
    : SESSION_HOURS * 3_600_000;
  return new Date(Date.now() + ms);
}

/** A message for the key rejections a user can act on, or null to rethrow. */
function keyRejection(err: unknown): string | null {
  if (!(err instanceof SkydiveError)) return null;
  if (err.code === 'unauthorized') return 'Skydive rejected that key';
  if (err.code === 'forbidden') {
    return 'that key cannot list agents, use an account-level key';
  }
  return null;
}

/**
 * The key is the login (ADR 0008). It is validated against Skydive, then its
 * SHA-256 identifies the user; the key itself is stored only as ciphertext.
 */
authRoutes.post('/connect', async (c) => {
  const limit = rateLimit(clientKey(c), CONNECT_LIMIT, CONNECT_WINDOW_MS);
  if (!limit.allowed) {
    c.header('retry-after', String(limit.retryAfterSeconds));
    return c.json(
      { error: 'too many attempts, try again later' },
      429,
    );
  }

  const parsed = connectBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'an API key is required' }, 400);
  const { key, remember = false } = parsed.data;

  if (!key.startsWith('sky_live_')) {
    return c.json({ error: 'that does not look like a Skydive API key' }, 400);
  }

  try {
    await validateKey(key);
  } catch (err) {
    const rejection = keyRejection(err);
    if (rejection) return c.json({ error: rejection }, 400);
    return c.json({ error: 'could not reach Skydive to check that key' }, 502);
  }

  const user = await queryOne<{ id: string; display_name: string | null }>(
    `INSERT INTO users (id, key_hash, key_ciphertext, key_prefix)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (key_hash) DO UPDATE
       SET key_ciphertext = EXCLUDED.key_ciphertext,
           key_prefix     = EXCLUDED.key_prefix
     RETURNING id, display_name`,
    [newId(), sha256(key), encrypt(key), keyPrefix(key)],
  );
  if (!user) return c.json({ error: 'could not sign in' }, 500);

  // Expired sessions are dead weight; connect is a low-traffic, already-open
  // connection, so it is the cheap place to sweep them.
  await queryOne('DELETE FROM sessions WHERE expires_at <= now() RETURNING id');

  const token = newToken();
  const expires = expiryFor(remember);
  await queryOne(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [newId(), user.id, sha256(token), expires],
  );

  return c.json(
    {
      token,
      displayName: user.display_name,
      keyPrefix: keyPrefix(key),
      expiresAt: expires.toISOString(),
    },
    201,
  );
});

authRoutes.use('/session', requireSession);
authRoutes.use('/logout', requireSession);
authRoutes.use('/name', requireSession);

authRoutes.get('/session', (c) => {
  const viewer = c.get('viewer');
  return c.json({
    displayName: viewer.displayName,
    keyPrefix: viewer.keyPrefix,
  });
});

/** Our own field. Skydive has no profile endpoint to read a name from. */
authRoutes.post('/name', async (c) => {
  const parsed = nameBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'a name is required' }, 400);

  const updated = await queryOne<{ display_name: string }>(
    'UPDATE users SET display_name = $1 WHERE id = $2 RETURNING display_name',
    [parsed.data.name, c.get('viewer').userId],
  );
  if (!updated) return c.json({ error: 'could not save that name' }, 500);

  return c.json({ displayName: updated.display_name });
});

authRoutes.post('/logout', async (c) => {
  const header = c.req.header('authorization') ?? '';
  await queryOne('DELETE FROM sessions WHERE token_hash = $1 RETURNING id', [
    sha256(header.slice(7).trim()),
  ]);
  return c.json({ ok: true });
});
