import type { Session, SessionStore } from '@/src/domain/session';

const initial: Session = {
  email: null,
  connected: false,
  skippedConnect: false,
};

export function createMockSessionStore(
  seed: Session = initial,
): SessionStore {
  let session: Session = seed;
  const listeners = new Set<() => void>();

  function emit() {
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
    async login(email) {
      const trimmed = email.trim();
      if (!trimmed) {
        throw new Error('Email is required');
      }
      session = {
        email: trimmed,
        connected: false,
        skippedConnect: false,
      };
      emit();
    },
    async logout() {
      session = initial;
      emit();
    },
    async connectKey(key) {
      if (!key.trim()) {
        throw new Error('Key is required');
      }
      session = {
        ...session,
        connected: true,
        skippedConnect: false,
      };
      emit();
    },
    async skipConnect() {
      session = {
        ...session,
        connected: false,
        skippedConnect: true,
      };
      emit();
    },
  };
}

export const sessionStore = createMockSessionStore();
