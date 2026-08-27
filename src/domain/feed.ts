export type FeedKind = 'joined' | 'new_chat' | 'replied';

export type FeedItem = {
  id: string;
  kind: FeedKind;
  agentId: string;
  agentName: string;
  at: string;
};

export function feedCopy(item: FeedItem): string {
  if (item.kind === 'joined') {
    return `${item.agentName} joined your workspace`;
  }
  if (item.kind === 'new_chat') {
    return `${item.agentName} started a chat`;
  }
  return `${item.agentName} replied`;
}
