import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import { AppText, Avatar, Screen } from '@/src/components';
import type { Agent } from '@/src/domain/agent';
import { color, radius, space } from '@/src/theme/tokens';

export default function NewChatScreen() {
  const repo = useAgentsRepo();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    repo.list().then(setAgents);
  }, [repo]);

  return (
    <Screen>
      <AppText variant="title">New chat</AppText>
      <AppText variant="body" tone="muted" style={styles.lede}>
        Pick an agent.
      </AppText>
      <ScrollView contentContainerStyle={styles.list}>
        {agents.map((agent) => (
          <Pressable
            key={agent.id}
            accessibilityRole="button"
            onPress={() =>
              router.replace({
                pathname: '/chat/[id]',
                params: { id: 'new', agentId: agent.id },
              })
            }
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
  list: { gap: space.sm, paddingBottom: space.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.white,
    borderRadius: radius.md,
    padding: space.md,
  },
});
