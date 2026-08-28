import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import { hasReplyLanded, pollUntilReply } from '@/src/chat/pollUntilReply';
import { resolveThreadAgent } from '@/src/chat/resolveThreadAgent';
import { AppText, Avatar, BackButton, Screen } from '@/src/components';
import type { Agent } from '@/src/domain/agent';
import type { Message } from '@/src/domain/chat';
import { swap } from '@/src/nav';
import { color, font, radius, space } from '@/src/theme/tokens';

const COMPOSER_MIN_HEIGHT = 44;
const COMPOSER_MAX_HEIGHT = 120;

function ThreadEmpty({ agent }: { agent: Agent | null }) {
  return (
    <View style={styles.empty}>
      <Avatar characterId={agent?.characterId} size="lg" />
      <AppText variant="title" style={styles.emptyTitle}>
        {agent ? `Say hello to ${agent.name}` : 'Start a chat'}
      </AppText>
      <AppText variant="body" tone="muted" style={styles.emptyBody}>
        {agent?.description ??
          'Ask for an outcome, not a list of steps.'}
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
  const left = useRef(false);
  const [conversationId, setConversationId] = useState(
    isDraft ? undefined : id,
  );
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [inputHeight, setInputHeight] = useState(COMPOSER_MIN_HEIGHT);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!conversationId) return;
    const loaded = await chat.listMessages(conversationId);
    setMessages(loaded);

    // Sending the first message of a draft navigates to the real conversation,
    // which unmounts this screen and cancels the poll that was waiting on the
    // reply. Resuming here means the reply still lands on the new screen.
    if (loaded.length > 0 && !hasReplyLanded(loaded)) {
      await pollUntilReply({
        chat,
        conversationId,
        onMessages: setMessages,
        isCancelled: () => left.current,
        maxAttempts: 25,
      });
    }
  }, [chat, conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    left.current = false;
    return () => {
      left.current = true;
    };
  }, []);

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
    setInputHeight(COMPOSER_MIN_HEIGHT);
    try {
      const result = await chat.send({
        agentId: agent.id,
        conversationId,
        prompt,
      });
      setConversationId(result.conversationId);
      // For an existing thread setConversationId is a no-op (same value), so
      // this poll is the only one running. For a draft, swap() unmounts this
      // screen and its poll with it — the new screen starts its own.
      if (isDraft) swap(`/chats/${result.conversationId}`);
      await pollUntilReply({
        chat,
        conversationId: result.conversationId,
        onMessages: setMessages,
        isCancelled: () => left.current,
      });
    } catch {
      setDraft(prompt);
    } finally {
      setSending(false);
    }
  }

  const visible = messages.filter((message) => message.body.length > 0);
  const working =
    sending || messages.some((message) => message.status === 'pending');

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
            visible.length === 0 && styles.threadEmpty,
          ]}
          onContentSizeChange={() =>
            scroller.current?.scrollToEnd({ animated: false })
          }
        >
          {visible.length === 0 && !working ? (
            <ThreadEmpty agent={agent} />
          ) : (
            visible.map((message) => (
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
          {working ? (
            <View style={[styles.bubble, styles.agent, styles.typing]}>
              <AppText variant="caption" tone="muted">
                Working…
              </AppText>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onContentSizeChange={(event) => {
              const next = event.nativeEvent.contentSize.height;
              setInputHeight(
                Math.min(
                  Math.max(COMPOSER_MIN_HEIGHT, next),
                  COMPOSER_MAX_HEIGHT,
                ),
              );
            }}
            placeholder="Message"
            placeholderTextColor={color.greyMedium}
            style={[styles.input, { height: inputHeight }]}
            multiline
            numberOfLines={1}
            textAlignVertical="center"
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
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    backgroundColor: color.white,
    borderTopWidth: 1,
    borderTopColor: color.greyLight,
  },
  input: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.offWhite,
    fontFamily: font.family,
    fontSize: font.size.body,
    lineHeight: 20,
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
