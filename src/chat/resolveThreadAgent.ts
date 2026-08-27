import type { Agent, AgentsRepo } from '@/src/domain/agent';
import type { ChatPort } from '@/src/domain/chat';

export async function resolveThreadAgent(input: {
  agents: AgentsRepo;
  chat: ChatPort;
  agentId?: string;
  conversationId?: string;
}): Promise<Agent | null> {
  if (input.agentId) {
    return input.agents.get(input.agentId);
  }
  if (!input.conversationId) return null;
  const convos = await input.chat.listConversations();
  const convo = convos.find((c) => c.id === input.conversationId);
  if (!convo) return null;
  return input.agents.get(convo.agentId);
}
