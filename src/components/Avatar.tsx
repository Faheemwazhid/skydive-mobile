import { Image, StyleSheet, View } from 'react-native';

import {
  characterMeta,
  isCharacterId,
  type CharacterId,
} from '@/src/theme/characters';
import { color } from '@/src/theme/tokens';

type Size = 'sm' | 'md' | 'lg';

type AvatarProps = {
  characterId?: string | null;
  size?: Size;
};

const SIZE: Record<Size, number> = { sm: 36, md: 56, lg: 88 };

export function Avatar({ characterId, size = 'md' }: AvatarProps) {
  const dim = SIZE[size];
  const id: CharacterId | null =
    characterId && isCharacterId(characterId) ? characterId : null;

  if (!id) {
    return (
      <View
        accessibilityLabel="Agent"
        style={[
          styles.fallback,
          { width: dim, height: dim, borderRadius: dim / 2 },
        ]}
      />
    );
  }

  return (
    <Image
      accessibilityLabel={characterMeta[id].name}
      source={characterMeta[id].source}
      style={{ width: dim, height: dim, borderRadius: dim / 2 }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: color.greyLight,
  },
});
