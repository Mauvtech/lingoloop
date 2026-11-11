import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRepo, openRepo, type Repo } from '../../src/services/db';
import { conv } from './helpers';

async function exercise(repo: Repo) {
  expect(await repo.getSettings()).toEqual({ lang: 'en', durationMin: 5 });
  await repo.saveSettings({ lang: 'es', durationMin: 10 });
  expect(await repo.getSettings()).toEqual({ lang: 'es', durationMin: 10 });

  const late = conv({ past_tense: 1 }, { t: 5000 });
  const early = conv({}, { t: 1000 });
  await repo.putConversation(late);
  await repo.putConversation(early);
  expect((await repo.listConversations()).map((c) => c.id)).toEqual([early.id, late.id]);
  expect((await repo.getConversation(late.id))?.diagnosis.blockages[0]?.key).toBe('past_tense');

  await repo.putConversation({ ...late, durationSec: 42 });
  expect((await repo.getConversation(late.id))?.durationSec).toBe(42);
  await repo.deleteConversation(early.id);
  expect(await repo.listConversations()).toHaveLength(1);

  await repo.replaceConversations([early]);
  expect((await repo.listConversations()).map((c) => c.id)).toEqual([early.id]);

  await repo.clearAll();
  expect(await repo.listConversations()).toEqual([]);
  expect(await repo.getSettings()).toEqual({ lang: 'en', durationMin: 5 });
}

describe('db.ts', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('IndexedDB : CRUD, index par date, effacement', async () => {
    const repo = await openRepo();
    expect(repo.persistent).toBe(true);
    await exercise(repo);
  });

  it('mémoire : même comportement', async () => {
    await exercise(createMemoryRepo());
  });

  it('bascule en mémoire si l’ouverture échoue', async () => {
    const repo = await openRepo(() => Promise.reject(new Error('blocked')));
    expect(repo.persistent).toBe(false);
  });

  it('bascule en mémoire si IndexedDB est absente', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const repo = await openRepo();
    expect(repo.persistent).toBe(false);
  });

  it('réglages invalides ramenés aux valeurs par défaut', async () => {
    const repo = createMemoryRepo();
    await repo.saveSettings(JSON.parse('{"lang":"de","durationMin":7}'));
    expect(await repo.getSettings()).toEqual({ lang: 'en', durationMin: 5 });
  });
});
