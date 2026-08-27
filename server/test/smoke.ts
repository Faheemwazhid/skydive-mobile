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
