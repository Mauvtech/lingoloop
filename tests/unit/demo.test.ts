import { describe, expect, it } from 'vitest';
import { buildDemoConversations, isDemoRequested } from '../../src/domain/demo';
import { progressionStats } from '../../src/domain/progression';
import { summarizeBlockages } from '../../src/domain/status';
import { isQuoteFound } from '../../shared/diagnosis';

const demo = buildDemoConversations(Date.parse('2026-11-11T10:00:00Z'));

describe('données de démo', () => {
  it('activées uniquement avec ?demo=1', () => {
    expect(isDemoRequested('?demo=1')).toBe(true);
    expect(isDemoRequested('?x=2&demo=1')).toBe(true);
    expect(isDemoRequested('')).toBe(false);
    expect(isDemoRequested('?demo=0')).toBe(false);
    expect(isDemoRequested('?demo=true')).toBe(false);
  });
  it('progression : 5·4·3·2, 4 conversations, 20 min, 2 en amélioration', () => {
    const s = progressionStats(demo, 'en');
    expect(s.chart.map((c) => c.value)).toEqual([5, 4, 3, 2]);
    expect(s.count).toBe(4);
    expect(s.speakingMin).toBe(20);
    expect(s.improvingCount).toBe(2);
  });
  it('statuts des maquettes', () => {
    const list = summarizeBlockages(demo, 'en');
    expect(list.map((b) => [b.label, b.status])).toEqual([
      ['Parler au passé', 'recurrent'],
      ['Manque de vocabulaire', 'to_work'],
      ['Réponses trop courtes', 'to_watch'],
    ]);
    const past = list[0];
    expect(past?.observation).toBe('Tu hésites quand tu racontes quelque chose au passé.');
    expect(past?.example).toEqual({ said: 'Yesterday I go to the museum.', corrected: 'Yesterday I went to the museum.', characterName: 'Nova' });
    expect(past?.evolution).toEqual([4, 4, 3, 1]);
    expect(list.filter((b) => b.improving).map((b) => b.key).sort()).toEqual(['past_tense', 'short_answers']);
  });
  it('diagnostic C4 conforme à la maquette 04 et exemples réellement dits', () => {
    const c4 = demo.find((c) => c.id === 'demo-c4');
    expect(c4?.characterIds).toEqual(['nova']);
    expect(c4?.durationSec).toBe(300);
    expect(c4?.diagnosis.blockages.map((b) => b.key)).toEqual(['past_tense', 'vocabulary']);
    for (const c of demo) {
      for (const b of c.diagnosis.blockages) if (b.said) expect(isQuoteFound(b.said, c.turns)).toBe(true);
    }
  });
});
