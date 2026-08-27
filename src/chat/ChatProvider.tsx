import { createContext, useContext, type ReactNode } from 'react';

import { chatPort as defaultPort } from '@/src/chat/mockChatPort';
import type { ChatPort } from '@/src/domain/chat';

const Ctx = createContext<ChatPort | null>(null);

export function ChatProvider({
  port = defaultPort,
  children,
}: {
  port?: ChatPort;
  children: ReactNode;
}) {
  return <Ctx.Provider value={port}>{children}</Ctx.Provider>;
}

export function useChatPort(): ChatPort {
  const port = useContext(Ctx);
  if (!port) throw new Error('ChatProvider is required');
  return port;
}
