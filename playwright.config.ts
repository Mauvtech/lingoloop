import { defineConfig, devices } from '@playwright/test';

// E2E_MOCK_CLIENT=1 : même suite contre un build en mock client (VITE_MOCK=1, aucun appel /api).
const MOCK_CLIENT = process.env.E2E_MOCK_CLIENT === '1';
const PORT = MOCK_CLIENT ? 4174 : 4173;
const OUT = MOCK_CLIENT ? 'dist-e2e-mock' : 'dist-e2e';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...devices['Desktop Chrome'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    hasTouch: false,
    locale: 'fr-FR',
    trace: 'off',
    // Le service worker est bloqué par défaut (page.route ne voit pas ses requêtes) ; pwa.spec.ts le réactive.
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    // Build de production servi par `vite preview` : /api/* passe par les vrais handlers en mode mock serveur
    // (aucune clé), ce qui permet aussi de simuler des pannes réseau avec page.route.
    command: `npx vite build --outDir ${OUT} --emptyOutDir && npx vite preview --outDir ${OUT} --port ${PORT} --strictPort --host 127.0.0.1`,
    env: { ANTHROPIC_API_KEY: '', VITE_MOCK: MOCK_CLIENT ? '1' : '', LINGOLOOP_RATE_LIMIT: '100000' },
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
