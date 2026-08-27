import { api } from '@/src/api/client';
import type { Agent, AgentsRepo } from '@/src/domain/agent';
import { isCharacterId } from '@/src/domain/characters';

type AgentPayload = {
  id: string;
  name: string;
  description: string | null;
  model: string;
  url: string | null;
  characterId: string;
};

/** The BFF always sends a character, but the app must not trust it blindly. */
function toAgent(payload: AgentPayload): Agent {
  return {
    id: payload.id,
    name: payload.name,
    description: payload.description,
    model: payload.model,
    url: payload.url,
    characterId: isCharacterId(payload.characterId)
      ? payload.characterId
      : null,
  };
}

export function createHttpAgentsRepo(): AgentsRepo {
  return {
    async list() {
      const result = await api<{ agents: AgentPayload[] }>('/v1/agents');
      return result.agents.map(toAgent);
    },

    async get(id) {
      try {
        const result = await api<{ agent: AgentPayload }>(
          `/v1/agents/${encodeURIComponent(id)}`,
        );
        return toAgent(result.agent);
      } catch {
        return null;
      }
    },

    async create(input) {
      const result = await api<{ agent: AgentPayload }>('/v1/agents', {
        method: 'POST',
        body: {
          name: input.name.trim(),
          purpose: input.purpose?.trim() || undefined,
          characterId: input.characterId,
        },
      });
      return toAgent(result.agent);
    },
  };
}

export const httpAgentsRepo = createHttpAgentsRepo();
