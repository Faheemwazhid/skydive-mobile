# ADR 0003 — Ports first, mocks now

Status: accepted  
Date: 2026-08-27

## Decision

Screens depend on `AgentsRepo`, `ChatPort`, and `SessionStore`. Frontend phase: in-memory implementations that match API shapes. BFF phase: swap implementations, not screens.

Connect-key UI exists now. A nonempty key or Skip flips `connected`. The real key is not stored on device and is not sent to Skydive from the app.

## Context

Product requires login → API key → live roster, and also UI before a BFF. Fixtures in the API shape let us design Team / Chats / Profile without lying about Computer or skills.

## Consequences

Two states (no key / connected) are first-class. Empty states are designed. Fixture agents disappear when the BFF lists real ones.
