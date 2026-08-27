import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useAgentsRepo } from '@/src/agents/AgentsProvider';
import { useChatPort } from '@/src/chat/ChatProvider';
import { MarkdownText } from '@/src/chat/markdown';
import { resolveThreadAgent } from '@/src/chat/resolveThreadAgent';
import { AppText, Avatar, Button, Screen } from '@/src/components';
import type { Agent } from '@/src/domain/agent';
import type { Message } from '@/src/domain/chat';
import { color, font, radius, space } from '@/src/theme/tokens';

export default function ThreadScreen() {
  const { id, agentId: agentIdParam } = useLocalSearchParams<{
    id: string;
    agentId?: string;
  }>();
  const chat = useChatPort();
  const agents = useAgentsRepo();
  const router = useRouter();
  const [conversationId, setConversationId] = useState(
    id === 'new' ? undefined : id,
  );
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (conversationId) {
      const thread = await chat.listMessages(conversationId);
      setMessages(thread);
    }
  }, [chat, conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const fromParam = Array.isArray(agentIdParam)
      ? agentIdParam[0]
      : agentIdParam;
    let cancelled = false;
    resolveThreadAgent({
      agents,
      chat,
      agentId: fromParam,
      conversationId,
    }).then((found) => {
      if (!cancelled) setAgent(found);
    });
    return () => {
      cancelled = true;
    };
  }, [agentIdParam, agents, chat, conversationId]);

  async function onSend() {
    if (!agent || sending) return;
    const prompt = draft.trim();
    if (!prompt) return;
    setSending(true);
    setDraft('');
    try {
      const result = await chat.send({
        agentId: agent.id,
        conversationId,
        prompt,
      });
      setConversationId(result.conversationId);
      if (id === 'new') router.replace(`/chat/${result.conversationId}`);
      setMessages(await chat.listMessages(result.conversationId));
    } catch {
      setDraft(prompt);
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Avatar characterId={agent?.characterId} size="sm" />
        <View style={styles.headerText}>
          <AppText variant="body">{agent?.name ?? 'Agent'}</AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {agent?.model ?? ''}
          </AppText>
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.thread}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.bubble,
                message.role === 'user' ? styles.user : styles.agent,
              ]}
            >
              <MarkdownText
                body={message.body}
                tone={message.role === 'user' ? 'user' : 'agent'}
              />
            </View>
          ))}
        </ScrollView>
        <View style={styles.composer}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert('Attachments', 'Coming with the backend.')
            }
            style={styles.attach}
          >
            <AppText variant="caption">Attach</AppText>
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={color.greyMedium}
            style={styles.input}
            multiline
          />
          <Button
            label={sending ? '…' : 'Send'}
            onPress={onSend}
            disabled={sending}
            style={styles.send}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.greyLight,
    backgroundColor: color.white,
  },
  headerText: { flex: 1 },
  thread: {
    padding: space.lg,
    gap: space.sm,
    paddingBottom: space.xl,
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: radius.md,
    padding: space.md,
  },
  agent: {
    alignSelf: 'flex-start',
    backgroundColor: color.white,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: color.greyDark,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    padding: space.md,
    backgroundColor: color.white,
    borderTopWidth: 1,
    borderTopColor: color.greyLight,
  },
  attach: {
    paddingVertical: space.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontFamily: font.family,
    fontSize: font.size.body,
    color: color.greyDark,
  },
  send: {
    minHeight: 40,
    paddingHorizontal: space.md,
  },
});
