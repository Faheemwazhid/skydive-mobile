import { Hono } from 'hono';
import { z } from 'zod';

import { requireSession, workspaceKey, type AppEnv } from '../session';
import { APP_BASE, skydiveJson } from '../skydive';

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

/** Skydive messages are AI-SDK UIMessages: text lives in `parts`. */
const message = z
  .object({
    id: z.string(),
    role: z.string(),
    status: z.string().nullish(),
    parts: z
      .array(
        z.object({ type: z.string(), text: z.string().nullish() }).passthrough(),
      )
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

type MessageStatus = 'pending' | 'sent' | 'failed';

/**
 * Skydive reports `streaming` while a reply is being written and `complete`
 * when it lands. That maps onto our existing pending/sent states, which is how
 * the client knows when to stop polling.
 */
function statusOf(raw: string | null | undefined): MessageStatus {
  if (raw === 'streaming' || raw === 'pending') return 'pending';
  if (raw === 'failed' || raw === 'error') return 'failed';
  return 'sent';
}

function bodyOf(
  parts: { type: string; text?: string | null }[] | null | undefined,
): string {
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

export const chatRoutes = new Hono<AppEnv>();

chatRoutes.use('*', requireSession);

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

  const messages = parsed.data.messages.map((m) => ({
    id: m.id,
    conversationId: id,
    role: roleOf(m.role),
    body: bodyOf(m.parts),
    status: statusOf(m.status),
  }));

  return c.json({
    // An empty message that is still streaming must survive: dropping it would
    // tell the client the thread had settled and stop it polling.
    messages: messages.filter((m) => m.body.length > 0 || m.status === 'pending'),
  });
});

/**
 * Starts the run and returns. The reply is not waited for — the client polls
 * the messages endpoint until nothing is `pending`.
 *
 * Waiting here would tie request duration to how long an agent thinks, which
 * a serverless platform will cut off mid-run.
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

  return c.json({
    conversationId: sent.data.conversationId,
    messageId: sent.data.messageId ?? sent.data.runId,
  });
});
