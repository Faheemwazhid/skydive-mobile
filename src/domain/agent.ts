import type { CharacterId } from '@/src/theme/characters';

export const IN_APP_MODEL = 'openai/gpt-5.6-luna' as const;

export type Agent = {
  id: string;
  name: string;
  description: string | null;
  model: string;
  url: string | null;
  characterId: CharacterId | null;
};

export type CreateAgentInput = {
  name: string;
  purpose?: string;
  characterId: CharacterId;
};

export type AgentsRepo = {
  list(): Promise<Agent[]>;
  get(id: string): Promise<Agent | null>;
  create(input: CreateAgentInput): Promise<Agent>;
};
