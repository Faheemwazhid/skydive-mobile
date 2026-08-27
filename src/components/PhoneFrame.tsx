import { Platform, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { color } from '@/src/theme/tokens';

const MAX_WIDTH = 428;

export function PhoneFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }
  return (
    <View style={styles.outer}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: color.greyDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    maxHeight: 900,
    backgroundColor: color.offWhite,
    overflow: 'hidden',
    borderRadius: 24,
  },
});
