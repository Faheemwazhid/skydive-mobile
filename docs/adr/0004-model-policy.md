# ADR 0004 — Model policy

Status: accepted  
Date: 2026-08-27

## Decision

Agents created **in this app** (create sheet or template Add to team) always set `model` to `openai/gpt-5.6-luna`.

Agents created on the web keep the `model` returned by `GET /v1/agents`. The mobile app never offers a model switcher.

## Context

One model in MVP for in-app hiring. The workspace still contains Eggplant (Grok) and others. Displaying Luna on everyone would be a lie once live data is on.

Public create API: `{ name, model? }`. We pass Luna. We cannot install skills or integrations.

## Consequences

Profile shows model as a one-liner. Template Add is name + character + Luna. Skills are out of MVP.
