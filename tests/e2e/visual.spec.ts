import { mkdirSync } from 'node:fs';
import { installFakeSpeech, say } from './fakeSpeech';
import { expect, gotoReady, test } from './fixtures';

const OUT = 'artifacts/screens';
mkdirSync(OUT, { recursive: true });

const STATIC: [string, string][] = [
  ['01-accueil', '/?demo=1'],
  ['04-diagnostic', '/diagnostic/demo-c4'],
  ['05-progression', '/progression'],
  ['06-blocages', '/blocages'],
  ['07-blocage-detail', '/blocages/past_tense'],
  ['08-profil', '/profil'],
];

test.describe('captures 390×844 (données de démo)', () => {
  for (const [name, path] of STATIC) {
    test(name, async ({ page }) => {
      await gotoReady(page, '/?demo=1');
      await gotoReady(page, path);
      await expect(page.locator('h1').first()).toBeVisible();
      await page.screenshot({ path: `${OUT}/${name}.png` });
    });
  }

  test('02-recherche', async ({ page }) => {
    await page.route('**/api/chat', (r) => new Promise(() => void r)); // réplique en attente : état « recherche »
    await gotoReady(page, '/recherche');
    await page.screenshot({ path: `${OUT}/02-recherche.png` });
  });

  test('03-conversation (Nova, 02:36 / 05:00)', async ({ page }) => {
    await installFakeSpeech(page);
    await page.addInitScript(() => {
      Math.random = () => 0; // tirage déterministe : Nova
    });
    await page.clock.install();
    await gotoReady(page, '/recherche');
    await page.clock.fastForward(3000);
    await page.getByRole('link', { name: 'Démarrer la conversation' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nova');
    await page.clock.fastForward(147_000);
    await page.getByRole('button', { name: 'Microphone' }).click();
    await say(page, 'I like the stars.');
    // La réplique suivante reste « en cours de lecture » : pastille « Nova parle » comme sur la maquette.
    await page.evaluate(() => (window as unknown as { __fakeSpeech: { autoEnd: boolean } }).__fakeSpeech.autoEnd = false);
    await page.getByRole('button', { name: 'Envoyer' }).click();
    await expect(page.locator('[lang="en"]').filter({ hasText: 'explore first' })).toBeVisible();
    const [mm, ss] = ((await page.locator('[class*="clockMain"]').textContent()) ?? '00:00').split(':').map(Number);
    await page.clock.fastForward(Math.max(0, (156 - ((mm ?? 0) * 60 + (ss ?? 0))) * 1000 - 300));
    await expect(page.getByText('02:36', { exact: true })).toBeVisible();
    await expect(page.getByText('Nova parle')).toBeVisible();
    await page.screenshot({ path: `${OUT}/03-conversation.png` });
  });
});

test.describe('mise en page responsive', () => {
  const ROUTES = ['/', '/progression', '/blocages', '/blocages/past_tense', '/profil', '/diagnostic/demo-c4', '/recherche', '/profil/historique', '/profil/confidentialite'];
  for (const width of [320, 360]) {
    test(`pas de débordement horizontal à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 568 });
      await gotoReady(page, '/?demo=1');
      for (const r of ROUTES) {
        await gotoReady(page, r);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${r} à ${width}px`).toBeLessThanOrEqual(0);
        const cta = page.locator('main a, main button').filter({ hasText: /Rencontrer un personnage|Voir mes blocages|Reprendre une conversation|Effacer mes données|Démarrer la conversation/ }).first();
        if (await cta.count()) {
          await cta.scrollIntoViewIfNeeded();
          await expect(cta).toBeInViewport();
        }
      }
    });
  }

  test('à 768 px : colonne centrée de 430 px maximum', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoReady(page, '/');
    const box = await page.locator('[data-ready]').boundingBox();
    expect(box?.width).toBeLessThanOrEqual(430);
    expect(Math.abs((box?.x ?? 0) - (768 - (box?.width ?? 0)) / 2)).toBeLessThan(1);
  });
});
