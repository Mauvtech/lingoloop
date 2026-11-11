import type { Page } from '@playwright/test';
import { installFakeSpeech, say } from './fakeSpeech';
import { expect, gotoReady, test } from './fixtures';

type FakeApi = { __fakeSpeech: { deny(): void } };

async function setup(page: Page, opts: { recognition?: boolean } = {}) {
  await installFakeSpeech(page, opts);
  await page.addInitScript(() => {
    Math.random = () => 0; // tirage déterministe : Nova, puis Milo
  });
  await page.clock.install();
}

async function startConversation(page: Page) {
  await gotoReady(page, '/recherche');
  await page.clock.fastForward(3000);
  await page.getByRole('link', { name: 'Démarrer la conversation' }).click();
  await expect(page).toHaveURL(/\/conversation$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nova');
  await expect(page.getByRole('button', { name: 'Microphone' })).toBeEnabled();
}

/** Une réplique à la voix : micro → transcription → envoi → attente de la réponse du personnage. */
async function speakTurn(page: Page, text: string) {
  const mic = page.getByRole('button', { name: 'Microphone' });
  await expect(mic).toBeEnabled();
  await mic.click();
  await expect(page.getByText("Je t'écoute…").first()).toBeVisible();
  await say(page, text);
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(mic).toBeEnabled();
}

async function typeTurn(page: Page, text: string) {
  await page.getByLabel('Ta réponse').fill(text);
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(page.getByLabel('Ta réponse')).toBeEnabled();
}

test.describe('GATE 3 — conversation vocale (mock)', () => {
  test('1. trois échanges → Terminer → diagnostic « Parler au passé » avec surlignage', async ({ page, watch }) => {
    await setup(page);
    await startConversation(page);
    await speakTurn(page, 'Hello Nova, I am fine and I am happy to talk with you.');
    await speakTurn(page, 'Yesterday I go to the museum');
    await speakTurn(page, 'I would like to see the moon and the stars one day.');
    await page.clock.fastForward(40_000);
    await page.getByRole('button', { name: 'Terminer la conversation' }).click();
    await expect(page).toHaveURL(/\/diagnostic\//);
    await expect(page.getByRole('heading', { name: 'Parler au passé' })).toBeVisible();
    const go = page.locator('p[lang="en"] span', { hasText: /^go$/ });
    const went = page.locator('p[lang="en"] span', { hasText: /^went$/ });
    await expect(go).toHaveCSS('text-decoration-style', 'wavy');
    await expect(went).toHaveCSS('font-weight', '900');
    expect(watch.consoleErrors).toEqual([]);
  });

  test('2. fin automatique quand le chrono atteint la durée choisie', async ({ page }) => {
    await setup(page);
    await startConversation(page);
    await speakTurn(page, 'I like travelling a lot with my family.');
    await page.clock.fastForward(301_000);
    await expect(page).toHaveURL(/\/diagnostic\//);
    await expect(page.getByRole('heading', { name: 'Conversation terminée' })).toBeVisible();
  });

  test('3. permission micro refusée → repli texte, la conversation se termine normalement', async ({ page }) => {
    await setup(page);
    await startConversation(page);
    await page.evaluate(() => (window as unknown as FakeApi).__fakeSpeech.deny());
    await page.getByRole('button', { name: 'Microphone' }).click();
    await expect(page.getByText("Le micro n'est pas disponible. Tu peux écrire tes réponses.")).toBeVisible();
    await typeTurn(page, 'Yesterday I go to the cinema with my sister.');
    await page.clock.fastForward(40_000);
    await page.getByRole('button', { name: 'Terminer la conversation' }).click();
    await expect(page.getByRole('heading', { name: 'Parler au passé' })).toBeVisible();
  });

  test('4. SpeechRecognition absent → repli texte', async ({ page, watch }) => {
    await setup(page, { recognition: false });
    await gotoReady(page, '/recherche');
    await page.clock.fastForward(3000);
    await page.getByRole('link', { name: 'Démarrer la conversation' }).click();
    await expect(page.getByText("Le micro n'est pas disponible. Tu peux écrire tes réponses.")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Microphone' })).toHaveCount(0);
    await typeTurn(page, 'I am a teacher and I love my job.');
    await expect(page.locator('p[lang="en"]').first()).not.toHaveText(/Hi, I'm Nova/);
    expect(watch.consoleErrors).toEqual([]);
  });

  test('5. coupure réseau pendant une réplique → message + Réessayer → la conversation continue', async ({ page }) => {
    await setup(page);
    await startConversation(page);
    await page.route('**/api/chat', (route) => route.abort('internetdisconnected'));
    await page.getByRole('button', { name: 'Microphone' }).click();
    await say(page, 'I live in a small town near the sea.');
    await page.getByRole('button', { name: 'Envoyer' }).click();
    await expect(page.getByText("La réponse n'est pas arrivée.")).toBeVisible();
    await page.unroute('**/api/chat');
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.getByText("La réponse n'est pas arrivée.")).toHaveCount(0);
    await expect(page.locator('p[lang="en"]').first()).toContainText('?');
    await expect(page.getByRole('button', { name: 'Microphone' })).toBeEnabled();
  });

  test('6. rechargement en pleine conversation → « Reprendre » sur l’Accueil → tours et chrono restaurés', async ({ page }) => {
    await setup(page);
    await startConversation(page);
    await speakTurn(page, 'My favourite place is the beach in summer.');
    const reply = await page.locator('p[lang="en"]').first().textContent();
    await page.clock.fastForward(61_000);
    await expect(page.getByText(/^01:0\d$/)).toBeVisible();
    await page.waitForTimeout(500); // laisse passer la sauvegarde périodique (10 s)
    await page.reload();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('dialog', { name: 'Reprendre ta conversation avec Nova ?' })).toBeVisible();
    await page.getByRole('button', { name: 'Reprendre' }).click();
    await expect(page).toHaveURL(/\/conversation$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nova');
    await expect(page.locator('p[lang="en"]').first()).toHaveText(reply ?? '');
    const clock = await page.locator('[class*="clockMain"]').textContent();
    expect(clock && clock >= '01:00').toBe(true);
  });

  test('7. Personnage suivant → nouveau nom, chrono conservé, une seule conversation', async ({ page }) => {
    await setup(page);
    await startConversation(page);
    await speakTurn(page, 'I would like to visit Mars one day.');
    await page.clock.fastForward(40_000);
    await page.getByRole('button', { name: 'Personnage suivant' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Milo');
    await expect(page.locator('p[lang="en"]').first()).toContainText("I'm Milo");
    const clock = (await page.locator('[class*="clockMain"]').textContent()) ?? '';
    expect(clock >= '00:40').toBe(true);
    await speakTurn(page, 'I ate pasta with tomatoes and cheese.');
    await page.getByRole('button', { name: 'Terminer la conversation' }).click();
    await expect(page.getByText(/Nova \+1 · /)).toBeVisible();
    await page.goto('/profil/historique');
    await expect(page.getByRole('listitem')).toHaveCount(1);
    await expect(page.getByRole('listitem')).toContainText('Nova, Milo');
  });

  test('8. Terminer à moins de 30 s → confirmation → Quitter → rien d’enregistré', async ({ page }) => {
    await setup(page);
    await startConversation(page);
    await page.getByRole('button', { name: 'Terminer la conversation' }).click();
    const dialog = page.getByRole('dialog', { name: "Pas assez d'échanges pour un diagnostic." });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Quitter' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/profil/historique');
    await expect(page.getByText("Aucune conversation pour l'instant.")).toBeVisible();
    await page.goto('/');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
