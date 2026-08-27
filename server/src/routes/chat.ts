import { Hono } from 'hono';
import { z } from 'zod';

import { requireSession, workspaceKey, type AppEnv } from '../session.ts';
import { APP_BASE, skydiveFetch, skydiveJson } from '../skydive.ts';

/** A run can take a while; give it longer than a normal request. */
const RUN_TIMEOUT_MS = 120_000;

const conversation = z
  .object({
    id: z.string(),
    title: z.string().nullish(),
    updatedAt: z.string().nullish(),
    createdAt: z.string().nullish(),
    agent: z.object({ id: z.string() }).passthrough().nullish(),
  })
  .passthrough();

const conversationList = z
  .object({ conversations: z.array(conversation) })
  .passthrough();

/** Skydive messages are AI-SDK UIMessages: content lives in `parts`. */
const message = z
  .object({
    id: z.string(),
    role: z.string(),
    parts: z
      .array(z.object({ type: z.string(), text: z.string().nullish() }).passthrough())
      .nullish(),
  })
  .passthrough();

const messageList = z.object({ messages: z.array(message) }).passthrough();

const sendResult = z
  .object({
    runId: z.string(),
    conversationId: z.string(),
    messageId: z.string().nullish(),
  })
  .passthrough();

const sendBody = z.object({
  agentId: z.string().min(1),
  conversationId: z.string().uuid().nullish(),
  prompt: z.string().trim().min(1).max(8000),
});

const CONVERSATION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bodyOf(parts: { type: string; text?: string | null }[] | null | undefined): string {
  if (!parts) return '';
  return parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
    .trim();
}

/** Skydive says `assistant`; our domain says `agent`. */
function roleOf(role: string): 'user' | 'agent' {
  return role === 'user' ? 'user' : 'agent';
}

/**
 * Reads a run's SSE stream to completion and returns the assembled text.
 * Chunk shapes confirmed against the live API: text arrives as `text-delta`
 * frames wrapped in `{ kind: 'chunk', chunk: {...} }`, terminated by
 * `{ kind: 'finished' }`.
 */
async function collectRun(runId: string, key: string): Promise<string> {
  const res = await skydiveFetch(
    `${APP_BASE}/chat/runs/${encodeURIComponent(runId)}/stream`,
    key,
    { headers: { accept: 'text/event-stream' } },
  );
  if (!res.body) return '';

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const deadline = Date.now() + RUN_TIMEOUT_MS;
  let buffer = '';
  let reply = '';

  while (Date.now() < deadline) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const event = parseFrame(frame);
      if (!event) continue;
      if (event.kind === 'finished') {
        await reader.cancel().catch(() => undefined);
        return reply;
      }
      reply += event.delta;
    }
  }
  await reader.cancel().catch(() => undefined);
  return reply;
}

type Frame = { kind: 'chunk'; delta: string } | { kind: 'finished' };

function parseFrame(frame: string): Frame | null {
  const data = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('');
  if (!data) return null;

  let event: unknown;
  try {
    event = JSON.parse(data);
  } catch {
    return null;
  }
  const record = event as { kind?: string; chunk?: { type?: string; delta?: unknown } };
  if (record.kind === 'finished') return { kind: 'finished' };
  if (record.chunk?.type === 'text-delta' && typeof record.chunk.delta === 'string') {
    return { kind: 'chunk', delta: record.chunk.delta };
  }
  return null;
}

export const chatRoutes = new Hono<AppEnv>();

chatRoutes.use('*', requireSession);
chatRoutes.use('*', async (c, next) => {
  if (!c.get('viewer').workspaceId) {
    return c.json({ error: 'no workspace connected', code: 'not_connected' }, 409);
  }
  await next();
});

chatRoutes.get('/conversations', async (c) => {
  const key = await workspaceKey(c.get('viewer').userId);
  if (!key) return c.json({ error: 'no workspace connected' }, 409);

  const raw = await skydiveJson<unknown>(`${APP_BASE}/conversations?limit=50`, key);
  const parsed = conversationList.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'unexpected response from Skydive' }, 502);
  }

  return c.json({
    conversations: parsed.data.conversations
      .filter((item) => item.agent?.id)
      .map((item) => ({
        id: item.id,
        agentId: item.agent?.id as string,
        title: item.title?.trim() || 'Untitled',
        updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
      })),
  });
});

chatRoutes.get('/conversations/:id/messages', async (c) => {
  const id = c.req.param('id');
  if (!CONVERSATION_ID.test(id)) {
    return c.json({ error: 'not found', code: 'not_found' }, 404);
  }
  const key = await workspaceKey(c.get('viewer').userId);
  if (!key) return c.json({ error: 'no workspace connected' }, 409);

  const raw = await skydiveJson<unknown>(
    `${APP_BASE}/conversations/${encodeURIComponent(id)}/messages?limit=100`,
    key,
  );
  const parsed = messageList.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'unexpected response from Skydive' }, 502);
  }

  return c.json({
    messages: parsed.data.messages
      .map((m) => ({
        id: m.id,
        conversationId: id,
        role: roleOf(m.role),
        body: bodyOf(m.parts),
        status: 'sent' as const,
      }))
      .filter((m) => m.body.length > 0),
  });
});

/**
 * Sends and waits for the reply. The app's ChatPort is request/response, so
 * the BFF absorbs the run here rather than the client holding a stream open.
 */
chatRoutes.post('/send', async (c) => {
  const parsed = sendBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'agentId and a non-empty prompt are required' }, 400);
  }
  const key = await workspaceKey(c.get('viewer').userId);
  if (!key) return c.json({ error: 'no workspace connected' }, 409);

  const raw = await skydiveJson<unknown>(`${APP_BASE}/chat/send`, key, {
    method: 'POST',
    body: JSON.stringify({
      agentId: parsed.data.agentId,
      conversationId: parsed.data.conversationId ?? null,
      content: parsed.data.prompt,
      attachmentIds: [],
      clientSurface: 'cli',
    }),
  });
  const sent = sendResult.safeParse(raw);
  if (!sent.success) {
    return c.json({ error: 'unexpected response from Skydive' }, 502);
  }

  const reply = await collectRun(sent.data.runId, key);

  return c.json({
    conversationId: sent.data.conversationId,
    messageId: sent.data.messageId ?? sent.data.runId,
    reply,
  });
});
