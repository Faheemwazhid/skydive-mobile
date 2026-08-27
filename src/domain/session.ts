export type Session = {
  email: string | null;
  connected: boolean;
  skippedConnect: boolean;
};

export type SessionStore = {
  get(): Session;
  subscribe(listener: () => void): () => void;
  login(email: string): Promise<void>;
  logout(): Promise<void>;
  connectKey(key: string): Promise<void>;
  skipConnect(): Promise<void>;
};

export function needsLogin(session: Session): boolean {
  return session.email === null;
}

export function needsConnect(session: Session): boolean {
  return (
    session.email !== null &&
    !session.connected &&
    !session.skippedConnect
  );
}
