import { describe, expect, it } from 'vitest';
import { CHARACTERS, getCharacter, isCharacterId } from '../../shared/characters';
import { finalizeBlockages, invalidQuotes, isQuoteFound, normalizeText } from '../../shared/diagnosis';
import { mockChatReply, mockDiagnose } from '../../shared/mock';
import type { Blockage, Turn } from '../../shared/schemas';

const u = (text: string, characterId = 'nova'): Turn => ({ role: 'user', characterId, text, at: 1 });
const c = (text: string, characterId = 'nova'): Turn => ({ role: 'character', characterId, text, at: 0 });

describe('mock diagnose', () => {
  it('« Yesterday I go to the museum. » → past_tense corrigé', () => {
    const [b] = mockDiagnose({ lang: 'en', turns: [c('Hi'), u('Yesterday I go to the museum.')] });
    expect(b).toMatchObject({ key: 'past_tense', said: 'Yesterday I go to the museum.', corrected: 'Yesterday I went to the museum.', occurrences: 1, severity: 3 });
  });
  it('espagnol : ayer + voy → fui ; « la » n’est pas compté comme du français', () => {
    const res = mockDiagnose({ lang: 'es', turns: [u('Ayer voy a la playa con mis amigos.'), u('La semana pasada visito el museo de arte.')] });
    expect(res[0]).toMatchObject({ key: 'past_tense', corrected: 'Ayer fui a la playa con mis amigos.', occurrences: 2 });
    expect(res.find((b) => b.key === 'vocabulary')).toBeUndefined();
  });
  it('majuscule conservée sur le verbe corrigé', () => {
    const [b] = mockDiagnose({ lang: 'en', turns: [u('Last week Go to Paris was fun for me and my family.')] });
    expect(b?.corrected).toBe('Last week Went to Paris was fun for me and my family.');
  });
  it('réponses courtes et mots français', () => {
    const res = mockDiagnose({ lang: 'en', turns: [u('Yes.'), u('je pense')] });
    expect(res.map((b) => b.key).sort()).toEqual(['short_answers', 'vocabulary']);
    expect(res.find((b) => b.key === 'vocabulary')?.observation).toContain("l'anglais");
  });
  it('aucun tour utilisateur → aucun blocage', () => {
    expect(mockDiagnose({ lang: 'en', turns: [c('Hello')] })).toEqual([]);
    expect(mockDiagnose({ lang: 'en', turns: [u('   ')] })).toEqual([]);
  });
  it('phrase correcte et développée → aucun blocage', () => {
    expect(mockDiagnose({ lang: 'en', turns: [u('Yesterday I went to the museum with my sister.')] })).toEqual([]);
  });
});

describe('mock chat', () => {
  it('présentation au premier tour, puis répliques scriptées, conclusion < 30 s', () => {
    for (const ch of CHARACTERS) {
      for (const lang of ['en', 'es'] as const) {
        const intro = mockChatReply({ lang, characterId: ch.id, turns: [] });
        expect(intro).toContain(ch.name);
        const next = mockChatReply({ lang, characterId: ch.id, turns: [c(intro, ch.id), u('Hello', ch.id)] });
        expect(next).not.toBe(intro);
        expect(next.trim().endsWith('?')).toBe(true);
        const end = mockChatReply({ lang, characterId: ch.id, turns: [c(intro, ch.id), u('Hi', ch.id)], remainingSec: 20 });
        expect(end.endsWith('?')).toBe(true);
      }
    }
  });
  it('un nouveau personnage se présente même si la conversation a déjà des tours', () => {
    const reply = mockChatReply({ lang: 'en', characterId: 'milo', turns: [c('Hi', 'nova'), u('Hello', 'nova')] });
    expect(reply).toContain('Milo');
  });
  it('personnage inconnu → erreur', () => {
    expect(() => mockChatReply({ lang: 'en', characterId: 'zorg', turns: [] })).toThrow('unknown_character');
  });
});

describe('anti-hallucination', () => {
  const turns = [u('Yesterday I go to the museum!')];
  const invented: Blockage = { key: 'past_tense', observation: 'x', said: 'I eated a cake.', corrected: 'I ate a cake.', occurrences: 1, severity: 3 };
  it('normalisation ponctuation, casse, apostrophes', () => {
    expect(normalizeText("  I’m HERE,  ok?! ")).toBe("i'm here ok");
    expect(isQuoteFound('yesterday i go to the museum', turns)).toBe(true);
    expect(isQuoteFound('', turns)).toBe(false);
  });
  it('un said inventé est détecté puis retiré', () => {
    expect(invalidQuotes([invented], turns)).toHaveLength(1);
    const [b] = finalizeBlockages([invented], turns);
    expect(b?.said).toBeUndefined();
    expect(b?.corrected).toBeUndefined();
    expect(b?.observation).toBe('x');
  });
  it('dédoublonne, trie par gravité puis occurrences, 3 maximum', () => {
    const mk = (key: Blockage['key'], severity: 1 | 2 | 3, occurrences: number): Blockage => ({ key, observation: key, severity, occurrences });
    const out = finalizeBlockages([mk('questions', 1, 5), mk('vocabulary', 2, 1), mk('vocabulary', 3, 9), mk('agreement', 2, 3), mk('past_tense', 3, 2)], turns);
    expect(out.map((b) => b.key)).toEqual(['past_tense', 'agreement', 'vocabulary']);
  });
  it('exemple incomplet (sans corrected) retiré', () => {
    const [b] = finalizeBlockages([{ key: 'past_tense', observation: 'x', said: 'Yesterday I go to the museum', occurrences: 1, severity: 3 }], turns);
    expect(b?.said).toBeUndefined();
  });
});

describe('personnages', () => {
  it('6 personnages, Nova inclus, lookup', () => {
    expect(CHARACTERS).toHaveLength(6);
    expect(getCharacter('nova')?.roleFr).toBe('Exploratrice spatiale');
    expect(getCharacter('x')).toBeUndefined();
    expect(isCharacterId('lea')).toBe(true);
    expect(isCharacterId('bob')).toBe(false);
  });
});
