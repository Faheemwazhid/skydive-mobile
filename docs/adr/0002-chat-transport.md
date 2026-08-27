# ADR 0002 — Chat transport

Status: accepted  
Date: 2026-08-27

## Decision

Talk to agents through `POST https://www.skydive.com/api/v1/chat/send` and `GET .../api/v1/chat/runs/{runId}/stream`, with the same `sky_live_` key used for management. The BFF owns that call. The app uses `ChatPort`.

Do **not** POST to `https://<agent-id>.skydive.app`. That host is the agent's webserver.

Do **not** shell `skydive chat -p` in production. The CLI is the same HTTP; we call HTTP.

## Context

Public OpenAPI (`api.skydive.com/v1`) is management-only. Live probe 2026-08-27: send 200, stream `finished.status=ok`, reply `prototype-ok` against agent Chico. Agent-host OpenAI-style paths 404.

## Consequences

Frontend phase implements `ChatPort` with a delayed canned reply. Streaming UI can land with the BFF PR. Chat HTTP is undocumented; ignore unknown fields; isolate in one client module.
