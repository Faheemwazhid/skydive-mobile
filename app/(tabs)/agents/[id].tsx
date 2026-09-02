import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import { useChatPort } from '@/src/chat/ChatProvider';
import { latestConversationForAgent } from '@/src/chat/latestConversation';
import {
  AppText,
  Avatar,
  Button,
  DetailHeader,
  LoadError,
  Loading,
  Screen,
} from '@/src/components';
import { useLoad } from '@/src/hooks/useLoad';
import { swap } from '@/src/nav';
import { color, space } from '@/src/theme/tokens';

export default function AgentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const agents = useAgentsRepo();
  const chat = useChatPort();
  const [messageError, setMessageError] = useState<string | null>(null);

  const profile = useLoad(
    useCallback(async () => {
      if (!id) return { agent: null, chats: [] };
      const [found, convos] = await Promise.all([
        agents.get(id),
        chat.listConversations(),
      ]);
      return { agent: found, chats: convos.filter((c) => c.agentId === id) };
    }, [agents, chat, id]),
    'Could not load this agent.',
  );

  async function onMessage() {
    if (!agent) return;
    setMessageError(null);
    try {
      const latest = await latestConversationForAgent(chat, agent.id);
      if (latest) {
        swap(`/(tabs)/chats/${latest.id}?returnToAgent=${agent.id}`);
        return;
      }
      swap(`/(tabs)/chats/tnew?agentId=${agent.id}&returnToAgent=${agent.id}`);
    } catch {
      setMessageError('Could not open a chat. Try again.');
    }
  }

  if (profile.status !== 'ready') {
    return (
      <Screen padded={false} hasHeader>
        <DetailHeader onBack={() => swap('/(tabs)/agents')} />
        {profile.status === 'loading' ? (
          <Loading />
        ) : (
          <LoadError message={profile.error} onRetry={profile.reload} />
        )}
      </Screen>
    );
  }

  const { agent, chats } = profile.data;
  if (!agent) {
    return (
      <Screen padded={false} hasHeader>
        <DetailHeader onBack={() => swap('/(tabs)/agents')} />
        <LoadError message="Agent not found." />
      </Screen>
    );
  }

  return (
    <Screen padded={false} hasHeader>
      <DetailHeader
        floating
        onBack={() => swap('/(tabs)/agents')}
      />
      <ScrollView>
        <Image
          source={require('../../../assets/world/cover.jpg')}
          style={styles.cover}
        />
        <View style={styles.body}>
          <View style={styles.avatarWrap}>
            <Avatar characterId={agent.characterId} size="lg" />
          </View>
          <AppText variant="display">{agent.name}</AppText>
          {agent.description ? (
            <AppText variant="body" tone="muted" style={styles.desc}>
              {agent.description}
            </AppText>
          ) : null}
          <AppText variant="caption" tone="muted" style={styles.model}>
            {agent.model}
          </AppText>
          <Button label="Message" onPress={onMessage} style={styles.message} />
          {messageError ? (
            <AppText variant="caption" style={styles.error}>
              {messageError}
            </AppText>
          ) : null}
          <AppText variant="caption" tone="muted" style={styles.chatsLabel}>
            Chats
          </AppText>
          {chats.length === 0 ? (
            <AppText variant="body" tone="muted">
              No chats yet.
            </AppText>
          ) : (
            chats.map((convo) => (
              <Pressable
                key={convo.id}
                accessibilityRole="button"
                onPress={() =>
                  swap(
                    `/(tabs)/chats/${convo.id}?returnToAgent=${agent.id}`,
                  )
                }
                style={styles.chatRow}
              >
                <AppText variant="body">{convo.title}</AppText>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: 160,
  },
  body: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    marginTop: -28,
  },
  avatarWrap: {
    marginBottom: space.md,
  },
  desc: {
    marginTop: space.sm,
  },
  model: {
    marginTop: space.sm,
  },
  message: {
    marginTop: space.lg,
  },
  error: {
    color: color.accentRed,
    marginTop: space.sm,
  },
  chatsLabel: {
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  chatRow: {
    backgroundColor: color.white,
    padding: space.md,
    borderRadius: 16,
    marginBottom: space.sm,
  },
});
