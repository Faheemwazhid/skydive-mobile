import type { Context, Next } from 'hono';

import { decrypt, hashToken } from './crypto.ts';
import { queryOne } from './db.ts';

export type Viewer = {
  userId: string;
  email: string;
  workspaceId: string | null;
  keyPrefix: string | null;
};

type SessionRow = {
  user_id: string;
  email: string;
  workspace_id: string | null;
  key_prefix: string | null;
};

export type AppEnv = {
  Variables: { viewer: Viewer };
};

function bearer(c: Context): string | null {
  const header = c.req.header('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function viewerFor(token: string): Promise<Viewer | null> {
  const row = await queryOne<SessionRow>(
    `SELECT s.user_id, u.email, w.id AS workspace_id, w.key_prefix
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN workspaces w ON w.user_id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );
  if (!row) return null;
  return {
    userId: row.user_id,
    email: row.email,
    workspaceId: row.workspace_id,
    keyPrefix: row.key_prefix,
  };
}

/** 401 when the session is missing or expired. */
export async function requireSession(
  c: Context<AppEnv>,
  next: Next,
): Promise<Response | void> {
  const token = bearer(c);
  if (!token) return c.json({ error: 'missing session' }, 401);
  const viewer = await viewerFor(token);
  if (!viewer) return c.json({ error: 'invalid or expired session' }, 401);
  c.set('viewer', viewer);
  await next();
}

/**
 * The workspace key, decrypted for one outbound call. Never returned to the
 * client and never logged.
 */
export async function workspaceKey(userId: string): Promise<string | null> {
  const row = await queryOne<{ key_ciphertext: string }>(
    'SELECT key_ciphertext FROM workspaces WHERE user_id = $1',
    [userId],
  );
  return row ? decrypt(row.key_ciphertext) : null;
}
