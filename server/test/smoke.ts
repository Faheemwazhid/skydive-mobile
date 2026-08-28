/**
 * Exercises the BFF against a running server. Requires:
 *   BFF_URL          (default http://localhost:8787)
 *   skydive_api_key  a real sky_live_ key, for the connect path
 *
 * Run:  npm run test:bff
 */
const BASE = process.env.BFF_URL ?? 'http://localhost:8787';
const REAL_KEY = process.env.skydive_api_key ?? process.env.SKYDIVE_API_KEY;

let failures = 0;

function daysUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 86_400_000;
}

function check(name: string, ok: boolean, detail = '') {
  const mark = ok ? 'ok  ' : 'FAIL';
  if (!ok) failures += 1;
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function call(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { status: res.status, body };
}

async function main() {
  const health = await call('/health');
  check('health responds', health.status === 200);

  const noAuth = await call('/v1/auth/session');
  check('session requires a token', noAuth.status === 401);

  const badAuth = await call('/v1/auth/session', {}, 'not-a-real-token');
  check('rejects an unknown token', badAuth.status === 401);

  const notAKey = await call('/v1/auth/connect', {
    method: 'POST',
    body: JSON.stringify({ key: 'hunter2' }),
  });
  check('rejects a non-Skydive key', notAKey.status === 400);

  const fakeKey = await call('/v1/auth/connect', {
    method: 'POST',
    body: JSON.stringify({ key: 'sky_live_totally_fake' }),
  });
  check(
    'rejects a well-formed but invalid key',
    fakeKey.status === 400,
    String(fakeKey.body.error ?? ''),
  );

  check(
    'there is no email login to bypass the key',
    (await call('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'someone@example.com' }),
    })).status === 404,
  );

  let token: string | undefined;

  if (!REAL_KEY) {
    console.log('skip  agents — no skydive_api_key in env');
  } else {
    const connected = await call('/v1/auth/connect', {
      method: 'POST',
      body: JSON.stringify({ key: REAL_KEY, remember: true }),
    });
    token = connected.body.token as string | undefined;
    const prefix = String(connected.body.keyPrefix ?? '');
    check('the key alone signs you in', connected.status === 201 && !!token);
    check(
      'never returns the full key',
      prefix.endsWith('…') && !prefix.includes(REAL_KEY.slice(12)),
      prefix,
    );
    check(
      'remembered sessions last 15 days',
      daysUntil(String(connected.body.expiresAt ?? '')) > 14,
      `${daysUntil(String(connected.body.expiresAt ?? ''))} days`,
    );

    const brief = await call('/v1/auth/connect', {
      method: 'POST',
      body: JSON.stringify({ key: REAL_KEY, remember: false }),
    });
    check(
      'an unremembered session expires within a day',
      daysUntil(String(brief.body.expiresAt ?? '')) < 1,
    );

    const named = await call(
      '/v1/auth/name',
      { method: 'POST', body: JSON.stringify({ name: '  Waz  ' }) },
      token,
    );
    check(
      'display name is stored trimmed',
      named.status === 200 && named.body.displayName === 'Waz',
      String(named.body.displayName ?? ''),
    );
    check(
      'a name is required',
      (await call('/v1/auth/name', {
        method: 'POST',
        body: JSON.stringify({ name: '   ' }),
      }, token)).status === 400,
    );

    const again = await call('/v1/auth/connect', {
      method: 'POST',
      body: JSON.stringify({ key: REAL_KEY, remember: true }),
    });
    check(
      'the same key returns the same identity, name intact',
      again.body.displayName === 'Waz',
      String(again.body.displayName ?? ''),
    );

    const session = await call('/v1/auth/session', {}, token);
    check(
      'session reports the name and key prefix',
      session.status === 200 && session.body.displayName === 'Waz',
    );

    const list = await call('/v1/agents', {}, token);
    const agents = (list.body.agents ?? []) as Array<Record<string, unknown>>;
    check('lists live agents', list.status === 200 && agents.length > 0,
      `${agents.length} agent(s)`);

    const first = agents[0] ?? {};
    check('every agent has a character',
      agents.every((a) => typeof a.characterId === 'string' && a.characterId.length > 0));
    check('agent keeps its real model',
      typeof first.model === 'string' && (first.model as string).length > 0,
      String(first.model ?? ''));
    check('no key leaks into the agent payload',
      !JSON.stringify(agents).includes('sky_live_'));

    const one = await call(`/v1/agents/${String(first.id)}`, {}, token);
    check('fetches a single agent',
      one.status === 200 &&
      (one.body.agent as Record<string, unknown>).id === first.id);

    const malformed = await call('/v1/agents/does-not-exist', {}, token);
    check('malformed agent id is 404, not a passed-through 500',
      malformed.status === 404, String(malformed.body.code ?? ''));

    const missing = await call(
      '/v1/agents/01a04269-0000-0000-0000-000000000000', {}, token);
    check('unknown agent is 404', missing.status === 404);


    const convos = await call('/v1/chat/conversations', {}, token);
    check('lists live conversations', convos.status === 200,
      `${((convos.body.conversations ?? []) as unknown[]).length} thread(s)`);

    const badConvo = await call('/v1/chat/conversations/nope/messages', {}, token);
    check('malformed conversation id is 404', badConvo.status === 404);

    const startedAt = Date.now();
    const sent = await call('/v1/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        agentId: String(first.id),
        prompt: 'Reply with exactly: smoke-ok',
      }),
    }, token);
    const sendMs = Date.now() - startedAt;
    const convoId = String((sent.body as Record<string, unknown>).conversationId ?? '');
    check('send returns immediately', sent.status === 200 && sendMs < 3000,
      `${sendMs}ms`);
    check('send does not block on the reply',
      !Object.prototype.hasOwnProperty.call(sent.body, 'reply'));

    let reply = '';
    let settled = false;
    for (let attempt = 0; attempt < 30 && !settled; attempt += 1) {
      await new Promise((r) => setTimeout(r, 1200));
      const poll = await call(
        `/v1/chat/conversations/${convoId}/messages`, {}, token);
      const msgs = (poll.body.messages ?? []) as Array<Record<string, unknown>>;
      const last = msgs[msgs.length - 1];
      if (last && last.role !== 'user' && last.status !== 'pending') {
        reply = String(last.body ?? '');
        settled = true;
      }
    }
    check('reply arrives via polling and settles', settled && reply.length > 0,
      reply.slice(0, 40));

  }

  const loggedOut = await call('/v1/auth/logout', { method: 'POST' }, token);
  check('logout succeeds', loggedOut.status === 200);

  const afterLogout = await call('/v1/auth/session', {}, token);
  check('session is dead after logout', afterLogout.status === 401);

  console.log(failures === 0 ? '\nbff smoke ok' : `\n${failures} failure(s)`);
  if (failures > 0) process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
