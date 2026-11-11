import { getCharacter, type CharacterId } from './characters.js';
import { finalizeBlockages } from './diagnosis.js';
import type { Blockage, ChatRequest, DiagnoseRequest, Lang, Turn } from './schemas.js';

type Script = { intro: string; lines: readonly string[] };

const SCRIPTS: Record<CharacterId, Record<Lang, Script>> = {
  nova: {
    en: {
      intro: "Hi, I'm Nova, a space explorer just back from a long mission. What did you do today on Earth?",
      lines: [
        'That sounds nice. On the station, every day looks the same. What do you like most about your city?',
        'Nice! If you could fly into space, what would you explore first?',
        'I love that idea. What did you do last weekend?',
        'Ha, we never do that in space. What food would you bring on a mission?',
        'Good choice! What is the most beautiful place you have ever seen?',
        'Wow, I would like to see it one day. What do you dream about doing next year?',
        'That is a great dream. How do you usually relax after a long day?',
        'On the station, we watch the Earth. What do you see from your window?',
      ],
    },
    es: {
      intro: 'Hola, soy Nova, una exploradora espacial que acaba de volver de una misión. ¿Qué hiciste hoy en la Tierra?',
      lines: [
        'Qué bien. En la estación, todos los días son iguales. ¿Qué es lo que más te gusta de tu ciudad?',
        '¡Interesante! Si pudieras visitar un planeta nuevo, ¿qué explorarías primero?',
        'Me encanta esa idea. ¿Qué hiciste el fin de semana pasado?',
        'Ja, en el espacio nunca hacemos eso. ¿Qué comida llevarías a una misión?',
        '¡Buena elección! ¿Cuál es el lugar más bonito que has visto?',
        'Me gustaría verlo algún día. ¿Qué sueñas hacer el próximo año?',
        'Es un gran sueño. ¿Cómo te relajas después de un día largo?',
        'En la estación miramos la Tierra. ¿Qué ves desde tu ventana?',
      ],
    },
  },
  milo: {
    en: {
      intro: "Hello, I'm Milo, the chef of a little restaurant around the corner. What did you eat today?",
      lines: [
        'Mmm, that sounds good. Do you like cooking at home?',
        'Nice! What is your favourite dish from your childhood?',
        'I love stories like that. What did you eat last weekend?',
        'Delicious. If you invited friends tonight, what would you cook?',
        'Great menu! Which country has the best food, in your opinion?',
        'Good answer. Do you prefer sweet or salty breakfasts? Why?',
        'Interesting. What is a dish you would like to learn to make?',
        'I can teach you! What are your plans for this weekend?',
      ],
    },
    es: {
      intro: 'Hola, soy Milo, el chef de un pequeño restaurante del barrio. ¿Qué comiste hoy?',
      lines: [
        'Mmm, suena bien. ¿Te gusta cocinar en casa?',
        '¡Qué bien! ¿Cuál es tu plato favorito de la infancia?',
        'Me encantan esas historias. ¿Qué comiste el fin de semana pasado?',
        'Delicioso. Si invitaras a amigos esta noche, ¿qué cocinarías?',
        '¡Gran menú! ¿Qué país tiene la mejor comida, en tu opinión?',
        'Buena respuesta. ¿Prefieres desayunos dulces o salados? ¿Por qué?',
        'Interesante. ¿Qué plato te gustaría aprender a preparar?',
        '¡Yo te enseño! ¿Qué planes tienes para este fin de semana?',
      ],
    },
  },
  iris: {
    en: {
      intro: "Good afternoon, I'm Iris, a detective. Tell me, what happened in your day yesterday?",
      lines: [
        'Interesting. And what did you do after that?',
        'I see. Who did you talk to yesterday?',
        'Good detail. What was the best moment of your week?',
        'Hmm, a little mystery. Why do you think it happened?',
        'Very clear. What did you do last weekend, step by step?',
        'Perfect. Have you ever lost something important? What happened?',
        'What a story! How did you feel at that moment?',
        'I understand. What will you do tomorrow morning?',
      ],
    },
    es: {
      intro: 'Buenas tardes, soy Iris, detective. Dime, ¿qué pasó ayer en tu día?',
      lines: [
        'Interesante. ¿Y qué hiciste después?',
        'Ya veo. ¿Con quién hablaste ayer?',
        'Buen detalle. ¿Cuál fue el mejor momento de tu semana?',
        'Mmm, un pequeño misterio. ¿Por qué crees que pasó?',
        'Muy claro. ¿Qué hiciste el fin de semana pasado, paso a paso?',
        'Perfecto. ¿Alguna vez perdiste algo importante? ¿Qué pasó?',
        '¡Qué historia! ¿Cómo te sentiste en ese momento?',
        'Entiendo. ¿Qué vas a hacer mañana por la mañana?',
      ],
    },
  },
  tom: {
    en: {
      intro: "Ahoy! I'm Tom, the harbour master here. Where are you from?",
      lines: [
        'Lovely place! Is it near the sea or in the mountains?',
        'Nice. What is the weather like there today?',
        'Ha, here it is windy as always. Where did you go on your last holiday?',
        'Sounds great. Do you prefer the beach or the city? Why?',
        'Fair enough. If you had a boat, where would you sail?',
        'What an adventure! Have you ever been on a boat?',
        'I see. What do you like to do when it rains?',
        'Good idea. What is your favourite season of the year?',
      ],
    },
    es: {
      intro: '¡Hola! Soy Tom, el capitán de este puerto. ¿De dónde eres?',
      lines: [
        '¡Qué lugar tan bonito! ¿Está cerca del mar o en la montaña?',
        'Qué bien. ¿Qué tiempo hace allí hoy?',
        'Ja, aquí hace viento como siempre. ¿Adónde fuiste en tus últimas vacaciones?',
        'Suena genial. ¿Prefieres la playa o la ciudad? ¿Por qué?',
        'Me parece bien. Si tuvieras un barco, ¿adónde navegarías?',
        '¡Qué aventura! ¿Alguna vez subiste a un barco?',
        'Ya veo. ¿Qué te gusta hacer cuando llueve?',
        'Buena idea. ¿Cuál es tu estación favorita del año?',
      ],
    },
  },
  lea: {
    en: {
      intro: "Welcome, I'm Léa, a guide at the city museum. What kind of things do you like to look at?",
      lines: [
        'Lovely. When did you last visit a museum or an exhibition?',
        'Interesting! What did you see there?',
        'I love that. What is your favourite film? Why?',
        'Good choice. Which book or series would you recommend to me?',
        'I will try it. If you could meet a famous person from history, who would it be?',
        'Fascinating. What would you ask them?',
        'Great question. What is the most interesting city you know?',
        'I would love to visit it. What do people do there on Sundays?',
      ],
    },
    es: {
      intro: 'Bienvenido, soy Léa, guía del museo de la ciudad. ¿Qué tipo de cosas te gusta mirar?',
      lines: [
        'Qué bonito. ¿Cuándo visitaste un museo o una exposición por última vez?',
        '¡Interesante! ¿Qué viste allí?',
        'Me encanta. ¿Cuál es tu película favorita? ¿Por qué?',
        'Buena elección. ¿Qué libro o serie me recomendarías?',
        'Lo probaré. Si pudieras conocer a una persona famosa de la historia, ¿quién sería?',
        'Fascinante. ¿Qué le preguntarías?',
        'Gran pregunta. ¿Cuál es la ciudad más interesante que conoces?',
        'Me encantaría visitarla. ¿Qué hace la gente allí los domingos?',
      ],
    },
  },
  sam: {
    en: {
      intro: "Hey there, I'm Sam, I play guitar in the square. What music do you listen to?",
      lines: [
        'Cool! When did you discover this music?',
        'Nice story. Have you ever been to a concert? How was it?',
        'Sounds amazing. Do you play an instrument?',
        'Great. What do you do in your free time?',
        'Fun! How was your week so far?',
        'I hope the next days are good. What makes you happy on a Monday morning?',
        'Ha, good one. What song would you choose for a long trip?',
        'Great pick! What is your typical day like?',
      ],
    },
    es: {
      intro: 'Hola, soy Sam, toco la guitarra en la plaza. ¿Qué música escuchas?',
      lines: [
        '¡Genial! ¿Cuándo descubriste esa música?',
        'Bonita historia. ¿Alguna vez fuiste a un concierto? ¿Qué tal?',
        'Suena increíble. ¿Tocas algún instrumento?',
        'Genial. ¿Qué haces en tu tiempo libre?',
        '¡Divertido! ¿Qué tal tu semana hasta ahora?',
        'Espero que los próximos días sean buenos. ¿Qué te hace feliz un lunes por la mañana?',
        'Ja, muy bueno. ¿Qué canción elegirías para un viaje largo?',
        '¡Buena elección! ¿Cómo es tu día típico?',
      ],
    },
  },
};

