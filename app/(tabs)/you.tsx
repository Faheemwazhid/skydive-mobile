import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/src/components';
import {
  appearanceLabel,
  nextAppearance,
  type Appearance,
} from '@/src/session/appearance';
import { useSession, useSessionActions } from '@/src/session/SessionProvider';
import { space } from '@/src/theme/tokens';

export default function YouTab() {
  const session = useSession();
  const { logout, beginConnect } = useSessionActions();
  const [appearance, setAppearance] = useState<Appearance>('light');

  return (
    <Screen>
      <AppText variant="title">You</AppText>
      <View style={styles.block}>
        <AppText variant="caption" tone="muted">
          Email
        </AppText>
        <AppText variant="body">{session.email ?? '—'}</AppText>
      </View>
      <View style={styles.block}>
        <AppText variant="caption" tone="muted">
          Workspace
        </AppText>
        <AppText variant="body">
          {session.connected ? 'Connected' : 'Not connected'}
        </AppText>
      </View>
      <View style={styles.block}>
        <AppText variant="caption" tone="muted">
          Appearance
        </AppText>
        <AppText variant="body">{appearanceLabel(appearance)}</AppText>
      </View>
      <Button
        label="Toggle appearance"
        variant="secondary"
        onPress={() => setAppearance(nextAppearance(appearance))}
        style={styles.button}
      />
      {!session.connected ? (
        <Button
          label="Connect Skydive"
          onPress={() => beginConnect()}
          style={styles.button}
        />
      ) : null}
      <Button
        label="Log out"
        variant="secondary"
        onPress={() => logout()}
        style={styles.button}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: space.md,
    marginBottom: space.sm,
    gap: space.xs,
  },
  button: {
    marginTop: space.md,
  },
});
