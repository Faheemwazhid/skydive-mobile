import { api } from '@/src/api/client';
import type {
  ChatPort,
  Conversation,
  Message,
  MessageRole,
} from '@/src/domain/chat';

type ConversationPayload = {
  id: string;
  agentId: string;
  title: string;
  updatedAt: string;
};

type MessagePayload = {
  id: string;
  conversationId: string;
  role: string;
  body: string;
};

function toMessage(payload: MessagePayload): Message {
  const role: MessageRole = payload.role === 'user' ? 'user' : 'agent';
  return {
    id: payload.id,
    conversationId: payload.conversationId,
    role,
    body: payload.body,
    status: 'sent',
  };
}

export function createHttpChatPort(): ChatPort {
  return {
    async listConversations(): Promise<Conversation[]> {
      const result = await api<{ conversations: ConversationPayload[] }>(
        '/v1/chat/conversations',
      );
      return result.conversations;
    },

    async listMessages(conversationId) {
      const result = await api<{ messages: MessagePayload[] }>(
        `/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
      );
      return result.messages.map(toMessage);
    },

    async send(input) {
      const prompt = input.prompt.trim();
      if (!prompt) throw new Error('Message is required');
      return api<{
        conversationId: string;
        messageId: string;
        reply: string;
      }>('/v1/chat/send', {
        method: 'POST',
        body: {
          agentId: input.agentId,
          conversationId: input.conversationId ?? null,
          prompt,
        },
      });
    },
  };
}

export const httpChatPort = createHttpChatPort();
