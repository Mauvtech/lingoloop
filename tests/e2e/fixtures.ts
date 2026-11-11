import { test as base, expect, type Page } from '@playwright/test';

export const ROUTES = [
  '/',
  '/recherche',
  '/conversation',
  '/diagnostic/demo-c4',
  '/progression',
  '/blocages',
  '/blocages/past_tense',
  '/profil',
  '/profil/historique',
  '/profil/confidentialite',
] as const;

type Watch = { consoleErrors: string[]; foreignRequests: string[] };

/** Collecte les console.error et toute requête vers un hôte autre que localhost. */
export const test = base.extend<{ watch: Watch }>({
  watch: async ({ page }, use) => {
    const w: Watch = { consoleErrors: [], foreignRequests: [] };
    page.on('console', (m) => {
      if (m.type() === 'error') w.consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => w.consoleErrors.push(String(e)));
    page.on('request', (r) => {
      const url = new URL(r.url());
      if (url.protocol === 'data:' || url.protocol === 'blob:') return;
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) w.foreignRequests.push(r.url());
    });
    await use(w);
  },
});

export { expect };

export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.locator('[data-ready="true"]').first().waitFor({ state: 'attached', timeout: 10_000 }).catch(() => undefined);
}
