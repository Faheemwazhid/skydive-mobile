import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { space } from '@/src/theme/tokens';

type EmptyStateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="body" tone="muted" style={styles.body}>
        {body}
      </AppText>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
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
    gap: space.sm,
  },
  body: {
    textAlign: 'center',
  },
  action: {
    marginTop: space.md,
    alignSelf: 'stretch',
  },
});
