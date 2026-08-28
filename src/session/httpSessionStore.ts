import { api, ApiError, getToken, setToken } from '@/src/api/client';
import { anonymous, type Session, type SessionStore } from '@/src/domain/session';

type ConnectResponse = {
  token: string;
  displayName: string | null;
  keyPrefix: string;
};

type SessionResponse = { displayName: string | null; keyPrefix: string };

type NameResponse = { displayName: string };

/**
 * Session backed by the BFF. The Skydive key is posted once at connect and is
 * never held here, only our own session token.
 */
export function createHttpSessionStore(): SessionStore {
  let session: Session = { ...anonymous, status: 'restoring' };
  const listeners = new Set<() => void>();

  const setSession = (next: Session) => {
    session = next;
    for (const listener of listeners) listener();
  };

  const signedIn = (from: SessionResponse): Session => ({
    status: 'authenticated',
    displayName: from.displayName,
    keyPrefix: from.keyPrefix,
  });

  return {
    get: () => session,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** Boot. A remembered token is only trusted once the server confirms it. */
    async restore() {
      if (!getToken()) {
        setSession(anonymous);
        return;
      }
      try {
        setSession(signedIn(await api<SessionResponse>('/v1/auth/session')));
      } catch {
        setToken(null);
        setSession(anonymous);
      }
    },

    async connectKey(key, remember) {
      const trimmed = key.trim();
      if (!trimmed) throw new Error('Key is required');
      let result: ConnectResponse;
      try {
        result = await api<ConnectResponse>('/v1/auth/connect', {
          method: 'POST',
          body: { key: trimmed, remember },
          anonymous: true,
        });
      } catch (err) {
        throw new Error(
          err instanceof ApiError ? err.message : 'Could not connect',
        );
      }
      setToken(result.token, remember);
      setSession(signedIn(result));
    },

    async setDisplayName(name) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Name is required');
      const result = await api<NameResponse>('/v1/auth/name', {
        method: 'POST',
        body: { name: trimmed },
      });
      setSession({ ...session, displayName: result.displayName });
    },

    async logout() {
      try {
        await api('/v1/auth/logout', { method: 'POST' });
      } catch {
        // Signing out locally matters more than the server acknowledging it.
      }
      setToken(null);
      setSession(anonymous);
    },
  };
}

export const httpSessionStore = createHttpSessionStore();
