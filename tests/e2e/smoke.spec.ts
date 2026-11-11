import { expect, ROUTES, test } from './fixtures';

for (const route of ROUTES) {
  test(`smoke ${route}`, async ({ page, watch }) => {
    await page.goto(route);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(watch.consoleErrors, 'console.error').toEqual([]);
    expect(watch.foreignRequests, 'requêtes hors localhost').toEqual([]);
  });
}
