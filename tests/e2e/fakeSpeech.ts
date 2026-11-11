import type { Page } from '@playwright/test';

/**
 * Remplace SpeechRecognition et speechSynthesis par des faux pilotables (§11), exposés sur window.__fakeSpeech :
 * say(text), deny(), silence(), end() ; utterances = textes lus.
 */
export async function installFakeSpeech(page: Page, opts: { recognition?: boolean; voices?: boolean } = {}): Promise<void> {
  await page.addInitScript(({ recognition, voices }) => {
    type Handler = ((e?: unknown) => void) | null;
    const state = {
      active: null as null | FakeRecognition,
      denied: false,
      utterances: [] as string[],
      pending: [] as { onend: Handler }[],
      autoEnd: true,
    };
    class FakeRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      onresult: Handler = null;
      onerror: Handler = null;
      onend: Handler = null;
      start() {
        if (state.denied) {
          setTimeout(() => {
            this.onerror?.({ error: 'not-allowed' });
            this.onend?.();
          }, 10);
          return;
        }
        state.active = this;
      }
      stop() {
        if (state.active === this) state.active = null;
        setTimeout(() => this.onend?.(), 10);
      }
      abort() {
        this.stop();
      }
    }
    const api = {
      get listening() {
        return state.active !== null;
      },
      get utterances() {
        return state.utterances;
      },
      say(text: string) {
        const r = state.active;
        if (!r) throw new Error('no active recognition');
        const result = Object.assign([{ transcript: text }], { isFinal: true });
        r.onresult?.({ results: Object.assign([result], { length: 1 }) });
      },
      /** Simule la fin d'écoute (silence détecté). */
      silence() {
        state.active?.stop();
      },
      deny() {
        state.denied = true;
      },
      /** Termine la lecture en cours (si autoEnd est désactivé). */
      end() {
        state.pending.splice(0).forEach((u) => u.onend?.());
      },
      set autoEnd(v: boolean) {
        state.autoEnd = v;
      },
    };
    const w = window as unknown as Record<string, unknown>;
    w.__fakeSpeech = api;
    if (recognition) {
      w.SpeechRecognition = FakeRecognition;
      w.webkitSpeechRecognition = FakeRecognition;
    } else {
      delete w.SpeechRecognition;
      delete w.webkitSpeechRecognition;
    }
    class FakeUtterance {
      text: string;
      voice: unknown = null;
      lang = '';
      rate = 1;
      onstart: Handler = null;
      onend: Handler = null;
      onerror: Handler = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    w.SpeechSynthesisUtterance = FakeUtterance;
    const voiceList = voices
      ? [
          { name: 'Fake English Female', lang: 'en-US', default: true, localService: true, voiceURI: 'en' },
          { name: 'Fake Spanish Male', lang: 'es-ES', default: false, localService: true, voiceURI: 'es' },
        ]
      : [];
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speaking: false,
        getVoices: () => voiceList,
        speak(u: FakeUtterance) {
          state.utterances.push(u.text);
          setTimeout(() => {
            u.onstart?.();
            if (state.autoEnd) setTimeout(() => u.onend?.(), 30);
            else state.pending.push(u);
          }, 5);
        },
        cancel() {
          state.pending.splice(0).forEach((u) => u.onend?.());
        },
        addEventListener() {},
        removeEventListener() {},
      },
    });
  }, { recognition: opts.recognition ?? true, voices: opts.voices ?? true });
}

export async function say(page: Page, text: string): Promise<void> {
  await page.evaluate((t) => (window as unknown as { __fakeSpeech: { say(t: string): void } }).__fakeSpeech.say(t), text);
}
