/** Adaptateur Web Speech API (entrée). Les globales sont lues à l'appel, pas à l'import (§11). */

interface RecognitionAlternative { transcript: string }
interface RecognitionResult { readonly length: number; readonly isFinal: boolean; [i: number]: RecognitionAlternative }
interface RecognitionEvent { readonly results: { readonly length: number; [i: number]: RecognitionResult } }
interface RecognitionErrorEvent { readonly error: string }

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isRecognitionSupported(): boolean {
  return getCtor() !== undefined;
}

export type RecognitionErrorKind = 'denied' | 'other';

export interface RecognitionHandlers {
  onInterim(text: string): void;
  /** Fin de l'écoute avec le texte reconnu (éventuellement vide). */
  onEnd(text: string): void;
  onError(kind: RecognitionErrorKind): void;
}

export interface RecognitionSession {
  /** Arrête l'écoute et déclenche onEnd avec le texte reconnu. */
  stop(): void;
  /** Annule sans envoyer. */
  abort(): void;
}

export const SILENCE_MS = 2000;

export function startRecognition(lang: string, handlers: RecognitionHandlers): RecognitionSession | null {
  const Ctor = getCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  let text = '';
  let aborted = false;
  let finished = false;
  let silenceTimer: ReturnType<typeof setTimeout> | undefined;

  const armSilence = () => {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => rec.stop(), SILENCE_MS);
  };

  rec.onresult = (e) => {
    let all = '';
    for (let i = 0; i < e.results.length; i++) all += `${e.results[i]?.[0]?.transcript ?? ''} `;
    text = all.replace(/\s+/g, ' ').trim();
    handlers.onInterim(text);
    if (text) armSilence();
  };
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      aborted = true;
      finished = true;
      clearTimeout(silenceTimer);
      handlers.onError('denied');
    } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
      handlers.onError('other');
    }
  };
  rec.onend = () => {
    clearTimeout(silenceTimer);
    if (finished) return;
    finished = true;
    handlers.onEnd(aborted ? '' : text);
  };
  try {
    rec.start();
  } catch {
    return null;
  }
  return {
    stop() {
      rec.stop();
    },
    abort() {
      aborted = true;
      rec.abort();
    },
  };
}
