import { IN_APP_MODEL, type Agent, type AgentsRepo } from '@/src/domain/agent';
import { fixtureAgents } from '@/src/agents/fixtures';

function slugId(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `local-${slug || 'agent'}-${Date.now()}`;
}

export function createMockAgentsRepo(
  seed: Agent[] = fixtureAgents,
): AgentsRepo {
  const agents = seed.map((agent) => ({ ...agent }));

  return {
    async list() {
      return agents.map((agent) => ({ ...agent }));
    },
    async get(id) {
      const found = agents.find((agent) => agent.id === id);
      return found ? { ...found } : null;
    },
    async create(input) {
      const name = input.name.trim();
      if (!name) {
        throw new Error('Name is required');
      }
      const agent: Agent = {
        id: slugId(name),
        name,
        description: input.purpose?.trim() || null,
        model: IN_APP_MODEL,
        url: null,
        characterId: input.characterId,
      };
      agents.unshift(agent);
      return { ...agent };
    },
  };
}

export const agentsRepo = createMockAgentsRepo();
