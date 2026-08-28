/**
 * The Skydive key is the login (ADR 0008). `restoring` is the boot state while
 * a remembered token is checked, and exists so the Gate does not flash the
 * connect screen at someone who is already signed in.
 */
export type SessionStatus = 'restoring' | 'anonymous' | 'authenticated';

export type Session = {
  status: SessionStatus;
  displayName: string | null;
  keyPrefix: string | null;
};

export type SessionStore = {
  get(): Session;
  subscribe(listener: () => void): () => void;
  restore(): Promise<void>;
  connectKey(key: string, remember: boolean): Promise<void>;
  setDisplayName(name: string): Promise<void>;
  logout(): Promise<void>;
};

export const anonymous: Session = {
  status: 'anonymous',
  displayName: null,
  keyPrefix: null,
};

export function isRestoring(session: Session): boolean {
  return session.status === 'restoring';
}

export function needsConnect(session: Session): boolean {
  return session.status === 'anonymous';
}

export function needsName(session: Session): boolean {
  return session.status === 'authenticated' && !session.displayName;
}
