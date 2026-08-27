import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import type { AgentsRepo } from '@/src/domain/agent';
import { httpAgentsRepo as defaultRepo } from '@/src/agents/httpAgentsRepo';

const Ctx = createContext<AgentsRepo | null>(null);

export function AgentsProvider({
  repo = defaultRepo,
  children,
}: {
  repo?: AgentsRepo;
  children: ReactNode;
}) {
  return <Ctx.Provider value={repo}>{children}</Ctx.Provider>;
}

export function useAgentsRepo(): AgentsRepo {
  const repo = useContext(Ctx);
  if (!repo) {
    throw new Error('AgentsProvider is required');
  }
  return repo;
}
