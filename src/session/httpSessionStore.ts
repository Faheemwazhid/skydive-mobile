import { api, ApiError, setToken } from '@/src/api/client';
import type { Session, SessionStore } from '@/src/domain/session';

type LoginResponse = { token: string; email: string };
type SessionResponse = { email: string; connected: boolean };

const signedOut: Session = {
  email: null,
  connected: false,
  skippedConnect: false,
};

/**
 * Session backed by the BFF. The Skydive key is posted once at connect and is
 * never held here — only our own session token, which lives in memory for the
 * lifetime of the app process.
 */
export function createHttpSessionStore(): SessionStore {
  let session: Session = signedOut;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const setSession = (next: Session) => {
    session = next;
    emit();
  };

  return {
    get: () => session,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async login(email) {
      const trimmed = email.trim();
      if (!trimmed) throw new Error('Email is required');
      const result = await api<LoginResponse>('/v1/auth/login', {
        method: 'POST',
        body: { email: trimmed },
        anonymous: true,
      });
      setToken(result.token);
      setSession({
        email: result.email,
        connected: false,
        skippedConnect: false,
      });
    },

    async logout() {
      try {
        await api('/v1/auth/logout', { method: 'POST' });
      } catch {
        // Signing out locally matters more than the server acknowledging it.
      }
      setToken(null);
      setSession(signedOut);
    },

    async connectKey(key) {
      const trimmed = key.trim();
      if (!trimmed) throw new Error('Key is required');
      try {
        await api('/v1/auth/connect', {
          method: 'POST',
          body: { key: trimmed },
        });
      } catch (err) {
        throw new Error(
          err instanceof ApiError ? err.message : 'Could not connect',
        );
      }
      const state = await api<SessionResponse>('/v1/auth/session');
      setSession({
        email: state.email,
        connected: state.connected,
        skippedConnect: false,
      });
    },

    async skipConnect() {
      setSession({ ...session, connected: false, skippedConnect: true });
    },

    async beginConnect() {
      setSession({ ...session, skippedConnect: false });
    },
  };
}

export const httpSessionStore = createHttpSessionStore();
