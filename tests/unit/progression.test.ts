import { describe, expect, it } from 'vitest';
import { progressionStats } from '../../src/domain/progression';
import { conv, history } from './helpers';

describe('progressionStats', () => {
  it('état vide', () => {
    expect(progressionStats([], 'en')).toEqual({ count: 0, speakingMin: 0, chart: [], improvingCount: 0 });
  });
  it('une conversation', () => {
    const s = progressionStats([conv({ past_tense: 2, vocabulary: 1 }, { speakingSec: 90 })], 'en');
    expect(s).toMatchObject({ count: 1, speakingMin: 2, chart: [{ label: 'Conv. 1', value: 3 }] });
  });
  it('plus de 4 : seules les 4 dernières dans le graphe', () => {
    const s = progressionStats(history({ past_tense: 9 }, { past_tense: 1 }, { past_tense: 2 }, { past_tense: 3 }, { past_tense: 4 }), 'en');
    expect(s.count).toBe(5);
    expect(s.chart.map((c) => c.value)).toEqual([1, 2, 3, 4]);
    expect(s.chart.map((c) => c.label)).toEqual(['Conv. 1', 'Conv. 2', 'Conv. 3', 'Conv. 4']);
  });
  it('abandons, conversations actives et diagnostics en erreur exclus', () => {
    const s = progressionStats([conv({ past_tense: 1 }), conv({ past_tense: 1 }, { status: 'error' }), conv({}, { state: 'active' })], 'en');
    expect(s.count).toBe(1);
  });
});
