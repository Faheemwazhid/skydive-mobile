import { fixtureAgents } from '@/src/agents/fixtures';
import { createMockChatPort } from '@/src/chat/mockChatPort';

async function run() {
  const port = createMockChatPort();
  const listed = await port.listConversations();
  if (listed.length !== 1) throw new Error('expected seed conversation');
  const seed = await port.listMessages(listed[0].id);
  if (seed.length !== 2) throw new Error('seed thread');

  const sent = await port.send({
    agentId: fixtureAgents[1].id,
    prompt: 'hello from prototype',
  });
  if (!sent.conversationId) throw new Error('new conversation id');

  const immediately = await port.listMessages(sent.conversationId);
  if (immediately.at(-1)?.role !== 'user') {
    throw new Error('the agent message should not exist yet');
  }

  await new Promise((resolve) => setTimeout(resolve, 300));
  const streaming = await port.listMessages(sent.conversationId);
  if (streaming.at(-1)?.status !== 'pending') {
    throw new Error('reply should appear as pending so callers keep polling');
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
  const settled = await port.listMessages(sent.conversationId);
  const last = settled.at(-1);
  if (last?.status !== 'sent') throw new Error('reply should settle');
  if (!last.body.includes('On it.')) throw new Error('canned reply');

  const follow = await port.send({
    agentId: fixtureAgents[1].id,
    conversationId: sent.conversationId,
    prompt: 'and then?',
  });
  if (follow.conversationId !== sent.conversationId) {
    throw new Error('should continue thread');
  }
  await new Promise((resolve) => setTimeout(resolve, 800));
  const thread = await port.listMessages(sent.conversationId);
  if (thread.length !== 4) {
    throw new Error(`expected two full turns, got ${thread.length} messages`);
  }

  try {
    await port.send({ agentId: fixtureAgents[0].id, prompt: '  ' });
    throw new Error('blank prompt should fail');
  } catch (err) {
    if (!(err instanceof Error) || err.message !== 'Message is required') {
      throw err;
    }
  }
}

run().then(
  () => console.log('mockChatPort ok'),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
