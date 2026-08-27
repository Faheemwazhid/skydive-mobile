import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Avatar, RootHeader, Screen } from '@/src/components';
import { go } from '@/src/nav';
import { templates } from '@/src/templates/catalog';
import { color, radius, space } from '@/src/theme/tokens';

export default function TemplatesTab() {

  return (
    <Screen padded={false} hasHeader>
      <RootHeader
        title="Templates"
        subtitle="Add an expert to your team"
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {templates.map((template) => (
          <Pressable
            key={template.id}
            accessibilityRole="button"
            onPress={() => go(`/templates/${template.id}`)}
            style={styles.card}
          >
            <Avatar characterId={template.characterId} size="md" />
            <View style={styles.cardText}>
              <AppText variant="body">{template.name}</AppText>
              <AppText variant="caption" tone="muted">
                {template.blurb}
              </AppText>
            </View>
          </Pressable>
        ))}
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
  lede: { marginBottom: space.md },
  card: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    backgroundColor: color.white,
    borderRadius: radius.md,
    padding: space.md,
  },
  cardText: { flex: 1, gap: space.xs },
});
