import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import type { Session, SessionStore } from '@/src/domain/session';
import { httpSessionStore as defaultStore } from '@/src/session/httpSessionStore';

const StoreContext = createContext<SessionStore | null>(null);

export function SessionProvider({
  store = defaultStore,
  children,
}: {
  store?: SessionStore;
  children: ReactNode;
}) {
  useEffect(() => {
    void store.restore();
  }, [store]);

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
  'logout' | 'connectKey' | 'setDisplayName'
> {
  const store = useStore();
  return useMemo(
    () => ({
      logout: store.logout,
      connectKey: store.connectKey,
      setDisplayName: store.setDisplayName,
    }),
    [store],
  );
}
