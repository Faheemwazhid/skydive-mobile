import { fixtureAgents } from '@/src/agents/fixtures';
import type {
  ChatPort,
  Conversation,
  Message,
} from '@/src/domain/chat';

const CANNED_REPLY = [
  'On it.',
  '',
  'I will keep this thread short until live chat is wired.',
  '',
  '- No Computer tab',
  '- No skills in MVP',
].join('\n');

function nowIso(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createMockChatPort(): ChatPort {
  const eggplant = fixtureAgents[0];
  const seedConversation: Conversation = {
    id: 'convo-eggplant-1',
    agentId: eggplant.id,
    title: 'Add product engineering execution skill',
    updatedAt: nowIso(),
  };
  const conversations: Conversation[] = [seedConversation];
  const messages = new Map<string, Message[]>([
    [
      seedConversation.id,
      [
        {
          id: 'msg-user-1',
          conversationId: seedConversation.id,
          role: 'user',
          body: 'Add the product-engineering-execution skill.',
          status: 'sent',
        },
        {
          id: 'msg-agent-1',
          conversationId: seedConversation.id,
          role: 'agent',
          body: [
            'Done. I added **product-engineering-execution**.',
            '',
            'It owns the path from intent to verified handoff.',
          ].join('\n'),
          status: 'sent',
        },
      ],
    ],
  ]);

  return {
    async listConversations() {
      return conversations
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async listMessages(conversationId) {
      return (messages.get(conversationId) ?? []).map((m) => ({ ...m }));
    },
    async send(input) {
      const prompt = input.prompt.trim();
      if (!prompt) throw new Error('Message is required');

      let conversation = input.conversationId
        ? conversations.find((c) => c.id === input.conversationId)
        : undefined;
      if (!conversation) {
        conversation = {
          id: id('convo'),
          agentId: input.agentId,
          title: prompt.slice(0, 48),
          updatedAt: nowIso(),
        };
        conversations.unshift(conversation);
        messages.set(conversation.id, []);
      }

      const thread = messages.get(conversation.id) ?? [];
      const userMessage: Message = {
        id: id('msg'),
        conversationId: conversation.id,
        role: 'user',
        body: prompt,
        status: 'sent',
      };
      thread.push(userMessage);

      await new Promise((resolve) => setTimeout(resolve, 400));

      const replyMessage: Message = {
        id: id('msg'),
        conversationId: conversation.id,
        role: 'agent',
        body: CANNED_REPLY,
        status: 'sent',
      };
      thread.push(replyMessage);
      messages.set(conversation.id, thread);
      conversation.updatedAt = nowIso();

      return {
        conversationId: conversation.id,
        messageId: replyMessage.id,
        reply: CANNED_REPLY,
      };
    },
  };
}

export const chatPort = createMockChatPort();
