import type { CharacterId } from '@/src/theme/characters';

export type Template = {
  id: string;
  name: string;
  characterId: CharacterId;
  blurb: string;
  worksWith: string[];
  whatYouGet: string[];
};
