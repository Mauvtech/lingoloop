import { describe, expect, it } from 'vitest';
import {
  canTransition,
  elapsedMs,
  isResumable,
  isTimeUp,
  needsEndConfirmation,
  newTimer,
  pauseTimer,
  startTimer,
  transition,
  typedSpeakingSec,
  type Phase,
} from '../../src/domain/conversation';
import { countWords, frDate, mmss, plural } from '../../src/domain/format';
import { pickCharacter, seededRandom } from '../../src/domain/pick';

describe('machine d’états', () => {
  it('parcours nominal', () => {
    let p: Phase = 'thinking';
    for (const type of ['REPLY', 'SPEECH_DONE', 'LISTEN', 'SUBMIT', 'REPLY'] as const) p = transition(p, { type });
    expect(p).toBe('characterSpeaking');
    expect(transition('thinking', { type: 'FAIL' })).toBe('error');
    expect(transition('error', { type: 'RETRY' })).toBe('thinking');
    expect(transition('listening', { type: 'CANCEL_LISTEN' })).toBe('idle');
    expect(transition('idle', { type: 'SWITCH' })).toBe('thinking');
    expect(transition('characterSpeaking', { type: 'END' })).toBe('ended');
  });
  it('transitions interdites rejetées', () => {
    expect(transition('ended', { type: 'LISTEN' })).toBe('ended');
    expect(transition('thinking', { type: 'LISTEN' })).toBe('thinking');
    expect(transition('error', { type: 'SUBMIT' })).toBe('error');
    expect(canTransition('listening', { type: 'REPLY' })).toBe(false);
    expect(canTransition('idle', { type: 'LISTEN' })).toBe(true);
  });
});

describe('chrono', () => {
  it('accumule, se met en pause et reprend', () => {
    let t = startTimer(newTimer(), 1000);
    expect(startTimer(t, 5000)).toBe(t);
    expect(elapsedMs(t, 4000)).toBe(3000);
    t = pauseTimer(t, 4000);
    expect(pauseTimer(t, 9000)).toBe(t);
    expect(elapsedMs(t, 60_000)).toBe(3000);
    t = startTimer(t, 70_000);
    expect(elapsedMs(t, 72_000)).toBe(5000);
  });
  it('fin du temps', () => {
    const t = startTimer(newTimer(), 0);
    expect(isTimeUp(t, 300, 299_999)).toBe(false);
    expect(isTimeUp(t, 300, 300_000)).toBe(true);
  });
  it('confirmation de fin', () => {
    expect(needsEndConfirmation(10, 3)).toBe(true);
    expect(needsEndConfirmation(120, 0)).toBe(true);
    expect(needsEndConfirmation(31, 1)).toBe(false);
  });
  it('reprise possible < 30 min et s’il reste du temps', () => {
    const base = { state: 'active', lastSavedAt: 0, durationSec: 100, plannedSec: 300 };
    expect(isResumable(base, 29 * 60_000)).toBe(true);
    expect(isResumable(base, 31 * 60_000)).toBe(false);
    expect(isResumable({ ...base, durationSec: 300 }, 1000)).toBe(false);
    expect(isResumable({ ...base, state: 'ended' }, 1000)).toBe(false);
  });
  it('temps de parole en mode texte', () => {
    expect(typedSpeakingSec(10)).toBe(5);
  });
});

describe('tirage', () => {
  it('jamais le personnage précédent (1 000 tirages)', () => {
    const rnd = seededRandom(42);
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const c = pickCharacter(['nova'], rnd);
      expect(c.id).not.toBe('nova');
      seen.add(c.id);
    }
    expect(seen.size).toBe(5);
  });
  it('si tout est exclu, on retombe sur la liste complète', () => {
    expect(pickCharacter(['nova', 'milo', 'iris', 'tom', 'lea', 'sam'], () => 0.99).id).toBe('sam');
  });
});

describe('formatage', () => {
  it('mm:ss, date, pluriel, mots', () => {
    expect(mmss(156)).toBe('02:36');
    expect(mmss(-3)).toBe('00:00');
    expect(frDate(new Date(2026, 10, 9).getTime())).toBe('09/11/2026');
    expect(plural(1, 'blocage')).toBe('1 blocage');
    expect(plural(2, 'blocage')).toBe('2 blocages');
    expect(countWords('  a b  c ')).toBe(3);
    expect(countWords('   ')).toBe(0);
  });
});
