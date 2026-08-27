import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatPort } from '@/src/chat/ChatProvider';
import { MarkdownText } from '@/src/chat/markdown';
import { resolveThreadAgent } from '@/src/chat/resolveThreadAgent';
import { AppText, Avatar, BackButton, Screen } from '@/src/components';
import type { Agent } from '@/src/domain/agent';
import type { Message } from '@/src/domain/chat';
import { swap } from '@/src/nav';
import { color, font, radius, space } from '@/src/theme/tokens';

function ThreadEmpty({ agent }: { agent: Agent | null }) {
  return (
    <View style={styles.empty}>
      <Avatar characterId={agent?.characterId} size="lg" />
      <AppText variant="title" style={styles.emptyTitle}>
        {agent ? `Say hello to ${agent.name}` : 'Start a chat'}
      </AppText>
      <AppText variant="body" tone="muted" style={styles.emptyBody}>
        {agent?.description ??
          'Ask for an outcome, not a list of steps. Replies are mocked until the backend lands.'}
      </AppText>
    </View>
  );
}

export default function ThreadScreen() {
  const { id, agentId: agentIdParam } = useLocalSearchParams<{
    id: string;
    agentId?: string;
  }>();
  const chat = useChatPort();
  const agents = useAgentsRepo();
  const insets = useSafeAreaInsets();
  const isDraft = id === 'new' || id === 'tnew';
  const scroller = useRef<ScrollView>(null);
  const [conversationId, setConversationId] = useState(
    isDraft ? undefined : id,
  );
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!conversationId) return;
    setMessages(await chat.listMessages(conversationId));
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
      if (isDraft) swap(`/chats/${result.conversationId}`);
      setMessages(await chat.listMessages(result.conversationId));
    } catch {
      setDraft(prompt);
    } finally {
      setSending(false);
    }
  }

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <Screen padded={false} hasHeader>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <BackButton />
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
        <ScrollView
          ref={scroller}
          style={styles.flex}
          contentContainerStyle={[
            styles.thread,
            messages.length === 0 && styles.threadEmpty,
          ]}
          onContentSizeChange={() =>
            scroller.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.length === 0 ? (
            <ThreadEmpty agent={agent} />
          ) : (
            messages.map((message) => (
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
            ))
          )}
          {sending ? (
            <View style={[styles.bubble, styles.agent, styles.typing]}>
              <AppText variant="caption" tone="muted">
                Working…
              </AppText>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.composer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add attachment"
            hitSlop={8}
            onPress={() =>
              Alert.alert('Attachments', 'Coming with the backend.')
            }
            style={styles.iconButton}
          >
            <Ionicons name="add" size={22} color={color.greyMedium} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={color.greyMedium}
            style={styles.input}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!canSend}
            onPress={onSend}
            style={[styles.sendButton, !canSend && styles.sendDisabled]}
          >
            <Ionicons name="arrow-up" size={20} color={color.white} />
          </Pressable>
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
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.greyLight,
    backgroundColor: color.white,
  },
  headerText: { flex: 1 },
  thread: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: space.lg,
    gap: space.sm,
  },
  threadEmpty: {
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  emptyTitle: {
    marginTop: space.sm,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 280,
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
  },
  agent: {
    alignSelf: 'flex-start',
    backgroundColor: color.white,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: color.greyDark,
  },
  typing: {
    paddingVertical: space.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    backgroundColor: color.white,
    borderTopWidth: 1,
    borderTopColor: color.greyLight,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.offWhite,
    fontFamily: font.family,
    fontSize: font.size.body,
    color: color.greyDark,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.greyDark,
  },
  sendDisabled: {
    backgroundColor: color.greyMedium,
  },
});
