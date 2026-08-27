/**
 * The only module that talks to Skydive. Two hosts, verified 2026-08-27:
 *   api.skydive.com/v1      — management (agents, keys, secrets)
 *   www.skydive.com/api/v1  — chat (send, run stream, conversations)
 * Both authenticate with the same `sky_live_` key. See ADR 0002.
 */
export const MANAGEMENT_BASE = 'https://api.skydive.com/v1';
export const APP_BASE = 'https://www.skydive.com/api/v1';

const TIMEOUT_MS = 30_000;

export type SkydiveErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'upstream'
  | 'network';

export class SkydiveError extends Error {
  code: SkydiveErrorCode;
  status: number;

  constructor(code: SkydiveErrorCode, message: string, status: number) {
    super(message);
    this.name = 'SkydiveError';
    this.code = code;
    this.status = status;
  }
}

function codeForStatus(status: number): SkydiveErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  return 'upstream';
}

/** Skydive errors are `{ error: string }`; fall back to the status line. */
async function toError(res: Response): Promise<SkydiveError> {
  const body = await res.text().catch(() => '');
  let message = body.slice(0, 300) || `HTTP ${res.status}`;
  try {
    const parsed: unknown = JSON.parse(body);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { error?: unknown }).error === 'string'
    ) {
      message = (parsed as { error: string }).error;
    }
  } catch {
    // keep the raw body
  }
  return new SkydiveError(codeForStatus(res.status), message, res.status);
}

export async function skydiveFetch(
  url: string,
  key: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${key}`);
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  if (!headers.has('accept')) headers.set('accept', 'application/json');

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    throw new SkydiveError(
      'network',
      cause instanceof Error ? cause.message : 'network failure',
      502,
    );
  }
  if (!res.ok) throw await toError(res);
  return res;
}

export async function skydiveJson<T>(
  url: string,
  key: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await skydiveFetch(url, key, init);
  return (await res.json()) as T;
}

/**
 * Confirms a key works and is account-level. An agent-bound key cannot
 * enumerate the workspace, so listing is the honest check — it fails now
 * rather than showing an empty roster later.
 */
export async function validateKey(key: string): Promise<void> {
  await skydiveJson(`${MANAGEMENT_BASE}/agents?limit=1`, key);
}
