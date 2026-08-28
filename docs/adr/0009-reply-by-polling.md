# ADR 0009 — Replies arrive by polling, not the run stream

Status: accepted
Date: 2026-08-28

## Decision

`POST /chat/send` starts the run and the BFF returns immediately. The client
then polls `GET /conversations/{id}/messages` every 1.2 seconds until the
agent's reply has settled, for at most 50 attempts (about a minute). The reply
is considered landed when the newest message is the agent's, its status is
`complete`, and its body is non-empty.

We do not consume `GET /chat/runs/{runId}/stream` (SSE). This amends the
transport half of [ADR 0002](0002-chat-transport.md). The host and endpoint
decisions in 0002 stand.

## Context

ADR 0002 chose the SSE run stream for streaming replies. Two things broke it
in practice:

1. The production BFF is a Vercel serverless function. Holding an SSE
   connection open for the length of an agent's thinking ties the request to a
   duration the platform will cut off mid-run.
2. `chat/send` returns before the reply message exists. A client that waits on
   the response, or opens the stream once, still needs a fallback when the
   connection drops.

Polling the messages endpoint needs no long-lived connection, survives any
restart, and works identically in local dev and on Vercel. The cost is up to
1.2 seconds of perceived latency and some wasted requests, which is fine for
an MVP.

The settle check matters: right after sending, the thread contains only the
user's message, which is indistinguishable from "finished". Waiting for the
newest message to be the agent's and complete is what makes the poll correct.
A streaming, empty-but-pending message is kept, because dropping it would tell
the client the thread had settled and stop it polling.

## Consequences

- One transport for dev, preview, and Vercel. No connection limits to reason about.
- Bounded polling: after ~60 seconds the client gives up rather than polling
  forever against a run that will never finish.
- Sending a draft's first message navigates to the real conversation, which
  unmounts the draft screen and its poll; the new screen starts its own.
- Perceived latency is the polling interval, not the network. Fine for MVP;
  revisit SSE only if the platform grows a long-running runtime.
