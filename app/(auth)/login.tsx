import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Screen } from '@/src/components';
import { useSessionActions } from '@/src/session/SessionProvider';
import { color, font, radius, space } from '@/src/theme/tokens';

export default function LoginScreen() {
  const { login } = useSessionActions();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onContinue() {
    try {
      setError(null);
      await login(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="display">Let&apos;s fly</AppText>
        <AppText variant="body" tone="muted" style={styles.lede}>
          Sign in to your Skydive workspace. Continue always succeeds in this
          frontend phase.
        </AppText>
      </View>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@company.com"
        placeholderTextColor={color.greyMedium}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
      <Button label="Continue" onPress={onContinue} />
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
    maxWidth: 320,
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
