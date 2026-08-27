/** Our schema. Idempotent: every statement is IF NOT EXISTS. */
export const SCHEMA_SQL = `
-- Our database. Skydive owns agents and chat history; we own identity,
-- the encrypted workspace key, and the character overlay (ADR 0007).

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

-- One connected Skydive workspace per user. The key is AES-256-GCM ciphertext;
-- key_prefix is the display-safe first characters only.
CREATE TABLE IF NOT EXISTS workspaces (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  key_ciphertext  TEXT NOT NULL,
  key_prefix      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Our character assignment for a Skydive agent. Skydive has no such field.
CREATE TABLE IF NOT EXISTS agent_characters (
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id      TEXT NOT NULL,
  character_id  TEXT NOT NULL,
  PRIMARY KEY (workspace_id, agent_id)
);
`;
