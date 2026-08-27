import type { ChatPort, Message } from '@/src/domain/chat';
import { hasReplyLanded, pollUntilReply } from '@/src/chat/pollUntilReply';

function user(): Message {
  return {
    id: 'u1',
    conversationId: 'c1',
    role: 'user',
    body: 'hello',
    status: 'sent',
  };
}

function agent(status: Message['status'], body = 'hi there'): Message {
  return {
    id: 'a1',
    conversationId: 'c1',
    role: 'agent',
    body: status === 'pending' ? '' : body,
    status,
  };
}

function portReturning(frames: Message[][]): {
  port: ChatPort;
  reads: () => number;
} {
  let index = 0;
  const port: ChatPort = {
    listConversations: async () => [],
    listMessages: async () => {
      const frame = frames[Math.min(index, frames.length - 1)];
      index += 1;
      return frame;
    },
    send: async () => ({ conversationId: 'c1', messageId: 'a1' }),
  };
  return { port, reads: () => index };
}

async function run() {
  // The regression this predicate exists for: one second after sending, the
  // thread holds only the user's message. That is not a finished reply.
  if (hasReplyLanded([user()])) {
    throw new Error('a lone user message must not count as a landed reply');
  }
  if (hasReplyLanded([user(), agent('pending')])) {
    throw new Error('a streaming reply must not count as landed');
  }
  if (!hasReplyLanded([user(), agent('sent')])) {
    throw new Error('a settled agent reply should count as landed');
  }

  // Real observed sequence: user only, then streaming, then complete.
  const live = portReturning([
    [user()],
    [user(), agent('pending')],
    [user(), agent('sent')],
  ]);
  await pollUntilReply({
    chat: live.port,
    conversationId: 'c1',
    onMessages: () => undefined,
    intervalMs: 1,
  });
  if (live.reads() !== 3) {
    throw new Error(`expected 3 reads through the real sequence, got ${live.reads()}`);
  }

  // Gives up rather than spinning forever.
  const stuck = portReturning([[user()]]);
  await pollUntilReply({
    chat: stuck.port,
    conversationId: 'c1',
    onMessages: () => undefined,
    intervalMs: 1,
    maxAttempts: 4,
  });
  if (stuck.reads() !== 4) throw new Error('should honour maxAttempts');

  // Stops when the caller has navigated away.
  const cancelled = portReturning([[user()]]);
  await pollUntilReply({
    chat: cancelled.port,
    conversationId: 'c1',
    onMessages: () => undefined,
    isCancelled: () => true,
    intervalMs: 1,
  });
  if (cancelled.reads() !== 0) throw new Error('should not read when cancelled');
}

run().then(
  () => console.log('pollUntilReply ok'),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
