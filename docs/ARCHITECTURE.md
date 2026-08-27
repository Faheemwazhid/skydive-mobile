# Architecture

Frontend-first Expo app. A BFF and our Postgres land after the UI is real. Screens talk to ports, never to Skydive types.

## Classification

Feature (greenfield). Success: a reviewer logs in, connects a key, sees agents, opens a thread, sends a message.

## Boundaries

```
Expo app (our session only)
    → Ports: AgentsRepo, ChatPort, SessionStore
         now: in-memory fixtures
         later: HTTP to our BFF
    → BFF (later)
         → Postgres (users, encrypted workspace key, our threads)
         → https://api.skydive.com/v1   agents, keys, secrets
         → https://www.skydive.com/api/v1/chat/send + run SSE
```

The phone never holds `sky_live_`. Connect collects it; the frontend phase does not persist it. The BFF phase encrypts it at rest and uses it only outbound.

## Data shape

```
User            id, email
Session         our JWT later; mock boolean now
Workspace       connected: boolean, keyPrefix?: string
Agent           id, name, description?, model, url?, characterId?
Conversation    id, agentId, title, updatedAt
Message         id, conversationId, role: user | agent, body, status: pending | sent | failed
Template        id, name, characterId, blurb, worksWith[], whatYouGet[]
FeedItem        id, kind: joined | new_chat | replied, agentId, at
```

Illegal states:

- A client request that includes a `sky_live_` key except Connect (and Connect does not store it on device).
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
  }): Promise<{ conversationId: string; messageId: string; reply: string }>
}

type SessionStore = {
  get(): Promise<{ email: string | null; connected: boolean }>
  login(email: string): Promise<void>
  logout(): Promise<void>
  connectKey(key: string): Promise<void> // frontend: set connected=true if key nonempty
  skipConnect(): Promise<void>
}
```

`create` on `AgentsRepo` is the only write that assigns Luna. Agents from `list` keep whatever `model` the source provided.

## Chat HTTP (verified 2026-08-27)

Not the agent webserver. `https://<id>.skydive.app` is the agent's hosted app; OpenAI-style paths 404.

Management: `https://api.skydive.com/v1` + `Authorization: Bearer sky_live_…`

Chat (what `skydive chat -p` uses):

```
POST https://www.skydive.com/api/v1/chat/send
{
  agentId, conversationId: uuid | null,
  content, attachmentIds: [], clientSurface: "cli"
}

GET https://www.skydive.com/api/v1/chat/runs/{runId}/stream
Accept: text/event-stream
```

Text-delta chunks assemble the reply. Persist `conversationId`, `messageId`, `runId`.

This is not in public OpenAPI. Treat unknown fields as additive.

## Navigation

| Route | Surface |
|---|---|
| `(auth)/login` | email + continue |
| `(auth)/connect` | paste key or Skip |
| `(tabs)/team` | roster + feed |
| `(tabs)/chats` | conversation list |
| `(tabs)/templates` | catalog |
| `(tabs)/you` | account |
| `agent/[id]` | profile |
| `chat/[id]` | thread |
| `templates/[id]` | detail |
| `create-agent` | sheet |

New chat: pick-agent sheet → empty thread. Team / profile Message opens latest thread for that agent, or creates one.

## Frontend vs BFF

| Phase | SessionStore.connectKey | AgentsRepo.list | ChatPort.send |
|---|---|---|---|
| Now | nonempty key → connected fixture workspace | fixture agents in API shape | local bubble + delayed canned markdown |
| Next | POST key to BFF; BFF validates `GET /v1/agents?limit=1` | BFF `GET /v1/agents` | BFF `chat/send` + SSE |

Screens do not change.

## Verification

No complexity checker in a new Expo app. Keep functions at cyclomatic complexity ≤ 10 by inspection. Typecheck (`tsc`) and Expo start are the gates until we add tests with the first stateful PR.

## Non-goals until a later ADR

BFF implementation, encrypted key vault, push, Portal, Computer, live integrations, Aeonik (Inter fallback).
