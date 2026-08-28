import { Redirect, useSegments } from 'expo-router';
import type { ReactNode } from 'react';

import { isRestoring, needsConnect, needsName } from '@/src/domain/session';
import { useSession } from '@/src/session/SessionProvider';

/**
 * Expo's generated route types lag behind route renames, so redirect targets
 * are declared as plain paths. Matches the cast in src/nav.ts.
 */
const CONNECT = '/(auth)/connect' as never;
const NAME = '/(auth)/name' as never;
const HOME = '/(tabs)/agents' as never;

export function Gate({ children }: { children: ReactNode }) {
  const session = useSession();
  const segments = useSegments() as string[];
  const leaf = segments[1];
  const inAuth = segments[0] === '(auth)';

  // Nothing is known yet. Rendering a redirect here would flash the connect
  // screen at a remembered device on every refresh.
  if (isRestoring(session)) return null;

  if (needsConnect(session)) {
    return leaf === 'connect' ? children : <Redirect href={CONNECT} />;
  }
  if (needsName(session)) {
    return leaf === 'name' ? children : <Redirect href={NAME} />;
  }
  return inAuth ? <Redirect href={HOME} /> : children;
}
