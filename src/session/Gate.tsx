import { Redirect, useSegments } from 'expo-router';
import type { ReactNode } from 'react';

import { needsConnect, needsLogin } from '@/src/domain/session';
import { useSession } from '@/src/session/SessionProvider';

export function Gate({ children }: { children: ReactNode }) {
  const session = useSession();
  const segments = useSegments() as string[];
  const root = segments[0];
  const leaf = segments[1];
  const inAuth = root === '(auth)';

  if (needsLogin(session) && !inAuth) {
    return <Redirect href="/(auth)/login" />;
  }
  if (needsConnect(session) && leaf !== 'connect') {
    return <Redirect href="/(auth)/connect" />;
  }
  if (!needsLogin(session) && !needsConnect(session) && inAuth) {
    return <Redirect href="/(tabs)/team" />;
  }
  return children;
}
