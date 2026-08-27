import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Screen } from '@/src/components';
import { useSessionActions } from '@/src/session/SessionProvider';
import { color, font, radius, space } from '@/src/theme/tokens';

export default function ConnectScreen() {
  const { connectKey, skipConnect } = useSessionActions();
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onConnect() {
    try {
      setError(null);
      await connectKey(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect');
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="display">Connect Skydive</AppText>
        <AppText variant="body" tone="muted" style={styles.lede}>
          Paste an account-level API key. It is not stored on this device. Skip
          to browse empty Team and Chats.
        </AppText>
      </View>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="sky_live_…"
        placeholderTextColor={color.greyMedium}
        secureTextEntry
        value={key}
        onChangeText={setKey}
        style={styles.input}
      />
      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <Button label="Continue" onPress={onConnect} />
      <Button
        label="Skip for now"
        variant="ghost"
        onPress={() => skipConnect()}
        style={styles.skip}
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
  error: {
    color: color.accentRed,
    marginBottom: space.sm,
  },
  skip: {
    marginTop: space.sm,
  },
});
