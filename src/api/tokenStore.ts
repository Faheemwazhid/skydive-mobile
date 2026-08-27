/**
 * Where our session token lives.
 *
 * Module memory alone is not enough: on web the app can re-enter a fresh JS
 * context on navigation, which silently drops the token and produces a 401 on
 * the next request. Persisting it also means a refresh no longer signs you out.
 *
 * This is OUR session token, never the Skydive key — that stays on the BFF
 * (ADR 0005).
 */
const KEY = 'skydive.session';

let memory: string | null = null;

function web(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readToken(): string | null {
  const store = web();
  if (!store) return memory;
  try {
    return store.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

export function writeToken(token: string | null): void {
  memory = token;
  const store = web();
  if (!store) return;
  try {
    if (token) store.setItem(KEY, token);
    else store.removeItem(KEY);
  } catch {
    // memory already holds it
  }
}
