# Skydive Mobile

Expo iOS + Android client for Skydive. After login you connect a workspace API key, see your agents, talk to them, and hire from templates.

Built as small pull requests. Start here:

- [MVP scope](docs/MVP.md) — what is in and out
- [Architecture](docs/ARCHITECTURE.md) — ports, data, chat HTTP
- [PR plan](docs/PR_PLAN.md) — one concern per PR
- [ADRs](docs/adr/README.md) — decisions

## Status

Live. The app talks to a BFF that holds your Skydive API key and calls Skydive
for agents and chat.

```bash
npm install

# 1. the backend
export DATABASE_URL="postgres://…"
export SESSION_SECRET="$(openssl rand -base64 24)"
npm run server                     # :8787

# 2. the app
cp .env.example .env               # point EXPO_PUBLIC_BFF_URL at the BFF
npx expo start
```

Sign in with any email, paste an account-level `sky_live_` key, and the roster
is your real workspace. See [server/README.md](server/README.md).

## Constraints (do not violate in PRs)

- Never put a `sky_live_` key in the app, logs, or fixtures.
- Do not call `https://<agent-id>.skydive.app` for chat.
- In-app creates always use `openai/gpt-5.6-luna`. Do not add a model picker.
- No Computer tab, skills, routines, or channel connect in MVP.
