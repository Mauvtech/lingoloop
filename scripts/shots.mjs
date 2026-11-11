// Captures rapides pour revue manuelle (dev) : node scripts/shots.mjs <baseURL> <outDir>
import { chromium } from '@playwright/test';
const [base = 'http://127.0.0.1:4173', out = 'artifacts/tmp'] = process.argv.slice(2);
const routes = [['01-accueil', '/?demo=1'], ['05-progression', '/progression'], ['06-blocages', '/blocages'], ['07-blocage-detail', '/blocages/past_tense'], ['08-profil', '/profil'], ['04-diagnostic', '/diagnostic/demo-c4']];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
for (const [name, r] of routes) {
  await p.goto(base + r);
  await p.waitForSelector('[data-ready="true"]');
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/${name}.png` });
}
await b.close();
