import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import {
  AppText,
  Avatar,
  Button,
  DetailHeader,
  Screen,
} from '@/src/components';
import { go, swap } from '@/src/nav';
import { CHARACTER_IDS } from '@/src/theme/characters';
import { color, font, radius, space } from '@/src/theme/tokens';
import type { CharacterId } from '@/src/theme/characters';

export default function CreateAgentScreen() {
  const repo = useAgentsRepo();
  const [characterId, setCharacterId] = useState<CharacterId>('moss');
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCreate() {
    setBusy(true);
    setError(null);
    try {
      const agent = await repo.create({ name, purpose, characterId });
      swap(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen padded={false} hasHeader>
      <DetailHeader title="New agent" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="caption" tone="muted" style={styles.label}>
          Character
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chars}>
            {CHARACTER_IDS.map((id) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                onPress={() => setCharacterId(id)}
                style={[
                  styles.char,
                  characterId === id ? styles.charOn : null,
                ]}
              >
                <Avatar characterId={id} size="md" />
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <TextInput
          placeholder="Name"
          placeholderTextColor={color.greyMedium}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Purpose"
          placeholderTextColor={color.greyMedium}
          value={purpose}
          onChangeText={setPurpose}
          style={[styles.input, styles.purpose]}
          multiline
        />
        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}
        <Button
          label="Get started"
          onPress={onCreate}
          disabled={busy}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => go('/templates')}
          style={styles.templates}
        >
          <AppText variant="body">Browse templates</AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: space.lg,
    paddingBottom: space.xl,
    gap: space.md,
  },
  label: { marginTop: space.sm },
  chars: { flexDirection: 'row', gap: space.sm, paddingVertical: space.sm },
  char: {
    borderRadius: 32,
    padding: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  charOn: { borderColor: color.greyDark },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.greyLight,
    backgroundColor: color.white,
    paddingHorizontal: space.md,
    fontFamily: font.family,
    fontSize: font.size.body,
    color: color.greyDark,
  },
  purpose: { minHeight: 96, textAlignVertical: 'top', paddingTop: space.md },
  error: { color: color.accentRed },
  templates: { alignItems: 'center', paddingVertical: space.sm },
});
