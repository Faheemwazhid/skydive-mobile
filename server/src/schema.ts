/** Our schema. Idempotent: safe to run on every cold start. */
export const SCHEMA_SQL = `
-- Our database. Skydive owns agents and chat history; we own identity,
-- the encrypted workspace key, and the character overlay (ADR 0007).
--
-- The Skydive key IS the identity (ADR 0008), so a user and a connected
-- workspace are the same row. There is no separate workspaces table.

-- The email-login shape is gone. Drop it once, on the first boot that sees it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'users' AND column_name = 'email') THEN
    DROP TABLE IF EXISTS agent_characters, workspaces, sessions, users CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  key_hash        TEXT NOT NULL UNIQUE,
  key_ciphertext  TEXT NOT NULL,
  key_prefix      TEXT NOT NULL,
  display_name    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

-- Our character assignment for a Skydive agent. Skydive has no such field.
CREATE TABLE IF NOT EXISTS agent_characters (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id      TEXT NOT NULL,
  character_id  TEXT NOT NULL,
  PRIMARY KEY (user_id, agent_id)
);
`;
