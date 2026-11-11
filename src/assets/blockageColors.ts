import type { BlockageKey } from '../../shared/schemas';

/** Fond de pastille par blocage (comme dans la maquette 06). */
export const BLOCKAGE_ICON_BG: Record<BlockageKey, string> = {
  past_tense: 'var(--sun-100)',
  vocabulary: 'var(--sea-100)',
  short_answers: 'var(--neutral-100)',
  agreement: 'var(--sea-100)',
  word_order: 'var(--neutral-100)',
  questions: 'var(--sun-100)',
};
