# ADR 0005 — API key never on device

Status: accepted  
Date: 2026-08-27

## Decision

`sky_live_` is collected on Connect, then either discarded (frontend phase) or sent once to our BFF (next phase). It is not in SecureStore, source, logs, or fixtures.

Management and chat both use that key **on the BFF**.

## Context

Docs: a key carries authority to act on agents. Keep it out of client-side code.

## Consequences

BFF is required for live roster and live chat. Expo app auth is *our* session, not Skydive's.
