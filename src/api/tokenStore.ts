/**
 * Where our session token lives.
 *
 * Module memory alone is not enough: on web the app can re-enter a fresh JS
 * context on navigation, which silently drops the token and produces a 401 on
 * the next request.
 *
 * "Remember this device" decides which web store is used. localStorage
 * survives a browser restart; sessionStorage dies with the tab. The server
 * expiry is the real limit either way, this only decides how long the token
 * can be presented at all.
 *
 * This is OUR session token, never the Skydive key, which stays on the BFF
 * (ADR 0005).
 */
const KEY = 'skydive.session';

let memory: string | null = null;

function store(kind: 'local' | 'session'): Storage | null {
  try {
    const candidate = kind === 'local' ? localStorage : sessionStorage;
    return typeof candidate === 'undefined' ? null : candidate;
  } catch {
    return null;
  }
}

function readFrom(kind: 'local' | 'session'): string | null {
  try {
    return store(kind)?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export function readToken(): string | null {
  return readFrom('local') ?? readFrom('session') ?? memory;
}

/**
 * `remember` picks the web store. Native has neither, so the token stays in
 * memory and a cold start returns to the connect screen.
 */
export function writeToken(token: string | null, remember = true): void {
  memory = token;
  const target = remember ? 'local' : 'session';
  try {
    store('local')?.removeItem(KEY);
    store('session')?.removeItem(KEY);
    if (token) store(target)?.setItem(KEY, token);
  } catch {
    // memory already holds it
  }
}
