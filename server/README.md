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
| POST | `/v1/auth/login` | `{ email }` → `{ token }`, creates the user on first sight |
| GET | `/v1/auth/session` | who am I, and is a workspace connected |
| POST | `/v1/auth/logout` | revokes this session |
| POST | `/v1/auth/connect` | `{ key }`, validated against Skydive before it is stored |
| POST | `/v1/auth/disconnect` | forgets the key |

The key is AES-256-GCM encrypted with a key derived from `SESSION_SECRET`. It is
never returned to the client — `keyPrefix` is the first characters only.
