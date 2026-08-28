# BFF

Holds the workspace `sky_live_` key and is the only thing that talks to Skydive.
See [ADR 0007](../docs/adr/0007-bff-and-our-database.md) for what our database
stores and, more importantly, what it does not.

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

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | liveness |
| POST | `/v1/auth/connect` | `{ key, remember }` → `{ token, displayName, keyPrefix, expiresAt }`. The key is the login (ADR 0008): validated against Skydive, then its SHA-256 finds or creates the user |
| GET | `/v1/auth/session` | who am I |
| POST | `/v1/auth/name` | `{ name }`, our own field. Skydive has no profile endpoint |
| POST | `/v1/auth/logout` | revokes this session |

Sessions last 15 days when `remember` is true and 12 hours when it is not.

The key is AES-256-GCM encrypted with a key derived from `SESSION_SECRET`. It is
never returned to the client — `keyPrefix` is the first characters only.
