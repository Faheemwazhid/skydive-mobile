import type { ChatPort, Message } from '@/src/domain/chat';

const INTERVAL_MS = 1200;
const MAX_ATTEMPTS = 50;

/**
 * True once the agent's reply has fully landed.
 *
 * Checking merely that nothing is `pending` is wrong: for the first second
 * after sending, the thread contains only the user's message and the agent's
 * has not been created yet, which looks identical to "finished". The reply is
 * done when the newest message is the agent's and it has settled.
 */
export function hasReplyStarted(
  messages: Message[],
  previousReplyId?: string,
): boolean {
  const last = messages[messages.length - 1];
  return (
    last?.role === 'agent' &&
    last.id !== previousReplyId &&
    last.body.length > 0
  );
}

export function hasReplyLanded(
  messages: Message[],
  previousReplyId?: string,
): boolean {
  const last = messages[messages.length - 1];
  if (!last) return false;
  return (
    last.role === 'agent' &&
    last.id !== previousReplyId &&
    last.status === 'sent' &&
    last.body.length > 0
  );
}

/**
 * Refreshes a thread until the agent has replied. Gives up after roughly a
 * minute rather than polling forever against a run that will never finish.
 */
export async function pollUntilReply(input: {
  chat: ChatPort;
  conversationId: string;
  onMessages: (messages: Message[]) => void;
  isCancelled?: () => boolean;
  intervalMs?: number;
  maxAttempts?: number;
  previousReplyId?: string;
}): Promise<void> {
  const interval = input.intervalMs ?? INTERVAL_MS;
  const attempts = input.maxAttempts ?? MAX_ATTEMPTS;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (input.isCancelled?.()) return;

    const messages = await input.chat.listMessages(input.conversationId);
    if (input.isCancelled?.()) return;

    input.onMessages(messages);
    if (hasReplyLanded(messages, input.previousReplyId)) return;

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
