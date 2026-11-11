import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { DEFAULT_SETTINGS, type Conversation, type Settings } from '../domain/types';

export const DB_NAME = 'lingoloop';
export const DB_VERSION = 1;

interface LingoDB extends DBSchema {
  settings: { key: string; value: Settings };
  conversations: { key: string; value: Conversation; indexes: { byStartedAt: number } };
}

/** Interface unique d'accès aux données (IndexedDB ou mémoire). */
export interface Repo {
  readonly persistent: boolean;
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  /** Triées par date de début croissante. */
  listConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  putConversation(c: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  replaceConversations(cs: Conversation[]): Promise<void>;
  clearAll(): Promise<void>;
}

const SETTINGS_KEY = 'settings';

function sanitizeSettings(s: Partial<Settings> | undefined): Settings {
  return {
    lang: s?.lang === 'es' ? 'es' : 'en',
    durationMin: s?.durationMin === 3 || s?.durationMin === 10 ? s.durationMin : DEFAULT_SETTINGS.durationMin,
  };
}

export function createIdbRepo(db: IDBPDatabase<LingoDB>): Repo {
  return {
    persistent: true,
    async getSettings() {
      return sanitizeSettings(await db.get('settings', SETTINGS_KEY));
    },
    async saveSettings(s) {
      await db.put('settings', s, SETTINGS_KEY);
    },
    async listConversations() {
      return db.getAllFromIndex('conversations', 'byStartedAt');
    },
    async getConversation(id) {
      return db.get('conversations', id);
    },
    async putConversation(c) {
      await db.put('conversations', c);
    },
    async deleteConversation(id) {
      await db.delete('conversations', id);
    },
    async replaceConversations(cs) {
      const tx = db.transaction('conversations', 'readwrite');
      await tx.store.clear();
      for (const c of cs) await tx.store.put(c);
      await tx.done;
    },
    async clearAll() {
      const tx = db.transaction(['settings', 'conversations'], 'readwrite');
      await Promise.all([tx.objectStore('settings').clear(), tx.objectStore('conversations').clear(), tx.done]);
    },
  };
}

export function createMemoryRepo(): Repo {
  let settings: Settings = { ...DEFAULT_SETTINGS };
  const conversations = new Map<string, Conversation>();
  const clone = <T>(v: T): T => structuredClone(v);
  return {
    persistent: false,
    async getSettings() {
      return { ...settings };
    },
    async saveSettings(s) {
      settings = sanitizeSettings(s);
    },
    async listConversations() {
      return [...conversations.values()].map(clone).sort((a, b) => a.startedAt - b.startedAt);
    },
    async getConversation(id) {
      const c = conversations.get(id);
      return c ? clone(c) : undefined;
    },
    async putConversation(c) {
      conversations.set(c.id, clone(c));
    },
    async deleteConversation(id) {
      conversations.delete(id);
    },
    async replaceConversations(cs) {
      conversations.clear();
      for (const c of cs) conversations.set(c.id, clone(c));
    },
    async clearAll() {
      settings = { ...DEFAULT_SETTINGS };
      conversations.clear();
    },
  };
}

export async function openIdb(): Promise<IDBPDatabase<LingoDB>> {
  return openDB<LingoDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      switch (oldVersion) {
        case 0: {
          db.createObjectStore('settings');
          const store = db.createObjectStore('conversations', { keyPath: 'id' });
          store.createIndex('byStartedAt', 'startedAt');
        }
        // Versions futures : ajouter `case 1:` ici, sans `break`, pour enchaîner les migrations.
      }
    },
  });
}

/** IndexedDB si disponible, sinon repli en mémoire (navigation privée, IndexedDB bloquée). */
export async function openRepo(open: () => Promise<IDBPDatabase<LingoDB>> = openIdb): Promise<Repo> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('indexeddb_unavailable');
    const db = await Promise.race([
      open(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('indexeddb_timeout')), 3000)),
    ]);
    return createIdbRepo(db);
  } catch {
    return createMemoryRepo();
  }
}
