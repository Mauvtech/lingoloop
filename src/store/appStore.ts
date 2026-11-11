import { create } from 'zustand';
import { isResumable } from '../domain/conversation';
import { buildDemoConversations, isDemoRequested } from '../domain/demo';
import { DEFAULT_SETTINGS, type Conversation, type Settings } from '../domain/types';
import { openRepo, type Repo } from '../services/db';

export interface Match {
  characterId: string;
  firstReply: string;
}

interface AppState {
  ready: boolean;
  persistent: boolean;
  settings: Settings;
  conversations: Conversation[];
  /** Personnage tiré sur l'écran Recherche, avec sa première réplique préchargée. */
  match: Match | null;
  /** Conversation à reprendre (acceptée depuis l'Accueil). */
  resumeId: string | null;
  init(): Promise<void>;
  setSettings(patch: Partial<Settings>): Promise<void>;
  saveConversation(c: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  clearAll(): Promise<void>;
  setMatch(m: Match | null): void;
  setResumeId(id: string | null): void;
}

let repo: Repo | null = null;
let initPromise: Promise<void> | null = null;

function upsert(list: Conversation[], c: Conversation): Conversation[] {
  const i = list.findIndex((x) => x.id === c.id);
  if (i === -1) return [...list, c].sort((a, b) => a.startedAt - b.startedAt);
  const next = list.slice();
  next[i] = c;
  return next;
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  persistent: true,
  settings: DEFAULT_SETTINGS,
  conversations: [],
  match: null,
  resumeId: null,

  init() {
    initPromise ??= (async () => {
      repo = await openRepo();
      if (typeof location !== 'undefined' && isDemoRequested(location.search)) {
        await repo.replaceConversations(buildDemoConversations(Date.now()));
        const s = await repo.getSettings();
        await repo.saveSettings({ ...s, lang: 'en' });
      }
      const [settings, all] = await Promise.all([repo.getSettings(), repo.listConversations()]);
      // Une conversation interrompue non reprenable est supprimée sans bruit ; une seule active à la fois.
      const now = Date.now();
      const actives = all.filter((c) => c.state === 'active').sort((a, b) => b.lastSavedAt - a.lastSavedAt);
      const keep = actives[0] && isResumable(actives[0], now) ? actives[0].id : null;
      const stale = actives.filter((c) => c.id !== keep);
      await Promise.all(stale.map((c) => repo?.deleteConversation(c.id)));
      const conversations = all.filter((c) => !stale.includes(c));
      set({ ready: true, persistent: repo.persistent, settings, conversations });
    })();
    return initPromise;
  },

  async setSettings(patch) {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await repo?.saveSettings(settings);
  },

  async saveConversation(c) {
    set({ conversations: upsert(get().conversations, c) });
    await repo?.putConversation(c);
  },

  async deleteConversation(id) {
    set({ conversations: get().conversations.filter((c) => c.id !== id) });
    await repo?.deleteConversation(id);
  },

  async clearAll() {
    await repo?.clearAll();
    set({ settings: DEFAULT_SETTINGS, conversations: [], match: null, resumeId: null });
  },

  setMatch(match) {
    set({ match });
  },

  setResumeId(resumeId) {
    set({ resumeId });
  },
}));
