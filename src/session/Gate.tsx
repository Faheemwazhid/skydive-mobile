import { Redirect, useSegments } from 'expo-router';
import type { ReactNode } from 'react';

import { needsConnect, needsLogin } from '@/src/domain/session';
import { useSession } from '@/src/session/SessionProvider';

/**
 * Expo's generated route types lag behind route renames, so redirect targets
 * are declared as plain paths. Matches the cast in src/nav.ts.
 */
const LOGIN = '/(auth)/login' as never;
const CONNECT = '/(auth)/connect' as never;
const HOME = '/(tabs)/agents' as never;

export function Gate({ children }: { children: ReactNode }) {
  const session = useSession();
  const segments = useSegments() as string[];
  const root = segments[0];
  const leaf = segments[1];
  const inAuth = root === '(auth)';

  if (needsLogin(session) && !inAuth) {
    return <Redirect href={LOGIN} />;
  }
  if (needsConnect(session) && leaf !== 'connect') {
    return <Redirect href={CONNECT} />;
  }
  if (!needsLogin(session) && !needsConnect(session) && inAuth) {
    return <Redirect href={HOME} />;
  }
  return children;
}
