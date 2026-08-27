import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/AppText';
import { color, radius, space } from '@/src/theme/tokens';

const ROW_HEIGHT = 44;

export function Section({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? (
        <AppText variant="caption" tone="muted" style={styles.sectionTitle}>
          {title.toUpperCase()}
        </AppText>
      ) : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

type RowProps = {
  label: string;
  value?: string;
  /** Renders a control (switch, badge) instead of a value string. */
  trailing?: ReactNode;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  last?: boolean;
};

export function Row({
  label,
  value,
  trailing,
  onPress,
  tone = 'default',
  last = false,
}: RowProps) {
  const body = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <AppText
        variant="body"
        style={tone === 'danger' ? styles.danger : undefined}
      >
        {label}
      </AppText>
      <View style={styles.rowTrailing}>
        {value ? (
          <AppText variant="body" tone="muted">
            {value}
          </AppText>
        ) : null}
        {trailing}
        {onPress && tone !== 'danger' ? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={color.greyMedium}
          />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: space.lg, gap: space.sm },
  sectionTitle: { letterSpacing: 0.6, paddingHorizontal: space.xs },
  card: {
    backgroundColor: color.white,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: 12,
    gap: space.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: color.greyLight,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  pressed: { opacity: 0.6 },
  danger: { color: color.accentRed },
});
