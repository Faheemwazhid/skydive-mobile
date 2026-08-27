import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import { feedFromAgents } from '@/src/agents/feedFromAgents';
import {
  AppText,
  Avatar,
  EmptyState,
  Screen,
} from '@/src/components';
import type { Agent } from '@/src/domain/agent';
import { feedCopy, type FeedItem } from '@/src/domain/feed';
import { useSession, useSessionActions } from '@/src/session/SessionProvider';
import { color, radius, space } from '@/src/theme/tokens';

export default function TeamTab() {
  const session = useSession();
  const { beginConnect } = useSessionActions();
  const repo = useAgentsRepo();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (!session.connected) {
      setAgents([]);
      return;
    }
    let cancelled = false;
    repo.list().then((next) => {
      if (!cancelled) setAgents(next);
    });
    return () => {
      cancelled = true;
    };
  }, [repo, session.connected]);

  if (!session.connected) {
    return (
      <Screen>
        <EmptyState
          title="Connect Skydive"
          body="Paste an API key to see the agents in your workspace."
          actionLabel="Connect Skydive"
          onAction={() => beginConnect()}
        />
      </Screen>
    );
  }

  const feed = feedFromAgents(agents);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="title">Team</AppText>
        <View style={styles.list}>
          {agents.map((agent) => (
            <Pressable
              key={agent.id}
              accessibilityRole="button"
              onPress={() => router.push(`/agent/${agent.id}`)}
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
  scroll: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
    gap: space.sm,
  },
  list: {
    gap: space.sm,
    marginTop: space.md,
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
