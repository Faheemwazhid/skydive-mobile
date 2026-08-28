import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import { feedFromAgents } from '@/src/agents/feedFromAgents';
import {
  AppText,
  Avatar,
  EmptyState,
  RootHeader,
  Screen,
} from '@/src/components';
import type { Agent } from '@/src/domain/agent';
import { feedCopy, type FeedItem } from '@/src/domain/feed';
import { go } from '@/src/nav';
import { color, radius, space } from '@/src/theme/tokens';

export default function AgentsTab() {
  const repo = useAgentsRepo();
  const [agents, setAgents] = useState<Agent[]>([]);

  const load = useCallback(() => {
    let cancelled = false;
    repo.list().then((next) => {
      if (!cancelled) setAgents(next);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  useFocusEffect(load);

  const feed = feedFromAgents(agents);

  return (
    <Screen padded={false} hasHeader>
      <RootHeader
        title="Agents"
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a new agent"
            onPress={() => go('/agents/create')}
            style={styles.headerAction}
          >
            <Ionicons name="add" size={24} color={color.greyDark} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {agents.length === 0 ? (
          <EmptyState
            title="No agents yet"
            body="Hire one from Templates, or create your own."
            actionLabel="Create an agent"
            onAction={() => go('/agents/create')}
          />
        ) : null}
        <View style={styles.list}>
          {agents.map((agent) => (
            <Pressable
              key={agent.id}
              accessibilityRole="button"
              onPress={() => go(`/agents/${agent.id}`)}
              style={styles.row}
            >
              <Avatar characterId={agent.characterId} size="md" />
              <View style={styles.rowText}>
                <AppText variant="body">{agent.name}</AppText>
                <AppText variant="caption" tone="muted" numberOfLines={2}>
                  {agent.description ?? agent.model}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
        <AppText variant="caption" tone="muted" style={styles.feedLabel}>
          Activity
        </AppText>
        {feed.map((item) => (
          <FeedRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </Screen>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  return (
    <View style={styles.feedRow}>
      <AppText variant="body">{feedCopy(item)}</AppText>
      <AppText variant="caption" tone="muted">
        {item.at}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: 0,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  list: {
    gap: space.sm,
    marginTop: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.white,
    borderRadius: radius.md,
    padding: space.md,
  },
  rowText: {
    flex: 1,
    gap: space.xs,
  },
  feedLabel: {
    marginTop: space.lg,
  },
  feedRow: {
    backgroundColor: color.white,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
});
