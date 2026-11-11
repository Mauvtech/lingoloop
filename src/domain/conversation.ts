/** Machine d'états de la conversation (pure). */
export type Phase = 'idle' | 'characterSpeaking' | 'listening' | 'thinking' | 'error' | 'ended';

export type ConvEvent =
  | { type: 'REPLY' }          // une réplique du personnage est prête → il parle
  | { type: 'SPEECH_DONE' }    // fin de la synthèse → à l'utilisateur
  | { type: 'LISTEN' }         // l'utilisateur ouvre le micro
  | { type: 'CANCEL_LISTEN' }  // micro fermé sans texte
  | { type: 'SUBMIT' }         // réplique utilisateur envoyée → l'IA répond
  | { type: 'FAIL' }           // erreur réseau
  | { type: 'RETRY' }          // nouvel essai après une erreur
  | { type: 'SWITCH' }         // personnage suivant : on attend sa présentation
  | { type: 'END' };

const TRANSITIONS: Record<Phase, Partial<Record<ConvEvent['type'], Phase>>> = {
  idle: { LISTEN: 'listening', SUBMIT: 'thinking', SWITCH: 'thinking', END: 'ended', REPLY: 'characterSpeaking' },
  characterSpeaking: { SPEECH_DONE: 'idle', LISTEN: 'listening', SWITCH: 'thinking', END: 'ended' },
  listening: { SUBMIT: 'thinking', CANCEL_LISTEN: 'idle', END: 'ended' },
  thinking: { REPLY: 'characterSpeaking', FAIL: 'error', END: 'ended' },
  error: { RETRY: 'thinking', END: 'ended' },
  ended: {},
};

/** Renvoie la phase suivante, ou la phase courante si la transition est interdite. */
export function transition(phase: Phase, event: ConvEvent): Phase {
  return TRANSITIONS[phase][event.type] ?? phase;
}

export function canTransition(phase: Phase, event: ConvEvent): boolean {
  return TRANSITIONS[phase][event.type] !== undefined;
}

/** Chrono basé sur des horodatages : tolère les onglets cachés et les rechargements. */
export interface Timer {
  accumulatedMs: number;
  runningSince: number | null;
}

export const newTimer = (accumulatedMs = 0): Timer => ({ accumulatedMs, runningSince: null });

export function startTimer(t: Timer, now: number): Timer {
  return t.runningSince === null ? { ...t, runningSince: now } : t;
}

export function pauseTimer(t: Timer, now: number): Timer {
  return t.runningSince === null ? t : { accumulatedMs: t.accumulatedMs + Math.max(0, now - t.runningSince), runningSince: null };
}

export function elapsedMs(t: Timer, now: number): number {
  return t.accumulatedMs + (t.runningSince === null ? 0 : Math.max(0, now - t.runningSince));
}

export function isTimeUp(t: Timer, plannedSec: number, now: number): boolean {
  return elapsedMs(t, now) >= plannedSec * 1000;
}

/** Confirmation requise si moins de 30 s écoulées ou aucune réplique de l'utilisateur. */
export function needsEndConfirmation(elapsedSec: number, userTurnCount: number): boolean {
  return elapsedSec < 30 || userTurnCount === 0;
}

/** Une conversation `active` est reprenable si sauvegardée il y a moins de 30 min et s'il reste du temps. */
export function isResumable(c: { state: string; lastSavedAt: number; durationSec: number; plannedSec: number }, now: number): boolean {
  return c.state === 'active' && now - c.lastSavedAt < 30 * 60_000 && c.durationSec < c.plannedSec;
}

/** Temps de parole estimé en mode texte : 0,5 s par mot. */
export function typedSpeakingSec(words: number): number {
  return words * 0.5;
}
