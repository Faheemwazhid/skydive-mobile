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
  /**
   * Starts the agent's run and returns as soon as it is accepted. The reply is
   * not part of the result: callers poll `listMessages` until no message is
   * `pending`. An agent can think for longer than any request should live.
   */
  send(input: {
    agentId: string;
    conversationId?: string;
    prompt: string;
  }): Promise<{ conversationId: string; messageId: string }>;
};
