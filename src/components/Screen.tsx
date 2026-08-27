import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, space } from '@/src/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, padded = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.body,
        { paddingTop: insets.top + (padded ? space.md : 0) },
        padded && styles.padded,
        style,
      ]}
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
