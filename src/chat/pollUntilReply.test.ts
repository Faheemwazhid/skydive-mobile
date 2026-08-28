import type { ChatPort, Message } from '@/src/domain/chat';
import {
  hasReplyLanded,
  hasReplyStarted,
  pollUntilReply,
} from '@/src/chat/pollUntilReply';

function user(): Message {
  return {
    id: 'u1',
    conversationId: 'c1',
    role: 'user',
    body: 'hello',
    status: 'sent',
  };
}

function agent(
  status: Message['status'],
  body = 'hi there',
  id = 'a1',
): Message {
  return {
    id,
    conversationId: 'c1',
    role: 'agent',
    body,
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
  if (hasReplyLanded([user(), agent('pending', '')])) {
    throw new Error('a streaming reply must not count as landed');
  }
  if (!hasReplyLanded([user(), agent('sent')])) {
    throw new Error('a settled agent reply should count as landed');
  }
  if (hasReplyStarted([user(), agent('pending', '')])) {
    throw new Error('an empty streaming reply has not visibly started');
  }
  if (!hasReplyStarted([user(), agent('pending', 'partial')])) {
    throw new Error('visible streaming text should count as started');
  }

  // A prior completed agent message must not end polling for the new send.
  const prior = agent('sent', 'old reply', 'old-agent');
  if (hasReplyLanded([prior, user()], prior.id)) {
    throw new Error('a previous reply must not settle the new send');
  }
  if (!hasReplyLanded([prior, user(), agent('sent')], prior.id)) {
    throw new Error('a new settled reply should end polling');
  }

  // Real observed sequence: user only, then streaming, then complete.
  const live = portReturning([
    [user()],
    [user(), agent('pending', '')],
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

  const afterPreviousReply = portReturning([
    [prior, user()],
    [prior, user(), agent('pending', 'partial')],
    [prior, user(), agent('sent')],
  ]);
  await pollUntilReply({
    chat: afterPreviousReply.port,
    conversationId: 'c1',
    onMessages: () => undefined,
    intervalMs: 1,
    previousReplyId: prior.id,
  });
  if (afterPreviousReply.reads() !== 3) {
    throw new Error('polling should wait for the new reply after an old one');
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
