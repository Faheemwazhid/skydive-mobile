# MVP scope (agreed)

Locked 2026-08-27 with Faheem. Do not expand this list in a UI PR without a new decision.

## Job

A phone client that feels like Skydive: after login, paste a `sky_live_` key, see *your* agents, talk to them, hire from templates or a create sheet. Native translation of the web app, not a squeezed desktop.

## Hero loop (60 seconds)

Login → Connect key → Agents → Message → thread.

## Stack

Expo + React Native, iOS + Android. Frontend first (typed mock repo in real API shapes). BFF later, same screens.

## Tabs

Agents · Chats · Templates · You.

Profile and create-agent are pushes / sheets, not tabs.

## In

- Chat list + thread (markdown, composer)
- Agents roster + activity feed under it
- Create agent (seven brand characters, name, purpose)
- Agent profile: dusk cover, avatar, role, Message, recent chats, model as a one-liner
- Templates catalog + detail + Add to team
- You: email, appearance (system / light), logout, login

## Out

- Computer tab / files / live browser
- Channel connect (Slack / Email / iMessage)
- Routines, billing, Settings stack
- Model picker / compute change on mobile
- Skill inside / skill counts
- Calling `api.skydive.com` from the device

## Auth / key

Login (email + continue; always succeeds in the frontend phase) → Connect Skydive.

Continue with any non-empty key, or Skip. The key never lives in the app binary.

This phase: fixtures in API shape. Next: BFF stores the key, `GET /v1/agents` replaces fixtures.

## Two UI states

**No key.** Empty Agents / Chats / feed + Connect CTA. Templates and You still work.

**Connected.** Roster from agents. Feed cards are joined / new chat / replied only (no file-share or skill-install cards).

## Agents and model

- Roster is the workspace as-is. Show the real `model` from the API.
- Agents **created in this app** (create sheet or template Add) always use `openai/gpt-5.6-luna`.
- No model switcher on mobile. Change model on the web.

## Templates

- Catalog like the web shots, **no skill counts**.
- Detail: Works with + What you get + Add. No Skill inside. Works with is copy, not a live integration.
- Add to team, later: `POST /v1/agents` `{ name, model: "openai/gpt-5.6-luna" }`. This phase: mock-append name + character + Luna.
- Public create API has no template slug, skills, or integrations. We do not pretend it does.

## Create sheet

Seven brand characters, Name, Purpose, Get started. Template shortcuts jump to Templates. Static character image. No 3D preview.

## Chat

- List: search, New.
- New → pick agent → empty thread.
- Agents row / profile Message → latest thread with that agent, or create one.
- Thread: header, markdown bubbles, composer (text + stub attach + send).
- Frontend phase: fixture thread + delayed canned agent reply.
- Later: `POST https://www.skydive.com/api/v1/chat/send` then SSE on `/api/v1/chat/runs/{runId}/stream`. Same `sky_live_` key as management. Not `https://<agent-id>.skydive.app`.
- No header usage / channels / files button.

## Profile

Cover + character + name/role + Message + recent chats + model one-liner.

No Posts / Routines / Computer / integrations rail.
