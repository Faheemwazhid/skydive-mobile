import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import { AppText, Avatar, DetailHeader, Screen } from '@/src/components';
import { swap } from '@/src/nav';
import type { Agent } from '@/src/domain/agent';
import { color, radius, space } from '@/src/theme/tokens';

export default function NewChatScreen() {
  const repo = useAgentsRepo();
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    repo.list().then(setAgents);
  }, [repo]);

  return (
    <Screen padded={false} hasHeader>
      <DetailHeader title="New chat" />
      <ScrollView contentContainerStyle={styles.list}>
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
  lede: { marginTop: space.sm, marginBottom: space.md },
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
