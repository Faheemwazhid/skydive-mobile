import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import { useChatPort } from '@/src/chat/ChatProvider';
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

export default function ChatsTab() {
  const chat = useChatPort();
  const agents = useAgentsRepo();
  const list = useLoad(
    useCallback(async () => {
      const [convos, roster] = await Promise.all([
        chat.listConversations(),
        agents.list(),
      ]);
      return convos.map((conversation) => ({
        conversation,
        agent: roster.find((a) => a.id === conversation.agentId) ?? null,
      }));
    }, [agents, chat]),
    'Could not load your chats.',
  );
  const rows = list.data ?? [];

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      list.reload();
    }, [list.reload]),
  );

  return (
    <Screen padded={false} hasHeader>
      <RootHeader
        title="Chats"
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start a new chat"
            onPress={() => go('/chats/new')}
            style={styles.headerAction}
          >
            <Ionicons name="create-outline" size={24} color={color.greyDark} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {list.status === 'loading' ? <Loading /> : null}
        {list.status === 'error' ? (
          <LoadError message={list.error} onRetry={list.reload} />
        ) : null}
        {list.status === 'ready' && rows.length === 0 ? (
          <EmptyState
            title="No chats yet"
            body="Pick an agent and say hello."
            actionLabel="New chat"
            onAction={() => go('/chats/new')}
          />
        ) : (
          rows.map(({ conversation, agent }) => (
            <Pressable
              key={conversation.id}
              accessibilityRole="button"
              onPress={() => go(`/chats/${conversation.id}`)}
              style={styles.row}
            >
              <Avatar characterId={agent?.characterId} size="sm" />
              <View style={styles.rowText}>
                <AppText variant="body">{agent?.name ?? 'Agent'}</AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {conversation.title}
                </AppText>
              </View>
            </Pressable>
          ))
        )}
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
    paddingBottom: space.xl,
    gap: space.sm,
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
