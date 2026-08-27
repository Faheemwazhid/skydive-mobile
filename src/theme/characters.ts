import type { ImageSourcePropType } from 'react-native';

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

export const characterMeta: Record<
  CharacterId,
  { name: string; role: string; source: ImageSourcePropType }
> = {
  poppy: {
    name: 'Poppy',
    role: 'Marketing',
    source: require('../../assets/characters/poppy.png'),
  },
  cleo: {
    name: 'Cleo',
    role: 'Designer',
    source: require('../../assets/characters/cleo.png'),
  },
  river: {
    name: 'River',
    role: 'Legal',
    source: require('../../assets/characters/river.png'),
  },
  dot: {
    name: 'Dot',
    role: 'Executive Assistant',
    source: require('../../assets/characters/dot.png'),
  },
  moss: {
    name: 'Moss',
    role: 'Engineer',
    source: require('../../assets/characters/moss.png'),
  },
  sol: {
    name: 'Sol',
    role: 'Ops',
    source: require('../../assets/characters/sol.png'),
  },
  sky: {
    name: 'Sky',
    role: 'Customer Service',
    source: require('../../assets/characters/sky.png'),
  },
};

export function isCharacterId(value: string): value is CharacterId {
  return (CHARACTER_IDS as readonly string[]).includes(value);
}
