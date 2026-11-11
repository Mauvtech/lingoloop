import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { installFakeSpeech } from './fakeSpeech';
import { expect, gotoReady, ROUTES, test } from './fixtures';

async function seriousViolations(page: Page) {
  // Attend la fin des animations d'apparition (feuilles) : axe mesurerait un contraste en cours de fondu.
  await page.evaluate(() =>
    Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))),
  );
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}) : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

async function smallTargets(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a[href], input')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !el.closest('.visually-hidden');
      })
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 44 || r.height < 44;
      })
      .map((el) => `${el.tagName} « ${el.textContent?.trim() || el.getAttribute('aria-label')} » ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`),
  );
}

async function startConversationPage(page: Page) {
  await installFakeSpeech(page);
  await page.clock.install();
  await gotoReady(page, '/recherche');
  await page.clock.fastForward(3000);
  await page.getByRole('link', { name: 'Démarrer la conversation' }).click();
  await expect(page.getByRole('button', { name: 'Microphone' })).toBeEnabled();
}

test.describe('axe : aucune violation serious/critical', () => {
  for (const route of ROUTES.filter((r) => r !== '/conversation')) {
    test(route, async ({ page }) => {
      await gotoReady(page, '/?demo=1');
      await gotoReady(page, route);
      await page.waitForLoadState('networkidle');
      expect(await seriousViolations(page)).toEqual([]);
      expect(await smallTargets(page), 'cibles < 44 px').toEqual([]);
    });
  }

  test('/conversation (voix et repli texte)', async ({ page }) => {
    await startConversationPage(page);
    expect(await seriousViolations(page)).toEqual([]);
    expect(await smallTargets(page)).toEqual([]);
    await page.evaluate(() => (window as unknown as { __fakeSpeech: { deny(): void } }).__fakeSpeech.deny());
    await page.getByRole('button', { name: 'Microphone' }).click();
    await expect(page.getByLabel('Ta réponse')).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
    expect(await smallTargets(page)).toEqual([]);
  });

  test('feuilles ouvertes (durée, langue, confirmation, effacement)', async ({ page }) => {
    await gotoReady(page, '/');
    await page.getByRole('button', { name: /Durée/ }).click();
    await expect(page.getByRole('dialog', { name: 'Durée de la conversation' })).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
    expect(await smallTargets(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Durée/ })).toBeFocused();

    await page.getByRole('button', { name: /Langue/ }).click();
    await page.getByRole('button', { name: 'Espagnol' }).click();
    await expect(page.getByRole('heading', { name: "Pratiquer l'espagnol" })).toBeVisible();

    await gotoReady(page, '/profil/confidentialite');
    await page.getByRole('button', { name: 'Effacer mes données' }).click();
    expect(await seriousViolations(page)).toEqual([]);

    await startConversationPage(page);
    await page.getByRole('button', { name: 'Terminer la conversation' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
  });
});

test('lang correct sur les contenus en langue étrangère', async ({ page }) => {
  await gotoReady(page, '/?demo=1');
  await gotoReady(page, '/diagnostic/demo-c4');
  await expect(page.locator('p[lang="en"]')).toHaveCount(2);
  await gotoReady(page, '/blocages/past_tense');
  await expect(page.locator('p[lang="en"]')).toHaveCount(2);
});

test('parcours clavier : Accueil → Recherche → Conversation → Terminer, focus visible', async ({ page }) => {
  await installFakeSpeech(page);
  await page.clock.install();
  await gotoReady(page, '/');

  async function tabTo(name: RegExp) {
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? (el.getAttribute('aria-label') ?? el.textContent ?? '').trim() : '';
      });
      if (name.test(label)) {
        const visible = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const s = getComputedStyle(el);
          return el.matches(':focus-visible') && s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2;
        });
        expect(visible, `focus visible sur « ${label} »`).toBe(true);
        return;
      }
    }
    throw new Error(`élément introuvable au clavier : ${name}`);
  }

  await tabTo(/^Rencontrer un personnage$/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/recherche$/);
  await page.clock.fastForward(3000);
  await expect(page.getByRole('link', { name: 'Démarrer la conversation' })).toBeVisible();
  await tabTo(/^Démarrer la conversation$/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/conversation$/);
  await expect(page.getByRole('button', { name: 'Microphone' })).toBeEnabled();
  await tabTo(/^Terminer la conversation$/);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Quitter' })).toBeFocused();
  // Focus piégé dans la feuille.
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Continuer' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Quitter' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/$/);
});

test('prefers-reduced-motion désactive les animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/chat', (r) => new Promise(() => void r));
  await gotoReady(page, '/recherche');
  const duration = await page.evaluate(() => {
    const dot = document.querySelector('[aria-hidden="true"] > span');
    return dot ? getComputedStyle(dot).animationDuration : '';
  });
  expect(parseFloat(duration)).toBeLessThan(0.01);
});
