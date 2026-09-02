/**
 * Talks to our BFF. Never to Skydive: the workspace key lives server-side and
 * this client only ever carries our own session token (ADR 0005).
 */
import { readToken } from '@/src/api/tokenStore';

const DEFAULT_BASE = 'http://localhost:8787';
const TIMEOUT_MS = 20_000;

/** Codes for which the session is unrecoverable and the user must reconnect. */
export function isSessionLost(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.status === 401 || err.code === 'key_invalid')
  );
}

let onSessionLost: (() => void) | null = null;

/**
 * The session store registers here so a 401 or a revoked key from any request
 * signs the user out instead of leaving every screen empty.
 */
export function setSessionLostHandler(handler: (() => void) | null): void {
  onSessionLost = handler;
}

export function baseUrl(): string {
  return process.env.EXPO_PUBLIC_BFF_URL ?? DEFAULT_BASE;
}

export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, message: string, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export { readToken as getToken, writeToken as setToken } from '@/src/api/tokenStore';

type Options = {
  method?: string;
  body?: unknown;
  /** Requests made before a session exists, such as login. */
  anonymous?: boolean;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const headers: Record<string, string> = {
    accept: 'application/json',
  };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  const token = readToken();
  if (!options.anonymous && token) {
    headers.authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server');
  }

  const text = await res.text();
  const parsed: unknown = text ? safeJson(text) : null;

  if (!res.ok) {
    const record = (parsed ?? {}) as { error?: unknown; code?: unknown };
    const error = new ApiError(
      res.status,
      typeof record.error === 'string' ? record.error : `Request failed (${res.status})`,
      typeof record.code === 'string' ? record.code : null,
    );
    if (!options.anonymous && isSessionLost(error)) onSessionLost?.();
    throw error;
  }
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
