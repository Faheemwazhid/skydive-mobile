# ADR 0008 — The Skydive key is the login

Status: accepted
Date: 2026-08-28

## Decision

There is no email login and no password. `POST /v1/auth/connect` takes a
`sky_live_` key, validates it against Skydive, and its SHA-256 identifies the
user. A session token is returned; the key itself is stored only as
AES-256-GCM ciphertext.

A display name is collected once, on our own screen, and stored in our
database. It is required before the app opens.

"Remember this device" extends the session to 15 days and persists the token
in `localStorage`. Unchecked, the session lasts 12 hours and the token lives in
`sessionStorage`, so it dies with the tab.

## Context

Login used to accept any email and immediately issue a session. Typing a
stranger's email returned their session, their connected workspace, and the
ability to drive their agents. Encrypting the key at rest bought nothing once
an attacker was inside the account.

Three fixes were on the table: email codes, a password, or removing the email
step. The key was already being collected on the very next screen, already
validated against Skydive, and already unforgeable. Adding a second credential
in front of it would have secured the door next to the open one.

Skydive has no profile endpoint. `/me`, `/user`, `/account` and the rest all
return 404, and conversations carry no human identity, so there is nothing to
read a name from. Hence our own field.

## Consequences

- Identity is the workspace, not the person. Two people sharing a key are one
  user to us, and per-person preferences are not possible without a second
  credential.
- Rotating the key in Skydive creates a new identity here, with a new display
  name prompt. Acceptable: the old row keeps nothing but a name.
- The `workspaces` table is gone. A user and a connected workspace are the same
  row, so `agent_characters` hangs off `user_id`.
- `connected` is no longer a state the UI can be in. The empty "connect your
  workspace" branches in Agents and Chats were deleted.
- On web the token is readable by any script on the origin. An httpOnly cookie
  would be stronger and is the obvious next step if this stops being a demo.
