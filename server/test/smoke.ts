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

  const badEmail = await call('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'nope' }),
  });
  check('rejects a malformed email', badEmail.status === 400);

  const email = `smoke-${Date.now()}@example.com`;
  const login = await call('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  const token = login.body.token as string | undefined;
  check('login issues a session', login.status === 201 && !!token);

  const noAuth = await call('/v1/auth/session');
  check('session requires a token', noAuth.status === 401);

  const badAuth = await call('/v1/auth/session', {}, 'not-a-real-token');
  check('rejects an unknown token', badAuth.status === 401);

  const session = await call('/v1/auth/session', {}, token);
  check(
    'session starts disconnected',
    session.status === 200 && session.body.connected === false,
  );

  const notAKey = await call(
    '/v1/auth/connect',
    { method: 'POST', body: JSON.stringify({ key: 'hunter2' }) },
    token,
  );
  check('rejects a non-Skydive key', notAKey.status === 400);

  const fakeKey = await call(
    '/v1/auth/connect',
    { method: 'POST', body: JSON.stringify({ key: 'sky_live_totally_fake' }) },
    token,
  );
  check(
    'rejects a well-formed but invalid key',
    fakeKey.status === 400,
    String(fakeKey.body.error ?? ''),
  );

  if (!REAL_KEY) {
    console.log('skip  connect with a real key — no skydive_api_key in env');
  } else {
    const connected = await call(
      '/v1/auth/connect',
      { method: 'POST', body: JSON.stringify({ key: REAL_KEY }) },
      token,
    );
    check(
      'connects with a real key',
      connected.status === 201 && connected.body.connected === true,
    );

    const after = await call('/v1/auth/session', {}, token);
    const prefix = String(after.body.keyPrefix ?? '');
    check('session reports connected', after.body.connected === true);
    check(
      'never returns the full key',
      prefix.endsWith('…') && !prefix.includes(REAL_KEY.slice(12)),
      prefix,
    );

    const disconnected = await call(
      '/v1/auth/disconnect',
      { method: 'POST' },
      token,
    );
    check('disconnect clears the workspace', disconnected.status === 200);
  }


  if (!REAL_KEY) {
    console.log('skip  agents — no skydive_api_key in env');
  } else {
    const reconnect = await call(
      '/v1/auth/connect',
      { method: 'POST', body: JSON.stringify({ key: REAL_KEY }) },
      token,
    );
    check('reconnect for agent checks', reconnect.status === 201);

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

    const sent = await call('/v1/chat/send', {
      method: 'POST',
      body: JSON.stringify({
        agentId: String(first.id),
        prompt: 'Reply with exactly: smoke-ok',
      }),
    }, token);
    const reply = String((sent.body as Record<string, unknown>).reply ?? '');
    check('sends and receives a real reply', sent.status === 200 && reply.length > 0,
      reply.slice(0, 40));

    await call('/v1/auth/disconnect', { method: 'POST' }, token);
    const gated = await call('/v1/agents', {}, token);
    check('agents require a connected workspace', gated.status === 409,
      String(gated.body.code ?? ''));
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
