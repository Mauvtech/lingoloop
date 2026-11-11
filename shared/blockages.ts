import type { BlockageKey } from './schemas.js';

export const BLOCKAGE_LABELS: Record<BlockageKey, string> = {
  past_tense: 'Parler au passé',
  vocabulary: 'Manque de vocabulaire',
  short_answers: 'Réponses trop courtes',
  agreement: 'Accords et conjugaison',
  word_order: 'Ordre des mots',
  questions: 'Poser des questions',
};

/** Description donnée au modèle pour chaque clé (le modèle doit choisir parmi elles). */
export const BLOCKAGE_DEFINITIONS: Record<BlockageKey, string> = {
  past_tense: 'Uses present or wrong forms when talking about the past.',
  vocabulary: 'Lacks words: falls back to French, very vague words, or circumlocutions.',
  short_answers: 'Answers are very short (a few words) and do not develop ideas.',
  agreement: 'Subject-verb agreement, gender/number agreement or conjugation errors (not past tense).',
  word_order: 'Word order copied from French (adjective position, question order, adverbs).',
  questions: 'Never or rarely asks questions back, or forms questions incorrectly.',
};
