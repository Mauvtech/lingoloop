import type { Blockage, BlockageKey, Conversation, Lang } from '../../src/domain/types';

let n = 0;
export function conv(
  blockages: Partial<Record<BlockageKey, number>>,
  opts: { t?: number; lang?: Lang; state?: Conversation['state']; status?: Conversation['diagnosis']['status']; speakingSec?: number } = {},
): Conversation {
  n += 1;
  const t = opts.t ?? n * 1000;
  const list: Blockage[] = Object.entries(blockages).map(([key, occurrences]) => ({
    key: key as BlockageKey,
    observation: `obs ${key}`,
    occurrences: occurrences as number,
    severity: 2,
  }));
  return {
    id: `c${n}`,
    lang: opts.lang ?? 'en',
    state: opts.state ?? 'ended',
    startedAt: t,
    endedAt: t + 100,
    lastSavedAt: t + 100,
    plannedSec: 300,
    durationSec: 300,
    speakingSec: opts.speakingSec ?? 60,
    characterIds: ['nova'],
    turns: [],
    diagnosis: { status: opts.status ?? 'done', blockages: list },
  };
}

/** Construit une liste dans l'ordre chronologique : le premier élément est le plus ancien. */
export function history(...items: Partial<Record<BlockageKey, number>>[]): Conversation[] {
  return items.map((b, i) => conv(b, { t: (i + 1) * 10_000 }));
}
