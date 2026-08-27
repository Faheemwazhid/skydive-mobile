import { IN_APP_MODEL } from '@/src/domain/agent';
import { createMockAgentsRepo } from '@/src/agents/mockAgentsRepo';
import { fixtureAgents } from '@/src/agents/fixtures';

async function run() {
  const repo = createMockAgentsRepo();
  const listed = await repo.list();
  if (listed.length !== 2) throw new Error('expected two fixtures');
  const eggplant = listed.find((a) => a.name === 'Eggplant');
  if (!eggplant || eggplant.model !== 'x-ai/grok-4.6') {
    throw new Error('list must preserve web model');
  }

  const created = await repo.create({
    name: '  Sugarplum  ',
    purpose: 'Chief of staff',
    characterId: 'poppy',
  });
  if (created.model !== IN_APP_MODEL) {
    throw new Error(`create must use ${IN_APP_MODEL}`);
  }
  if (created.name !== 'Sugarplum') throw new Error('name not trimmed');
  if (created.characterId !== 'poppy') throw new Error('character missing');

  const after = await repo.list();
  if (after[0].id !== created.id) throw new Error('create should prepend');
  if (after.find((a) => a.id === eggplant.id)?.model !== 'x-ai/grok-4.6') {
    throw new Error('create must not rewrite existing models');
  }

  const missing = await repo.get('nope');
  if (missing !== null) throw new Error('missing get should be null');

  try {
    await repo.create({ name: ' ', characterId: 'moss' });
    throw new Error('blank name should fail');
  } catch (err) {
    if (!(err instanceof Error) || err.message !== 'Name is required') {
      throw err;
    }
  }

  if (fixtureAgents[0].model !== 'x-ai/grok-4.6') {
    throw new Error('fixtures mutated');
  }
}

run().then(
  () => console.log('mockAgentsRepo ok'),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
