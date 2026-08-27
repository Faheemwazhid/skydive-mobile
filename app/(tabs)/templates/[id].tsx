import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import {
  AppText,
  Avatar,
  Button,
  DetailHeader,
  Screen,
} from '@/src/components';
import { swap } from '@/src/nav';
import { getTemplate } from '@/src/templates/catalog';
import { color, radius, space } from '@/src/theme/tokens';

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
      swap(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add');
    } finally {
      setBusy(false);
    }
  }

  if (!template) {
    return (
      <Screen padded={false} hasHeader>
        <DetailHeader title="Template" />
        <View style={styles.missing}>
          <AppText variant="body" tone="muted">
            Template not found.
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} hasHeader>
      <DetailHeader title={template.name} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Avatar characterId={template.characterId} size="lg" />
          <AppText variant="display" style={styles.name}>
            {template.name}
          </AppText>
          <AppText variant="body" tone="muted" style={styles.blurb}>
            {template.blurb}
          </AppText>
        </View>

        <View style={styles.group}>
          <AppText variant="caption" tone="muted" style={styles.groupLabel}>
            WORKS WITH
          </AppText>
          <View style={styles.chips}>
            {template.worksWith.map((item) => (
              <View key={item} style={styles.chip}>
                <AppText variant="caption">{item}</AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <AppText variant="caption" tone="muted" style={styles.groupLabel}>
            WHAT YOU GET
          </AppText>
          <View style={styles.card}>
            {template.whatYouGet.map((item, index) => (
              <View
                key={item}
                style={[
                  styles.getRow,
                  index < template.whatYouGet.length - 1 && styles.getDivider,
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={color.accentGreen}
                />
                <AppText variant="body" style={styles.getText}>
                  {item}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={busy ? 'Adding…' : 'Add to your workspace'}
          onPress={onAdd}
          disabled={busy}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.lg,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: space.sm,
  },
  name: { textAlign: 'center' },
  blurb: { textAlign: 'center', maxWidth: 300 },
  group: { marginTop: space.lg, gap: space.sm },
  groupLabel: { letterSpacing: 0.6, paddingHorizontal: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    backgroundColor: color.white,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  card: {
    backgroundColor: color.white,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  getRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: 12,
  },
  getDivider: {
    borderBottomWidth: 1,
    borderBottomColor: color.greyLight,
  },
  getText: { flex: 1 },
  error: { color: color.accentRed, marginTop: space.md },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    backgroundColor: color.offWhite,
    borderTopWidth: 1,
    borderTopColor: color.greyLight,
  },
});
