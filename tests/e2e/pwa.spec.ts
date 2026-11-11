import { expect, gotoReady, test } from './fixtures';

test.use({ serviceWorkers: 'allow' });

test('manifest servi et valide, icônes aux bonnes tailles', async ({ page, request }) => {
  await gotoReady(page, '/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await request.get(href ?? '');
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m).toMatchObject({
    name: 'LingoLoop',
    short_name: 'LingoLoop',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#EAF4F8',
    background_color: '#EAF4F8',
    lang: 'fr',
  });
  const icons = m.icons as { src: string; sizes: string; purpose?: string }[];
  expect(icons.map((i) => `${i.sizes}:${i.purpose ?? 'any'}`).sort()).toEqual(['192x192:any', '512x512:any', '512x512:maskable']);
  for (const icon of [...icons, { src: '/apple-touch-icon.png', sizes: '180x180' }]) {
    const r = await request.get(icon.src);
    expect(r.status(), icon.src).toBe(200);
    const size = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      return `${img.naturalWidth}x${img.naturalHeight}`;
    }, icon.src);
    expect(size).toBe(icon.sizes);
  }
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
});

test('service worker actif, contrôle la page, app lisible hors ligne', async ({ page, context, watch }) => {
  await gotoReady(page, '/?demo=1');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: "Pratiquer l'anglais" })).toBeVisible();

  await page.getByRole('link', { name: 'Progression' }).click();
  await expect(page.getByText('Conversations terminées')).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Blocages' }).click();
  await expect(page.getByText('Parler au passé')).toBeVisible();
  await page.goto('/profil/historique');
  await expect(page.getByRole('listitem')).toHaveCount(4);

  await page.goto('/');
  await page.getByRole('link', { name: 'Rencontrer un personnage' }).click();
  await expect(page.getByText('Connexion nécessaire pour parler avec un personnage')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  await context.setOffline(false);

  expect(watch.consoleErrors).toEqual([]);
});
