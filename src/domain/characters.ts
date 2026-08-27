/**
 * The canonical character list. Deliberately free of asset imports so the BFF
 * can share it — the server assigns characters too, and two drifting lists
 * would silently mismatch.
 */
export const CHARACTER_IDS = [
  'poppy',
  'cleo',
  'river',
  'dot',
  'moss',
  'sol',
  'sky',
] as const;

export type CharacterId = (typeof CHARACTER_IDS)[number];

export function isCharacterId(value: string): value is CharacterId {
  return (CHARACTER_IDS as readonly string[]).includes(value);
}

/**
 * Stable character for an agent we did not create, so a roster from Skydive
 * never renders as a wall of grey placeholders. Same id always maps to the
 * same character.
 */
export function characterForAgentId(agentId: string): CharacterId {
  let hash = 0;
  for (let i = 0; i < agentId.length; i += 1) {
    hash = (hash * 31 + agentId.charCodeAt(i)) >>> 0;
  }
  return CHARACTER_IDS[hash % CHARACTER_IDS.length];
}
