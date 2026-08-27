import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import { useChatPort } from '@/src/chat/ChatProvider';
import { AppText, Avatar, EmptyState, Screen } from '@/src/components';
import type { Agent } from '@/src/domain/agent';
import type { Conversation } from '@/src/domain/chat';
import { go } from '@/src/nav';
import { useSession } from '@/src/session/SessionProvider';
import { color, radius, space } from '@/src/theme/tokens';

export default function ChatsTab() {
  const session = useSession();
  const chat = useChatPort();
  const agents = useAgentsRepo();
  const [rows, setRows] = useState<
    { conversation: Conversation; agent: Agent | null }[]
  >([]);

  const load = useCallback(async () => {
    if (!session.connected) {
      setRows([]);
      return;
    }
    const [convos, roster] = await Promise.all([
      chat.listConversations(),
      agents.list(),
    ]);
    setRows(
      convos.map((conversation) => ({
        conversation,
        agent: roster.find((a) => a.id === conversation.agentId) ?? null,
      })),
    );
  }, [agents, chat, session.connected]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!session.connected) {
    return (
      <Screen>
        <EmptyState
          title="No chats yet"
          body="Connect Skydive from Team to talk to your agents."
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <AppText variant="title">Chats</AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => go('/chats/new')}
        >
          <AppText variant="body">New</AppText>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {rows.length === 0 ? (
          <AppText variant="body" tone="muted">
            No conversations yet.
          </AppText>
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
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
