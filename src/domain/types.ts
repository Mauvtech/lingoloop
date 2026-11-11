import type { Blockage, Lang, Turn } from '../../shared/schemas';

export type { Blockage, BlockageKey, Lang, Turn } from '../../shared/schemas';

export type DurationMin = 3 | 5 | 10;
export const DURATIONS: readonly DurationMin[] = [3, 5, 10];

export interface Settings {
  lang: Lang;
  durationMin: DurationMin;
}

export const DEFAULT_SETTINGS: Settings = { lang: 'en', durationMin: 5 };

export interface Diagnosis {
  status: 'pending' | 'done' | 'error';
  blockages: Blockage[];
}

export interface Conversation {
  id: string;
  lang: Lang;
  /** Une conversation abandonnée est supprimée, jamais stockée. */
  state: 'active' | 'ended';
  startedAt: number;
  endedAt?: number;
  lastSavedAt: number;
  plannedSec: number;
  durationSec: number;
  speakingSec: number;
  characterIds: string[];
  turns: Turn[];
  diagnosis: Diagnosis;
}

export const LANG_LABEL: Record<Lang, string> = { en: 'Anglais', es: 'Espagnol' };
export const LANG_TITLE: Record<Lang, string> = { en: "Pratiquer l'anglais", es: "Pratiquer l'espagnol" };
export const LANG_BCP47: Record<Lang, string> = { en: 'en-US', es: 'es-ES' };
