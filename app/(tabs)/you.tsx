import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Row, RootHeader, Screen, Section } from '@/src/components';
import { useSession, useSessionActions } from '@/src/session/SessionProvider';
import { color, radius, space } from '@/src/theme/tokens';

function initial(name: string | null): string {
  return name?.trim()?.[0]?.toUpperCase() ?? '?';
}

export default function YouTab() {
  const session = useSession();
  const { logout } = useSessionActions();

  return (
    <Screen padded={false} hasHeader>
      <RootHeader title="You" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <AppText variant="title" tone="inverse">
              {initial(session.displayName)}
            </AppText>
          </View>
          <View style={styles.identityText}>
            <AppText variant="body" numberOfLines={1}>
              {session.displayName ?? 'Signed out'}
            </AppText>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: session.keyPrefix
                      ? color.accentGreen
                      : color.greyMedium,
                  },
                ]}
              />
              <AppText variant="caption" tone="muted">
                {session.keyPrefix
                  ? 'Workspace connected'
                  : 'No workspace connected'}
              </AppText>
            </View>
          </View>
        </View>

        <Section title="Workspace">
          <Row label="Skydive" value="Connected" />
          <Row label="Key" value={session.keyPrefix ?? '—'} last />
        </Section>

        <Section title="About">
          <Row label="Version" value="1.0.0 (MVP)" />
          <Row label="Data" value="Live Skydive" last />
        </Section>

        <Section>
          <Row label="Log out" tone="danger" onPress={logout} last />
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.white,
    borderRadius: radius.md,
    padding: space.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.greyDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1, gap: space.xs },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
