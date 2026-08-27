import type { Agent } from '@/src/domain/agent';
import type { FeedItem } from '@/src/domain/feed';

const KINDS = ['joined', 'new_chat', 'replied'] as const;

export function feedFromAgents(agents: Agent[]): FeedItem[] {
  return agents.slice(0, 3).map((agent, index) => ({
    id: `feed-${agent.id}`,
    kind: KINDS[index] ?? 'replied',
    agentId: agent.id,
    agentName: agent.name,
    at: 'just now',
  }));
}
