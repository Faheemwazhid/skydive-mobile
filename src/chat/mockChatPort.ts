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

const REPLY_APPEARS_MS = 200;
const REPLY_SETTLES_MS = 500;

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
      thread.push({
        id: id('msg'),
        conversationId: conversation.id,
        role: 'user',
        body: prompt,
        status: 'sent',
      });

      messages.set(conversation.id, thread);
      conversation.updatedAt = nowIso();

      // Mirrors the real service in three phases: for a moment the thread holds
      // only the user's message, then the reply appears as `pending`, then it
      // settles. A mock that skips the first phase hides polling bugs.
      const reply: Message = {
        id: id('msg'),
        conversationId: conversation.id,
        role: 'agent',
        body: '',
        status: 'pending',
      };
      setTimeout(() => {
        thread.push(reply);
      }, REPLY_APPEARS_MS);
      setTimeout(() => {
        reply.body = CANNED_REPLY;
        reply.status = 'sent';
      }, REPLY_SETTLES_MS);

      return {
        conversationId: conversation.id,
        messageId: reply.id,
      };
    },
  };
}

export const chatPort = createMockChatPort();
