import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { color, space } from '@/src/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, padded = true, style }: ScreenProps) {
  return (
    <View style={[styles.safe, styles.body, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.offWhite,
  },
  body: {
    flex: 1,
    backgroundColor: color.offWhite,
  },
  padded: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
});
