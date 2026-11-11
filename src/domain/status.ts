import { BLOCKAGE_LABELS } from '../../shared/blockages';
import { getCharacter } from '../../shared/characters';
import { BLOCKAGE_KEYS } from '../../shared/schemas';
import { conversationTime, eligibleConversations } from './eligible';
import type { BlockageKey, Conversation, Lang } from './types';

export type BlockageStatus = 'recurrent' | 'to_work' | 'to_watch' | 'resolved';

export const STATUS_LABEL: Record<BlockageStatus, string> = {
  recurrent: 'Récurrent',
  to_work: 'À travailler',
  to_watch: 'À suivre',
  resolved: 'Résolu',
};

const STATUS_ORDER: Record<BlockageStatus, number> = { recurrent: 0, to_work: 1, to_watch: 2, resolved: 3 };

function occurrencesIn(c: Conversation, key: BlockageKey): number {
  return c.diagnosis.blockages.find((b) => b.key === key)?.occurrences ?? 0;
}

/**
 * Statut d'un blocage. `recentFirst` = conversations éligibles, de la plus récente à la plus ancienne.
 * Renvoie null si le blocage n'a jamais été rencontré.
 */
export function computeStatus(key: BlockageKey, recentFirst: readonly Conversation[]): BlockageStatus | null {
  const present = recentFirst.map((c) => occurrencesIn(c, key) > 0);
  if (!present.some(Boolean)) return null;
  const inR3 = present.slice(0, 3).filter(Boolean).length;
  if (inR3 >= 2) return 'recurrent';
  if (inR3 === 1) return 'to_work';
  if (present.slice(3, 5).some(Boolean)) return 'to_watch';
  return 'resolved';
}

/** Les 2 plus récentes cumulent strictement moins d'occurrences que les 2 précédentes (≥ 1). */
export function isImproving(key: BlockageKey, recentFirst: readonly Conversation[]): boolean {
  if (recentFirst.length < 4) return false;
  const occ = recentFirst.slice(0, 4).map((c) => occurrencesIn(c, key));
  const recent = (occ[0] ?? 0) + (occ[1] ?? 0);
  const older = (occ[2] ?? 0) + (occ[3] ?? 0);
  return older >= 1 && recent < older;
}

/** Occurrences sur les 4 dernières conversations, de la plus ancienne à la plus récente. */
export function evolution(key: BlockageKey, recentFirst: readonly Conversation[]): number[] {
  return recentFirst
    .slice(0, 4)
    .map((c) => occurrencesIn(c, key))
    .reverse();
}

export interface BlockageSummary {
  key: BlockageKey;
  label: string;
  status: BlockageStatus;
  lastSeen: number;
  observation: string;
  example?: { said: string; corrected: string; characterName: string };
  evolution: number[];
  improving: boolean;
}

export function summarizeBlockages(conversations: readonly Conversation[], lang: Lang): BlockageSummary[] {
  const recentFirst = eligibleConversations(conversations, lang);
  const out: BlockageSummary[] = [];
  for (const key of BLOCKAGE_KEYS) {
    const status = computeStatus(key, recentFirst);
    if (!status) continue;
    const withKey = recentFirst.filter((c) => occurrencesIn(c, key) > 0);
    const latest = withKey[0];
    if (!latest) continue;
    const latestBlockage = latest.diagnosis.blockages.find((b) => b.key === key);
    const exampleConv = withKey.find((c) => {
      const b = c.diagnosis.blockages.find((x) => x.key === key);
      return b?.said !== undefined && b.corrected !== undefined;
    });
    const exampleBlockage = exampleConv?.diagnosis.blockages.find((b) => b.key === key);
    const speakerId = exampleConv?.turns.find((t) => t.role === 'user' && exampleBlockage?.said !== undefined && t.text.includes(exampleBlockage.said))?.characterId ?? exampleConv?.characterIds[0];
    out.push({
      key,
      label: BLOCKAGE_LABELS[key],
      status,
      lastSeen: conversationTime(latest),
      observation: latestBlockage?.observation ?? '',
      example:
        exampleBlockage?.said !== undefined && exampleBlockage.corrected !== undefined
          ? { said: exampleBlockage.said, corrected: exampleBlockage.corrected, characterName: getCharacter(speakerId ?? '')?.name ?? '' }
          : undefined,
      evolution: evolution(key, recentFirst),
      improving: isImproving(key, recentFirst),
    });
  }
  return out.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.lastSeen - a.lastSeen);
}
