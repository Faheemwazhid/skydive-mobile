import { anonymous, type Session, type SessionStore } from '@/src/domain/session';

export function createMockSessionStore(seed: Session = anonymous): SessionStore {
  let session: Session = seed;
  const listeners = new Set<() => void>();

  function set(next: Session) {
    session = next;
    for (const listener of listeners) listener();
  }

  return {
    get() {
      return session;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async restore() {
      set(session.status === 'restoring' ? anonymous : session);
    },
    async connectKey(key) {
      if (!key.trim()) throw new Error('Key is required');
      set({
        status: 'authenticated',
        displayName: session.displayName,
        keyPrefix: 'sky_live_mock…',
      });
    },
    async setDisplayName(name) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Name is required');
      set({ ...session, displayName: trimmed });
    },
    async logout() {
      set(anonymous);
    },
  };
}

export const sessionStore = createMockSessionStore();
