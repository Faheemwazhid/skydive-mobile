# MVP scope (agreed)

Locked 2026-08-27 with Faheem. Do not expand this list in a UI PR without a new decision.

## Job

A phone client that feels like Skydive: paste a `sky_live_` key, see *your* agents, talk to them, hire from templates or a create sheet. Native translation of the web app, not a squeezed desktop.

## Hero loop (60 seconds)

Connect key → name → Agents → Message → thread.

## Stack

Expo + React Native, iOS + Android, on a Hono BFF with our Postgres. Live Skydive data end to end.

## Tabs

Agents · Chats · Templates · You.

Profile and create-agent are pushes / sheets, not tabs.

## In

- Chat list + thread (markdown, composer)
- Agents roster
- Create agent (seven brand characters, name, purpose)
- Agent profile: dusk cover, avatar, role, Message, recent chats, model as a one-liner
- Templates catalog + detail + Add to team
- You: identity, workspace status, logout

## Out

- Computer tab / files / live browser
- Channel connect (Slack / Email / iMessage)
- Routines, billing, Settings stack
- Model picker / compute change on mobile
- Skill inside / skill counts
- Activity feed (Skydive has no activity API; probed 2026-08-28)
- Appearance toggle (app is light-only)

## Auth / key

The key is the login (ADR 0008). No email, no password, no skip. Connect validates the key against Skydive, stores it encrypted on the BFF, and asks for a display name once. Connect is rate limited: 5 attempts per 15 minutes per IP.

## Agents and model

- Roster is the workspace as-is. Show the real `model` from the API.
- Agents **created in this app** (create sheet or template Add) always use `openai/gpt-5.6-luna`.
- No model switcher on mobile. Change model on the web.

## Templates

- Catalog like the web shots, **no skill counts**.
- Detail: Works with + What you get + Add. No Skill inside. Works with is copy, not a live integration.
- Add to team: `POST /v1/agents` `{ name, model: "openai/gpt-5.6-luna" }` plus our character row.
- Public create API has no template slug, skills, or integrations. We do not pretend it does.

## Create sheet

Seven brand characters, Name, Purpose, Get started. Template shortcuts jump to Templates. Static character image. No 3D preview.

## Chat

- List: search, New.
- New → pick agent → empty thread.
- Agents row / profile Message → latest thread with that agent, or create one.
- Thread: header, markdown bubbles, composer (text + stub attach + send).
- Live: `POST /api/v1/chat/send`, then poll the messages endpoint until the reply settles (ADR 0009). Not `https://<agent-id>.skydive.app`.
- No header usage / channels / files button.

## Profile

Cover + character + name/role + Message + recent chats + model one-liner.

No Posts / Routines / Computer / integrations rail.
