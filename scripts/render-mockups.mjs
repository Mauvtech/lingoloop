// Rend chaque maquette design/maquettes/*.dc.html en PNG 390x844 dans design/reference/.
// Usage : node scripts/render-mockups.mjs
import { chromium } from 'playwright';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'design/maquettes';
const OUT = 'design/reference';
const NAMES = {
  'Main': '01-accueil', 'Recherche': '02-recherche', 'Conversation': '03-conversation',
  'Diagnostic': '04-diagnostic', 'Progression': '05-progression', 'Blocages': '06-blocages',
  'BlocageDetail': '07-blocage-detail', 'Profil': '08-profil',
};

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.dc.html'))) {
  const stem = file.replace('.dc.html', '');
  const html = readFileSync(join(SRC, file), 'utf8').replace('<script src="./support.js"></script>', '');
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, `${NAMES[stem] ?? stem}.png`) });
  console.log('ok', stem);
}
await browser.close();
