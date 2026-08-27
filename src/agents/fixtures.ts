import type { Agent } from '@/src/domain/agent';

export const fixtureAgents: Agent[] = [
  {
    id: '01a04269-c95e-71e9-8387-f65b9d48f925',
    name: 'Eggplant',
    description:
      'Surfaces blocked PRs, failing builds, and review requests first.',
    model: 'x-ai/grok-4.6',
    url: null,
    characterId: 'moss',
  },
  {
    id: '01a0324c-ed7c-797e-b449-684f2b143ae6',
    name: 'Chico',
    description: null,
    model: 'openai/gpt-5.6-luna',
    url: null,
    characterId: 'sol',
  },
];
