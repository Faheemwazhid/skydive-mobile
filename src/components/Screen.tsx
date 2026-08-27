import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, space } from '@/src/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
  /**
   * Set when the screen renders its own RootHeader/DetailHeader — the header
   * owns the top safe-area inset, so the body must not add it again.
   */
  hasHeader?: boolean;
  style?: ViewStyle;
};

export function Screen({
  children,
  padded = true,
  hasHeader = false,
  style,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = hasHeader ? 0 : insets.top + (padded ? space.md : 0);
  return (
    <View
      style={[styles.body, { paddingTop }, padded && styles.padded, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.offWhite,
  },
  padded: {
    paddingHorizontal: space.lg,
  },
});
