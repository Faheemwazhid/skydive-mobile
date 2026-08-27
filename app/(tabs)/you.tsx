import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Row, RootHeader, Screen, Section } from '@/src/components';
import {
  appearanceLabel,
  nextAppearance,
  type Appearance,
} from '@/src/session/appearance';
import { useSession, useSessionActions } from '@/src/session/SessionProvider';
import { color, radius, space } from '@/src/theme/tokens';

function initial(email: string | null): string {
  return email?.trim()?.[0]?.toUpperCase() ?? '?';
}

export default function YouTab() {
  const session = useSession();
  const { logout, beginConnect } = useSessionActions();
  const [appearance, setAppearance] = useState<Appearance>('light');

  return (
    <Screen padded={false} hasHeader>
      <RootHeader title="You" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <AppText variant="title" tone="inverse">
              {initial(session.email)}
            </AppText>
          </View>
          <View style={styles.identityText}>
            <AppText variant="body" numberOfLines={1}>
              {session.email ?? 'Signed out'}
            </AppText>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: session.connected
                      ? color.accentGreen
                      : color.greyMedium,
                  },
                ]}
              />
              <AppText variant="caption" tone="muted">
                {session.connected
                  ? 'Workspace connected'
                  : 'No workspace connected'}
              </AppText>
            </View>
          </View>
        </View>

        <Section title="Workspace">
          <Row
            label="Skydive"
            value={session.connected ? 'Connected' : 'Not connected'}
            last={session.connected}
          />
          {!session.connected ? (
            <Row label="Connect a workspace" onPress={beginConnect} last />
          ) : null}
        </Section>

        <Section title="Preferences">
          <Row
            label="Appearance"
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change appearance"
                onPress={() => setAppearance(nextAppearance(appearance))}
                style={styles.toggle}
              >
                <AppText variant="caption">
                  {appearanceLabel(appearance)}
                </AppText>
                <Ionicons
                  name="swap-horizontal"
                  size={14}
                  color={color.greyMedium}
                />
              </Pressable>
            }
            last
          />
        </Section>

        <Section title="About">
          <Row label="Version" value="1.0.0 (MVP)" />
          <Row label="Data" value="Mocked" last />
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
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: 44,
    paddingHorizontal: space.sm,
  },
});