const CLOSING: Record<Lang, string> = {
  en: 'It was really nice to talk with you! We have to finish soon. What will you do after this?',
  es: '¡Me encantó hablar contigo! Tenemos que terminar pronto. ¿Qué vas a hacer después?',
};

export function mockChatReply(req: ChatRequest): string {
  const character = getCharacter(req.characterId);
  if (!character) throw new Error('unknown_character');
  const script = SCRIPTS[character.id][req.lang];
  const ownTurns = req.turns.filter((t) => t.characterId === character.id);
  if (ownTurns.length === 0) return script.intro;
  if (req.remainingSec !== undefined && req.remainingSec < 30) return CLOSING[req.lang];
  const userCount = req.turns.filter((t) => t.role === 'user').length;
  return script.lines[userCount % script.lines.length] ?? script.intro;
}

const PAST_MARKERS: Record<Lang, RegExp> = {
  en: /\b(yesterday|last week)\b/i,
  es: /(?<![\p{L}])(ayer|la semana pasada)(?![\p{L}])/iu,
};

const PAST_VERBS: Record<Lang, Record<string, string>> = {
  en: { go: 'went', eat: 'ate', see: 'saw', do: 'did', have: 'had', make: 'made', visit: 'visited' },
  es: { voy: 'fui', como: 'comí', veo: 'vi', hago: 'hice', tengo: 'tuve', visito: 'visité' },
};

