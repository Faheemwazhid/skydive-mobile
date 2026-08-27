import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/src/components';
import { useSession, useSessionActions } from '@/src/session/SessionProvider';
import { space } from '@/src/theme/tokens';

export default function YouTab() {
  const session = useSession();
  const { logout } = useSessionActions();

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
      <Button label="Log out" variant="secondary" onPress={() => logout()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: space.md,
    marginBottom: space.md,
    gap: space.xs,
  },
});
