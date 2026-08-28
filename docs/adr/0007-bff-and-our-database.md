# ADR 0007 — BFF scope, and what our database actually stores

Status: accepted
Date: 2026-08-27

## Decision

A Hono BFF holds the workspace `sky_live_` key and is the only thing that talks
to Skydive. Our Postgres stores **three** things:

| Table | Why it is ours |
|---|---|
| `users` | Our auth, not Skydive's (and the encrypted key, since [ADR 0008](0008-key-is-the-login.md) folded the old `workspaces` table into it) |
| `sessions` | Our session tokens |
| `agent_characters` | `characterId` is our concept; Skydive has no such field |

We do **not** store conversations or messages.

## Context

`docs/ARCHITECTURE.md` originally planned our own `conversations` and `messages`
tables. Probing the live API on 2026-08-27 showed that is wrong:

```
GET /api/v1/conversations           -> { conversations[], nextCursor, totalCount }
GET /api/v1/conversations/{id}/messages -> { messages[], hasMore, nextBefore }
```

Both work with the same API key. Skydive already is the source of truth for chat
history, and it is the history the user sees on web, Slack, and iMessage. Keeping
a second copy would duplicate it and drift the moment the user talks to the agent
anywhere else. So chat is read through, not mirrored.

The opposite is true for `characterId`. `GET /v1/agents` returns
`{ id, name, description, model, url, gitUrl }` and no character. The mock
assigned characters locally. With live data, every agent would fall back to the
grey placeholder unless we persist our own assignment. That is a genuine reason
for our own table, and it is what `agent_characters` is for.

## Consequences

- Chat history survives across devices and channels for free.
- Our schema is four small tables instead of six, with no sync problem.
- Agents created outside the app get a character on first sight (assigned
  deterministically from the agent id) so the roster never looks broken.
- If Skydive is down, the app cannot show history. Acceptable: it cannot chat
  either.

## Alternatives rejected

- **Mirror conversations into our DB.** Two sources of truth, guaranteed drift,
  no user benefit for an MVP.
- **Store characters in the agent's Skydive description.** Pollutes a
  user-visible field with our metadata.
