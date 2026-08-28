# Skydive Mobile

An Expo client for Skydive, iOS and Android. Sign in, connect a workspace API key, and you are looking at your real agents and your real chat history on a phone.

It is a native translation of the Skydive web app, not a desktop layout squeezed into a phone. Four tabs: Agents, Chats, Templates, You.

## What actually works today

Everything below runs against the live Skydive API, not fixtures.

1. **Auth.** Sign in with any email. Paste an account-level `sky_live_` key. The key is validated against Skydive before it is stored.
2. **Agents.** Your real workspace roster, with each agent's real model, plus a profile screen.
3. **Chats.** Real conversation list, real message history, send a message and get a real reply.
4. **Create.** The create sheet and template Add to team both create a real agent in your workspace.
5. **Templates.** A local catalog with detail screens.

Two things are deliberately still local: the seven brand characters (Skydive has no character field, so we store our own mapping) and the template catalog copy.

## Where the key lives

Not on the phone. Ever.

The app talks only to a small BFF, and the BFF is the only thing that talks to Skydive. The key is AES-256-GCM encrypted at rest, keyed off `SESSION_SECRET`, and never returned to the client. Session tokens are stored as SHA-256 hashes.

That constraint drove the architecture, so it is worth reading before you review: [ADR 0005](docs/adr/0005-no-key-on-device.md) and [ADR 0007](docs/adr/0007-bff-and-our-database.md).

## Run it from nothing

You need Node 24 or newer (the server runs TypeScript directly), any Postgres, and a phone with Expo Go if you want it on a real device.

1. Install.

   ```bash
   git clone <this repo> && cd skydive-mobile
   npm install
   ```

2. Start the backend. It creates its schema on boot, so there is no migration step.

   ```bash
   export DATABASE_URL="postgres://user:pass@host/db"
   export SESSION_SECRET="$(openssl rand -base64 24)"   # 16 chars minimum or it refuses to start
   npm run server                                       # :8787, BFF_PORT to override
   ```

   Check it: `curl localhost:8787/health` returns `{"ok":true}`.

3. Point the app at the backend.

   ```bash
   cp .env.example .env
   ```

   On a simulator, the default `http://localhost:8787` is fine. On a real phone, set `EXPO_PUBLIC_BFF_URL` to your machine's LAN address, for example `http://192.168.1.20:8787`. `localhost` on a phone means the phone.

4. Start the app.

   ```bash
   npx expo start        # scan the QR with Expo Go, or press i / a / w
   ```

5. Get through the first screen. Sign in with any email, then paste an **account-level** `sky_live_` key from the Skydive web app. An agent-scoped key is rejected with a clear message, because it cannot enumerate a workspace.

No key handy? Skip the connect step. Templates and You still work, and the other tabs show their empty states with a Connect prompt.

## Checks

There is no single `npm test`. Run these:

```bash
npm run typecheck          # app
npm run typecheck:server   # BFF
npm run test:session
npm run test:agents
npm run test:feed
npm run test:chat
npm run test:bff           # needs DATABASE_URL, SESSION_SECRET, and a real key for the live half
```

`test:bff` is the interesting one. It boots the server and drives the real auth, agents, and chat paths end to end, including asserting that the plaintext key is not in the database row.

## Reading the code

- [`app/`](app) is the routes. Expo Router file based, `(auth)` and `(tabs)`.
- [`src/`](src) is everything else, split by concern: `agents`, `chat`, `session`, `templates`, `components`, `theme`.
- [`server/`](server) is the BFF. Start at `server/src/index.ts`, then `routes/`. [server/README.md](server/README.md) has the endpoint table.

Design docs, in the order they help:

- [MVP scope](docs/MVP.md), what is in and what is out
- [Architecture](docs/ARCHITECTURE.md), ports, data, chat transport
- [ADRs](docs/adr/README.md), the decisions and why

## Out of scope for MVP

These are choices, not gaps. Please do not file them as bugs.

- Computer tab, files, live browser
- Channel connect for Slack, Email, or iMessage
- Routines, billing, a settings stack
- Model picker on mobile, agents created here always use `openai/gpt-5.6-luna`
- Skill counts and skill detail anywhere in Templates

## Rules for new PRs

- Never put a `sky_live_` key in the app, logs, or fixtures.
- Do not call `https://<agent-id>.skydive.app` for chat. See [ADR 0002](docs/adr/0002-chat-transport.md).
- In-app creates use `openai/gpt-5.6-luna`. Do not add a model picker.
- Do not widen the MVP scope in a UI PR. Change [docs/MVP.md](docs/MVP.md) first.
- One concern per PR. The history is small and readable, keep it that way.
