import type { Conversation, Turn } from './types';

export function isDemoRequested(search: string): boolean {
  return new URLSearchParams(search).get('demo') === '1';
}

const DAY = 86_400_000;

function turns(characterId: string, start: number, lines: [string, string][]): Turn[] {
  const out: Turn[] = [];
  lines.forEach(([character, user], i) => {
    out.push({ role: 'character', characterId, text: character, at: start + i * 40_000 });
    out.push({ role: 'user', characterId, text: user, at: start + i * 40_000 + 15_000 });
  });
  return out;
}

function conv(id: string, characterId: string, startedAt: number, durationSec: number, speakingSec: number, t: Turn[], blockages: Conversation['diagnosis']['blockages']): Conversation {
  return {
    id,
    lang: 'en',
    state: 'ended',
    startedAt,
    endedAt: startedAt + durationSec * 1000,
    lastSavedAt: startedAt + durationSec * 1000,
    plannedSec: durationSec,
    durationSec,
    speakingSec,
    characterIds: [characterId],
    turns: t,
    diagnosis: { status: 'done', blockages },
  };
}

/** Jeu de démonstration (§2) : reproduit les maquettes via les vraies fonctions du domaine. */
export function buildDemoConversations(now: number): Conversation[] {
  const c1 = now - 9 * DAY;
  const c2 = now - 6 * DAY;
  const c3 = now - 3 * DAY;
  const c4 = now - 1 * DAY;
  return [
    conv('demo-c1', 'milo', c1, 600, 320, turns('milo', c1, [
      ["Hello, I'm Milo, the chef of a little restaurant around the corner. What did you eat today?", 'Pasta.'],
      ['Mmm, that sounds good. What did you eat last weekend?', 'Last weekend I eat pizza with my friends.'],
    ]), [
      { key: 'past_tense', observation: 'Tu utilises souvent le présent pour parler du passé.', said: 'Last weekend I eat pizza with my friends.', corrected: 'Last weekend I ate pizza with my friends.', occurrences: 4, severity: 3 },
      { key: 'short_answers', observation: 'Tes réponses tiennent souvent en quelques mots.', occurrences: 1, severity: 1 },
    ]),
    conv('demo-c2', 'iris', c2, 600, 300, turns('iris', c2, [
      ["Good afternoon, I'm Iris, a detective. Tell me, what happened in your day yesterday?", 'Yesterday I see a friend and we go to a café.'],
    ]), [
      { key: 'past_tense', observation: 'Tu hésites entre le présent et le passé dans tes récits.', said: 'Yesterday I see a friend and we go to a café.', corrected: 'Yesterday I saw a friend and we went to a café.', occurrences: 4, severity: 3 },
    ]),
    conv('demo-c3', 'nova', c3, 600, 280, turns('nova', c3, [
      ["Hi, I'm Nova, a space explorer just back from a long mission. What did you do today on Earth?", 'Last week I visit my family in Lyon.'],
    ]), [
      { key: 'past_tense', observation: 'Tu hésites quand tu racontes quelque chose au passé.', said: 'Last week I visit my family in Lyon.', corrected: 'Last week I visited my family in Lyon.', occurrences: 3, severity: 3 },
    ]),
    conv('demo-c4', 'nova', c4, 300, 290, turns('nova', c4, [
      ["Hi, I'm Nova, a space explorer just back from a long mission. What did you do today on Earth?", 'Yesterday I go to the museum.'],
      ['Interesting! If you could visit a new planet, what would you explore first?', 'I would explore the… the big holes, the mountains with fire.'],
    ]), [
      { key: 'past_tense', observation: 'Tu hésites quand tu racontes quelque chose au passé.', said: 'Yesterday I go to the museum.', corrected: 'Yesterday I went to the museum.', occurrences: 1, severity: 3 },
      { key: 'vocabulary', observation: 'Tu as cherché tes mots pour décrire un lieu.', occurrences: 1, severity: 2 },
    ]),
  ];
}
