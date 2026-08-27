export type MessageRole = 'user' | 'agent';
export type MessageStatus = 'pending' | 'sent' | 'failed';

export type Conversation = {
  id: string;
  agentId: string;
  title: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  role: MessageRole;
  body: string;
  status: MessageStatus;
};

export type ChatPort = {
  listConversations(): Promise<Conversation[]>;
  listMessages(conversationId: string): Promise<Message[]>;
  send(input: {
    agentId: string;
    conversationId?: string;
    prompt: string;
  }): Promise<{ conversationId: string; messageId: string; reply: string }>;
};
