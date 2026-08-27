import { fixtureAgents } from '@/src/agents/fixtures';
import { createMockChatPort } from '@/src/chat/mockChatPort';
import { latestConversationForAgent } from '@/src/chat/latestConversation';

async function run() {
  const chat = createMockChatPort();
  const eggplant = fixtureAgents[0];
  const chico = fixtureAgents[1];
  const found = await latestConversationForAgent(chat, eggplant.id);
  if (!found) throw new Error('eggplant has a seed chat');
  const missing = await latestConversationForAgent(chat, chico.id);
  if (missing !== null) throw new Error('chico has no chats yet');
}

run().then(
  () => console.log('latestConversation ok'),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
