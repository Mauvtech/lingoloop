import { describe, expect, it } from 'vitest';
import { eligibleConversations } from '../../src/domain/eligible';
import { computeStatus, evolution, isImproving, summarizeBlockages } from '../../src/domain/status';
import { conv, history } from './helpers';

const recent = (cs: ReturnType<typeof history>) => eligibleConversations(cs, 'en');

describe('computeStatus', () => {
  it('Récurrent : présent dans ≥ 2 des 3 dernières', () => {
    expect(computeStatus('past_tense', recent(history({}, { past_tense: 1 }, { past_tense: 2 })))).toBe('recurrent');
  });
  it('À travailler : présent une seule fois dans les 3 dernières', () => {
    expect(computeStatus('vocabulary', recent(history({ vocabulary: 1 }, {}, {}, { vocabulary: 1 })))).toBe('to_work');
  });
  it('À suivre : absent des 3 dernières mais présent en 4e ou 5e', () => {
    expect(computeStatus('short_answers', recent(history({ short_answers: 1 }, {}, {}, {})))).toBe('to_watch');
    expect(computeStatus('short_answers', recent(history({ short_answers: 1 }, {}, {}, {}, {})))).toBe('to_watch');
  });
  it('Résolu : absent des 5 dernières mais présent avant', () => {
    expect(computeStatus('questions', recent(history({ questions: 2 }, {}, {}, {}, {}, {})))).toBe('resolved');
  });
  it('jamais rencontré : null', () => {
    expect(computeStatus('word_order', recent(history({ past_tense: 1 }, {})))).toBeNull();
  });
  it('filtre par langue, abandons et erreurs', () => {
    const cs = [
      conv({ past_tense: 1 }, { lang: 'es' }),
      conv({ past_tense: 1 }, { status: 'error' }),
      conv({ past_tense: 1 }, { state: 'active' }),
    ];
    expect(computeStatus('past_tense', eligibleConversations(cs, 'en'))).toBeNull();
    expect(computeStatus('past_tense', eligibleConversations(cs, 'es'))).toBe('to_work');
  });
});

describe('isImproving', () => {
  it('vrai quand les 2 dernières cumulent moins que les 2 précédentes', () => {
    expect(isImproving('past_tense', recent(history({ past_tense: 4 }, { past_tense: 4 }, { past_tense: 3 }, { past_tense: 1 })))).toBe(true);
  });
  it('faux quand ça ne baisse pas', () => {
    expect(isImproving('past_tense', recent(history({ past_tense: 1 }, { past_tense: 1 }, { past_tense: 1 }, { past_tense: 1 })))).toBe(false);
    expect(isImproving('vocabulary', recent(history({}, {}, {}, { vocabulary: 1 })))).toBe(false);
  });
  it('faux avec moins de 4 conversations', () => {
    expect(isImproving('past_tense', recent(history({ past_tense: 5 }, { past_tense: 1 }, {})))).toBe(false);
  });
});

describe('evolution et résumé', () => {
  it('évolution sur 4 conversations, de la plus ancienne à la plus récente, 0 si absent', () => {
    expect(evolution('past_tense', recent(history({ past_tense: 9 }, { past_tense: 2 }, {}, { past_tense: 1 }, { past_tense: 3 })))).toEqual([2, 0, 1, 3]);
  });
  it('trie par statut puis récence et exclut les blocages jamais vus', () => {
    const list = summarizeBlockages(history({ short_answers: 1 }, { vocabulary: 1 }, { past_tense: 1 }, { past_tense: 1 }), 'en');
    expect(list.map((b) => [b.key, b.status])).toEqual([
      ['past_tense', 'recurrent'],
      ['vocabulary', 'to_work'],
      ['short_answers', 'to_watch'],
    ]);
    expect(list[0]?.example).toBeUndefined();
  });
});
