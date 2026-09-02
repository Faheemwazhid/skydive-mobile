import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import {
  AppText,
  Avatar,
  EmptyState,
  LoadError,
  Loading,
  RootHeader,
  Screen,
} from '@/src/components';
import { useLoad } from '@/src/hooks/useLoad';
import { go } from '@/src/nav';
import { color, radius, space } from '@/src/theme/tokens';

export default function AgentsTab() {
  const repo = useAgentsRepo();
  const roster = useLoad(
    useCallback(() => repo.list(), [repo]),
    'Could not load your agents.',
  );
  const agents = roster.data ?? [];

  // useLoad fetches on mount; refresh again when the tab regains focus.
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      roster.reload();
    }, [roster.reload]),
  );

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
        {roster.status === 'loading' ? <Loading /> : null}
        {roster.status === 'error' ? (
          <LoadError message={roster.error} onRetry={roster.reload} />
        ) : null}
        {roster.status === 'ready' && agents.length === 0 ? (
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
      </ScrollView>
    </Screen>
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
});
