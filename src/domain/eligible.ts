import type { Conversation, Lang } from './types';

export function conversationTime(c: Conversation): number {
  return c.endedAt ?? c.startedAt;
}

/** Conversations terminées, diagnostic réussi, dans la langue donnée — de la plus récente à la plus ancienne. */
export function eligibleConversations(conversations: readonly Conversation[], lang: Lang): Conversation[] {
  return conversations
    .filter((c) => c.state === 'ended' && c.diagnosis.status === 'done' && c.lang === lang)
    .sort((a, b) => conversationTime(b) - conversationTime(a));
}

/** Conversations terminées (historique), toutes langues, de la plus récente à la plus ancienne. */
export function endedConversations(conversations: readonly Conversation[]): Conversation[] {
  return conversations.filter((c) => c.state === 'ended').sort((a, b) => conversationTime(b) - conversationTime(a));
}
