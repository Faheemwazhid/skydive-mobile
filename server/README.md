# BFF

Holds the workspace `sky_live_` key and is the only thing that talks to Skydive.
See [ADR 0007](../docs/adr/0007-bff-and-our-database.md) for what our database
stores and, more importantly, what it does not. Chat replies arrive by
polling, not the run stream: [ADR 0009](../docs/adr/0009-reply-by-polling.md).

## Run

```bash
export DATABASE_URL="postgres://…"     # any Postgres
export SESSION_SECRET="$(openssl rand -base64 24)"   # >= 16 chars
npm run server                          # listens on :8787, BFF_PORT to override
```

The schema is created on boot and is idempotent.

## Verify

```bash
npm run test:bff        # set skydive_api_key to also exercise the real connect path
```

## Endpoints

All chat and agent routes require a session token. Skydive errors are mapped:
unauthorized key → 502 `key_invalid`, rate limited → 429, everything else → 502.

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | liveness |
| POST | `/v1/auth/connect` | `{ key, remember }` → `{ token, displayName, keyPrefix, expiresAt }`. The key is the login (ADR 0008): validated against Skydive, then its SHA-256 finds or creates the user. **Rate limited: 5 attempts per 15 min per IP.** Also sweeps expired sessions |
| GET | `/v1/auth/session` | who am I |
| POST | `/v1/auth/name` | `{ name }`, our own field. Skydive has no profile endpoint |
| POST | `/v1/auth/logout` | revokes this session |
| GET | `/v1/agents` | the workspace roster with our character overlay |
| GET | `/v1/agents/:id` | one agent; malformed ids are 404, not a passed-through 500 |
| POST | `/v1/agents` | `{ name, purpose?, characterId }` → creates in Skydive on `openai/gpt-5.6-luna` (ADR 0004) and stores our character row |
| GET | `/v1/chat/conversations` | last 50, with agent ids |
| GET | `/v1/chat/conversations/:id/messages` | last 100, mapped to our message shape |
| POST | `/v1/chat/send` | `{ agentId, conversationId?, prompt }` → `{ conversationId, messageId }`. Returns before the reply exists; the client polls messages (ADR 0009) |

Sessions last 15 days when `remember` is true and 12 hours when it is not.
Expired sessions are deleted on connect.

The key is AES-256-GCM encrypted with a key derived from `SESSION_SECRET`. It is
never returned to the client — `keyPrefix` is the first characters only.
