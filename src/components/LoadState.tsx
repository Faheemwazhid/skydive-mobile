import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { color, space } from '@/src/theme/tokens';

export function Loading() {
  return (
    <View style={styles.root} accessibilityLabel="Loading">
      <ActivityIndicator color={color.greyMedium} />
    </View>
  );
}

export function LoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.root} accessibilityRole="alert">
      <AppText variant="body" tone="muted" style={styles.text}>
        {message}
      </AppText>
      {onRetry ? (
        <Button label="Try again" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.xl,
    gap: space.md,
  },
  text: { textAlign: 'center' },
});
