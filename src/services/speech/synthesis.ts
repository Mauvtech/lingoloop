/** Adaptateur Web Speech API (sortie). Les globales sont lues à l'appel, pas à l'import (§11). */

export interface VoiceLike {
  name: string;
  lang: string;
}

function synth(): SpeechSynthesis | undefined {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined;
}

const FEMALE = /(female|woman|samantha|victoria|karen|monica|paulina|helena|laura|lucia|sara|zira|google uk english female|elvira|ximena)/i;
const MALE = /(male|man|daniel|alex|fred|jorge|diego|pablo|david|mark|george|google uk english male|alvaro)/i;

/** Voix de la langue la plus proche du genre souhaité ; sinon la première voix de la langue. */
export function pickVoice<V extends VoiceLike>(voices: readonly V[], lang: string, hint: 'female' | 'male'): V | undefined {
  const prefix = lang.slice(0, 2).toLowerCase();
  const inLang = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(prefix));
  if (inLang.length === 0) return undefined;
  const re = hint === 'female' ? FEMALE : MALE;
  const exact = inLang.filter((v) => v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase());
  return exact.find((v) => re.test(v.name)) ?? inLang.find((v) => re.test(v.name)) ?? exact[0] ?? inLang[0];
}

/** Attend la liste des voix (chargée de façon asynchrone par certains navigateurs). */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      s.removeEventListener?.('voiceschanged', done);
      clearTimeout(t);
      resolve(s.getVoices());
    };
    const t = setTimeout(done, timeoutMs);
    s.addEventListener?.('voiceschanged', done);
  });
}

export interface SpeakHandle {
  cancel(): void;
}

/**
 * Lit `text`. Renvoie null si aucune voix n'est disponible pour la langue (repli texte seul).
 * onEnd est toujours appelé une fois (fin, annulation, erreur ou délai de sécurité).
 */
export function speak(text: string, voice: SpeechSynthesisVoice, handlers: { onStart(): void; onEnd(): void }): SpeakHandle | null {
  const s = synth();
  if (!s || typeof SpeechSynthesisUtterance === 'undefined') return null;
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    clearTimeout(safety);
    handlers.onEnd();
  };
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.95;
  u.onstart = () => handlers.onStart();
  u.onend = end;
  u.onerror = end;
  // Certains navigateurs n'émettent jamais `end` : délai de sécurité proportionnel au texte.
  const safety = setTimeout(end, 4000 + text.split(/\s+/).length * 600);
  s.cancel();
  s.speak(u);
  return {
    cancel() {
      s.cancel();
      end();
    },
  };
}
