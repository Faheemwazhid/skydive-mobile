import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import { AppText, Avatar, Button, Screen } from '@/src/components';
import { swap } from '@/src/nav';
import { getTemplate } from '@/src/templates/catalog';
import { color, space } from '@/src/theme/tokens';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const template = id ? getTemplate(id) : undefined;
  const repo = useAgentsRepo();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAdd() {
    if (!template) return;
    setBusy(true);
    setError(null);
    try {
      const agent = await repo.create({
        name: template.name,
        purpose: template.blurb,
        characterId: template.characterId,
      });
      swap(`/team/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add');
    } finally {
      setBusy(false);
    }
  }

  if (!template) {
    return (
      <Screen>
        <AppText variant="body" tone="muted">
          Template not found.
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Avatar characterId={template.characterId} size="lg" />
        <AppText variant="title">{template.name}</AppText>
        <AppText variant="body" tone="muted">
          {template.blurb}
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.section}>
          Works with
        </AppText>
        <AppText variant="body">{template.worksWith.join(' · ')}</AppText>
        <AppText variant="caption" tone="muted" style={styles.section}>
          What you get
        </AppText>
        {template.whatYouGet.map((item) => (
          <AppText key={item} variant="body">
            {item}
          </AppText>
        ))}
        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}
        <Button
          label="Add to your team"
          onPress={onAdd}
          disabled={busy}
          style={styles.add}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: space.lg,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  section: { marginTop: space.md },
  error: { color: color.accentRed },
  add: { marginTop: space.lg },
});
