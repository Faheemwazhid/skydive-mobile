import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Screen } from '@/src/components';
import { useSessionActions } from '@/src/session/SessionProvider';
import { color, font, radius, space } from '@/src/theme/tokens';

const MAX_NAME = 60;

export default function NameScreen() {
  const { setDisplayName } = useSessionActions();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setError(null);
    setBusy(true);
    try {
      await setDisplayName(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that name');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="display">What should we call you?</AppText>
        <AppText variant="body" tone="muted" style={styles.lede}>
          Skydive knows your agents, not your name. This is ours, and it is only
          used to label your own account.
        </AppText>
      </View>

      <TextInput
        accessibilityLabel="Your name"
        autoCapitalize="words"
        autoCorrect={false}
        autoFocus
        maxLength={MAX_NAME}
        placeholder="Your name"
        placeholderTextColor={color.greyMedium}
        value={name}
        onChangeText={setName}
        onSubmitEditing={onSave}
        style={styles.input}
      />

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Button
        label={busy ? 'Saving…' : 'Continue'}
        onPress={onSave}
        disabled={busy || name.trim().length === 0}
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
});
