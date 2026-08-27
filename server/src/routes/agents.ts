import { Hono } from 'hono';
import { z } from 'zod';

import {
  CHARACTER_IDS,
  characterForAgentId,
  type CharacterId,
} from '../../../src/domain/characters';
import { queryAll, queryOne } from '../db';
import { requireSession, workspaceKey, type AppEnv } from '../session';
import { MANAGEMENT_BASE, skydiveJson } from '../skydive';

/** Every agent this app creates runs on Luna. See ADR 0004. */
const IN_APP_MODEL = 'openai/gpt-5.6-luna';

/**
 * Skydive's agent shape. `.passthrough()` because v1 is additive — unknown
 * fields must not fail the parse.
 */
const skydiveAgent = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    model: z.string().nullish(),
    url: z.string().nullish(),
  })
  .passthrough();

const listResponse = z
  .object({
    agents: z.array(skydiveAgent),
    nextCursor: z.string().nullish(),
  })
  .passthrough();

const agentResponse = z.object({ agent: skydiveAgent }).passthrough();

const createBody = z.object({
  name: z.string().trim().min(1).max(120),
  purpose: z.string().trim().max(600).optional(),
  characterId: z.enum(CHARACTER_IDS),
});

/**
 * Skydive agent ids are UUIDs, and it answers 500 — not 404 — to a malformed
 * one. Checking the shape here keeps garbage from reaching upstream and turns
 * a confusing 502 into an honest 404.
 */
const AGENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SkydiveAgent = z.infer<typeof skydiveAgent>;

export type AgentDto = {
  id: string;
  name: string;
  description: string | null;
  model: string;
  url: string | null;
  characterId: CharacterId;
};

async function characterOverrides(
  workspaceId: string,
): Promise<Map<string, CharacterId>> {
  const rows = await queryAll<{ agent_id: string; character_id: string }>(
    'SELECT agent_id, character_id FROM agent_characters WHERE workspace_id = $1',
    [workspaceId],
  );
  const map = new Map<string, CharacterId>();
  for (const row of rows) {
    map.set(row.agent_id, row.character_id as CharacterId);
  }
  return map;
}

function toDto(
  agent: SkydiveAgent,
  overrides: Map<string, CharacterId>,
): AgentDto {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description ?? null,
    model: agent.model ?? 'unknown',
    url: agent.url ?? null,
    characterId: overrides.get(agent.id) ?? characterForAgentId(agent.id),
  };
}

export const agentRoutes = new Hono<AppEnv>();

agentRoutes.use('*', requireSession);

/** 409 rather than 401: the session is fine, the workspace just is not linked. */
agentRoutes.use('*', async (c, next) => {
  if (!c.get('viewer').workspaceId) {
    return c.json({ error: 'no workspace connected', code: 'not_connected' }, 409);
  }
  await next();
});

agentRoutes.get('/', async (c) => {
  const viewer = c.get('viewer');
  const key = await workspaceKey(viewer.userId);
  if (!key) return c.json({ error: 'no workspace connected' }, 409);

  const raw = await skydiveJson<unknown>(
    `${MANAGEMENT_BASE}/agents?limit=100&scope=org`,
    key,
  );
  const parsed = listResponse.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'unexpected response from Skydive' }, 502);
  }

  const overrides = await characterOverrides(viewer.workspaceId as string);
  return c.json({
    agents: parsed.data.agents.map((a) => toDto(a, overrides)),
  });
});

agentRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  if (!AGENT_ID.test(id)) {
    return c.json({ error: 'not found', code: 'not_found' }, 404);
  }

  const viewer = c.get('viewer');
  const key = await workspaceKey(viewer.userId);
  if (!key) return c.json({ error: 'no workspace connected' }, 409);

  const raw = await skydiveJson<unknown>(
    `${MANAGEMENT_BASE}/agents/${encodeURIComponent(id)}`,
    key,
  );
  const parsed = agentResponse.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'unexpected response from Skydive' }, 502);
  }

  const overrides = await characterOverrides(viewer.workspaceId as string);
  return c.json({ agent: toDto(parsed.data.agent, overrides) });
});

agentRoutes.post('/', async (c) => {
  const parsed = createBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'name and characterId are required' }, 400);
  }
  const viewer = c.get('viewer');
  const key = await workspaceKey(viewer.userId);
  if (!key) return c.json({ error: 'no workspace connected' }, 409);

  const raw = await skydiveJson<unknown>(`${MANAGEMENT_BASE}/agents`, key, {
    method: 'POST',
    body: JSON.stringify({
      name: parsed.data.name,
      model: IN_APP_MODEL,
    }),
  });
  const created = agentResponse.safeParse(raw);
  if (!created.success) {
    return c.json({ error: 'unexpected response from Skydive' }, 502);
  }

  // Remember the chosen character; Skydive has no field for it (ADR 0007).
  await queryOne(
    `INSERT INTO agent_characters (workspace_id, agent_id, character_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (workspace_id, agent_id)
       DO UPDATE SET character_id = EXCLUDED.character_id
     RETURNING agent_id`,
    [viewer.workspaceId, created.data.agent.id, parsed.data.characterId],
  );

  const overrides = new Map<string, CharacterId>([
    [created.data.agent.id, parsed.data.characterId],
  ]);
  return c.json({ agent: toDto(created.data.agent, overrides) }, 201);
});
