# Architecture

An Expo app on a Hono BFF. The phone carries only our session token. The BFF holds the workspace key and is the only thing that talks to Skydive.

## Boundaries

```
Expo app (our session token only)
    → Ports: AgentsRepo, ChatPort, SessionStore
         HTTP implementations in src/agents, src/chat, src/session
    → BFF (Hono, server/src)
         → Postgres (users, sessions, agent_characters)
         → https://api.skydive.com/v1          agents (management)
         → https://www.skydive.com/api/v1      chat (send, conversations)
```

The phone never holds `sky_live_`. Connect posts it once over HTTPS; the BFF encrypts it at rest and uses it only outbound.

## Data shape

```
User            id, keyHash, keyCiphertext, keyPrefix, displayName?
Session         opaque token (SHA-256 at rest), userId, expiresAt
Agent           id, name, description?, model, url?, characterId?
Conversation    id, agentId, title, updatedAt
Message         id, conversationId, role: user | agent, body, status: pending | sent | failed
Template        id, name, characterId, blurb, worksWith[], whatYouGet[]
```

Users and sessions live in our Postgres. Agents, conversations, and messages live in Skydive and are read through, never mirrored. `characterId` is our concept (ADR 0007).

Illegal states:

- A client request that includes a `sky_live_` key except Connect.
- Secret values or full API keys in any GET.
- A model picker mutating `Agent.model` from mobile.
- Skill counts on templates.

## Ports

```ts
type AgentsRepo = {
  list(): Promise<Agent[]>
  get(id: string): Promise<Agent | null>
  create(input: { name: string; purpose?: string; characterId: string }): Promise<Agent>
  // create always sets model openai/gpt-5.6-luna
}

type ChatPort = {
  listConversations(): Promise<Conversation[]>
  listMessages(conversationId: string): Promise<Message[]>
  send(input: {
    agentId: string
    conversationId?: string
    prompt: string
  }): Promise<{ conversationId: string; messageId: string }>
}

type SessionStore = {
  get(): Session
  subscribe(listener: () => void): () => void
  restore(): Promise<void>          // validates a remembered token with the server
  connectKey(key: string, remember: boolean): Promise<void>
  setDisplayName(name: string): Promise<void>
  logout(): Promise<void>
}
```

The key is the login (ADR 0008). There is no email step and no skip.

## Chat transport (verified 2026-08-27)

Not the agent webserver. `https://<id>.skydive.app` is the agent's hosted app; OpenAI-style paths 404.

Management: `https://api.skydive.com/v1` + `Authorization: Bearer sky_live_…`

Chat (what `skydive chat -p` uses):

```
POST https://www.skydive.com/api/v1/chat/send
{ agentId, conversationId: uuid | null, content, attachmentIds: [], clientSurface: "cli" }
→ { runId, conversationId, messageId }   returns before the reply exists

GET https://www.skydive.com/api/v1/conversations/{id}/messages?limit=100
→ { messages[] }   poll until the reply settles
```

Sends are fire-and-forget; replies arrive by polling (ADR 0009). Not in public OpenAPI; treat unknown fields as additive.

## Navigation

| Route | Surface |
|---|---|
| `(auth)/connect` | paste the key, remember-me checkbox |
| `(auth)/name` | pick a display name (once) |
| `(tabs)/agents` | roster |
| `(tabs)/agents/[id]` | agent profile |
| `(tabs)/agents/create` | create sheet |
| `(tabs)/chats` | conversation list |
| `(tabs)/chats/[id]` | thread (`new`/`tnew` = draft) |
| `(tabs)/chats/new` | agent picker |
| `(tabs)/templates` | catalog |
| `(tabs)/templates/[id]` | template detail |
| `(tabs)/you` | identity, workspace, logout |

Detail screens are nested inside their tab's stack so the bottom nav stays visible. Every pushed screen has a back control.

New chat: pick-agent sheet → empty thread. Agent profile Message opens the latest thread for that agent, or creates one.

## Session lifecycle

1. Connect posts the key to the BFF. The BFF validates it against Skydive, stores it encrypted, and returns a session token.
2. The token lives in localStorage (remembered, 15 days) or sessionStorage (12 hours) on web; in memory only on native.
3. Restore asks the server to confirm a remembered token before trusting it. A rejection clears it and returns to Connect.
4. Logout revokes the session server-side and clears local state.

`/v1/auth/connect` is rate limited: 5 attempts per 15 minutes per IP.

## Verification

```bash
npm run typecheck          # app
npm run typecheck:server   # BFF
npm test                   # 6 offline suites
npm run test:bff           # 26 checks against the live API, needs env + real key
npm run build:web && npm run preview   # the Vercel shape, same origin
```

No complexity linter in the repo. Keep functions at cyclomatic complexity ≤ 10 by inspection; a whole-codebase review on 2026-08-28 found none over.

CI is not wired up yet. `docs/ci.yml.proposed` is ready once the repo has a token with GitHub's `workflow` scope.

## Non-goals until a later ADR

Push, Portal, Computer, live integrations, SSE streaming, Aeonik (Inter fallback).
