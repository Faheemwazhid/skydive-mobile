import { fixtureAgents } from '@/src/agents/fixtures';
import { feedFromAgents } from '@/src/agents/feedFromAgents';
import { feedCopy } from '@/src/domain/feed';

function run() {
  const empty = feedFromAgents([]);
  if (empty.length !== 0) throw new Error('empty roster has no feed');

  const items = feedFromAgents(fixtureAgents);
  if (items.length !== 2) throw new Error('one card per seeded agent, max 3');
  if (items[0].kind !== 'joined') throw new Error('first card is joined');
  if (!feedCopy(items[0]).includes('Eggplant')) {
    throw new Error('copy should use agent name');
  }
  if (feedCopy(items[0]).toLowerCase().includes('skill')) {
    throw new Error('no skill cards');
  }
}

run();
console.log('feedFromAgents ok');
