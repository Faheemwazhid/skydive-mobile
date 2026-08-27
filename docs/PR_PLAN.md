# Pull request plan

One concern per PR. Merge to `main` before starting the next unless a PR is blocked on review.

## Sequence

| # | Branch | What lands | Done when |
|---|---|---|---|
| 1 | `docs/architecture` | This docs tree: MVP, architecture, ADRs, this plan | Reviewer can implement UI without re-litigating scope |
| 2 | `feat/bootstrap-expo` | `create-expo-app`, TypeScript, Expo Router, Inter, brand tokens as constants | `npx expo start` boots a blank shell with tokens imported |
| 3 | `feat/design-system` | Color, type, spacing, Button, Screen, Avatar (character), empty-state | Tokens match `docs/adr/0006-visual-language.md`; no screens yet |
| 4 | `feat/session-and-auth` | `SessionStore` mock, login, connect-key, skip, logout | Can walk login → connect → tabs → logout |
| 5 | `feat/agents-repo` | `Agent` type, mock `AgentsRepo`, create (always Luna) | Unit-level: create returns Luna; list preserves fixture models |
| 6 | `feat/team-tab` | Roster + feed (joined / new chat / replied) + empty Connect CTA | Matches MVP two-states |
| 7 | `feat/chats` | Conversation list, New → pick agent, thread, canned send | Markdown bubbles; stub attach |
| 8 | `feat/agent-profile` | Cover, character, Message, recent chats, model one-liner | No Computer / Posts / Routines |
| 9 | `feat/create-agent` | Character picker, name, purpose, Get started | Appends via `AgentsRepo.create` |
| 10 | `feat/templates` | Catalog, detail (Works with / What you get), Add to team | Add calls `create` with template name + character; no skills |
| 11 | `feat/you-tab` | Email, appearance, logout | Basic H only |
| 12 | `feat/bff-chat` | Later. Hono BFF, key vault, live list + `chat/send` | Same screens, live data |

PRs 6–11 may ship as smaller follow-ups if a tab gets large. Do not combine templates with create-agent (two entry points, one `create`).

## Rules

- Screens import ports from `src/domain`, not fetch.
- No `sky_live_` in source, logs, or fixtures.
- No Computer, skills, model picker, or channel connect UI.
- Each PR states which ADR it implements.
