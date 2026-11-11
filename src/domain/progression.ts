import { eligibleConversations } from './eligible';
import { isImproving } from './status';
import { BLOCKAGE_KEYS } from '../../shared/schemas';
import type { Conversation, Lang } from './types';

export interface ProgressionStats {
  count: number;
  speakingMin: number;
  /** 4 dernières conversations, de la plus ancienne à la plus récente. */
  chart: { label: string; value: number }[];
  improvingCount: number;
}

export function progressionStats(conversations: readonly Conversation[], lang: Lang): ProgressionStats {
  const recentFirst = eligibleConversations(conversations, lang);
  const speakingSec = recentFirst.reduce((sum, c) => sum + c.speakingSec, 0);
  const chart = recentFirst
    .slice(0, 4)
    .reverse()
    .map((c, i) => ({ label: `Conv. ${i + 1}`, value: c.diagnosis.blockages.reduce((s, b) => s + b.occurrences, 0) }));
  return {
    count: recentFirst.length,
    speakingMin: Math.round(speakingSec / 60),
    chart,
    improvingCount: BLOCKAGE_KEYS.filter((k) => isImproving(k, recentFirst)).length,
  };
}
