import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/AppText';
import { color, space } from '@/src/theme/tokens';

const TAP = 44;

type RootHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

/**
 * Tab-root header. Large title, no back affordance — the large size is the
 * signal that this is a top-level destination.
 */
export function RootHeader({ title, subtitle, action }: RootHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + space.lg }]}>
      <View style={styles.rootRow}>
        <View style={styles.rootTitle}>
          <AppText variant="display">{title}</AppText>
          {subtitle ? (
            <AppText variant="body" tone="muted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </View>
  );
}

type DetailHeaderProps = {
  title?: string;
  action?: ReactNode;
  onBack?: () => void;
  /** Transparent variant for screens with their own hero image. */
  floating?: boolean;
};

/**
 * Pushed-screen header. Back chevron + compact title. The pairing of a small
 * title with a back control is what marks a screen as nested.
 */
export function DetailHeader({
  title,
  action,
  onBack,
  floating = false,
}: DetailHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.detail,
        floating ? styles.detailFloating : styles.detailSolid,
        { paddingTop: insets.top + space.sm },
      ]}
    >
      <BackButton floating={floating} onPress={onBack} />
      {title ? (
        <AppText variant="title" numberOfLines={1} style={styles.detailTitle}>
          {title}
        </AppText>
      ) : (
        <View style={styles.detailTitle} />
      )}
      <View style={styles.detailAction}>{action}</View>
    </View>
  );
}

export function BackButton({
  floating = false,
  onPress,
}: {
  floating?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={
        onPress ??
        (() => {
          if (router.canGoBack()) router.back();
        })
      }
      style={[styles.back, floating && styles.backFloating]}
    >
      <Ionicons name="chevron-back" size={24} color={color.greyDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    backgroundColor: color.offWhite,
  },
  rootRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  rootTitle: { flex: 1, gap: space.xs },
  subtitle: { marginTop: space.xs },
  action: { justifyContent: 'center' },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    gap: space.xs,
  },
  detailSolid: {
    backgroundColor: color.white,
    borderBottomWidth: 1,
    borderBottomColor: color.greyLight,
  },
  detailFloating: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  detailTitle: { flex: 1 },
  detailAction: { minWidth: TAP, alignItems: 'flex-end' },
  back: {
    width: TAP,
    height: TAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backFloating: {
    backgroundColor: color.white,
    borderRadius: TAP / 2,
    shadowColor: color.greyDark,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});