/** Mots français courants : en espagnol, « le » et « la » sont exclus (articles/pronoms espagnols). */
const FRENCH_WORDS: Record<Lang, readonly string[]> = {
  en: ['je', 'le', 'la', 'et', 'mais', 'comment', 'chose'],
  es: ['je', 'et', 'mais', 'comment', 'chose'],
};

const LANG_NAME_FR: Record<Lang, string> = { en: "l'anglais", es: "l'espagnol" };

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
}

function findPastTenseError(sentence: string, lang: Lang): { said: string; corrected: string } | null {
  const marker = PAST_MARKERS[lang].exec(sentence);
  if (!marker) return null;
  const after = marker.index + marker[0].length;
  const verbs = PAST_VERBS[lang];
  const re = /[\p{L}']+/gu;
  re.lastIndex = after;
  for (let m = re.exec(sentence); m; m = re.exec(sentence)) {
    const past = verbs[m[0].toLowerCase()];
    if (past) {
      const replacement = m[0][0] === m[0][0]?.toUpperCase() ? past[0]?.toUpperCase() + past.slice(1) : past;
      return { said: sentence, corrected: sentence.slice(0, m.index) + replacement + sentence.slice(m.index + m[0].length) };
    }
  }
  return null;
}

export function mockDiagnose(req: DiagnoseRequest): Blockage[] {
  const userTurns: Turn[] = req.turns.filter((t) => t.role === 'user' && t.text.trim().length > 0);
  if (userTurns.length === 0) return [];
  const result: Blockage[] = [];

  let pastCount = 0;
  let example: { said: string; corrected: string } | null = null;
  for (const turn of userTurns) {
    let found = false;
    for (const s of sentences(turn.text)) {
      const err = findPastTenseError(s, req.lang);
      if (err) {
        found = true;
        example ??= err;
      }
    }
    if (found) pastCount += 1;
  }
  if (example) {
    result.push({
      key: 'past_tense',
      observation: 'Tu as utilisé le présent pour raconter quelque chose au passé.',
      said: example.said,
      corrected: example.corrected,
      occurrences: pastCount,
      severity: 3,
    });
  }

  const counts = userTurns.map((t) => words(t.text).length);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  if (avg < 4) {
    result.push({
      key: 'short_answers',
      observation: 'Tes réponses tiennent souvent en quelques mots.',
      occurrences: Math.max(1, counts.filter((c) => c < 4).length),
      severity: 2,
    });
  }

  const french = new Set(FRENCH_WORDS[req.lang]);
  const vocabCount = userTurns.filter((t) => words(t.text).some((w) => french.has(w))).length;
  if (vocabCount > 0) {
    result.push({
      key: 'vocabulary',
      observation: `Tu as utilisé des mots français quand ${LANG_NAME_FR[req.lang]} te manquait.`,
      occurrences: vocabCount,
      severity: 2,
    });
  }

  return finalizeBlockages(result, req.turns);
}
