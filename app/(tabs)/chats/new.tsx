import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import {
  AppText,
  Avatar,
  DetailHeader,
  LoadError,
  Loading,
  Screen,
} from '@/src/components';
import { useLoad } from '@/src/hooks/useLoad';
import { swap } from '@/src/nav';
import { color, radius, space } from '@/src/theme/tokens';

export default function NewChatScreen() {
  const repo = useAgentsRepo();
  const roster = useLoad(
    useCallback(() => repo.list(), [repo]),
    'Could not load your agents.',
  );
  const agents = roster.data ?? [];

  return (
    <Screen padded={false} hasHeader>
      <DetailHeader title="New chat" />
      <ScrollView contentContainerStyle={styles.list}>
        {roster.status === 'loading' ? <Loading /> : null}
        {roster.status === 'error' ? (
          <LoadError message={roster.error} onRetry={roster.reload} />
        ) : null}
        {agents.map((agent) => (
          <Pressable
            key={agent.id}
            accessibilityRole="button"
            onPress={() => swap(`/chats/tnew?agentId=${agent.id}`)}
            style={styles.row}
          >
            <Avatar characterId={agent.characterId} size="md" />
            <View>
              <AppText variant="body">{agent.name}</AppText>
              <AppText variant="caption" tone="muted">
                {agent.model}
              </AppText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.white,
    borderRadius: radius.md,
    padding: space.md,
  },
});
