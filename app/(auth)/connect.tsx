import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Screen } from '@/src/components';
import { useSessionActions } from '@/src/session/SessionProvider';
import { color, font, radius, space } from '@/src/theme/tokens';

const REMEMBER_LABEL = 'Remember this device for 15 days';

export default function ConnectScreen() {
  const { connectKey } = useSessionActions();
  const [key, setKey] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConnect() {
    setError(null);
    setBusy(true);
    try {
      await connectKey(key, remember);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="display">Connect Skydive</AppText>
        <AppText variant="body" tone="muted" style={styles.lede}>
          Your account-level API key is how you sign in. It is checked with
          Skydive, encrypted on our server, and never kept on this device.
        </AppText>
      </View>

      <TextInput
        accessibilityLabel="Skydive API key"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="sky_live_…"
        placeholderTextColor={color.greyMedium}
        secureTextEntry
        value={key}
        onChangeText={setKey}
        onSubmitEditing={onConnect}
        style={styles.input}
      />

      <Pressable
        accessibilityRole="checkbox"
        // Native reads accessibilityState; react-native-web only emits
        // aria-checked when it is passed explicitly.
        accessibilityState={{ checked: remember }}
        aria-checked={remember}
        accessibilityLabel={REMEMBER_LABEL}
        onPress={() => setRemember((on) => !on)}
        style={styles.remember}
      >
        <View style={[styles.box, remember && styles.boxOn]}>
          {remember ? (
            <Ionicons name="checkmark" size={14} color={color.white} />
          ) : null}
        </View>
        <AppText variant="caption" tone="muted">
          {REMEMBER_LABEL}
        </AppText>
      </Pressable>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Button
        label={busy ? 'Checking…' : 'Continue'}
        onPress={onConnect}
        disabled={busy || key.trim().length === 0}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: space.xl,
    marginBottom: space.lg,
    gap: space.sm,
  },
  lede: {
    maxWidth: 340,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.greyLight,
    backgroundColor: color.white,
    paddingHorizontal: space.md,
    marginBottom: space.md,
    fontFamily: font.family,
    fontSize: font.size.body,
    color: color.greyDark,
  },
  remember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.md,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.greyLight,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: color.greyDark,
    borderColor: color.greyDark,
  },
  error: {
    color: color.accentRed,
    marginBottom: space.sm,
  },
});
