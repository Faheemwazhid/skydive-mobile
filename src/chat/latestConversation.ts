import type { ChatPort, Conversation } from '@/src/domain/chat';

export async function latestConversationForAgent(
  chat: ChatPort,
  agentId: string,
): Promise<Conversation | null> {
  const listed = await chat.listConversations();
  return listed.find((c) => c.agentId === agentId) ?? null;
}
