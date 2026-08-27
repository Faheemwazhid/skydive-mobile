import type { ImageSourcePropType } from 'react-native';

import {
  CHARACTER_IDS,
  isCharacterId,
  type CharacterId,
} from '@/src/domain/characters';

export { CHARACTER_IDS, isCharacterId };
export type { CharacterId };

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


