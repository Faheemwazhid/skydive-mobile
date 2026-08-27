import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import type { Session, SessionStore } from '@/src/domain/session';
import { sessionStore as defaultStore } from '@/src/session/mockSessionStore';

const StoreContext = createContext<SessionStore | null>(null);

export function SessionProvider({
  store = defaultStore,
  children,
}: {
  store?: SessionStore;
  children: ReactNode;
}) {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

function useStore(): SessionStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('SessionProvider is required');
  }
  return store;
}

export function useSession(): Session {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function useSessionActions(): Pick<
  SessionStore,
  'login' | 'logout' | 'connectKey' | 'skipConnect' | 'beginConnect'
> {
  const store = useStore();
  return useMemo(
    () => ({
      login: store.login,
      logout: store.logout,
      connectKey: store.connectKey,
      skipConnect: store.skipConnect,
      beginConnect: store.beginConnect,
    }),
    [store],
  );
}
